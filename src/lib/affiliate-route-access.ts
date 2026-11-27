import { NextRequest, NextResponse } from 'next/server';

export async function enforceAffiliateRoute(request: NextRequest, token: string) {
  const base = (process.env.NEXT_PUBLIC_TEAM_API_URL ?? 'http://localhost:3200/api').replace(/\/$/,'');
  const response = await fetch(`${base}/team/me`,{ headers: { Authorization: `Bearer ${token}` },cache: 'no-store' });
  if (!response.ok) return request.nextUrl.pathname.startsWith('/api/')
    ? NextResponse.json({ message: 'Active Team membership required.' },{ status: 403 })
    : NextResponse.redirect(new URL('/login?error=Account%20access%20unavailable',request.url));
  const member = await response.json() as { role: string };
  const path = request.nextUrl.pathname;
  if (member.role !== 'AFFILIATOR') return path==='/affiliate' || path.startsWith('/affiliate/')
    ? NextResponse.redirect(new URL('/',request.url)) : null;
  if (path.startsWith('/api/')) return NextResponse.json({ message: 'Affiliator access denied.' },{ status: 403 });
  const stateResponse = await fetch(`${base}/team/affiliate/me/agreement`,{ headers: { Authorization: `Bearer ${token}` },cache: 'no-store' });
  if (!stateResponse.ok) return new NextResponse('Agreement status is temporarily unavailable.',{ status: 503 });
  const state = await stateResponse.json() as { required: boolean };
  const destination = state.required ? '/affiliate/agreement' : '/affiliate';
  if ((state.required && path!=='/affiliate/agreement') || !(path==='/affiliate' || path.startsWith('/affiliate/'))) {
    return NextResponse.redirect(new URL(destination,request.url));
  }
  return null;
}
