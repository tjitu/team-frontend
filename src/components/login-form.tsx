'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Eye, EyeOff, LoaderCircle } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { ThemeToggle } from '@/components/theme-toggle';
import { markSessionStarted } from '@/lib/session';
import styles from './login-form.module.css';

function safeNextPath(value: string | undefined) {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\') || value.startsWith('/login')) return '/';
  return value;
}

export function LoginForm({
  nextPath,
  initialError,
  initialNotice,
}: {
  nextPath?: string;
  initialError?: string;
  initialNotice?: string;
}) {
  const router = useRouter();
  const destination = safeNextPath(nextPath);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(initialError ?? '');
  const [notice, setNotice] = useState(initialNotice ?? '');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    let active = true;
    if (initialNotice) return;
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
  }, [destination, router, initialNotice]);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setNotice('');
    try {
      const { error: authError } = await createSupabaseBrowserClient().auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (authError) throw authError;
      markSessionStarted();
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
    <div className={styles.page}>
      <ThemeToggle className={styles.themeToggle} defaultTheme="dark" iconOnly />
      <section className={styles.panel} aria-labelledby="login-title">
        <Link className={styles.brand} href="/" aria-label="Jitu Team Platform home">
          <Image src="/blue-jitu-logo.png" alt="" width={64} height={44} priority />
          <span>jitu.</span>
        </Link>
        <header className={styles.heading}>
          <p className={styles.eyebrow}>Jitu Workspace</p>
          <h1 id="login-title">Welcome back</h1>
          <p className={styles.subtitle}>Sign in to your Jitu workspace.</p>
        </header>
        <form className={styles.form} onSubmit={signIn} aria-busy={loading}>
          {notice && <p className={styles.notice} role="status">{notice}</p>}
          {error && <p className={styles.error} role="alert">{error}</p>}
          <label className={styles.field} htmlFor="login-email">Email
            <input id="login-email" className={styles.input} type="email" autoComplete="username" placeholder="you@jituptn.com" value={email} onChange={(event) => setEmail(event.target.value)} disabled={loading} required />
          </label>
          <div className={styles.field}>
            <label htmlFor="login-password">Password</label>
            <div className={styles.passwordField}>
              <input id="login-password" className={styles.input} type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Enter your password" value={password} onChange={(event) => setPassword(event.target.value)} disabled={loading} required />
              <button className={styles.passwordToggle} type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword} aria-controls="login-password" onClick={() => setShowPassword((visible) => !visible)}>
                {showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
              </button>
            </div>
          </div>
          <button className={styles.submit} type="submit" disabled={loading}>
            {loading && <LoaderCircle className={styles.spinner} aria-hidden="true" />}
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <p className={styles.footnote}>Need access? Contact your administrator.</p>
      </section>
      <footer className={styles.footer}>Jitu Team Platform</footer>
    </div>
  );
}
