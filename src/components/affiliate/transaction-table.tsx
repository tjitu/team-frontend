import { AffiliateReport, boostNames, dateTime, money, percent } from './types';
import styles from './affiliate.module.css';

export function TransactionTable({ data }: { data: AffiliateReport }) {
  return <div className={styles.overflow}><table className={styles.table}><thead><tr><th>Date · WIB</th><th>Reference / Product</th><th>Referral</th><th>Customer discount</th><th>Eligible paid amount</th><th>Applied rate / Boost</th><th>Net commission</th><th>Status</th></tr></thead><tbody>
    {data.transactions.map(row => <tr key={row.id}><td>{dateTime(row.createdAt)}</td><td>{row.reference}<br /><span className={styles.muted}>{row.product}</span></td><td>{row.code}</td><td>{money(row.discountAmount)}</td><td>{money(row.paidAmount)}</td><td>{percent(row.commissionRate)}<br /><span className={styles.muted}>{row.boostIds.map(id => { const boost=data.boosts.find(b => b.id===id); return boost ? boostNames[boost.type] : id; }).join(', ') || 'Standard'}</span></td><td>{row.commissionStatus==='PENDING' ? `${money(row.commission)} (estimated)` : money(row.earned)}</td><td><span className={styles.badge}>{row.commissionStatus}</span>{row.earned<row.commission && row.commissionStatus==='EARNED' && <p className={styles.muted}>Refund adjusted</p>}</td></tr>)}
    {data.transactions.length===0 && <tr><td colSpan={8}>Belum ada transaksi pada periode ini.</td></tr>}
  </tbody></table></div>;
}
