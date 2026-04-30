'use client';

import { Admin } from '@/app/pages/admin';
import { AuthGate } from '@/app/_components/auth-gate';

export default function AdminPage() {
  return (
    <AuthGate>
      <Admin />
    </AuthGate>
  );
}
