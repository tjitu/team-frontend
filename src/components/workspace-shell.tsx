'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api, CurrentMember, Project, signInUrl } from '@/lib/api';

export function WorkspaceShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isInvitationRoute = pathname.startsWith('/invitations/accept');
  const [member, setMember] = useState<CurrentMember | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    if (isInvitationRoute) return;
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
  }, [isInvitationRoute]);

  if (isInvitationRoute) return <main className="invitation-shell">{children}</main>;

  return (
    <div className="workspace">
      <aside className="sidebar" aria-label="Navigasi utama">
        <Link className="brand" href="/" aria-label="Team Platform, beranda">
          <span className="brand-mark">T</span>
          <span>Team Platform</span>
        </Link>
        <div className="sidebar-label">Workspace</div>
        <nav className="primary-nav">
          <Link className={`nav-link ${pathname === '/' ? 'is-active' : ''}`} href="/">
            <span className="nav-icon" aria-hidden="true">⌂</span>Ringkasan
          </Link>
          {member && (member.role === 'SYSTEM_OWNER' || member.role === 'SYSTEM_ADMIN') && <Link className={`nav-link ${pathname.startsWith('/team') ? 'is-active' : ''}`} href="/team">
            <span className="nav-icon" aria-hidden="true">T</span>Anggota tim
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
          {projects.length === 0 && !loadError && <p className="sidebar-empty">Belum ada proyek</p>}
        </nav>
        <div className="sidebar-footer">
          <div className="avatar avatar-small">{member?.name?.slice(0, 1).toUpperCase() ?? '—'}</div>
          <div className="profile-copy">
            <strong className="truncate">{member?.name ?? 'Memuat profil'}</strong>
            <span className="truncate">{member?.role?.replaceAll('_', ' ') ?? 'Team member'}</span>
          </div>
        </div>
      </aside>
      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumb"><span>Team Platform</span><span className="breadcrumb-separator">/</span><span>{pathname === '/' ? 'Ringkasan' : 'Workspace'}</span></div>
          <div className="topbar-profile">
            <span className="profile-email">{member?.email ?? ''}</span>
            <div className="avatar">{member?.name?.slice(0, 1).toUpperCase() ?? '—'}</div>
          </div>
        </header>
        {loadError && <div className="global-notice" role="status">{loadError}</div>}
        {children}
      </main>
    </div>
  );
}
