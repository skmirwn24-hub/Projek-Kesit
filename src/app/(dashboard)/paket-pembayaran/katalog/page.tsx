'use client';

import React from 'react';
import { Topbar } from '@/components/layout/topbar';
import { KatalogPaketTab } from '@/components/paket/katalog-paket-tab';

export default function KatalogPaketPage() {
  return (
    <>
      <Topbar
        title="Katalog Paket Kursus Renang"
        subtitle="Daftar paket program renang, rincian biaya SPP resmi, dan kuota sesi latihan KESIT Management"
      />
      <KatalogPaketTab />
    </>
  );
}
