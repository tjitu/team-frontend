'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api, Project, signInUrl } from '@/lib/api';

function formatDate(value: string) {
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(value));
}

export default function ArchivedProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [restoring, setRestoring] = useState('');

  useEffect(() => {
    let active = true;
    api.get<Project[]>('/team/projects/archived').then((items) => {
      if (active) setProjects(items);
    }).catch((cause) => {
      if (!active) return;
      const message = cause instanceof Error ? cause.message : 'Arsip proyek gagal dimuat.';
      if (message === 'SESSION_EXPIRED') window.location.assign(signInUrl());
      else setError(message);
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function restoreProject(project: Project) {
    setRestoring(project.id);
    setError('');
    try {
      await api.post<Project>(`/team/projects/${encodeURIComponent(project.id)}/restore`);
      window.location.assign('/');
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Proyek gagal dipulihkan.';
      if (message === 'SESSION_EXPIRED') window.location.assign(signInUrl());
      else setError(message);
      setRestoring('');
    }
  }

  return <div className="page-content">
    <div className="page-heading">
      <div><p className="page-eyebrow">Ruang kerja</p><h1>Proyek diarsipkan</h1><p className="page-subtitle">Tinjau proyek yang diarsipkan dan pulihkan jika ingin melanjutkannya.</p></div>
      <Link className="button button-secondary" href="/">Kembali ke proyek</Link>
    </div>
    {error && <div className="inline-message error" role="alert">{error}</div>}
    {loading ? <div className="project-grid" aria-label="Memuat arsip proyek">{[1, 2].map((item) => <div className="loading-skeleton" key={item} />)}</div> : projects.length ? <div className="project-grid">
      {projects.map((project) => <article className="project-card archived-project-card" key={project.id}>
        <div className="project-card-top"><span className="project-card-mark">{project.name.slice(0, 1).toUpperCase()}</span><span className="archived-project-badge">Diarsipkan {project.archivedAt ? formatDate(project.archivedAt) : ''}</span></div>
        <h3>{project.name}</h3>
        <p className="project-description">{project.description || 'Belum ada deskripsi untuk proyek ini.'}</p>
        <p className="project-card-metadata">{project.department.name} · Pemilik {project.createdBy.name}</p>
        <div className="archived-project-actions"><button className="button button-primary" disabled={restoring === project.id} onClick={() => void restoreProject(project)}>{restoring === project.id ? 'Memulihkan…' : 'Pulihkan proyek'}</button></div>
      </article>)}
    </div> : <section className="empty-state"><div><div className="empty-state-icon" aria-hidden="true" /><h3>Tidak ada proyek di arsip</h3><p>Proyek yang kamu arsipkan dan kelola akan muncul di sini.</p></div></section>}
  </div>;
}
