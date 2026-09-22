'use client';

import React from 'react';
import { CreditCard } from 'lucide-react';
import { ComingSoon } from '@/components/ui/coming-soon';

export default function PaketPembayaranPage() {
  return (
    <ComingSoon
      title="Katalog Paket & Pembayaran"
      subtitle="Katalog paket kursus renang, perpanjangan kuota, dan tagihan SPP"
      breadcrumb={[{ label: 'KESIT Management' }, { label: 'Paket & Pembayaran' }]}
      icon={CreditCard}
      description="Pengelolaan katalog paket renang, perpanjangan kuota siswa, dan pencatatan pelunasan tagihan SPP."
      features={[
        'Katalog tarif paket kursus per lokasi dan kategori kelas',
        'Pencatatan pembayaran bertahap dan pelunasan tagihan',
        'Cetak ulang kuitansi pembayaran siswa',
      ]}
    />
  );
}
