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
  Globe,
  Smartphone,
  Laptop,
  Compass,
  Radio,
  X,
  Key,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Layers,
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

type DimensionMetricItem = {
  key: string;
  label: string;
  visitors: number;
  pageViews: number;
  sharePct: number;
  flag?: string;
};

type CustomEventItem = {
  eventName: string;
  label: string;
  count: number;
  visitors: number;
};

type VercelConfigStatus = {
  configured: boolean;
  hasToken: boolean;
  tokenMasked: string | null;
  projectId: string;
  teamId: string;
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
  visitorsSource?: 'vercel' | 'database';
  visitors: {
    totalVisitors: number;
    uniqueVisitors: number;
    totalPageViews: number;
    visitorGrowthPct: number;
  };
  visitorPerPage: VisitorPerPageItem[];
  visitorTrend: VisitorTrendPoint[];
  topCountries?: DimensionMetricItem[];
  topDevices?: DimensionMetricItem[];
  topReferrers?: DimensionMetricItem[];
  topBrowsers?: DimensionMetricItem[];
  topOperatingSystems?: DimensionMetricItem[];
  customEvents?: CustomEventItem[];
  vercelConfig?: VercelConfigStatus;
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
  const [analyticsTab, setAnalyticsTab] = useState<'pages' | 'countries' | 'sources' | 'devices' | 'events'>('pages');

  // Vercel credentials connection modal state
  const [showVercelModal, setShowVercelModal] = useState(false);
  const [vercelToken, setVercelToken] = useState('');
  const [vercelProjectId, setVercelProjectId] = useState('');
  const [vercelTeamId, setVercelTeamId] = useState('');
  const [savingVercel, setSavingVercel] = useState(false);
  const [vercelModalError, setVercelModalError] = useState('');
  const [vercelModalSuccess, setVercelModalSuccess] = useState('');

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
      if (overviewData.vercelConfig) {
        setVercelProjectId(overviewData.vercelConfig.projectId || '');
        if (overviewData.vercelConfig.teamId) setVercelTeamId(overviewData.vercelConfig.teamId);
      }
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

  async function handleSaveVercelCredentials(e: React.FormEvent) {
    e.preventDefault();
    if (!vercelToken.trim() || !vercelProjectId.trim()) {
      setVercelModalError('Please enter both Vercel Token and Project ID.');
      return;
    }
    setSavingVercel(true);
    setVercelModalError('');
    setVercelModalSuccess('');

    try {
      const res = await api.post<{ success: boolean; message: string; visitors?: number }>(
        '/team/control-center/vercel-config',
        {
          token: vercelToken.trim(),
          projectId: vercelProjectId.trim(),
          teamId: vercelTeamId.trim() || undefined,
        }
      );

      if (res.success) {
        setVercelModalSuccess(`${res.message} (${res.visitors ?? 0} visitors verified). Reloading analytics…`);
        setTimeout(() => {
          setShowVercelModal(false);
          setVercelToken('');
          void load();
        }, 1500);
      } else {
        setVercelModalError(res.message);
      }
    } catch (err) {
      setVercelModalError(err instanceof Error ? err.message : 'Failed to connect to Vercel API.');
    } finally {
      setSavingVercel(false);
    }
  }

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

  const maxCountryVisitors = useMemo(() => {
    if (!data?.topCountries?.length) return 1;
    return Math.max(1, ...data.topCountries.map((c) => c.visitors));
  }, [data]);

  const maxReferrerVisitors = useMemo(() => {
    if (!data?.topReferrers?.length) return 1;
    return Math.max(1, ...data.topReferrers.map((r) => r.visitors));
  }, [data]);

  const maxDeviceVisitors = useMemo(() => {
    if (!data?.topDevices?.length) return 1;
    return Math.max(1, ...data.topDevices.map((d) => d.visitors));
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1>Overview</h1>
            <button
              type="button"
              className={`source-pill ${data?.visitorsSource === 'vercel' ? 'is-vercel' : 'is-clickable'}`}
              onClick={() => setShowVercelModal(true)}
              title={
                data?.visitorsSource === 'vercel'
                  ? 'Connected to Vercel Web Analytics REST API. Click to view configuration.'
                  : 'Live platform database telemetry. Click to connect Vercel Web Analytics API.'
              }
            >
              {data?.visitorsSource === 'vercel' ? '● Live Vercel Analytics' : '⚙ Connect Vercel API'}
            </button>
          </div>
          <p className="page-subtitle">
            {member?.name ? `Welcome back, ${member.name.split(' ')[0]}. ` : ''}
            Real-time JituPTN platform traffic, audience intelligence, user activity, coin economics, and upcoming tryouts.
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

      {/* TOP KPI STAT CARDS */}
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

      {/* WEB ANALYTICS & AUDIENCE INTELLIGENCE SECTION */}
      <section className="overview-card overview-analytics-intelligence" aria-label="Web Analytics Audience Intelligence">
        <div className="overview-card-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2>Web Analytics & Audience Intelligence</h2>
              <span className="source-pill" style={{ fontSize: '11px' }}>
                Vercel REST API Dimension Queries
              </span>
            </div>
            <p>
              Granular breakdown of website visitors by routes, geographic location, acquisition referrers, device platforms, and custom event tracking.
            </p>
          </div>
          <div className="project-view-tabs" role="tablist" aria-label="Analytics dimension tabs">
            <button
              type="button"
              role="tab"
              aria-selected={analyticsTab === 'pages'}
              className={`project-view-tab ${analyticsTab === 'pages' ? 'is-active' : ''}`}
              onClick={() => setAnalyticsTab('pages')}
            >
              Pages
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={analyticsTab === 'countries'}
              className={`project-view-tab ${analyticsTab === 'countries' ? 'is-active' : ''}`}
              onClick={() => setAnalyticsTab('countries')}
            >
              Countries
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={analyticsTab === 'sources'}
              className={`project-view-tab ${analyticsTab === 'sources' ? 'is-active' : ''}`}
              onClick={() => setAnalyticsTab('sources')}
            >
              Sources
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={analyticsTab === 'devices'}
              className={`project-view-tab ${analyticsTab === 'devices' ? 'is-active' : ''}`}
              onClick={() => setAnalyticsTab('devices')}
            >
              Devices & OS
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={analyticsTab === 'events'}
              className={`project-view-tab ${analyticsTab === 'events' ? 'is-active' : ''}`}
              onClick={() => setAnalyticsTab('events')}
            >
              Events
            </button>
          </div>
        </div>

        {/* TAB 1: VISITOR PER PAGE */}
        {analyticsTab === 'pages' && (
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
            {(data?.visitorPerPage.length ?? 0) === 0 && (
              <p className="sidebar-empty" style={{ padding: '24px' }}>No page route telemetry recorded yet.</p>
            )}
          </div>
        )}

        {/* TAB 2: COUNTRIES & GEOLOCATION (by=country) */}
        {analyticsTab === 'countries' && (
          <div className="visitor-page-list">
            {(data?.topCountries ?? []).map((c) => {
              const barPct = Math.max(5, Math.round((c.visitors / maxCountryVisitors) * 100));
              return (
                <div className="visitor-page-row" key={c.key}>
                  <div className="visitor-page-top">
                    <div className="visitor-page-title">
                      <span style={{ fontSize: '18px', marginRight: '4px' }}>{c.flag || '🌐'}</span>
                      <strong>{c.label}</strong>
                      <span className="coin-unit-pill">{c.key}</span>
                    </div>
                    <div className="visitor-page-metrics">
                      <strong>{compactNumber.format(c.visitors)} visitors</strong>
                      <small>{compactNumber.format(c.pageViews)} views · {c.sharePct}% traffic share</small>
                    </div>
                  </div>
                  <div className="overview-progress-track">
                    <div className="overview-progress-fill" style={{ width: `${barPct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 3: SOURCES & REFERRERS (by=referrerHostname) */}
        {analyticsTab === 'sources' && (
          <div className="visitor-page-list">
            {(data?.topReferrers ?? []).map((r) => {
              const barPct = Math.max(5, Math.round((r.visitors / maxReferrerVisitors) * 100));
              return (
                <div className="visitor-page-row" key={r.key}>
                  <div className="visitor-page-top">
                    <div className="visitor-page-title">
                      <Compass className="w-4 h-4 text-muted-fg" aria-hidden="true" />
                      <strong>{r.label}</strong>
                      <code style={{ fontSize: '11px' }}>{r.key}</code>
                    </div>
                    <div className="visitor-page-metrics">
                      <strong>{compactNumber.format(r.visitors)} visitors</strong>
                      <small>{compactNumber.format(r.pageViews)} views · {r.sharePct}% share</small>
                    </div>
                  </div>
                  <div className="overview-progress-track">
                    <div className="overview-progress-fill" style={{ width: `${barPct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 4: DEVICES, OPERATING SYSTEMS & BROWSERS */}
        {analyticsTab === 'devices' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', padding: '16px' }}>
            {/* Device Types */}
            <div>
              <h3 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Smartphone className="w-3.5 h-3.5 text-muted-fg" /> Device Category
              </h3>
              <div className="visitor-page-list" style={{ padding: 0 }}>
                {(data?.topDevices ?? []).map((d) => (
                  <div className="visitor-page-row" key={d.key}>
                    <div className="visitor-page-top">
                      <div className="visitor-page-title">
                        <span>{d.label}</span>
                      </div>
                      <div className="visitor-page-metrics">
                        <strong>{compactNumber.format(d.visitors)} ({d.sharePct}%)</strong>
                      </div>
                    </div>
                    <div className="overview-progress-track">
                      <div className="overview-progress-fill" style={{ width: `${d.sharePct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Operating Systems */}
            <div>
              <h3 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Laptop className="w-3.5 h-3.5 text-muted-fg" /> Operating Systems
              </h3>
              <div className="visitor-page-list" style={{ padding: 0 }}>
                {(data?.topOperatingSystems ?? []).map((o) => (
                  <div className="visitor-page-row" key={o.key}>
                    <div className="visitor-page-top">
                      <div className="visitor-page-title">
                        <span>{o.label}</span>
                      </div>
                      <div className="visitor-page-metrics">
                        <strong>{compactNumber.format(o.visitors)} ({o.sharePct}%)</strong>
                      </div>
                    </div>
                    <div className="overview-progress-track">
                      <div className="overview-progress-fill" style={{ width: `${o.sharePct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Browsers */}
            <div>
              <h3 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Globe className="w-3.5 h-3.5 text-muted-fg" /> Browsers
              </h3>
              <div className="visitor-page-list" style={{ padding: 0 }}>
                {(data?.topBrowsers ?? []).map((b) => (
                  <div className="visitor-page-row" key={b.key}>
                    <div className="visitor-page-top">
                      <div className="visitor-page-title">
                        <span>{b.label}</span>
                      </div>
                      <div className="visitor-page-metrics">
                        <strong>{compactNumber.format(b.visitors)} ({b.sharePct}%)</strong>
                      </div>
                    </div>
                    <div className="overview-progress-track">
                      <div className="overview-progress-fill" style={{ width: `${b.sharePct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: CUSTOM EVENTS (events/aggregate) */}
        {analyticsTab === 'events' && (
          <div className="visitor-page-list">
            {(data?.customEvents ?? []).map((e) => (
              <div className="visitor-page-row" key={e.eventName}>
                <div className="visitor-page-top">
                  <div className="visitor-page-title">
                    <Radio className="w-4 h-4 text-muted-fg" aria-hidden="true" />
                    <strong>{e.label}</strong>
                    <code>{e.eventName}</code>
                  </div>
                  <div className="visitor-page-metrics">
                    <strong>{compactNumber.format(e.count)} triggers</strong>
                    <small>{compactNumber.format(e.visitors)} distinct users</small>
                  </div>
                </div>
              </div>
            ))}
            {(data?.customEvents?.length ?? 0) === 0 && (
              <p className="sidebar-empty" style={{ padding: '24px' }}>
                No custom Web Analytics events recorded yet. Trigger events via <code>track(&apos;event_name&apos;)</code> in your frontend.
              </p>
            )}
          </div>
        )}
      </section>

      {/* COIN PACKAGES & UPCOMING TRYOUTS ROW */}
      <section className="overview-breakdown-grid" aria-label="Coin packages and upcoming tryouts schedule">
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

        {/* UPCOMING TRYOUTS */}
        <article className="overview-card">
          <div className="overview-card-header">
            <div>
              <h2>Upcoming Tryouts</h2>
              <p>
                Scheduled UTBK batches.
                {nextUpcomingTryout ? ` Next: ${nextUpcomingTryout.title} (${relativeDaysLabel(nextUpcomingTryout.scheduledStart)}).` : ''}
              </p>
            </div>
            {member && (member.role === 'SYSTEM_OWNER' || member.role === 'SYSTEM_ADMIN') && (
              <Link className="button button-secondary" href="/control-center">
                Manage <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
              </Link>
            )}
          </div>

          <div className="visitor-page-list">
            {(data?.upcomingTryouts ?? []).slice(0, 4).map((tryout) => (
              <div className="visitor-page-row" key={tryout.id}>
                <div className="visitor-page-top">
                  <div className="visitor-page-title">
                    <strong>{tryout.title}</strong>
                    <span className="priority-badge">{tryout.batch}</span>
                  </div>
                  <div className="visitor-page-metrics">
                    <strong>{tryout.solutionPrice} Coins</strong>
                    <small>
                      <CalendarClock className="w-3 h-3 inline-block mr-1" />
                      {relativeDaysLabel(tryout.scheduledStart)}
                    </small>
                  </div>
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--muted-fg)', marginTop: '2px' }}>
                  {formatDateRange(tryout.scheduledStart, tryout.scheduledEnd)}
                </div>
              </div>
            ))}
            {(data?.upcomingTryouts.length ?? 0) === 0 && (
              <p className="sidebar-empty" style={{ padding: '24px' }}>No upcoming tryouts scheduled yet.</p>
            )}
          </div>
        </article>
      </section>

      {/* VERCEL WEB ANALYTICS CREDENTIALS DIALOG */}
      {showVercelModal && (
        <div className="modal-backdrop" onClick={() => setShowVercelModal(false)}>
          <div className="modal-card" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Key className="w-4 h-4" />
                <h2 style={{ fontSize: '16px', fontWeight: 600 }}>Vercel Web Analytics API Configuration</h2>
              </div>
              <button
                type="button"
                className="button button-quiet"
                onClick={() => setShowVercelModal(false)}
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveVercelCredentials}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <p style={{ fontSize: '12.5px', color: 'var(--muted-fg)', lineHeight: 1.5 }}>
                  Connect your team dashboard directly to the official Vercel Web Analytics REST API to query real-time pageviews, unique visitors, referrers, and country geography.
                </p>

                {data?.vercelConfig?.configured && (
                  <div className="inline-message" style={{ background: 'var(--muted-bg)', border: '1px solid var(--border)' }}>
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <div>
                      <strong>Currently connected:</strong>
                      <p style={{ fontSize: '11.5px', margin: 0 }}>
                        Project: <code>{data.vercelConfig.projectId}</code> · Team: <code>{data.vercelConfig.teamId}</code>
                      </p>
                    </div>
                  </div>
                )}

                {vercelModalError && (
                  <div className="inline-message error">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{vercelModalError}</span>
                  </div>
                )}

                {vercelModalSuccess && (
                  <div className="inline-message" style={{ background: 'rgba(34, 197, 94, 0.1)', borderColor: 'rgba(34, 197, 94, 0.3)', color: '#22c55e' }}>
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    <span>{vercelModalSuccess}</span>
                  </div>
                )}

                <div className="form-field">
                  <label htmlFor="vercelTokenInput">
                    Vercel Access Token (<code>$VERCEL_TOKEN</code>)
                  </label>
                  <input
                    id="vercelTokenInput"
                    type="password"
                    className="input"
                    placeholder={data?.vercelConfig?.tokenMasked ? `Current: ${data.vercelConfig.tokenMasked}` : 'vercel_...'}
                    value={vercelToken}
                    onChange={(e) => setVercelToken(e.target.value)}
                    required
                  />
                  <small style={{ color: 'var(--muted-fg)', fontSize: '11px' }}>
                    Create at <strong>Vercel Dashboard &gt; Account Settings &gt; Tokens</strong>.
                  </small>
                </div>

                <div className="form-field">
                  <label htmlFor="vercelProjectIdInput">
                    Vercel Project ID (<code>$VERCEL_PROJECT_ID</code>)
                  </label>
                  <input
                    id="vercelProjectIdInput"
                    type="text"
                    className="input"
                    placeholder="prj_..."
                    value={vercelProjectId}
                    onChange={(e) => setVercelProjectId(e.target.value)}
                    required
                  />
                  <small style={{ color: 'var(--muted-fg)', fontSize: '11px' }}>
                    Found at <strong>Vercel Project &gt; Settings &gt; General &gt; Project ID</strong>.
                  </small>
                </div>

                <div className="form-field">
                  <label htmlFor="vercelTeamIdInput">
                    Vercel Team ID / Slug (<code>$VERCEL_TEAM_ID</code>)
                  </label>
                  <input
                    id="vercelTeamIdInput"
                    type="text"
                    className="input"
                    placeholder="team_..."
                    value={vercelTeamId}
                    onChange={(e) => setVercelTeamId(e.target.value)}
                  />
                  <small style={{ color: 'var(--muted-fg)', fontSize: '11px' }}>
                    Leave blank if your project is in a Personal Account (Hobby). Only fill this if your project is owned by a Vercel Team.
                  </small>
                </div>
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => setShowVercelModal(false)}
                  disabled={savingVercel}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="button button-primary"
                  disabled={savingVercel}
                >
                  {savingVercel ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Authenticating…
                    </>
                  ) : (
                    'Test & Save Connection'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
