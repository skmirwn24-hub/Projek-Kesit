'use client';

import React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Topbar } from '@/components/layout/topbar';
import { BukuKasTab } from '@/components/keuangan/buku-kas-tab';
import { Loader2 } from 'lucide-react';

export default function BukuKasPage() {
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
        title="Buku Kas Operasional"
        subtitle="Catatan arus kas masuk & keluar, saldo terkini, dan pencatatan mutasi keuangan klub"
      />
      <BukuKasTab isOwner={isOwner} />
    </>
  );
}
