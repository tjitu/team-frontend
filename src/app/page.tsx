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
import { PixelCoin } from '@/components/pixel-coin';
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

  const [visitorInterval, setVisitorInterval] = useState<'7d' | '14d' | '30d'>('14d');
  const [coinChartMode, setCoinChartMode] = useState<'daily' | 'monthly'>('daily');
  const [hoveredTrendIdx, setHoveredTrendIdx] = useState<number | null>(null);
  const [hoveredCoinIdx, setHoveredCoinIdx] = useState<number | null>(null);

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

  const visitorSvgGeometry = useMemo(() => {
    const rawPts = data?.visitorTrend ?? [];
    if (rawPts.length === 0) return { visitorLine: '', visitorArea: '', maxVisitor: 1, totalVisitors: 0, coordsVisitor: [], pts: [] };
    const sliceCount = visitorInterval === '7d' ? 7 : visitorInterval === '14d' ? 14 : rawPts.length;
    const pts = rawPts.slice(-sliceCount);

    const width = 560;
    const height = 190;
    const padX = 20;
    const padY = 24;
    const maxV = Math.max(1, ...pts.map((p) => p.visitors));
    const usableW = width - padX * 2;
    const usableH = height - padY * 2;

    const coordsVisitor = pts.map((p, idx) => {
      const x = padX + (pts.length > 1 ? (idx / (pts.length - 1)) * usableW : usableW / 2);
      const y = padY + usableH - (p.visitors / maxV) * usableH;
      return { x, y, pt: p };
    });

    const visitorLine = coordsVisitor.map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');
    const visitorArea = `${visitorLine} L${coordsVisitor[coordsVisitor.length - 1].x.toFixed(1)},${height - padY} L${coordsVisitor[0].x.toFixed(1)},${height - padY} Z`;
    const totalVisitors = pts.reduce((sum, p) => sum + p.visitors, 0);

    return { visitorLine, visitorArea, maxVisitor: maxV, totalVisitors, coordsVisitor, pts };
  }, [data, visitorInterval]);

  const coinsGeometry = useMemo(() => {
    const pts = data?.visitorTrend ?? [];
    if (pts.length === 0) return { coinsLine: '', coinsArea: '', maxCoins: 1, totalCoins: 0, coordsCoins: [] };
    const width = 560;
    const height = 180;
    const padX = 20;
    const padY = 24;
    const avgPrice = Math.max(1, data?.revenue.avgPricePerCoin || 2000);
    const ptsWithCoins = pts.map((p) => {
      const coins = Math.round((p.revenue ?? 0) / avgPrice);
      return { ...p, coins };
    });

    const maxC = Math.max(1, ...ptsWithCoins.map((p) => p.coins));
    const usableW = width - padX * 2;
    const usableH = height - padY * 2;

    const coordsCoins = ptsWithCoins.map((p, idx) => {
      const x = padX + (pts.length > 1 ? (idx / (pts.length - 1)) * usableW : usableW / 2);
      const y = padY + usableH - (p.coins / maxC) * usableH;
      return { x, y, pt: p };
    });

    const coinsLine = coordsCoins.map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');
    const coinsArea = `${coinsLine} L${coordsCoins[coordsCoins.length - 1].x.toFixed(1)},${height - padY} L${coordsCoins[0].x.toFixed(1)},${height - padY} Z`;
    const totalCoins = ptsWithCoins.reduce((sum, p) => sum + p.coins, 0);

    return { coinsLine, coinsArea, maxCoins: maxC, totalCoins, coordsCoins };
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
          <h1>Overview</h1>
          <p className="page-subtitle">
            {member?.name ? `Welcome back, ${member.name.split(' ')[0]}. ` : ''}
            Real-time JituPTN platform traffic, audience intelligence, user activity, coin economics, and upcoming tryouts.
          </p>
        </div>
        <div className="page-heading-actions" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Link
            href="/settings"
            className="vercel-status-pill"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: 500,
              borderRadius: '9999px',
              textDecoration: 'none',
              border: '1px solid',
              borderColor: data?.visitorsSource === 'vercel' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(255, 255, 255, 0.12)',
              backgroundColor: data?.visitorsSource === 'vercel' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 255, 255, 0.04)',
              color: data?.visitorsSource === 'vercel' ? '#10b981' : 'var(--muted-fg)',
              transition: 'all 0.15s ease',
            }}
            title={data?.visitorsSource === 'vercel' ? 'Vercel Analytics: Connected (Click to manage)' : 'Vercel Analytics: Disconnected (Click to configure in Settings)'}
          >
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: data?.visitorsSource === 'vercel' ? '#10b981' : '#6b7280',
                boxShadow: data?.visitorsSource === 'vercel' ? '0 0 8px #10b981' : 'none',
                display: 'inline-block',
              }}
            />
            <span>{data?.visitorsSource === 'vercel' ? 'Vercel Connected' : 'Vercel Disconnected'}</span>
          </Link>
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
          <strong>
            {loading || !data ? '—' : compactNumber.format(data.users.totalUsers)}
          </strong>
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
          <strong>
            {loading || !data ? '—' : compactNumber.format(data.users.activeUsers)}
          </strong>
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
            <PixelCoin size={16} />
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <strong>
              {loading || !data ? '—' : compactNumber.format(data.revenue.coinsSold)}
            </strong>
            <PixelCoin size={22} />
          </div>
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
        {/* CHART 1: VISITORS ONLY */}
        <article className="overview-card">
          <div className="overview-card-header">
            <div>
              <h2>Visitors Trend</h2>
              <p>Daily website visitors and traffic volume</p>
            </div>
            <div className="chart-select-wrapper">
              <select
                className="chart-interval-select"
                value={visitorInterval}
                onChange={(e) => setVisitorInterval(e.target.value as '14d' | '7d' | '30d')}
                aria-label="Select visitor interval"
              >
                <option value="14d">Last 14 Days</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>
            </div>
          </div>

          <div className="overview-line-chart-wrap" style={{ marginTop: '8px' }}>
            <svg
              className="overview-line-svg"
              viewBox="0 0 560 190"
              preserveAspectRatio="none"
              role="img"
              aria-label="Visitors trend graph"
            >
              <defs>
                <linearGradient id="visOnlyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--foreground)" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="var(--foreground)" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              <line x1="20" y1="36" x2="540" y2="36" className="chart-grid-line" />
              <line x1="20" y1="95" x2="540" y2="95" className="chart-grid-line" />
              <line x1="20" y1="154" x2="540" y2="154" className="chart-grid-line" />

              {visitorSvgGeometry.visitorArea && (
                <path d={visitorSvgGeometry.visitorArea} fill="url(#visOnlyGrad)" />
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

              {visitorSvgGeometry.coordsVisitor.map((c, idx) => (
                <circle
                  key={`v-${idx}`}
                  cx={c.x}
                  cy={c.y}
                  r={hoveredTrendIdx === idx ? 5 : 3.5}
                  fill="var(--background)"
                  stroke="var(--foreground)"
                  strokeWidth={hoveredTrendIdx === idx ? 3 : 2}
                  style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
                  onMouseEnter={() => setHoveredTrendIdx(idx)}
                  onMouseLeave={() => setHoveredTrendIdx(null)}
                />
              ))}
            </svg>

            {hoveredTrendIdx !== null && visitorSvgGeometry.coordsVisitor[hoveredTrendIdx] && (
              <div className="chart-tooltip-panel">
                <strong>{visitorSvgGeometry.coordsVisitor[hoveredTrendIdx].pt.label} ({visitorSvgGeometry.coordsVisitor[hoveredTrendIdx].pt.date})</strong>
                <span>Unique Visitors: <strong>{compactNumber.format(visitorSvgGeometry.coordsVisitor[hoveredTrendIdx].pt.visitors)}</strong></span>
                <span>Pageviews: <strong>{compactNumber.format(visitorSvgGeometry.coordsVisitor[hoveredTrendIdx].pt.pageViews)}</strong></span>
              </div>
            )}

            <div className="overview-line-labels">
              {(visitorSvgGeometry.pts ?? [])
                .filter((_, idx, arr) => idx % 2 === 0 || idx === arr.length - 1)
                .map((pt) => (
                  <span key={pt.date}>{pt.label}</span>
                ))}
            </div>
          </div>
        </article>

        {/* CHART 2: COINS ONLY */}
        <article className="overview-card">
          <div className="overview-card-header">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2>Coins Trend</h2>
                <span className="source-pill" style={{ fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <PixelCoin size={13} />
                  Token Economy
                </span>
              </div>
              <p>
                {coinChartMode === 'daily'
                  ? 'Daily coin distribution and purchasing velocity'
                  : 'Monthly confirmed coin purchases over the last 6 months'}
              </p>
            </div>
            <div className="chart-select-wrapper">
              <select
                className="chart-interval-select"
                value={coinChartMode}
                onChange={(e) => setCoinChartMode(e.target.value as 'daily' | 'monthly')}
                aria-label="Select coin trend interval"
              >
                <option value="daily">Last 14 Days</option>
                <option value="monthly">Last 6 Months</option>
              </select>
            </div>
          </div>

          {coinChartMode === 'daily' ? (
            <div className="overview-line-chart-wrap" style={{ marginTop: '8px' }}>
              <svg
                className="overview-line-svg"
                viewBox="0 0 560 190"
                preserveAspectRatio="none"
                role="img"
                aria-label="14-day daily coins trend graph"
              >
                <defs>
                  <linearGradient id="coinDailyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                <line x1="20" y1="36" x2="540" y2="36" className="chart-grid-line" />
                <line x1="20" y1="95" x2="540" y2="95" className="chart-grid-line" />
                <line x1="20" y1="154" x2="540" y2="154" className="chart-grid-line" />

                {coinsGeometry.coinsArea && (
                  <path d={coinsGeometry.coinsArea} fill="url(#coinDailyGrad)" />
                )}
                {coinsGeometry.coinsLine && (
                  <path
                    d={coinsGeometry.coinsLine}
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {coinsGeometry.coordsCoins.map((c, idx) => (
                  <circle
                    key={`c-${idx}`}
                    cx={c.x}
                    cy={c.y}
                    r={hoveredCoinIdx === idx ? 5 : 3.5}
                    fill="#f59e0b"
                    stroke="var(--background)"
                    strokeWidth={hoveredCoinIdx === idx ? 3 : 2}
                    style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
                    onMouseEnter={() => setHoveredCoinIdx(idx)}
                    onMouseLeave={() => setHoveredCoinIdx(null)}
                  />
                ))}
              </svg>

              {hoveredCoinIdx !== null && coinsGeometry.coordsCoins[hoveredCoinIdx] && (
                <div className="chart-tooltip-panel">
                  <strong>{coinsGeometry.coordsCoins[hoveredCoinIdx].pt.label} ({coinsGeometry.coordsCoins[hoveredCoinIdx].pt.date})</strong>
                  <span style={{ color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    Coins: <strong>{compactNumber.format(coinsGeometry.coordsCoins[hoveredCoinIdx].pt.coins)}</strong>
                    <PixelCoin size={13} />
                  </span>
                  <span style={{ color: '#10b981' }}>Revenue: <strong>{idrFormatter.format(coinsGeometry.coordsCoins[hoveredCoinIdx].pt.revenue ?? 0)}</strong></span>
                </div>
              )}

              <div className="overview-line-labels">
                {(data?.visitorTrend ?? [])
                  .filter((_, idx, arr) => idx % 2 === 0 || idx === arr.length - 1)
                  .map((pt) => (
                    <span key={pt.date}>{pt.label}</span>
                  ))}
              </div>
            </div>
          ) : (
            <div className="overview-bar-chart" role="img" aria-label="Monthly coins distribution bar chart" style={{ marginTop: '8px' }}>
              {(data?.monthlySeries ?? []).map((pt) => {
                const maxC = Math.max(1, ...(data?.monthlySeries ?? []).map((m) => m.coinsSold));
                const heightPct = Math.max(12, Math.round((pt.coinsSold / maxC) * 100));
                return (
                  <div className="bar-column" key={pt.month} title={`${pt.label}: ${compactNumber.format(pt.coinsSold)} coins, ${idrFormatter.format(pt.revenue)}`}>
                    <span className="bar-val" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '11px', color: '#f59e0b' }}>
                      {compactNumber.format(pt.coinsSold)}
                      <PixelCoin size={12} />
                    </span>
                    <div className="bar-track">
                      <div className="bar-fill" style={{ height: `${heightPct}%`, backgroundColor: '#f59e0b' }} />
                    </div>
                    <span className="bar-label">{pt.label}</span>
                  </div>
                );
              })}
            </div>
          )}
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

      </div>
  );
}
