'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

export function Sidebar() {
  const pathname = usePathname();
  const { role, logout } = useAuth();
  const isPelatih = role === 'Pelatih';

  const isDashboard = pathname === '/';
  const isSiswaPendaftaran = pathname === '/siswa/pendaftaran';
  const isSiswaRekapan = pathname === '/siswa/rekapan';
  const isSiswaGroup = isSiswaPendaftaran || isSiswaRekapan;
  const isPelatihDaftar = pathname === '/pelatih';
  const isPelatihPenilaian = pathname === '/penilaian';
  const isPelatihGroup = isPelatihDaftar || isPelatihPenilaian;
  const isRiwayat = pathname === '/riwayat';

  return (
    <aside className="sidebar">
      {/* BRAND */}
      <div className="brand">
        <div className="logo">K</div>
        <div className="brand-text">
          <h2>KESIT</h2>
          <span>Management</span>
        </div>
      </div>

      {/* NAV */}
      <nav className="sidebar-nav">
        {/* DASHBOARD */}
        <Link href="/" className={`menu ${isDashboard ? 'active' : ''}`}>
          <span className="menu-icon">▦</span>
          <span>Dashboard</span>
        </Link>

        {/* SISWA */}
        <div className="menu-group">
          <div className="menu-parent">
            <span className="menu-icon">♟</span>
            <span>Siswa</span>
            <span className="menu-arrow">⌄</span>
          </div>

          <div className="submenu">
            {!isPelatih && (
              <Link
                href="/siswa/pendaftaran"
                className={`submenu-item ${isSiswaPendaftaran ? 'active' : ''}`}
              >
                Pendaftaran Siswa
              </Link>
            )}

            <Link
              href="/siswa/rekapan"
              className={`submenu-item ${isSiswaRekapan ? 'active' : ''}`}
            >
              Rekapan Siswa
            </Link>
          </div>
        </div>

        {/* PELATIH */}
        <div className="menu-group">
          <div className="menu-parent">
            <span className="menu-icon">♞</span>
            <span>Pelatih</span>
            <span className="menu-arrow">⌄</span>
          </div>

          <div className="submenu">
            <Link
              href="/pelatih"
              className={`submenu-item ${isPelatihDaftar ? 'active' : ''}`}
            >
              Daftar Pelatih
            </Link>

            <Link
              href="/penilaian"
              className={`submenu-item ${isPelatihPenilaian ? 'active' : ''}`}
            >
              Penilaian Pelatih
            </Link>

            <Link href="/pelatih" className="submenu-item">
              Rekap Pelatih
            </Link>
          </div>
        </div>

        {/* JADWAL */}
        <Link href="#" className="menu">
          <span className="menu-icon">▣</span>
          <span>Jadwal</span>
        </Link>

        {/* ABSENSI */}
        <Link href="#" className="menu">
          <span className="menu-icon">✓</span>
          <span>Absensi</span>
        </Link>

        {/* LAPORAN SISWA */}
        <Link href="#" className="menu">
          <span className="menu-icon">▤</span>
          <span>Laporan Siswa</span>
        </Link>

        {!isPelatih && (
          <>
            {/* PAKET & PEMBAYARAN */}
            <Link href="#" className="menu">
              <span className="menu-icon">▧</span>
              <span>Paket & Pembayaran</span>
            </Link>

            {/* KEUANGAN */}
            <Link href="#" className="menu">
              <span className="menu-icon">Rp</span>
              <span>Keuangan & Kas</span>
            </Link>

            {/* RIWAYAT */}
            <Link href="/riwayat" className={`menu ${isRiwayat ? 'active' : ''}`}>
              <span className="menu-icon">↺</span>
              <span>Riwayat</span>
            </Link>

            {/* PENGATURAN */}
            <Link href="#" className="menu">
              <span className="menu-icon">⚙</span>
              <span>Pengaturan</span>
            </Link>
          </>
        )}
      </nav>

      {/* FOOTER */}
      <div className="sidebar-footer">
        <button type="button" className="logout" onClick={() => logout()}>
          Keluar
        </button>
      </div>
    </aside>
  );
}
