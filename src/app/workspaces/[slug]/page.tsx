'use client';

import { FormEvent, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  ArrowUpRight,
  CheckCircle2,
  CheckSquare,
  FolderKanban,
  Plus,
  Table2,
  Users,
} from 'lucide-react';
import {
  api,
  CurrentMember,
  DepartmentWorkspaceResponse,
  isAdministrator,
  Project,
  signInUrl,
  Task,
  TaskPriority,
  TaskStatus,
  TeamMember,
} from '@/lib/api';
import { Avatar, AvatarGroupCount } from '@/components/ui/avatar';
import { DepartmentIcon } from '@/components/department-icon';

type WorkspaceTab = 'projects' | 'tasks' | 'members';

const statusLabels: Record<TaskStatus, string> = {
  TODO: 'To do',
  IN_PROGRESS: 'In progress',
  BLOCKED: 'Blocked',
  DONE: 'Done',
};

const priorityLabels: Record<TaskPriority, string> = {
  LOW: 'Low',
  NORMAL: 'Normal',
  HIGH: 'High',
  URGENT: 'Urgent',
};

const roleLabels: Record<string, string> = {
  SYSTEM_OWNER: 'System Owner',
  SYSTEM_ADMIN: 'System Admin',
  MEMBER: 'Member',
};

function formatDate(value: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function WorkspaceDetailContent() {
  const params = useParams<{ slug: string }>();
  const slug = decodeURIComponent(params.slug ?? '');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const rawTab = searchParams.get('tab');
  const activeTab: WorkspaceTab =
    rawTab === 'tasks' || rawTab === 'members' ? rawTab : 'projects';

  const endpoint = `/team/departments/workspace/${encodeURIComponent(slug)}`;

  const [workspace, setWorkspace] = useState<DepartmentWorkspaceResponse | null>(
    () => api.getCached<DepartmentWorkspaceResponse>(endpoint),
  );
  const [member, setMember] = useState<CurrentMember | null>(
    () => api.getCached<CurrentMember>('/team/me'),
  );
  const [assigneesPool, setAssigneesPool] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(() => !api.getCached<DepartmentWorkspaceResponse>(endpoint));
  const [error, setError] = useState('');

  // Task filters inside Tasks tab
  const [taskStatusFilter, setTaskStatusFilter] = useState('');
  const [taskScopeFilter, setTaskScopeFilter] = useState<'all' | 'project' | 'standalone'>('all');

  // Create Project modal
  const [createProjectOpen, setCreateProjectOpen] = useState(false);
  const [projectSaving, setProjectSaving] = useState(false);
  const [projectError, setProjectError] = useState('');

  // Create Workspace Task modal
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [taskSaving, setTaskSaving] = useState(false);
  const [taskError, setTaskError] = useState('');
  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<string[]>([]);

  const load = useCallback(
    async (force = false) => {
      if (!slug) return;
      if (!api.getCached<DepartmentWorkspaceResponse>(endpoint)) setLoading(true);
      try {
        const [wsData, current] = await Promise.all([
          api.get<DepartmentWorkspaceResponse>(endpoint, { force }),
          api.get<CurrentMember>('/team/me', { force }),
        ]);
        setWorkspace(wsData);
        setMember(current);
        setError('');
      } catch (cause) {
        const message = cause instanceof Error ? cause.message : 'Could not load department workspace.';
        if (message === 'SESSION_EXPIRED') window.location.assign(signInUrl());
        else setError(message);
      } finally {
        setLoading(false);
      }
    },
    [endpoint, slug],
  );

  useEffect(() => {
    void load(false);
  }, [load]);

  const isAdmin = isAdministrator(member?.role);
  const canCreateTask = Boolean(workspace && (isAdmin || workspace.isMember));

  async function openNewTaskModal() {
    setTaskError('');
    setSelectedAssigneeIds([]);
    setCreateTaskOpen(true);
    try {
      const list = await api.get<TeamMember[]>('/team/tasks/assignees');
      setAssigneesPool(list);
    } catch {
      // Fallback to department members list if needed
    }
  }

  async function handleCreateProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!workspace) return;
    setProjectSaving(true);
    setProjectError('');

    const data = new FormData(event.currentTarget);
    const startsAt = String(data.get('startsAt') ?? '');
    const endsAt = String(data.get('endsAt') ?? '');

    try {
      const created = await api.post<Project>('/team/projects', {
        name: String(data.get('name') ?? '').trim(),
        description: String(data.get('description') ?? '').trim() || undefined,
        departmentId: workspace.department.id,
        hasPartnershipSheet: data.get('hasPartnershipSheet') === 'on',
        ...(startsAt ? { startsAt: new Date(`${startsAt}T00:00:00.000Z`).toISOString() } : {}),
        ...(endsAt ? { endsAt: new Date(`${endsAt}T00:00:00.000Z`).toISOString() } : {}),
      });
      setCreateProjectOpen(false);
      await load(true);
      router.push(`/projects/${encodeURIComponent(created.id)}`);
    } catch (cause) {
      setProjectError(cause instanceof Error ? cause.message : 'Could not create project.');
    } finally {
      setProjectSaving(false);
    }
  }

  async function handleCreateWorkspaceTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!workspace) return;
    setTaskSaving(true);
    setTaskError('');

    const data = new FormData(event.currentTarget);
    const dueAtRaw = String(data.get('dueAt') ?? '').trim();

    try {
      await api.post<Task>('/team/tasks', {
        title: String(data.get('title') ?? '').trim(),
        description: String(data.get('description') ?? '').trim() || undefined,
        priority: String(data.get('priority') ?? 'NORMAL') as TaskPriority,
        dueAt: dueAtRaw ? new Date(`${dueAtRaw}T23:59:00`).toISOString() : undefined,
        departmentId: workspace.department.id,
        assignedMemberIds: selectedAssigneeIds,
      });
      setCreateTaskOpen(false);
      await load(true);
      router.replace(`${pathname}?tab=tasks`, { scroll: false });
    } catch (cause) {
      setTaskError(cause instanceof Error ? cause.message : 'Could not create task.');
    } finally {
      setTaskSaving(false);
    }
  }

  function tabHref(tab: WorkspaceTab) {
    const next = new URLSearchParams(searchParams.toString());
    if (tab === 'projects') next.delete('tab');
    else next.set('tab', tab);
    const qs = next.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  const filteredTasks = useMemo(() => {
    const list = workspace?.tasks ?? [];
    return list.filter((task) => {
      if (taskStatusFilter && task.status !== taskStatusFilter) return false;
      if (taskScopeFilter === 'project' && !task.projectId) return false;
      if (taskScopeFilter === 'standalone' && task.projectId) return false;
      return true;
    });
  }, [workspace?.tasks, taskStatusFilter, taskScopeFilter]);

  const openTaskCount = useMemo(
    () => (workspace?.tasks ?? []).filter((t) => t.status !== 'DONE').length,
    [workspace?.tasks],
  );
  const doneTaskCount = useMemo(
    () => (workspace?.tasks ?? []).filter((t) => t.status === 'DONE').length,
    [workspace?.tasks],
  );

  const memberOptions = useMemo(() => {
    const merged = new Map<string, TeamMember>();
    for (const item of workspace?.members ?? []) {
      merged.set(item.teamMember.id, item.teamMember);
    }
    for (const item of assigneesPool) {
      if (!merged.has(item.id)) merged.set(item.id, item);
    }
    return Array.from(merged.values());
  }, [workspace?.members, assigneesPool]);

  return (
    <div className="page-content">
      <div className="workspace-back-row">
        <Link href="/workspaces" className="workspace-back-link">
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
          All workspaces
        </Link>
      </div>

      <div className="page-heading">
        <div>
          <div className="workspace-title-row">
            {workspace && (
              <div className="workspace-card-icon-wrap">
                <DepartmentIcon name={workspace.department.name} size={22} />
              </div>
            )}
            <h1>{workspace?.department.name ?? 'Workspace'}</h1>
            {workspace?.isMember && (
              <span className="workspace-member-badge">Member</span>
            )}
            {workspace && !workspace.department.isActive && (
              <span className="dept-status-pill is-inactive">Archived</span>
            )}
          </div>
          <p className="page-subtitle">
            {workspace?.department.description ||
              'Projects, tasks, and collaborators belonging to this department workspace.'}
          </p>
        </div>
        <div className="page-heading-actions">
          {canCreateTask && (
            <button
              type="button"
              className="button button-secondary"
              onClick={() => void openNewTaskModal()}
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              New task
            </button>
          )}
          {member && (
            <button
              type="button"
              className="button button-primary"
              onClick={() => {
                setProjectError('');
                setCreateProjectOpen(true);
              }}
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              New project
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="inline-message error" role="alert">
          {error}
          <button className="button button-quiet" onClick={() => void load(true)}>
            Reload
          </button>
        </div>
      )}

      {/* WORKSPACE KPI SUMMARY */}
      <section className="dashboard-kpi-grid" aria-label="Workspace overview metrics">
        <article className="dashboard-kpi-card">
          <div className="dashboard-kpi-header">
            <span>PROJECTS</span>
            <FolderKanban className="w-4 h-4" aria-hidden="true" />
          </div>
          <strong>{loading ? '—' : workspace?.projects.length ?? 0}</strong>
          <small>Active workspace projects</small>
        </article>
        <article className="dashboard-kpi-card">
          <div className="dashboard-kpi-header">
            <span>OPEN TASKS</span>
            <CheckSquare className="w-4 h-4 text-amber-500" aria-hidden="true" />
          </div>
          <strong>{loading ? '—' : openTaskCount}</strong>
          <small>Project &amp; department work</small>
        </article>
        <article className="dashboard-kpi-card">
          <div className="dashboard-kpi-header">
            <span>COMPLETED</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" aria-hidden="true" />
          </div>
          <strong>{loading ? '—' : doneTaskCount}</strong>
          <small>Done across this workspace</small>
        </article>
        <article className="dashboard-kpi-card">
          <div className="dashboard-kpi-header">
            <span>MEMBERS</span>
            <Users className="w-4 h-4" aria-hidden="true" />
          </div>
          <strong>{loading ? '—' : workspace?.members.length ?? 0}</strong>
          <small>Assigned department teammates</small>
        </article>
      </section>

      {/* WORKSPACE TABS */}
      <div className="project-workspace-nav">
        <div className="project-view-tabs" aria-label="Workspace section">
          <Link
            className={`project-view-tab ${activeTab === 'projects' ? 'is-active' : ''}`}
            href={tabHref('projects')}
            scroll={false}
          >
            Projects ({workspace?.projects.length ?? 0})
          </Link>
          <Link
            className={`project-view-tab ${activeTab === 'tasks' ? 'is-active' : ''}`}
            href={tabHref('tasks')}
            scroll={false}
          >
            Tasks ({workspace?.tasks.length ?? 0})
          </Link>
          <Link
            className={`project-view-tab ${activeTab === 'members' ? 'is-active' : ''}`}
            href={tabHref('members')}
            scroll={false}
          >
            Members ({workspace?.members.length ?? 0})
          </Link>
        </div>
        {isAdmin && (
          <div className="project-context-actions">
            <Link className="project-activity-link" href="/workspaces">
              Manage workspaces
            </Link>
          </div>
        )}
      </div>

      {loading ? (
        <div className="project-grid">
          {[1, 2, 3].map((item) => <div className="loading-skeleton" key={item} />)}
        </div>
      ) : activeTab === 'projects' ? (
        workspace && workspace.projects.length > 0 ? (
          <div className="project-grid">
            {workspace.projects.map((project) => (
              <article className="project-card workspace-project-card" key={project.id}>
                <Link className="workspace-project-main" href={`/projects/${project.id}`}>
                  <div className="project-card-top">
                    <div className="project-card-badges">
                      <span className="project-card-mark">{project.name.slice(0, 1).toUpperCase()}</span>
                      {project.hasPartnershipSheet && (
                        <span className="project-sheet-pill">
                          <Table2 className="w-3 h-3" aria-hidden="true" />
                          Partnership Sheet
                        </span>
                      )}
                    </div>
                    <span className="project-card-open">
                      Open <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                    </span>
                  </div>
                  <h3 title={project.name}>{project.name}</h3>
                  <p className="project-description">
                    {project.description || 'No description for this project yet.'}
                  </p>
                  <div className="project-card-owner-row">
                    <Avatar size="sm" className="size-6 text-[10px]" seed={project.createdBy.name} styleType="open-peeps" />
                    <span className="project-card-metadata">Lead: {project.createdBy.name}</span>
                  </div>
                  <div className="project-card-footer">
                    <span className="project-member-summary">
                      <span className="mini-people-icon" aria-hidden="true" />
                      {project._count?.members ?? 0} members · {project._count?.tasks ?? 0} tasks
                    </span>
                    <span>Updated {formatDate(project.updatedAt)}</span>
                  </div>
                </Link>
                {project.hasPartnershipSheet && (
                  <div className="workspace-project-shortcut">
                    <Link
                      href={`/projects/${encodeURIComponent(project.id)}?view=partnerships`}
                      className="button button-secondary compact-button"
                    >
                      <Table2 className="w-3.5 h-3.5" aria-hidden="true" />
                      Open Partnerships Sheet
                    </Link>
                  </div>
                )}
              </article>
            ))}
          </div>
        ) : (
          <section className="empty-state">
            <div>
              <h3>No projects in {workspace?.department.name} yet</h3>
              <p>Create the first project in this workspace to organize tasks and tools.</p>
              {member && (
                <button
                  className="button button-primary"
                  onClick={() => {
                    setProjectError('');
                    setCreateProjectOpen(true);
                  }}
                >
                  Create project
                </button>
              )}
            </div>
          </section>
        )
      ) : activeTab === 'tasks' ? (
        <section>
          <div className="task-toolbar" style={{ marginBottom: 14 }}>
            <div className="toolbar-filters">
              <select
                className="filter-select"
                aria-label="Filter by task status"
                value={taskStatusFilter}
                onChange={(e) => setTaskStatusFilter(e.target.value)}
              >
                <option value="">All statuses</option>
                <option value="TODO">To do</option>
                <option value="IN_PROGRESS">In progress</option>
                <option value="BLOCKED">Blocked</option>
                <option value="DONE">Done</option>
              </select>
              <select
                className="filter-select"
                aria-label="Filter by task scope"
                value={taskScopeFilter}
                onChange={(e) => setTaskScopeFilter(e.target.value as 'all' | 'project' | 'standalone')}
              >
                <option value="all">Project + Standalone</option>
                <option value="project">Inside a project</option>
                <option value="standalone">Workspace standalone</option>
              </select>
            </div>
            <span className="section-count">{filteredTasks.length} task(s)</span>
          </div>

          {filteredTasks.length > 0 ? (
            <div className="task-table-wrap">
              <table className="task-table">
                <thead>
                  <tr>
                    <th>Task</th>
                    <th>Project / Source</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Assignees</th>
                    <th>Due date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.map((task) => (
                    <tr key={task.id}>
                      <td>
                        <Link
                          href={task.projectId ? `/projects/${encodeURIComponent(task.projectId)}` : '/tasks'}
                          className="task-title-button"
                        >
                          {task.title}
                        </Link>
                        <div className="task-subtitle">
                          Updated {formatDate(task.updatedAt)} · by {task.createdBy.name}
                        </div>
                      </td>
                      <td>
                        {task.project ? (
                          <Link
                            href={`/projects/${encodeURIComponent(task.project.id)}`}
                            className="workspace-source-pill"
                          >
                            {task.project.name}
                          </Link>
                        ) : (
                          <span className="workspace-source-pill is-standalone">Workspace task</span>
                        )}
                      </td>
                      <td>
                        <span className={`status-badge status-${task.status}`}>
                          {statusLabels[task.status]}
                        </span>
                      </td>
                      <td>
                        <span className={`priority-badge priority-${task.priority}`}>
                          {priorityLabels[task.priority]}
                        </span>
                      </td>
                      <td>
                        <div className="assignee-stack">
                          {task.assignees.length > 0 ? (
                            task.assignees.slice(0, 3).map(({ teamMember }) => (
                              <Avatar
                                key={teamMember.id}
                                size="sm"
                                className="size-6 text-[10px]"
                                seed={teamMember.name}
                                styleType="open-peeps"
                                title={teamMember.name}
                              />
                            ))
                          ) : (
                            <span className="assignee-empty">Unassigned</span>
                          )}
                          {task.assignees.length > 3 && (
                            <AvatarGroupCount className="size-6 text-[10px]">
                              +{task.assignees.length - 3}
                            </AvatarGroupCount>
                          )}
                        </div>
                      </td>
                      <td className="due-date">{formatDate(task.dueAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <section className="empty-state">
              <div>
                <h3>No matching tasks in this workspace</h3>
                <p>Tasks created in workspace projects or assigned to {workspace?.department.name} will appear here.</p>
                {canCreateTask && (
                  <button
                    className="button button-primary"
                    onClick={() => void openNewTaskModal()}
                  >
                    Create workspace task
                  </button>
                )}
              </div>
            </section>
          )}
        </section>
      ) : (
        <section>
          {workspace && workspace.members.length > 0 ? (
            <div className="workspace-members-grid">
              {workspace.members.map(({ id, teamMember }) => (
                <article className="workspace-member-card" key={id}>
                  <Avatar size="sm" className="size-9" seed={teamMember.name} styleType="open-peeps" />
                  <div className="workspace-member-info">
                    <strong>{teamMember.name}</strong>
                    <small>{teamMember.email}</small>
                  </div>
                  <span className="role-pill">{roleLabels[teamMember.role] ?? teamMember.role}</span>
                </article>
              ))}
            </div>
          ) : (
            <section className="empty-state">
              <div>
                <h3>No members assigned yet</h3>
                <p>System administrators can assign teammates to this department workspace.</p>
              </div>
            </section>
          )}
        </section>
      )}

      {/* CREATE PROJECT IN THIS WORKSPACE */}
      {createProjectOpen && workspace && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setCreateProjectOpen(false);
          }}
        >
          <section className="modal" role="dialog" aria-modal="true" aria-labelledby="ws-create-project-title">
            <div className="modal-header">
              <div>
                <h2 id="ws-create-project-title">New project in {workspace.department.name}</h2>
                <p>This project will automatically live inside the {workspace.department.name} workspace.</p>
              </div>
              <button className="icon-button" aria-label="Close" onClick={() => setCreateProjectOpen(false)}>×</button>
            </div>
            <form className="form-stack" onSubmit={handleCreateProject}>
              {projectError && <p className="form-error" role="alert">{projectError}</p>}
              <label className="field-label">
                Project name
                <input
                  className="field-input"
                  name="name"
                  placeholder="e.g. Q4 Campus Ambassador"
                  minLength={2}
                  maxLength={120}
                  required
                  autoFocus
                />
              </label>
              <label className="field-label">
                Description <span className="subtle-link">Optional</span>
                <textarea
                  className="field-textarea"
                  name="description"
                  placeholder="Project goals or summary"
                  maxLength={2000}
                />
              </label>
              <div className="detail-meta">
                <label className="field-label">
                  Start date
                  <input className="field-input" name="startsAt" type="date" />
                </label>
                <label className="field-label">
                  End date
                  <input className="field-input" name="endsAt" type="date" />
                </label>
              </div>
              <label className="marketing-checkbox-row">
                <input type="checkbox" name="hasPartnershipSheet" />
                <span>Include Partnership spreadsheet tab in this project</span>
              </label>
              <div className="form-footer">
                <button className="button button-secondary" type="button" onClick={() => setCreateProjectOpen(false)}>
                  Cancel
                </button>
                <button className="button button-primary" disabled={projectSaving}>
                  {projectSaving ? 'Creating…' : 'Create project'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* CREATE STANDALONE WORKSPACE TASK */}
      {createTaskOpen && workspace && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setCreateTaskOpen(false);
          }}
        >
          <section className="modal" role="dialog" aria-modal="true" aria-labelledby="ws-create-task-title">
            <div className="modal-header">
              <div>
                <h2 id="ws-create-task-title">New task in {workspace.department.name}</h2>
                <p>Create a department-level task linked to this workspace.</p>
              </div>
              <button className="icon-button" aria-label="Close" onClick={() => setCreateTaskOpen(false)}>×</button>
            </div>
            <form className="form-stack" onSubmit={handleCreateWorkspaceTask}>
              {taskError && <p className="form-error" role="alert">{taskError}</p>}
              <label className="field-label">
                Task title
                <input
                  className="field-input"
                  name="title"
                  placeholder="e.g. Prepare weekly content schedule"
                  minLength={2}
                  maxLength={180}
                  required
                  autoFocus
                />
              </label>
              <label className="field-label">
                Description <span className="subtle-link">Optional</span>
                <textarea
                  className="field-textarea"
                  name="description"
                  placeholder="Add context or completion criteria"
                  maxLength={10000}
                />
              </label>
              <div className="detail-meta">
                <label className="field-label">
                  Priority
                  <select className="filter-select" name="priority" defaultValue="NORMAL">
                    <option value="LOW">Low</option>
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </label>
                <label className="field-label">
                  Due date
                  <input className="field-input" name="dueAt" type="date" />
                </label>
              </div>
              {memberOptions.length > 0 && (
                <div className="field-label">
                  <span>Assignees</span>
                  <div className="assignee-picker">
                    {memberOptions.map((item) => {
                      const checked = selectedAssigneeIds.includes(item.id);
                      return (
                        <label key={item.id} className={`assignee-option ${checked ? 'is-selected' : ''}`}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              setSelectedAssigneeIds((prev) =>
                                e.target.checked
                                  ? [...prev, item.id]
                                  : prev.filter((id) => id !== item.id),
                              );
                            }}
                          />
                          <span>{item.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
              <div className="form-footer">
                <button className="button button-secondary" type="button" onClick={() => setCreateTaskOpen(false)}>
                  Cancel
                </button>
                <button className="button button-primary" disabled={taskSaving}>
                  {taskSaving ? 'Creating…' : 'Create task'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

export default function WorkspaceDetailPage() {
  return (
    <Suspense fallback={<div className="page-content"><div className="loading-skeleton" /></div>}>
      <WorkspaceDetailContent />
    </Suspense>
  );
}
