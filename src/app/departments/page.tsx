'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DepartmentsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/workspaces');
  }, [router]);

  return (
    <div className="page-content">
      <p className="page-subtitle">Redirecting to Workspaces…</p>
    </div>
  );
}
