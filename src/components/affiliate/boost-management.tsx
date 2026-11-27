'use client';
import { useState } from 'react';
import { api } from '@/lib/api';
import { AffiliateReport, BoostType, boostNames, dateTime, effectiveRates, money, percent } from './types';
import { ConfirmDialog } from './confirm-dialog';
import styles from './affiliate.module.css';

function remainingTime(expiresAt: string, now: number) {
  const seconds = Math.max(0,Math.floor((new Date(expiresAt).getTime()-now)/1000));
  return `${Math.floor(seconds/3600)}h ${Math.floor(seconds%3600/60)}m ${seconds%60}s`;
}
export function BoostManagement({ data,now,reload }: { data: AffiliateReport; now: number; reload: () => Promise<void> }) {
  const [selection,setSelection] = useState<{ type: BoostType; requestKey: string } | null>(null);
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState('');
  const active = data.boosts.filter(boost => new Date(boost.expiresAt).getTime()>now);
  const rates = effectiveRates(data,now);
  async function activate() {
    if (!selection) return;
    setBusy(true); setError('');
    try { await api.post('/team/affiliate/me/boosts',{ ...selection,confirmed: true }); setSelection(null); await reload(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Boost tidak dapat diaktifkan.'); }
    finally { setBusy(false); }
  }
  const selectedPolicy = selection ? data.profile.config.boosts[selection.type] : null;
  const selectedQuota = data.quotas.find(quota => quota.type===selection?.type);
  return <div className={styles.stack}>
    <dl className={styles.metrics}><div className={styles.metric}><dt>Current commission</dt><dd>{percent(rates.commission)}</dd></div><div className={styles.metric}><dt>Current customer discount</dt><dd>{percent(rates.discount)}</dd></div>
      <div className={styles.metric}><dt>Next monthly reset · WIB</dt><dd className={styles.countdown}>{dateTime(data.profile.nextReset)}</dd></div></dl>
    {active.length>0 && <section className={styles.columns} aria-label="Active boosts">{active.map(boost => <div className={styles.panel} key={boost.id}>
      <h3>{boostNames[boost.type]} · Active</h3><p className={styles.countdown}>{remainingTime(boost.expiresAt,now)}</p><p className={styles.muted}>Expires {dateTime(boost.expiresAt)} · Rate {percent(boost.baseRate+boost.additional)}</p>
      {boost.maxTransactions!==null && <p className={styles.muted}>{boost.reservedTransactions}/{boost.maxTransactions} transaksi dialokasikan. Rate dasar berlaku setelah batas tercapai.</p>}
    </div>)}</section>}
    {error && <p className="inline-message error" role="alert">{error}</p>}
    <div className={styles.columns}>{(Object.keys(boostNames) as BoostType[]).map(type => {
      const policy = data.profile.config.boosts[type]; const quota = data.quotas.find(q => q.type===type);
      const remaining = quota ? quota.allocated+quota.bonus-quota.used : 0;
      const group = type==='COMMISSION' ? 'COMMISSION' : 'DISCOUNT';
      const reason = !policy.available ? 'Boost tidak tersedia.' : active.some(b => b.group===group) ? 'Boost pada kategori ini masih aktif.' : remaining<=0 ? 'Kuota habis.' : '';
      return <section className={styles.panel} key={type}><h3>{boostNames[type]}</h3><p>+{percent(policy.additional)} percentage points</p>
        <p className={styles.muted}>Monthly allocation: {quota?.allocated ?? policy.quota} · Bonus: {quota?.bonus ?? 0}<br />Duration: {policy.durationHours} hours{policy.maxTransactions!==null && <><br />Max {policy.maxTransactions} transactions per activation</>}</p>
        <p><strong>{remaining}</strong> aktivasi tersisa</p><progress className={styles.progress} value={remaining} max={Math.max(1,(quota?.allocated ?? 0)+(quota?.bonus ?? 0))} aria-label={`${boostNames[type]} remaining quota`} />
        <button className="button button-primary" disabled={Boolean(reason)||busy} onClick={() => { setError(''); setSelection({ type,requestKey: crypto.randomUUID() }); }}>Activate Boost</button>
        {reason && <p className={styles.muted}>{reason}</p>}</section>;
    })}</div>
    <section><h2>Boost history</h2><div className={styles.overflow}><table className={styles.table}><thead><tr><th>Type</th><th>Activation · WIB</th><th>Expiration · WIB</th><th>Successful transactions</th><th>Additional impact</th></tr></thead><tbody>
      {data.boosts.map(boost => <tr key={boost.id}><td>{boostNames[boost.type]}</td><td>{dateTime(boost.activatedAt)}</td><td>{dateTime(boost.expiresAt)}</td><td>{boost.successfulTransactions}</td><td>{money(boost.impact)} {boost.group==='COMMISSION' ? 'commission' : 'discount'}</td></tr>)}
      {data.boosts.length===0 && <tr><td colSpan={5}>Belum ada aktivasi boost.</td></tr>}</tbody></table></div><p className={styles.muted}>Impact berasal dari snapshot pembayaran berhasil, sebelum penyesuaian refund. Earned commission neto terlihat di Earnings.</p></section>
    {selection && selectedPolicy && <ConfirmDialog title={`Activate ${boostNames[selection.type]}?`} busy={busy} onCancel={() => setSelection(null)} onConfirm={() => void activate()}>
      <p>Current rate: {percent(selection.type==='COMMISSION' ? rates.commission : rates.discount)} → {percent((selection.type==='COMMISSION' ? data.profile.config.commission : data.profile.config.discount)+selectedPolicy.additional)}</p>
      <p>Quota after activation: {Math.max(0,(selectedQuota?.allocated ?? 0)+(selectedQuota?.bonus ?? 0)-(selectedQuota?.used ?? 0)-1)} · Duration: {selectedPolicy.durationHours} hours.</p>
      <p>Applicable codes: {data.codes.filter(c => c.isActive && (!c.expiresAt || new Date(c.expiresAt).getTime()>now)).map(c => c.code).join(', ') || 'Tidak ada kode eligible saat ini; boost juga berlaku untuk kode yang diassign selama periode aktif.'}</p>
      <p className={styles.alert}>Aktivasi tidak dapat dibatalkan, dipause, diperpanjang, atau dikembalikan kuotanya. Tidak ada automatic renewal.</p>
      {error && <p role="alert" className="inline-message error">{error}</p>}
    </ConfirmDialog>}
  </div>;
}
