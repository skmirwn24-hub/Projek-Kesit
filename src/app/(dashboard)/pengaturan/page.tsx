'use client';

import React from 'react';
import { Settings } from 'lucide-react';
import { ComingSoon } from '@/components/ui/coming-soon';

export default function PengaturanPage() {
  return (
    <ComingSoon
      title="Pengaturan Sistem"
      subtitle="Manajemen akun pengguna, hak akses role, dan konfigurasi master data KESIT"
      breadcrumb={[{ label: 'KESIT Management' }, { label: 'Pengaturan' }]}
      icon={Settings}
      description="Pengaturan akun staf, hak akses pengguna, dan master data cabang lokasi KESIT."
      features={[
        'Manajemen akun staf, reset password, dan konfigurasi hak akses',
        'Pengaturan data cabang lokasi kolam renang dan kuota kelas',
        'Log audit aktivitas sistem dan pencadangan data',
      ]}
    />
  );
}
