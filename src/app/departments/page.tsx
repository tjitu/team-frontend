'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { api, CurrentMember, Department, DepartmentMember, isAdministrator, signInUrl, TeamRole } from '@/lib/api';

const roleLabels: Record<TeamRole, string> = { SYSTEM_OWNER: 'System Owner', SYSTEM_ADMIN: 'System Admin', MEMBER: 'Member' };

function dateLabel(value: string) {
  return new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(value));
}

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('');
}

export default function DepartmentsPage() {
  const [member, setMember] = useState<CurrentMember | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('active');
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [managing, setManaging] = useState<Department | null>(null);
  const [departmentMembers, setDepartmentMembers] = useState<DepartmentMember[]>([]);
  const [saving, setSaving] = useState(false);
  const [busyMember, setBusyMember] = useState('');
  const [formError, setFormError] = useState('');
  const [memberError, setMemberError] = useState('');

  async function load() {
    setLoading(true);
    try {
      const [currentMember, list] = await Promise.all([
        api.get<CurrentMember>('/team/me'),
        api.get<Department[]>('/team/departments'),
      ]);
      setMember(currentMember);
      setDepartments(list);
      setError('');
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Could not load departments.';
      if (message === 'SESSION_EXPIRED') window.location.assign(signInUrl());
      else setError(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  const canManage = isAdministrator(member?.role);
  const visibleDepartments = useMemo(() => departments.filter((department) => {
    const matchesStatus = !canManage || activeFilter === 'all' || (activeFilter === 'active' ? department.isActive : !department.isActive);
    const matchesQuery = !query.trim() || `${department.name} ${department.description ?? ''}`.toLowerCase().includes(query.trim().toLowerCase());
    return matchesStatus && matchesQuery;
  }), [departments, canManage, activeFilter, query]);

  async function saveDepartment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setFormError('');
    const data = new FormData(event.currentTarget);
    const body = {
      name: String(data.get('name') ?? '').trim(),
      description: String(data.get('description') ?? '').trim(),
    };
    try {
      if (editing) {
        await api.patch<Department>(`/team/departments/${encodeURIComponent(editing.id)}`, { ...body, version: editing.version });
        setNotice(`Department ${body.name} updated.`);
        setEditing(null);
      } else {
        await api.post<Department>('/team/departments', body);
        setNotice(`Department ${body.name} was created.`);
        setCreateOpen(false);
      }
      await load();
    } catch (cause) {
      setFormError(cause instanceof Error ? cause.message : 'Could not save the department.');
    } finally {
      setSaving(false);
    }
  }

  async function toggleDepartmentStatus(department: Department) {
    const isActive = !department.isActive;
    const action = isActive ? 'activate' : 'deactivate';
    if (!window.confirm(`Are you sure you want to ${action} the ${department.name} department?`)) return;
    setSaving(true);
    setFormError('');
    try {
      await api.patch(`/team/departments/${encodeURIComponent(department.id)}`, { version: department.version, isActive });
      setNotice(`The ${department.name} department was ${isActive ? 'activated' : 'deactivated'}.`);
      setEditing(null);
      await load();
    } catch (cause) {
      setFormError(cause instanceof Error ? cause.message : 'Could not update department status.');
    } finally {
      setSaving(false);
    }
  }

  async function openDepartmentMembers(department: Department) {
    setManaging(department);
    setMemberError('');
    try {
      const list = await api.get<DepartmentMember[]>(`/team/departments/${encodeURIComponent(department.id)}/members?limit=500`);
      setDepartmentMembers(list);
    } catch (cause) {
      setMemberError(cause instanceof Error ? cause.message : 'Could not load department members.');
      setDepartmentMembers([]);
    }
  }

  async function addDepartmentMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!managing) return;
    setSaving(true);
    setMemberError('');
    const data = new FormData(event.currentTarget);
    const email = String(data.get('email') ?? '').trim();
    try {
      await api.post(`/team/departments/${encodeURIComponent(managing.id)}/members`, { email });
      setNotice(`${email} was added to ${managing.name}.`);
      await openDepartmentMembers(managing);
      await load();
    } catch (cause) {
      setMemberError(cause instanceof Error ? cause.message : 'Could not add the member.');
    } finally {
      setSaving(false);
    }
  }

  async function removeDepartmentMember(item: DepartmentMember) {
    if (!managing || !window.confirm(`Remove ${item.teamMember.name} from ${managing.name}?`)) return;
    setBusyMember(item.teamMember.id);
    setMemberError('');
    try {
      await api.delete(`/team/departments/${encodeURIComponent(managing.id)}/members/${encodeURIComponent(item.teamMember.id)}`);
      setNotice(`${item.teamMember.name} was removed from ${managing.name}.`);
      await openDepartmentMembers(managing);
      await load();
    } catch (cause) {
      setMemberError(cause instanceof Error ? cause.message : 'Could not remove the member.');
    } finally {
      setBusyMember('');
    }
  }

  return (
    <div className="page-content">
      <div className="page-heading">
        <div><h1>Departments</h1><p className="page-subtitle">{canManage ? 'Manage team structure and department membership.' : 'View departments available in the workspace.'}</p></div>
        {canManage && <button className="button button-primary" onClick={() => { setFormError(''); setEditing(null); setCreateOpen(true); }}><span className="button-symbol" aria-hidden="true">+</span>New department</button>}
      </div>

      {error && <div className="inline-message error" role="alert">{error}<button className="button button-quiet" onClick={() => void load()}>Reload</button></div>}
      {notice && <div className="inline-message success" role="status">{notice}<button className="icon-button" aria-label="Close message" onClick={() => setNotice('')}>×</button></div>}

      <div className="department-toolbar">
        <label className="team-search-label"><span className="sr-only">Search departments</span><input className="search-input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search departments…" /></label>
        {canManage && <label><span className="sr-only">Department status</span><select className="filter-select" value={activeFilter} onChange={(event) => setActiveFilter(event.target.value)}><option value="active">Active departments</option><option value="inactive">Inactive departments</option><option value="all">All departments</option></select></label>}
      </div>

      {loading ? <div className="department-grid" aria-label="Loading departments">{[1, 2, 3].map((item) => <div className="loading-skeleton" key={item} />)}</div> : visibleDepartments.length ? <div className="department-grid">
        {visibleDepartments.map((department) => <article className={`department-card ${!department.isActive ? 'is-inactive' : ''}`} key={department.id}>
          <div className="department-card-top"><span className="project-card-mark">{department.name.slice(0, 1).toUpperCase()}</span><span className={`member-status ${department.isActive ? 'is-enabled' : 'is-disabled'}`}>{department.isActive ? 'Active' : 'Inactive'}</span></div>
          <h2>{department.name}</h2>
          <p>{department.description || 'No department description yet.'}</p>
          <div className="department-card-meta"><span>{department._count?.members ?? 0} active members</span><span>Updated {dateLabel(department.updatedAt)}</span></div>
          <div className="department-card-actions">{canManage && <><button className="button button-secondary" disabled={!department.isActive} onClick={() => void openDepartmentMembers(department)}>Manage members</button><button className="button button-quiet" onClick={() => { setFormError(''); setEditing(department); }}>Edit</button></>}</div>
        </article>)}
      </div> : <section className="empty-state"><div><div className="empty-state-icon" aria-hidden="true" /><h3>{query ? 'No departments found' : 'No departments yet'}</h3><p>{query ? 'Try a different search term.' : canManage ? 'Create departments to organize your team members.' : 'Active departments will appear here.'}</p>{canManage && !query && <button className="button button-primary" onClick={() => { setEditing(null); setFormError(''); setCreateOpen(true); }}>Create department</button>}</div></section>}

      {(createOpen || editing) && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) { setCreateOpen(false); setEditing(null); } }}>
        <section className="modal" role="dialog" aria-modal="true" aria-labelledby="department-form-title">
          <div className="modal-header"><div><h2 id="department-form-title">{editing ? 'Edit department' : 'Create department'}</h2><p>{editing ? 'Update the department name, description, or status.' : 'Enter the basic details for the new department.'}</p></div><button className="icon-button" aria-label="Close" onClick={() => { setCreateOpen(false); setEditing(null); }}>×</button></div>
          <form className="form-stack" onSubmit={saveDepartment}>
            {formError && <p className="form-error" role="alert">{formError}</p>}
            <label className="field-label">Department name<input className="field-input" name="name" key={editing?.id ?? 'new'} defaultValue={editing?.name ?? ''} minLength={2} maxLength={100} placeholder="e.g. Engineering" required autoFocus /></label>
            <label className="field-label">Description <span className="subtle-link">Optional</span><textarea className="field-textarea" name="description" key={`description-${editing?.id ?? 'new'}`} defaultValue={editing?.description ?? ''} maxLength={1000} placeholder="Department responsibilities or focus" /></label>
            <div className="form-footer form-footer-between">{editing ? <button className={`button button-quiet ${editing.isActive ? 'danger-action' : ''}`} type="button" disabled={saving} onClick={() => void toggleDepartmentStatus(editing)}>{editing.isActive ? 'Deactivate' : 'Activate'}</button> : <span />}
              <div className="form-footer"><button className="button button-secondary" type="button" onClick={() => { setCreateOpen(false); setEditing(null); }}>Cancel</button><button className="button button-primary" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button></div>
            </div>
          </form>
        </section>
      </div>}

      {managing && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setManaging(null); }}>
        <section className="modal department-members-modal" role="dialog" aria-modal="true" aria-labelledby="department-members-title">
          <div className="modal-header"><div><h2 id="department-members-title">Members of {managing.name}</h2><p>Add active team members or remove them from this department.</p></div><button className="icon-button" aria-label="Close" onClick={() => setManaging(null)}>×</button></div>
          <div className="form-stack">
            {memberError && <p className="form-error" role="alert">{memberError}</p>}
            <form className="department-member-add" onSubmit={addDepartmentMember}><label className="field-label">Active member email<input className="field-input" name="email" type="email" maxLength={320} placeholder="name@company.com" required /></label><button className="button button-primary" disabled={saving || !managing.isActive}>{saving ? 'Adding…' : 'Add'}</button></form>
            <div className="project-member-list-heading"><strong>Current members</strong><span>{departmentMembers.length}</span></div>
            <div className="project-member-list">
              {departmentMembers.map((item) => <div className="department-member-row" key={item.id}><span className="avatar">{initials(item.teamMember.name)}</span><div className="project-member-identity"><strong>{item.teamMember.name}</strong><small>{item.teamMember.email} · {roleLabels[item.teamMember.role]}</small></div><button className="button button-quiet compact-button danger-action" disabled={busyMember === item.teamMember.id} onClick={() => void removeDepartmentMember(item)}>Remove</button></div>)}
              {!departmentMembers.length && !memberError && <p className="project-members-empty">No members in this department yet.</p>}
            </div>
          </div>
        </section>
      </div>}
    </div>
  );
}
