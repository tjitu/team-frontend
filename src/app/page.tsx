'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { api, CurrentMember, Department, Project, signInUrl } from '@/lib/api';

function formatDate(value: string) {
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(value));
}

export default function HomePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [member, setMember] = useState<CurrentMember | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [projectQuery, setProjectQuery] = useState('');
  const [appliedProjectQuery, setAppliedProjectQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [ownerFilter, setOwnerFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const owners = useMemo(() => {
    const uniqueOwners = new Map(projects.map(({ createdBy }) => [createdBy.id, createdBy]));
    return [...uniqueOwners.values()].sort((left, right) => left.name.localeCompare(right.name, 'id'));
  }, [projects]);
  const visibleProjects = useMemo(() => {
    const normalizedQuery = appliedProjectQuery.trim().toLocaleLowerCase();
    return projects.filter((project) =>
      (!departmentFilter || project.departmentId === departmentFilter) &&
      (!ownerFilter || project.createdBy.id === ownerFilter) &&
      (!normalizedQuery || `${project.name} ${project.description ?? ''}`.toLocaleLowerCase().includes(normalizedQuery)),
    );
  }, [projects, departmentFilter, ownerFilter, appliedProjectQuery]);
  const hasProjectFilters = Boolean(appliedProjectQuery || departmentFilter || ownerFilter);

  async function load() {
    setLoading(true);
    try {
      const [projectList, currentMember, departmentList] = await Promise.all([
        api.get<Project[]>('/team/projects'),
        api.get<CurrentMember>('/team/me'),
        api.get<Department[]>('/team/departments'),
      ]);
      setProjects(projectList);
      setMember(currentMember);
      setDepartments(departmentList.filter((department) => department.isActive));
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
        departmentId: String(data.get('departmentId') ?? ''),
        startsAt: data.get('startsAt') ? new Date(`${String(data.get('startsAt'))}T00:00:00.000Z`).toISOString() : undefined,
        endsAt: data.get('endsAt') ? new Date(`${String(data.get('endsAt'))}T00:00:00.000Z`).toISOString() : undefined,
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
          <p className="page-eyebrow">Ruang kerja</p>
          <h1>Ikhtisar proyek</h1>
          <p className="page-subtitle">{member?.name ? `Selamat datang, ${member.name.split(' ')[0]}. ` : ''}Pantau proyek aktif dan perkembangan kerja tim.</p>
        </div>
        {member && <button className="button button-primary" onClick={() => setCreateOpen(true)}><span className="button-symbol" aria-hidden="true">+</span>Proyek baru</button>}
      </div>

      {error && <div className="inline-message error" role="alert">{error}<button className="button button-quiet" onClick={() => void load()}>Muat ulang</button></div>}
      <div className="section-heading project-overview-heading">
        <div><h2>Proyek aktif</h2><p>Pilih proyek untuk melihat task dan aktivitas tim.</p></div>
        {!loading && <span className="section-count">{visibleProjects.length} proyek</span>}
      </div>

      {!loading && projects.length > 0 && <form className="project-list-toolbar" onSubmit={(event) => { event.preventDefault(); setAppliedProjectQuery(projectQuery); }}>
        <input className="search-input" value={projectQuery} onChange={(event) => setProjectQuery(event.target.value)} placeholder="Cari proyek…" aria-label="Cari proyek" />
        <label><span className="sr-only">Filter departemen</span><select className="filter-select" value={departmentFilter} onChange={(event) => setDepartmentFilter(event.target.value)}><option value="">Semua departemen</option>{departments.map((department) => <option value={department.id} key={department.id}>{department.name}</option>)}</select></label>
        <label><span className="sr-only">Filter pemilik proyek</span><select className="filter-select" value={ownerFilter} onChange={(event) => setOwnerFilter(event.target.value)}><option value="">Semua pemilik</option>{owners.map((owner) => <option value={owner.id} key={owner.id}>{owner.name}</option>)}</select></label>
        <button className="button button-secondary" type="submit">Cari</button>
        {hasProjectFilters && <button className="button button-quiet" type="button" onClick={() => { setProjectQuery(''); setAppliedProjectQuery(''); setDepartmentFilter(''); setOwnerFilter(''); }}>Reset</button>}
      </form>}

      {loading ? (
        <div className="project-grid" aria-label="Memuat proyek">
          {[1, 2, 3].map((item) => <div className="loading-skeleton" key={item} />)}
        </div>
      ) : visibleProjects.length > 0 ? (
        <div className="project-grid">
          {visibleProjects.map((project) => (
            <Link className="project-card" href={`/projects/${project.id}`} key={project.id}>
              <div className="project-card-top">
                <span className="project-card-mark">{project.name.slice(0, 1).toUpperCase()}</span>
                <span className="project-card-open">Buka proyek <span aria-hidden="true">↗</span></span>
              </div>
              <h3 title={project.name}>{project.name}</h3>
              <p className="project-description">{project.description || 'Belum ada deskripsi untuk proyek ini.'}</p>
              <p className="project-card-metadata">{project.department.name} · Pemilik {project.createdBy.name}</p>
              <div className="project-card-footer"><span className="project-member-summary"><span className="mini-people-icon" aria-hidden="true" />{project._count?.members ?? 0} anggota</span><span>{project.startsAt || project.endsAt ? `${project.startsAt ? formatDate(project.startsAt) : '—'} – ${project.endsAt ? formatDate(project.endsAt) : '—'}` : `Diperbarui ${formatDate(project.updatedAt)}`}</span></div>
            </Link>
          ))}
        </div>
      ) : (
        <section className="empty-state">
          <div>
            <div className="empty-state-icon" aria-hidden="true" />
            <h3>{hasProjectFilters ? 'Proyek tidak ditemukan' : 'Belum ada proyek aktif'}</h3>
            <p>{hasProjectFilters ? 'Coba ubah kata kunci atau filter yang digunakan.' : member ? 'Buat proyek pertama untuk mulai mengelola pekerjaan tim.' : 'Proyek yang melibatkan akun Anda akan ditampilkan di sini.'}</p>
            {hasProjectFilters ? <button className="button button-secondary" onClick={() => { setProjectQuery(''); setAppliedProjectQuery(''); setDepartmentFilter(''); setOwnerFilter(''); }}>Reset filter</button> : member && <button className="button button-primary" onClick={() => setCreateOpen(true)}>Buat proyek</button>}
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
            <label className="field-label">Departemen<select className="filter-select" name="departmentId" required defaultValue=""><option value="" disabled>Pilih departemen</option>{departments.map((department) => <option value={department.id} key={department.id}>{department.name}</option>)}</select></label>
            <div className="detail-meta"><label className="field-label">Mulai<input className="field-input" name="startsAt" type="date" /></label><label className="field-label">Selesai<input className="field-input" name="endsAt" type="date" /></label></div>
            <div className="form-footer"><button className="button button-secondary" type="button" onClick={() => setCreateOpen(false)}>Batal</button><button className="button button-primary" disabled={saving}>{saving ? 'Menyimpan…' : 'Buat proyek'}</button></div>
          </form>
        </section>
      </div>}
    </div>
  );
}
