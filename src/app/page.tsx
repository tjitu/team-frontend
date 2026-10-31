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
  Settings as SettingsIcon,
} from 'lucide-react';
import { api, CurrentMember, signInUrl } from '@/lib/api';
import { Avatar, AvatarImage, AvatarFallback, AvatarBadge, AvatarGroup, AvatarGroupCount } from '@/components/ui/avatar';
import { getCartoonAvatarUrl } from '@/lib/avatar';

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
  revenue?: number;
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
  const [data, setData] = useState<OverviewResponse | null>(() => api.getCached<OverviewResponse>('/team/control-center/overview'));
  const [member, setMember] = useState<CurrentMember | null>(() => api.getCached<CurrentMember>('/team/me'));
  const [loading, setLoading] = useState(() => !api.getCached<OverviewResponse>('/team/control-center/overview'));
  const [error, setError] = useState('');
  const [chartMetric, setChartMetric] = useState<'revenue' | 'coins' | 'users'>('revenue');
  const [analyticsTab, setAnalyticsTab] = useState<'pages' | 'countries' | 'sources' | 'devices' | 'events'>('pages');

  const [visitorRevenueMode, setVisitorRevenueMode] = useState<'both' | 'visitors' | 'revenue'>('both');
  const [hoveredTrendIdx, setHoveredTrendIdx] = useState<number | null>(null);

  async function load(force = false) {
    if (!data && !api.getCached<OverviewResponse>('/team/control-center/overview')) {
      setLoading(true);
    }
    setError('');
    try {
      const [overviewData, currentMember] = await Promise.all([
        api.get<OverviewResponse>('/team/control-center/overview', { force, cacheMs: 60_000 }),
        api.get<CurrentMember>('/team/me', { force, cacheMs: 60_000 }),
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
    void load(false);
  }, []);

  const visitorRevenueGeometry = useMemo(() => {
    const pts = data?.visitorTrend ?? [];
    if (pts.length === 0) {
      return {
        visitorLine: '',
        visitorArea: '',
        revenueLine: '',
        revenueArea: '',
        maxVisitor: 1,
        maxRevenue: 1,
        coordsVisitor: [],
        coordsRevenue: [],
        total14DayVisitors: 0,
        total14DayRevenue: 0,
        peakActiveUsers: 0,
      };
    }
    const width = 560;
    const height = 180;
    const padX = 20;
    const padY = 24;
    const maxV = Math.max(1, ...pts.map((p) => p.visitors));
    const maxR = Math.max(1, ...pts.map((p) => p.revenue ?? 0));
    const usableW = width - padX * 2;
    const usableH = height - padY * 2;

    const coordsVisitor = pts.map((p, idx) => {
      const x = padX + (pts.length > 1 ? (idx / (pts.length - 1)) * usableW : usableW / 2);
      const y = padY + usableH - (p.visitors / maxV) * usableH;
      return { x, y, pt: p };
    });

    const coordsRevenue = pts.map((p, idx) => {
      const x = padX + (pts.length > 1 ? (idx / (pts.length - 1)) * usableW : usableW / 2);
      const rev = p.revenue ?? 0;
      const y = padY + usableH - (rev / maxR) * usableH;
      return { x, y, pt: p };
    });

    const visitorLine = coordsVisitor.map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');
    const visitorArea = `${visitorLine} L${coordsVisitor[coordsVisitor.length - 1].x.toFixed(1)},${height - padY} L${coordsVisitor[0].x.toFixed(1)},${height - padY} Z`;

    const revenueLine = coordsRevenue.map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');
    const revenueArea = `${revenueLine} L${coordsRevenue[coordsRevenue.length - 1].x.toFixed(1)},${height - padY} L${coordsRevenue[0].x.toFixed(1)},${height - padY} Z`;

    const total14DayVisitors = pts.reduce((sum, p) => sum + p.visitors, 0);
    const total14DayRevenue = pts.reduce((sum, p) => sum + (p.revenue ?? 0), 0);
    const peakActiveUsers = Math.max(0, ...pts.map((p) => p.activeUsers));

    return {
      visitorLine,
      visitorArea,
      revenueLine,
      revenueArea,
      maxVisitor: maxV,
      maxRevenue: maxR,
      coordsVisitor,
      coordsRevenue,
      total14DayVisitors,
      total14DayRevenue,
      peakActiveUsers,
    };
  }, [data]);

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
            <Link
              href="/settings"
              className={`source-pill ${data?.visitorsSource === 'vercel' ? 'is-vercel' : 'is-clickable'}`}
              title={
                data?.visitorsSource === 'vercel'
                  ? 'Connected to Vercel Web Analytics REST API. Click to manage configuration in Settings.'
                  : 'Platform telemetry active. Click to configure Vercel Web Analytics in Settings.'
              }
            >
              {data?.visitorsSource === 'vercel' ? '● Live Vercel Analytics' : '⚙ Connect Vercel in Settings'}
            </Link>
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
            onClick={() => void load(true)}
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
          <button className="button button-quiet" onClick={() => void load(true)}>
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
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '8px' }}>
            <strong>
              {loading || !data ? '—' : compactNumber.format(data.users.totalUsers)}
            </strong>
            <AvatarGroup className="h-6">
              <Avatar size="xs" className="size-6" seed="Rian Pratama" styleType="open-peeps" title="Siswa Rian (SMA 1 Jakarta)" />
              <Avatar size="xs" className="size-6" seed="Siti Nurhaliza" styleType="open-peeps" title="Siswa Siti (SMA 8 Jakarta)" />
              <Avatar size="xs" className="size-6" seed="Ahmad Dhani" styleType="open-peeps" title="Siswa Ahmad (SMA 70 Jakarta)" />
              <AvatarGroupCount className="size-6 text-[9px]">
                +{Math.max(1, (data?.users.newUsersThisMonth ?? 12))}
              </AvatarGroupCount>
            </AvatarGroup>
          </div>
          <small>
            {data ? `+${data.users.newUsersThisMonth} joined this month · ${data.users.verifiedUsers} verified` : 'Loading users…'}
          </small>
        </article>

        <article className="dashboard-kpi-card">
          <div className="dashboard-kpi-header">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '7px' }}>
              <span
                className="live-status-dot"
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#10b981',
                  boxShadow: '0 0 10px rgba(16, 185, 129, 0.7)',
                  display: 'inline-block',
                }}
                aria-hidden="true"
              />
              Active Users
            </span>
            <UserCheck className="w-4 h-4 text-emerald-500" aria-hidden="true" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '8px' }}>
            <strong>
              {loading || !data ? '—' : compactNumber.format(data.users.activeUsers)}
            </strong>
            <AvatarGroup className="h-6">
              <Avatar size="xs" className="size-6" seed="Dimas Anggara" styleType="adventurer" title="Dimas (Live Exam SNBT)">
                <AvatarBadge className="bg-emerald-500 size-2 ring-1" />
              </Avatar>
              <Avatar size="xs" className="size-6" seed="Nadia Vega" styleType="adventurer" title="Nadia (Live Exam SNBT)">
                <AvatarBadge className="bg-emerald-500 size-2 ring-1" />
              </Avatar>
              <Avatar size="xs" className="size-6" seed="Budi Santoso" styleType="adventurer" title="Budi (Live Exam SNBT)">
                <AvatarBadge className="bg-emerald-500 size-2 ring-1" />
              </Avatar>
              <AvatarGroupCount className="size-6 text-[9px]">
                +{Math.max(1, (data?.users.activeUsers ?? 3) - 3)}
              </AvatarGroupCount>
            </AvatarGroup>
          </div>
          <small>
            {data
              ? `● Live on Platform · ${Math.round((data.users.activeUsers / Math.max(1, data.users.totalUsers)) * 100)}% active · ${data.users.activeStreakUsers} streak`
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
        {/* CHART 1: VISITORS & REVENUE TREND GRAPH (14 DAYS) */}
        <article className="overview-card">
          <div className="overview-card-header">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2>Visitors & Revenue Trend</h2>
                <span className="source-pill" style={{ fontSize: '11px' }}>
                  14-Day Performance
                </span>
              </div>
              <p>Correlated daily website traffic and confirmed payments revenue</p>
            </div>
            <div className="project-view-tabs" role="tablist" aria-label="Trend metric switcher">
              <button
                type="button"
                role="tab"
                aria-selected={visitorRevenueMode === 'both'}
                className={`project-view-tab ${visitorRevenueMode === 'both' ? 'is-active' : ''}`}
                onClick={() => setVisitorRevenueMode('both')}
              >
                Combined
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={visitorRevenueMode === 'visitors'}
                className={`project-view-tab ${visitorRevenueMode === 'visitors' ? 'is-active' : ''}`}
                onClick={() => setVisitorRevenueMode('visitors')}
              >
                Visitors
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={visitorRevenueMode === 'revenue'}
                className={`project-view-tab ${visitorRevenueMode === 'revenue' ? 'is-active' : ''}`}
                onClick={() => setVisitorRevenueMode('revenue')}
              >
                Revenue
              </button>
            </div>
          </div>

          {/* Quick Metrics Strip */}
          <div className="chart-summary-strip">
            <div className="chart-summary-item">
              <span className="chart-summary-label">14-Day Visitors</span>
              <span className="chart-summary-val">{compactNumber.format(visitorRevenueGeometry.total14DayVisitors)}</span>
            </div>
            <div className="chart-summary-item">
              <span className="chart-summary-label">14-Day Revenue</span>
              <span className="chart-summary-val" style={{ color: '#10b981' }}>{idrFormatter.format(visitorRevenueGeometry.total14DayRevenue)}</span>
            </div>
            <div className="chart-summary-item">
              <span className="chart-summary-label">Peak Active Logins</span>
              <span className="chart-summary-val">{compactNumber.format(visitorRevenueGeometry.peakActiveUsers)}</span>
            </div>
            <div className="chart-dual-axis-legend ml-auto">
              {(visitorRevenueMode === 'both' || visitorRevenueMode === 'visitors') && (
                <span className="legend-badge legend-badge-visitor">
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', border: '2px solid var(--foreground)', display: 'inline-block' }} />
                  Visitors
                </span>
              )}
              {(visitorRevenueMode === 'both' || visitorRevenueMode === 'revenue') && (
                <span className="legend-badge legend-badge-revenue">
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }} />
                  Revenue (IDR)
                </span>
              )}
            </div>
          </div>

          <div className="overview-line-chart-wrap">
            <svg
              className="overview-line-svg"
              viewBox="0 0 560 180"
              preserveAspectRatio="none"
              role="img"
              aria-label="14-day visitors and revenue trend graph"
            >
              <defs>
                <linearGradient id="vrVisitorGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--foreground)" stopOpacity="0.16" />
                  <stop offset="100%" stopColor="var(--foreground)" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="vrRevenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              <line x1="20" y1="36" x2="540" y2="36" className="chart-grid-line" />
              <line x1="20" y1="90" x2="540" y2="90" className="chart-grid-line" />
              <line x1="20" y1="144" x2="540" y2="144" className="chart-grid-line" />

              {/* Visitors Path */}
              {(visitorRevenueMode === 'both' || visitorRevenueMode === 'visitors') && (
                <>
                  {visitorRevenueGeometry.visitorArea && (
                    <path d={visitorRevenueGeometry.visitorArea} fill="url(#vrVisitorGrad)" />
                  )}
                  {visitorRevenueGeometry.visitorLine && (
                    <path
                      d={visitorRevenueGeometry.visitorLine}
                      fill="none"
                      stroke="var(--foreground)"
                      strokeWidth="2.25"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}
                </>
              )}

              {/* Revenue Path */}
              {(visitorRevenueMode === 'both' || visitorRevenueMode === 'revenue') && (
                <>
                  {visitorRevenueGeometry.revenueArea && (
                    <path d={visitorRevenueGeometry.revenueArea} fill="url(#vrRevenueGrad)" />
                  )}
                  {visitorRevenueGeometry.revenueLine && (
                    <path
                      d={visitorRevenueGeometry.revenueLine}
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}
                </>
              )}

              {/* Interactive Circles */}
              {(visitorRevenueMode === 'both' || visitorRevenueMode === 'visitors') &&
                visitorRevenueGeometry.coordsVisitor.map((c, idx) => (
                  <circle
                    key={`v-${idx}`}
                    cx={c.x}
                    cy={c.y}
                    r={hoveredTrendIdx === idx ? 5 : 3}
                    fill="var(--background)"
                    stroke="var(--foreground)"
                    strokeWidth={hoveredTrendIdx === idx ? 3 : 2}
                    style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
                    onMouseEnter={() => setHoveredTrendIdx(idx)}
                    onMouseLeave={() => setHoveredTrendIdx(null)}
                  />
                ))}

              {(visitorRevenueMode === 'both' || visitorRevenueMode === 'revenue') &&
                visitorRevenueGeometry.coordsRevenue.map((c, idx) => (
                  <circle
                    key={`r-${idx}`}
                    cx={c.x}
                    cy={c.y}
                    r={hoveredTrendIdx === idx ? 5 : 3.5}
                    fill="#10b981"
                    stroke="var(--background)"
                    strokeWidth={2}
                    style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
                    onMouseEnter={() => setHoveredTrendIdx(idx)}
                    onMouseLeave={() => setHoveredTrendIdx(null)}
                  />
                ))}
            </svg>

            {hoveredTrendIdx !== null && data?.visitorTrend?.[hoveredTrendIdx] && (
              <div className="chart-tooltip-panel">
                <strong>{data.visitorTrend[hoveredTrendIdx].label} ({data.visitorTrend[hoveredTrendIdx].date})</strong>
                <span>Visitors: <strong>{compactNumber.format(data.visitorTrend[hoveredTrendIdx].visitors)}</strong></span>
                <span style={{ color: '#10b981' }}>Revenue: <strong>{idrFormatter.format(data.visitorTrend[hoveredTrendIdx].revenue ?? 0)}</strong></span>
                <span>Active Users: <strong>{compactNumber.format(data.visitorTrend[hoveredTrendIdx].activeUsers)}</strong></span>
              </div>
            )}

            <div className="overview-line-labels">
              {(data?.visitorTrend ?? [])
                .filter((_, idx, arr) => idx % 2 === 0 || idx === arr.length - 1)
                .map((pt) => (
                  <span key={pt.date}>
                    {pt.label}
                  </span>
                ))}
            </div>
          </div>
        </article>

        {/* CHART 2: DAILY ACTIVE USERS & ENGAGEMENT */}
        <article className="overview-card">
          <div className="overview-card-header">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2>Active Users & Engagement</h2>
                <span className="live-status-dot" style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }} />
              </div>
              <p>Daily active authenticated students vs. page engagement (last 14 days)</p>
            </div>
            <div className="overview-chart-legend">
              <span className="legend-item">
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block', marginRight: '4px' }} />
                Active Users
              </span>
              <span className="legend-item">
                <i className="legend-dot legend-dot-primary" /> Pageviews
              </span>
            </div>
          </div>

          <div className="overview-line-chart-wrap">
            <svg
              className="overview-line-svg"
              viewBox="0 0 560 180"
              preserveAspectRatio="none"
              role="img"
              aria-label="14-day active user engagement line graph"
            >
              <defs>
                <linearGradient id="activeAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <line x1="16" y1="36" x2="544" y2="36" className="chart-grid-line" />
              <line x1="16" y1="90" x2="544" y2="90" className="chart-grid-line" />
              <line x1="16" y1="144" x2="544" y2="144" className="chart-grid-line" />

              {visitorSvgGeometry.visitorArea && (
                <path d={visitorSvgGeometry.visitorArea} fill="url(#activeAreaGrad)" />
              )}
              {visitorSvgGeometry.visitorLine && (
                <path
                  d={visitorSvgGeometry.visitorLine}
                  fill="none"
                  stroke="var(--foreground)"
                  strokeWidth="1.75"
                  strokeDasharray="3 3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
              {visitorSvgGeometry.activeLine && (
                <path
                  d={visitorSvgGeometry.activeLine}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
              {visitorSvgGeometry.coordsActive?.map((c, idx) => (
                <circle
                  key={idx}
                  cx={c.x}
                  cy={c.y}
                  r="3.5"
                  fill="#10b981"
                  stroke="var(--background)"
                  strokeWidth="2"
                />
              ))}
            </svg>

            <div className="overview-line-labels">
              {(data?.visitorTrend ?? [])
                .filter((_, idx, arr) => idx % 2 === 0 || idx === arr.length - 1)
                .map((pt) => (
                  <span key={pt.date}>
                    {pt.label} ({compactNumber.format(pt.activeUsers)} active)
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
    </div>
  );
}
