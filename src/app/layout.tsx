import type { Metadata } from 'next';
import { WorkspaceShell } from '@/components/workspace-shell';
import './globals.css';

export const metadata: Metadata = {
  title: 'JituPTN Team Platform',
  description: 'Ruang kerja proyek dan task tim.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>
        <WorkspaceShell>{children}</WorkspaceShell>
      </body>
    </html>
  );
}
