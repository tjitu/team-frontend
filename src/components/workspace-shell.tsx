'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api, CurrentMember, Project, signInUrl } from '@/lib/api';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

export function WorkspaceShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isInvitationRoute = pathname.startsWith('/invitations/accept');
  const isLoginRoute = pathname === '/login';
  const [member, setMember] = useState<CurrentMember | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadError, setLoadError] = useState('');

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

  if (isInvitationRoute || isLoginRoute) return <main className={isLoginRoute ? 'auth-page' : 'invitation-shell'}>{children}</main>;

  async function signOut() {
    try {
      await createSupabaseBrowserClient().auth.signOut();
    } finally {
      window.location.assign('/login');
    }
  }

  return (
    <div className="workspace">
      <aside className="sidebar" aria-label="Navigasi utama">
        <Link className="brand" href="/" aria-label="Team Platform, beranda">
          <span className="brand-mark">T</span>
          <span>Team Platform</span>
        </Link>
        <div className="sidebar-label">Ruang kerja</div>
        <nav className="primary-nav">
          <Link className={`nav-link ${pathname === '/' ? 'is-active' : ''}`} href="/">
            <span className="nav-icon" aria-hidden="true">⌂</span>Ikhtisar
          </Link>
          {member && (member.role === 'SYSTEM_OWNER' || member.role === 'SYSTEM_ADMIN') && <Link className={`nav-link ${pathname.startsWith('/team') ? 'is-active' : ''}`} href="/team">
            <span className="nav-icon" aria-hidden="true">T</span>Anggota tim
          </Link>}
          {member && (member.role === 'SYSTEM_OWNER' || member.role === 'SYSTEM_ADMIN') && <Link className={`nav-link ${pathname === '/activity' ? 'is-active' : ''}`} href="/activity">
            <span className="nav-icon" aria-hidden="true">A</span>Aktivitas tim
          </Link>}
          {member && <Link className={`nav-link ${pathname.startsWith('/departments') ? 'is-active' : ''}`} href="/departments">
            <span className="nav-icon" aria-hidden="true">D</span>Departemen
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
          <div className="breadcrumb"><span>Team Platform</span><span className="breadcrumb-separator">/</span><span>{pathname === '/' ? 'Ikhtisar' : 'Ruang kerja'}</span></div>
          <div className="topbar-profile">
            <span className="profile-email">{member?.email ?? ''}</span>
            <button className="button button-quiet sign-out-button" onClick={() => void signOut()}>Keluar</button>
            <div className="avatar">{member?.name?.slice(0, 1).toUpperCase() ?? '—'}</div>
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}
