import 'server-only';
import { Pool, type PoolClient } from 'pg';
import { SUPABASE_ROOT_CA } from './supabase-ca';
import { MemberError } from './contracts';

const globalPools = globalThis as typeof globalThis & { memberPools?: Map<string, Pool> };
const pools = globalPools.memberPools ??= new Map<string, Pool>();
export function database(kind: 'team' | 'main'): Pool {
  const value = kind === 'team' ? process.env.TEAM_DATABASE_URL : process.env.JITU_CONTROL_CENTER_DATABASE_URL;
  if (!value) throw new MemberError(503, `${kind === 'team' ? 'TEAM_DATABASE_URL' : 'JITU_CONTROL_CENTER_DATABASE_URL'} is not configured on the Next.js server.`);
  const existing = pools.get(kind);
  if (existing) return existing;
  const url = new URL(value);
  for (const key of ['sslmode', 'sslcert', 'sslkey', 'sslrootcert', 'connection_limit', 'pgbouncer', 'pool_timeout']) url.searchParams.delete(key);
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  const ca = kind === 'team' ? process.env.TEAM_DATABASE_CA_PEM : process.env.JITU_DATABASE_CA_PEM;
  const pool = new Pool({ connectionString: url.toString(), max: 2, idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000, statement_timeout: 20000,
    ssl: local ? undefined : { rejectUnauthorized: true, ca: ca || SUPABASE_ROOT_CA } });
  // Idle socket failures are handled by pg; do not log connection details.
  pool.on('error', () => console.error(`Team member ${kind} database connection was interrupted.`));
  pools.set(kind, pool);
  return pool;
}
export async function transaction<T>(pool: Pool, action: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  let discard = false;
  try {
    await client.query('BEGIN');
    await client.query("SET LOCAL lock_timeout = '5s'");
    const result = await action(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch { discard = true; }
    throw error;
  } finally { client.release(discard); }
}
