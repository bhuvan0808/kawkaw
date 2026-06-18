'use client';

import { AppShell } from '@/components/layout/AppShell';
import { CenterSpinner } from '@/components/ui/primitives';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';

/** Guards every console route: staff-only, else bounce to /login. */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { ready, isAuthenticated, isStaff } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    if (!isAuthenticated || !isStaff) router.replace('/login');
  }, [ready, isAuthenticated, isStaff, router]);

  if (!ready || !isAuthenticated || !isStaff) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <CenterSpinner label="Loading console…" />
      </div>
    );
  }

  return <AppShell>{children}</AppShell>;
}
