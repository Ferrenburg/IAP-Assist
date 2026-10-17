'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from '../components/sidebar';
import { WorkspaceHeader } from '../components/workspace-header';

export function IAPWorkspaceLayout({
  fullHeight,
  children,
}: {
  fullHeight?: boolean;
  children: ReactNode;
}) {
  const pathname = usePathname() ?? '';
  const showSidebar = pathname.includes('/iap/');

  return (
    <div className="h-screen flex flex-col bg-background">
      <WorkspaceHeader />
      <div className="flex-1 flex overflow-hidden">
        {showSidebar && <Sidebar />}
        <main className={fullHeight ? 'flex-1 overflow-hidden' : 'flex-1 overflow-y-auto p-6'}>
          {fullHeight ? children : <div className="max-w-6xl mx-auto">{children}</div>}
        </main>
      </div>
    </div>
  );
}
