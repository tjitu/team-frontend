import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { createTeamMember } from '@/lib/server/team-members/create';
import { createAuthAdmin } from '@/lib/server/team-members/auth-admin';
import { memberRepository } from '@/lib/server/team-members/repository';
import { MemberError, parseMemberInput } from '@/lib/server/team-members/contracts';

export const runtime = 'nodejs';
export async function POST(request: NextRequest) {
  try {
    if (request.headers.get('origin') !== request.nextUrl.origin) throw new MemberError(403, 'A same-origin request is required.');
    if (!request.headers.get('content-type')?.startsWith('application/json')) throw new MemberError(415, 'JSON account details are required.');
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) throw new MemberError(503, 'Team authentication is not configured.');
    const cookieStore = await cookies();
    const supabase = createServerClient(url, key, { cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: updates => updates.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
    } });
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw new MemberError(401, 'Sign in again before creating an account.');
    let body: unknown;
    try { body = await request.json(); } catch { throw new MemberError(400, 'Invalid JSON account details.'); }
    const input = parseMemberInput(body);
    const member = await createTeamMember(data.user.id, input, { repository: memberRepository, auth: createAuthAdmin() });
    return NextResponse.json(member, { status: 201, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const status = error instanceof MemberError ? error.status : 503;
    const message = error instanceof MemberError ? error.message : 'The account service is temporarily unavailable.';
    return NextResponse.json({ message }, { status, headers: { 'Cache-Control': 'no-store' } });
  }
}
