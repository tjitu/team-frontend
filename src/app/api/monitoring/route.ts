import { NextRequest } from 'next/server';
import { TARGET_LATENCY_MS } from '../../monitoring/latency-target';

export const dynamic = 'force-dynamic';

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

function safeOrigin(value: string | undefined) {
  if (!value?.trim()) return null;

  try {
    const url = new URL(value.trim());
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    if (url.username || url.password) return null;
    return url.toString();
  } catch {
    return null;
  }
}

function readinessUrl(apiUrl: string | undefined) {
  const base = safeOrigin(apiUrl);
  if (!base) return null;

  try {
    const url = new URL(base);
    url.pathname = `${url.pathname.replace(/\/$/, '')}/health/ready`;
    url.search = '';
    return url.toString();
  } catch {
    return null;
  }
}

async function checkTarget(
  id: string,
  name: string,
  group: Target['group'],
  configuredUrl: string | null,
): Promise<Target> {
  const checkedAt = new Date().toISOString();
  if (!configuredUrl) {
    return {
      id,
      name,
      group,
      url: null,
      state: 'unconfigured',
      latencyMs: null,
      httpStatus: null,
      checkedAt,
      detail: 'URL belum dikonfigurasi',
    };
  }

  const startedAt = performance.now();
  try {
    const response = await fetch(configuredUrl, {
      cache: 'no-store',
      redirect: 'follow',
      signal: AbortSignal.timeout(8_000),
      headers: { 'User-Agent': 'JituTeamMonitoring/1.0' },
    });
    const latencyMs = Math.round(performance.now() - startedAt);
    let state: TargetState = 'up';
    let detail = 'HTTP merespons normal';

    if (response.status >= 500) {
      state = 'down';
      detail = 'Server mengembalikan error';
    } else if (!response.ok) {
      state = 'degraded';
      detail = 'Endpoint merespons dengan status non-2xx';
    } else if (latencyMs >= TARGET_LATENCY_MS) {
      state = 'degraded';
      detail = `Respons melewati target ${TARGET_LATENCY_MS} ms`;
    }

    return {
      id,
      name,
      group,
      url: `${new URL(configuredUrl).origin}${new URL(configuredUrl).pathname}`,
      state,
      latencyMs,
      httpStatus: response.status,
      checkedAt: new Date().toISOString(),
      detail,
    };
  } catch (error) {
    const latencyMs = Math.round(performance.now() - startedAt);
    return {
      id,
      name,
      group,
      url: `${new URL(configuredUrl).origin}${new URL(configuredUrl).pathname}`,
      state: 'down',
      latencyMs,
      httpStatus: null,
      checkedAt: new Date().toISOString(),
      detail: error instanceof Error && error.name === 'TimeoutError' ? 'Health check timeout' : 'Tidak dapat terhubung',
    };
  }
}

function withPath(origin: string, path: string) {
  try {
    const url = new URL(origin);
    url.pathname = path;
    url.search = '';
    return url.toString();
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const teamOrigin = safeOrigin(process.env.MONITOR_TEAM_URL) ?? request.nextUrl.origin;
  const mainOrigin = safeOrigin(process.env.MONITOR_MAIN_URL || 'https://jituptn.com');
  // Liveness checks ("is the web server up") hit a bare JSON route instead of the
  // full homepage, so this doesn't measure SSR render time, font loading, or
  // page-level data fetching on top of plain reachability.
  const teamSiteUrl = teamOrigin ? (withPath(teamOrigin, '/api/health') ?? teamOrigin) : null;
  const mainSiteUrl = mainOrigin ? (withPath(mainOrigin, '/api/health') ?? mainOrigin) : null;
  const mainApiHealthUrl = safeOrigin(
    process.env.MONITOR_MAIN_API_HEALTH_URL || 'https://jituptn.com/api/proxy/health/ready',
  );
  const targets = await Promise.all([
    checkTarget('main-web', 'Main website', 'Main', mainSiteUrl),
    checkTarget('main-api', 'Main API + database', 'Main', mainApiHealthUrl),
    checkTarget('team-web', 'Team Platform website', 'Team Platform', teamSiteUrl),
    checkTarget('team-api', 'Team API + database', 'Team Platform', readinessUrl(process.env.NEXT_PUBLIC_TEAM_API_URL)),
  ]);

  return Response.json(
    { checkedAt: new Date().toISOString(), targets },
    { headers: { 'Cache-Control': 'no-store, max-age=0' } },
  );
}
