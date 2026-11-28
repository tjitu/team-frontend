import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import { enforceAffiliateRoute } from './lib/affiliate-route-access';

export async function proxy(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !publishableKey) {
    const path=request.nextUrl.pathname;
    if (path==='/login' || path.startsWith('/auth/') || path==='/api/health') return NextResponse.next({ request });
    return new NextResponse('Team authentication is not configured.',{ status: 503 });
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(supabaseUrl, publishableKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  try {
    const { data } = await supabase.auth.getClaims();
    const path = request.nextUrl.pathname;
    const publicRoute = path==='/login' || path.startsWith('/auth/') || path.startsWith('/invitations/') || path==='/api/health';
    if (!publicRoute) {
      if (!data?.claims) return path.startsWith('/api/') ? NextResponse.json({ message: 'Unauthorized' },{ status: 401 })
        : NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(path)}`,request.url));
      // This Next route verifies the user and authoritative DB role itself.
      if (path === '/api/team/members') return response;
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) return NextResponse.redirect(new URL('/login',request.url));
      const decision = await enforceAffiliateRoute(request,sessionData.session.access_token);
      if (decision) {
        response.cookies.getAll().forEach(cookie => decision.cookies.set(cookie));
        return decision;
      }
    }
  } catch {
    if (request.nextUrl.pathname!=='/login' && !request.nextUrl.pathname.startsWith('/auth/')) {
      return new NextResponse('Team access is temporarily unavailable.',{ status: 503 });
    }
  }
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
