'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { api, CurrentMember, isAdministrator, ManagedMember, signInUrl, TeamRole } from '@/lib/api';

const roleLabels: Record<TeamRole, string> = {
  SYSTEM_OWNER: 'System Owner',
  SYSTEM_ADMIN: 'System Admin',
  MEMBER: 'Member',
};

function dateLabel(value: string) {
  return new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(value));
}

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('');
}

export default function TeamPage() {
  const [currentMember, setCurrentMember] = useState<CurrentMember | null>(null);
  const [members, setMembers] = useState<ManagedMember[]>([]);
  const [query, setQuery] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');
  const [memberStatus, setMemberStatus] = useState('true');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [busyMember, setBusyMember] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const member = await api.get<CurrentMember>('/team/me');
      setCurrentMember(member);
      if (!isAdministrator(member.role)) {
        setMembers([]);
        setError('This page is only available to System Owners and System Admins.');
        return;
      }
      const memberParams = new URLSearchParams();
      if (memberStatus) memberParams.set('isActive', memberStatus);
      if (appliedQuery.trim()) memberParams.set('q', appliedQuery.trim());
      const memberList = await api.get<ManagedMember[]>(`/team/members?${memberParams.toString()}`);
      setMembers(memberList);
      setError('');
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Could not load team data.';
      if (message === 'SESSION_EXPIRED') window.location.assign(signInUrl());
      else setError(message);
    } finally {
      setLoading(false);
    }
  }, [appliedQuery, memberStatus]);

  useEffect(() => { void load(); }, [load]);

  async function createMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setSaving(true);
    setFormError('');
    const data = new FormData(event.currentTarget);
    const email = String(data.get('email') ?? '').trim();
    try {
      const created = await api.post<{ email: string }>('/team/members', {
        email,
        name: String(data.get('name') ?? '').trim(),
        role: String(data.get('role') ?? 'MEMBER'),
        password: String(data.get('password') ?? ''),
      });
      setCreateOpen(false);
      setQuery('');
      setAppliedQuery('');
      setMemberStatus('true');
      setNotice(`Account for ${created.email} is ready. Share the initial password with them securely.`);
      form.reset();
      try {
        const memberList = await api.get<ManagedMember[]>('/team/members?isActive=true');
        setMembers(memberList);
      } catch {
        setError('The account was created, but the member list could not be refreshed. Reload the page.');
      }
    } catch (cause) {
      setFormError(cause instanceof Error ? cause.message : 'Could not create the team account.');
    } finally {
      setSaving(false);
    }
  }

  async function updateMemberRole(member: ManagedMember, role: TeamRole) {
    if (currentMember?.role !== 'SYSTEM_OWNER' || member.role === 'SYSTEM_OWNER') return;
    setBusyMember(member.id);
    setError('');
    setNotice('');
    try {
      await api.patch(`/team/members/${encodeURIComponent(member.id)}/role`, { role });
      setNotice(`${member.name}'s role was updated to ${roleLabels[role]}.`);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not update role.');
    } finally {
      setBusyMember('');
    }
  }

  async function toggleMemberStatus(member: ManagedMember) {
    const nextActive = !member.isActive;
    if (member.role === 'SYSTEM_OWNER' || (member.role === 'SYSTEM_ADMIN' && currentMember?.role !== 'SYSTEM_OWNER') || (member.id === currentMember?.id && !nextActive)) return;
    const action = nextActive ? 'activate' : 'deactivate';
    if (!window.confirm(`Are you sure you want to ${action} access for ${member.name}?`)) return;
    setBusyMember(member.id);
    setError('');
    setNotice('');
    try {
      await api.patch(`/team/members/${encodeURIComponent(member.id)}/status`, { isActive: nextActive });
      setNotice(`Access for ${member.name} was ${nextActive ? 'activated' : 'deactivated'}.`);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not update member status.');
    } finally {
      setBusyMember('');
    }
  }

  async function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAppliedQuery(query);
  }

  return (
    <div className="page-content">
      <div className="page-heading">
        <div>
          <h1>Team members</h1>
          <p className="page-subtitle">Manage workspace accounts, access, and roles.</p>
        </div>
        {isAdministrator(currentMember?.role) && <button className="button button-primary" onClick={() => { setFormError(''); setCreateOpen(true); }}><span className="button-symbol" aria-hidden="true">+</span>Add member</button>}
      </div>

      {error && <div className="inline-message error" role="alert">{error}{(!currentMember || isAdministrator(currentMember.role)) && <button className="button button-quiet" onClick={() => void load()}>Reload</button>}</div>}
      {notice && <div className="inline-message success" role="status">{notice}<button className="icon-button" aria-label="Dismiss message" onClick={() => setNotice('')}>×</button></div>}

      <form className="team-toolbar" onSubmit={submitSearch}>
        <label className="team-search-label"><span className="sr-only">Search members</span><input className="search-input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name or email…" /></label>
        <div className="toolbar-filters">
          <label><span className="sr-only">Member status</span><select className="filter-select" value={memberStatus} onChange={(event) => setMemberStatus(event.target.value)}><option value="true">Active members</option><option value="false">Inactive members</option><option value="">All members</option></select></label>
          <button className="button button-secondary" type="submit">Search</button>
        </div>
      </form>
      {loading ? <div className="loading-skeleton" aria-label="Loading members" /> : members.length ? <div className="task-table-wrap">
        <table className="task-table team-table">
          <thead><tr><th>Member</th><th>Team role</th><th>Department</th><th>Joined</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead>
          <tbody>{members.map((member) => {
            const canChangeRole = currentMember?.role === 'SYSTEM_OWNER' && member.role !== 'SYSTEM_OWNER';
            const canToggle = member.role !== 'SYSTEM_OWNER' && (member.role !== 'SYSTEM_ADMIN' || currentMember?.role === 'SYSTEM_OWNER') && (member.id !== currentMember?.id || member.isActive);
            return <tr key={member.id}>
              <td><div className="team-person"><span className="avatar">{initials(member.name)}</span><span><strong>{member.name}</strong><small>{member.email}</small></span></div></td>
              <td>{canChangeRole ? <label><span className="sr-only">Role {member.name}</span><select className="filter-select compact-select" value={member.role} disabled={busyMember === member.id} onChange={(event) => void updateMemberRole(member, event.target.value as TeamRole)}><option value="MEMBER">Member</option><option value="SYSTEM_ADMIN">System Admin</option></select></label> : <span className="role-label">{roleLabels[member.role]}</span>}</td>
              <td>{member.departments?.length
                ? <span className="department-list">{member.departments.map(({ department }) => department.name).join(', ')}</span>
                : member.role === 'SYSTEM_OWNER' || member.role === 'SYSTEM_ADMIN'
                  ? <span className="team-workspace-scope">Workspace-wide</span>
                  : <span className="department-list">Not assigned</span>}</td>
              <td className="due-date">{dateLabel(member.createdAt)}</td>
              <td><span className={`member-status ${member.isActive ? 'is-enabled' : 'is-disabled'}`}>{member.isActive ? 'Active' : 'Inactive'}</span></td>
              <td className="team-action-cell">{canToggle && <button className={`button button-quiet compact-button ${member.isActive ? 'danger-action' : ''}`} disabled={busyMember === member.id} onClick={() => void toggleMemberStatus(member)}>{member.isActive ? 'Deactivate' : 'Activate'}</button>}</td>
            </tr>;
          })}</tbody>
        </table>
      </div> : <section className="empty-state"><div><div className="empty-state-icon" aria-hidden="true" /><h3>No members</h3><p>{appliedQuery || memberStatus !== 'true' ? 'Try changing your search or status filter.' : 'Add a team account to give someone workspace access.'}</p>{isAdministrator(currentMember?.role) && <button className="button button-primary" onClick={() => { setFormError(''); setCreateOpen(true); }}>Add member</button>}</div></section>}

      {!isAdministrator(currentMember?.role) && !loading && <div className="team-back-link"><Link className="button button-secondary" href="/">Back to workspace</Link></div>}

      {createOpen && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setCreateOpen(false); }}>
        <section className="modal" role="dialog" aria-modal="true" aria-labelledby="create-member-title">
          <div className="modal-header"><div><h2 id="create-member-title">Add team member</h2><p>Create a sign-in account and assign its workspace role.</p></div><button className="icon-button" aria-label="Close" onClick={() => setCreateOpen(false)}>×</button></div>
          <form className="form-stack" onSubmit={createMember}>
            {formError && <p className="form-error" role="alert">{formError}</p>}
            <label className="field-label">Full name<input className="field-input" name="name" minLength={2} maxLength={120} autoComplete="name" required autoFocus /></label>
            <label className="field-label">Email address<input className="field-input" name="email" type="email" placeholder="name@company.com" maxLength={320} autoComplete="email" required /></label>
            {currentMember?.role === 'SYSTEM_OWNER' ? <label className="field-label">Team role<select className="filter-select" name="role" defaultValue="MEMBER"><option value="MEMBER">Member</option><option value="SYSTEM_ADMIN">System Admin</option></select></label> : <label className="field-label">Team role<input className="field-input" value="Member" readOnly /><input type="hidden" name="role" value="MEMBER" /><span className="subtle-link">Only a System Owner can create System Admin accounts.</span></label>}
            <label className="field-label">Initial password<input className="field-input" name="password" type="password" minLength={12} maxLength={72} autoComplete="new-password" required /><span className="subtle-link">Use at least 12 characters. Share it with the member through a secure channel.</span></label>
            <div className="form-footer"><button className="button button-secondary" type="button" onClick={() => setCreateOpen(false)}>Cancel</button><button className="button button-primary" disabled={saving}>{saving ? 'Creating account…' : 'Create account'}</button></div>
          </form>
        </section>
      </div>}
    </div>
  );
}
