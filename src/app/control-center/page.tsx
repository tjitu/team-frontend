'use client';

import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { api, CurrentMember, RevenueSummary, signInUrl } from '@/lib/api';

type Section = 'tryouts' | 'pricing' | 'users' | 'careers' | 'revenue';
type Tryout = { id: string; code: number; title: string; description: string | null; solutionPrice: number; batch: 'SNBT' | 'MANDIRI'; releaseDate: string; scheduledStart: string | null; scheduledEnd: string | null; status: string; isPublic: boolean; referralCode: string | null };
type Package = { id: string; name: string; tokenAmount: number; price: number; isActive: boolean; paymentCount?: number };
type User = { id: string; name: string; email: string; role: 'USER' | 'ADMIN'; target: string | null; tokenBalance: number; createdAt: string };
type CareerApplication = { id: string; fullName: string; email: string; university: string; primaryRole: string; primaryDivision: string; status: 'SUBMITTED' | 'UNDER_REVIEW' | 'INTERVIEW' | 'ACCEPTED' | 'REJECTED'; adminNotes: string | null; createdAt: string };
type TryoutForm = { title: string; description: string; solutionPrice: string; batch: 'SNBT' | 'MANDIRI'; releaseDate: string; scheduledStart: string; scheduledEnd: string; isPublic: boolean; referralCode: string };
type PackageForm = { name: string; tokenAmount: string; price: string; isActive: boolean };

const initialTryoutForm: TryoutForm = { title: '', description: '', solutionPrice: '1', batch: 'SNBT', releaseDate: '', scheduledStart: '', scheduledEnd: '', isPublic: true, referralCode: '' };
const initialPackageForm: PackageForm = { name: '', tokenAmount: '1', price: '', isActive: true };
const sections: Array<{ id: Section; label: string }> = [
  { id: 'tryouts', label: 'Tryouts' }, { id: 'pricing', label: 'Pricing' }, { id: 'users', label: 'Users' },
  { id: 'careers', label: 'Careers' }, { id: 'revenue', label: 'Revenue' },
];
const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });
const monthLabel = new Intl.DateTimeFormat('en-US', { month: 'short', year: '2-digit', timeZone: 'UTC' });
const dateLabel = new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'short', year: 'numeric' });

function dateInput(value?: string | null) {
  return value ? new Date(value).toISOString().slice(0, 16) : '';
}
function formatDate(value?: string | null) {
  return value ? dateLabel.format(new Date(value)) : 'Not scheduled';
}
function formatMonth(value: string) {
  return monthLabel.format(new Date(`${value}-01T00:00:00.000Z`));
}
function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Could not complete this action.';
}

export default function ControlCenterPage() {
  const [section, setSection] = useState<Section>('tryouts');
  const [member, setMember] = useState<CurrentMember | null>(null);
  const [tryouts, setTryouts] = useState<Tryout[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [applications, setApplications] = useState<CareerApplication[]>([]);
  const [summary, setSummary] = useState<RevenueSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');
  const [tryoutForm, setTryoutForm] = useState<TryoutForm>(initialTryoutForm);
  const [packageForm, setPackageForm] = useState<PackageForm>(initialPackageForm);
  const [tryoutFormOpen, setTryoutFormOpen] = useState(false);
  const [packageFormOpen, setPackageFormOpen] = useState(false);
  const [editingTryout, setEditingTryout] = useState<string | null>(null);
  const [editingPackage, setEditingPackage] = useState<string | null>(null);

  const loadSection = useCallback(async (target: Section, query = '') => {
    setLoading(true);
    setError('');
    try {
      if (target === 'tryouts') setTryouts(await api.get<Tryout[]>('/team/control-center/tryouts'));
      if (target === 'pricing') setPackages(await api.get<Package[]>('/team/control-center/packages'));
      if (target === 'users') setUsers(await api.get<User[]>(`/team/control-center/users${query ? `?search=${encodeURIComponent(query)}` : ''}`));
      if (target === 'careers') setApplications(await api.get<CareerApplication[]>(`/team/control-center/careers/applications${query ? `?search=${encodeURIComponent(query)}` : ''}`));
      if (target === 'revenue') setSummary(await api.get<RevenueSummary>('/team/control-center/revenue'));
    } catch (cause) {
      const message = errorMessage(cause);
      if (message === 'SESSION_EXPIRED') window.location.assign(signInUrl());
      else setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void api.get<CurrentMember>('/team/me').then(setMember).catch((cause: unknown) => {
      if (errorMessage(cause) === 'SESSION_EXPIRED') window.location.assign(signInUrl());
    });
  }, []);
  useEffect(() => { void loadSection(section); }, [section, loadSection]);

  async function saveTryout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true); setError(''); setNotice('');
    const body = {
      title: tryoutForm.title.trim(), description: tryoutForm.description.trim() || null,
      solutionPrice: Number(tryoutForm.solutionPrice), batch: tryoutForm.batch,
      releaseDate: new Date(`${tryoutForm.releaseDate}T00:00:00`).toISOString(),
      scheduledStart: new Date(tryoutForm.scheduledStart).toISOString(), scheduledEnd: new Date(tryoutForm.scheduledEnd).toISOString(),
      isPublic: tryoutForm.isPublic, referralCode: tryoutForm.referralCode.trim() || null,
    };
    try {
      if (editingTryout) await api.patch(`/team/control-center/tryouts/${editingTryout}`, body);
      else await api.post('/team/control-center/tryouts', body);
      const successMessage = editingTryout ? 'Tryout updated.' : 'Tryout created.';
      setTryoutForm(initialTryoutForm); setEditingTryout(null); setTryoutFormOpen(false);
      await loadSection('tryouts');
      setNotice(successMessage);
    } catch (cause) { setError(errorMessage(cause)); }
    finally { setSaving(false); }
  }

  async function savePackage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true); setError(''); setNotice('');
    const body = { name: packageForm.name.trim(), tokenAmount: Number(packageForm.tokenAmount), price: Number(packageForm.price), isActive: packageForm.isActive };
    try {
      if (editingPackage) await api.patch(`/team/control-center/packages/${editingPackage}`, body);
      else await api.post('/team/control-center/packages', body);
      const successMessage = editingPackage ? 'Package updated.' : 'Package created.';
      setPackageForm(initialPackageForm); setEditingPackage(null); setPackageFormOpen(false);
      await loadSection('pricing');
      setNotice(successMessage);
    } catch (cause) { setError(errorMessage(cause)); }
    finally { setSaving(false); }
  }

  function editTryout(item: Tryout) {
    setEditingTryout(item.id); setTryoutFormOpen(true); setError(''); setNotice('');
    setTryoutForm({ title: item.title, description: item.description ?? '', solutionPrice: String(item.solutionPrice), batch: item.batch,
      releaseDate: item.releaseDate.slice(0, 10), scheduledStart: dateInput(item.scheduledStart), scheduledEnd: dateInput(item.scheduledEnd),
      isPublic: item.isPublic, referralCode: item.referralCode ?? '' });
  }

  function editPackage(item: Package) {
    setEditingPackage(item.id); setPackageFormOpen(true); setError(''); setNotice('');
    setPackageForm({ name: item.name, tokenAmount: String(item.tokenAmount), price: String(item.price), isActive: item.isActive });
  }

  async function updateUserRole(item: User, role: User['role']) {
    setError(''); setNotice('');
    try {
      await api.patch(`/team/control-center/users/${item.id}`, { role });
      await loadSection('users', search); setNotice(`Access updated for ${item.email}.`);
    } catch (cause) { setError(errorMessage(cause)); }
  }

  async function updateApplication(item: CareerApplication, status: CareerApplication['status']) {
    setError(''); setNotice('');
    try {
      await api.patch(`/team/control-center/careers/applications/${encodeURIComponent(item.id)}`, { status: status });
      await loadSection('careers', search); setNotice(`Application status updated for ${item.fullName}.`);
    } catch (cause) { setError(errorMessage(cause)); }
  }

  async function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); await loadSection(section, search.trim());
  }

  const maxRevenue = Math.max(1, ...(summary?.monthlyRevenue.map(({ revenue }) => revenue) ?? []));

  return <div className="page-content control-center-page">
    <div className="page-heading">
      <div><p className="page-eyebrow">Administration</p><h1>Control Center</h1><p className="page-subtitle">Manage Jitu services from one workspace.</p></div>
      <button className="button button-secondary" onClick={() => { setNotice(''); void loadSection(section, search); }} disabled={loading}>{loading ? 'Loading…' : 'Refresh'}</button>
    </div>

    <nav className="control-tabs" aria-label="Control Center sections">
      {sections.map((item) => <button className={`control-tab ${section === item.id ? 'is-active' : ''}`} type="button" key={item.id} onClick={() => { setSection(item.id); setSearch(''); setError(''); setNotice(''); }}>{item.label}</button>)}
    </nav>

    {error && <div className="inline-message error" role="alert">{error}</div>}
    {notice && <div className="inline-message control-success" role="status">{notice}</div>}

    {(section === 'users' || section === 'careers') && <form className="control-search" onSubmit={submitSearch}>
      <input className="field-input" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={section === 'users' ? 'Search users by name or email' : 'Search applicants by name or email'} aria-label="Search" />
      <button className="button button-secondary" type="submit" disabled={loading}>Search</button>
    </form>}

    {section === 'tryouts' && <section className="control-panel" aria-labelledby="tryout-heading">
      <div className="section-heading control-panel-heading"><div><h2 id="tryout-heading">Tryout management</h2><p>Create tryouts and update their schedule, visibility, and solution price.</p></div><button className="button button-primary" onClick={() => { setEditingTryout(null); setTryoutForm(initialTryoutForm); setTryoutFormOpen(true); setError(''); setNotice(''); }}>New tryout</button></div>
      {tryoutFormOpen && <form className="control-edit-form" onSubmit={saveTryout}>
        <h3>{editingTryout ? 'Edit tryout' : 'Create tryout'}</h3>
        <div className="control-form-grid">
          <label className="field-label">Title<input className="field-input" required minLength={2} value={tryoutForm.title} onChange={(event) => setTryoutForm({ ...tryoutForm, title: event.target.value })} /></label>
          <label className="field-label">Batch<select className="field-input" value={tryoutForm.batch} onChange={(event) => setTryoutForm({ ...tryoutForm, batch: event.target.value as TryoutForm['batch'] })}><option value="SNBT">SNBT</option><option value="MANDIRI">Mandiri</option></select></label>
          <label className="field-label">Solution price (coins)<input className="field-input" type="number" required min="0" value={tryoutForm.solutionPrice} onChange={(event) => setTryoutForm({ ...tryoutForm, solutionPrice: event.target.value })} /></label>
          <label className="field-label">Release date<input className="field-input" type="date" required value={tryoutForm.releaseDate} onChange={(event) => setTryoutForm({ ...tryoutForm, releaseDate: event.target.value })} /></label>
          <label className="field-label">Starts at<input className="field-input" type="datetime-local" required value={tryoutForm.scheduledStart} onChange={(event) => setTryoutForm({ ...tryoutForm, scheduledStart: event.target.value })} /></label>
          <label className="field-label">Ends at<input className="field-input" type="datetime-local" required value={tryoutForm.scheduledEnd} onChange={(event) => setTryoutForm({ ...tryoutForm, scheduledEnd: event.target.value })} /></label>
          <label className="field-label control-form-wide">Description<textarea className="field-input" rows={3} value={tryoutForm.description} onChange={(event) => setTryoutForm({ ...tryoutForm, description: event.target.value })} /></label>
          <label className="field-label">Referral code<input className="field-input" value={tryoutForm.referralCode} onChange={(event) => setTryoutForm({ ...tryoutForm, referralCode: event.target.value })} /></label>
          <label className="control-check"><input type="checkbox" checked={tryoutForm.isPublic} onChange={(event) => setTryoutForm({ ...tryoutForm, isPublic: event.target.checked })} /> Public tryout</label>
        </div>
        <div className="control-form-actions"><button className="button button-secondary" type="button" onClick={() => { setTryoutForm(initialTryoutForm); setEditingTryout(null); setTryoutFormOpen(false); }}>Cancel</button><button className="button button-primary" type="submit" disabled={saving}>{saving ? 'Saving…' : editingTryout ? 'Save changes' : 'Create tryout'}</button></div>
      </form>}
      {loading ? <div className="control-empty">Loading tryouts…</div> : error ? null : tryouts.length === 0 ? <div className="control-empty">No tryouts found.</div> : <div className="control-table-wrap"><table className="control-table"><thead><tr><th>Tryout</th><th>Batch</th><th>Schedule</th><th>Solution price</th><th>Status</th><th /></tr></thead><tbody>{tryouts.map((item) => <tr key={item.id}><td><strong>{item.title}</strong><small>#{item.code} · {item.isPublic ? 'Public' : 'Private'}</small></td><td>{item.batch}</td><td>{formatDate(item.scheduledStart)}<small>Ends {formatDate(item.scheduledEnd)}</small></td><td>{item.solutionPrice} coins</td><td><span className="control-status">{item.status.replaceAll('_', ' ')}</span></td><td><button className="control-text-button" onClick={() => editTryout(item)}>Edit</button></td></tr>)}</tbody></table></div>}
    </section>}

    {section === 'pricing' && <section className="control-panel" aria-labelledby="pricing-heading">
      <div className="section-heading control-panel-heading"><div><h2 id="pricing-heading">Pricing & packages</h2><p>Update coin package prices and availability for Jitu Shop.</p></div><button className="button button-primary" onClick={() => { setEditingPackage(null); setPackageForm(initialPackageForm); setPackageFormOpen(true); setError(''); setNotice(''); }}>New package</button></div>
      {packageFormOpen && <form className="control-edit-form" onSubmit={savePackage}>
        <h3>{editingPackage ? 'Edit package' : 'Create package'}</h3><div className="control-form-grid">
          <label className="field-label">Package name<input className="field-input" required minLength={2} value={packageForm.name} onChange={(event) => setPackageForm({ ...packageForm, name: event.target.value })} /></label>
          <label className="field-label">Coin amount<input className="field-input" type="number" required min="1" value={packageForm.tokenAmount} onChange={(event) => setPackageForm({ ...packageForm, tokenAmount: event.target.value })} /></label>
          <label className="field-label">Price (IDR)<input className="field-input" type="number" required min="0" value={packageForm.price} onChange={(event) => setPackageForm({ ...packageForm, price: event.target.value })} /></label>
          <label className="control-check"><input type="checkbox" checked={packageForm.isActive} onChange={(event) => setPackageForm({ ...packageForm, isActive: event.target.checked })} /> Available for purchase</label>
        </div><div className="control-form-actions"><button className="button button-secondary" type="button" onClick={() => { setPackageForm(initialPackageForm); setEditingPackage(null); setPackageFormOpen(false); }}>Cancel</button><button className="button button-primary" type="submit" disabled={saving}>{saving ? 'Saving…' : editingPackage ? 'Save changes' : 'Create package'}</button></div>
      </form>}
      {loading ? <div className="control-empty">Loading packages…</div> : error ? null : packages.length === 0 ? <div className="control-empty">No packages found.</div> : <div className="control-table-wrap"><table className="control-table"><thead><tr><th>Package</th><th>Coins</th><th>Price</th><th>Purchases</th><th>Status</th><th /></tr></thead><tbody>{packages.map((item) => <tr key={item.id}><td><strong>{item.name}</strong></td><td>{item.tokenAmount}</td><td>{currency.format(item.price)}</td><td>{item.paymentCount ?? '—'}</td><td><span className="control-status">{item.isActive ? 'Active' : 'Inactive'}</span></td><td><button className="control-text-button" onClick={() => editPackage(item)}>Edit</button></td></tr>)}</tbody></table></div>}
    </section>}

    {section === 'users' && <section className="control-panel" aria-labelledby="users-heading"><div className="section-heading control-panel-heading"><div><h2 id="users-heading">User management</h2><p>Review Jitu accounts, roles, targets, and coin balances. Only System Owners can grant Jitu Admin access.</p></div><span>{users.length} shown</span></div>
      {loading ? <div className="control-empty">Loading users…</div> : error ? null : users.length === 0 ? <div className="control-empty">No users found.</div> : <div className="control-table-wrap"><table className="control-table"><thead><tr><th>User</th><th>Jitu role</th><th>Target</th><th>Coins</th><th /></tr></thead><tbody>{users.map((item) => <tr key={item.id}><td><strong>{item.name}</strong><small>{item.email}</small></td><td><select className="control-inline-select" value={item.role} disabled={member?.role !== 'SYSTEM_OWNER'} onChange={(event) => void updateUserRole(item, event.target.value as User['role'])}><option value="USER">User</option><option value="ADMIN">Admin</option></select></td><td>{item.target || 'Not set'}</td><td>{item.tokenBalance}</td><td>{member?.role !== 'SYSTEM_OWNER' && item.role !== 'USER' ? <span className="control-muted">Owner managed</span> : null}</td></tr>)}</tbody></table></div>}
    </section>}

    {section === 'careers' && <section className="control-panel" aria-labelledby="careers-heading"><div className="section-heading control-panel-heading"><div><h2 id="careers-heading">Careers & hiring</h2><p>Review applications and update their recruitment status.</p></div><span>{applications.length} shown</span></div>
      {loading ? <div className="control-empty">Loading applications…</div> : error ? null : applications.length === 0 ? <div className="control-empty">No applications found.</div> : <div className="control-table-wrap"><table className="control-table"><thead><tr><th>Applicant</th><th>Position</th><th>Division</th><th>Applied</th><th>Status</th></tr></thead><tbody>{applications.map((item) => <tr key={item.id}><td><strong>{item.fullName}</strong><small>{item.email} · {item.university}</small></td><td>{item.primaryRole}</td><td>{item.primaryDivision}</td><td>{formatDate(item.createdAt)}</td><td><select className="control-inline-select" value={item.status} onChange={(event) => void updateApplication(item, event.target.value as CareerApplication['status'])}><option value="SUBMITTED">Submitted</option><option value="UNDER_REVIEW">Under review</option><option value="INTERVIEW">Interview</option><option value="ACCEPTED">Accepted</option><option value="REJECTED">Rejected</option></select></td></tr>)}</tbody></table></div>}
    </section>}

    {section === 'revenue' && <section className="control-panel" aria-labelledby="revenue-heading"><div className="section-heading control-panel-heading"><div><h2 id="revenue-heading">Revenue overview</h2><p>Confirmed and pending payments recorded by Jitu.</p></div></div>
      {!loading && summary && !summary.configured && <div className="inline-message revenue-source-notice" role="status"><div><strong>Payment source is not connected</strong><p>Add a read-only PostgreSQL connection for Jitu to <code>JITU_PURCHASES_DATABASE_URL</code> in the backend environment.</p></div></div>}
      {loading ? <div className="revenue-metrics" aria-label="Loading revenue summary">{[1, 2, 3].map((item) => <div className="loading-skeleton" key={item} />)}</div> : summary && <>
        <div className="revenue-metrics"><article className="revenue-metric"><span>Total confirmed revenue</span><strong>{summary.configured ? currency.format(summary.totalRevenue) : '—'}</strong><small>Total payments with confirmed status</small></article><article className="revenue-metric"><span>Successful payments</span><strong>{summary.configured ? summary.confirmedPayments.toLocaleString('en-US') : '—'}</strong><small>Transactions with confirmed status</small></article><article className="revenue-metric"><span>Pending payments</span><strong>{summary.configured ? summary.pendingPayments.toLocaleString('en-US') : '—'}</strong><small>Transactions with pending status</small></article></div>
        <section className="revenue-panel"><div className="section-heading"><div><h2>Monthly revenue</h2><p>Last 12 months, based on the amount recorded at the time of payment.</p></div></div>
          {!summary.configured ? <div className="revenue-empty">The chart will appear once a payment source is connected.</div> : summary.confirmedPayments === 0 ? <div className="revenue-empty">No confirmed payments yet.</div> : <div className="revenue-chart" role="img" aria-label="Confirmed revenue by month over the last 12 months">{summary.monthlyRevenue.map(({ month, revenue, confirmedPayments }) => <div className="revenue-chart-month" key={month} title={`${formatMonth(month)} · ${currency.format(revenue)} · ${confirmedPayments} payments`}><div className="revenue-chart-bar-area"><span className="revenue-chart-bar" style={{ height: `${revenue ? Math.max(5, (revenue / maxRevenue) * 100) : 0}%` }} /></div><span className="revenue-chart-label">{formatMonth(month)}</span></div>)}</div>}
        </section>
      </>}
    </section>}
  </div>;
}
