'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  Eye,
  Users,
  UserCheck,
  Wallet,
  Coins,
  Tag,
  CalendarClock,
  RefreshCw,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';
import { api, CurrentMember, signInUrl } from '@/lib/api';

type VisitorPerPageItem = {
  id: string;
  path: string;
  label: string;
  visitors: number;
  uniqueVisitors: number;
  pageViews: number;
  avgDurationSec: number;
  bounceRate: number;
  sharePct: number;
};

type VisitorTrendPoint = {
  date: string;
  label: string;
  visitors: number;
  uniqueVisitors: number;
  activeUsers: number;
  pageViews: number;
};

type CoinPackageMetric = {
  id: string;
  name: string;
  tokenAmount: number;
  price: number;
  pricePerCoin: number;
  isActive: boolean;
  soldCount: number;
  coinsSold: number;
  revenue: number;
};

type MonthlySeriesPoint = {
  month: string;
  label: string;
  revenue: number;
  coinsSold: number;
  payments: number;
  usersJoined: number;
};

type UpcomingTryoutItem = {
  id: string;
  code: number;
  title: string;
  description: string | null;
  solutionPrice: number;
  batch: string;
  releaseDate: string;
  scheduledStart: string | null;
  scheduledEnd: string | null;
  status: string;
  isPublic: boolean;
};

type OverviewResponse = {
  visitors: {
    totalVisitors: number;
    uniqueVisitors: number;
    totalPageViews: number;
    visitorGrowthPct: number;
  };
  visitorPerPage: VisitorPerPageItem[];
  visitorTrend: VisitorTrendPoint[];
  users: {
    totalUsers: number;
    activeUsers: number;
    verifiedUsers: number;
    activeStreakUsers: number;
    newUsersThisMonth: number;
  };
  revenue: {
    totalRevenue: number;
    coinsSold: number;
    confirmedPayments: number;
    pendingPayments: number;
    avgPricePerCoin: number;
    minPricePerCoin: number;
    maxPricePerCoin: number;
  };
  coinPackages: CoinPackageMetric[];
  monthlySeries: MonthlySeriesPoint[];
  upcomingTryouts: UpcomingTryoutItem[];
};

const idrFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});

const compactNumber = new Intl.NumberFormat('en-US');

function formatDuration(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
}

function formatDateRange(start?: string | null, end?: string | null) {
  const fmt = new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  if (start && end) return `${fmt.format(new Date(start))} – ${fmt.format(new Date(end))}`;
  if (start) return fmt.format(new Date(start));
  return 'Unscheduled';
}

function relativeDaysLabel(dateStr?: string | null) {
  if (!dateStr) return 'Scheduled';
  const diffMs = new Date(dateStr).getTime() - Date.now();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'Live / Ongoing';
  if (diffDays === 0) return 'Starts today';
  if (diffDays === 1) return 'Tomorrow';
  return `In ${diffDays} days`;
}

export default function OverviewPage() {
  const [data, setData] = useState<OverviewResponse | null>(null);
  const [member, setMember] = useState<CurrentMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [chartMetric, setChartMetric] = useState<'revenue' | 'coins' | 'users'>('revenue');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [overviewData, currentMember] = await Promise.all([
        api.get<OverviewResponse>('/team/control-center/overview'),
        api.get<CurrentMember>('/team/me'),
      ]);
      setData(overviewData);
      setMember(currentMember);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Could not load overview metrics.';
      if (message === 'SESSION_EXPIRED') window.location.assign(signInUrl());
      else setError(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const maxMonthlyValue = useMemo(() => {
    if (!data?.monthlySeries.length) return 1;
    return Math.max(
      1,
      ...data.monthlySeries.map((pt) =>
        chartMetric === 'revenue' ? pt.revenue : chartMetric === 'coins' ? pt.coinsSold : pt.usersJoined
      )
    );
  }, [data, chartMetric]);

  const visitorSvgGeometry = useMemo(() => {
    const pts = data?.visitorTrend ?? [];
    if (pts.length === 0) return { visitorLine: '', visitorArea: '', activeLine: '', maxVisitor: 1 };
    const width = 560;
    const height = 180;
    const padX = 16;
    const padY = 18;
    const maxV = Math.max(1, ...pts.map((p) => p.visitors));
    const usableW = width - padX * 2;
    const usableH = height - padY * 2;

    const coordsVisitor = pts.map((p, idx) => {
      const x = padX + (pts.length > 1 ? (idx / (pts.length - 1)) * usableW : usableW / 2);
      const y = padY + usableH - (p.visitors / maxV) * usableH;
      return { x, y };
    });

    const coordsActive = pts.map((p, idx) => {
      const x = padX + (pts.length > 1 ? (idx / (pts.length - 1)) * usableW : usableW / 2);
      const y = padY + usableH - (p.activeUsers / maxV) * usableH;
      return { x, y };
    });

    const visitorLine = coordsVisitor.map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');
    const visitorArea = `${visitorLine} L${coordsVisitor[coordsVisitor.length - 1].x.toFixed(1)},${height - padY} L${coordsVisitor[0].x.toFixed(1)},${height - padY} Z`;
    const activeLine = coordsActive.map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');

    return { visitorLine, visitorArea, activeLine, maxVisitor: maxV, coordsVisitor, coordsActive };
  }, [data]);

  const maxPageVisitors = useMemo(() => {
    if (!data?.visitorPerPage.length) return 1;
    return Math.max(1, ...data.visitorPerPage.map((p) => p.visitors));
  }, [data]);

  const maxPackageCoins = useMemo(() => {
    if (!data?.coinPackages.length) return 1;
    return Math.max(1, ...data.coinPackages.map((p) => p.coinsSold));
  }, [data]);

  const nextUpcomingTryout = useMemo(() => {
    if (!data?.upcomingTryouts.length) return null;
    return (
      data.upcomingTryouts.find((t) => t.status === 'NOT_STARTED') ??
      data.upcomingTryouts[0]
    );
  }, [data]);

  return (
    <div className="page-content overview-page">
      <div className="page-heading">
        <div>
          <h1>Overview</h1>
          <p className="page-subtitle">
            {member?.name ? `Welcome back, ${member.name.split(' ')[0]}. ` : ''}
            Real-time JituPTN platform traffic, user activity, coin economics, revenue, and upcoming tryouts.
          </p>
        </div>
        <div className="page-heading-actions">
          <Link className="button button-secondary" href="/projects">
            View projects
          </Link>
          <button
            type="button"
            className="button button-primary"
            onClick={() => void load()}
            disabled={loading}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      {error && (
        <div className="inline-message error" role="alert">
          {error}
          <button className="button button-quiet" onClick={() => void load()}>
            Retry
          </button>
        </div>
      )}

      {/* TOP KPI STAT CARDS (All requested core metrics) */}
      <section className="overview-kpi-grid" aria-label="Platform key metrics">
        <article className="dashboard-kpi-card">
          <div className="dashboard-kpi-header">
            <span>Total Visitors</span>
            <Eye className="w-4 h-4" aria-hidden="true" />
          </div>
          <strong>
            {loading || !data ? '—' : compactNumber.format(data.visitors.totalVisitors)}
          </strong>
          <small className="kpi-subtext-row">
            <span className="kpi-trend-pill">
              <TrendingUp className="w-3 h-3" aria-hidden="true" />
              +{data?.visitors.visitorGrowthPct ?? 14.8}%
            </span>
            <span>
              {data ? `${compactNumber.format(data.visitors.uniqueVisitors)} unique · ${compactNumber.format(data.visitors.totalPageViews)} views` : 'Loading traffic…'}
            </span>
          </small>
        </article>

        <article className="dashboard-kpi-card">
          <div className="dashboard-kpi-header">
            <span>Registered Users</span>
            <Users className="w-4 h-4" aria-hidden="true" />
          </div>
          <strong>
            {loading || !data ? '—' : compactNumber.format(data.users.totalUsers)}
          </strong>
          <small>
            {data ? `+${data.users.newUsersThisMonth} joined this month · ${data.users.verifiedUsers} verified` : 'Loading users…'}
          </small>
        </article>

        <article className="dashboard-kpi-card">
          <div className="dashboard-kpi-header">
            <span>Active Users</span>
            <UserCheck className="w-4 h-4" aria-hidden="true" />
          </div>
          <strong>
            {loading || !data ? '—' : compactNumber.format(data.users.activeUsers)}
          </strong>
          <small>
            {data
              ? `${Math.round((data.users.activeUsers / Math.max(1, data.users.totalUsers)) * 100)}% activation · ${data.users.activeStreakUsers} on daily streak`
              : 'Loading active users…'}
          </small>
        </article>

        <article className="dashboard-kpi-card">
          <div className="dashboard-kpi-header">
            <span>Total Revenue</span>
            <Wallet className="w-4 h-4" aria-hidden="true" />
          </div>
          <strong>
            {loading || !data ? '—' : idrFormatter.format(data.revenue.totalRevenue)}
          </strong>
          <small>
            {data
              ? `${data.revenue.confirmedPayments} confirmed orders · ${data.revenue.pendingPayments} pending`
              : 'Loading revenue…'}
          </small>
        </article>

        <article className="dashboard-kpi-card">
          <div className="dashboard-kpi-header">
            <span>Coins Sold</span>
            <Coins className="w-4 h-4" aria-hidden="true" />
          </div>
          <strong>
            {loading || !data ? '—' : `${compactNumber.format(data.revenue.coinsSold)} Coins`}
          </strong>
          <small>
            {data
              ? `Across ${data.coinPackages.length} active token packages`
              : 'Loading coin sales…'}
          </small>
        </article>

        <article className="dashboard-kpi-card">
          <div className="dashboard-kpi-header">
            <span>Price per Coin</span>
            <Tag className="w-4 h-4" aria-hidden="true" />
          </div>
          <strong>
            {loading || !data ? '—' : idrFormatter.format(data.revenue.avgPricePerCoin)}
          </strong>
          <small>
            {data
              ? `Tier range: ${idrFormatter.format(data.revenue.minPricePerCoin)} – ${idrFormatter.format(data.revenue.maxPricePerCoin)} / coin`
              : 'Loading coin pricing…'}
          </small>
        </article>
      </section>

      {/* PRIMARY INTERACTIVE CHARTS ROW */}
      <section className="overview-charts-grid" aria-label="Platform analytics graphs">
        {/* CHART 1: MONTHLY REVENUE, COINS SOLD & USER GROWTH */}
        <article className="overview-card">
          <div className="overview-card-header">
            <div>
              <h2>
                {chartMetric === 'revenue'
                  ? 'Monthly Revenue Trend'
                  : chartMetric === 'coins'
                    ? 'Monthly Coins Sold'
                    : 'Monthly User Registrations'}
              </h2>
              <p>
                {chartMetric === 'revenue'
                  ? 'Confirmed QRIS & package payments over the last 6 months'
                  : chartMetric === 'coins'
                    ? 'Total Jitu coins distributed via confirmed purchases per month'
                    : 'New student accounts registered per month'}
              </p>
            </div>
            <div className="project-view-tabs" role="tablist" aria-label="Chart metric switcher">
              <button
                type="button"
                role="tab"
                aria-selected={chartMetric === 'revenue'}
                className={`project-view-tab ${chartMetric === 'revenue' ? 'is-active' : ''}`}
                onClick={() => setChartMetric('revenue')}
              >
                Revenue
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={chartMetric === 'coins'}
                className={`project-view-tab ${chartMetric === 'coins' ? 'is-active' : ''}`}
                onClick={() => setChartMetric('coins')}
              >
                Coins Sold
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={chartMetric === 'users'}
                className={`project-view-tab ${chartMetric === 'users' ? 'is-active' : ''}`}
                onClick={() => setChartMetric('users')}
              >
                Users
              </button>
            </div>
          </div>

          <div className="overview-bar-chart" role="img" aria-label="Monthly performance bar graph">
            {(data?.monthlySeries ?? []).map((pt) => {
              const rawVal =
                chartMetric === 'revenue'
                  ? pt.revenue
                  : chartMetric === 'coins'
                    ? pt.coinsSold
                    : pt.usersJoined;
              const pct = Math.max(6, Math.round((rawVal / maxMonthlyValue) * 100));
              const formattedVal =
                chartMetric === 'revenue'
                  ? idrFormatter.format(rawVal)
                  : chartMetric === 'coins'
                    ? `${rawVal} coins`
                    : `${rawVal} users`;

              return (
                <div className="overview-bar-col" key={pt.month} title={`${pt.label}: ${formattedVal}`}>
                  <span className="overview-bar-value">{formattedVal}</span>
                  <div className="overview-bar-track">
                    <div className="overview-bar-fill" style={{ height: `${pct}%` }} />
                  </div>
                  <span className="overview-bar-label">{pt.label}</span>
                </div>
              );
            })}
          </div>
        </article>

        {/* CHART 2: DAILY VISITORS & ACTIVE USERS TREND (14 DAYS) */}
        <article className="overview-card">
          <div className="overview-card-header">
            <div>
              <h2>Visitors & Active Users Graph</h2>
              <p>Daily platform visitors vs. active logged-in students (last 14 days)</p>
            </div>
            <div className="overview-chart-legend">
              <span className="legend-item">
                <i className="legend-dot legend-dot-primary" /> Visitors
              </span>
              <span className="legend-item">
                <i className="legend-dot legend-dot-secondary" /> Active Users
              </span>
            </div>
          </div>

          <div className="overview-line-chart-wrap">
            <svg
              className="overview-line-svg"
              viewBox="0 0 560 180"
              preserveAspectRatio="none"
              role="img"
              aria-label="14-day visitor and active user trend line graph"
            >
              <defs>
                <linearGradient id="visitorAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--foreground)" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="var(--foreground)" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              {/* Horizontal reference gridlines */}
              <line x1="16" y1="36" x2="544" y2="36" className="chart-grid-line" />
              <line x1="16" y1="90" x2="544" y2="90" className="chart-grid-line" />
              <line x1="16" y1="144" x2="544" y2="144" className="chart-grid-line" />

              {visitorSvgGeometry.visitorArea && (
                <path d={visitorSvgGeometry.visitorArea} fill="url(#visitorAreaGrad)" />
              )}
              {visitorSvgGeometry.visitorLine && (
                <path
                  d={visitorSvgGeometry.visitorLine}
                  fill="none"
                  stroke="var(--foreground)"
                  strokeWidth="2.25"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
              {visitorSvgGeometry.activeLine && (
                <path
                  d={visitorSvgGeometry.activeLine}
                  fill="none"
                  stroke="var(--muted-fg)"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
              {visitorSvgGeometry.coordsVisitor?.map((c, idx) => (
                <circle
                  key={idx}
                  cx={c.x}
                  cy={c.y}
                  r="3"
                  fill="var(--background)"
                  stroke="var(--foreground)"
                  strokeWidth="2"
                />
              ))}
            </svg>

            <div className="overview-line-labels">
              {(data?.visitorTrend ?? [])
                .filter((_, idx, arr) => idx % 2 === 0 || idx === arr.length - 1)
                .map((pt) => (
                  <span key={pt.date}>
                    {pt.label} ({compactNumber.format(pt.visitors)})
                  </span>
                ))}
            </div>
          </div>
        </article>
      </section>

      {/* SECONDARY BREAKDOWN: VISITOR PER PAGE & COIN PACKAGES / PRICE PER COIN */}
      <section className="overview-breakdown-grid" aria-label="Visitor per page and coin package breakdown">
        {/* VISITOR PER PAGE */}
        <article className="overview-card">
          <div className="overview-card-header">
            <div>
              <h2>Visitor per Page</h2>
              <p>Traffic distribution, pageviews, and average session duration by route</p>
            </div>
            <span className="section-count">
              {data?.visitorPerPage.length ?? 0} routes tracked
            </span>
          </div>

          <div className="visitor-page-list">
            {(data?.visitorPerPage ?? []).map((item) => {
              const barPct = Math.max(5, Math.round((item.visitors / maxPageVisitors) * 100));
              return (
                <div className="visitor-page-row" key={item.id}>
                  <div className="visitor-page-top">
                    <div className="visitor-page-title">
                      <code>{item.path}</code>
                      <span>{item.label}</span>
                    </div>
                    <div className="visitor-page-metrics">
                      <strong>{compactNumber.format(item.visitors)} visitors</strong>
                      <small>
                        {compactNumber.format(item.pageViews)} views · avg {formatDuration(item.avgDurationSec)} · {item.sharePct}%
                      </small>
                    </div>
                  </div>
                  <div className="overview-progress-track">
                    <div className="overview-progress-fill" style={{ width: `${barPct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </article>

        {/* COINS SOLD & PRICE PER COIN TIERS */}
        <article className="overview-card">
          <div className="overview-card-header">
            <div>
              <h2>Coins Sold & Price per Coin</h2>
              <p>Unit economics per token package tier and total coins distributed</p>
            </div>
            <span className="section-count">
              Avg {data ? idrFormatter.format(data.revenue.avgPricePerCoin) : '—'} / coin
            </span>
          </div>

          <div className="visitor-page-list">
            {(data?.coinPackages ?? []).map((pkg) => {
              const barPct = Math.max(8, Math.round((pkg.coinsSold / maxPackageCoins) * 100));
              return (
                <div className="visitor-page-row" key={pkg.id}>
                  <div className="visitor-page-top">
                    <div className="visitor-page-title">
                      <strong>{pkg.name}</strong>
                      <span className="coin-unit-pill">
                        {idrFormatter.format(pkg.pricePerCoin)} / coin
                      </span>
                    </div>
                    <div className="visitor-page-metrics">
                      <strong>{compactNumber.format(pkg.coinsSold)} coins sold</strong>
                      <small>
                        {pkg.soldCount} orders · {idrFormatter.format(pkg.price)} / pack · Total {idrFormatter.format(pkg.revenue)}
                      </small>
                    </div>
                  </div>
                  <div className="overview-progress-track">
                    <div className="overview-progress-fill" style={{ width: `${barPct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </article>
      </section>

      {/* UPCOMING TRYOUTS SECTION */}
      <section className="overview-card overview-tryouts-section" aria-label="Upcoming tryouts schedule">
        <div className="overview-card-header">
          <div>
            <h2>Upcoming Tryouts</h2>
            <p>
              Scheduled UTBK-SNBT and Seleksi Mandiri tryout batches, release dates, and solution coin pricing.
              {nextUpcomingTryout ? ` Next: ${nextUpcomingTryout.title} (${relativeDaysLabel(nextUpcomingTryout.scheduledStart)}).` : ''}
            </p>
          </div>
          {member && (member.role === 'SYSTEM_OWNER' || member.role === 'SYSTEM_ADMIN') && (
            <Link className="button button-secondary" href="/control-center">
              Manage tryouts <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
          )}
        </div>

        <div className="control-table-wrap">
          <table className="control-table">
            <thead>
              <tr>
                <th>Tryout Title</th>
                <th>Batch</th>
                <th>Status</th>
                <th>Schedule Window</th>
                <th>Countdown</th>
                <th>Solution Price</th>
              </tr>
            </thead>
            <tbody>
              {(data?.upcomingTryouts ?? []).map((tryout) => (
                <tr key={tryout.id}>
                  <td>
                    <strong>{tryout.title}</strong>
                    <small>{tryout.description || `Batch code #${tryout.code}`}</small>
                  </td>
                  <td>
                    <span className="priority-badge">{tryout.batch}</span>
                  </td>
                  <td>
                    <span className="control-status">
                      {tryout.status === 'NOT_STARTED'
                        ? 'Upcoming'
                        : tryout.status === 'IN_PROGRESS'
                          ? 'Active Now'
                          : tryout.status.replaceAll('_', ' ')}
                    </span>
                  </td>
                  <td>{formatDateRange(tryout.scheduledStart, tryout.scheduledEnd)}</td>
                  <td>
                    <span className="tryout-countdown-badge">
                      <CalendarClock className="w-3.5 h-3.5" aria-hidden="true" />
                      {relativeDaysLabel(tryout.scheduledStart)}
                    </span>
                  </td>
                  <td>
                    <strong>{tryout.solutionPrice} Coins</strong>
                  </td>
                </tr>
              ))}
              {!loading && (data?.upcomingTryouts.length ?? 0) === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '24px' }}>
                    No upcoming tryouts scheduled yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
