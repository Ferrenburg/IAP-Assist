'use client';

import { useAuth } from '@/contexts/auth-context';
import { Homepage } from '@/app/pages/homepage';
import { MainWorkspace } from '@/app/pages/main-workspace';

export default function HomePage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-yellow-600 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return user ? <MainWorkspace /> : <Homepage />;
}
