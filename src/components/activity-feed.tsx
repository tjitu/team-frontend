'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ActivityPage as ActivityPageData, ActivityRecord, api, signInUrl } from '@/lib/api';

type ActivityScope = 'team' | 'project';

const eventTypes = [
  'PROJECT_CREATED', 'PROJECT_UPDATED', 'PROJECT_ARCHIVED',
  'PROJECT_MEMBER_ADDED', 'PROJECT_MEMBER_ROLE_CHANGED', 'PROJECT_MEMBER_REMOVED',
  'TASK_CREATED', 'TASK_UPDATED', 'TASK_ARCHIVED', 'TASK_COMMENT_ADDED',
  'TEAM_MEMBER_ACTIVATED', 'TEAM_MEMBER_DEACTIVATED', 'TEAM_MEMBER_ROLE_CHANGED',
  'TEAM_INVITATION_CREATED', 'TEAM_INVITATION_RESENT', 'TEAM_INVITATION_REVOKED', 'TEAM_INVITATION_ACCEPTED',
  'DEPARTMENT_CREATED', 'DEPARTMENT_UPDATED', 'DEPARTMENT_MEMBER_ADDED', 'DEPARTMENT_MEMBER_REACTIVATED', 'DEPARTMENT_MEMBER_REMOVED',
];

const eventLabels: Record<string, string> = {
  PROJECT_CREATED: 'Proyek dibuat', PROJECT_UPDATED: 'Proyek diperbarui', PROJECT_ARCHIVED: 'Proyek diarsipkan',
  PROJECT_MEMBER_ADDED: 'Anggota proyek ditambahkan', PROJECT_MEMBER_ROLE_CHANGED: 'Role proyek diubah', PROJECT_MEMBER_REMOVED: 'Anggota proyek dikeluarkan',
  TASK_CREATED: 'Task dibuat', TASK_UPDATED: 'Task diperbarui', TASK_ARCHIVED: 'Task diarsipkan', TASK_COMMENT_ADDED: 'Komentar task ditambahkan',
  TEAM_MEMBER_ACTIVATED: 'Akses anggota diaktifkan', TEAM_MEMBER_DEACTIVATED: 'Akses anggota dinonaktifkan', TEAM_MEMBER_ROLE_CHANGED: 'Role tim diubah',
  TEAM_INVITATION_CREATED: 'Undangan dibuat', TEAM_INVITATION_RESENT: 'Undangan dikirim ulang', TEAM_INVITATION_REVOKED: 'Undangan dicabut', TEAM_INVITATION_ACCEPTED: 'Undangan diterima',
  DEPARTMENT_CREATED: 'Departemen dibuat', DEPARTMENT_UPDATED: 'Departemen diperbarui', DEPARTMENT_MEMBER_ADDED: 'Anggota departemen ditambahkan', DEPARTMENT_MEMBER_REACTIVATED: 'Anggota departemen diaktifkan kembali', DEPARTMENT_MEMBER_REMOVED: 'Anggota departemen dikeluarkan',
};

const entityLabels: Record<string, string> = {
  PROJECT: 'Proyek', PROJECT_MEMBER: 'Keanggotaan proyek', TASK: 'Task', TASK_COMMENT: 'Komentar',
  TEAM_MEMBER: 'Anggota tim', TEAM_INVITATION: 'Undangan', DEPARTMENT: 'Departemen', DEPARTMENT_MEMBER: 'Anggota departemen',
};

const fieldLabels: Record<string, string> = {
  title: 'judul', description: 'deskripsi', status: 'status', priority: 'prioritas', dueAt: 'tanggal jatuh tempo',
  assigneeIds: 'assignee', name: 'nama', role: 'role', isActive: 'status akses',
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
  const email = text(metadata.email, 'anggota tim');
  switch (activity.eventType) {
    case 'PROJECT_CREATED': return `membuat proyek ${text(metadata.name, '')}`;
    case 'PROJECT_UPDATED': return `memperbarui proyek ${text(after.name, activity.project?.name ?? '')}`;
    case 'PROJECT_ARCHIVED': return `mengarsipkan proyek ${activity.project?.name ?? ''}`;
    case 'PROJECT_MEMBER_ADDED': return 'menambahkan anggota ke proyek';
    case 'PROJECT_MEMBER_ROLE_CHANGED': return `mengubah role anggota proyek${typeof metadata.after === 'string' ? ` menjadi ${metadata.after}` : ''}`;
    case 'PROJECT_MEMBER_REMOVED': return 'mengeluarkan anggota dari proyek';
    case 'TASK_CREATED': return `membuat task ${text(metadata.title, '')}`;
    case 'TASK_UPDATED': {
      const fields = Object.keys(after).filter((key) => JSON.stringify(before[key]) !== JSON.stringify(after[key])).map((key) => fieldLabels[key] ?? key);
      return `memperbarui task ${text(after.title, '')}${fields.length ? ` · ${fields.join(', ')}` : ''}`;
    }
    case 'TASK_ARCHIVED': return 'mengarsipkan task';
    case 'TASK_COMMENT_ADDED': return 'menambahkan komentar pada task';
    case 'TEAM_MEMBER_ACTIVATED': return `mengaktifkan akses ${email}`;
    case 'TEAM_MEMBER_DEACTIVATED': return `menonaktifkan akses ${email}`;
    case 'TEAM_MEMBER_ROLE_CHANGED': return `mengubah role ${email}${typeof metadata.after === 'string' ? ` menjadi ${metadata.after.replaceAll('_', ' ')}` : ''}`;
    case 'TEAM_INVITATION_CREATED': return `mengundang ${email}`;
    case 'TEAM_INVITATION_RESENT': return `mengirim ulang undangan ke ${email}`;
    case 'TEAM_INVITATION_REVOKED': return `mencabut undangan untuk ${email}`;
    case 'TEAM_INVITATION_ACCEPTED': return `${email} menerima undangan tim`;
    case 'DEPARTMENT_CREATED': return `membuat departemen ${text(metadata.name, '')}`;
    case 'DEPARTMENT_UPDATED': return `memperbarui departemen ${text(after.name, text(before.name, ''))}`;
    case 'DEPARTMENT_MEMBER_ADDED': return `menambahkan ${email} ke departemen`;
    case 'DEPARTMENT_MEMBER_REACTIVATED': return `menambahkan kembali ${email} ke departemen`;
    case 'DEPARTMENT_MEMBER_REMOVED': return `mengeluarkan ${email} dari departemen`;
    default: return activity.eventType.toLowerCase().replaceAll('_', ' ');
  }
}

function dateTime(value: string) {
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
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
      const message = cause instanceof Error ? cause.message : 'Gagal memuat aktivitas berikutnya.';
      if (message === 'SESSION_EXPIRED') window.location.assign(signInUrl());
      else setError(message);
    } finally {
      setLoadingMore(false);
    }
  }

  const title = scope === 'team' ? 'Aktivitas tim' : 'Aktivitas proyek';

  return (
    <div className="page-content">
      <div className="page-heading"><div><h1>{title}</h1><p className="page-subtitle">Riwayat perubahan dan aktivitas terbaru.</p></div>{scope === 'project' && projectId && <Link className="button button-secondary" href={`/projects/${encodeURIComponent(projectId)}`}>Kembali ke proyek</Link>}</div>
      <div className="activity-toolbar">
        <span className="activity-count">{loading ? 'Memuat aktivitas…' : `${items.length} aktivitas ditampilkan`}</span>
        <div className="toolbar-filters">
          <label><span className="sr-only">Filter jenis aktivitas</span><select className="filter-select" value={eventType} onChange={(event) => setEventType(event.target.value)}><option value="">Semua aktivitas</option>{eventTypes.map((type) => <option value={type} key={type}>{eventLabels[type]}</option>)}</select></label>
          <label><span className="sr-only">Filter jenis objek</span><select className="filter-select" value={entityType} onChange={(event) => setEntityType(event.target.value)}><option value="">Semua objek</option>{Object.entries(entityLabels).map(([type, label]) => <option value={type} key={type}>{label}</option>)}</select></label>
          <label><span className="sr-only">Filter pelaku</span><select className="filter-select" value={actorId} onChange={(event) => setActorId(event.target.value)}><option value="">Semua pelaku</option>{[...actors.entries()].sort((a, b) => a[1].localeCompare(b[1], 'id')).map(([id, name]) => <option value={id} key={id}>{name}</option>)}</select></label>
        </div>
      </div>

      {error && <div className="inline-message error" role="alert">{error}<button className="button button-quiet" onClick={() => setReloadKey((value) => value + 1)}>Coba lagi</button></div>}
      {loading ? <div className="activity-loading"><div className="loading-skeleton" /><div className="loading-skeleton" /></div> : items.length ? <div className="activity-list">
        {items.map((item) => <article className="activity-item" key={item.id}>
          <div className="activity-avatar avatar" aria-hidden="true">{initials(item.actor.name)}</div>
          <div className="activity-copy"><div className="activity-main"><strong>{item.actor.name}</strong><span>{summaryFor(item)}</span></div><div className="activity-meta"><time dateTime={item.createdAt}>{dateTime(item.createdAt)}</time><span className="activity-entity">{entityLabels[item.entityType] ?? item.entityType}</span>{scope === 'team' && item.project && <Link className="activity-project-link" href={`/projects/${encodeURIComponent(item.project.id)}`}>{item.project.name}</Link>}</div></div>
        </article>)}
      </div> : <section className="empty-state"><div><div className="empty-state-icon" aria-hidden="true">A</div><h3>Tidak ada aktivitas</h3><p>{eventType || entityType || actorId ? 'Coba ubah filter aktivitas.' : 'Aktivitas baru akan tercatat di sini saat tim bekerja.'}</p></div></section>}

      {!loading && hasMore && <div className="activity-load-more"><button className="button button-secondary" onClick={() => void loadMore()} disabled={loadingMore}>{loadingMore ? 'Memuat…' : 'Muat aktivitas sebelumnya'}</button></div>}
    </div>
  );
}
