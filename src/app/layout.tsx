import type { Metadata } from 'next';
import { WorkspaceShell } from '@/components/workspace-shell';
import './globals.css';

export const metadata: Metadata = {
  title: 'Overview - JituPTN Team',
  description: 'A workspace for team projects and tasks.',
  icons: {
    icon: '/black-jitu-logo.png',
    shortcut: '/black-jitu-logo.png',
    apple: '/black-jitu-logo.png',
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <WorkspaceShell>{children}</WorkspaceShell>
      </body>
    </html>
  );
}
