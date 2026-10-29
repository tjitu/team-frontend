'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { api, signInUrl, TeamRole } from '@/lib/api';

type InviteState = 'checking' | 'signed-out' | 'success' | 'error' | 'invalid';

const roleLabels: Record<TeamRole, string> = {
  SYSTEM_OWNER: 'System Owner',
  SYSTEM_ADMIN: 'System Admin',
  MEMBER: 'Anggota',
};

export function InvitationAcceptance({ token, completed }: { token: string | null; completed: boolean }) {
  const router = useRouter();
  const autoAttemptedToken = useRef<string | null>(null);
  const [state, setState] = useState<InviteState>(completed ? 'success' : 'checking');
  const [error, setError] = useState('');
  const [member, setMember] = useState<{ name: string; email: string; role: TeamRole } | null>(null);

  const accept = useCallback(async () => {
    if (!token) {
      setState('invalid');
      return;
    }
    setState('checking');
    setError('');
    try {
      const result = await api.post<{ name: string; email: string; role: TeamRole }>('/team/invitations/accept', { token });
      setMember(result);
      setState('success');
      router.replace('/invitations/accept?completed=1');
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Undangan gagal diproses.';
      if (message === 'SESSION_EXPIRED') {
        setState('signed-out');
      } else {
        setError(message);
        setState('error');
      }
    }
  }, [token, router]);

  useEffect(() => {
    if (completed) {
      setState('success');
      return;
    }
    if (!token) {
      setState('invalid');
      return;
    }
    if (autoAttemptedToken.current === token) return;
    autoAttemptedToken.current = token;
    void accept();
  }, [accept, completed, token]);

  const signIn = signInUrl();

  return (
    <section className="invitation-panel" aria-labelledby="invitation-title" aria-live="polite">
      <Link className="brand invitation-brand" href="/"><Image className="brand-logo" src="/jitu-logo.webp" alt="" width={36} height={36} /><span>Team Platform</span></Link>
      <div className="invitation-content">
        <h1 id="invitation-title">{state === 'success' ? 'Selamat bergabung' : state === 'signed-out' ? 'Masuk untuk melanjutkan' : state === 'checking' ? 'Memeriksa undangan' : 'Undangan tidak tersedia'}</h1>
        {state === 'checking' && <><p className="invitation-copy">Undangan sedang diverifikasi. Sebentar ya.</p><div className="invitation-progress" aria-label="Memproses undangan" /></>}

        {state === 'signed-out' && <>
          <p className="invitation-copy">Masuk memakai akun terverifikasi dengan email yang menerima undangan. Setelah masuk, kembali ke tab ini untuk menerima undangannya.</p>
          <div className="invitation-actions"><a className="button button-primary" href={signIn}>Buka halaman masuk</a><button className="button button-secondary" onClick={() => void accept()}>Saya sudah masuk</button></div>
        </>}

        {state === 'success' && <>
          <p className="invitation-copy">{member ? `${member.email} sekarang terdaftar sebagai ${roleLabels[member.role]}.` : 'Undangan sudah diterima dan keanggotaan tim aktif.'}</p>
          <Link className="button button-primary invitation-primary-action" href="/">Buka workspace</Link>
        </>}

        {state === 'error' && <>
          <p className="invitation-copy invitation-error" role="alert">{error}</p>
          {error.toLowerCase().includes('email') && <p className="invitation-copy">Pastikan kamu masuk dengan email undangan yang sama dan alamat emailnya sudah diverifikasi.</p>}
          <div className="invitation-actions"><button className="button button-primary" onClick={() => void accept()}>Muat ulang</button><a className="subtle-link" href={signIn}>Buka halaman masuk</a></div>
        </>}

        {state === 'invalid' && <p className="invitation-copy">Link tidak memiliki token undangan. Buka kembali link dari email undangan atau minta admin mengirimkannya ulang.</p>}
      </div>
      <p className="invitation-footnote">Akses diberikan sesuai role yang tercantum pada undangan.</p>
    </section>
  );
}
