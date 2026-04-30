'use client';

import { ReactNode } from 'react';
import { AuthGate } from '@/app/_components/auth-gate';
import { IAPWorkspaceLayout } from '@/app/layouts/iap-workspace-layout';

export default function IAPPeriodLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGate>
      <IAPWorkspaceLayout>{children}</IAPWorkspaceLayout>
    </AuthGate>
  );
}
