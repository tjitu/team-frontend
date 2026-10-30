'use client';

import { useEffect, useState } from 'react';
import { api, RevenueSummary, signInUrl } from '@/lib/api';

const rupiah = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });
const monthLabel = new Intl.DateTimeFormat('en-US', { month: 'short', year: '2-digit', timeZone: 'UTC' });
const jituAppUrl = (process.env.NEXT_PUBLIC_JITU_APP_URL ?? 'https://jituptn.com').replace(/\/$/, '');

const services = [
  { name: 'Tryouts', description: 'Create and manage tryout schedules, questions, and results.', href: '/admin/tryout', label: 'Manage tryouts', icon: 'T' },
  { name: 'Pricing & packages', description: 'Update coin packages and the prices shown to students.', href: '/admin/packages', label: 'Manage packages', icon: 'P' },
  { name: 'Users', description: 'Review student accounts, access, and account activity.', href: '/admin/user', label: 'Manage users', icon: 'U' },
  { name: 'Careers & hiring', description: 'Review open roles and manage candidate applications.', href: '/admin/hiring', label: 'Manage hiring', icon: 'C' },
  { name: 'Payments', description: 'Review payment records and transaction status.', href: '/admin/payments', label: 'Review payments', icon: '$' },
  { name: 'Daily questions', description: 'Manage daily practice questions and activity.', href: '/admin/daily', label: 'Manage questions', icon: 'D' },
  { name: 'AI question drafts', description: 'Generate and review AI-assisted question drafts.', href: '/admin/ai-generator', label: 'Review drafts', icon: 'AI' },
];

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
      const message = cause instanceof Error ? cause.message : 'Could not load revenue data.';
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
      <div><p className="page-eyebrow">Administration</p><h1>Control Center</h1><p className="page-subtitle">Manage Jitu services and monitor platform revenue.</p></div>
    </div>

    <section className="control-services" aria-labelledby="control-services-title">
      <div className="section-heading control-section-heading"><div><h2 id="control-services-title">Jitu services</h2><p>Open a service in the Jitu admin workspace.</p></div><span>7 services</span></div>
      <div className="control-service-grid">
        {services.map((service) => <a className="control-service-card" href={`${jituAppUrl}${service.href}`} target="_blank" rel="noreferrer" key={service.href}>
          <span className="control-service-icon" aria-hidden="true">{service.icon}</span>
          <span className="control-service-copy"><strong>{service.name}</strong><span>{service.description}</span></span>
          <span className="control-service-action">{service.label}<svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M4 12 12 4M5 4h7v7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
        </a>)}
      </div>
      <p className="control-service-note">These links require an administrator account in Jitu.</p>
    </section>

    <section className="control-revenue" id="revenue" aria-labelledby="revenue-title">
      <div className="section-heading control-section-heading">
        <div><h2 id="revenue-title">Revenue overview</h2><p>Track confirmed and pending payments recorded by Jitu.</p></div>
        <button className="button button-secondary" onClick={() => void load()} disabled={loading}>{loading ? 'Loading…' : 'Reload revenue'}</button>
      </div>
      {error && <div className="inline-message error" role="alert">{error}</div>}
      {!loading && summary && !summary.configured && <div className="inline-message revenue-source-notice" role="status"><div><strong>Payment source is not connected</strong><p>Add a read-only PostgreSQL connection for Jitu to <code>JITU_PURCHASES_DATABASE_URL</code> in the backend environment.</p></div></div>}
      {loading ? <div className="revenue-metrics" aria-label="Loading revenue summary">{[1, 2, 3].map((item) => <div className="loading-skeleton" key={item} />)}</div> : summary && <>
        <div className="revenue-metrics">
          <article className="revenue-metric"><span>Total confirmed revenue</span><strong>{summary.configured ? rupiah.format(summary.totalRevenue) : '—'}</strong><small>Total payments with confirmed status</small></article>
          <article className="revenue-metric"><span>Successful payments</span><strong>{summary.configured ? summary.confirmedPayments.toLocaleString('en-US') : '—'}</strong><small>Transactions with confirmed status</small></article>
          <article className="revenue-metric"><span>Pending payments</span><strong>{summary.configured ? summary.pendingPayments.toLocaleString('en-US') : '—'}</strong><small>Transactions with pending status</small></article>
        </div>
        <section className="revenue-panel">
          <div className="section-heading"><div><h2>Monthly revenue</h2><p>Last 12 months, based on the amount recorded at the time of payment.</p></div></div>
          {!summary.configured ? <div className="revenue-empty">The chart will appear once a payment source is connected.</div> : summary.confirmedPayments === 0 ? <div className="revenue-empty">No confirmed payments yet.</div> : <div className="revenue-chart" role="img" aria-label="Confirmed revenue by month over the last 12 months">
            {summary.monthlyRevenue.map(({ month, revenue, confirmedPayments }) => <div className="revenue-chart-month" key={month} title={`${formatMonth(month)} · ${rupiah.format(revenue)} · ${confirmedPayments} payments`}>
              <div className="revenue-chart-bar-area"><span className="revenue-chart-bar" style={{ height: `${revenue ? Math.max(5, (revenue / maxRevenue) * 100) : 0}%` }} /></div>
              <span className="revenue-chart-label">{formatMonth(month)}</span>
            </div>)}
          </div>}
        </section>
      </>}
    </section>
  </div>;
}
