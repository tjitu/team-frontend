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
        if (active) setError('Supabase Auth tidak dapat dihubungi. Coba muat ulang halaman.');
      });
    } catch {
      if (active) setError('Supabase belum dikonfigurasi. Hubungi administrator.');
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
      if (/invalid login credentials/i.test(message)) setError('Email atau kata sandi tidak sesuai.');
      else if (/email not confirmed/i.test(message)) setError('Konfirmasi email Anda sebelum masuk.');
      else if (/fetch/i.test(message)) setError('Supabase Auth tidak dapat dihubungi. Periksa koneksi, lalu coba lagi.');
      else setError(message || 'Masuk gagal. Periksa data akun Anda.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-layout">
      <aside className="auth-aside">
        <a className="brand auth-brand" href="/" aria-label="Team Platform">
          <Image className="brand-logo" src="/jitu-logo.webp" alt="" width={36} height={36} /><span>Team Platform</span>
        </a>
        <div className="auth-aside-copy">
          <p className="auth-eyebrow">JITU / TEAM WORKSPACE</p>
          <h2>Ruang kerja yang tertata untuk tim yang bergerak.</h2>
          <p>Kelola proyek, susun pekerjaan, dan ikuti perkembangan tim dari satu tempat.</p>
        </div>
        <p className="auth-aside-footer">PROYEK <span /> TASK <span /> ANGGOTA TIM</p>
      </aside>
      <section className="auth-card" aria-labelledby="login-title">
        <div className="auth-heading">
          <p className="auth-eyebrow">AKSES TIM</p>
          <h1 id="login-title">Masuk ke ruang kerja</h1>
          <p>Gunakan akun yang telah diberikan akses ke Team Platform.</p>
        </div>
        <form className="form-stack auth-form" onSubmit={signIn}>
          {error && <p className="inline-message error" role="alert">{error}</p>}
          <label className="field-label" htmlFor="login-email">Email
            <input id="login-email" className="field-input" type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>
          <label className="field-label" htmlFor="login-password">Kata sandi
            <input id="login-password" className="field-input" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          </label>
          <button className="button button-primary auth-submit" disabled={loading}>
            {loading ? 'Memeriksa akun…' : 'Masuk'}
          </button>
        </form>
        <p className="auth-footnote">Akun dikelola oleh administrator Team Platform.</p>
      </section>
    </div>
  );
}
