'use client';

import React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Topbar } from '@/components/layout/topbar';
import { SiswaSppTab } from '@/components/keuangan/siswa-spp-tab';
import { PelatihPembayaranView } from '@/components/keuangan/pelatih-pembayaran-view';
import { Loader2 } from 'lucide-react';

export default function PembayaranSppPage() {
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

  const isPelatih = role === 'Pelatih';

  if (isPelatih) {
    return (
      <>
        <Topbar
          title="Pembayaran SPP Siswa"
          subtitle="Penerimaan pembayaran SPP murid binaan langsung di kolam renang & penerbitan kuitansi resmi"
        />
        <PelatihPembayaranView />
      </>
    );
  }

  return (
    <>
      <Topbar
        title="Tagihan & Pembayaran SPP"
        subtitle="Manajemen tagihan, penerimaan pembayaran, dan status pelunasan SPP seluruh siswa KESIT"
      />
      <SiswaSppTab />
    </>
  );
}
