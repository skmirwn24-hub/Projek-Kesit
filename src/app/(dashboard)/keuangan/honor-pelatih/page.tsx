'use client';

import React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Topbar } from '@/components/layout/topbar';
import { HonorPelatihTab } from '@/components/keuangan/honor-pelatih-tab';
import { Loader2 } from 'lucide-react';

export default function HonorPelatihPage() {
  const { role, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        color: 'var(--text-muted)',
      }}>
        <Loader2 className="animate-spin" size={32} />
        <span>Memuat data...</span>
      </div>
    );
  }

  const isOwner = role === 'Owner';

  return (
    <>
      <Topbar
        title="Honor Pelatih"
        subtitle="Kalkulasi otomatis honor pelatih berbasis log kehadiran absensi murid per anak & pencairan ke buku kas"
      />
      <HonorPelatihTab isOwner={isOwner} />
    </>
  );
}
