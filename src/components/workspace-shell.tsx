'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import {
  LayoutDashboard,
  CheckSquare,
  Users,
  Activity,
  Building2,
  SlidersHorizontal,
  Archive,
  PanelLeftClose,
  PanelLeft,
  ChevronDown,
  LogOut,
  FolderDot,
} from 'lucide-react';
import { api, CurrentMember, Project, signInUrl } from '@/lib/api';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { ThemeToggle } from '@/components/theme-toggle';
import { BrandLogo } from '@/components/brand-logo';

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
  const [isCollapsed, setIsCollapsed] = useState(false);

  const accountControlRef = useRef<HTMLDivElement>(null);
  const accountTriggerRef = useRef<HTMLButtonElement>(null);

  const activeProject = projects.find((project) => pathname.startsWith(`/projects/${project.id}`));
  const pageLabel = pathname === '/' ? 'Overview'
    : pathname === '/projects/archived' ? 'Archived projects'
    : pathname === '/tasks' ? 'Tasks'
    : pathname === '/control-center' ? 'Control Center'
    : pathname.startsWith('/team') ? 'Team members'
      : pathname === '/activity' ? 'Team activity'
        : pathname.startsWith('/departments') ? 'Departments'
          : pathname.endsWith('/activity') ? 'Project activity'
            : activeProject?.name ?? 'Workspace';

  // Load theme and sidebar preferences
  useEffect(() => {
    const savedTheme = window.localStorage.getItem('jitu-team-theme');
    const shouldUseDarkMode = savedTheme === 'dark';
    document.documentElement.classList.toggle('dark', shouldUseDarkMode);

    const savedSidebar = window.localStorage.getItem('jitu-team-sidebar-collapsed');
    if (savedSidebar !== null) {
      setIsCollapsed(savedSidebar === 'true');
    }
  }, []);

  // Global Ctrl+B shortcut to toggle sidebar
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'b') {
        event.preventDefault();
        toggleSidebar();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleSidebar = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      window.localStorage.setItem('jitu-team-sidebar-collapsed', String(next));
      return next;
    });
  };

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

  if (isInvitationRoute || isLoginRoute) {
    return <main className={isLoginRoute ? 'auth-page' : 'invitation-shell'}>{children}</main>;
  }

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

  return (
    <div className="workspace">
      <a className="skip-link" href="#main-content">Skip to main content</a>
      
      {/* SIDEBAR */}
      <aside className={`sidebar ${isCollapsed ? 'is-collapsed' : ''}`} aria-label="Main navigation">
        <div className="sidebar-header">
          <Link className="brand-mark-link" href="/" aria-label="Jitu Team Home" title="JituPTN Team Platform">
            <BrandLogo size={32} />
          </Link>
          {!isCollapsed && (
            <button
              type="button"
              className="sidebar-collapse-btn"
              onClick={() => toggleSidebar()}
              title="Close sidebar (Ctrl+B)"
              aria-label="Close sidebar"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="sidebar-label">Workspace</div>
        <nav className="primary-nav" aria-label="Workspace">
          <Link
            className={`nav-link ${pathname === '/' ? 'is-active' : ''}`}
            href="/"
            title="Overview"
            aria-current={pathname === '/' ? 'page' : undefined}
          >
            <LayoutDashboard className="nav-icon" />
            <span className="nav-link-text">Overview</span>
          </Link>

          {member && (
            <Link
              className={`nav-link ${pathname === '/tasks' ? 'is-active' : ''}`}
              href="/tasks"
              title="Tasks"
              aria-current={pathname === '/tasks' ? 'page' : undefined}
            >
              <CheckSquare className="nav-icon" />
              <span className="nav-link-text">Tasks</span>
            </Link>
          )}

          {member && (member.role === 'SYSTEM_OWNER' || member.role === 'SYSTEM_ADMIN') && (
            <Link
              className={`nav-link ${pathname.startsWith('/team') ? 'is-active' : ''}`}
              href="/team"
              title="Team members"
              aria-current={pathname.startsWith('/team') ? 'page' : undefined}
            >
              <Users className="nav-icon" />
              <span className="nav-link-text">Team members</span>
            </Link>
          )}

          {member && (member.role === 'SYSTEM_OWNER' || member.role === 'SYSTEM_ADMIN') && (
            <Link
              className={`nav-link ${pathname === '/activity' ? 'is-active' : ''}`}
              href="/activity"
              title="Team activity"
              aria-current={pathname === '/activity' ? 'page' : undefined}
            >
              <Activity className="nav-icon" />
              <span className="nav-link-text">Team activity</span>
            </Link>
          )}

          {member && (member.role === 'SYSTEM_OWNER' || member.role === 'SYSTEM_ADMIN') && (
            <Link
              className={`nav-link ${pathname.startsWith('/control-center') ? 'is-active' : ''}`}
              href="/control-center"
              title="Control Center"
              aria-current={pathname.startsWith('/control-center') ? 'page' : undefined}
            >
              <SlidersHorizontal className="nav-icon" />
              <span className="nav-link-text">Control Center</span>
            </Link>
          )}

          {member && (
            <Link
              className={`nav-link ${pathname.startsWith('/departments') ? 'is-active' : ''}`}
              href="/departments"
              title="Departments"
              aria-current={pathname.startsWith('/departments') ? 'page' : undefined}
            >
              <Building2 className="nav-icon" />
              <span className="nav-link-text">Departments</span>
            </Link>
          )}
        </nav>

        <div className="sidebar-section-heading">
          <span className="nav-link-text">Projects</span>
          <span className="count-pill">{projects.length}</span>
        </div>

        <Link
          className={`nav-link archived-project-nav ${pathname === '/projects/archived' ? 'is-active' : ''}`}
          href="/projects/archived"
          title="Archived projects"
          aria-current={pathname === '/projects/archived' ? 'page' : undefined}
        >
          <Archive className="nav-icon" />
          <span className="nav-link-text">Archived projects</span>
        </Link>

        <nav className="project-nav" aria-label="Projects">
          {projects.map((project) => (
            <Link
              className={`project-nav-link ${pathname.startsWith(`/projects/${project.id}`) ? 'is-active' : ''}`}
              href={`/projects/${project.id}`}
              key={project.id}
              title={project.name}
            >
              <span className="project-mark" aria-hidden="true">
                {project.name.slice(0, 1).toUpperCase()}
              </span>
              <span className="truncate">{project.name}</span>
            </Link>
          ))}
          {projects.length === 0 && !loadError && <p className="sidebar-empty">No active projects yet</p>}
        </nav>

        <div className="sidebar-footer" title={member ? `${member.name} (${member.role?.replaceAll('_', ' ')})` : undefined}>
          <div className="avatar avatar-small">{member?.name?.slice(0, 1).toUpperCase() ?? '—'}</div>
          <div className="profile-copy">
            <strong className="truncate">{member?.name ?? 'Loading account…'}</strong>
            <span className="truncate">{member?.role?.replaceAll('_', ' ') ?? 'Team member'}</span>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className={`main-area ${isCollapsed ? 'is-collapsed' : ''}`} id="main-content" tabIndex={-1}>
        <header className="topbar">
          <div className="topbar-left">
            <button
              type="button"
              className="sidebar-trigger-btn"
              onClick={toggleSidebar}
              title={isCollapsed ? 'Expand sidebar (Ctrl+B)' : 'Collapse sidebar (Ctrl+B)'}
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            </button>
            <div className="topbar-separator" aria-hidden="true" />
            <nav className="breadcrumb" aria-label="Breadcrumb">
              <Link href="/" className="breadcrumb-root">Workspace</Link>
              <span className="breadcrumb-separator">/</span>
              <span aria-current="page">{pageLabel}</span>
            </nav>
          </div>

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
              <span className="account-trigger-copy">
                <strong className="truncate">{member?.name ?? 'Loading account…'}</strong>
                <small className="truncate">{member?.email ?? 'JituPTN Team Platform'}</small>
              </span>
              <ChevronDown className={`account-chevron ${accountOpen ? 'is-open' : ''} w-3.5 h-3.5`} aria-hidden="true" />
            </button>

            {accountOpen && (
              <div className="account-menu" id="account-menu" aria-label="Account menu">
                <div className="account-menu-identity">
                  <strong className="truncate">{member?.name ?? 'JituPTN Team Platform account'}</strong>
                  <span className="truncate">{member?.role?.replaceAll('_', ' ') ?? 'Team member'}</span>
                </div>
                <ThemeToggle />
                {signOutError && <p className="account-menu-error" role="alert">{signOutError}</p>}
                <button
                  className="account-logout danger-action"
                  type="button"
                  disabled={signingOut}
                  onClick={() => void signOut()}
                >
                  <LogOut className="w-4 h-4" />
                  <span>{signingOut ? 'Signing out…' : 'Sign out'}</span>
                  {signingOut && <span className="account-logout-spinner" aria-hidden="true" />}
                </button>
              </div>
            )}
          </div>
        </header>

        {children}
      </main>
    </div>
  );
}
