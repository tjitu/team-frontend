'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useAffiliate, useServerClock } from './use-affiliate';
import { AffiliateAdminConfig } from './admin-config';
import { AffiliateMetrics, CurrentRates, PayoutHistory, ReferralCodes } from './affiliate-dashboard';
import { TransactionTable } from './transaction-table';
import { PerformanceChart } from './performance-chart';
import { AgreementDocument } from './agreement-document';
import { boostNames, dateTime, money } from './types';
import styles from './affiliate.module.css';

export function AffiliateAdminDetail({ id }: { id: string }) {
  const { data,error,loading,load,from,to,setFrom,setTo,offset,setOffset } = useAffiliate(`/team/affiliate/admin/${id}`);
  const now=useServerClock(data?.profile.serverTime);
  const [tab,setTab] = useState('Performance');
  return <div className="page-content"><div className={styles.stack}><Link href="/affiliates">← Affiliate Management</Link>
    <div className={styles.toolbar}><div><h1>{data?.profile.name || 'Affiliate details'}</h1><p className={styles.muted}>{data?.profile.identifier} · {data?.profile.isActive ? 'Active' : 'Inactive'}</p></div><Link className="button button-secondary" href="/team">Manage account access</Link></div>
    <nav className={styles.nav} aria-label="Affiliate detail sections">{['Performance','Configuration & Payouts','Agreements','Boost History','Audit Log'].map(label => <button className={`button ${tab===label ? 'button-primary' : 'button-secondary'}`} key={label} onClick={() => setTab(label)}>{label}</button>)}</nav>
    {error && <p role="alert" className="inline-message error">{error}</p>}{!data && <p role="status">{loading ? 'Memuat affiliator…' : 'Data unavailable.'}</p>}
    {data && <>
      {tab==='Performance' && <><div className={styles.actions}><label className={styles.field}>Dari<input className="field-input" type="date" value={from} onChange={event => setFrom(event.target.value)} /></label><label className={styles.field}>Sampai<input className="field-input" type="date" value={to} onChange={event => setTo(event.target.value)} /></label><button className="button button-secondary" onClick={() => void load()}>Refresh</button></div>
        <AffiliateMetrics data={data} /><CurrentRates data={data} now={now} /><PerformanceChart trend={data.trend} /><ReferralCodes data={data} now={now} />
        <section><h2>Transaction attribution</h2><TransactionTable data={data} /><div className={styles.actions}><button className="button button-secondary" disabled={offset===0} onClick={() => setOffset(Math.max(0,offset-100))}>Previous</button><button className="button button-secondary" disabled={!data.pagination.hasMore} onClick={() => setOffset(offset+100)}>Next</button></div></section><PayoutHistory data={data} /></>}
      {tab==='Configuration & Payouts' && <AffiliateAdminConfig data={data} reload={load} />}
      {tab==='Agreements' && <section><h2>Agreement acceptance history</h2>{data.agreementStatus.length===0 && <p>No published agreements.</p>}{data.agreementStatus.map(agreement => <details className={styles.history} key={agreement.id}><summary>v{agreement.version} · Effective {dateTime(agreement.effectiveAt)} · {agreement.acceptedAt ? `Accepted ${dateTime(agreement.acceptedAt)}` : 'Awaiting acceptance'}</summary>{agreement.snapshot && <><p className={styles.muted}>SHA-256 {agreement.contentHash}</p><AgreementDocument content={agreement.snapshot} /></>}</details>)}</section>}
      {tab==='Boost History' && <><section><h2>Current monthly quotas</h2><div className={styles.columns}>{data.quotas.map(q => <p key={q.id}>{boostNames[q.type]}: {q.allocated+q.bonus-q.used} remaining / {q.allocated+q.bonus} · {q.month}</p>)}</div></section><div className={styles.overflow}><table className={styles.table}><thead><tr><th>Type</th><th>Activated · WIB</th><th>Expires · WIB</th><th>Transactions</th><th>Impact before refund</th></tr></thead><tbody>{data.boosts.map(b => <tr key={b.id}><td>{boostNames[b.type]}</td><td>{dateTime(b.activatedAt)}</td><td>{dateTime(b.expiresAt)}</td><td>{b.successfulTransactions}</td><td>{money(b.impact)}</td></tr>)}</tbody></table></div></>}
      {tab==='Audit Log' && <section><h2>Administrative & financial audit</h2>{data.audit?.map(event => <details key={event.id} className={styles.history}><summary>{dateTime(event.createdAt)} · {event.event} · {event.actorId}</summary><pre>{JSON.stringify(event.after,null,2)}</pre></details>)}</section>}
    </>}
  </div></div>;
}
