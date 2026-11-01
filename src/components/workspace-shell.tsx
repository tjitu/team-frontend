'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Users,
  Activity,
  Building2,
  SlidersHorizontal,
  Settings,
  Archive,
  PanelLeftClose,
  PanelLeft,
  ChevronDown,
  LogOut,
  Sun,
  Moon,
  Bell,
  CheckCheck,
} from 'lucide-react';
import { api, clearSessionCache, CurrentMember, Project, signInUrl } from '@/lib/api';
import { useInactivityTracker, clearSessionTracking } from '@/lib/session';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { ThemeToggle } from '@/components/theme-toggle';
import { BrandLogo } from '@/components/brand-logo';
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Avatar, AvatarImage, AvatarFallback, AvatarBadge } from '@/components/ui/avatar';
import { getCartoonAvatarUrl } from '@/lib/avatar';

export function WorkspaceShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isInvitationRoute = pathname.startsWith('/invitations/accept');
  const isLoginRoute = pathname === '/login';

  useInactivityTracker(!isInvitationRoute && !isLoginRoute);

  const [member, setMember] = useState<CurrentMember | null>(() => api.getCached<CurrentMember>('/team/me'));
  const [projects, setProjects] = useState<Project[]>(() => api.getCached<Project[]>('/team/projects') ?? []);
  const [fallbackProject, setFallbackProject] = useState<Project | null>(null);
  const [loadError, setLoadError] = useState('');
  const [accountOpen, setAccountOpen] = useState(false);
  const [breadcrumbMenuOpen, setBreadcrumbMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // Notifications
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(3);
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    title: string;
    message: string;
    time: string;
    timestamp: number;
    unread: boolean;
    link?: string;
  }>>([
    {
      id: 'notif-1',
      title: 'Task update',
      message: 'New high priority tasks need review in Standalone Tasks',
      time: '12m ago',
      timestamp: Date.now() - 12 * 60 * 1000,
      unread: true,
      link: '/tasks',
    },
    {
      id: 'notif-2',
      title: 'Project Activity',
      message: 'Townhall & UTBK Batch 1 milestones were updated',
      time: '1h ago',
      timestamp: Date.now() - 60 * 60 * 1000,
      unread: true,
      link: '/projects',
    },
    {
      id: 'notif-3',
      title: 'Security Notice',
      message: 'Session persistence active with 12h idle protection',
      time: '3h ago',
      timestamp: Date.now() - 180 * 60 * 1000,
      unread: true,
      link: '/settings',
    },
  ]);

  const accountControlRef = useRef<HTMLDivElement>(null);
  const accountTriggerRef = useRef<HTMLButtonElement>(null);
  const breadcrumbMenuRef = useRef<HTMLLIElement>(null);
  const notificationControlRef = useRef<HTMLDivElement>(null);
  const notificationBtnRef = useRef<HTMLButtonElement>(null);

  const matchedProject = projects.find((project) => pathname.startsWith(`/projects/${project.id}`));
  const activeProject = matchedProject ?? (fallbackProject && pathname.startsWith(`/projects/${fallbackProject.id}`) ? fallbackProject : undefined);
  const isProjectActivityRoute = Boolean(activeProject && pathname.endsWith('/activity')) || /^\/projects\/[^/]+\/activity$/.test(pathname);
  const isNestedProjectRoute = Boolean(activeProject) || pathname === '/projects/archived' || (pathname.startsWith('/projects/') && pathname !== '/projects');

  const pageLabel = pathname === '/' ? 'Overview'
    : pathname === '/projects' ? 'Projects'
    : pathname === '/projects/archived' ? 'Archived projects'
    : pathname === '/tasks' ? 'Tasks'
    : pathname === '/control-center' ? 'Control Center'
    : pathname === '/settings' ? 'Settings'
    : pathname.startsWith('/team') ? 'Team members'
      : pathname === '/activity' ? 'Team activity'
        : pathname.startsWith('/departments') ? 'Departments'
          : isProjectActivityRoute ? 'Project activity'
            : activeProject?.name ?? (pathname.startsWith('/projects/') ? 'Project' : 'Overview');

  // Dynamically update document.title based on the current page
  useEffect(() => {
    const suffix = 'JituPTN Team';
    if (isLoginRoute) {
      document.title = `Sign In - ${suffix}`;
      return;
    }
    if (isInvitationRoute) {
      document.title = `Accept Invitation - ${suffix}`;
      return;
    }
    if (isProjectActivityRoute && activeProject) {
      document.title = `Activity - ${activeProject.name} - ${suffix}`;
      return;
    }
    document.title = `${pageLabel} - ${suffix}`;
  }, [pathname, pageLabel, activeProject, isLoginRoute, isInvitationRoute, isProjectActivityRoute]);

  // Fetch project metadata if visiting an archived/direct project route not in the active sidebar list
  useEffect(() => {
    if (isInvitationRoute || isLoginRoute) return;
    const match = pathname.match(/^\/projects\/([^/]+)/);
    const routeProjectId = match?.[1];
    if (!routeProjectId || routeProjectId === 'archived' || matchedProject) {
      return;
    }
    let active = true;
    api.get<Project>(`/team/projects/${routeProjectId}`)
      .then((proj) => {
        if (active) setFallbackProject(proj);
      })
      .catch(() => {
        if (active) setFallbackProject(null);
      });
    return () => { active = false; };
  }, [pathname, matchedProject, isInvitationRoute, isLoginRoute]);

  // Load theme and sidebar preferences
  useEffect(() => {
    const savedTheme = window.localStorage.getItem('jitu-team-theme');
    const shouldUseDarkMode = savedTheme === 'dark';
    document.documentElement.classList.toggle('dark', shouldUseDarkMode);
    setDarkMode(shouldUseDarkMode);

    const savedSidebar = window.localStorage.getItem('jitu-team-sidebar-collapsed');
    if (savedSidebar !== null) {
      setIsCollapsed(savedSidebar === 'true');
    }
  }, []);

  function toggleQuickTheme() {
    const nextDark = !darkMode;
    document.documentElement.classList.toggle('dark', nextDark);
    window.localStorage.setItem('jitu-team-theme', nextDark ? 'dark' : 'light');
    setDarkMode(nextDark);
  }

  // Global Ctrl+B shortcut to toggle sidebar
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable)) {
        return;
      }
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
    setBreadcrumbMenuOpen(false);
  }, [pathname]);

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

  // Load notification read timestamp
  useEffect(() => {
    try {
      const readAtStr = window.localStorage.getItem('jitu-team-notifications-read-at');
      if (readAtStr) {
        const readAt = Number(readAtStr);
        setNotifications((prev) =>
          prev.map((item) => ({ ...item, unread: item.timestamp > readAt }))
        );
        setUnreadCount((prev) => {
          const unread = notifications.filter((item) => item.timestamp > readAt).length;
          return unread;
        });
      }
    } catch {
      // ignore
    }
  }, []);

  const markNotificationsRead = () => {
    try {
      window.localStorage.setItem('jitu-team-notifications-read-at', String(Date.now()));
    } catch {
      // ignore
    }
    setUnreadCount(0);
    setNotifications((prev) => prev.map((item) => ({ ...item, unread: false })));
  };

  useEffect(() => {
    if (!accountOpen && !breadcrumbMenuOpen && !notificationOpen) return;
    function closeOnOutsideClick(event: PointerEvent) {
      if (event.target instanceof Node) {
        if (accountOpen && !accountControlRef.current?.contains(event.target)) {
          setAccountOpen(false);
        }
        if (breadcrumbMenuOpen && !breadcrumbMenuRef.current?.contains(event.target)) {
          setBreadcrumbMenuOpen(false);
        }
        if (notificationOpen && !notificationControlRef.current?.contains(event.target)) {
          setNotificationOpen(false);
        }
      }
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        if (accountOpen) {
          setAccountOpen(false);
          accountTriggerRef.current?.focus();
        }
        if (breadcrumbMenuOpen) {
          setBreadcrumbMenuOpen(false);
        }
        if (notificationOpen) {
          setNotificationOpen(false);
          notificationBtnRef.current?.focus();
        }
      }
    }
    document.addEventListener('pointerdown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [accountOpen, breadcrumbMenuOpen, notificationOpen]);

  if (isInvitationRoute || isLoginRoute) {
    return <main className={isLoginRoute ? 'auth-page' : 'invitation-shell'}>{children}</main>;
  }

  async function signOut() {
    if (signingOut) return;
    setSigningOut(true);
    setSignOutError('');
    try {
      clearSessionTracking();
      clearSessionCache();
      api.invalidate();
      const { error } = await createSupabaseBrowserClient().auth.signOut();
      if (error) throw error;
      window.location.replace('/login');
    } catch {
      setSignOutError('Could not sign out. Check your connection and try again.');
      setSigningOut(false);
    }
  }

  return (
    <div className="workspace" data-variant="inset">
      <a className="skip-link" href="#main-content">Skip to main content</a>
      
      {/* SIDEBAR */}
      <aside className={`sidebar ${isCollapsed ? 'is-collapsed' : ''}`} aria-label="Main navigation">
        <div className="sidebar-header">
          {!isCollapsed && (
            <Link className="brand-mark-link" href="/" aria-label="Jitu Team Home" title="JituPTN Team Platform">
              <BrandLogo size={28} />
            </Link>
          )}
          <button
            type="button"
            className="sidebar-collapse-btn"
            onClick={() => toggleSidebar()}
            title={isCollapsed ? 'Expand sidebar (Ctrl+B)' : 'Close sidebar (Ctrl+B)'}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Close sidebar'}
          >
            {isCollapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>
        </div>

        <div className="sidebar-content">
          <div className="sidebar-label">Dashboards</div>
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

          <Link
            className={`nav-link ${pathname === '/projects' ? 'is-active' : ''}`}
            href="/projects"
            title="Projects"
            aria-current={pathname === '/projects' ? 'page' : undefined}
          >
            <FolderKanban className="nav-icon" />
            <span className="nav-link-text">Projects</span>
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
              <span className="nav-link-text">Activity</span>
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

          <Link
            className={`nav-link ${pathname === '/settings' ? 'is-active' : ''}`}
            href="/settings"
            title="Settings"
            aria-current={pathname === '/settings' ? 'page' : undefined}
          >
            <Settings className="nav-icon" />
            <span className="nav-link-text">Settings</span>
          </Link>
        </nav>

        <div className="sidebar-section-heading">
          <span className="nav-link-text">Projects</span>
          <span className="count-pill">{projects.length}</span>
        </div>

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
          <Link
            className={`nav-link archived-project-nav ${pathname === '/projects/archived' ? 'is-active' : ''}`}
            href="/projects/archived"
            title="Archived projects"
            aria-current={pathname === '/projects/archived' ? 'page' : undefined}
          >
            <Archive className="nav-icon" />
            <span className="nav-link-text">Archived</span>
          </Link>
        </nav>
        </div>

        <div className="sidebar-footer" title={member ? `${member.name} (${member.role?.replaceAll('_', ' ')})` : undefined}>
          <Avatar size="sm" className="size-8" seed={member?.name || member?.email || 'admin'} styleType="open-peeps">
            <AvatarBadge className="bg-emerald-500" />
          </Avatar>
          <div className="profile-copy">
            <strong className="truncate">{member?.name ?? 'Loading account…'}</strong>
            <span className="truncate">{member?.email ?? 'Team member'}</span>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA (SHADCN INSET CONTAINER) */}
      <main className={`main-area ${isCollapsed ? 'is-collapsed' : ''}`} id="main-content" tabIndex={-1}>
        <header className="topbar">
          <div className="topbar-left">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink render={<Link href="/" />}>Workspace</BreadcrumbLink>
                </BreadcrumbItem>

                {isProjectActivityRoute && activeProject ? (
                  <>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbLink render={<Link href="/projects" />}>Projects</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbLink render={<Link href={`/projects/${activeProject.id}`} />}>
                        {activeProject.name}
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage>Activity</BreadcrumbPage>
                    </BreadcrumbItem>
                  </>
                ) : activeProject ? (
                  <>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbLink render={<Link href="/projects" />}>Projects</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage>{activeProject.name}</BreadcrumbPage>
                    </BreadcrumbItem>
                  </>
                ) : pathname === '/projects/archived' ? (
                  <>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbLink render={<Link href="/projects" />}>Projects</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage>Archived</BreadcrumbPage>
                    </BreadcrumbItem>
                  </>
                ) : (
                  <>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage>{pageLabel}</BreadcrumbPage>
                    </BreadcrumbItem>
                  </>
                )}
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <div className="topbar-right">
            {/* Notification Bell Dropdown */}
            <div className="notification-control" ref={notificationControlRef}>
              <button
                ref={notificationBtnRef}
                type="button"
                className="topbar-icon-btn notification-btn"
                onClick={() => {
                  setNotificationOpen((prev) => !prev);
                  if (!notificationOpen && unreadCount > 0) {
                    markNotificationsRead();
                  }
                }}
                title="Notifications"
                aria-label="Notifications"
                aria-expanded={notificationOpen}
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="notification-badge-dot" aria-label={`${unreadCount} unread notifications`}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {notificationOpen && (
                <div className="notification-popover" role="dialog" aria-label="Notifications">
                  <div className="notification-header">
                    <div className="notification-title-wrap">
                      <strong>Notifications</strong>
                      {unreadCount > 0 && (
                        <span className="notification-pill-count">{unreadCount} new</span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        className="notification-mark-all"
                        onClick={markNotificationsRead}
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <div className="notification-list">
                    {notifications.length === 0 ? (
                      <div className="notification-empty">
                        <CheckCheck className="w-5 h-5 text-[var(--muted-fg)]" />
                        <span>All caught up! No new notifications.</span>
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <Link
                          key={n.id}
                          href={n.link || '/activity'}
                          className={`notification-item ${n.unread ? 'is-unread' : ''}`}
                          onClick={() => setNotificationOpen(false)}
                        >
                          <div className="notification-item-icon">
                            <Activity className="w-3.5 h-3.5" />
                          </div>
                          <div className="notification-item-content">
                            <p className="notification-item-text">{n.message}</p>
                            <span className="notification-item-time">{n.time}</span>
                          </div>
                          {n.unread && <span className="notification-unread-indicator" />}
                        </Link>
                      ))
                    )}
                  </div>
                  <div className="notification-footer">
                    <Link
                      href="/activity"
                      className="notification-view-all"
                      onClick={() => setNotificationOpen(false)}
                    >
                      View all activity →
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              className="topbar-icon-btn"
              onClick={toggleQuickTheme}
              title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <div className="topbar-divider" aria-hidden="true" />
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
                <Avatar size="sm" className="size-8" seed={member?.name || member?.email || 'admin'} styleType="open-peeps">
                  <AvatarBadge className="bg-emerald-500" />
                </Avatar>
                <span className="account-trigger-copy">
                  <strong className="truncate">{member?.name ?? 'Loading…'}</strong>
                  <small className="truncate">{member?.role?.replaceAll('_', ' ') ?? 'Member'}</small>
                </span>
                <ChevronDown className={`account-chevron ${accountOpen ? 'is-open' : ''} w-3.5 h-3.5`} aria-hidden="true" />
              </button>

              {accountOpen && (
                <div className="account-menu" id="account-menu" aria-label="Account menu">
                  <div className="account-menu-identity">
                    <strong className="truncate">{member?.name ?? 'Account'}</strong>
                    <span className="truncate">{member?.email ?? 'JituPTN Team'}</span>
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
          </div>
        </header>

        {children}
      </main>
    </div>
  );
}
