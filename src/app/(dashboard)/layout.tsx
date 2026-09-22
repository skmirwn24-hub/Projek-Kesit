import React from 'react';
import { getCurrentUser } from '@/server/services/auth.service';
import { AuthProvider } from '@/hooks/use-auth';
import { ToastProvider } from '@/components/ui/toast';
import { SWRProvider } from '@/components/providers/swr-provider';
import { DashboardShell } from '@/components/layout/dashboard-shell';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile } = await getCurrentUser();

  return (
    <AuthProvider initialProfile={profile} initialUser={user}>
      <SWRProvider>
        <ToastProvider>
          <DashboardShell>{children}</DashboardShell>
        </ToastProvider>
      </SWRProvider>
    </AuthProvider>
  );
}

