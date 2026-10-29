'use client';

import Image from 'next/image';
import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

function safeNextPath(value: string | undefined) {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\') || value.startsWith('/login')) return '/';
  return value;
}

export function LoginForm({ nextPath, initialError }: { nextPath?: string; initialError?: string }) {
  const router = useRouter();
  const destination = safeNextPath(nextPath);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(initialError ?? '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    try {
      void createSupabaseBrowserClient().auth.getSession().then(({ data, error: sessionError }) => {
        if (active && !sessionError && data.session) router.replace(destination);
      }).catch(() => {
        if (active) setError('Supabase Auth is unavailable. Reload the page and try again.');
      });
    } catch {
      if (active) setError('Supabase is not configured. Contact your administrator.');
    }
    return () => { active = false; };
  }, [destination, router]);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { error: authError } = await createSupabaseBrowserClient().auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (authError) throw authError;
      router.replace(destination);
      router.refresh();
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : '';
      if (/invalid login credentials/i.test(message)) setError('The email or password is incorrect.');
      else if (/email not confirmed/i.test(message)) setError('Confirm your email address before signing in.');
      else if (/fetch/i.test(message)) setError('Supabase Auth is unavailable. Check your connection and try again.');
      else setError(message || 'Sign-in failed. Check your account details.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-layout">
      <aside className="auth-aside">
        <a className="brand auth-brand" href="/" aria-label="JituPTN Team Platform">
          <Image className="brand-logo" src="/jitu-logo.webp" alt="" width={36} height={36} /><span>JituPTN Team Platform</span>
        </a>
        <div className="auth-aside-copy">
          <p className="auth-eyebrow">JITU / TEAM WORKSPACE</p>
          <h2>A well-organized workspace for teams in motion.</h2>
          <p>Plan projects, organize work, and track team progress in one place.</p>
        </div>
      </aside>
      <section className="auth-card" aria-labelledby="login-title">
        <div className="auth-heading">
          <p className="auth-eyebrow">TEAM ACCESS</p>
          <h1 id="login-title">Sign in to your workspace</h1>
          <p>Sign in with an account that has access to JituPTN Team Platform.</p>
        </div>
        <form className="form-stack auth-form" onSubmit={signIn}>
          {error && <p className="inline-message error" role="alert">{error}</p>}
          <label className="field-label" htmlFor="login-email">Email
            <input id="login-email" className="field-input" type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>
          <label className="field-label" htmlFor="login-password">Password
            <input id="login-password" className="field-input" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          </label>
          <button className="button button-primary auth-submit" disabled={loading}>
            {loading ? 'Checking account…' : 'Sign in'}
          </button>
        </form>
        <p className="auth-footnote">Accounts are managed by a JituPTN Team Platform administrator.</p>
      </section>
    </div>
  );
}
