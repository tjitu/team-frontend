'use client';
import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { AgreementDocument } from './agreement-document';
import { AgreementState, dateTime } from './types';
import styles from './affiliate.module.css';

export function AffiliateAgreementPage() {
  const [state,setState] = useState<AgreementState | null>(null);
  const [error,setError] = useState('');
  const [checked,setChecked] = useState(false);
  const [busy,setBusy] = useState(false);
  const load = useCallback(async () => {
    try { setState(await api.get<AgreementState>('/team/affiliate/me/agreement',{ force: true })); setError(''); setChecked(false); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Agreement tidak dapat dimuat.'); }
  },[]);
  useEffect(() => { void load(); },[load]);
  async function accept() {
    if (!checked || !state?.current || !state.preview) return;
    setBusy(true); setError('');
    try {
      await api.post('/team/affiliate/me/agreement/accept',{ acknowledged: true,agreementId: state.current.id,previewHash: state.preview.hash });
      window.location.assign('/affiliate');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Persetujuan tidak dapat disimpan.'); setBusy(false); }
  }
  const accepted = state?.history.find(record => record.agreementId===state.current?.id);
  return <div className={styles.stack}>
    <div className="page-heading"><div><h1>Affiliate Agreement</h1><p className={styles.muted}>Baca ketentuan kerja sama dan simpan persetujuan digital Anda.</p></div></div>
    {error && <div role="alert" className="inline-message error">{error} <button className="button button-secondary" onClick={() => void load()}>Reload</button></div>}
    {!state ? <p role="status">Memuat agreement…</p> : !state.current ? <p className={styles.alert}>System Owner belum memublikasikan agreement. Hubungi administrator untuk bantuan. Fitur afiliasi tersedia setelah agreement diterbitkan dan disetujui.</p> : <>
      <div className={styles.toolbar}><div><strong>{state.member.name}</strong><p className={styles.muted}>{state.member.identifier} · Agreement v{state.current.version}</p></div>
        <div><span className={styles.badge}>{accepted ? 'Disetujui' : 'Menunggu persetujuan'}</span><p className={styles.muted}>Efektif: {state.current.effectiveAt ? dateTime(state.current.effectiveAt) : 'Belum ditentukan'}{accepted && <> · Disetujui: {dateTime(accepted.acceptedAt)}</>}</p></div></div>
      {state.current.summary && <p className={styles.alert}>{state.current.summary}</p>}
      <AgreementDocument content={accepted?.snapshot ?? state.preview?.content ?? ''} />
      {!accepted && <div className={styles.panel}><p className={styles.muted}>Identitas akun, isi agreement personal, versi, hash SHA-256, dan waktu persetujuan server disimpan untuk riwayat kerja sama.</p>
        <label className={styles.actions}><input type="checkbox" checked={checked} onChange={event => setChecked(event.target.checked)} disabled={busy} />I have read, understood, and agree to the terms and conditions outlined in this Affiliate Agreement.</label>
        <button className="button button-primary" disabled={!checked || busy} onClick={() => void accept()}>{busy ? 'Menyimpan…' : 'Agree & Continue'}</button></div>}
    </>}
    {state && state.history.length>0 && <section><h2>Previously accepted agreements</h2>{state.history.map(record => <details className={styles.history} key={record.id}>
      <summary>Agreement v{record.version} · {dateTime(record.acceptedAt)} · {record.status}</summary><p className={styles.muted}>SHA-256: {record.contentHash}</p><AgreementDocument content={record.snapshot} /></details>)}</section>}
  </div>;
}
