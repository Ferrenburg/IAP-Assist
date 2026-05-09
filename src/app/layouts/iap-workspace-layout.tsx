'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from '../components/sidebar';
import { WorkspaceHeader } from '../components/workspace-header';
import { useTheme } from '../../contexts/theme-context';

export function IAPWorkspaceLayout({
  fullHeight,
  children,
}: {
  fullHeight?: boolean;
  children: ReactNode;
}) {
  const pathname = usePathname() ?? '';
  const { resolvedTheme } = useTheme();
  const showSidebar = pathname.includes('/iap/');

  // The workspace header and sidebar are always dark. When the sidebar is
  // visible (IAP form pages), lock the main area to the same dark background
  // so text colors like text-white and text-slate-300 stay readable regardless
  // of the user's light/dark theme preference.
  const mainBg = showSidebar
    ? 'bg-slate-900'
    : resolvedTheme === 'light'
    ? 'bg-slate-100'
    : 'bg-slate-800';

  return (
    <div className={`h-screen flex flex-col ${mainBg}`}>
      <WorkspaceHeader />
      <div className="flex-1 flex overflow-hidden">
        {showSidebar && <Sidebar />}
        <main className={fullHeight ? `flex-1 overflow-hidden ${mainBg}` : `flex-1 overflow-y-auto p-6 ${mainBg}`}>
          {fullHeight ? children : <div className="max-w-6xl mx-auto">{children}</div>}
        </main>
      </div>
    </div>
  );
}
