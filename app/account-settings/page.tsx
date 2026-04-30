'use client';

import { AccountSettings } from '@/app/pages/account-settings';
import { AuthGate } from '@/app/_components/auth-gate';

export default function AccountSettingsPage() {
  return (
    <AuthGate>
      <AccountSettings />
    </AuthGate>
  );
}
