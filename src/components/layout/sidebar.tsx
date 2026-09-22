'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Calendar,
  ClipboardCheck,
  FileText,
  CreditCard,
  Wallet,
  History,
  Settings,
  LogOut,
  ChevronDown,
  X,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { role, logout } = useAuth();
  const isPelatih = role === 'Pelatih';

  const isDashboard = pathname === '/';
  const isSiswaPendaftaran = pathname === '/siswa/pendaftaran';
  const isSiswaRekapan = pathname === '/siswa/rekapan';
  const isPelatihDaftar = pathname === '/pelatih';
  const isPelatihPenilaian = pathname === '/penilaian';
  const isJadwal = pathname === '/jadwal';
  const isAbsensi = pathname === '/absensi';
  const isLaporanSiswa = pathname === '/laporan-siswa';
  const isPaketPembayaran = pathname === '/paket-pembayaran';
  const isKeuangan = pathname === '/keuangan';
  const isRiwayat = pathname === '/riwayat';
  const isPengaturan = pathname === '/pengaturan';

  return (
    <aside className={`sidebar ${isOpen ? 'mobile-open' : ''}`}>
      {/* BRAND & MOBILE CLOSE */}
      <div className="brand" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="logo">K</div>
          <div className="brand-text">
            <h2>KESIT</h2>
            <span>Management</span>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            className="hamburger-btn"
            style={{ width: '32px', height: '32px', marginRight: 0 }}
            onClick={onClose}
            aria-label="Tutup navigasi menu"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* NAV */}
      <nav className="sidebar-nav">
        {/* DASHBOARD */}
        <Link
          href="/"
          className={`menu ${isDashboard ? 'active' : ''}`}
          onClick={onClose}
        >
          <span className="menu-icon">
            <LayoutDashboard size={18} />
          </span>
          <span>Dashboard</span>
        </Link>

        {/* SISWA */}
        <div className="menu-group">
          <div className="menu-parent">
            <span className="menu-icon">
              <Users size={18} />
            </span>
            <span>Siswa</span>
            <span className="menu-arrow">
              <ChevronDown size={14} />
            </span>
          </div>

          <div className="submenu">
            {!isPelatih && (
              <Link
                href="/siswa/pendaftaran"
                className={`submenu-item ${isSiswaPendaftaran ? 'active' : ''}`}
                onClick={onClose}
              >
                Pendaftaran Siswa
              </Link>
            )}

            <Link
              href="/siswa/rekapan"
              className={`submenu-item ${isSiswaRekapan ? 'active' : ''}`}
              onClick={onClose}
            >
              Rekapan Siswa
            </Link>
          </div>
        </div>

        {/* PELATIH */}
        <div className="menu-group">
          <div className="menu-parent">
            <span className="menu-icon">
              <GraduationCap size={18} />
            </span>
            <span>Pelatih</span>
            <span className="menu-arrow">
              <ChevronDown size={14} />
            </span>
          </div>

          <div className="submenu">
            <Link
              href="/pelatih"
              className={`submenu-item ${isPelatihDaftar ? 'active' : ''}`}
              onClick={onClose}
            >
              Daftar Pelatih
            </Link>

            <Link
              href="/penilaian"
              className={`submenu-item ${isPelatihPenilaian ? 'active' : ''}`}
              onClick={onClose}
            >
              Penilaian Pelatih
            </Link>
          </div>
        </div>

        {/* JADWAL */}
        <Link
          href="/jadwal"
          className={`menu ${isJadwal ? 'active' : ''}`}
          onClick={onClose}
        >
          <span className="menu-icon">
            <Calendar size={18} />
          </span>
          <span>Jadwal</span>
        </Link>

        {/* ABSENSI */}
        <Link
          href="/absensi"
          className={`menu ${isAbsensi ? 'active' : ''}`}
          onClick={onClose}
        >
          <span className="menu-icon">
            <ClipboardCheck size={18} />
          </span>
          <span>Absensi</span>
        </Link>

        {/* LAPORAN SISWA */}
        <Link
          href="/laporan-siswa"
          className={`menu ${isLaporanSiswa ? 'active' : ''}`}
          onClick={onClose}
        >
          <span className="menu-icon">
            <FileText size={18} />
          </span>
          <span>Laporan Siswa</span>
        </Link>

        {!isPelatih && (
          <>
            {/* PAKET & PEMBAYARAN */}
            <Link
              href="/paket-pembayaran"
              className={`menu ${isPaketPembayaran ? 'active' : ''}`}
              onClick={onClose}
            >
              <span className="menu-icon">
                <CreditCard size={18} />
              </span>
              <span>Paket & Pembayaran</span>
            </Link>

            {/* KEUANGAN & KAS */}
            <Link
              href="/keuangan"
              className={`menu ${isKeuangan ? 'active' : ''}`}
              onClick={onClose}
            >
              <span className="menu-icon">
                <Wallet size={18} />
              </span>
              <span>Keuangan & Kas</span>
            </Link>

            {/* RIWAYAT */}
            <Link
              href="/riwayat"
              className={`menu ${isRiwayat ? 'active' : ''}`}
              onClick={onClose}
            >
              <span className="menu-icon">
                <History size={18} />
              </span>
              <span>Riwayat</span>
            </Link>

            {/* PENGATURAN */}
            <Link
              href="/pengaturan"
              className={`menu ${isPengaturan ? 'active' : ''}`}
              onClick={onClose}
            >
              <span className="menu-icon">
                <Settings size={18} />
              </span>
              <span>Pengaturan</span>
            </Link>
          </>
        )}
      </nav>

      {/* FOOTER */}
      <div className="sidebar-footer">
        <button
          type="button"
          className="logout"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          onClick={() => logout()}
        >
          <LogOut size={16} />
          <span>Keluar</span>
        </button>
      </div>
    </aside>
  );
}

