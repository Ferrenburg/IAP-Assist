'use client';

import { ReactNode } from 'react';
import { AuthGate } from '@/app/_components/auth-gate';
import { IAPWorkspaceLayout } from '@/app/layouts/iap-workspace-layout';
import { OpPeriodProvider } from '@/contexts/op-period-context';

export default function IAPPeriodLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGate>
      <OpPeriodProvider>
        <IAPWorkspaceLayout>{children}</IAPWorkspaceLayout>
      </OpPeriodProvider>
    </AuthGate>
  );
}
