'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ActivityPage as ActivityPageData, ActivityRecord, api, signInUrl } from '@/lib/api';

type ActivityScope = 'team' | 'project';

const eventTypes = [
  'PROJECT_CREATED', 'PROJECT_UPDATED', 'PROJECT_ARCHIVED', 'PROJECT_RESTORED',
  'PROJECT_MEMBER_ADDED', 'PROJECT_MEMBER_ROLE_CHANGED', 'PROJECT_MEMBER_REMOVED',
  'TASK_CREATED', 'TASK_UPDATED', 'TASK_ARCHIVED', 'TASK_COMMENT_ADDED',
  'TEAM_MEMBER_ACTIVATED', 'TEAM_MEMBER_DEACTIVATED', 'TEAM_MEMBER_ROLE_CHANGED', 'TEAM_MEMBER_PROFILE_SYNCED',
  'TEAM_INVITATION_CREATED', 'TEAM_INVITATION_RESENT', 'TEAM_INVITATION_REVOKED', 'TEAM_INVITATION_ACCEPTED',
  'DEPARTMENT_CREATED', 'DEPARTMENT_UPDATED', 'DEPARTMENT_MEMBER_ADDED', 'DEPARTMENT_MEMBER_REACTIVATED', 'DEPARTMENT_MEMBER_REMOVED',
];

const eventLabels: Record<string, string> = {
  PROJECT_CREATED: 'Project created', PROJECT_UPDATED: 'Project updated', PROJECT_ARCHIVED: 'Project archived', PROJECT_RESTORED: 'Project restored',
  PROJECT_MEMBER_ADDED: 'Project member added', PROJECT_MEMBER_ROLE_CHANGED: 'Project role changed', PROJECT_MEMBER_REMOVED: 'Project member removed',
  TASK_CREATED: 'Task created', TASK_UPDATED: 'Task updated', TASK_ARCHIVED: 'Task archived', TASK_COMMENT_ADDED: 'Task comment added',
  TEAM_MEMBER_ACTIVATED: 'Member access enabled', TEAM_MEMBER_DEACTIVATED: 'Member access disabled', TEAM_MEMBER_ROLE_CHANGED: 'Team role changed', TEAM_MEMBER_PROFILE_SYNCED: 'Profile name updated',
  TEAM_INVITATION_CREATED: 'Invitation created', TEAM_INVITATION_RESENT: 'Invitation resent', TEAM_INVITATION_REVOKED: 'Invitation revoked', TEAM_INVITATION_ACCEPTED: 'Invitation accepted',
  DEPARTMENT_CREATED: 'Department created', DEPARTMENT_UPDATED: 'Department updated', DEPARTMENT_MEMBER_ADDED: 'Department member added', DEPARTMENT_MEMBER_REACTIVATED: 'Department member reactivated', DEPARTMENT_MEMBER_REMOVED: 'Department member removed',
};

const entityLabels: Record<string, string> = {
  PROJECT: 'Project', PROJECT_MEMBER: 'Project membership', TASK: 'Task', TASK_COMMENT: 'Comment',
  TEAM_MEMBER: 'Team member', TEAM_INVITATION: 'Invitation', DEPARTMENT: 'Department', DEPARTMENT_MEMBER: 'Department membership',
};

const fieldLabels: Record<string, string> = {
  title: 'title', description: 'description', status: 'status', priority: 'priority', dueAt: 'due date',
  assigneeIds: 'assignees', name: 'name', role: 'role', isActive: 'access status',
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function text(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

function summaryFor(activity: ActivityRecord) {
  const metadata = asRecord(activity.metadata);
  const before = asRecord(metadata.before);
  const after = asRecord(metadata.after);
  const email = text(metadata.email, 'team member');
  switch (activity.eventType) {
    case 'PROJECT_CREATED': return `created project ${text(metadata.name, '')}`;
    case 'PROJECT_UPDATED': return `updated project ${text(after.name, activity.project?.name ?? '')}`;
    case 'PROJECT_ARCHIVED': return `archived project ${activity.project?.name ?? ''}`;
    case 'PROJECT_RESTORED': return `restored project ${activity.project?.name ?? ''}`;
    case 'PROJECT_MEMBER_ADDED': return 'added a member to the project';
    case 'PROJECT_MEMBER_ROLE_CHANGED': return `changed a project member's role${typeof metadata.after === 'string' ? ` to ${metadata.after}` : ''}`;
    case 'PROJECT_MEMBER_REMOVED': return 'removed a member from the project';
    case 'TASK_CREATED': return `created task ${text(metadata.title, '')}`;
    case 'TASK_UPDATED': {
      const fields = Object.keys(after).filter((key) => JSON.stringify(before[key]) !== JSON.stringify(after[key])).map((key) => fieldLabels[key] ?? key);
      return `updated task ${text(after.title, '')}${fields.length ? ` · ${fields.join(', ')}` : ''}`;
    }
    case 'TASK_ARCHIVED': return 'archived a task';
    case 'TASK_COMMENT_ADDED': return 'added a comment to a task';
    case 'TEAM_MEMBER_ACTIVATED': return `enabled access for ${email}`;
    case 'TEAM_MEMBER_DEACTIVATED': return `disabled access for ${email}`;
    case 'TEAM_MEMBER_ROLE_CHANGED': return `changed ${email}'s role${typeof metadata.after === 'string' ? ` to ${metadata.after.replaceAll('_', ' ')}` : ''}`;
    case 'TEAM_MEMBER_PROFILE_SYNCED': return 'synced the display name from the Supabase profile';
    case 'TEAM_INVITATION_CREATED': return `invited ${email}`;
    case 'TEAM_INVITATION_RESENT': return `resent the invitation to ${email}`;
    case 'TEAM_INVITATION_REVOKED': return `revoked the invitation for ${email}`;
    case 'TEAM_INVITATION_ACCEPTED': return `${email} accepted the team invitation`;
    case 'DEPARTMENT_CREATED': return `created department ${text(metadata.name, '')}`;
    case 'DEPARTMENT_UPDATED': return `updated department ${text(after.name, text(before.name, ''))}`;
    case 'DEPARTMENT_MEMBER_ADDED': return `added ${email} to a department`;
    case 'DEPARTMENT_MEMBER_REACTIVATED': return `reactivated ${email} in a department`;
    case 'DEPARTMENT_MEMBER_REMOVED': return `removed ${email} from a department`;
    default: return activity.eventType.toLowerCase().replaceAll('_', ' ');
  }
}

function dateTime(value: string) {
  return new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('');
}

export function ActivityFeed({ scope, projectId }: { scope: ActivityScope; projectId?: string }) {
  const [items, setItems] = useState<ActivityRecord[]>([]);
  const [actors, setActors] = useState<Map<string, string>>(new Map());
  const [eventType, setEventType] = useState('');
  const [entityType, setEntityType] = useState('');
  const [actorId, setActorId] = useState('');
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const basePath = scope === 'team' ? '/team/activity' : `/team/projects/${encodeURIComponent(projectId ?? '')}/activity`;
  const query = useMemo(() => {
    const params = new URLSearchParams({ limit: '30' });
    if (eventType) params.set('eventType', eventType);
    if (entityType) params.set('entityType', entityType);
    if (actorId) params.set('actorId', actorId);
    return params;
  }, [eventType, entityType, actorId]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    api.get<ActivityPageData>(`${basePath}?${query.toString()}`).then((page) => {
      if (!active) return;
      setItems(page.items);
      setHasMore(page.hasMore);
      setNextCursor(page.nextCursor);
      setActors((previous) => {
        const next = new Map(previous);
        page.items.forEach((item) => next.set(item.actor.id, item.actor.name));
        return next;
      });
    }).catch((cause: Error) => {
      if (!active) return;
      setItems([]);
      setHasMore(false);
      setNextCursor(null);
      if (cause.message === 'SESSION_EXPIRED') window.location.assign(signInUrl());
      else setError(cause.message);
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [basePath, query, reloadKey]);

  async function loadMore() {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    setError('');
    const params = new URLSearchParams(query);
    params.set('cursor', nextCursor);
    try {
      const page = await api.get<ActivityPageData>(`${basePath}?${params.toString()}`);
      setItems((previous) => [...previous, ...page.items]);
      setHasMore(page.hasMore);
      setNextCursor(page.nextCursor);
      setActors((previous) => {
        const next = new Map(previous);
        page.items.forEach((item) => next.set(item.actor.id, item.actor.name));
        return next;
      });
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Could not load more activity.';
      if (message === 'SESSION_EXPIRED') window.location.assign(signInUrl());
      else setError(message);
    } finally {
      setLoadingMore(false);
    }
  }

  const title = scope === 'team' ? 'Team activity' : 'Project activity';

  return (
    <div className="page-content">
      <div className="page-heading"><div><h1>{title}</h1><p className="page-subtitle">Recent changes and activity.</p></div>{scope === 'project' && projectId && <Link className="button button-secondary" href={`/projects/${encodeURIComponent(projectId)}`}>Back to project</Link>}</div>
      <div className="activity-toolbar">
        <span className="activity-count">{loading ? 'Loading activity…' : `${items.length} activity ${items.length === 1 ? 'item' : 'items'}`}</span>
        <div className="toolbar-filters">
          <label><span className="sr-only">Filter activity type</span><select className="filter-select" value={eventType} onChange={(event) => setEventType(event.target.value)}><option value="">All activity</option>{eventTypes.map((type) => <option value={type} key={type}>{eventLabels[type]}</option>)}</select></label>
          <label><span className="sr-only">Filter by entity type</span><select className="filter-select" value={entityType} onChange={(event) => setEntityType(event.target.value)}><option value="">All entities</option>{Object.entries(entityLabels).map(([type, label]) => <option value={type} key={type}>{label}</option>)}</select></label>
          <label><span className="sr-only">Filter by actor</span><select className="filter-select" value={actorId} onChange={(event) => setActorId(event.target.value)}><option value="">All actors</option>{[...actors.entries()].sort((a, b) => a[1].localeCompare(b[1], 'en')).map(([id, name]) => <option value={id} key={id}>{name}</option>)}</select></label>
        </div>
      </div>

      {error && <div className="inline-message error" role="alert">{error}<button className="button button-quiet" onClick={() => setReloadKey((value) => value + 1)}>Reload</button></div>}
      {loading ? <div className="activity-loading"><div className="loading-skeleton" /><div className="loading-skeleton" /></div> : items.length ? <div className="activity-list">
        {items.map((item) => <article className="activity-item" key={item.id}>
          <div className="activity-avatar avatar" aria-hidden="true">{initials(item.actor.name)}</div>
          <div className="activity-copy"><div className="activity-main"><strong>{item.actor.name}</strong><span>{summaryFor(item)}</span></div><div className="activity-meta"><time dateTime={item.createdAt}>{dateTime(item.createdAt)}</time><span className="activity-entity">{entityLabels[item.entityType] ?? item.entityType}</span>{scope === 'team' && item.project && <Link className="activity-project-link" href={`/projects/${encodeURIComponent(item.project.id)}`}>{item.project.name}</Link>}</div></div>
        </article>)}
      </div> : <section className="empty-state"><div><div className="empty-state-icon" aria-hidden="true" /><h3>No activity yet</h3><p>{eventType || entityType || actorId ? 'Try changing the activity filters.' : 'New activity will appear here as your team works.'}</p></div></section>}

      {!loading && hasMore && <div className="activity-load-more"><button className="button button-secondary" onClick={() => void loadMore()} disabled={loadingMore}>{loadingMore ? 'Loading…' : 'Load earlier activity'}</button></div>}
    </div>
  );
}
