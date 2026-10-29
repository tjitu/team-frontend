'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { api, CurrentMember, isAdministrator, Project, signInUrl } from '@/lib/api';

function formatDate(value: string) {
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value));
}

export default function HomePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [member, setMember] = useState<CurrentMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  async function load() {
    setLoading(true);
    try {
      const [projectList, currentMember] = await Promise.all([
        api.get<Project[]>('/team/projects'),
        api.get<CurrentMember>('/team/me'),
      ]);
      setProjects(projectList);
      setMember(currentMember);
      setError('');
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Data ruang kerja gagal dimuat.';
      if (message === 'SESSION_EXPIRED') window.location.assign(signInUrl());
      else setError(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  async function createProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setFormError('');
    const data = new FormData(event.currentTarget);
    try {
      await api.post<Project>('/team/projects', {
        name: String(data.get('name') ?? '').trim(),
        description: String(data.get('description') ?? '').trim(),
      });
      setCreateOpen(false);
      await load();
    } catch (cause) {
      setFormError(cause instanceof Error ? cause.message : 'Proyek gagal dibuat.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page-content">
      <div className="page-heading">
        <div>
          <h1>Ikhtisar proyek</h1>
          <p className="page-subtitle">{member?.name ? `Selamat datang, ${member.name.split(' ')[0]}. ` : ''}Pantau proyek aktif dan perkembangan kerja tim.</p>
        </div>
        {isAdministrator(member?.role) && <button className="button button-primary" onClick={() => setCreateOpen(true)}><span className="button-symbol" aria-hidden="true">+</span>Proyek baru</button>}
      </div>

      {error && <div className="inline-message error" role="alert">{error}<button className="button button-quiet" onClick={() => void load()}>Muat ulang</button></div>}
      <div className="section-heading">
        <h2>Proyek aktif</h2>
        {!loading && <span>{projects.length} proyek</span>}
      </div>

      {loading ? (
        <div className="project-grid" aria-label="Memuat proyek">
          {[1, 2, 3].map((item) => <div className="loading-skeleton" key={item} />)}
        </div>
      ) : projects.length > 0 ? (
        <div className="project-grid">
          {projects.map((project) => (
            <Link className="project-card" href={`/projects/${project.id}`} key={project.id}>
              <div className="project-card-top">
                <span className="project-card-mark">{project.name.slice(0, 1).toUpperCase()}</span>
                <span className="member-count">{project._count?.members ?? 0} anggota</span>
              </div>
              <h3 title={project.name}>{project.name}</h3>
              <p className="project-description">{project.description || 'Belum ada deskripsi untuk proyek ini.'}</p>
              <div className="project-card-footer"><span>Diperbarui {formatDate(project.updatedAt)}</span><span className="arrow" aria-hidden="true">↗</span></div>
            </Link>
          ))}
        </div>
      ) : (
        <section className="empty-state">
          <div>
            <div className="empty-state-icon" aria-hidden="true" />
            <h3>Belum ada proyek aktif</h3>
            <p>{isAdministrator(member?.role) ? 'Buat proyek pertama untuk mulai mengelola pekerjaan tim.' : 'Proyek yang melibatkan akun Anda akan ditampilkan di sini.'}</p>
            {isAdministrator(member?.role) && <button className="button button-primary" onClick={() => setCreateOpen(true)}>Buat proyek</button>}
          </div>
        </section>
      )}

      {createOpen && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setCreateOpen(false); }}>
        <section className="modal" role="dialog" aria-modal="true" aria-labelledby="create-project-title">
          <div className="modal-header"><div><h2 id="create-project-title">Buat proyek</h2><p>Proyek baru akan tersedia bagi tim Anda.</p></div><button className="icon-button" aria-label="Tutup" onClick={() => setCreateOpen(false)}>×</button></div>
          <form className="form-stack" onSubmit={createProject}>
            {formError && <p className="form-error" role="alert">{formError}</p>}
            <label className="field-label">Nama proyek<input className="field-input" name="name" placeholder="Contoh: Pengembangan Produk" minLength={2} maxLength={120} required autoFocus /></label>
            <label className="field-label">Deskripsi <span className="subtle-link">Opsional</span><textarea className="field-textarea" name="description" placeholder="Tujuan atau ringkasan proyek" maxLength={2000} /></label>
            <div className="form-footer"><button className="button button-secondary" type="button" onClick={() => setCreateOpen(false)}>Batal</button><button className="button button-primary" disabled={saving}>{saving ? 'Menyimpan…' : 'Buat proyek'}</button></div>
          </form>
        </section>
      </div>}
    </div>
  );
}
