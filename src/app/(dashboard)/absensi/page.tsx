'use client';

import React from 'react';
import { ClipboardCheck } from 'lucide-react';
import { ComingSoon } from '@/components/ui/coming-soon';

export default function AbsensiPage() {
  return (
    <ComingSoon
      title="Presensi Siswa & Pelatih"
      subtitle="Pencatatan kehadiran siswa dan pelatih di tepi kolam"
      breadcrumb={[{ label: 'KESIT Management' }, { label: 'Absensi' }]}
      icon={ClipboardCheck}
      description="Presensi digital untuk mencatat kehadiran siswa di kolam, memotong kuota pertemuan, dan memverifikasi kehadiran pelatih."
      features={[
        'Pencatatan kehadiran siswa dengan pengurangan kuota pertemuan langsung',
        'Verifikasi kehadiran pelatih per sesi untuk dasar perhitungan honor',
        'Rekap kehadiran bulanan per siswa dan pelatih',
      ]}
    />
  );
}
