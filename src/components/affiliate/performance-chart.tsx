import { money } from './types';
import styles from './affiliate.module.css';

export function PerformanceChart({ trend }: { trend: Array<{ day: string; commission: number }> }) {
  if (!trend.length) return <p className={styles.muted}>Belum ada komisi pada periode ini.</p>;
  const max = Math.max(1,...trend.map(p => Math.abs(p.commission)));
  const points = trend.map((point,index) => `${30+index/Math.max(1,trend.length-1)*740},${100-point.commission/max*75}`).join(' ');
  return <figure><svg className={styles.chart} viewBox="0 0 800 200" role="img" aria-label="Daily commission trend in IDR">
    <line x1="30" y1="100" x2="770" y2="100" stroke="currentColor" opacity="0.2" />
    <polyline points={points} fill="none" stroke="currentColor" strokeWidth="2" />
    {trend.map((point,index) => <circle key={point.day} cx={30+index/Math.max(1,trend.length-1)*740} cy={100-point.commission/max*75} r="3" fill="currentColor"><title>{point.day}: {money(point.commission)}</title></circle>)}
    <text x="30" y="195" fill="currentColor" fontSize="12">{trend[0].day}</text><text x="770" y="195" fill="currentColor" textAnchor="end" fontSize="12">{trend[trend.length-1].day}</text>
  </svg><figcaption className={styles.muted}>Daily net commission, WIB. Refund adjustments may create negative days.</figcaption>
    <details><summary>View chart data</summary><table className={styles.table}><thead><tr><th>Date · WIB</th><th>Net commission</th></tr></thead><tbody>{trend.map(row => <tr key={row.day}><td>{row.day}</td><td>{money(row.commission)}</td></tr>)}</tbody></table></details>
  </figure>;
}
