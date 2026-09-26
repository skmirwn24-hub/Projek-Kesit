'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { DATA_PAKET, DATA_LOKASI, PaketItem } from '@/server/constants/master-data';
import { formatRupiah } from '@/lib/utils';
import {
  Sparkles,
  Layers,
  MapPin,
  Clock,
  UserCheck,
  Check,
  ArrowRight,
  ShieldCheck,
  Search,
  Filter,
} from 'lucide-react';

interface PaketWithDetails extends PaketItem {
  kategori: string;
  lokasi: string[];
  deskripsi: string;
  manfaat: string[];
}

const DESKRIPSI_PAKET: Record<string, { deskripsi: string; manfaat: string[] }> = {
  'Reguler Pemula': {
    deskripsi: 'Program pengenalan air dan dasar keselamatan berenang untuk anak-anak dan pemula.',
    manfaat: ['Pengenalan air & pernapasan ritmis', 'Gerakan meluncur & kaki gaya dada', 'Rasio 1 pelatih max 5 anak', 'Durasi 60 menit per sesi'],
  },
  'Reguler Pra Prestasi': {
    deskripsi: 'Pemantapan teknik gaya dada dan bebas serta pembentukan daya tahan di air.',
    manfaat: ['Penyempurnaan gaya dada & gaya bebas', 'Latihan endurance berkelanjutan', 'Rasio 1 pelatih max 4 anak', 'Evaluasi kenaikan level berkala'],
  },
  'Private Pemula': {
    deskripsi: 'Pelatihan privat eksklusif 1-on-1 dengan fokus percepatan kepercayaan diri dan penguasaan teknik dasar.',
    manfaat: ['Pendampingan privat 1 pelatih 1 anak', 'Jadwal latihan fleksibel sesuai janji', 'Fasilitas pelampung & peralatan khusus', 'Garansi perkembangan lebih cepat'],
  },
  'Private Pra Prestasi': {
    deskripsi: 'Pembinaan teknik tingkat lanjut 1-on-1 untuk persiapan masuk program atlet/prestasi.',
    manfaat: ['Drill teknik 4 gaya renang', 'Koreksi biomekanik gerakan secara detail', 'Jadwal latihan personal dan terarah', 'Program fisik renang terukur'],
  },
  'Prestasi 4x / Minggu': {
    deskripsi: 'Program pembinaan atlet renang pemula dengan frekuensi latihan 4 kali per pekan.',
    manfaat: ['16 sesi latihan intensif per bulan', 'Program conditioning fisik darat & air', 'Monitoring catatan waktu berenang', 'Pendampingan kejuaraan renang lokal'],
  },
  'Prestasi 6x / Minggu': {
    deskripsi: 'Program atlet kompetitif untuk persiapan kejuaraan daerah dan nasional.',
    manfaat: ['24 sesi latihan intensif per bulan', 'Periodisasi latihan pra-kompetisi', 'Latihan start, turn, dan finish race', 'Bimbingan mental juara & nutrisi dasar'],
  },
  'Prestasi 8x / Minggu': {
    deskripsi: 'Pemusatan latihan intensif atlet unggulan KESIT dengan sesi pagi dan sore berstandar nasional.',
    manfaat: ['32 sesi latihan intensif per bulan', 'High Performance Training program', 'Pemusatan latihan kejuaraan resmi', 'Rapor performa dan time trial berkala'],
  },
};

export function KatalogPaketTab() {
  const [selectedKategori, setSelectedKategori] = useState<string>('Semua');
  const [search, setSearch] = useState('');

  // Build full package list
  const allPaket: PaketWithDetails[] = Object.entries(DATA_PAKET).flatMap(([kategori, items]) => {
    const lokasiUntukKategori = Object.entries(DATA_LOKASI)
      .filter(([, katList]) => katList.includes(kategori))
      .map(([lokasi]) => lokasi);

    return items.map((item) => ({
      ...item,
      kategori,
      lokasi: lokasiUntukKategori,
      deskripsi: DESKRIPSI_PAKET[item.nama]?.deskripsi || 'Program pelatihan renang terstruktur KESIT Management.',
      manfaat: DESKRIPSI_PAKET[item.nama]?.manfaat || ['Pelatih bersertifikat', 'Evaluasi berkala'],
    }));
  });

  const filteredPaket = allPaket.filter((p) => {
    const matchKategori = selectedKategori === 'Semua' || p.kategori === selectedKategori;
    const matchSearch =
      search.trim() === '' ||
      p.nama.toLowerCase().includes(search.toLowerCase()) ||
      p.kategori.toLowerCase().includes(search.toLowerCase()) ||
      p.lokasi.some((l) => l.toLowerCase().includes(search.toLowerCase()));
    return matchKategori && matchSearch;
  });

  const totalPaket = allPaket.length;
  const totalReguler = allPaket.filter((p) => p.kategori === 'Reguler').length;
  const totalPrivate = allPaket.filter((p) => p.kategori === 'Private').length;
  const totalPrestasi = allPaket.filter((p) => p.kategori === 'Prestasi').length;

  return (
    <div>
      {/* 3 Metric Cards */}
      <div className="responsive-stats-grid">
        <div className="panel responsive-stat-card">
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            Total Program Paket
          </span>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 700, margin: '6px 0 0 0' }}>
            {totalPaket} Paket
          </h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px', display: 'block' }}>
            {totalReguler} Reguler • {totalPrivate} Private • {totalPrestasi} Prestasi
          </span>
        </div>

        <div className="panel responsive-stat-card">
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            Rentang Biaya Kursus
          </span>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 700, margin: '6px 0 0 0', color: 'var(--color-primary)' }}>
            Rp 100k - 300k
          </h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px', display: 'block' }}>
            Biaya SPP resmi per paket kursus
          </span>
        </div>

        <div className="panel responsive-stat-card">
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            Lokasi Kolam Latihan
          </span>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 700, margin: '6px 0 0 0', color: 'var(--color-success)' }}>
            3 Lokasi Kolam
          </h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px', display: 'block' }}>
            AlBanawi, Cafe Fameliza, Onokabe
          </span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="panel responsive-toolbar-panel">
        <div className="responsive-toolbar-row">
          {/* Category Chips */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {['Semua', 'Reguler', 'Private', 'Prestasi'].map((kat) => (
              <button
                key={kat}
                type="button"
                onClick={() => setSelectedKategori(kat)}
                style={{
                  padding: '7px 14px',
                  borderRadius: '8px',
                  border: selectedKategori === kat ? '1px solid var(--color-primary)' : '1px solid var(--border)',
                  background: selectedKategori === kat ? 'rgba(37, 99, 235, 0.15)' : 'var(--bg-panel-soft)',
                  color: selectedKategori === kat ? 'var(--color-primary)' : 'var(--text-muted)',
                  fontWeight: selectedKategori === kat ? 600 : 500,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {kat === 'Semua' ? 'Semua Kategori' : `Kelas ${kat}`}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="responsive-toolbar-search">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama paket atau lokasi..."
              style={{ width: '100%', paddingLeft: '34px', paddingRight: '12px' }}
            />
            <Search
              size={16}
              style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }}
            />
          </div>
        </div>
      </div>

      {/* Grid of Package Cards */}
      <div className="paket-catalog-grid">
        {filteredPaket.map((paket) => {
          const badgeColor =
            paket.kategori === 'Prestasi'
              ? 'rgba(245, 158, 11, 0.15)'
              : paket.kategori === 'Private'
              ? 'rgba(16, 185, 129, 0.15)'
              : 'rgba(37, 99, 235, 0.15)';
          const textColor =
            paket.kategori === 'Prestasi'
              ? 'var(--color-warning)'
              : paket.kategori === 'Private'
              ? 'var(--color-success)'
              : 'var(--color-primary)';

          return (
            <div
              key={paket.nama}
              className="panel paket-catalog-card"
            >
              <div>
                {/* Header Badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <span
                    style={{
                      background: badgeColor,
                      color: textColor,
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      letterSpacing: '0.3px',
                      textTransform: 'uppercase',
                    }}
                  >
                    Kelas {paket.kategori}
                  </span>

                  <span style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.8rem',
                    color: 'var(--text-muted)',
                    background: 'var(--bg-panel-soft)',
                    padding: '4px 8px',
                    borderRadius: '6px',
                  }}>
                    <Clock size={13} />
                    {paket.kuota} Sesi Kuota
                  </span>
                </div>

                {/* Package Title */}
                <h3 style={{ margin: '0 0 8px 0', fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  {paket.nama}
                </h3>

                {/* Pricing */}
                <div style={{ marginBottom: '14px', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                  <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', fontVariantNumeric: 'tabular-nums' }}>
                    {formatRupiah(paket.harga)}
                  </span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    / paket
                  </span>
                </div>

                {/* Description */}
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '16px' }}>
                  {paket.deskripsi}
                </p>

                {/* Features & Benefits */}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '14px', marginBottom: '16px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'block', marginBottom: '8px' }}>
                    Keunggulan & Fasilitas:
                  </span>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {paket.manfaat.map((m, idx) => (
                      <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: 'var(--text-main)' }}>
                        <span style={{ color: 'var(--color-success)', display: 'flex', alignItems: 'center' }}>
                          <Check size={14} />
                        </span>
                        {m}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Available Pool Locations */}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px', marginBottom: '16px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'block', marginBottom: '6px' }}>
                    Lokasi Kolam:
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {paket.lokasi.map((loc) => (
                      <span key={loc} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        <MapPin size={12} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                        {loc}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Action CTA */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '14px' }}>
                <Link
                  href="/siswa/pendaftaran"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    width: '100%',
                    padding: '9px 16px',
                    borderRadius: '8px',
                    background: 'var(--bg-panel-soft)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-main)',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    textDecoration: 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  Daftarkan Siswa ke Paket Ini
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Info Callout for Renewal */}
      <div
        className="responsive-banner"
        style={{
          background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.08), rgba(16, 185, 129, 0.06))',
          border: '1px solid rgba(37, 99, 235, 0.2)',
          borderRadius: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'rgba(37, 99, 235, 0.15)',
            color: 'var(--color-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <ShieldCheck size={22} />
          </div>
          <div>
            <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', fontWeight: 600 }}>
              Perpanjangan Kuota & Pindah Paket Siswa
            </h4>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Jika kuota sesi murid telah habis atau murid ingin naik kelas, perpanjangan kuota paket dapat diproses langsung melalui menu <strong>Rekapan Siswa (Pindah/Perpanjang Paket)</strong>.
            </p>
          </div>
        </div>

        <Link
          href="/siswa/rekapan"
          className="secondary"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '9px 18px',
            fontSize: '0.85rem',
            textDecoration: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          Buka Rekapan Siswa
          <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}
