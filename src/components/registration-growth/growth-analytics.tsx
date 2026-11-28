'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import styles from './growth.module.css';
type Metrics = { conversionRate: number; abandonmentRate: number; approvalRate: number; rejectionRate: number;
  averageTurnaroundSeconds: number | null; communityClickThroughRate: number; communityClicks: number };
export function GrowthAnalytics({ tryoutId, refresh }: { tryoutId: string; refresh: number }) {
  const [metrics, setMetrics] = useState<Metrics | null>(null), [error, setError] = useState('');
  useEffect(() => {
    let cancelled = false;
    api.get<Metrics>(`/team/control-center/tryouts/${encodeURIComponent(tryoutId)}/growth/analytics`, { force: true }).then(value => {
      if (!cancelled) { setMetrics(value); setError(''); }
    }).catch(() => { if (!cancelled) setError('Analitik belum dapat dimuat.'); });
    return () => { cancelled = true; };
  }, [tryoutId, refresh]);
  return <details><summary>Analitik Registration &amp; Growth</summary>
    {error && <p role="alert">{error}</p>}
    {metrics && <><div className={styles.metrics}>
      {[
        ['Konversi pendaftaran', `${metrics.conversionRate}%`], ['Modal ditinggalkan', `${metrics.abandonmentRate}%`],
        ['Disetujui dari keputusan', `${metrics.approvalRate}%`], ['Ditolak dari keputusan', `${metrics.rejectionRate}%`],
        ['Rata-rata waktu verifikasi', metrics.averageTurnaroundSeconds == null ? '—' : `${Math.round(metrics.averageTurnaroundSeconds / 60)} menit`],
        ['CTR undangan komunitas', `${metrics.communityClickThroughRate}%`], ['Klik komunitas', metrics.communityClicks],
      ].map(([label, value]) => <div className={styles.metric} key={label}><span className={styles.muted}>{label}</span><strong>{value}</strong></div>)}
    </div><p className={styles.muted}>Konversi dihitung per sesi pendaftaran. Klik undangan bukan bukti bergabung; checklist peserta bukan verifikasi aktivitas Instagram.</p></>}
  </details>;
}
