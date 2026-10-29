'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { api, CurrentMember, Department, DepartmentMember, isAdministrator, signInUrl, TeamRole } from '@/lib/api';

const roleLabels: Record<TeamRole, string> = { SYSTEM_OWNER: 'System Owner', SYSTEM_ADMIN: 'System Admin', MEMBER: 'Anggota' };

function dateLabel(value: string) {
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value));
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
      const message = cause instanceof Error ? cause.message : 'Gagal memuat departemen.';
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
        setNotice(`Departemen ${body.name} diperbarui.`);
        setEditing(null);
      } else {
        await api.post<Department>('/team/departments', body);
        setNotice(`Departemen ${body.name} dibuat.`);
        setCreateOpen(false);
      }
      await load();
    } catch (cause) {
      setFormError(cause instanceof Error ? cause.message : 'Departemen gagal disimpan.');
    } finally {
      setSaving(false);
    }
  }

  async function toggleDepartmentStatus(department: Department) {
    const isActive = !department.isActive;
    const action = isActive ? 'mengaktifkan' : 'menonaktifkan';
    if (!window.confirm(`Yakin ingin ${action} departemen ${department.name}?`)) return;
    setSaving(true);
    setFormError('');
    try {
      await api.patch(`/team/departments/${encodeURIComponent(department.id)}`, { version: department.version, isActive });
      setNotice(`Departemen ${department.name} berhasil ${isActive ? 'diaktifkan' : 'dinonaktifkan'}.`);
      setEditing(null);
      await load();
    } catch (cause) {
      setFormError(cause instanceof Error ? cause.message : 'Status departemen gagal diperbarui.');
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
      setMemberError(cause instanceof Error ? cause.message : 'Anggota departemen gagal dimuat.');
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
      setNotice(`${email} ditambahkan ke ${managing.name}.`);
      await openDepartmentMembers(managing);
      await load();
    } catch (cause) {
      setMemberError(cause instanceof Error ? cause.message : 'Anggota gagal ditambahkan.');
    } finally {
      setSaving(false);
    }
  }

  async function removeDepartmentMember(item: DepartmentMember) {
    if (!managing || !window.confirm(`Keluarkan ${item.teamMember.name} dari ${managing.name}?`)) return;
    setBusyMember(item.teamMember.id);
    setMemberError('');
    try {
      await api.delete(`/team/departments/${encodeURIComponent(managing.id)}/members/${encodeURIComponent(item.teamMember.id)}`);
      setNotice(`${item.teamMember.name} dikeluarkan dari ${managing.name}.`);
      await openDepartmentMembers(managing);
      await load();
    } catch (cause) {
      setMemberError(cause instanceof Error ? cause.message : 'Anggota gagal dikeluarkan.');
    } finally {
      setBusyMember('');
    }
  }

  return (
    <div className="page-content">
      <div className="page-heading">
        <div><h1>Departemen</h1><p className="page-subtitle">{canManage ? 'Kelola struktur tim dan keanggotaan departemen.' : 'Lihat departemen yang tersedia di workspace.'}</p></div>
        {canManage && <button className="button button-primary" onClick={() => { setFormError(''); setEditing(null); setCreateOpen(true); }}><span className="button-symbol" aria-hidden="true">+</span>Departemen baru</button>}
      </div>

      {error && <div className="inline-message error" role="alert">{error}<button className="button button-quiet" onClick={() => void load()}>Muat ulang</button></div>}
      {notice && <div className="inline-message success" role="status">{notice}<button className="icon-button" aria-label="Tutup pesan" onClick={() => setNotice('')}>×</button></div>}

      <div className="department-toolbar">
        <label className="team-search-label"><span className="sr-only">Cari departemen</span><input className="search-input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari departemen…" /></label>
        {canManage && <label><span className="sr-only">Status departemen</span><select className="filter-select" value={activeFilter} onChange={(event) => setActiveFilter(event.target.value)}><option value="active">Departemen aktif</option><option value="inactive">Nonaktif</option><option value="all">Semua departemen</option></select></label>}
      </div>

      {loading ? <div className="department-grid" aria-label="Memuat departemen">{[1, 2, 3].map((item) => <div className="loading-skeleton" key={item} />)}</div> : visibleDepartments.length ? <div className="department-grid">
        {visibleDepartments.map((department) => <article className={`department-card ${!department.isActive ? 'is-inactive' : ''}`} key={department.id}>
          <div className="department-card-top"><span className="project-card-mark">{department.name.slice(0, 1).toUpperCase()}</span><span className={`member-status ${department.isActive ? 'is-enabled' : 'is-disabled'}`}>{department.isActive ? 'Aktif' : 'Nonaktif'}</span></div>
          <h2>{department.name}</h2>
          <p>{department.description || 'Belum ada deskripsi departemen.'}</p>
          <div className="department-card-meta"><span>{department._count?.members ?? 0} anggota aktif</span><span>Diperbarui {dateLabel(department.updatedAt)}</span></div>
          <div className="department-card-actions">{canManage && <><button className="button button-secondary" disabled={!department.isActive} onClick={() => void openDepartmentMembers(department)}>Kelola anggota</button><button className="button button-quiet" onClick={() => { setFormError(''); setEditing(department); }}>Edit</button></>}</div>
        </article>)}
      </div> : <section className="empty-state"><div><div className="empty-state-icon" aria-hidden="true" /><h3>{query ? 'Departemen tidak ditemukan' : 'Belum ada departemen'}</h3><p>{query ? 'Coba kata kunci lain.' : canManage ? 'Buat departemen untuk mengelompokkan anggota tim.' : 'Departemen yang aktif akan muncul di sini.'}</p>{canManage && !query && <button className="button button-primary" onClick={() => { setEditing(null); setFormError(''); setCreateOpen(true); }}>Buat departemen</button>}</div></section>}

      {(createOpen || editing) && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) { setCreateOpen(false); setEditing(null); } }}>
        <section className="modal" role="dialog" aria-modal="true" aria-labelledby="department-form-title">
          <div className="modal-header"><div><h2 id="department-form-title">{editing ? 'Edit departemen' : 'Buat departemen'}</h2><p>{editing ? 'Perbarui nama, deskripsi, atau status departemen.' : 'Isi informasi dasar departemen baru.'}</p></div><button className="icon-button" aria-label="Tutup" onClick={() => { setCreateOpen(false); setEditing(null); }}>×</button></div>
          <form className="form-stack" onSubmit={saveDepartment}>
            {formError && <p className="form-error" role="alert">{formError}</p>}
            <label className="field-label">Nama departemen<input className="field-input" name="name" key={editing?.id ?? 'new'} defaultValue={editing?.name ?? ''} minLength={2} maxLength={100} placeholder="Contoh: Engineering" required autoFocus /></label>
            <label className="field-label">Deskripsi <span className="subtle-link">Opsional</span><textarea className="field-textarea" name="description" key={`description-${editing?.id ?? 'new'}`} defaultValue={editing?.description ?? ''} maxLength={1000} placeholder="Tanggung jawab atau fokus departemen" /></label>
            <div className="form-footer form-footer-between">{editing ? <button className="button button-quiet danger-action" type="button" disabled={saving} onClick={() => void toggleDepartmentStatus(editing)}>{editing.isActive ? 'Nonaktifkan' : 'Aktifkan'}</button> : <span />}
              <div className="form-footer"><button className="button button-secondary" type="button" onClick={() => { setCreateOpen(false); setEditing(null); }}>Batal</button><button className="button button-primary" disabled={saving}>{saving ? 'Menyimpan…' : 'Simpan'}</button></div>
            </div>
          </form>
        </section>
      </div>}

      {managing && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setManaging(null); }}>
        <section className="modal department-members-modal" role="dialog" aria-modal="true" aria-labelledby="department-members-title">
          <div className="modal-header"><div><h2 id="department-members-title">Anggota {managing.name}</h2><p>Tambahkan anggota tim aktif atau keluarkan dari departemen.</p></div><button className="icon-button" aria-label="Tutup" onClick={() => setManaging(null)}>×</button></div>
          <div className="form-stack">
            {memberError && <p className="form-error" role="alert">{memberError}</p>}
            <form className="department-member-add" onSubmit={addDepartmentMember}><label className="field-label">Email anggota aktif<input className="field-input" name="email" type="email" maxLength={320} placeholder="nama@perusahaan.com" required /></label><button className="button button-primary" disabled={saving || !managing.isActive}>{saving ? 'Menambahkan…' : 'Tambahkan'}</button></form>
            <div className="project-member-list-heading"><strong>Anggota saat ini</strong><span>{departmentMembers.length}</span></div>
            <div className="project-member-list">
              {departmentMembers.map((item) => <div className="department-member-row" key={item.id}><span className="avatar">{initials(item.teamMember.name)}</span><div className="project-member-identity"><strong>{item.teamMember.name}</strong><small>{item.teamMember.email} · {roleLabels[item.teamMember.role]}</small></div><button className="button button-quiet compact-button danger-action" disabled={busyMember === item.teamMember.id} onClick={() => void removeDepartmentMember(item)}>Keluarkan</button></div>)}
              {!departmentMembers.length && !memberError && <p className="project-members-empty">Belum ada anggota di departemen ini.</p>}
            </div>
          </div>
        </section>
      </div>}
    </div>
  );
}
