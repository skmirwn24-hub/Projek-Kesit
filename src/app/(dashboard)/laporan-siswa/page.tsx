'use client';

import React from 'react';
import { FileText } from 'lucide-react';
import { ComingSoon } from '@/components/ui/coming-soon';

export default function LaporanSiswaPage() {
  return (
    <ComingSoon
      title="Rapor & Perkembangan Siswa"
      subtitle="Evaluasi kemampuan teknik renang dan pencapaian level siswa"
      breadcrumb={[{ label: 'KESIT Management' }, { label: 'Laporan Siswa' }]}
      icon={FileText}
      description="Rapor berkala dan sertifikat kenaikan tingkat untuk mencatat evaluasi gaya dada, gaya bebas, gaya punggung, dan gaya kupu-kupu siswa."
      features={[
        'Penilaian kompetensi gaya renang per level kelas',
        'Cetak rapor digital dan sertifikat tingkat siswa',
        'Riwayat evaluasi berkala untuk orang tua/wali siswa',
      ]}
    />
  );
}
