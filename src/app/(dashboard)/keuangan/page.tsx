'use client';

import React from 'react';
import { Wallet } from 'lucide-react';
import { ComingSoon } from '@/components/ui/coming-soon';

export default function KeuanganPage() {
  return (
    <ComingSoon
      title="Keuangan, Kas & Penggajian"
      subtitle="Buku kas operasional, penerimaan SPP, dan penghitungan honor pelatih"
      breadcrumb={[{ label: 'KESIT Management' }, { label: 'Keuangan & Kas' }]}
      icon={Wallet}
      description="Buku kas operasional KESIT, rekap pembayaran SPP, dan penghitungan honor mengajar pelatih per sesi."
      features={[
        'Pencatatan kas masuk operasional dan pengeluaran berkala',
        'Penghitungan honor pelatih berdasarkan jumlah sesi mengajar',
        'Laporan rekapitulasi keuangan per cabang lokasi kolam',
      ]}
    />
  );
}
