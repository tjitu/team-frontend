import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

function safeNextPath(value: string | null) {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return '/';
  return value;
}

export async function GET(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const code = request.nextUrl.searchParams.get('code');
  const destination = safeNextPath(request.nextUrl.searchParams.get('next'));

  if (!supabaseUrl || !publishableKey || !code) {
    return NextResponse.redirect(new URL('/login?error=auth-callback', request.url));
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(supabaseUrl, publishableKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(new URL('/login?error=auth-callback', request.url));

  return NextResponse.redirect(new URL(destination, request.url));
}
