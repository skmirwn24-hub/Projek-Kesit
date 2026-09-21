'use client';

import React from 'react';
import { Calendar } from 'lucide-react';
import { ComingSoon } from '@/components/ui/coming-soon';

export default function JadwalPage() {
  return (
    <ComingSoon
      title="Manajemen Jadwal"
      subtitle="Jadwal sesi renang, alokasi jalur kolam, dan plotting pelatih"
      breadcrumb={[{ label: 'KESIT Management' }, { label: 'Jadwal' }]}
      icon={Calendar}
      description="Modul untuk mengatur sesi latihan siswa, ketersediaan pelatih, dan alokasi jalur kolam renang."
      features={[
        'Penjadwalan sesi renang per lokasi kolam',
        'Kalender ketersediaan pelatih per hari dan jam',
        'Notifikasi pengingat sesi dan penjadwalan ulang',
      ]}
    />
  );
}
