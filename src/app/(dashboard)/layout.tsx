import React from 'react';
import { getCurrentUser } from '@/server/services/auth.service';
import { AuthProvider } from '@/hooks/use-auth';
import { Sidebar } from '@/components/layout/sidebar';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile } = await getCurrentUser();

  return (
    <AuthProvider initialProfile={profile} initialUser={user}>
      <div className="app">
        <Sidebar />
        <main className="main">
          {children}
        </main>
      </div>
    </AuthProvider>
  );
}
