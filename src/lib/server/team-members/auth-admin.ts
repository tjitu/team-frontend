import 'server-only';
import { MemberError, type MemberInput } from './contracts';

export function createAuthAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, '');
  const key = (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  let legacy = false;
  if (key.startsWith('eyJ')) {
    try { legacy = JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString()).role === 'service_role'; } catch { /* Invalid key. */ }
  }
  if (!url || (!key.startsWith('sb_secret_') && !legacy)) {
    throw new MemberError(503, 'Configure SUPABASE_SECRET_KEY on the Next.js server with a valid Team Supabase admin key.');
  }
  const headers: Record<string, string> = { apikey: key, 'Content-Type': 'application/json' };
  if (legacy) headers.Authorization = `Bearer ${key}`;
  async function call(path: string, method: string, body?: unknown) {
    let response: Response;
    try {
      response = await fetch(`${url}/auth/v1/admin/users${path}`, {
        method, headers, body: body ? JSON.stringify(body) : undefined, cache: 'no-store', signal: AbortSignal.timeout(12000),
      });
    } catch { throw new MemberError(503, 'Supabase Auth is temporarily unavailable.'); }
    if (response.status === 401 || response.status === 403) {
      throw new MemberError(503, 'Supabase rejected the Next.js admin key. Update SUPABASE_SECRET_KEY in team-frontend/.env.local and restart Next.js.');
    }
    const payload: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      const details = payload && typeof payload === 'object' ? payload as Record<string, unknown> : {};
      const code = details.error_code ?? details.code;
      if (response.status === 409 || code === 'email_exists' || code === 'user_already_exists') {
        throw new MemberError(409, 'A Supabase account with this email already exists.');
      }
      throw new MemberError([400, 422].includes(response.status) ? 400 : 503, 'Supabase Auth could not create or update this account.');
    }
    return payload;
  }
  return {
    async create(input: MemberInput) {
      const payload = await call('', 'POST', { email: input.email, password: input.password, email_confirm: true, user_metadata: { name: input.name, full_name: input.name } });
      if (!payload || typeof payload !== 'object' || !('id' in payload) || typeof payload.id !== 'string') {
        throw new MemberError(503, 'Supabase Auth returned an invalid account response.');
      }
      return payload.id;
    },
    async remove(id: string) { await call(`/${encodeURIComponent(id)}`, 'DELETE'); },
  };
}
