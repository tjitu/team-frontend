'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { api, CurrentMember, Project, signInUrl } from '@/lib/api';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

function NavIcon({ name }: { name: 'overview' | 'tasks' | 'team' | 'activity' | 'departments' | 'archive' | 'analytics' }) {
  const paths = {
    overview: <><path d="m3 10 9-7 9 7" /><path d="M5 9v12h14V9M9 21v-7h6v7" /></>,
    tasks: <><rect x="4" y="4" width="16" height="16" rx="2" /><path d="m8 12 2.3 2.3L16 8.8M8 7h1m-1 10h8" /></>,
    team: <><circle cx="9" cy="8" r="3" /><path d="M3 20v-1a6 6 0 0 1 12 0v1M16 5.5a3 3 0 0 1 0 5.8M18 14a5 5 0 0 1 3 4.5V20" /></>,
    activity: <><path d="M3 12h4l3-8 4 16 3-8h4" /></>,
    departments: <><rect x="4" y="3" width="16" height="18" rx="1" /><path d="M9 7h2m2 0h2M9 11h2m2 0h2M9 15h2m2 0h2M10 21v-3h4v3" /></>,
    archive: <><path d="M3 4h18v4H3zM5 8v12h14V8m-9 4h4" /></>,
    analytics: <><path d="M4 19V5m0 14h17" /><path d="m7 15 4-4 3 2 5-6" /><path d="M16 7h3v3" /></>,
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
  const [darkMode, setDarkMode] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState('');
  const accountControlRef = useRef<HTMLDivElement>(null);
  const accountTriggerRef = useRef<HTMLButtonElement>(null);
  const activeProject = projects.find((project) => pathname.startsWith(`/projects/${project.id}`));
  const pageLabel = pathname === '/' ? 'Overview'
    : pathname === '/projects/archived' ? 'Archived projects'
    : pathname === '/tasks' ? 'Tasks'
    : pathname === '/control-center' ? 'Control Center'
    : pathname.startsWith('/team') ? 'Team members'
      : pathname === '/activity' ? 'Team activity'
        : pathname.startsWith('/departments') ? 'Department'
          : pathname.endsWith('/activity') ? 'Project activity'
            : activeProject?.name ?? 'Workspace';

  useEffect(() => {
    const savedTheme = window.localStorage.getItem('jitu-team-theme');
    const shouldUseDarkMode = savedTheme === 'dark';
    document.documentElement.classList.toggle('dark', shouldUseDarkMode);
    setDarkMode(shouldUseDarkMode);
  }, []);

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
      setSignOutError('Could not sign out. Check your connection and try again.');
      setSigningOut(false);
    }
  }

  function toggleTheme() {
    const nextDarkMode = !darkMode;
    document.documentElement.classList.toggle('dark', nextDarkMode);
    window.localStorage.setItem('jitu-team-theme', nextDarkMode ? 'dark' : 'light');
    setDarkMode(nextDarkMode);
  }

  return (
    <div className="workspace">
      <aside className="sidebar" aria-label="Main navigation">
        <Link className="brand" href="/" aria-label="JituPTN Team Platform home">
          <Image className="brand-logo" src="/jitu-logo.webp" alt="" width={36} height={36} />
          <span>JituPTN Team Platform</span>
        </Link>
        <div className="sidebar-label">Workspace</div>
        <nav className="primary-nav">
          <Link className={`nav-link ${pathname === '/' ? 'is-active' : ''}`} href="/">
            <NavIcon name="overview" />Overview
          </Link>
          {member && <Link className={`nav-link ${pathname === '/tasks' ? 'is-active' : ''}`} href="/tasks">
            <NavIcon name="tasks" />Tasks
          </Link>}
          {member && (member.role === 'SYSTEM_OWNER' || member.role === 'SYSTEM_ADMIN') && <Link className={`nav-link ${pathname.startsWith('/team') ? 'is-active' : ''}`} href="/team">
            <NavIcon name="team" />Team members
          </Link>}
          {member && (member.role === 'SYSTEM_OWNER' || member.role === 'SYSTEM_ADMIN') && <Link className={`nav-link ${pathname === '/activity' ? 'is-active' : ''}`} href="/activity">
            <NavIcon name="activity" />Team activity
          </Link>}
          {member && (member.role === 'SYSTEM_OWNER' || member.role === 'SYSTEM_ADMIN') && <Link className={`nav-link ${pathname.startsWith('/control-center') ? 'is-active' : ''}`} href="/control-center">
            <NavIcon name="analytics" />Control Center
          </Link>}
          {member && <Link className={`nav-link ${pathname.startsWith('/departments') ? 'is-active' : ''}`} href="/departments">
            <NavIcon name="departments" />Departments
          </Link>}
        </nav>
        <div className="sidebar-section-heading">
          <span>Project</span>
          <span className="count-pill">{projects.length}</span>
        </div>
        <Link className={`nav-link archived-project-nav ${pathname === '/projects/archived' ? 'is-active' : ''}`} href="/projects/archived">
          <NavIcon name="archive" />Archived projects
        </Link>
        <nav className="project-nav" aria-label="Project">
          {projects.map((project) => (
            <Link
              className={`project-nav-link ${pathname.startsWith(`/projects/${project.id}`) ? 'is-active' : ''}`}
              href={`/projects/${project.id}`}
              key={project.id}
              title={project.name}
            >
              <span className="project-mark" aria-hidden="true">{project.name.slice(0, 1).toUpperCase()}</span>
              <span className="truncate">{project.name}</span>
            </Link>
          ))}
          {projects.length === 0 && !loadError && <p className="sidebar-empty">No active projects yet</p>}
        </nav>
        <div className="sidebar-footer">
          <div className="avatar avatar-small">{member?.name?.slice(0, 1).toUpperCase() ?? '—'}</div>
          <div className="profile-copy">
            <strong className="truncate">{member?.name ?? 'Loading account…'}</strong>
            <span className="truncate">{member?.role?.replaceAll('_', ' ') ?? 'Team members'}</span>
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
              aria-label="Open account menu"
              aria-expanded={accountOpen}
              aria-controls="account-menu"
              onClick={() => { setSignOutError(''); setAccountOpen((open) => !open); }}
            >
              <span className="avatar">{member?.name?.slice(0, 1).toUpperCase() ?? '—'}</span>
              <span className="account-trigger-copy"><strong className="truncate">{member?.name ?? 'Loading account…'}</strong><small className="truncate">{member?.email ?? 'JituPTN Team Platform'}</small></span>
              <svg className={`account-chevron ${accountOpen ? 'is-open' : ''}`} viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m4 6 4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            {accountOpen && <div className="account-menu" id="account-menu" aria-label="Account menu">
              <div className="account-menu-identity"><strong className="truncate">{member?.name ?? 'JituPTN Team Platform account'}</strong><span className="truncate">{member?.role?.replaceAll('_', ' ') ?? 'Team member'}</span></div>
              <button className="account-theme" type="button" aria-pressed={darkMode} onClick={toggleTheme}>
                {darkMode ? (
                  <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><circle cx="10" cy="10" r="3.5" stroke="currentColor" strokeWidth="1.5" /><path d="M10 2.5v2m0 11v2m7.5-7.5h-2m-11 0h-2m12.8-5.3-1.4 1.4m-7.8 7.8-1.4 1.4m10.6 0-1.4-1.4m-7.8-7.8L5.7 5.7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                ) : (
                  <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M16.2 12.2A7 7 0 0 1 7.8 3.8a7 7 0 1 0 8.4 8.4Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg>
                )}
                <span>{darkMode ? 'Switch to light mode' : 'Switch to dark mode'}</span>
              </button>
              {signOutError && <p className="account-menu-error" role="alert">{signOutError}</p>}
              <button className="account-logout" type="button" disabled={signingOut} onClick={() => void signOut()}>
                <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M8 3H4.75A1.75 1.75 0 0 0 3 4.75v10.5A1.75 1.75 0 0 0 4.75 17H8m3-3 4-4-4-4m4 4H7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                <span>{signingOut ? 'Signing out…' : 'Sign out'}</span>
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
