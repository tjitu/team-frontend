'use client';
import { useEffect, useState } from 'react';
import { BoostManagement } from './boost-management';
import { PerformanceChart } from './performance-chart';
import { TransactionTable } from './transaction-table';
import { useAffiliate, useServerClock } from './use-affiliate';
import { AffiliateReport, boostNames, dateTime, effectiveRates, money, percent } from './types';
import styles from './affiliate.module.css';

export type AffiliateSection = 'Overview' | 'My Referral Codes' | 'Boosts' | 'Earnings';
export function AffiliateDashboard({ section }: { section: AffiliateSection }) {
  const { data,error,loading,load,from,to,setFrom,setTo,offset,setOffset } = useAffiliate();
  const now = useServerClock(data?.profile.serverTime);
  useEffect(() => { const timer=setInterval(() => void load(),60000); return () => clearInterval(timer); },[load]);
  return <div className={styles.stack}><div className={styles.toolbar}><div><h1>{section}</h1><p className={styles.muted}>JITU Affiliate Program · Waktu dalam WIB</p></div>
    {(section==='Overview' || section==='Earnings') && <div className={styles.actions}><label className={styles.field}>Dari<input className="field-input" type="date" value={from} onChange={event => setFrom(event.target.value)} /></label><label className={styles.field}>Sampai<input className="field-input" type="date" value={to} onChange={event => setTo(event.target.value)} /></label><button className="button button-secondary" disabled={loading} onClick={() => void load()}>Refresh</button></div>}</div>
    {error && <p className="inline-message error" role="alert">{error} <button className="button button-secondary" onClick={() => void load()}>Retry</button></p>}
    {!data ? <p role="status">{loading ? 'Memuat data afiliasi…' : 'Data belum tersedia.'}</p> : <>
      {section==='Boosts' ? <BoostManagement data={data} now={now} reload={load} /> : section==='My Referral Codes' ? <ReferralCodes data={data} now={now} /> : <>
        <AffiliateMetrics data={data} />
        {section==='Overview' && <CurrentRates data={data} now={now} />}
        <section><h2>Commission trend</h2><PerformanceChart trend={data.trend} /></section>
        <section><h2>{section==='Overview' ? 'Recent transactions' : 'Transaction history'}</h2><TransactionTable data={data} />
          <div className={styles.actions}><button className="button button-secondary" disabled={offset===0 || loading} onClick={() => setOffset(Math.max(0,offset-100))}>Previous</button><span className={styles.muted}>Rows {offset+1}–{offset+data.transactions.length}</span><button className="button button-secondary" disabled={!data.pagination.hasMore || loading} onClick={() => setOffset(offset+100)}>Next</button></div>
        </section>
        {section==='Earnings' && <PayoutHistory data={data} />}
      </>}
    </>}
  </div>;
}
export function AffiliateMetrics({ data }: { data: AffiliateReport }) {
  const metrics = [['Successful referrals',String(data.totals.successfulReferrals)],['Generated sales',money(data.totals.generatedSales)],
    ['Net earned · selected period',money(data.totals.earned)],['Pending · estimated',money(data.totals.pending)],
    ['Paid · all time',money(data.totals.paid)],['Outstanding · all time',money(data.totals.outstanding)]];
  return <><dl className={styles.metrics}>{metrics.map(([label,value]) => <div key={label} className={styles.metric}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
    <p className={styles.muted}>Earned mencakup pembayaran terverifikasi dan penyesuaian refund. Pending belum menjadi penghasilan. Outstanding sudah dikurangi payout PAID serta reservasi payout PENDING ({money(data.totals.reservedPayout)}). Nilai negatif adalah penyesuaian atas komisi yang sudah dibayarkan.</p></>;
}
export function CurrentRates({ data,now }: { data: AffiliateReport; now: number }) {
  const rates = effectiveRates(data,now);
  const active = data.boosts.filter(b => new Date(b.expiresAt).getTime()>now);
  return <section className={styles.panel}><h2>Current effective rates</h2><div className={styles.actions}><span>Commission <strong>{percent(rates.commission)}</strong></span><span>Customer discount <strong>{percent(rates.discount)}</strong></span></div>
    <p className={styles.muted}>{active.map(boost => `${boostNames[boost.type]} until ${dateTime(boost.expiresAt)}`).join(' · ') || 'Standard rates · No active boosts'}</p>
    <p className={styles.muted}>Rate saat ini untuk checkout baru. Transaksi yang sudah dibuat memakai snapshot masing-masing; pembatasan kode dan batas transaksi boost tetap berlaku.</p></section>;
}
export function ReferralCodes({ data,now }: { data: AffiliateReport; now: number }) {
  const rates = effectiveRates(data,now); const [notice,setNotice] = useState('');
  return <section><h2>My Referral Codes</h2><p className={styles.muted}>Kode dikelola administrator. Riwayat hasil hanya mencakup transaksi yang diatribusikan ke akun Anda.</p>
    {notice && <p role="status">{notice}</p>}<div className={styles.overflow}><table className={styles.table}><thead><tr><th>Code</th><th>Current discount</th><th>Current commission</th><th>Successful usage</th><th>Sales</th><th>Earnings</th><th>Status / Expiration</th><th>Copy</th></tr></thead><tbody>
      {data.codes.map(code => <tr key={code.id}><td><strong>{code.code}</strong></td><td>{percent(rates.discount)}</td><td>{percent(rates.commission)}</td><td>{code.successfulUsage}</td><td>{money(code.sales)}</td><td>{money(code.earnings)}</td><td>{!code.isActive ? 'Inactive' : code.expiresAt && new Date(code.expiresAt).getTime()<=now ? 'Expired' : 'Active'}<br /><span className={styles.muted}>{code.expiresAt ? dateTime(code.expiresAt) : 'No expiration'}</span></td><td><button className="button button-secondary" onClick={() => void navigator.clipboard.writeText(code.code).then(() => setNotice(`${code.code} copied.`)).catch(() => setNotice('Copy failed. Select and copy the code manually.'))}>Copy</button></td></tr>)}
      {data.codes.length===0 && <tr><td colSpan={8}>Belum ada referral code yang diassign. Hubungi administrator.</td></tr>}
    </tbody></table></div></section>;
}
export function PayoutHistory({ data }: { data: AffiliateReport }) {
  return <section><h2>Payout history</h2><div className={styles.overflow}><table className={styles.table}><thead><tr><th>Date · WIB</th><th>Reference</th><th>Amount</th><th>Status</th></tr></thead><tbody>
    {data.payouts.map(payout => <tr key={payout.id}><td>{dateTime(payout.paidAt)}</td><td>{payout.reference}</td><td>{money(payout.amount)}</td><td>{payout.status}</td></tr>)}
    {data.payouts.length===0 && <tr><td colSpan={4}>Belum ada payout tercatat.</td></tr>}</tbody></table></div><p className={styles.muted}>Payout dicatat manual oleh administrator. Jadwal dan ketentuan pembayaran mengikuti agreement yang dipublikasikan.</p></section>;
}
