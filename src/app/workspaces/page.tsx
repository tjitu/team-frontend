'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, FolderKanban, Pencil, Plus, Search, Users } from 'lucide-react';
import {
  api,
  CurrentMember,
  Department,
  DepartmentMember,
  isAdministrator,
  ManagedMember,
  signInUrl,
} from '@/lib/api';
import { Avatar } from '@/components/ui/avatar';
import { DepartmentIcon } from '@/components/department-icon';

const roleLabels: Record<string, string> = {
  SYSTEM_OWNER: 'System Owner',
  SYSTEM_ADMIN: 'System Admin',
  MEMBER: 'Member',
};

export default function WorkspacesPage() {
  const [departments, setDepartments] = useState<Department[]>(
    () => api.getCached<Department[]>('/team/departments') ?? [],
  );
  const [member, setMember] = useState<CurrentMember | null>(
    () => api.getCached<CurrentMember>('/team/me'),
  );
  const [loading, setLoading] = useState(() => !api.getCached<Department[]>('/team/departments'));
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  // Create / Edit workspace modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Manage workspace members modal (admins)
  const [managing, setManaging] = useState<Department | null>(null);
  const [deptMembers, setDeptMembers] = useState<DepartmentMember[]>([]);
  const [allMembers, setAllMembers] = useState<ManagedMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [memberActionError, setMemberActionError] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [memberSaving, setMemberSaving] = useState(false);

  const load = useCallback(async (force = false) => {
    if (!api.getCached<Department[]>('/team/departments')) setLoading(true);
    try {
      const [list, current] = await Promise.all([
        api.get<Department[]>('/team/departments', { force }),
        api.get<CurrentMember>('/team/me', { force }),
      ]);
      setDepartments(list);
      setMember(current);
      setError('');
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Could not load workspaces.';
      if (message === 'SESSION_EXPIRED') window.location.assign(signInUrl());
      else setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(false);
  }, [load]);

  const isAdmin = isAdministrator(member?.role);
  const memberDeptIds = useMemo(
    () => new Set(member?.departments?.map((dept) => dept.id) ?? []),
    [member],
  );

  const visibleDepartments = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return departments;
    return departments.filter(
      (dept) =>
        dept.name.toLowerCase().includes(q) ||
        (dept.description ?? '').toLowerCase().includes(q),
    );
  }, [departments, search]);

  async function saveDepartment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setFormError('');
    const data = new FormData(event.currentTarget);
    const payload = {
      name: String(data.get('name') ?? '').trim(),
      description: String(data.get('description') ?? '').trim(),
      isActive: editing ? data.get('isActive') === 'on' : undefined,
    };

    try {
      if (editing) {
        await api.patch<Department>(`/team/departments/${encodeURIComponent(editing.id)}`, {
          version: editing.version,
          ...payload,
        });
      } else {
        await api.post<Department>('/team/departments', {
          name: payload.name,
          description: payload.description || undefined,
        });
      }
      setModalOpen(false);
      setEditing(null);
      await load(true);
    } catch (cause) {
      setFormError(cause instanceof Error ? cause.message : 'Could not save workspace.');
    } finally {
      setSaving(false);
    }
  }

  async function openManageMembers(department: Department) {
    setManaging(department);
    setMemberActionError('');
    setSelectedMemberId('');
    setMembersLoading(true);
    try {
      const [currentDeptMembers, teamList] = await Promise.all([
        api.get<DepartmentMember[]>(`/team/departments/${encodeURIComponent(department.id)}/members`, { force: true }),
        api.get<ManagedMember[]>('/team/members?status=active'),
      ]);
      setDeptMembers(currentDeptMembers);
      setAllMembers(teamList);
    } catch (cause) {
      setMemberActionError(cause instanceof Error ? cause.message : 'Could not load workspace members.');
    } finally {
      setMembersLoading(false);
    }
  }

  async function addMemberToDepartment(event: FormEvent) {
    event.preventDefault();
    if (!managing || !selectedMemberId) return;
    setMemberSaving(true);
    setMemberActionError('');
    try {
      await api.post(`/team/departments/${encodeURIComponent(managing.id)}/members`, {
        teamMemberId: selectedMemberId,
      });
      setSelectedMemberId('');
      await Promise.all([openManageMembers(managing), load(true)]);
    } catch (cause) {
      setMemberActionError(cause instanceof Error ? cause.message : 'Could not add member.');
    } finally {
      setMemberSaving(false);
    }
  }

  async function removeMemberFromDepartment(teamMemberId: string, name: string) {
    if (!managing || !window.confirm(`Remove ${name} from ${managing.name}?`)) return;
    setMemberSaving(true);
    setMemberActionError('');
    try {
      await api.delete(
        `/team/departments/${encodeURIComponent(managing.id)}/members/${encodeURIComponent(teamMemberId)}`,
      );
      await Promise.all([openManageMembers(managing), load(true)]);
    } catch (cause) {
      setMemberActionError(cause instanceof Error ? cause.message : 'Could not remove member.');
    } finally {
      setMemberSaving(false);
    }
  }

  const assignedMemberIds = new Set(deptMembers.map((item) => item.teamMember.id));
  const availableToAdd = allMembers.filter((item) => item.isActive && !assignedMemberIds.has(item.id));

  return (
    <div className="page-content">
      <div className="page-heading">
        <div>
          <h1>Workspaces</h1>
          <p className="page-subtitle">
            Choose a department workspace to open its projects, tools, tasks, and team members.
          </p>
        </div>
        {isAdmin && (
          <div className="page-heading-actions">
            <button
              className="button button-primary"
              onClick={() => {
                setEditing(null);
                setFormError('');
                setModalOpen(true);
              }}
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              New workspace
            </button>
          </div>
        )}
      </div>

      {departments.length > 3 && (
        <div className="project-filters">
          <div className="marketing-search-box" style={{ maxWidth: 320 }}>
            <Search className="marketing-search-icon" aria-hidden="true" />
            <input
              type="search"
              className="field-input marketing-search-input"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Filter workspaces…"
              aria-label="Filter workspaces"
            />
          </div>
        </div>
      )}

      {error && (
        <div className="inline-message error" role="alert">
          {error}
          <button className="button button-quiet" onClick={() => void load(true)}>Reload</button>
        </div>
      )}

      {loading ? (
        <div className="workspace-grid">
          {[1, 2, 3, 4].map((item) => <div className="loading-skeleton" key={item} />)}
        </div>
      ) : visibleDepartments.length > 0 ? (
        <div className="workspace-grid">
          {visibleDepartments.map((department) => {
            const isMember = memberDeptIds.has(department.id);
            const projectCount = department._count?.projects ?? 0;
            const memberCount = department._count?.members ?? 0;

            return (
              <article
                className={`workspace-card ${department.isActive ? '' : 'is-inactive'}`}
                key={department.id}
              >
                <Link
                  href={`/workspaces/${encodeURIComponent(department.slug)}`}
                  className="workspace-card-main"
                >
                  <div className="workspace-card-top">
                    <div className="workspace-card-icon-wrap">
                      <DepartmentIcon name={department.name} size={20} />
                    </div>
                    <div className="workspace-card-badges">
                      {!department.isActive ? (
                        <span className="dept-status-pill is-inactive">Archived</span>
                      ) : isMember ? (
                        <span className="workspace-member-badge">Your team</span>
                      ) : null}
                      <span className="project-card-open">
                        Enter <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                      </span>
                    </div>
                  </div>

                  <h3>{department.name}</h3>
                  <p className="workspace-card-desc">
                    {department.description || 'Open this workspace to view projects, tasks, and collaborators.'}
                  </p>

                  <div className="workspace-card-stats">
                    <span>
                      <FolderKanban className="w-3.5 h-3.5" aria-hidden="true" />
                      {projectCount} {projectCount === 1 ? 'project' : 'projects'}
                    </span>
                    <span>
                      <Users className="w-3.5 h-3.5" aria-hidden="true" />
                      {memberCount} {memberCount === 1 ? 'member' : 'members'}
                    </span>
                  </div>
                </Link>

                {isAdmin && (
                  <div className="workspace-card-admin">
                    <button
                      type="button"
                      className="button button-secondary compact-button"
                      onClick={() => void openManageMembers(department)}
                    >
                      <Users className="w-3.5 h-3.5" aria-hidden="true" />
                      Members
                    </button>
                    <button
                      type="button"
                      className="button button-secondary compact-button"
                      onClick={() => {
                        setEditing(department);
                        setFormError('');
                        setModalOpen(true);
                      }}
                    >
                      <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                      Edit
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      ) : (
        <section className="empty-state">
          <div>
            <h3>{search.trim() ? 'No matching workspaces' : 'No workspaces yet'}</h3>
            <p>
              {search.trim()
                ? 'Try clearing the filter to see every department workspace.'
                : 'Workspaces represent departments across the organization.'}
            </p>
            {isAdmin && !search.trim() && (
              <button
                className="button button-primary"
                onClick={() => {
                  setEditing(null);
                  setFormError('');
                  setModalOpen(true);
                }}
              >
                Create workspace
              </button>
            )}
          </div>
        </section>
      )}

      {modalOpen && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setModalOpen(false);
              setEditing(null);
            }
          }}
        >
          <section className="modal" role="dialog" aria-modal="true" aria-labelledby="workspace-modal-title" style={{ borderTop: '2.5px solid rgba(59, 130, 246, 0.75)' }}>
            <div className="modal-header">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="modal-dot" style={{ backgroundColor: '#60a5fa' }} />
                  <h2 id="workspace-modal-title" style={{ margin: 0 }}>
                    {editing ? 'Edit workspace' : 'New workspace'}
                  </h2>
                </div>
                <p style={{ marginTop: '4px' }}>Organize department projects, tasks, and member access.</p>
              </div>
              <button
                className="icon-button"
                aria-label="Close"
                onClick={() => {
                  setModalOpen(false);
                  setEditing(null);
                }}
              >
                ×
              </button>
            </div>
            <form className="form-stack" onSubmit={saveDepartment}>
              {formError && <p className="form-error" role="alert">{formError}</p>}
              <label className="field-label">
                Workspace name
                <input
                  className="field-input"
                  name="name"
                  key={`ws-name-${editing?.id ?? 'new'}`}
                  defaultValue={editing?.name ?? ''}
                  placeholder="e.g. Marketing & Growth"
                  minLength={2}
                  maxLength={80}
                  required
                  autoFocus
                />
              </label>
              <label className="field-label">
                Description <span className="subtle-link">Optional</span>
                <textarea
                  className="field-textarea"
                  name="description"
                  key={`ws-desc-${editing?.id ?? 'new'}`}
                  defaultValue={editing?.description ?? ''}
                  placeholder="Department goals, projects, or scope"
                  maxLength={400}
                />
              </label>
              {editing && (
                <label className="marketing-checkbox-row">
                  <input type="checkbox" name="isActive" defaultChecked={editing.isActive} />
                  <span>Workspace is active and available for new projects</span>
                </label>
              )}
              <div className="form-footer">
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => {
                    setModalOpen(false);
                    setEditing(null);
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="button button-primary" disabled={saving}>
                  {saving ? 'Saving…' : editing ? 'Save changes' : 'Create workspace'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {managing && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setManaging(null);
          }}
        >
          <section className="modal project-member-modal" role="dialog" aria-modal="true" aria-labelledby="manage-ws-members-title" style={{ borderTop: '2.5px solid rgba(99, 102, 241, 0.75)' }}>
            <div className="modal-header">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="modal-dot" style={{ backgroundColor: '#818cf8' }} />
                  <h2 id="manage-ws-members-title" style={{ margin: 0 }}>{managing.name} members</h2>
                </div>
                <p style={{ marginTop: '4px' }}>Assign or remove active team members in this department workspace.</p>
              </div>
              <button className="icon-button" aria-label="Close" onClick={() => setManaging(null)}>×</button>
            </div>
            <div className="form-stack">
              {memberActionError && <p className="form-error" role="alert">{memberActionError}</p>}
              <form className="project-member-add" onSubmit={addMemberToDepartment}>
                <label className="field-label" style={{ gridColumn: 'span 2' }}>
                  Add active member
                  <select
                    className="filter-select"
                    value={selectedMemberId}
                    disabled={memberSaving}
                    onChange={(event) => setSelectedMemberId(event.target.value)}
                    required
                  >
                    <option value="" disabled>
                      {availableToAdd.length ? 'Select member…' : 'All active members are assigned'}
                    </option>
                    {availableToAdd.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} ({item.email})
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="submit"
                  className="button button-primary"
                  disabled={memberSaving || !selectedMemberId}
                >
                  Add
                </button>
              </form>

              <div className="project-member-list-heading">
                <strong>Current members</strong>
                <span>{deptMembers.length}</span>
              </div>

              {membersLoading ? (
                <div className="loading-skeleton" />
              ) : (
                <div className="project-member-list">
                  {deptMembers.map((entry) => (
                    <div className="project-member-row" key={entry.id}>
                      <Avatar size="sm" className="size-8" seed={entry.teamMember.name} styleType="open-peeps" />
                      <div className="project-member-identity">
                        <strong>{entry.teamMember.name}</strong>
                        <small>{entry.teamMember.email} · {roleLabels[entry.teamMember.role] ?? entry.teamMember.role}</small>
                      </div>
                      <button
                        type="button"
                        className="button button-quiet compact-button danger-action"
                        disabled={memberSaving}
                        onClick={() => void removeMemberFromDepartment(entry.teamMember.id, entry.teamMember.name)}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  {deptMembers.length === 0 && (
                    <p className="project-members-empty">No members assigned to this workspace yet.</p>
                  )}
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
