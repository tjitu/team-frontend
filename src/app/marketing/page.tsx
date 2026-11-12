'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api, Project } from '@/lib/api';

export default function MarketingRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    let active = true;
    async function redirectToSheetProject() {
      try {
        const projects = await api.get<Project[]>('/team/projects');
        const sheetProject = projects.find((project) => project.hasPartnershipSheet);
        if (!active) return;
        if (sheetProject) {
          router.replace(`/projects/${encodeURIComponent(sheetProject.id)}?view=partnerships`);
          return;
        }
        const marketingProject = projects.find((project) => project.department?.slug === 'marketing');
        if (marketingProject) {
          router.replace(`/workspaces/marketing`);
          return;
        }
      } catch {
        // Fallback below
      }
      if (active) {
        router.replace('/workspaces/marketing');
      }
    }
    void redirectToSheetProject();
    return () => {
      active = false;
    };
  }, [router]);

  return (
    <div className="page-content">
      <p className="page-subtitle">Redirecting to Community &amp; Partnership workspace…</p>
    </div>
  );
}
