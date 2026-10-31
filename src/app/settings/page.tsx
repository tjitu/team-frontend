'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  SlidersHorizontal,
  Key,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Shield,
  Layers,
  Sun,
  Moon,
  Eye,
  EyeOff,
  RefreshCw,
  LogOut,
  Users,
} from 'lucide-react';
import { api, CurrentMember, signInUrl } from '@/lib/api';
import { Avatar, AvatarImage, AvatarFallback, AvatarBadge } from '@/components/ui/avatar';
import { getCartoonAvatarUrl } from '@/lib/avatar';

type VercelConfigStatus = {
  configured: boolean;
  hasToken: boolean;
  tokenMasked: string | null;
  projectId: string;
  teamId: string;
};

export default function SettingsPage() {
  const [member, setMember] = useState<CurrentMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Vercel config state
  const [vercelStatus, setVercelStatus] = useState<VercelConfigStatus | null>(null);
  const [tokenInput, setTokenInput] = useState('');
  const [projectIdInput, setProjectIdInput] = useState('');
  const [teamIdInput, setTeamIdInput] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    visitors?: number;
    workingScope?: string;
  } | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);

  // Appearance
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([
      api.get<CurrentMember>('/team/me'),
      api.get<VercelConfigStatus>('/team/control-center/vercel-config').catch(() => null),
    ])
      .then(([currentMember, cfg]) => {
        if (!active) return;
        setMember(currentMember);
        if (cfg) {
          setVercelStatus(cfg);
          setProjectIdInput(cfg.projectId || '');
          setTeamIdInput(cfg.teamId || '');
        }
        setLoading(false);
      })
      .catch((err: Error) => {
        if (!active) return;
        if (err.message === 'SESSION_EXPIRED') {
          window.location.assign(signInUrl());
          return;
        }
        setError(err.message);
        setLoading(false);
      });

    const isDark = document.documentElement.classList.contains('dark');
    setDarkMode(isDark);

    return () => {
      active = false;
    };
  }, []);

  function toggleTheme() {
    const nextDark = !darkMode;
    document.documentElement.classList.toggle('dark', nextDark);
    window.localStorage.setItem('jitu-team-theme', nextDark ? 'dark' : 'light');
    setDarkMode(nextDark);
  }

  async function handleTestAndSave(e: React.FormEvent) {
    e.preventDefault();
    setTesting(true);
    setTestResult(null);
    try {
      const res = await api.post<{
        success: boolean;
        message: string;
        visitors?: number;
        workingScope?: string;
      }>('/team/control-center/vercel-config', {
        token: tokenInput.trim() || undefined,
        projectId: projectIdInput.trim(),
        teamId: teamIdInput.trim() || undefined,
      });
      setTestResult(res);
      if (res.success) {
        // Refresh status
        const updated = await api.get<VercelConfigStatus>('/team/control-center/vercel-config').catch(() => null);
        if (updated) setVercelStatus(updated);
        setTokenInput('');
      }
    } catch (err: unknown) {
      setTestResult({
        success: false,
        message: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setTesting(false);
    }
  }

  async function handleDisconnect() {
    if (!confirm('Are you sure you want to disconnect Vercel Web Analytics? Platform metrics will fallback to database sessions.')) {
      return;
    }
    setDisconnecting(true);
    setTestResult(null);
    try {
      await api.post('/team/control-center/vercel-disconnect', {});

      setVercelStatus({
        configured: false,
        hasToken: false,
        tokenMasked: null,
        projectId: '',
        teamId: '',
      });
      setProjectIdInput('');
      setTeamIdInput('');
      setTokenInput('');
      setTestResult({
        success: true,
        message: 'Vercel Web Analytics disconnected successfully.',
      });
    } catch (err: unknown) {
      setTestResult({
        success: false,
        message: err instanceof Error ? err.message : 'Failed to disconnect.',
      });
    } finally {
      setDisconnecting(false);
    }
  }

  const isOwnerOrAdmin = member?.role === 'SYSTEM_OWNER' || member?.role === 'SYSTEM_ADMIN';

  return (
    <div className="page-content settings-page">
      <div className="page-heading">
        <div>
          <h1>Settings</h1>
          <p>Manage workspace configuration, integrations, and preferences.</p>
        </div>
      </div>

      {error && (
        <div className="feedback feedback-error mb-6" role="alert">
          {error}
        </div>
      )}

      <div className="settings-grid">
        {/* SECTION 1: VERCEL WEB ANALYTICS INTEGRATION */}
        <section className="overview-card settings-card" aria-labelledby="vercel-integration-heading">
          <div className="overview-card-header">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Layers className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
                <h2 id="vercel-integration-heading">Vercel Web Analytics API</h2>
              </div>
              <p>
                Connect JituPTN to your Vercel Web Analytics REST API to feed live visitor traffic, page views, and user demographics.
              </p>
            </div>
            <div>
              {vercelStatus?.configured ? (
                <span className="source-pill is-vercel">
                  ● Connected to Vercel
                </span>
              ) : (
                <span className="source-pill">
                  ○ Not Connected
                </span>
              )}
            </div>
          </div>

          <div className="settings-card-body">
            {/* Current Configuration Summary */}
            <div className="settings-status-box">
              <div className="settings-status-row">
                <span className="settings-status-label">Integration Status:</span>
                <span className="settings-status-value">
                  {vercelStatus?.configured ? (
                    <span className="text-emerald-500 font-medium inline-flex items-center gap-1.5">
                      <span className="live-status-dot" style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }} />
                      Active (Streaming Live Web Analytics)
                    </span>
                  ) : (
                    <span className="text-muted-foreground inline-flex items-center gap-1.5">
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#71717a', display: 'inline-block' }} />
                      Offline (Falling back to internal PostgreSQL sessions)
                    </span>
                  )}
                </span>
              </div>

              {vercelStatus?.configured && (
                <>
                  <div className="settings-status-row">
                    <span className="settings-status-label">Active Project ID:</span>
                    <code className="settings-code-val">{vercelStatus.projectId}</code>
                  </div>
                  <div className="settings-status-row">
                    <span className="settings-status-label">Target Scope / Team ID:</span>
                    <span className="settings-status-value">
                      {vercelStatus.teamId ? (
                        <code className="settings-code-val">{vercelStatus.teamId}</code>
                      ) : (
                        <span className="text-muted-foreground">Personal Account (Default Scope)</span>
                      )}
                    </span>
                  </div>
                  <div className="settings-status-row">
                    <span className="settings-status-label">Stored Access Token:</span>
                    <code className="settings-code-val">{vercelStatus.tokenMasked ?? '••••••••'}</code>
                  </div>
                </>
              )}
            </div>

            {testResult && (
              <div
                className={`feedback ${testResult.success ? 'feedback-success' : 'feedback-error'} my-4`}
                role="alert"
                style={{ padding: '12px 16px', borderRadius: '8px', fontSize: '13px', lineHeight: '1.5' }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  {testResult.success ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <strong>{testResult.success ? 'Connection Successful!' : 'Connection Failed'}</strong>
                    <p style={{ margin: '4px 0 0' }}>{testResult.message}</p>
                    {testResult.workingScope && (
                      <p style={{ margin: '4px 0 0', opacity: 0.85 }}>Scope Verified: {testResult.workingScope}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {isOwnerOrAdmin ? (
              <form onSubmit={handleTestAndSave} className="settings-form">
                <div className="form-group">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label htmlFor="vercel-token-input">
                      Vercel Access Token
                      {!vercelStatus?.hasToken && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    {vercelStatus?.hasToken && (
                      <span className="text-emerald-500 font-medium" style={{ fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <span className="live-status-dot" style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }} />
                        Saved Permanently
                      </span>
                    )}
                  </div>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input
                      id="vercel-token-input"
                      type={showToken ? 'text' : 'password'}
                      className="input-text"
                      placeholder={vercelStatus?.hasToken ? '•••••••••••••••• (Stored permanently. Leave blank to keep)' : 'e.g. vcp_... or vca_...'}
                      value={tokenInput}
                      onChange={(e) => setTokenInput(e.target.value)}
                      style={{ paddingRight: '40px', fontFamily: 'monospace' }}
                      autoComplete="off"
                    />
                    <button
                      type="button"
                      className="button button-quiet"
                      style={{ position: 'absolute', right: '6px', padding: '4px 8px' }}
                      onClick={() => setShowToken(!showToken)}
                      title={showToken ? 'Hide token' : 'Show token'}
                      tabIndex={-1}
                    >
                      {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <small className="form-help">
                    {vercelStatus?.hasToken
                      ? 'Your Vercel token is saved permanently in backend configuration. You only need to type here if you wish to overwrite it with a new token.'
                      : (
                        <>
                          Generate an access token in your Vercel Dashboard at{' '}
                          <a
                            href="https://vercel.com/account/tokens"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 underline text-muted-foreground hover:text-foreground"
                          >
                            Account Settings &gt; Tokens
                            <ExternalLink className="w-3 h-3" />
                          </a>
                          . Ensure it has read permissions for Web Analytics.
                        </>
                      )}
                  </small>
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label htmlFor="vercel-project-input">
                      Vercel Project ID
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input
                      id="vercel-project-input"
                      type="text"
                      className="input-text"
                      placeholder="e.g. prj_1234567890abcdef"
                      value={projectIdInput}
                      onChange={(e) => setProjectIdInput(e.target.value)}
                      required
                    />
                    <small className="form-help">
                      Found in your Vercel Project Settings &gt; General &gt; Project ID.
                    </small>
                  </div>

                  <div className="form-group">
                    <label htmlFor="vercel-team-input">
                      Team ID or Slug <span className="text-muted-foreground font-normal">(Optional)</span>
                    </label>
                    <input
                      id="vercel-team-input"
                      type="text"
                      className="input-text"
                      placeholder="team_... (Leave blank for personal Hobby account)"
                      value={teamIdInput}
                      onChange={(e) => setTeamIdInput(e.target.value)}
                    />
                    <small className="form-help">
                      <strong>Personal accounts must leave this empty</strong>. If this project belongs to a team, provide the Team ID.
                    </small>
                  </div>
                </div>

                <div className="callout callout-info mb-4" style={{ padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--card-subtle)', fontSize: '13px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <Shield className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <p style={{ margin: 0, color: 'var(--muted-fg)' }}>
                      <strong>Persistent Storage Active:</strong> Your Vercel Web Analytics credentials are automatically saved to persistent server storage (<code>vercel-analytics-config.json</code> and <code>.env</code>). You never need to re-enter them across sessions or page refreshes.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <button
                    type="submit"
                    className="button button-primary"
                    disabled={testing || (!tokenInput && !vercelStatus?.hasToken) || !projectIdInput}
                  >
                    {testing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Testing Connection…
                      </>
                    ) : vercelStatus?.configured ? (
                      'Save & Re-verify Connection'
                    ) : (
                      'Test & Save Credentials'
                    )}
                  </button>

                  {vercelStatus?.configured && (
                    <button
                      type="button"
                      className="button button-quiet danger-action"
                      onClick={() => void handleDisconnect()}
                      disabled={disconnecting}
                    >
                      {disconnecting ? 'Disconnecting…' : 'Disconnect Vercel'}
                    </button>
                  )}

                  <Link href="/" className="button button-quiet">
                    Back to Overview
                  </Link>
                </div>
              </form>
            ) : (
              <div className="callout callout-warning">
                <p>
                  Only <strong>System Owners</strong> and <strong>System Admins</strong> have permission to modify external analytics API integrations.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* SECTION 2: APPEARANCE & WORKSPACE PREFERENCES */}
        <section className="overview-card settings-card" aria-labelledby="appearance-heading">
          <div className="overview-card-header">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sun className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
                <h2 id="appearance-heading">Appearance & Interface</h2>
              </div>
              <p>Customize the look and feel of the JituPTN Team workspace.</p>
            </div>
          </div>

          <div className="settings-card-body">
            <div className="settings-preference-row">
              <div>
                <strong>Color Theme</strong>
                <p className="text-muted-foreground text-sm">
                  Toggle between dark mode and light mode interface.
                </p>
              </div>
              <button
                type="button"
                className="button button-quiet"
                onClick={toggleTheme}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                <span>{darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}</span>
              </button>
            </div>
          </div>
        </section>

        {/* SECTION 3: CURRENT ACCOUNT PROFILE */}
        <section className="overview-card settings-card" aria-labelledby="account-profile-heading">
          <div className="overview-card-header">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
                <h2 id="account-profile-heading">Member Profile</h2>
              </div>
              <p>Your current workspace credentials and platform role.</p>
            </div>
          </div>

          <div className="settings-card-body">
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '8px 0' }}>
              <Avatar size="lg" className="size-14">
                <AvatarImage src={getCartoonAvatarUrl(member?.name || member?.email || 'admin', 'open-peeps')} alt={member?.name} />
                <AvatarFallback className="text-lg">
                  {member?.name ? member.name.slice(0, 2).toUpperCase() : 'ME'}
                </AvatarFallback>
                <AvatarBadge className="bg-emerald-500 size-3 ring-2" />
              </Avatar>
              <div>
                <strong style={{ fontSize: '16px', display: 'block' }}>{member?.name ?? 'Loading…'}</strong>
                <span className="text-muted-foreground text-sm" style={{ display: 'block' }}>
                  {member?.email ?? 'member@jituptn.com'}
                </span>
                <span className="role-label" style={{ marginTop: '6px', display: 'inline-block' }}>
                  {member?.role?.replaceAll('_', ' ') ?? 'MEMBER'}
                </span>
              </div>
            </div>

            <div style={{ marginTop: '16px', borderTop: '1px solid var(--border)', paddingTop: '16px', display: 'flex', gap: '10px' }}>
              <Link href="/team" className="button button-quiet">
                View All Team Members
              </Link>
              {isOwnerOrAdmin && (
                <Link href="/control-center" className="button button-quiet">
                  Control Center
                </Link>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

