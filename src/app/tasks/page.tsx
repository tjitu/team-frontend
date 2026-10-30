'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { api, CurrentMember, Task, TaskListPage, TaskPriority, TaskStatus, TeamMember, isAdministrator, signInUrl } from '@/lib/api';

const STATUSES: Array<{ value: TaskStatus; label: string }> = [
  { value: 'TODO', label: 'To do' },
  { value: 'IN_PROGRESS', label: 'In progress' },
  { value: 'BLOCKED', label: 'Blocked' },
  { value: 'DONE', label: 'Done' },
];
const PRIORITIES: Array<{ value: TaskPriority; label: string }> = [
  { value: 'LOW', label: 'Low' },
  { value: 'NORMAL', label: 'Normal' },
  { value: 'HIGH', label: 'High' },
  { value: 'URGENT', label: 'Urgent' },
];

function dateInput(value: string | null) {
  return value ? new Date(value).toISOString().slice(0, 10) : '';
}

function displayDate(value: string | null) {
  return value ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(value)) : null;
}

function canEdit(task: Task, member: CurrentMember) {
  return isAdministrator(member.role) || task.createdBy.id === member.id || task.assignees.some(({ teamMember }) => teamMember.id === member.id);
}

export default function StandaloneTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [member, setMember] = useState<CurrentMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | ''>('');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | ''>('');
  const [modalTask, setModalTask] = useState<Task | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [commentBody, setCommentBody] = useState('');
  const [commentError, setCommentError] = useState('');
  const [commentSaving, setCommentSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [current, assignees] = await Promise.all([
        api.get<CurrentMember>('/team/me'),
        api.get<TeamMember[]>('/team/tasks/standalone/assignees'),
      ]);
      let cursor = '';
      let all: Task[] = [];
      let hasMore = true;
      while (hasMore) {
        const params = new URLSearchParams({ limit: '100' });
        if (cursor) params.set('cursor', cursor);
        const page = await api.get<TaskListPage>(`/team/tasks/standalone?${params.toString()}`);
        all = all.concat(page.items);
        hasMore = page.hasMore;
        cursor = page.nextCursor ?? '';
        if (!cursor) hasMore = false;
      }
      setMember(current);
      setMembers(assignees);
      setTasks(all);
      setError('');
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Could not load standalone tasks.';
      if (message === 'SESSION_EXPIRED') window.location.assign(signInUrl());
      else setError(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  useEffect(() => {
    if (!modalTask) return;
    let active = true;
    api.get<Task>(`/team/tasks/standalone/${encodeURIComponent(modalTask.id)}`).then((detail) => {
      if (active) setModalTask((current) => current?.id === detail.id ? detail : current);
    }).catch((cause) => {
      if (active) setCommentError(cause instanceof Error ? cause.message : 'Could not load task comments.');
    });
    return () => { active = false; };
  }, [modalTask?.id]);

  const filteredTasks = useMemo(() => tasks.filter((task) => {
    const searchText = `${task.title} ${task.description ?? ''} ${task.createdBy.name} ${task.assignees.map(({ teamMember }) => teamMember.name).join(' ')}`.toLocaleLowerCase();
    return (!search || searchText.includes(search.toLocaleLowerCase())) &&
      (!statusFilter || task.status === statusFilter) &&
      (!priorityFilter || task.priority === priorityFilter);
  }), [tasks, search, statusFilter, priorityFilter]);

  async function saveTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!member) return;
    setSaving(true);
    setFormError('');
    const data = new FormData(event.currentTarget);
    const canManageAssignees = !modalTask || !member || isAdministrator(member.role) || modalTask.createdBy.id === member.id;
    const payload = {
      title: String(data.get('title') ?? '').trim(),
      description: String(data.get('description') ?? '').trim() || null,
      priority: String(data.get('priority') ?? 'NORMAL') as TaskPriority,
      dueAt: data.get('dueAt') ? new Date(`${String(data.get('dueAt'))}T00:00:00.000Z`).toISOString() : null,
      ...(canManageAssignees ? { assignedMemberIds: data.getAll('assignedMemberIds').map(String) } : {}),
      ...(modalTask ? { version: modalTask.version, status: String(data.get('status') ?? modalTask.status) as TaskStatus } : {}),
    };
    try {
      if (modalTask) await api.patch(`/team/tasks/standalone/${encodeURIComponent(modalTask.id)}`, payload);
      else await api.post('/team/tasks/standalone', payload);
      setModalTask(null);
      setCreateOpen(false);
      await load();
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Could not save task.';
      if (message === 'SESSION_EXPIRED') window.location.assign(signInUrl());
      else setFormError(message);
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(task: Task, status: TaskStatus) {
    if (!member || !canEdit(task, member)) return;
    try {
      const updated = await api.patch<Task>(`/team/tasks/standalone/${encodeURIComponent(task.id)}`, { version: task.version, status });
      setTasks((current) => current.map((item) => item.id === updated.id ? updated : item));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not update task status.');
    }
  }

  async function archiveTask() {
    if (!modalTask) return;
    setSaving(true);
    setFormError('');
    try {
      await api.post(`/team/tasks/standalone/${encodeURIComponent(modalTask.id)}/archive`, { version: modalTask.version });
      setModalTask(null);
      await load();
    } catch (cause) {
      setFormError(cause instanceof Error ? cause.message : 'Could not archive task.');
    } finally {
      setSaving(false);
    }
  }

  async function addComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!modalTask || !commentBody.trim()) return;
    setCommentSaving(true);
    setCommentError('');
    try {
      const comment = await api.post<NonNullable<Task['comments']>[number]>(`/team/tasks/standalone/${encodeURIComponent(modalTask.id)}/comments`, { body: commentBody.trim() });
      setCommentBody('');
      setModalTask((current) => current?.id === modalTask.id ? {
        ...current,
        comments: [comment, ...(current.comments ?? [])].slice(0, 50),
        _count: { comments: (current._count?.comments ?? 0) + 1 },
      } : current);
      setTasks((current) => current.map((task) => task.id === modalTask.id ? { ...task, _count: { comments: (task._count?.comments ?? 0) + 1 } } : task));
    } catch (cause) {
      setCommentError(cause instanceof Error ? cause.message : 'Could not add comment.');
    } finally {
      setCommentSaving(false);
    }
  }

  const modalOpen = createOpen || Boolean(modalTask);

  return (
    <div className="page-content standalone-tasks-page">
      <div className="page-heading">
        <div><p className="page-eyebrow">Workspace</p><h1>Tasks</h1><p className="page-subtitle">Track quick fixes and team work that does not belong to a project.</p></div>
        {member && <button className="button button-primary" type="button" onClick={() => { setFormError(''); setCreateOpen(true); }}><span className="button-symbol" aria-hidden="true">+</span>New task</button>}
      </div>

      {error && <div className="inline-message error" role="alert">{error}<button className="button button-quiet" onClick={() => void load()}>Reload</button></div>}

      <div className="standalone-toolbar">
        <label className="standalone-search"><span className="sr-only">Search tasks</span><input className="search-input" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search standalone tasks…" /></label>
        <label><span className="sr-only">Filter by status</span><select className="filter-select" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as TaskStatus | '')}><option value="">All statuses</option>{STATUSES.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label><span className="sr-only">Filter by priority</span><select className="filter-select" value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value as TaskPriority | '')}><option value="">All priorities</option>{PRIORITIES.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}</select></label>
        <span className="section-count">{filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'}</span>
      </div>

      {loading ? <div className="loading-skeleton standalone-loading" aria-label="Loading tasks" /> : filteredTasks.length ? (
        <div className="task-board standalone-task-board">
          {STATUSES.map(({ value, label }) => {
            const column = filteredTasks.filter((task) => task.status === value);
            return <section className="task-board-column" key={value}>
              <div className="task-board-column-heading"><h2>{label}</h2><span>{column.length}</span></div>
              <div className="task-board-column-content">
                {column.map((task) => <article className="task-board-card standalone-task-card" key={task.id}>
                  <button className="task-board-title" type="button" onClick={() => { setFormError(''); setCreateOpen(false); setModalTask(task); }}>{task.title}</button>
                  {task.description && <p className="standalone-task-description">{task.description}</p>}
                  <div className="task-board-card-meta"><span className={`priority-badge priority-${task.priority.toLowerCase()}`}>{PRIORITIES.find((item) => item.value === task.priority)?.label}</span><span className="task-board-comments">{task._count?.comments ?? 0} comments</span></div>
                  {task.dueAt && <time className="task-board-due" dateTime={task.dueAt}>Due {displayDate(task.dueAt)}</time>}
                  <div className="task-board-card-footer">
                    <span className="standalone-task-people" title={`Created by ${task.createdBy.name}`}>{task.assignees.length ? task.assignees.map(({ teamMember }) => teamMember.name).join(', ') : `Created by ${task.createdBy.name}`}</span>
                    <label className="standalone-status-select"><span className="sr-only">Task status</span><select value={task.status} disabled={!member || !canEdit(task, member)} onChange={(event) => void changeStatus(task, event.target.value as TaskStatus)}>{STATUSES.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}</select></label>
                  </div>
                </article>)}
                {!column.length && <p className="task-board-empty">No tasks</p>}
              </div>
            </section>;
          })}
        </div>
      ) : (
        <section className="empty-state"><div><div className="empty-state-icon" aria-hidden="true">□</div><h2>{tasks.length ? 'No tasks match these filters' : 'No standalone tasks yet'}</h2><p>{tasks.length ? 'Try changing your search or filters.' : 'Create a task for a quick fix or piece of work outside a project.'}</p>{tasks.length ? <button className="button button-secondary" onClick={() => { setSearch(''); setStatusFilter(''); setPriorityFilter(''); }}>Clear filters</button> : member && <button className="button button-primary" onClick={() => setCreateOpen(true)}>Create your first task</button>}</div></section>
      )}

      {modalOpen && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) { setModalTask(null); setCreateOpen(false); } }}>
        <section className="modal standalone-task-modal" role="dialog" aria-modal="true" aria-labelledby="standalone-task-modal-title">
          <div className="modal-header"><div><h2 id="standalone-task-modal-title">{modalTask ? 'Edit standalone task' : 'Create standalone task'}</h2><p>This task will be available to your active team.</p></div><button className="icon-button" type="button" aria-label="Close" disabled={saving} onClick={() => { setModalTask(null); setCreateOpen(false); }}>×</button></div>
          <form className="form-stack" onSubmit={(event) => void saveTask(event)}>
            {formError && <p className="form-error" role="alert">{formError}</p>}
            <label className="field-label">Task title<input className="field-input" name="title" minLength={2} maxLength={180} required autoFocus disabled={Boolean(modalTask && member && !canEdit(modalTask, member))} defaultValue={modalTask?.title ?? ''} placeholder="e.g. Fix mobile navigation spacing" /></label>
            <label className="field-label">Description <span className="subtle-link">Optional</span><textarea className="field-textarea" name="description" maxLength={10000} disabled={Boolean(modalTask && member && !canEdit(modalTask, member))} defaultValue={modalTask?.description ?? ''} placeholder="Add context or acceptance notes" /></label>
            <div className="standalone-form-grid">
              <label className="field-label">Priority<select className="filter-select" name="priority" disabled={Boolean(modalTask && member && !canEdit(modalTask, member))} defaultValue={modalTask?.priority ?? 'NORMAL'}>{PRIORITIES.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}</select></label>
              {modalTask && <label className="field-label">Status<select className="filter-select" name="status" disabled={Boolean(member && !canEdit(modalTask, member))} defaultValue={modalTask.status}>{STATUSES.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}</select></label>}
            </div>
            <div className="standalone-form-grid">
              <label className="field-label">Due date<input className="field-input" name="dueAt" type="date" disabled={Boolean(modalTask && member && !canEdit(modalTask, member))} defaultValue={dateInput(modalTask?.dueAt ?? null)} /></label>
              <label className="field-label">Assignees<select className="filter-select standalone-assignee-select" name="assignedMemberIds" multiple disabled={Boolean(modalTask && member && !isAdministrator(member.role) && modalTask.createdBy.id !== member.id)} defaultValue={modalTask?.assignees.map(({ teamMember }) => teamMember.id) ?? []} aria-describedby="standalone-assignee-help">{members.map((teamMember) => <option key={teamMember.id} value={teamMember.id}>{teamMember.name} · {teamMember.email}</option>)}</select><small id="standalone-assignee-help" className="field-hint">{modalTask && member && !isAdministrator(member.role) && modalTask.createdBy.id !== member.id ? 'Only the creator can change assignees.' : 'Use Ctrl or Cmd to select more than one person.'}</small></label>
            </div>
            <div className="form-footer form-footer-between">
              {modalTask && member && (isAdministrator(member.role) || modalTask.createdBy.id === member.id) ? <button className="button button-quiet standalone-archive-button" type="button" disabled={saving} onClick={() => void archiveTask()}>Archive task</button> : <span />}
              <div><button className="button button-secondary" type="button" disabled={saving} onClick={() => { setModalTask(null); setCreateOpen(false); }}>Cancel</button><button className="button button-primary" disabled={saving || Boolean(modalTask && member && !canEdit(modalTask, member))}>{saving ? 'Saving…' : modalTask ? 'Save changes' : 'Create task'}</button></div>
            </div>
          </form>
          {modalTask && <section className="standalone-comments" aria-labelledby="standalone-comments-title">
            <h3 id="standalone-comments-title">Comments <span>{modalTask._count?.comments ?? modalTask.comments?.length ?? 0}</span></h3>
            {commentError && <p className="form-error" role="alert">{commentError}</p>}
            <form className="standalone-comment-form" onSubmit={(event) => void addComment(event)}>
              <label className="sr-only" htmlFor="standalone-comment-input">Write a comment</label>
              <textarea id="standalone-comment-input" className="field-textarea" value={commentBody} onChange={(event) => setCommentBody(event.target.value)} maxLength={5000} placeholder="Write a comment…" />
              <button className="button button-secondary" disabled={commentSaving || !commentBody.trim()}>{commentSaving ? 'Posting…' : 'Post comment'}</button>
            </form>
            <div className="standalone-comment-list">{(modalTask.comments ?? []).map((comment) => <article className="standalone-comment" key={comment.id}>
              <div><strong>{comment.author.name}</strong><time dateTime={comment.createdAt}>{displayDate(comment.createdAt)}</time></div><p>{comment.body}</p>
            </article>)}{!modalTask.comments?.length && <p className="field-hint">No comments yet.</p>}</div>
          </section>}
        </section>
      </div>}
    </div>
  );
}
