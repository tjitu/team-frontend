'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api, CurrentMember } from '@/lib/api';
import { BrandLogo } from '@/components/brand-logo';
import { ThemeToggle } from '@/components/theme-toggle';
import type { AgreementState } from './types';
import styles from './affiliate.module.css';

const links = [['/affiliate','Overview'],['/affiliate/referrals','My Referral Codes'],['/affiliate/boosts','Boosts'],
  ['/affiliate/earnings','Earnings'],['/affiliate/agreement','Agreement']];
export function AffiliateShell({ member,children,signOut }: { member: CurrentMember; children: React.ReactNode; signOut: () => Promise<void> }) {
  const pathname = usePathname();
  const [state,setState] = useState<AgreementState | null>(null);
  const [error,setError] = useState('');
  useEffect(() => {
    let active = true;
    api.get<AgreementState>('/team/affiliate/me/agreement',{ force: true }).then(value => {
      if (!active) return;
      setState(value);
      if (value.required && pathname !== '/affiliate/agreement') window.location.replace('/affiliate/agreement');
      else if (!pathname.startsWith('/affiliate')) window.location.replace(value.required ? '/affiliate/agreement' : '/affiliate');
    }).catch(cause => { if (active) setError(cause instanceof Error ? cause.message : 'Agreement status unavailable.'); });
    return () => { active = false; };
  },[pathname]);
  const allowed = pathname.startsWith('/affiliate') && (pathname==='/affiliate/agreement' || state?.required===false);
  return <div className="workspace" data-variant="inset">
    <aside className={`sidebar ${styles.sidebar}`} aria-label="Affiliate navigation">
      <div className="sidebar-header"><Link href="/affiliate" aria-label="JITU Affiliate home"><BrandLogo size={28} /></Link></div>
      <div className="sidebar-content"><div className="sidebar-label">Affiliate Program</div><nav className="primary-nav">
        {links.map(([href,label]) => <Link key={href} href={href} className={`nav-link ${pathname===href ? 'is-active' : ''}`} aria-current={pathname===href ? 'page' : undefined}>{label}</Link>)}
      </nav></div>
      <div className={styles.sidebarBottom}><span>{member.name}</span><span className={styles.muted}>{member.email}</span>
        <button className="button button-secondary" onClick={() => void signOut()}>Log out</button></div>
    </aside>
    <main className={`main-area ${styles.main}`} id="main-content">
      <header className={styles.header}><span>JITU Affiliate Program</span><div className={styles.actions}><ThemeToggle /><button className="button button-secondary" onClick={() => void signOut()}>Log out</button></div></header>
      <div className="page-content">
        <nav className={styles.nav} aria-label="Affiliate pages">{links.map(([href,label]) => <Link className={`button ${pathname===href ? 'button-primary' : 'button-secondary'}`} href={href} key={href}>{label}</Link>)}</nav>
        {state?.required && <p className={styles.alert} role="status">Agreement perlu disetujui sebelum menggunakan fitur afiliasi.</p>}
        {state?.upcoming.map(agreement => <p className={styles.alert} key={agreement.id}>Agreement v{agreement.version} akan berlaku pada {new Date(agreement.effectiveAt!).toLocaleDateString('id-ID',{ timeZone: 'Asia/Jakarta' })}. {agreement.summary}</p>)}
        {error ? <p className="inline-message error" role="alert">{error}</p> : allowed ? children : <p role="status">Memeriksa akses afiliasi…</p>}
      </div>
    </main>
  </div>;
}
