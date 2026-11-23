// Pure liveness probe: no DB, no data fetching, no SSR render. Exists so uptime
// monitoring can check "is the web server up" without paying for a full
// homepage render.
export const dynamic = 'force-dynamic';

export async function GET() {
  return Response.json(
    { status: 'ok' },
    { headers: { 'Cache-Control': 'no-store, max-age=0' } },
  );
}
