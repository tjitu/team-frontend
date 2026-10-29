'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { api, CurrentMember, isAdministrator, Project, ProjectRole, signInUrl, Task, TaskPriority, TaskStatus } from '@/lib/api';

const statuses: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'BLOCKED', 'DONE'];
const priorities: TaskPriority[] = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];
const statusLabels: Record<TaskStatus, string> = { TODO: 'Belum mulai', IN_PROGRESS: 'Dikerjakan', BLOCKED: 'Terhambat', DONE: 'Selesai' };
const priorityLabels: Record<TaskPriority, string> = { LOW: 'Rendah', NORMAL: 'Normal', HIGH: 'Tinggi', URGENT: 'Mendesak' };
const roleLabels: Record<ProjectRole, string> = { PROJECT_MANAGER: 'Project Manager', MEMBER: 'Anggota', VIEWER: 'Viewer' };

function dateLabel(value?: string | null) {
  if (!value) return 'Tidak ditentukan';
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value));
}

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('');
}

export default function ProjectPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [member, setMember] = useState<CurrentMember | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [query, setQuery] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [detailError, setDetailError] = useState('');
  const [comment, setComment] = useState('');

  const projectRole = useMemo(() => project?.members?.find(({ teamMember }) => teamMember.id === member?.id)?.role, [project, member]);
  const canManage = isAdministrator(member?.role) || projectRole === 'PROJECT_MANAGER';
  const canWrite = canManage || (projectRole !== 'VIEWER' && projectRole !== undefined);

  const load = useCallback(async (keepSelected = true) => {
    setLoading(true);
    try {
      const search = new URLSearchParams();
      if (filterStatus) search.set('status', filterStatus);
      if (filterPriority) search.set('priority', filterPriority);
      if (appliedQuery.trim()) search.set('q', appliedQuery.trim());
      search.set('limit', '100');
      const suffix = search.size ? `?${search.toString()}` : '';
      const [projectData, taskList, currentMember] = await Promise.all([
        api.get<Project>(`/team/projects/${encodeURIComponent(projectId)}`),
        api.get<Task[]>(`/team/projects/${encodeURIComponent(projectId)}/tasks${suffix}`),
        api.get<CurrentMember>('/team/me'),
      ]);
      setProject(projectData);
      setTasks(taskList);
      setMember(currentMember);
      setError('');
      if (keepSelected && selectedTask) {
        const fresh = taskList.find(({ id }) => id === selectedTask.id);
        if (fresh) await openTask(fresh.id, projectId, (task) => setSelectedTask(task));
        else setSelectedTask(null);
      }
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Gagal memuat proyek.';
      if (message === 'SESSION_EXPIRED') window.location.assign(signInUrl());
      else setError(message);
    } finally {
      setLoading(false);
    }
  }, [projectId, filterStatus, filterPriority, appliedQuery]);

  useEffect(() => { void load(false); }, [load]);

  async function openTask(taskId: string, id = projectId, setTask: (task: Task) => void = setSelectedTask) {
    setDetailError('');
    try {
      const task = await api.get<Task>(`/team/projects/${encodeURIComponent(id)}/tasks/${encodeURIComponent(taskId)}`);
      setTask(task);
    } catch (cause) {
      setDetailError(cause instanceof Error ? cause.message : 'Gagal memuat detail task.');
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
      setFormError(cause instanceof Error ? cause.message : 'Task gagal dibuat.');
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(status: TaskStatus) {
    if (!selectedTask) return;
    setSaving(true);
    setDetailError('');
    try {
      const updated = await api.patch<Task>(`/team/projects/${encodeURIComponent(projectId)}/tasks/${encodeURIComponent(selectedTask.id)}`, { version: selectedTask.version, status });
      await openTask(updated.id);
      await load(false);
    } catch (cause) {
      setDetailError(cause instanceof Error ? cause.message : 'Status task gagal diperbarui.');
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
      setDetailError(cause instanceof Error ? cause.message : 'Komentar gagal disimpan.');
    } finally {
      setSaving(false);
    }
  }

  const filteredCount = tasks.length;

  return (
    <div className="page-content">
      <div className="page-heading">
        <div>
          <h1>{project?.name ?? (loading ? 'Memuat proyek…' : 'Proyek')}</h1>
          <p className="page-subtitle">{project?.description || 'Atur pekerjaan dan pantau progres task proyek.'}</p>
        </div>
        {canWrite && <button className="button button-primary" onClick={() => { setFormError(''); setCreateOpen(true); }}><span className="button-symbol" aria-hidden="true">+</span>Task baru</button>}
      </div>

      {project?.members && project.members.length > 0 && <div className="project-members" aria-label="Anggota proyek">
        {project.members.map(({ id, role, teamMember }) => <span className="member-chip" key={id} title={`${teamMember.email} · ${roleLabels[role]}`}><span className="avatar">{initials(teamMember.name)}</span>{teamMember.name}<span className="sr-only">, {roleLabels[role]}</span></span>)}
      </div>}

      {error && <div className="inline-message error" role="alert">{error}<button className="button button-quiet" onClick={() => void load(false)}>Coba lagi</button></div>}
      {detailError && !selectedTask && <div className="inline-message error" role="alert">{detailError}</div>}

      <div className="section-heading section-spacer"><h2>Task</h2><span className="task-count">{filteredCount} ditampilkan</span></div>
      <div className="task-layout">
        <div>
          <form className="task-toolbar" onSubmit={(event) => { event.preventDefault(); setAppliedQuery(query); }}>
            <input className="search-input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari task…" aria-label="Cari task" />
            <div className="toolbar-filters">
              <label><span className="sr-only">Filter status</span><select className="filter-select" value={filterStatus} onChange={(event) => setFilterStatus(event.target.value)}><option value="">Semua status</option>{statuses.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}</select></label>
              <label><span className="sr-only">Filter prioritas</span><select className="filter-select" value={filterPriority} onChange={(event) => setFilterPriority(event.target.value)}><option value="">Semua prioritas</option>{priorities.map((priority) => <option key={priority} value={priority}>{priorityLabels[priority]}</option>)}</select></label>
              <button className="button button-secondary" type="submit">Cari</button>
            </div>
          </form>
          {loading ? <div className="loading-skeleton" aria-label="Memuat task" /> : tasks.length ? (
            <div className="task-table-wrap">
              <table className="task-table">
                <thead><tr><th>Task</th><th>Status</th><th>Prioritas</th><th>Assignee</th><th>Jatuh tempo</th></tr></thead>
                <tbody>{tasks.map((task) => <tr key={task.id}>
                  <td><button className="task-title-button" onClick={() => void openTask(task.id)}>{task.title}</button><div className="task-subtitle">{task._count?.comments ?? 0} komentar · diperbarui {dateLabel(task.updatedAt)}</div></td>
                  <td><span className={`status-badge status-${task.status}`}>{statusLabels[task.status]}</span></td>
                  <td><span className={`priority-badge priority-${task.priority}`}>{priorityLabels[task.priority]}</span></td>
                  <td><div className="assignee-stack" aria-label={task.assignees.map(({ teamMember }) => teamMember.name).join(', ') || 'Belum ada assignee'}>{task.assignees.length ? task.assignees.slice(0, 3).map(({ teamMember }) => <span className="avatar" key={teamMember.id} title={teamMember.name}>{initials(teamMember.name)}</span>) : <span className="assignee-empty">Belum ada</span>}{task.assignees.length > 3 && <span className="avatar">+{task.assignees.length - 3}</span>}</div></td>
                  <td className="due-date">{dateLabel(task.dueAt)}</td>
                </tr>)}</tbody>
              </table>
            </div>
          ) : (
            <section className="empty-state"><div><div className="empty-state-icon" aria-hidden="true">□</div><h3>{appliedQuery || filterStatus || filterPriority ? 'Task tidak ditemukan' : 'Belum ada task'}</h3><p>{appliedQuery || filterStatus || filterPriority ? 'Coba ubah kata kunci atau filter yang digunakan.' : 'Buat task pertama untuk mulai mencatat pekerjaan proyek.'}</p>{canWrite && !appliedQuery && !filterStatus && !filterPriority && <button className="button button-primary" onClick={() => setCreateOpen(true)}>Buat task</button>}</div></section>
          )}
        </div>

        {selectedTask && <aside className="task-detail-card" aria-label="Detail task">
          <div className="detail-header"><h2>{selectedTask.title}</h2><button className="icon-button" aria-label="Tutup detail task" onClick={() => setSelectedTask(null)}>×</button></div>
          <div className="detail-body">
            {detailError && <div className="inline-message error" role="alert">{detailError}</div>}
            <label className="detail-field"><span>Status</span><select className="filter-select" value={selectedTask.status} disabled={!canWrite || saving} onChange={(event) => void updateStatus(event.target.value as TaskStatus)}>{statuses.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}</select></label>
            <div className="detail-meta"><div className="detail-field"><span>Prioritas</span><strong>{priorityLabels[selectedTask.priority]}</strong></div><div className="detail-field"><span>Jatuh tempo</span><strong>{dateLabel(selectedTask.dueAt)}</strong></div></div>
            <div className="detail-field"><span>Deskripsi</span><p>{selectedTask.description || 'Belum ada deskripsi.'}</p></div>
            <div className="detail-field"><span>Assignee</span><div className="project-members">{selectedTask.assignees.length ? selectedTask.assignees.map(({ teamMember }) => <span className="member-chip" key={teamMember.id}><span className="avatar">{initials(teamMember.name)}</span>{teamMember.name}</span>) : <p>Belum ada assignee.</p>}</div></div>
            <div className="detail-field"><span>Komentar ({selectedTask.comments?.length ?? 0})</span>
              <div className="comment-list">{selectedTask.comments?.map((item) => <article className="comment-item" key={item.id}><div className="comment-meta"><strong>{item.author.name}</strong><time dateTime={item.createdAt}>{dateLabel(item.createdAt)}</time></div><p>{item.body}</p></article>)}</div>
              {canWrite && <form className="comment-form" onSubmit={addComment}><label className="sr-only" htmlFor="task-comment">Tulis komentar</label><textarea className="field-textarea" id="task-comment" value={comment} onChange={(event) => setComment(event.target.value)} maxLength={5000} placeholder="Tulis komentar…" required /><button className="button button-secondary" disabled={saving || !comment.trim()}>Kirim komentar</button></form>}
            </div>
          </div>
        </aside>}
      </div>

      {createOpen && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setCreateOpen(false); }}>
        <section className="modal" role="dialog" aria-modal="true" aria-labelledby="create-task-title">
          <div className="modal-header"><div><h2 id="create-task-title">Buat task</h2><p>Catat pekerjaan baru untuk proyek ini.</p></div><button className="icon-button" aria-label="Tutup" onClick={() => setCreateOpen(false)}>×</button></div>
          <form className="form-stack" onSubmit={createTask}>
            {formError && <p className="form-error" role="alert">{formError}</p>}
            <label className="field-label">Nama task<input className="field-input" name="title" placeholder="Contoh: Tinjau kebutuhan pengguna" minLength={2} maxLength={180} required autoFocus /></label>
            <label className="field-label">Deskripsi <span className="subtle-link">Opsional</span><textarea className="field-textarea" name="description" placeholder="Tambahkan konteks atau kriteria selesai" maxLength={10000} /></label>
            <div className="detail-meta"><label className="field-label">Prioritas<select className="filter-select" name="priority" defaultValue="NORMAL">{priorities.map((priority) => <option value={priority} key={priority}>{priorityLabels[priority]}</option>)}</select></label><label className="field-label">Jatuh tempo<input className="field-input" name="dueAt" type="date" /></label></div>
            {canManage && project?.members && project.members.length > 0 && <label className="field-label">Assignee<select className="filter-select" name="assigneeIds" multiple size={Math.min(project.members.length, 4)}>{project.members.map(({ teamMember }) => <option key={teamMember.id} value={teamMember.id}>{teamMember.name} · {teamMember.email}</option>)}</select><span className="subtle-link">Pilih satu atau beberapa anggota.</span></label>}
            <div className="form-footer"><button className="button button-secondary" type="button" onClick={() => setCreateOpen(false)}>Batal</button><button className="button button-primary" disabled={saving}>{saving ? 'Menyimpan…' : 'Buat task'}</button></div>
          </form>
        </section>
      </div>}
    </div>
  );
}
