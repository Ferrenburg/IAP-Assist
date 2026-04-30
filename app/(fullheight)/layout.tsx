'use client';

import { ReactNode } from 'react';
import { AuthGate } from '@/app/_components/auth-gate';
import { IAPWorkspaceLayout } from '@/app/layouts/iap-workspace-layout';

export default function FullHeightLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGate>
      <IAPWorkspaceLayout fullHeight>{children}</IAPWorkspaceLayout>
    </AuthGate>
  );
}
