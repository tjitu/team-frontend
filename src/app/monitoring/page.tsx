'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Check,
  CircleHelp,
  Clock3,
  Database,
  Globe2,
  LoaderCircle,
  Radio,
  RefreshCw,
  Server,
  ShieldCheck,
} from 'lucide-react';
import { api, CurrentMember, signInUrl } from '@/lib/api';
import styles from './monitoring.module.css';

type TargetState = 'up' | 'degraded' | 'down' | 'unconfigured';
type Target = {
  id: string;
  name: string;
  group: 'Main' | 'Team Platform';
  url: string | null;
  state: TargetState;
  latencyMs: number | null;
  httpStatus: number | null;
  checkedAt: string;
  detail: string;
};
type Snapshot = { checkedAt: string; targets: Target[] };
type Sample = { checkedAt: string; values: Record<string, number | null> };
type Incident = { id: string; checkedAt: string; target: string; state: TargetState; message: string };
type AccessState = 'checking' | 'allowed' | 'denied' | 'error';
type Scope = 'all' | 'Main' | 'Team Platform';
type Range = 5 | 15 | 30;

const HISTORY_KEY = 'jitu-monitoring-samples-v1';
const INCIDENT_KEY = 'jitu-monitoring-incidents-v1';
const POLL_INTERVAL = 30_000;
const rangeOptions: Range[] = [5, 15, 30];
const targetColors: Record<string, string> = {
  'main-web': '#76c7c0',
  'main-api': '#f5a362',
  'team-web': '#8aafff',
  'team-api': '#c4a5ff',
};

function stateLabel(state: TargetState) {
  if (state === 'up') return 'Normal';
  if (state === 'degraded') return 'Melambat';
  if (state === 'down') return 'Gangguan';
  return 'Belum diatur';
}

function timeLabel(value?: string) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date(value));
}

function dateLabel(value: string) {
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

function readSessionList<T>(key: string): T[] {
  try {
    const stored = window.sessionStorage.getItem(key);
    if (!stored) return [];
    const value = JSON.parse(stored);
    return Array.isArray(value) ? value as T[] : [];
  } catch {
    return [];
  }
}

function percentile(values: number[], fraction: number) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.max(0, Math.ceil(sorted.length * fraction) - 1)];
}

function stateIcon(state: TargetState) {
  if (state === 'up') return <Check aria-hidden="true" />;
  if (state === 'degraded' || state === 'down') return <AlertTriangle aria-hidden="true" />;
  return <CircleHelp aria-hidden="true" />;
}

function targetIcon(id: string) {
  if (id.endsWith('web')) return <Globe2 aria-hidden="true" />;
  if (id === 'team-api') return <Database aria-hidden="true" />;
  return <Server aria-hidden="true" />;
}

function LatencyChart({ targets, samples, range }: { targets: Target[]; samples: Sample[]; range: Range }) {
  const cutoff = Date.now() - range * 60_000;
  const points = samples.filter((sample) => new Date(sample.checkedAt).getTime() >= cutoff);
  const tracked = targets.filter((target) => target.state !== 'unconfigured');
  const maxLatency = Math.max(200, ...points.flatMap((sample) => Object.values(sample.values).filter((value): value is number => value !== null)));
  const plot = { left: 52, right: 748, top: 18, bottom: 208 };
  const chartHeight = plot.bottom - plot.top;
  const chartWidth = plot.right - plot.left;
  const x = (index: number) => points.length <= 1 ? plot.right : plot.left + (index / (points.length - 1)) * chartWidth;
  const y = (value: number) => plot.bottom - (Math.min(value, maxLatency) / maxLatency) * chartHeight;

  return (
    <div className={styles.chartWrap}>
      <svg className={styles.chart} viewBox="0 0 780 250" role="img" aria-label={`Grafik waktu respons HTTP selama ${range} menit terakhir`}>
        {[0, 1, 2, 3].map((row) => {
          const value = maxLatency * (1 - row / 3);
          const yPos = plot.top + (chartHeight / 3) * row;
          return (
            <g key={row}>
              <line x1={plot.left} x2={plot.right} y1={yPos} y2={yPos} className={styles.gridLine} />
              <text x={plot.left - 10} y={yPos + 4} textAnchor="end" className={styles.axisLabel}>{Math.round(value)} ms</text>
            </g>
          );
        })}
        {tracked.map((target) => {
          const coords = points.flatMap((sample, index) => {
            const value = sample.values[target.id];
            return value === null || value === undefined ? [] : [{ x: x(index), y: y(value) }];
          });
          const path = coords.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(' ');
          return path ? (
            <g key={target.id}>
              <path d={path} fill="none" stroke={targetColors[target.id]} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={styles.traceLine} />
              {coords.length > 0 && <circle cx={coords[coords.length - 1].x} cy={coords[coords.length - 1].y} r="4" fill={targetColors[target.id]} />}
            </g>
          ) : null;
        })}
        <text x={plot.left} y="234" textAnchor="start" className={styles.axisLabel}>{points[0] ? timeLabel(points[0].checkedAt) : 'Menunggu cek pertama'}</text>
        <text x={plot.right} y="234" textAnchor="end" className={styles.axisLabel}>{points.length > 1 ? timeLabel(points[points.length - 1].checkedAt) : 'cek tiap 30 detik'}</text>
        {points.length === 1 && (
          <text x={plot.right - 5} y={plot.top + 18} textAnchor="end" className={styles.chartHint}>Grafik akan terbentuk setelah beberapa sampel</text>
        )}
        {points.length === 0 && (
          <text x={(plot.left + plot.right) / 2} y={plot.top + chartHeight / 2} textAnchor="middle" className={styles.chartHint}>Menunggu hasil health check…</text>
        )}
      </svg>
      <div className={styles.chartLegend} aria-label="Legenda grafik">
        {tracked.map((target) => (
          <span key={target.id} className={styles.legendItem}>
            <i style={{ backgroundColor: targetColors[target.id] }} />{target.name}
          </span>
        ))}
        {tracked.length === 0 && <span className={styles.legendEmpty}>Belum ada URL yang terpasang</span>}
      </div>
    </div>
  );
}

export default function MonitoringPage() {
  const [access, setAccess] = useState<AccessState>(() => {
    const cachedMember = api.getCached<CurrentMember>('/team/me');
    return cachedMember?.role === 'SYSTEM_OWNER' || cachedMember?.role === 'SYSTEM_ADMIN' ? 'allowed' : 'checking';
  });
  const [accessMessage, setAccessMessage] = useState('');
  const [member, setMember] = useState<CurrentMember | null>(() => api.getCached<CurrentMember>('/team/me') ?? null);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [samples, setSamples] = useState<Sample[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [scope, setScope] = useState<Scope>('all');
  const [range, setRange] = useState<Range>(15);
  const [refreshing, setRefreshing] = useState(false);
  const [pollError, setPollError] = useState('');
  const knownStates = useRef<Record<string, TargetState>>({});
  const checking = useRef(false);

  useEffect(() => {
    setSamples(readSessionList<Sample>(HISTORY_KEY));
    setIncidents(readSessionList<Incident>(INCIDENT_KEY));
    const cachedMember = api.getCached<CurrentMember>('/team/me');
    void api.get<CurrentMember>('/team/me', { force: true, cacheMs: 0 }).then((currentMember) => {
      setMember(currentMember);
      setAccess(currentMember.role === 'SYSTEM_OWNER' || currentMember.role === 'SYSTEM_ADMIN' ? 'allowed' : 'denied');
    }).catch((error: Error) => {
      if (error.message === 'SESSION_EXPIRED') {
        window.location.assign(signInUrl());
        return;
      }
      if (cachedMember?.role === 'SYSTEM_OWNER' || cachedMember?.role === 'SYSTEM_ADMIN') {
        setMember(cachedMember);
        setAccess('allowed');
        return;
      }
      setAccessMessage(error.message || 'Tidak bisa memeriksa hak akses akun.');
      setAccess('error');
    });
  }, []);

  const poll = useCallback(async () => {
    if (checking.current) return;
    checking.current = true;
    setRefreshing(true);
    setPollError('');
    try {
      const response = await fetch('/api/monitoring', { cache: 'no-store' });
      if (!response.ok) throw new Error(`Health check gagal (${response.status}).`);
      const next = await response.json() as Snapshot;
      setSnapshot(next);

      const sample: Sample = {
        checkedAt: next.checkedAt,
        values: Object.fromEntries(next.targets.map((target) => [target.id, target.state === 'unconfigured' ? null : target.latencyMs])),
      };
      setSamples((previous) => {
        const updated = [...previous.filter((item) => item.checkedAt !== sample.checkedAt), sample].slice(-120);
        try { window.sessionStorage.setItem(HISTORY_KEY, JSON.stringify(updated)); } catch { /* session storage is optional */ }
        return updated;
      });

      const transitions: Incident[] = [];
      for (const target of next.targets) {
        const prior = knownStates.current[target.id];
        if (target.state === 'unconfigured') continue;
        if (prior && prior !== target.state && (target.state === 'down' || target.state === 'degraded' || prior === 'down' || prior === 'degraded')) {
          transitions.push({
            id: `${target.id}-${next.checkedAt}`,
            checkedAt: next.checkedAt,
            target: target.name,
            state: target.state,
            message: target.state === 'up' ? 'Layanan kembali normal' : `Status berubah menjadi ${stateLabel(target.state).toLowerCase()}`,
          });
        } else if (!prior && target.state === 'down') {
          transitions.push({ id: `${target.id}-${next.checkedAt}`, checkedAt: next.checkedAt, target: target.name, state: target.state, message: 'Gangguan terdeteksi pada pengecekan awal' });
        }
        knownStates.current[target.id] = target.state;
      }
      if (transitions.length) {
        setIncidents((previous) => {
          const updated = [...transitions.reverse(), ...previous].slice(0, 30);
          try { window.sessionStorage.setItem(INCIDENT_KEY, JSON.stringify(updated)); } catch { /* session storage is optional */ }
          return updated;
        });
      }
    } catch (error) {
      setPollError(error instanceof Error ? error.message : 'Health check tidak dapat dimuat.');
    } finally {
      setRefreshing(false);
      checking.current = false;
    }
  }, []);

  useEffect(() => {
    if (access !== 'allowed') return;
    void poll();
    const interval = window.setInterval(() => void poll(), POLL_INTERVAL);
    return () => window.clearInterval(interval);
  }, [access, poll]);

  const targets = useMemo(() => (snapshot?.targets ?? []).filter((target) => scope === 'all' || target.group === scope), [scope, snapshot]);
  const visibleTargets = useMemo(() => targets.filter((target) => target.state !== 'unconfigured'), [targets]);
  const healthyCount = visibleTargets.filter((target) => target.state === 'up').length;
  const configuredCount = targets.filter((target) => target.state !== 'unconfigured').length;
  const currentMedianLatency = percentile(visibleTargets.map((target) => target.latencyMs).filter((value): value is number => value !== null), 0.5);
  const currentIncidents = incidents.filter((incident) => targets.some((target) => target.name === incident.target)).length;
  const orderedIncidents = incidents.filter((incident) => scope === 'all' || targets.some((target) => target.name === incident.target)).slice(0, 6);

  if (access === 'checking') {
    return <div className={styles.statePage}><LoaderCircle className={styles.spinner} aria-hidden="true" /><p>Memeriksa akses monitoring…</p></div>;
  }
  if (access === 'denied') {
    return <div className={styles.statePage}><ShieldCheck aria-hidden="true" /><h1>Akses terbatas</h1><p>Monitoring web hanya tersedia untuk admin Team Platform.</p></div>;
  }
  if (access === 'error') {
    return <div className={styles.statePage}><AlertTriangle aria-hidden="true" /><h1>Monitoring tidak dapat dibuka</h1><p>{accessMessage}</p></div>;
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <div className={styles.eyebrow}><span className={styles.eyebrowDot} />OBSERVABILITY</div>
          <h1>Web monitoring</h1>
          <p className={styles.subtitle}>Kesehatan layanan Main dan Team Platform, dalam satu tampilan.</p>
        </div>
        <div className={styles.headerActions}>
          <span className={styles.pollNote}><Clock3 aria-hidden="true" />Refresh tiap 30 detik</span>
          <button className={styles.refreshButton} type="button" onClick={() => void poll()} disabled={refreshing}>
            <RefreshCw className={refreshing ? styles.spinner : ''} aria-hidden="true" />
            <span>{refreshing ? 'Memeriksa…' : 'Refresh sekarang'}</span>
          </button>
        </div>
      </header>

      <section className={styles.summaryGrid} aria-label="Ringkasan layanan">
        <article className={styles.summaryCard}>
          <div className={styles.summaryLabel}><span>Service normal</span><ShieldCheck aria-hidden="true" /></div>
          <div className={styles.summaryValue}>{snapshot ? `${healthyCount}/${visibleTargets.length}` : '—'}</div>
          <div className={styles.summaryFoot}>Dari layanan yang sudah dikonfigurasi</div>
        </article>
        <article className={styles.summaryCard}>
          <div className={styles.summaryLabel}><span>Cakupan check</span><Activity aria-hidden="true" /></div>
          <div className={styles.summaryValue}>{snapshot ? `${configuredCount}/${targets.length}` : '—'}</div>
          <div className={styles.summaryFoot}>Endpoint terpasang pada filter ini</div>
        </article>
        <article className={styles.summaryCard}>
          <div className={styles.summaryLabel}><span>Median latency</span><Radio aria-hidden="true" /></div>
          <div className={styles.summaryValue}>{currentMedianLatency === null ? '—' : `${currentMedianLatency}<small>ms</small>`}</div>
          <div className={styles.summaryFoot}>Health check terbaru</div>
        </article>
        <article className={styles.summaryCard}>
          <div className={styles.summaryLabel}><span>Perubahan status</span><AlertTriangle aria-hidden="true" /></div>
          <div className={styles.summaryValue}>{currentIncidents}</div>
          <div className={styles.summaryFoot}>Tercatat pada sesi ini</div>
        </article>
      </section>

      <div className={styles.toolbar}>
        <div className={styles.scopeTabs} role="group" aria-label="Filter aplikasi">
          {(['all', 'Main', 'Team Platform'] as Scope[]).map((option) => (
            <button key={option} type="button" className={scope === option ? styles.scopeActive : ''} onClick={() => setScope(option)} aria-pressed={scope === option}>
              {option === 'all' ? 'Semua aplikasi' : option}
            </button>
          ))}
        </div>
        <span className={styles.lastChecked}>{snapshot ? `Terakhir dicek ${timeLabel(snapshot.checkedAt)}` : 'Menunggu pengecekan pertama'}</span>
      </div>

      {pollError && <div className={styles.errorBanner} role="alert"><AlertTriangle aria-hidden="true" />{pollError}</div>}

      <div className={styles.panelGrid}>
        <section className={`${styles.panel} ${styles.latencyPanel}`} aria-labelledby="latency-title">
          <div className={styles.panelHeader}>
            <div>
              <h2 id="latency-title">Waktu respons HTTP</h2>
              <p>Latensi request health check, per endpoint.</p>
            </div>
            <div className={styles.rangeTabs} role="group" aria-label="Rentang waktu grafik">
              {rangeOptions.map((minutes) => (
                <button key={minutes} type="button" onClick={() => setRange(minutes)} className={range === minutes ? styles.rangeActive : ''} aria-pressed={range === minutes}>
                  {minutes}m
                </button>
              ))}
            </div>
          </div>
          <LatencyChart targets={targets} samples={samples} range={range} />
          <p className={styles.sessionNote}>Grafik merekam sampel selama halaman ini terbuka dan tersimpan di sesi browser ini.</p>
        </section>

        <section className={`${styles.panel} ${styles.healthPanel}`} aria-labelledby="health-title">
          <div className={styles.panelHeader}>
            <div>
              <h2 id="health-title">Status layanan</h2>
              <p>Website dan endpoint readiness.</p>
            </div>
            <span className={styles.liveTag}><i />LIVE</span>
          </div>
          <div className={styles.targetList}>
            {targets.map((target) => (
              <article className={styles.targetRow} key={target.id}>
                <div className={styles.targetIcon}>{targetIcon(target.id)}</div>
                <div className={styles.targetInfo}>
                  <div className={styles.targetName}>{target.name}<span>{target.group}</span></div>
                  <div className={styles.targetDetail}>{target.url ?? target.detail}</div>
                </div>
                <div className={styles.targetMetrics}>
                  <strong>{target.latencyMs === null ? '—' : `${target.latencyMs} ms`}</strong>
                  <span>{target.httpStatus ? `HTTP ${target.httpStatus}` : target.state === 'unconfigured' ? 'Tanpa URL' : 'No response'}</span>
                </div>
                <div className={`${styles.statusPill} ${styles[`status_${target.state}`]}`}>
                  {stateIcon(target.state)}{stateLabel(target.state)}
                </div>
              </article>
            ))}
            {!snapshot && <div className={styles.loadingRow}><LoaderCircle className={styles.spinner} aria-hidden="true" />Menghubungi target monitoring…</div>}
          </div>
          <div className={styles.healthFooter}><span><span className={styles.statusDot} />Target hanya dicek melalui HTTP</span><span>{configuredCount} terpasang</span></div>
        </section>

        <section className={`${styles.panel} ${styles.incidentPanel}`} aria-labelledby="incident-title">
          <div className={styles.panelHeader}>
            <div>
              <h2 id="incident-title">Perubahan status</h2>
              <p>Transisi layanan yang terdeteksi pada sesi ini.</p>
            </div>
            {orderedIncidents.length > 0 && <span className={styles.incidentCount}>{orderedIncidents.length} terbaru</span>}
          </div>
          {orderedIncidents.length > 0 ? (
            <ol className={styles.incidentList}>
              {orderedIncidents.map((incident) => (
                <li key={incident.id}>
                  <span className={`${styles.incidentMark} ${incident.state === 'up' ? styles.incidentRecovered : ''}`}>
                    {incident.state === 'up' ? <ArrowUpRight aria-hidden="true" /> : <ArrowDownRight aria-hidden="true" />}
                  </span>
                  <div><strong>{incident.target}</strong><span>{incident.message}</span></div>
                  <time dateTime={incident.checkedAt}>{dateLabel(incident.checkedAt)}</time>
                </li>
              ))}
            </ol>
          ) : (
            <div className={styles.emptyIncidents}><ShieldCheck aria-hidden="true" /><strong>Belum ada perubahan</strong><span>Gangguan dan pemulihan akan muncul di sini saat terdeteksi.</span></div>
          )}
        </section>
      </div>
      <footer className={styles.pageFooter}>
        <span>Monitoring aktif saat halaman ini terbuka.</span>
        <span>Terakhir diperbarui: {snapshot ? timeLabel(snapshot.checkedAt) : '—'}{member?.name ? ` · ${member.name}` : ''}</span>
      </footer>
    </div>
  );
}
