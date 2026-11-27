'use client';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { api, CurrentMember } from '@/lib/api';
import { AffiliateListItem, money, percent } from './types';
import styles from './affiliate.module.css';

export function AffiliateAdminList() {
  const [rows,setRows] = useState<AffiliateListItem[] | null>(null);
  const [member,setMember] = useState<CurrentMember | null>(null);
  const [error,setError] = useState(''); const [search,setSearch] = useState('');
  const load = useCallback(async () => {
    try {
      const [items,current] = await Promise.all([api.get<AffiliateListItem[]>('/team/affiliate/admin',{ force: true }),api.get<CurrentMember>('/team/me')]);
      setRows(items); setMember(current); setError('');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Affiliators tidak dapat dimuat.'); }
  },[]);
  useEffect(() => { void load(); },[load]);
  return <div className="page-content"><div className={styles.stack}>
    <div className={styles.toolbar}><div><h1>Affiliate Management</h1><p className={styles.muted}>Kelola program melalui Team Management dan Referral Management yang ada.</p></div><div className={styles.actions}>
      <Link className="button button-secondary" href="/team">Add / manage accounts</Link><Link className="button button-secondary" href="/control-center?section=vouchers">Referral codes</Link>{member?.role==='SYSTEM_OWNER' && <Link className="button button-primary" href="/affiliates/agreements">Manage agreements</Link>}</div></div>
    {error && <p className="inline-message error" role="alert">{error} <button className="button button-secondary" onClick={() => void load()}>Retry</button></p>}
    <label className={styles.field}>Search affiliators<input className="field-input" value={search} onChange={event => setSearch(event.target.value)} /></label>
    <div className={styles.overflow}><table className={styles.table}><thead><tr><th>Affiliator</th><th>Account / Agreement</th><th>Base discount / Commission</th><th>Successful referrals</th><th>Generated sales</th><th>Net earned</th><th>Paid</th><th>Details</th></tr></thead><tbody>
      {rows?.filter(row => `${row.name} ${row.identifier}`.toLowerCase().includes(search.toLowerCase())).map(row => <tr key={row.id}><td>{row.name}<br /><span className={styles.muted}>{row.identifier}</span></td><td>{row.isActive ? 'Active' : 'Inactive'}<br />{row.agreementAccepted ? 'Accepted' : 'Acceptance required'}</td><td>{percent(row.config.discount)} / {percent(row.config.commission)}</td><td>{row.referrals}</td><td>{money(row.sales)}</td><td>{money(row.earned)}</td><td>{money(row.paid)}</td><td><Link href={`/affiliates/${row.id}`} className="button button-secondary">View affiliate</Link></td></tr>)}
      {!rows && !error && <tr><td colSpan={8}>Memuat affiliators…</td></tr>}{rows?.length===0 && <tr><td colSpan={8}>Belum ada affiliator. Buat akun dengan role Affiliator di Team Management.</td></tr>}
    </tbody></table></div>
  </div></div>;
}
