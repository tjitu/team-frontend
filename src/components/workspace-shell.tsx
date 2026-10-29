'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { api, CurrentMember, Project, signInUrl } from '@/lib/api';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

function NavIcon({ name }: { name: 'overview' | 'team' | 'activity' | 'departments' }) {
  const paths = {
    overview: <><path d="m3 10 9-7 9 7" /><path d="M5 9v12h14V9M9 21v-7h6v7" /></>,
    team: <><circle cx="9" cy="8" r="3" /><path d="M3 20v-1a6 6 0 0 1 12 0v1M16 5.5a3 3 0 0 1 0 5.8M18 14a5 5 0 0 1 3 4.5V20" /></>,
    activity: <><path d="M3 12h4l3-8 4 16 3-8h4" /></>,
    departments: <><rect x="4" y="3" width="16" height="18" rx="1" /><path d="M9 7h2m2 0h2M9 11h2m2 0h2M9 15h2m2 0h2M10 21v-3h4v3" /></>,
  };
  return <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

export function WorkspaceShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isInvitationRoute = pathname.startsWith('/invitations/accept');
  const isLoginRoute = pathname === '/login';
  const [member, setMember] = useState<CurrentMember | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadError, setLoadError] = useState('');
  const [accountOpen, setAccountOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState('');
  const accountControlRef = useRef<HTMLDivElement>(null);
  const accountTriggerRef = useRef<HTMLButtonElement>(null);
  const activeProject = projects.find((project) => pathname.startsWith(`/projects/${project.id}`));
  const pageLabel = pathname === '/' ? 'Ikhtisar'
    : pathname.startsWith('/team') ? 'Anggota tim'
      : pathname === '/activity' ? 'Aktivitas tim'
        : pathname.startsWith('/departments') ? 'Departemen'
          : pathname.endsWith('/activity') ? 'Aktivitas proyek'
            : activeProject?.name ?? 'Ruang kerja';

  useEffect(() => {
    if (isInvitationRoute || isLoginRoute) return;
    let active = true;
    Promise.all([
      api.get<CurrentMember>('/team/me'),
      api.get<Project[]>('/team/projects'),
    ]).then(([currentMember, projectList]) => {
      if (!active) return;
      setMember(currentMember);
      setProjects(projectList);
      setLoadError('');
    }).catch((error: Error) => {
      if (!active) return;
      if (error.message === 'SESSION_EXPIRED') {
        window.location.assign(signInUrl());
        return;
      }
      setLoadError(error.message);
    });
    return () => { active = false; };
  }, [isInvitationRoute, isLoginRoute]);

  useEffect(() => {
    if (!accountOpen) return;
    function closeOnOutsideClick(event: PointerEvent) {
      if (event.target instanceof Node && !accountControlRef.current?.contains(event.target)) setAccountOpen(false);
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setAccountOpen(false);
        accountTriggerRef.current?.focus();
      }
    }
    document.addEventListener('pointerdown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [accountOpen]);

  if (isInvitationRoute || isLoginRoute) return <main className={isLoginRoute ? 'auth-page' : 'invitation-shell'}>{children}</main>;

  async function signOut() {
    if (signingOut) return;
    setSigningOut(true);
    setSignOutError('');
    try {
      const { error } = await createSupabaseBrowserClient().auth.signOut();
      if (error) throw error;
      window.location.replace('/login');
    } catch {
      setSignOutError('Gagal keluar dari akun. Periksa koneksi lalu coba lagi.');
      setSigningOut(false);
    }
  }

  return (
    <div className="workspace">
      <aside className="sidebar" aria-label="Navigasi utama">
        <Link className="brand" href="/" aria-label="JituPTN Team Platform, beranda">
          <Image className="brand-logo" src="/jitu-logo.webp" alt="" width={36} height={36} />
          <span>JituPTN Team Platform</span>
        </Link>
        <div className="sidebar-label">Ruang kerja</div>
        <nav className="primary-nav">
          <Link className={`nav-link ${pathname === '/' ? 'is-active' : ''}`} href="/">
            <NavIcon name="overview" />Ikhtisar
          </Link>
          {member && (member.role === 'SYSTEM_OWNER' || member.role === 'SYSTEM_ADMIN') && <Link className={`nav-link ${pathname.startsWith('/team') ? 'is-active' : ''}`} href="/team">
            <NavIcon name="team" />Anggota tim
          </Link>}
          {member && (member.role === 'SYSTEM_OWNER' || member.role === 'SYSTEM_ADMIN') && <Link className={`nav-link ${pathname === '/activity' ? 'is-active' : ''}`} href="/activity">
            <NavIcon name="activity" />Aktivitas tim
          </Link>}
          {member && <Link className={`nav-link ${pathname.startsWith('/departments') ? 'is-active' : ''}`} href="/departments">
            <NavIcon name="departments" />Departemen
          </Link>}
        </nav>
        <div className="sidebar-section-heading">
          <span>Proyek</span>
          <span className="count-pill">{projects.length}</span>
        </div>
        <nav className="project-nav" aria-label="Proyek">
          {projects.map((project) => (
            <Link
              className={`project-nav-link ${pathname === `/projects/${project.id}` ? 'is-active' : ''}`}
              href={`/projects/${project.id}`}
              key={project.id}
              title={project.name}
            >
              <span className="project-mark" aria-hidden="true">{project.name.slice(0, 1).toUpperCase()}</span>
              <span className="truncate">{project.name}</span>
            </Link>
          ))}
          {projects.length === 0 && !loadError && <p className="sidebar-empty">Belum ada proyek aktif</p>}
        </nav>
        <div className="sidebar-footer">
          <div className="avatar avatar-small">{member?.name?.slice(0, 1).toUpperCase() ?? '—'}</div>
          <div className="profile-copy">
            <strong className="truncate">{member?.name ?? 'Memuat akun…'}</strong>
            <span className="truncate">{member?.role?.replaceAll('_', ' ') ?? 'Anggota tim'}</span>
          </div>
        </div>
      </aside>
      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumb"><Link href="/">JituPTN Team Platform</Link><span className="breadcrumb-separator">/</span><span aria-current="page">{pageLabel}</span></div>
          <div className="account-control" ref={accountControlRef}>
            <button
              ref={accountTriggerRef}
              className="account-trigger"
              type="button"
              aria-label="Buka menu akun"
              aria-expanded={accountOpen}
              aria-controls="account-menu"
              onClick={() => { setSignOutError(''); setAccountOpen((open) => !open); }}
            >
              <span className="avatar">{member?.name?.slice(0, 1).toUpperCase() ?? '—'}</span>
              <span className="account-trigger-copy"><strong className="truncate">{member?.name ?? 'Memuat akun…'}</strong><small className="truncate">{member?.email ?? 'JituPTN Team Platform'}</small></span>
              <svg className={`account-chevron ${accountOpen ? 'is-open' : ''}`} viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m4 6 4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            {accountOpen && <div className="account-menu" id="account-menu" aria-label="Menu akun">
              <div className="account-menu-identity"><strong className="truncate">{member?.name ?? 'Akun JituPTN Team Platform'}</strong><span className="truncate">{member?.role?.replaceAll('_', ' ') ?? 'Anggota tim'}</span></div>
              {signOutError && <p className="account-menu-error" role="alert">{signOutError}</p>}
              <button className="account-logout" type="button" disabled={signingOut} onClick={() => void signOut()}>
                <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M8 3H4.75A1.75 1.75 0 0 0 3 4.75v10.5A1.75 1.75 0 0 0 4.75 17H8m3-3 4-4-4-4m4 4H7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                <span>{signingOut ? 'Keluar…' : 'Keluar dari akun'}</span>
                {signingOut && <span className="account-logout-spinner" aria-hidden="true" />}
              </button>
            </div>}
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}
