'use client';

import { CSSProperties, FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { AssigneePicker } from '@/components/assignee-picker';
import { TaskTimeline } from '@/components/task-timeline';
import { api, CurrentMember, Department, isAdministrator, Project, ProjectRole, signInUrl, Task, TaskListPage, TaskPriority, TaskStatus } from '@/lib/api';

const statuses: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'BLOCKED', 'DONE'];
const priorities: TaskPriority[] = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];
const statusLabels: Record<TaskStatus, string> = { TODO: 'To do', IN_PROGRESS: 'In progress', BLOCKED: 'Blocked', DONE: 'Done' };
const priorityLabels: Record<TaskPriority, string> = { LOW: 'Low', NORMAL: 'Normal', HIGH: 'High', URGENT: 'Urgent' };
const roleLabels: Record<ProjectRole, string> = { PROJECT_MANAGER: 'Project Manager', MEMBER: 'Member', VIEWER: 'Viewer' };
type TaskView = 'board' | 'list' | 'timeline';

function dateLabel(value?: string | null) {
  if (!value) return 'Not set';
  return new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(value));
}

function dateInputValue(value?: string | null) {
  return value ? value.slice(0, 10) : '';
}

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('');
}

function TaskStatusPicker({ task, disabled, onChange, fullWidth = false }: { task: Task; disabled: boolean; onChange: (status: TaskStatus) => void; fullWidth?: boolean }) {
  const [open, setOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<CSSProperties | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const updatePosition = useCallback(() => {
    const bounds = triggerRef.current?.getBoundingClientRect();
    if (!bounds) return;
    const width = Math.min(fullWidth ? bounds.width : 190, window.innerWidth - 16);
    const left = Math.max(8, Math.min(bounds.right - width, window.innerWidth - width - 8));
    const top = bounds.bottom + 7;
    setMenuPosition({ position: 'fixed', top, left, width, maxHeight: Math.max(80, window.innerHeight - top - 8) });
  }, [fullWidth]);

  useEffect(() => {
    if (!open) return;
    updatePosition();
    const focusFrame = window.requestAnimationFrame(() => optionRefs.current[statuses.indexOf(task.status)]?.focus());
    function dismiss(event: PointerEvent) {
      if (event.target instanceof Node && !pickerRef.current?.contains(event.target) && !menuRef.current?.contains(event.target)) setOpen(false);
    }
    function escape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener('pointerdown', dismiss);
    document.addEventListener('keydown', escape);
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener('pointerdown', dismiss);
      document.removeEventListener('keydown', escape);
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [open, task.status, updatePosition]);

  function showMenu() {
    if (disabled) return;
    updatePosition();
    setOpen(true);
  }

  function navigateOptions(event: React.KeyboardEvent<HTMLDivElement>) {
    const keyMoves: Record<string, number> = { ArrowDown: 1, ArrowUp: -1 };
    if (event.key in keyMoves || event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      const currentIndex = optionRefs.current.indexOf(document.activeElement as HTMLButtonElement);
      const nextIndex = event.key === 'Home' ? 0
        : event.key === 'End' ? statuses.length - 1
          : (currentIndex + keyMoves[event.key] + statuses.length) % statuses.length;
      optionRefs.current[nextIndex]?.focus();
    }
  }

  return (
    <div className={`task-status-picker ${fullWidth ? 'is-full-width' : ''}`} ref={pickerRef}>
      <button ref={triggerRef} className={`task-status-trigger status-${task.status}`} type="button" aria-label={`Status ${task.title}: ${statusLabels[task.status]}`} aria-haspopup="menu" aria-expanded={open} disabled={disabled} onClick={() => open ? setOpen(false) : showMenu()} onKeyDown={(event) => { if (event.key === 'ArrowDown' && !open) { event.preventDefault(); showMenu(); } }}>
        <span>{statusLabels[task.status]}</span>
        <svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m4 6 4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
      {open && menuPosition && createPortal(<div ref={menuRef} className="task-status-menu" style={menuPosition} role="menu" aria-label={`Change status for ${task.title}`} onKeyDown={navigateOptions}>
        {statuses.map((status, index) => <button ref={(element) => { optionRefs.current[index] = element; }} className={`task-status-option status-${status} ${task.status === status ? 'is-current' : ''}`} key={status} type="button" role="menuitemradio" aria-checked={task.status === status} onClick={() => { setOpen(false); onChange(status); }}>
          <span>{statusLabels[status]}</span>{task.status === status && <span className="task-status-check" aria-hidden="true">✓</span>}
        </button>)}
      </div>, document.body)}
    </div>
  );
}

export default function ProjectPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const taskView: TaskView = searchParams.get('view') === 'list' || searchParams.get('view') === 'timeline' ? searchParams.get('view') as TaskView : 'board';
  const [project, setProject] = useState<Project | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [member, setMember] = useState<CurrentMember | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [timelineMonth, setTimelineMonth] = useState(() => {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  });
  const [hasMoreTasks, setHasMoreTasks] = useState(false);
  const [nextTaskCursor, setNextTaskCursor] = useState<string | null>(null);
  const [loadingMoreTasks, setLoadingMoreTasks] = useState(false);
  const taskRequestVersion = useRef(0);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('');
  const [filterCreator, setFilterCreator] = useState('');
  const [filterDueFrom, setFilterDueFrom] = useState('');
  const [filterDueTo, setFilterDueTo] = useState('');
  const [query, setQuery] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editTaskOpen, setEditTaskOpen] = useState(false);
  const [editProjectOpen, setEditProjectOpen] = useState(false);
  const [manageMembersOpen, setManageMembersOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [projectSaving, setProjectSaving] = useState(false);
  const [projectError, setProjectError] = useState('');
  const [formError, setFormError] = useState('');
  const [taskFormError, setTaskFormError] = useState('');
  const [membershipError, setMembershipError] = useState('');
  const [membershipNotice, setMembershipNotice] = useState('');
  const [membershipBusy, setMembershipBusy] = useState('');
  const [detailError, setDetailError] = useState('');
  const [comment, setComment] = useState('');

  const projectRole = useMemo(() => project?.members?.find(({ teamMember }) => teamMember.id === member?.id)?.role, [project, member]);
  const canManage = isAdministrator(member?.role) || projectRole === 'PROJECT_MANAGER';
  const canWrite = canManage || (projectRole !== 'VIEWER' && projectRole !== undefined);
  const activeProjectManagerCount = project?.members?.filter(({ role }) => role === 'PROJECT_MANAGER').length ?? 0;
  const hasActiveFilters = Boolean(appliedQuery || filterStatus || filterPriority || filterAssignee || filterCreator || filterDueFrom || filterDueTo);
  const taskFilters = useMemo(() => {
    const search = new URLSearchParams();
    if (filterStatus) search.set('status', filterStatus);
    if (filterPriority) search.set('priority', filterPriority);
    if (filterAssignee) search.set('assigneeId', filterAssignee);
    if (filterCreator) search.set('creatorId', filterCreator);
    if (filterDueFrom) search.set('dueFrom', filterDueFrom);
    if (filterDueTo) search.set('dueTo', filterDueTo);
    if (appliedQuery.trim()) search.set('q', appliedQuery.trim());
    return search;
  }, [filterStatus, filterPriority, filterAssignee, filterCreator, filterDueFrom, filterDueTo, appliedQuery]);

  function taskViewHref(view: TaskView) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('view', view);
    return `/projects/${encodeURIComponent(projectId)}?${params.toString()}`;
  }

  const load = useCallback(async (keepSelected = true) => {
    const requestVersion = ++taskRequestVersion.current;
    setLoading(true);
    setLoadingMoreTasks(false);
    try {
      const search = new URLSearchParams(taskFilters);
      search.set('limit', '100');
      const suffix = search.size ? `?${search.toString()}` : '';
      const [projectData, taskPage, currentMember, departmentList] = await Promise.all([
        api.get<Project>(`/team/projects/${encodeURIComponent(projectId)}`),
        api.get<TaskListPage>(`/team/projects/${encodeURIComponent(projectId)}/tasks${suffix}`),
        api.get<CurrentMember>('/team/me'),
        api.get<Department[]>('/team/departments'),
      ]);
      if (requestVersion !== taskRequestVersion.current) return;
      setProject(projectData);
      setTasks(taskPage.items);
      setHasMoreTasks(taskPage.hasMore);
      setNextTaskCursor(taskPage.nextCursor);
      setMember(currentMember);
      setDepartments(departmentList.filter((department) => department.isActive || department.id === projectData.departmentId));
      setError('');
      if (keepSelected && selectedTask) {
        const fresh = taskPage.items.find(({ id }) => id === selectedTask.id);
        if (fresh) await openTask(fresh.id, projectId, (task) => setSelectedTask(task));
        else setSelectedTask(null);
      }
    } catch (cause) {
      if (requestVersion !== taskRequestVersion.current) return;
      const message = cause instanceof Error ? cause.message : 'Could not load the project.';
      if (message === 'SESSION_EXPIRED') window.location.assign(signInUrl());
      else setError(message);
    } finally {
      if (requestVersion === taskRequestVersion.current) setLoading(false);
    }
  }, [projectId, taskFilters]);

  useEffect(() => { void load(false); }, [load]);

  useEffect(() => {
    if (!selectedTask) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape' && !createOpen && !editTaskOpen && !editProjectOpen && !manageMembersOpen) setSelectedTask(null);
    }
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [selectedTask?.id, createOpen, editTaskOpen, editProjectOpen, manageMembersOpen]);

  async function loadMoreTasks() {
    if (!nextTaskCursor || loadingMoreTasks) return;
    const requestVersion = taskRequestVersion.current;
    setLoadingMoreTasks(true);
    try {
      const search = new URLSearchParams(taskFilters);
      search.set('limit', '100');
      search.set('cursor', nextTaskCursor);
      const page = await api.get<TaskListPage>(`/team/projects/${encodeURIComponent(projectId)}/tasks?${search.toString()}`);
      if (requestVersion !== taskRequestVersion.current) return;
      setTasks((current) => [...current, ...page.items]);
      setHasMoreTasks(page.hasMore);
      setNextTaskCursor(page.nextCursor);
    } catch (cause) {
      if (requestVersion !== taskRequestVersion.current) return;
      const message = cause instanceof Error ? cause.message : 'Could not load the next tasks.';
      if (message === 'SESSION_EXPIRED') window.location.assign(signInUrl());
      else setError(message);
    } finally {
      if (requestVersion === taskRequestVersion.current) setLoadingMoreTasks(false);
    }
  }

  async function openTask(taskId: string, id = projectId, setTask: (task: Task) => void = setSelectedTask) {
    setDetailError('');
    try {
      const task = await api.get<Task>(`/team/projects/${encodeURIComponent(id)}/tasks/${encodeURIComponent(taskId)}`);
      setTask(task);
    } catch (cause) {
      setDetailError(cause instanceof Error ? cause.message : 'Could not load task details.');
    }
  }

  async function createTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setFormError('');
    const data = new FormData(event.currentTarget);
    const assigneeIds = data.getAll('assigneeIds').map(String);
    try {
      await api.post<Task>(`/team/projects/${encodeURIComponent(projectId)}/tasks`, {
        title: String(data.get('title') ?? '').trim(),
        description: String(data.get('description') ?? '').trim(),
        priority: String(data.get('priority') ?? 'NORMAL'),
        dueAt: data.get('dueAt') ? new Date(`${String(data.get('dueAt'))}T23:59:00`).toISOString() : undefined,
        assignedMemberIds: assigneeIds,
      });
      setCreateOpen(false);
      await load(false);
    } catch (cause) {
      setFormError(cause instanceof Error ? cause.message : 'Could not create the task.');
    } finally {
      setSaving(false);
    }
  }

  async function updateProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!project) return;
    setProjectSaving(true);
    setProjectError('');
    const data = new FormData(event.currentTarget);
    const name = String(data.get('name') ?? '').trim();
    const description = String(data.get('description') ?? '').trim();
    const startsAtValue = String(data.get('startsAt') ?? '');
    const endsAtValue = String(data.get('endsAt') ?? '');
    try {
      await api.patch<Project>(`/team/projects/${encodeURIComponent(projectId)}`, {
        name,
        description,
        departmentId: String(data.get('departmentId') ?? ''),
        startsAt: startsAtValue ? new Date(`${startsAtValue}T00:00:00.000Z`).toISOString() : null,
        endsAt: endsAtValue ? new Date(`${endsAtValue}T00:00:00.000Z`).toISOString() : null,
      });
      setEditProjectOpen(false);
      await load(false);
    } catch (cause) {
      setProjectError(cause instanceof Error ? cause.message : 'Could not update the project.');
    } finally {
      setProjectSaving(false);
    }
  }

  async function archiveProject() {
    if (!project || !window.confirm(`Archive project ${project.name}? It will be removed from the active project list.`)) return;
    setProjectSaving(true);
    setProjectError('');
    try {
      await api.post(`/team/projects/${encodeURIComponent(projectId)}/archive`);
      window.location.assign('/');
    } catch (cause) {
      setProjectError(cause instanceof Error ? cause.message : 'Could not archive the project.');
      setProjectSaving(false);
    }
  }

  async function addProjectMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMembershipError('');
    setMembershipNotice('');
    const data = new FormData(event.currentTarget);
    const email = String(data.get('email') ?? '').trim();
    const role = String(data.get('role') ?? 'MEMBER') as ProjectRole;
    if (member?.email && email.toLowerCase() === member.email.toLowerCase()) {
      setMembershipError('You cannot add yourself to a project or change your own project role.');
      setSaving(false);
      return;
    }
    try {
      await api.post(`/team/projects/${encodeURIComponent(projectId)}/members`, { email, role });
      setMembershipNotice(`${email} was added to the project as a ${roleLabels[role]}.`);
      await load(false);
    } catch (cause) {
      setMembershipError(cause instanceof Error ? cause.message : 'Could not add the member.');
    } finally {
      setSaving(false);
    }
  }

  async function updateProjectMemberRole(teamMemberId: string, role: ProjectRole) {
    setMembershipBusy(teamMemberId);
    setMembershipError('');
    setMembershipNotice('');
    try {
      await api.patch(`/team/projects/${encodeURIComponent(projectId)}/members/${encodeURIComponent(teamMemberId)}/role`, { role });
      setMembershipNotice(`The member's role was updated to ${roleLabels[role]}.`);
      await load(false);
    } catch (cause) {
      setMembershipError(cause instanceof Error ? cause.message : 'Could not update the member role.');
    } finally {
      setMembershipBusy('');
    }
  }

  async function removeProjectMember(teamMemberId: string, name: string) {
    if (!window.confirm(`Remove ${name} from this project?`)) return;
    setMembershipBusy(teamMemberId);
    setMembershipError('');
    setMembershipNotice('');
    try {
      await api.delete(`/team/projects/${encodeURIComponent(projectId)}/members/${encodeURIComponent(teamMemberId)}`);
      setMembershipNotice(`${name} was removed from the project.`);
      await load(false);
    } catch (cause) {
      setMembershipError(cause instanceof Error ? cause.message : 'Could not remove the member.');
    } finally {
      setMembershipBusy('');
    }
  }

  async function updateStatus(status: TaskStatus) {
    if (!selectedTask) return;
    await changeTaskStatus(selectedTask, status);
  }

  async function changeTaskStatus(task: Task, status: TaskStatus) {
    setSaving(true);
    setDetailError('');
    try {
      const updated = await api.patch<Task>(`/team/projects/${encodeURIComponent(projectId)}/tasks/${encodeURIComponent(task.id)}`, { version: task.version, status });
      setTasks((current) => current.flatMap((item) => item.id !== updated.id ? [item] : filterStatus && updated.status !== filterStatus ? [] : [{ ...item, ...updated }]));
      if (selectedTask?.id === updated.id) setSelectedTask({ ...selectedTask, ...updated });
      if (selectedTask?.id === updated.id) await openTask(updated.id);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Could not update task status.';
      if (selectedTask?.id === task.id) setDetailError(message);
      else setError(message);
    } finally {
      setSaving(false);
    }
  }

  async function updateTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedTask) return;
    setSaving(true);
    setTaskFormError('');
    const data = new FormData(event.currentTarget);
    const dueAt = String(data.get('dueAt') ?? '');
    const body = {
      version: selectedTask.version,
      title: String(data.get('title') ?? '').trim(),
      description: String(data.get('description') ?? '').trim(),
      priority: String(data.get('priority') ?? selectedTask.priority),
      dueAt: dueAt ? new Date(`${dueAt}T23:59:00`).toISOString() : null,
      ...(canManage ? { assignedMemberIds: data.getAll('assigneeIds').map(String) } : {}),
    };
    try {
      await api.patch<Task>(`/team/projects/${encodeURIComponent(projectId)}/tasks/${encodeURIComponent(selectedTask.id)}`, body);
      setEditTaskOpen(false);
      await load(false);
      await openTask(selectedTask.id);
    } catch (cause) {
      setTaskFormError(cause instanceof Error ? cause.message : 'Could not update the task.');
    } finally {
      setSaving(false);
    }
  }

  async function archiveTask() {
    if (!selectedTask || !window.confirm(`Archive task ${selectedTask.title}?`)) return;
    setSaving(true);
    setDetailError('');
    try {
      await api.post(`/team/projects/${encodeURIComponent(projectId)}/tasks/${encodeURIComponent(selectedTask.id)}/archive`, { version: selectedTask.version });
      setSelectedTask(null);
      await load(false);
    } catch (cause) {
      setDetailError(cause instanceof Error ? cause.message : 'Could not archive the task.');
    } finally {
      setSaving(false);
    }
  }

  async function addComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedTask || !comment.trim()) return;
    setSaving(true);
    setDetailError('');
    try {
      await api.post(`/team/projects/${encodeURIComponent(projectId)}/tasks/${encodeURIComponent(selectedTask.id)}/comments`, { body: comment.trim() });
      setComment('');
      await openTask(selectedTask.id);
      await load(false);
    } catch (cause) {
      setDetailError(cause instanceof Error ? cause.message : 'Could not save the comment.');
    } finally {
      setSaving(false);
    }
  }

  const filteredCount = tasks.length;

  return (
    <div className="page-content">
      <div className="page-heading">
        <div>
          <h1>{project?.name ?? (loading ? 'Loading project…' : 'Project')}</h1>
          <p className="page-subtitle">{project?.description || 'Organize work and track project task progress.'}</p>
          {project && <p className="project-meta-line">{project.department.name}, owner: {project.createdBy.name}, period: {dateLabel(project.startsAt)} to {dateLabel(project.endsAt)}</p>}
        </div>
        <div className="page-heading-actions">{canManage && <><button className="button button-secondary" onClick={() => { setProjectError(''); setEditProjectOpen(true); }}>Edit project</button><button className="button button-quiet danger-action" disabled={projectSaving} onClick={() => void archiveProject()}>Archive</button></>}{canWrite && <button className="button button-primary" onClick={() => { setFormError(''); setCreateOpen(true); }}><span className="button-symbol" aria-hidden="true">+</span>New task</button>}</div>
      </div>

      {projectError && !editProjectOpen && <div className="inline-message error" role="alert">{projectError}</div>}
      <div className="project-workspace-nav">
        <div className="project-view-tabs" aria-label="Task view">
          <Link className={`project-view-tab ${taskView === 'board' ? 'is-active' : ''}`} href={taskViewHref('board')} aria-current={taskView === 'board' ? 'page' : undefined} scroll={false}>Board</Link>
          <Link className={`project-view-tab ${taskView === 'list' ? 'is-active' : ''}`} href={taskViewHref('list')} aria-current={taskView === 'list' ? 'page' : undefined} scroll={false}>List</Link>
          <Link className={`project-view-tab ${taskView === 'timeline' ? 'is-active' : ''}`} href={taskViewHref('timeline')} aria-current={taskView === 'timeline' ? 'page' : undefined} scroll={false}>Timeline</Link>
        </div>
        <div className="project-context-actions">
          {project && <span className="project-member-summary"><span className="mini-people-icon" aria-hidden="true" />{project.members?.length ?? 0} {project.members?.length === 1 ? 'member' : 'members'}</span>}
          {canManage && <button className="button button-secondary compact-button" onClick={() => { setMembershipError(''); setMembershipNotice(''); setManageMembersOpen(true); }}>Manage members</button>}
          <Link className="project-activity-link" href={`/projects/${encodeURIComponent(projectId)}/activity`}>View activity</Link>
        </div>
      </div>
      {project && project.members && project.members.length > 0 && <div className="project-member-strip" aria-label="Project members">
        {project.members.slice(0, 5).map(({ id, role, teamMember }) => <span className="member-chip" key={id} title={`${teamMember.email} · ${roleLabels[role]}`}><span className="avatar">{initials(teamMember.name)}</span>{teamMember.name}<span className="sr-only">, {roleLabels[role]}</span></span>)}
        {project.members.length > 5 && <span className="member-overflow">+{project.members.length - 5} more</span>}
      </div>}

      {error && <div className="inline-message error" role="alert">{error}<button className="button button-quiet" onClick={() => void load(false)}>Reload</button></div>}
      {detailError && !selectedTask && <div className="inline-message error" role="alert">{detailError}</div>}

      <div className="section-heading section-spacer task-section-heading"><div><h2>{taskView === 'board' ? 'Task board' : taskView === 'timeline' ? 'Project timeline' : 'Task list'}</h2><p>{taskView === 'board' ? 'Move work by changing the status on a task card.' : taskView === 'timeline' ? 'See each task from its creation date through its due date.' : 'Manage task status, priority, assignees, and due dates.'}</p></div><span className="task-count">{filteredCount} shown</span></div>
      <div className="task-layout">
        <div>
          <form className="task-toolbar" onSubmit={(event) => { event.preventDefault(); setAppliedQuery(query); }}>
            <input className="search-input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search task…" aria-label="Search task" />
            <div className="toolbar-filters">
              <label><span className="sr-only">Filter by status</span><select className="filter-select" value={filterStatus} onChange={(event) => setFilterStatus(event.target.value)}><option value="">All statuses</option>{statuses.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}</select></label>
              <label><span className="sr-only">Filter by priority</span><select className="filter-select" value={filterPriority} onChange={(event) => setFilterPriority(event.target.value)}><option value="">All priorities</option>{priorities.map((priority) => <option key={priority} value={priority}>{priorityLabels[priority]}</option>)}</select></label>
              <label><span className="sr-only">Filter assignee</span><select className="filter-select" value={filterAssignee} onChange={(event) => setFilterAssignee(event.target.value)}><option value="">All assignees</option>{project?.members?.map(({ teamMember }) => <option key={teamMember.id} value={teamMember.id}>{teamMember.name}</option>)}</select></label>
              <label><span className="sr-only">Filter by creator</span><select className="filter-select" value={filterCreator} onChange={(event) => setFilterCreator(event.target.value)}><option value="">All creators</option>{project?.members?.map(({ teamMember }) => <option key={teamMember.id} value={teamMember.id}>{teamMember.name}</option>)}</select></label>
              <button className="button button-secondary" type="submit">Search</button>
              {hasActiveFilters && <button className="button button-quiet" type="button" onClick={() => { setQuery(''); setAppliedQuery(''); setFilterStatus(''); setFilterPriority(''); setFilterAssignee(''); setFilterCreator(''); setFilterDueFrom(''); setFilterDueTo(''); }}>Reset</button>}
            </div>
            <div className="task-date-filters">
              <label className="field-label">Due date from<input className="field-input" type="date" value={filterDueFrom} max={filterDueTo || undefined} onChange={(event) => setFilterDueFrom(event.target.value)} /></label>
              <label className="field-label">Due date to<input className="field-input" type="date" value={filterDueTo} min={filterDueFrom || undefined} onChange={(event) => setFilterDueTo(event.target.value)} /></label>
            </div>
          </form>
          {loading ? <div className="loading-skeleton" aria-label="Loading task" /> : tasks.length && taskView === 'list' ? (
            <div className="task-table-wrap">
              <table className="task-table">
                <thead><tr><th>Task</th><th>Status</th><th>Priority</th><th>Assignee</th><th>Due date</th></tr></thead>
                <tbody>{tasks.map((task) => <tr className={selectedTask?.id === task.id ? 'is-selected' : ''} key={task.id}>
                  <td><button className="task-title-button" onClick={() => void openTask(task.id)}>{task.title}</button><div className="task-subtitle">{task._count?.comments ?? 0} comments · updated {dateLabel(task.updatedAt)}</div></td>
                  <td><span className={`status-badge status-${task.status}`}>{statusLabels[task.status]}</span></td>
                  <td><span className={`priority-badge priority-${task.priority}`}>{priorityLabels[task.priority]}</span></td>
                  <td><div className="assignee-stack" aria-label={task.assignees.map(({ teamMember }) => teamMember.name).join(', ') || 'Unassigned'}>{task.assignees.length ? task.assignees.slice(0, 3).map(({ teamMember }) => <span className="avatar" key={teamMember.id} title={teamMember.name}>{initials(teamMember.name)}</span>) : <span className="assignee-empty">None</span>}{task.assignees.length > 3 && <span className="avatar">+{task.assignees.length - 3}</span>}</div></td>
                  <td className="due-date">{dateLabel(task.dueAt)}</td>
                </tr>)}</tbody>
              </table>
            </div>
          ) : loading ? null : taskView === 'timeline' ? (
            <TaskTimeline tasks={tasks} label="Project task timeline" month={timelineMonth} onMonthChange={setTimelineMonth} onSelectTask={(task) => void openTask(task.id)} />
          ) : tasks.length && taskView === 'board' ? (
            <div className="task-board" aria-label="Task board">
              {statuses.map((status) => {
                const columnTasks = tasks.filter((task) => task.status === status);
                return <section className={`task-board-column column-${status}`} key={status} aria-labelledby={`column-${status}`}>
                  <header className="task-board-column-heading"><h3 id={`column-${status}`}>{statusLabels[status]}</h3><span>{columnTasks.length}</span></header>
                  <div className="task-board-column-content">
                    {columnTasks.map((task) => <article className={`task-board-card ${selectedTask?.id === task.id ? 'is-selected' : ''}`} key={task.id}>
                      <button className="task-board-title" type="button" onClick={() => void openTask(task.id)}>{task.title}</button>
                      <div className="task-board-card-meta"><span className={`priority-badge priority-${task.priority}`}>{priorityLabels[task.priority]}</span><span className="task-board-comments">{task._count?.comments ?? 0} comments</span></div>
                      {task.dueAt && <time className="task-board-due" dateTime={task.dueAt}>Due {dateLabel(task.dueAt)}</time>}
                      <footer className="task-board-card-footer">
                        <div className="assignee-stack" aria-label={task.assignees.map(({ teamMember }) => teamMember.name).join(', ') || 'Unassigned'}>{task.assignees.length ? task.assignees.slice(0, 2).map(({ teamMember }) => <span className="avatar" key={teamMember.id} title={teamMember.name}>{initials(teamMember.name)}</span>) : <span className="assignee-empty">Unassigned</span>}{task.assignees.length > 2 && <span className="avatar">+{task.assignees.length - 2}</span>}</div>
                        <TaskStatusPicker task={task} disabled={!canWrite || saving} onChange={(status) => void changeTaskStatus(task, status)} />
                      </footer>
                    </article>)}
                    {!columnTasks.length && <p className="task-board-empty">No tasks</p>}
                  </div>
                </section>;
              })}
            </div>
          ) : (
            <section className="empty-state"><div><div className="empty-state-icon" aria-hidden="true">□</div><h3>{hasActiveFilters ? 'No tasks found' : 'No tasks yet'}</h3><p>{hasActiveFilters ? 'Try changing your search or filters.' : 'Create your first task to start tracking project work.'}</p>{hasActiveFilters ? <button className="button button-secondary" onClick={() => { setQuery(''); setAppliedQuery(''); setFilterStatus(''); setFilterPriority(''); setFilterAssignee(''); setFilterCreator(''); setFilterDueFrom(''); setFilterDueTo(''); }}>Reset filters</button> : canWrite && <button className="button button-primary" onClick={() => setCreateOpen(true)}>Create task</button>}</div></section>
          )}
          {hasMoreTasks && !loading && <div className="task-load-more"><button className="button button-secondary" type="button" disabled={loadingMoreTasks} onClick={() => void loadMoreTasks()}>{loadingMoreTasks ? 'Loading task…' : 'Load more tasks'}</button><span>{tasks.length} tasks loaded</span></div>}
        </div>

      </div>

      {selectedTask && <div className="task-detail-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedTask(null); }}>
        <section className="task-detail-card" role="dialog" aria-modal="true" aria-labelledby="task-detail-title">
          <div className="detail-header"><h2 id="task-detail-title">{selectedTask.title}</h2><button className="icon-button" aria-label="Close detail task" onClick={() => setSelectedTask(null)}>×</button></div>
          <div className="detail-body">
            <div className="task-detail-main">
              {detailError && <div className="inline-message error" role="alert">{detailError}</div>}
              <div className="detail-field"><span>Description</span><p>{selectedTask.description || 'No description yet.'}</p></div>
              <div className="detail-field"><span>Comments ({selectedTask.comments?.length ?? 0})</span>
                <div className="comment-list">{selectedTask.comments?.map((item) => <article className="comment-item" key={item.id}><div className="comment-meta"><strong>{item.author.name}</strong><time dateTime={item.createdAt}>{dateLabel(item.createdAt)}</time></div><p>{item.body}</p></article>)}</div>
                {canWrite && <form className="comment-form" onSubmit={addComment}><label className="sr-only" htmlFor="task-comment">Write a comment</label><textarea className="field-textarea" id="task-comment" value={comment} onChange={(event) => setComment(event.target.value)} maxLength={5000} placeholder="Write a comment…" required /><button className="button button-secondary" disabled={saving || !comment.trim()}>Send comment</button></form>}
              </div>
            </div>
            <aside className="task-detail-properties" aria-label="Task properties">
              {(canWrite || canManage) && <div className="detail-actions">{canWrite && <button className="button button-secondary compact-button" onClick={() => { setTaskFormError(''); setEditTaskOpen(true); }}>Edit task</button>}{canManage && <button className="button button-quiet compact-button danger-action" disabled={saving} onClick={() => void archiveTask()}>Archive</button>}</div>}
              <div className="detail-field"><span>Status</span><TaskStatusPicker task={selectedTask} disabled={!canWrite || saving} onChange={updateStatus} fullWidth /></div>
              <div className="detail-meta"><div className="detail-field"><span>Priority</span><strong>{priorityLabels[selectedTask.priority]}</strong></div><div className="detail-field"><span>Due date</span><strong>{dateLabel(selectedTask.dueAt)}</strong></div></div>
              <div className="detail-field"><span>Assignee</span><div className="project-members">{selectedTask.assignees.length ? selectedTask.assignees.map(({ teamMember }) => <span className="member-chip" key={teamMember.id}><span className="avatar">{initials(teamMember.name)}</span>{teamMember.name}</span>) : <p>No assignees yet.</p>}</div></div>
            </aside>
          </div>
        </section>
      </div>}

      {createOpen && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setCreateOpen(false); }}>
        <section className="modal" role="dialog" aria-modal="true" aria-labelledby="create-task-title">
          <div className="modal-header"><div><h2 id="create-task-title">Create task</h2><p>Add a new piece of work to this project.</p></div><button className="icon-button" aria-label="Close" onClick={() => setCreateOpen(false)}>×</button></div>
          <form className="form-stack" onSubmit={createTask}>
            {formError && <p className="form-error" role="alert">{formError}</p>}
            <label className="field-label">Task name<input className="field-input" name="title" placeholder="e.g. Review user requirements" minLength={2} maxLength={180} required autoFocus /></label>
            <label className="field-label">Description <span className="subtle-link">Optional</span><textarea className="field-textarea" name="description" placeholder="Add context or completion criteria" maxLength={10000} /></label>
            <div className="detail-meta"><label className="field-label">Priority<select className="filter-select" name="priority" defaultValue="NORMAL">{priorities.map((priority) => <option value={priority} key={priority}>{priorityLabels[priority]}</option>)}</select></label><label className="field-label">Due date<input className="field-input" name="dueAt" type="date" /></label></div>
            {canWrite && project?.members && project.members.length > 0 && <label className="field-label">Assignee<AssigneePicker members={project.members} /></label>}
            <div className="form-footer"><button className="button button-secondary" type="button" onClick={() => setCreateOpen(false)}>Cancel</button><button className="button button-primary" disabled={saving}>{saving ? 'Saving…' : 'Create task'}</button></div>
          </form>
        </section>
      </div>}

      {editTaskOpen && selectedTask && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setEditTaskOpen(false); }}>
        <section className="modal" role="dialog" aria-modal="true" aria-labelledby="edit-task-title">
          <div className="modal-header"><div><h2 id="edit-task-title">Edit task</h2><p>Update this task’s details.</p></div><button className="icon-button" aria-label="Close" onClick={() => setEditTaskOpen(false)}>×</button></div>
          <form className="form-stack" onSubmit={updateTask}>
            {taskFormError && <p className="form-error" role="alert">{taskFormError}</p>}
            <label className="field-label">Task name<input className="field-input" name="title" key={`task-title-${selectedTask.id}`} defaultValue={selectedTask.title} minLength={2} maxLength={180} required autoFocus /></label>
            <label className="field-label">Description <span className="subtle-link">Optional</span><textarea className="field-textarea" name="description" key={`task-description-${selectedTask.id}`} defaultValue={selectedTask.description ?? ''} maxLength={10000} placeholder="Add context or completion criteria" /></label>
            <div className="detail-meta"><label className="field-label">Priority<select className="filter-select" name="priority" defaultValue={selectedTask.priority}>{priorities.map((priority) => <option value={priority} key={priority}>{priorityLabels[priority]}</option>)}</select></label><label className="field-label">Due date<input className="field-input" name="dueAt" type="date" defaultValue={dateInputValue(selectedTask.dueAt)} /></label></div>
            {canManage && project?.members && project.members.length > 0 && <label className="field-label">Assignee<AssigneePicker members={project.members} initialIds={selectedTask.assignees.map(({ teamMember }) => teamMember.id)} /></label>}
            <div className="form-footer"><button className="button button-secondary" type="button" onClick={() => setEditTaskOpen(false)}>Cancel</button><button className="button button-primary" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button></div>
          </form>
        </section>
      </div>}

      {editProjectOpen && project && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setEditProjectOpen(false); }}>
        <section className="modal" role="dialog" aria-modal="true" aria-labelledby="edit-project-title">
          <div className="modal-header"><div><h2 id="edit-project-title">Edit project</h2><p>Update the project name and description.</p></div><button className="icon-button" aria-label="Close" onClick={() => setEditProjectOpen(false)}>×</button></div>
          <form className="form-stack" onSubmit={updateProject}>
            {projectError && <p className="form-error" role="alert">{projectError}</p>}
            <label className="field-label">Project name<input className="field-input" name="name" key={`project-name-${project.id}`} defaultValue={project.name} minLength={2} maxLength={120} required autoFocus /></label>
            <label className="field-label">Description <span className="subtle-link">Optional</span><textarea className="field-textarea" name="description" key={`project-description-${project.id}`} defaultValue={project.description ?? ''} maxLength={2000} placeholder="Project goals or summary" /></label>
            <label className="field-label">Department<select className="filter-select" name="departmentId" key={`project-department-${project.id}`} defaultValue={project.departmentId} required>{departments.map((department) => <option value={department.id} key={department.id}>{department.name}{department.isActive ? '' : ' (inactive)'}</option>)}</select></label>
            <div className="detail-meta"><label className="field-label">Start date<input className="field-input" name="startsAt" type="date" defaultValue={dateInputValue(project.startsAt)} /></label><label className="field-label">End date<input className="field-input" name="endsAt" type="date" defaultValue={dateInputValue(project.endsAt)} /></label></div>
            <div className="form-footer"><button className="button button-secondary" type="button" onClick={() => setEditProjectOpen(false)}>Cancel</button><button className="button button-primary" disabled={projectSaving}>{projectSaving ? 'Saving…' : 'Save changes'}</button></div>
          </form>
        </section>
      </div>}

      {manageMembersOpen && project && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setManageMembersOpen(false); }}>
        <section className="modal project-member-modal" role="dialog" aria-modal="true" aria-labelledby="manage-project-members-title">
          <div className="modal-header"><div><h2 id="manage-project-members-title">Project members</h2><p>Add active team members or manage their project access.</p></div><button className="icon-button" aria-label="Close" onClick={() => setManageMembersOpen(false)}>×</button></div>
          <div className="form-stack">
            {membershipError && <p className="form-error" role="alert">{membershipError}</p>}
            {membershipNotice && <div className="inline-message success" role="status">{membershipNotice}</div>}
            <form className="project-member-add" onSubmit={addProjectMember}>
              <label className="field-label">Active member email<input className="field-input" name="email" type="email" maxLength={320} placeholder="name@company.com" required /></label>
              <label className="field-label">Project role<select className="filter-select" name="role" defaultValue="MEMBER"><option value="MEMBER">Member</option><option value="VIEWER">Viewer</option>{isAdministrator(member?.role) && <option value="PROJECT_MANAGER">Project Manager</option>}</select></label>
              <button className="button button-primary" disabled={saving}>{saving ? 'Adding…' : 'Add'}</button>
            </form>
            <div className="project-member-list-heading"><strong>Current members</strong><span>{project.members?.length ?? 0}</span></div>
            <div className="project-member-list">
              {project.members?.map(({ id, role, teamMember }) => {
                const isLastProjectManager = role === 'PROJECT_MANAGER' && activeProjectManagerCount <= 1;
                const roleControlDisabled = membershipBusy === teamMember.id || isLastProjectManager;
                return <div className="project-member-row" key={id}>
                  <span className="avatar">{initials(teamMember.name)}</span>
                  <div className="project-member-identity"><strong>{teamMember.name}</strong><small>{teamMember.email}</small></div>
                  {teamMember.id === member?.id
                    ? <span className="project-role-current" title="You cannot change your own project role."><strong>{roleLabels[role]}</strong><small>Your account</small></span>
                    : <label title={isLastProjectManager ? 'A project must keep at least one active Project Manager.' : undefined}><span className="sr-only">Role {teamMember.name}</span><select className="filter-select compact-select" value={role} disabled={roleControlDisabled} onChange={(event) => void updateProjectMemberRole(teamMember.id, event.target.value as ProjectRole)}><option value="PROJECT_MANAGER" disabled={!isAdministrator(member?.role)}>Project Manager</option><option value="MEMBER">Member</option><option value="VIEWER">Viewer</option></select></label>}
                  {teamMember.id !== member?.id && <button className="button button-quiet compact-button danger-action" disabled={roleControlDisabled} title={isLastProjectManager ? 'A project must keep at least one active Project Manager.' : undefined} onClick={() => void removeProjectMember(teamMember.id, teamMember.name)}>Remove</button>}
                </div>;
              })}
              {!project.members?.length && <p className="project-members-empty">No members in this project yet.</p>}
            </div>
          </div>
        </section>
      </div>}
    </div>
  );
}
