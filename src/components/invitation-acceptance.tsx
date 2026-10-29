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
  MEMBER: 'Member',
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
      const message = cause instanceof Error ? cause.message : 'Could not process the invitation.';
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
      <Link className="brand invitation-brand" href="/"><Image className="brand-logo" src="/jitu-logo.webp" alt="" width={36} height={36} /><span>JituPTN Team Platform</span></Link>
      <div className="invitation-content">
        <h1 id="invitation-title">{state === 'success' ? 'Welcome' : state === 'signed-out' ? 'Sign in to continue' : state === 'checking' ? 'Checking invitation' : 'Invitation unavailable'}</h1>
        {state === 'checking' && <><p className="invitation-copy">Verifying your invitation. This may take a moment.</p><div className="invitation-progress" aria-label="Processing invitation" /></>}

        {state === 'signed-out' && <>
          <p className="invitation-copy">Sign in with a verified account using the email address that received the invitation. Then return to this tab to accept it.</p>
          <div className="invitation-actions"><a className="button button-primary" href={signIn}>Open sign-in page</a><button className="button button-secondary" onClick={() => void accept()}>I am already signed in</button></div>
        </>}

        {state === 'success' && <>
          <p className="invitation-copy">{member ? `${member.email} is now a ${roleLabels[member.role]}.` : 'The invitation has been accepted and your team membership is active.'}</p>
          <Link className="button button-primary invitation-primary-action" href="/">Open workspace</Link>
        </>}

        {state === 'error' && <>
          <p className="invitation-copy invitation-error" role="alert">{error}</p>
          {error.toLowerCase().includes('email') && <p className="invitation-copy">Make sure you sign in with the invited email address and that it has been verified.</p>}
          <div className="invitation-actions"><button className="button button-primary" onClick={() => void accept()}>Reload</button><a className="subtle-link" href={signIn}>Open sign-in page</a></div>
        </>}

        {state === 'invalid' && <p className="invitation-copy">This link does not contain an invitation token. Reopen the link from the invitation email or ask an administrator to resend it.</p>}
      </div>
      <p className="invitation-footnote">Access is based on the role listed in the invitation.</p>
    </section>
  );
}
