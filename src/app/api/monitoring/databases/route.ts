import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type Metric = { name: string; labels: Record<string, string>; value: number };

type ProjectConfig = {
  id: string;
  name: string;
  ref: string;
  region: string;
  secret: string | undefined;
};

const projects = (): ProjectConfig[] => [
  {
    id: 'jitu-ptn',
    name: 'Jitu PTN DB',
    ref: 'oyyhjyyadrsviehamztc',
    region: 'ap-southeast-2',
    secret: process.env.SUPABASE_METRICS_JITU_PTN_SECRET_KEY,
  },
  {
    id: 'team-platform',
    name: 'Team Platform DB',
    ref: 'zqnjwcagfvjubkozubir',
    region: 'eu-west-1',
    secret: process.env.SUPABASE_METRICS_TEAM_PLATFORM_SECRET_KEY,
  },
];

function teamMemberUrl() {
  const raw = (process.env.NEXT_PUBLIC_TEAM_API_URL || 'http://localhost:3200/api').trim();
  try {
    const base = new URL(raw);
    if ((base.protocol !== 'https:' && base.protocol !== 'http:') || base.username || base.password) return null;
    if (base.protocol === 'http:' && !['localhost', '127.0.0.1', '[::1]'].includes(base.hostname)) return null;
    return `${base.toString().replace(/\/$/, '')}/team/me`;
  } catch {
    return null;
  }
}

async function authorizeAdmin(request: NextRequest): Promise<'allowed' | 'unauthorized' | 'forbidden' | 'unavailable'> {
  const header = request.headers.get('authorization');
  if (!header?.startsWith('Bearer ')) return 'unauthorized';

  const url = teamMemberUrl();
  if (!url) return 'unavailable';

  try {
    const response = await fetch(url, {
      headers: { Authorization: header },
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.timeout(3_000),
    });
    if (response.status === 401) return 'unauthorized';
    if (response.status === 403) return 'forbidden';
    if (!response.ok) return 'unavailable';

    const member = await response.json() as { role?: string };
    return member.role === 'SYSTEM_OWNER' || member.role === 'SYSTEM_ADMIN' ? 'allowed' : 'forbidden';
  } catch {
    return 'unavailable';
  }
}

function parsePrometheus(text: string): Metric[] {
  const metrics: Metric[] = [];
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const match = line.match(/^([a-zA-Z_:][a-zA-Z0-9_:]*)(?:\{(.*)\})?\s+([^\s]+)(?:\s+\d+)?$/);
    if (!match) continue;

    const value = Number(match[3]);
    if (!Number.isFinite(value)) continue;
    const labels: Record<string, string> = {};
    const labelPattern = /([a-zA-Z_][a-zA-Z0-9_]*)="((?:\\.|[^"\\])*)"/g;
    for (const label of match[2]?.matchAll(labelPattern) ?? []) {
      labels[label[1]] = label[2].replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
    }
    metrics.push({ name: match[1], labels, value });
  }
  return metrics;
}

function metricValues(metrics: Metric[], name: string, predicate: (labels: Record<string, string>) => boolean = () => true) {
  return metrics.filter((metric) => metric.name === name && predicate(metric.labels));
}

function sumMetric(metrics: Metric[], name: string, predicate?: (labels: Record<string, string>) => boolean) {
  const values = metricValues(metrics, name, predicate);
  return values.length ? values.reduce((total, metric) => total + metric.value, 0) : null;
}

function maxMetric(metrics: Metric[], name: string) {
  const values = metricValues(metrics, name);
  return values.length ? Math.max(...values.map((metric) => metric.value)) : null;
}

function storageMetrics(metrics: Metric[]) {
  const sizes = metricValues(metrics, 'node_filesystem_size_bytes', (labels) => labels.mountpoint === '/' && labels.fstype !== 'tmpfs');
  const disks = sizes.map((size) => {
    const matchingAvail = metricValues(metrics, 'node_filesystem_avail_bytes', (labels) =>
      labels.mountpoint === size.labels.mountpoint && labels.device === size.labels.device && labels.fstype === size.labels.fstype,
    )[0];
    return { size: size.value, available: matchingAvail?.value ?? null };
  }).filter((disk) => disk.available !== null).sort((left, right) => left.size - right.size);
  const disk = disks[0];
  return {
    diskTotalBytes: disk?.size ?? null,
    diskAvailableBytes: disk?.available ?? null,
  };
}

function summarize(metrics: Metric[]) {
  const dbMetric = (labels: Record<string, string>) => !labels.service_type || labels.service_type === 'db';
  const dbMetrics = metrics.filter((metric) => dbMetric(metric.labels));
  const totalRamBytes = maxMetric(dbMetrics, 'node_memory_MemTotal_bytes');
  const availableRamBytes = maxMetric(dbMetrics, 'node_memory_MemAvailable_bytes');
  const freeRamBytes = maxMetric(dbMetrics, 'node_memory_MemFree_bytes');
  const cachedBytes = sumMetric(dbMetrics, 'node_memory_Cached_bytes');
  const bufferBytes = sumMetric(dbMetrics, 'node_memory_Buffers_bytes');
  const memoryCacheBytes = cachedBytes === null && bufferBytes === null ? null : (cachedBytes ?? 0) + (bufferBytes ?? 0);
  const slabBytes = maxMetric(dbMetrics, 'node_memory_Slab_bytes');
  const pageTableBytes = maxMetric(dbMetrics, 'node_memory_PageTables_bytes');
  const swapCachedBytes = maxMetric(dbMetrics, 'node_memory_SwapCached_bytes');
  const swapTotalBytes = maxMetric(dbMetrics, 'node_memory_SwapTotal_bytes');
  const swapFreeBytes = maxMetric(dbMetrics, 'node_memory_SwapFree_bytes');
  const memoryBreakdown = [freeRamBytes, cachedBytes, bufferBytes, slabBytes, pageTableBytes, swapCachedBytes];
  const ramUsedBytes = totalRamBytes !== null && memoryBreakdown.every((value) => value !== null)
    ? Math.max(0, totalRamBytes - memoryBreakdown.reduce<number>((total, value) => total + (value ?? 0), 0))
    : totalRamBytes !== null && availableRamBytes !== null
      ? Math.max(0, totalRamBytes - availableRamBytes)
      : null;
  const cpuIdleSeconds = sumMetric(dbMetrics, 'node_cpu_seconds_total', (labels) => labels.mode === 'idle');
  const cpuTotalSeconds = sumMetric(dbMetrics, 'node_cpu_seconds_total');
  const cpuSeries = metricValues(dbMetrics, 'node_cpu_seconds_total', (labels) => Boolean(labels.cpu));
  const cpuCores = new Set(cpuSeries.map((metric) => `${metric.labels.instance ?? metric.labels.supabase_identifier ?? 'primary'}:${metric.labels.cpu}`)).size || null;
  const { diskTotalBytes, diskAvailableBytes } = storageMetrics(dbMetrics);

  return {
    cpuIdleSeconds,
    cpuTotalSeconds,
    cpuCores,
    cpuLoad5: maxMetric(dbMetrics, 'node_load5'),
    ramTotalBytes: totalRamBytes,
    ramAvailableBytes: availableRamBytes,
    ramUsedBytes,
    ramCacheBytes: memoryCacheBytes,
    swapUsedBytes: swapTotalBytes !== null && swapFreeBytes !== null ? Math.max(0, swapTotalBytes - swapFreeBytes) : null,
    diskTotalBytes,
    diskAvailableBytes,
    activeConnections: sumMetric(metrics, 'pgbouncer_used_clients'),
    waitingConnections: sumMetric(metrics, 'pgbouncer_pools_client_waiting_connections'),
    diskReadOps: sumMetric(dbMetrics, 'node_disk_reads_completed_total'),
    diskWriteOps: sumMetric(dbMetrics, 'node_disk_writes_completed_total'),
    diskReadBytes: sumMetric(dbMetrics, 'node_disk_read_bytes_total'),
    diskWriteBytes: sumMetric(dbMetrics, 'node_disk_written_bytes_total'),
    networkReceivedBytes: sumMetric(dbMetrics, 'node_network_receive_bytes_total'),
    networkSentBytes: sumMetric(dbMetrics, 'node_network_transmit_bytes_total'),
  };
}

async function checkProject(project: ProjectConfig) {
  const checkedAt = new Date().toISOString();
  const base = {
    id: project.id,
    name: project.name,
    ref: project.ref,
    region: project.region,
    checkedAt,
  };

  if (!project.secret?.trim()) {
    return { ...base, state: 'unconfigured' as const, detail: 'Secret API Key belum diatur', metrics: null };
  }
  if (!project.secret.trim().startsWith('sb_secret_')) {
    return { ...base, state: 'unconfigured' as const, detail: 'Isi dengan Secret API Key Supabase (sb_secret_…)', metrics: null };
  }

  try {
    const credentials = Buffer.from(`service_role:${project.secret.trim()}`).toString('base64');
    const response = await fetch(`https://${project.ref}.supabase.co/customer/v1/privileged/metrics`, {
      headers: {
        Authorization: `Basic ${credentials}`,
        Accept: 'text/plain; version=0.0.4',
      },
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.timeout(6_000),
    });

    if (response.status === 401 || response.status === 403) {
      return { ...base, state: 'down' as const, detail: 'Secret API Key ditolak Supabase', metrics: null };
    }
    if (!response.ok) {
      return { ...base, state: 'degraded' as const, detail: `Metrics API merespons HTTP ${response.status}`, metrics: null };
    }

    const metrics = parsePrometheus(await response.text());
    const summary = summarize(metrics);
    if (summary.ramTotalBytes === null && summary.cpuTotalSeconds === null && summary.diskTotalBytes === null) {
      return { ...base, state: 'degraded' as const, detail: 'Metrics API aktif, tetapi metrik database tidak ditemukan', metrics: null };
    }

    return { ...base, state: 'up' as const, detail: 'Metrics API terhubung', metrics: summary };
  } catch (error) {
    const detail = error instanceof Error && error.name === 'TimeoutError'
      ? 'Metrics API melewati batas waktu'
      : 'Metrics API tidak dapat dihubungi';
    return { ...base, state: 'down' as const, detail, metrics: null };
  }
}

export async function GET(request: NextRequest) {
  const access = await authorizeAdmin(request);
  if (access !== 'allowed') {
    const status = access === 'unauthorized' ? 401 : access === 'forbidden' ? 403 : 503;
    return Response.json({ error: access === 'unavailable' ? 'Verifikasi admin sedang tidak tersedia.' : 'Akses monitoring ditolak.' }, {
      status,
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    });
  }

  const databases = await Promise.all(projects().map(checkProject));
  return Response.json({ checkedAt: new Date().toISOString(), databases }, {
    headers: { 'Cache-Control': 'no-store, max-age=0' },
  });
}
