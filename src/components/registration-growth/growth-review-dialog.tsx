'use client';
import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { formatGrowthDate, rejectionOptions, statusLabels, verificationItems, type AdminItem, type VerificationDetail, type VerificationHistory } from './types';
import styles from './growth.module.css';

type Detail = { registration: VerificationDetail; history: VerificationHistory[] };
export function GrowthReviewDialog({ tryoutId, registrationId, onClose, onChanged }: {
  tryoutId: string; registrationId: string; onClose: () => void; onChanged: (nextId: string | null) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [checks, setChecks] = useState<Partial<Record<AdminItem, boolean>>>({});
  const [reasons, setReasons] = useState<string[]>([]);
  const [other, setOther] = useState(false), [custom, setCustom] = useState('');
  const [decision, setDecision] = useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const [retry, setRetry] = useState(0);
  const path = `/team/control-center/tryouts/${encodeURIComponent(tryoutId)}/registrations/${encodeURIComponent(registrationId)}`;
  useEffect(() => { dialog.current?.showModal(); return () => { dialog.current?.close(); }; }, []);
  useEffect(() => {
    let cancelled = false; setDetail(null); setError(''); setReasons([]); setOther(false); setCustom(''); setDecision('APPROVE');
    api.get<Detail>(path, { force: true }).then(value => {
      if (!cancelled) { setDetail(value); setChecks(value.registration.adminChecklist); }
    }).catch(cause => { if (!cancelled) setError(cause instanceof Error ? cause.message : 'Pengajuan gagal dimuat.'); });
    return () => { cancelled = true; };
  }, [path, retry]);
  const registration = detail?.registration;
  const items = registration ? verificationItems(registration.configSnapshot) : [];
  const requiredComplete = items.every(item => !item.required || checks[item.key]);
  const rejectionReasons = [...reasons, ...(other && custom.trim() ? [custom.trim()] : [])];
  const canReject = rejectionReasons.length > 0 && (!other || custom.trim().length >= 2);
  const pending = registration?.status === 'PENDING_VERIFICATION';
  async function save(action: 'SAVE_PROGRESS' | 'APPROVE' | 'REJECT', next = false) {
    if (!registration || busy) return;
    setBusy(true); setError('');
    try {
      const result = await api.post<{ registration: VerificationDetail; nextId: string | null }>(`${path}/review`, {
        action, version: registration.version, checklist: checks, rejectionReasons: action === 'REJECT' ? rejectionReasons : undefined, next,
      });
      if (action === 'SAVE_PROGRESS') {
        const value = await api.get<Detail>(path, { force: true }); setDetail(value); setChecks(value.registration.adminChecklist);
      } else onChanged(next ? result.nextId : null);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Verifikasi gagal disimpan.'); }
    finally { setBusy(false); }
  }
  return <dialog ref={dialog} className={styles.dialog} aria-labelledby="growth-review-title" onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}>
    <header className={styles.header}><div><h3 id="growth-review-title">Verifikasi Pendaftaran</h3>{registration && <p>{registration.name}<br /><span className={styles.muted}>{registration.email}</span></p>}</div>
      <button className="button button-secondary" type="button" disabled={busy} onClick={onClose}>Tutup</button></header>
    {error && <div role="alert" className={styles.error}>{error} <button type="button" className="table-action-btn" disabled={busy} onClick={() => setRetry(value => value + 1)}>Muat ulang</button></div>}
    {!registration ? <p>Memuat pengajuan...</p> : <>
      <p className={styles.muted}>{statusLabels[registration.status]} · {formatGrowthDate(registration.submittedAt)} WIB</p>
      <nav className={styles.links} aria-label="Tautan verifikasi">
        {registration.instagramUsername && <a href={`https://www.instagram.com/${encodeURIComponent(registration.instagramUsername)}/`} target="_blank" rel="noopener noreferrer">@{registration.instagramUsername}</a>}
        <a href={registration.configSnapshot.profileUrl} target="_blank" rel="noopener noreferrer">Profil JITU</a>
        {registration.configSnapshot.campaignUrl && <a href={registration.configSnapshot.campaignUrl} target="_blank" rel="noopener noreferrer">Postingan kampanye</a>}
      </nav>
      <p className={styles.muted}>Checklist peserta adalah pernyataan peserta. Konfirmasi pemeriksaan admin secara terpisah.</p>
      <fieldset className={styles.checklist} disabled={!pending || busy}><legend>Pemeriksaan admin</legend>
        {items.map(item => <label key={item.key}><input type="checkbox" checked={Boolean(checks[item.key])} onChange={event => setChecks(value => ({ ...value, [item.key]: event.target.checked }))} />
          <span>{item.label}{!item.required && <span className={styles.muted}> · opsional</span>}</span></label>)}
      </fieldset>
      {registration.configSnapshot.items.story.enabled && <p className={styles.muted}>Akun privat atau Story yang sudah tidak terlihat memerlukan pemeriksaan manual. Berakhirnya Story tidak mengubah status otomatis.</p>}
      <details><summary>Pernyataan peserta</summary><ul>{Object.entries(registration.submittedChecklist).map(([key, checked]) => <li key={key}>{key}: {checked ? 'Dicentang' : 'Tidak dicentang'}</li>)}</ul></details>
      {pending && <>
        <fieldset className={styles.checklist} disabled={busy}><legend>Keputusan</legend>
          <label><input type="radio" name="growth-decision" checked={decision === 'APPROVE'} onChange={() => setDecision('APPROVE')} /> Setujui</label>
          <label><input type="radio" name="growth-decision" checked={decision === 'REJECT'} onChange={() => setDecision('REJECT')} /> Tolak</label>
        </fieldset>
        {decision === 'REJECT' && <fieldset className={styles.checklist} disabled={busy}><legend>Alasan penolakan</legend>
          {rejectionOptions.map(reason => <label key={reason}><input type="checkbox" checked={reasons.includes(reason)} onChange={event => setReasons(value => event.target.checked ? [...value, reason] : value.filter(item => item !== reason))} />{reason}</label>)}
          <label><input type="checkbox" checked={other} onChange={event => setOther(event.target.checked)} /> Lainnya</label>
          {other && <label className="field-label">Alasan lain<textarea className="field-input" value={custom} maxLength={500} onChange={event => setCustom(event.target.value)} /></label>}
        </fieldset>}
        <footer className={styles.actions}>
          <button className="button button-secondary" type="button" disabled={busy} onClick={() => void save('SAVE_PROGRESS')}>Simpan progres</button>
          <button className="button button-secondary" type="button" disabled={busy || (decision === 'APPROVE' ? !requiredComplete : !canReject)} onClick={() => void save(decision)}>{decision === 'APPROVE' ? 'Setujui' : 'Tolak'}</button>
          <button className="button button-primary" type="button" disabled={busy || (decision === 'APPROVE' ? !requiredComplete : !canReject)} onClick={() => void save(decision, true)}>{busy ? 'Menyimpan...' : 'Simpan & berikutnya'}</button>
        </footer>
      </>}
      <details className={styles.history}><summary>Riwayat verifikasi ({detail.history.length})</summary>
        {detail.history.map(item => <p key={item.id}><strong>{item.action}</strong> · {formatGrowthDate(item.createdAt)} WIB<br />
          {item.after.instagramUsername && `@${item.after.instagramUsername} · `}{item.after.rejectionReasons?.join(' ')}<br /><span className={styles.muted}>Oleh {item.actorId}</span></p>)}
      </details>
    </>}
  </dialog>;
}
