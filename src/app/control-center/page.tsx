'use client';

import { useEffect, useState } from 'react';
import { api, RevenueSummary, signInUrl } from '@/lib/api';

const rupiah = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });
const monthLabel = new Intl.DateTimeFormat('id-ID', { month: 'short', year: '2-digit', timeZone: 'UTC' });

function formatMonth(value: string) {
  return monthLabel.format(new Date(`${value}-01T00:00:00.000Z`));
}

export default function ControlCenterPage() {
  const [summary, setSummary] = useState<RevenueSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      setSummary(await api.get<RevenueSummary>('/team/control-center/revenue'));
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Data revenue gagal dimuat.';
      if (message === 'SESSION_EXPIRED') window.location.assign(signInUrl());
      else setError(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  const maxRevenue = Math.max(1, ...(summary?.monthlyRevenue.map(({ revenue }) => revenue) ?? []));

  return <div className="page-content">
    <div className="page-heading">
      <div><p className="page-eyebrow">Administrasi</p><h1>Control Center</h1><p className="page-subtitle">Pantau pendapatan dari transaksi pembayaran yang terkonfirmasi.</p></div>
      <button className="button button-secondary" onClick={() => void load()} disabled={loading}>{loading ? 'Memuat…' : 'Muat ulang'}</button>
    </div>
    {error && <div className="inline-message error" role="alert">{error}</div>}
    {!loading && summary && !summary.configured && <div className="inline-message revenue-source-notice" role="status"><div><strong>Sumber pembayaran belum tersambung</strong><p>Tambahkan koneksi PostgreSQL read-only Jitu ke <code>JITU_PURCHASES_DATABASE_URL</code> di environment backend.</p></div></div>}
    {loading ? <div className="revenue-metrics" aria-label="Memuat ringkasan revenue">{[1, 2, 3].map((item) => <div className="loading-skeleton" key={item} />)}</div> : summary && <>
      <div className="revenue-metrics">
        <article className="revenue-metric"><span>Total revenue terkonfirmasi</span><strong>{summary.configured ? rupiah.format(summary.totalRevenue) : '—'}</strong><small>Akumulasi pembayaran berstatus confirmed</small></article>
        <article className="revenue-metric"><span>Pembayaran berhasil</span><strong>{summary.configured ? summary.confirmedPayments.toLocaleString('id-ID') : '—'}</strong><small>Transaksi berstatus confirmed</small></article>
        <article className="revenue-metric"><span>Menunggu pembayaran</span><strong>{summary.configured ? summary.pendingPayments.toLocaleString('id-ID') : '—'}</strong><small>Transaksi berstatus pending</small></article>
      </div>
      <section className="revenue-panel">
        <div className="section-heading"><div><h2>Revenue bulanan</h2><p>12 bulan terakhir, dihitung dari jumlah pembayaran saat transaksi.</p></div></div>
        {!summary.configured ? <div className="revenue-empty">Grafik akan tampil setelah sumber pembayaran tersambung.</div> : summary.confirmedPayments === 0 ? <div className="revenue-empty">Belum ada pembayaran terkonfirmasi.</div> : <div className="revenue-chart" role="img" aria-label="Grafik revenue terkonfirmasi per bulan selama 12 bulan terakhir">
          {summary.monthlyRevenue.map(({ month, revenue, confirmedPayments }) => <div className="revenue-chart-month" key={month} title={`${formatMonth(month)} · ${rupiah.format(revenue)} · ${confirmedPayments} pembayaran`}>
            <div className="revenue-chart-bar-area"><span className="revenue-chart-bar" style={{ height: `${revenue ? Math.max(5, (revenue / maxRevenue) * 100) : 0}%` }} /></div>
            <span className="revenue-chart-label">{formatMonth(month)}</span>
          </div>)}
        </div>}
      </section>
    </>}
  </div>;
}
