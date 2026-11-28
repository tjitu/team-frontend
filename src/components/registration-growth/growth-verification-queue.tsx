'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { GrowthReviewDialog } from './growth-review-dialog';
import { GrowthAnalytics } from './growth-analytics';
import { formatGrowthDate, statusLabels, type VerificationQueue } from './types';
import styles from './growth.module.css';

export function GrowthVerificationQueue({ tryoutId, onChanged }: { tryoutId: string; onChanged: () => void }) {
  const [q, setQ] = useState(''), [status, setStatus] = useState('PENDING_VERIFICATION');
  const [from, setFrom] = useState(''), [to, setTo] = useState(''), [storyPriority, setStoryPriority] = useState(false);
  const [page, setPage] = useState(0), [refresh, setRefresh] = useState(0);
  const [data, setData] = useState<VerificationQueue | null>(null);
  const request = useRef(0);
  const [loading, setLoading] = useState(true), [error, setError] = useState(''), [selected, setSelected] = useState<string | null>(null);
  const load = useCallback(async () => {
    const generation = ++request.current;
    const query = new URLSearchParams({ page: String(page), limit: '50', storyPriority: String(storyPriority) });
    if (q.trim()) query.set('q', q.trim()); if (status) query.set('status', status);
    if (from) query.set('from', from); if (to) query.set('to', to);
    setLoading(true); setError('');
    try {
      const value = await api.get<VerificationQueue>(`/team/control-center/tryouts/${encodeURIComponent(tryoutId)}/registrations?${query}`, { force: true });
      if (generation === request.current) setData(value);
    }
    catch (cause) { if (generation === request.current) setError(cause instanceof Error ? cause.message : 'Pengajuan gagal dimuat.'); }
    finally { if (generation === request.current) setLoading(false); }
  }, [tryoutId, q, status, from, to, page, storyPriority]);
  useEffect(() => {
    const timer = setTimeout(() => { void load(); }, 250);
    return () => { clearTimeout(timer); request.current += 1; };
  }, [load, refresh]);
  function changed(nextId: string | null) { setSelected(nextId); setRefresh(value => value + 1); onChanged(); }
  return <section className={styles.section} aria-label="Verifikasi pendaftaran">
    <h3>Verifikasi Pendaftaran</h3>
    {data && <div className={styles.metrics}>
      {[['Total pengajuan', data.summary.total], ['Menunggu', data.summary.pending], ['Disetujui', data.summary.approved], ['Ditolak', data.summary.rejected]].map(([label, value]) =>
        <div className={styles.metric} key={label}><span className={styles.muted}>{label}</span><strong>{value}</strong></div>)}
    </div>}
    <div className={styles.toolbar}>
      <label className="field-label">Cari peserta<input className="field-input" value={q} placeholder="Nama, email, atau Instagram" onChange={e => { setQ(e.target.value); setPage(0); }} /></label>
      <label className="field-label">Status<select className="field-input" value={status} onChange={e => { setStatus(e.target.value); setPage(0); }}><option value="">Semua</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <label className="field-label">Dari (WIB)<input type="date" className="field-input" value={from} onChange={e => { setFrom(e.target.value); setPage(0); }} /></label>
      <label className="field-label">Sampai (WIB)<input type="date" className="field-input" value={to} onChange={e => { setTo(e.target.value); setPage(0); }} /></label>
      <button type="button" className="button button-secondary" disabled={loading} onClick={() => setRefresh(value => value + 1)}>Muat ulang</button>
    </div>
    <label className="control-check"><input type="checkbox" checked={storyPriority} onChange={e => { setStoryPriority(e.target.checked); setPage(0); }} /> Prioritaskan Story yang belum diperiksa</label>
    <p className={styles.muted}>Pengajuan terlama ditampilkan lebih dahulu. Waktu Story berlalu tidak menolak pendaftaran secara otomatis.</p>
    {error && <p role="alert" className={styles.error}>{error}</p>}
    {loading ? <p>Memuat pengajuan...</p> : !data?.items.length ? <p>Belum ada pengajuan yang sesuai.</p> : <div className={styles.tableWrap}><table className={styles.table}>
      <thead><tr><th>Peserta</th><th>Email</th><th>Instagram</th><th>Diajukan (WIB)</th><th>Status</th><th>Aksi</th></tr></thead>
      <tbody>{data.items.map(item => <tr key={item.id}>
        <td>{item.name}</td><td>{item.email}</td><td>{item.instagramUsername ? <a href={`https://www.instagram.com/${encodeURIComponent(item.instagramUsername)}/`} target="_blank" rel="noopener noreferrer">@{item.instagramUsername}</a> : '—'}</td>
        <td>{formatGrowthDate(item.submittedAt)}{item.status === 'PENDING_VERIFICATION' && item.storyEnabled && !item.storyChecked && <div className={styles.urgent}>Story perlu diperiksa</div>}</td>
        <td>{statusLabels[item.status]}{item.approvalMethod === 'PAID' && <div className={styles.muted}>Akses berbayar</div>}{item.approvalMethod === 'CHECKLIST' && <div className={styles.muted}>Tanpa verifikasi manual</div>}</td>
        <td><button type="button" className="table-action-btn" onClick={() => setSelected(item.id)}>{item.status === 'PENDING_VERIFICATION' ? 'Periksa' : 'Lihat riwayat'}</button></td>
      </tr>)}</tbody>
    </table></div>}
    <div className={styles.actions}><button type="button" className="button button-secondary" disabled={page === 0 || loading} onClick={() => setPage(value => value - 1)}>Sebelumnya</button>
      <span>Halaman {page + 1}</span><button type="button" className="button button-secondary" disabled={loading || !data || data.items.length < data.limit} onClick={() => setPage(value => value + 1)}>Berikutnya</button></div>
    <GrowthAnalytics tryoutId={tryoutId} refresh={refresh} />
    {selected && <GrowthReviewDialog key={selected} tryoutId={tryoutId} registrationId={selected} onClose={() => { setSelected(null); setRefresh(value => value + 1); }} onChanged={changed} />}
  </section>;
}
