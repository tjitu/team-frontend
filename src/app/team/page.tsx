'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { api, CurrentMember, InvitationStatus, isAdministrator, ManagedMember, signInUrl, TeamInvitation, TeamRole } from '@/lib/api';

type Tab = 'members' | 'invitations';

const roleLabels: Record<TeamRole, string> = {
  SYSTEM_OWNER: 'System Owner',
  SYSTEM_ADMIN: 'System Admin',
  MEMBER: 'Member',
};

const invitationLabels: Record<InvitationStatus, string> = {
  PENDING: 'Pending',
  SENT: 'Sent',
  FAILED: 'Failed to send',
  ACCEPTED: 'Accepted',
  REVOKED: 'Revoked',
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
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [tab, setTab] = useState<Tab>('members');
  const [query, setQuery] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');
  const [memberStatus, setMemberStatus] = useState('true');
  const [invitationStatus, setInvitationStatus] = useState('open');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [busyInvitation, setBusyInvitation] = useState('');
  const [busyMember, setBusyMember] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const member = await api.get<CurrentMember>('/team/me');
      setCurrentMember(member);
      if (!isAdministrator(member.role)) {
        setMembers([]);
        setInvitations([]);
        setError('This page is only available to System Owners and System Admins.');
        return;
      }
      const memberParams = new URLSearchParams();
      if (memberStatus) memberParams.set('isActive', memberStatus);
      if (appliedQuery.trim()) memberParams.set('q', appliedQuery.trim());
      const [memberList, invitationList] = await Promise.all([
        api.get<ManagedMember[]>(`/team/members?${memberParams.toString()}`),
        api.get<TeamInvitation[]>('/team/invitations'),
      ]);
      setMembers(memberList);
      setInvitations(invitationList);
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

  async function createInvitation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setFormError('');
    const data = new FormData(event.currentTarget);
    const email = String(data.get('email') ?? '').trim();
    const role = String(data.get('role') ?? 'MEMBER') as TeamRole;
    try {
      const created = await api.post<Pick<TeamInvitation, 'id' | 'email' | 'role' | 'status' | 'expiresAt'>>('/team/invitations', { email, role });
      setCreateOpen(false);
      setTab('invitations');
      setInvitationStatus('open');
      setNotice(created.status === 'FAILED'
        ? `Invitation for ${created.email} was saved, but the email could not be sent. Try resending it.`
        : `Invitation for ${created.email} sent successfully.`);
      await load();
    } catch (cause) {
      setFormError(cause instanceof Error ? cause.message : 'Could not create the invitation.');
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

  async function runInvitationAction(invitation: TeamInvitation, action: 'resend' | 'revoke') {
    if (invitation.status === 'ACCEPTED' || invitation.status === 'REVOKED') return;
    if (invitation.role === 'SYSTEM_ADMIN' && currentMember?.role !== 'SYSTEM_OWNER') return;
    if (action === 'revoke' && !window.confirm(`Revoke the invitation for ${invitation.email}?`)) return;
    setBusyInvitation(invitation.id);
    setError('');
    setNotice('');
    try {
      const result = await api.post<{ status?: InvitationStatus }>(`/team/invitations/${encodeURIComponent(invitation.id)}/${action}`);
      if (action === 'resend') {
        setNotice(result.status === 'FAILED'
          ? `The invitation email to ${invitation.email} could not be sent.`
          : `The invitation to ${invitation.email} was resent successfully.`);
      } else {
        setNotice(`The invitation to ${invitation.email} has been revoked.`);
      }
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not complete the invitation action.');
    } finally {
      setBusyInvitation('');
    }
  }

  async function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAppliedQuery(query);
  }

  const shownInvitations = invitations.filter((invitation) => invitationStatus === 'all'
    || (invitationStatus === 'open' && invitation.status !== 'ACCEPTED' && invitation.status !== 'REVOKED')
    || (invitationStatus === 'closed' && (invitation.status === 'ACCEPTED' || invitation.status === 'REVOKED')));

  return (
    <div className="page-content">
      <div className="page-heading">
        <div>
          <h1>Team members</h1>
          <p className="page-subtitle">Manage members access and workspace invitations.</p>
        </div>
        {isAdministrator(currentMember?.role) && <button className="button button-primary" onClick={() => { setFormError(''); setCreateOpen(true); }}><span className="button-symbol" aria-hidden="true">+</span>Invite members</button>}
      </div>

      {error && <div className="inline-message error" role="alert">{error}{(!currentMember || isAdministrator(currentMember.role)) && <button className="button button-quiet" onClick={() => void load()}>Reload</button>}</div>}
      {notice && <div className="inline-message success" role="status">{notice}<button className="icon-button" aria-label="Close pesan" onClick={() => setNotice('')}>×</button></div>}

      <div className="team-tabs" role="tablist" aria-label="Team management">
        <button className={`team-tab ${tab === 'members' ? 'is-active' : ''}`} role="tab" aria-selected={tab === 'members'} onClick={() => setTab('members')}>Members <span>{loading ? '' : members.length}</span></button>
        <button className={`team-tab ${tab === 'invitations' ? 'is-active' : ''}`} role="tab" aria-selected={tab === 'invitations'} onClick={() => setTab('invitations')}>Invitations <span>{loading ? '' : invitations.filter(({ status }) => status !== 'ACCEPTED' && status !== 'REVOKED').length}</span></button>
      </div>

      {tab === 'members' ? <>
        <form className="team-toolbar" onSubmit={submitSearch}>
          <label className="team-search-label"><span className="sr-only">Search members</span><input className="search-input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name or email…" /></label>
          <div className="toolbar-filters">
            <label><span className="sr-only">Member status</span><select className="filter-select" value={memberStatus} onChange={(event) => setMemberStatus(event.target.value)}><option value="true">Active members</option><option value="false">Inactive members</option><option value="">All members</option></select></label>
            <button className="button button-secondary" type="submit">Search</button>
          </div>
        </form>
        {loading ? <div className="loading-skeleton" aria-label="Loading member" /> : members.length ? <div className="task-table-wrap">
          <table className="task-table team-table">
            <thead><tr><th>Member</th><th>Team role</th><th>Department</th><th>Joined</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead>
            <tbody>{members.map((member) => {
              const canChangeRole = currentMember?.role === 'SYSTEM_OWNER' && member.role !== 'SYSTEM_OWNER';
              const canToggle = member.role !== 'SYSTEM_OWNER' && (member.role !== 'SYSTEM_ADMIN' || currentMember?.role === 'SYSTEM_OWNER') && (member.id !== currentMember?.id || member.isActive);
              return <tr key={member.id}>
                <td><div className="team-person"><span className="avatar">{initials(member.name)}</span><span><strong>{member.name}</strong><small>{member.email}</small></span></div></td>
                <td>{canChangeRole ? <label><span className="sr-only">Role {member.name}</span><select className="filter-select compact-select" value={member.role} disabled={busyMember === member.id} onChange={(event) => void updateMemberRole(member, event.target.value as TeamRole)}><option value="MEMBER">Member</option><option value="SYSTEM_ADMIN">System Admin</option></select></label> : <span className="role-label">{roleLabels[member.role]}</span>}</td>
                <td><span className="department-list">{member.departments?.length ? member.departments.map(({ name }) => name).join(', ') : 'Not set'}</span></td>
                <td className="due-date">{dateLabel(member.createdAt)}</td>
                <td><span className={`member-status ${member.isActive ? 'is-enabled' : 'is-disabled'}`}>{member.isActive ? 'Active' : 'Inactive'}</span></td>
                <td className="team-action-cell">{canToggle && <button className="button button-quiet compact-button" disabled={busyMember === member.id} onClick={() => void toggleMemberStatus(member)}>{member.isActive ? 'Deactivate' : 'Activate'}</button>}</td>
              </tr>;
            })}</tbody>
          </table>
        </div> : <section className="empty-state"><div><div className="empty-state-icon" aria-hidden="true" /><h3>No members</h3><p>{appliedQuery || memberStatus !== 'true' ? 'Try changing your search or status filter.' : 'Members who have joined will appear here.'}</p></div></section>}
      </> : <>
        <div className="team-toolbar">
          <p className="page-subtitle">Invitations are valid for 72 hours. Failed invitations can be retried.</p>
          <label><span className="sr-only">Filter invitation</span><select className="filter-select" value={invitationStatus} onChange={(event) => setInvitationStatus(event.target.value)}><option value="open">Open</option><option value="closed">Done</option><option value="all">All invitations</option></select></label>
        </div>
        {loading ? <div className="loading-skeleton" aria-label="Loading invitation" /> : shownInvitations.length ? <div className="task-table-wrap">
          <table className="task-table team-table invitation-table">
            <thead><tr><th>Email</th><th>Role</th><th>Status</th><th>Created by</th><th>Expires</th><th><span className="sr-only">Actions</span></th></tr></thead>
            <tbody>{shownInvitations.map((invitation) => {
              const isOpen = invitation.status !== 'ACCEPTED' && invitation.status !== 'REVOKED';
              const canAct = isOpen && (invitation.role !== 'SYSTEM_ADMIN' || currentMember?.role === 'SYSTEM_OWNER');
              return <tr key={invitation.id}>
                <td><strong>{invitation.email}</strong></td>
                <td><span className="role-label">{roleLabels[invitation.role]}</span></td>
                <td><span className={`invitation-status status-${invitation.status}`}>{invitationLabels[invitation.status]}</span></td>
                <td>{invitation.createdBy.name}</td>
                <td className="due-date">{dateLabel(invitation.expiresAt)}</td>
                <td className="team-action-cell">{canAct && <div className="invitation-actions"><button className="button button-quiet compact-button" disabled={busyInvitation === invitation.id} onClick={() => void runInvitationAction(invitation, 'resend')}>Resend</button><button className="button button-quiet compact-button danger-action" disabled={busyInvitation === invitation.id} onClick={() => void runInvitationAction(invitation, 'revoke')}>Revoke</button></div>}</td>
              </tr>;
            })}</tbody>
          </table>
        </div> : <section className="empty-state"><div><div className="empty-state-icon" aria-hidden="true">+</div><h3>No invitations</h3><p>{invitationStatus === 'closed' ? 'Accepted or revoked invitations will appear here.' : 'Invite new members to give them access to the workspace.'}</p>{isAdministrator(currentMember?.role) && <button className="button button-primary" onClick={() => { setFormError(''); setCreateOpen(true); }}>Invite members</button>}</div></section>}
      </>}

      {!isAdministrator(currentMember?.role) && !loading && <div className="team-back-link"><Link className="button button-secondary" href="/">Back to workspace</Link></div>}

      {createOpen && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setCreateOpen(false); }}>
        <section className="modal" role="dialog" aria-modal="true" aria-labelledby="invite-member-title">
          <div className="modal-header"><div><h2 id="invite-member-title">Invite members</h2><p>The invitation will be sent by email and is valid for 72 hours.</p></div><button className="icon-button" aria-label="Close" onClick={() => setCreateOpen(false)}>×</button></div>
          <form className="form-stack" onSubmit={createInvitation}>
            {formError && <p className="form-error" role="alert">{formError}</p>}
            <label className="field-label">Email address<input className="field-input" name="email" type="email" placeholder="name@company.com" maxLength={320} autoComplete="email" required autoFocus /></label>
            <label className="field-label">Team role<select className="filter-select" name="role" defaultValue="MEMBER"><option value="MEMBER">Member</option>{currentMember?.role === 'SYSTEM_OWNER' && <option value="SYSTEM_ADMIN">System Admin</option>}</select></label>
            <p className="invite-permission-note">{currentMember?.role === 'SYSTEM_OWNER' ? 'The System Owner role can only be assigned during bootstrap.' : 'You can invite members. Only a System Owner can invite a System Admin.'}</p>
            <div className="form-footer"><button className="button button-secondary" type="button" onClick={() => setCreateOpen(false)}>Cancel</button><button className="button button-primary" disabled={saving}>{saving ? 'Sending…' : 'Send invitation'}</button></div>
          </form>
        </section>
      </div>}
    </div>
  );
}
