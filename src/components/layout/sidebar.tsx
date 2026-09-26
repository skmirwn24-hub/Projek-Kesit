'use client';

import React, { useState, useEffect } from 'react';
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
  const isPaketPembayaranSpp = pathname === '/paket-pembayaran/spp' || pathname === '/paket-pembayaran';
  const isPaketPembayaranKatalog = pathname === '/paket-pembayaran/katalog';
  const isKeuanganBukuKas = pathname === '/keuangan/buku-kas' || pathname === '/keuangan';
  const isKeuanganHonor = pathname === '/keuangan/honor-pelatih';
  const isKeuanganAudit = pathname === '/keuangan/audit-log';
  const isRiwayat = pathname === '/riwayat';
  const isPengaturan = pathname === '/pengaturan';

  // Active section helpers
  const isSiswaActive = pathname.startsWith('/siswa');
  const isPelatihActive = pathname === '/pelatih' || pathname === '/penilaian';
  const isPaketActive = pathname.startsWith('/paket-pembayaran');
  const isKeuanganActive = pathname.startsWith('/keuangan');

  // Dropdown state for collapsible groups
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    siswa: isSiswaActive || true,
    pelatih: isPelatihActive,
    paket: isPaketActive,
    keuangan: isKeuanganActive,
  });

  // Automatically expand group whenever navigating to a route inside it
  useEffect(() => {
    if (isSiswaActive) setOpenGroups((prev) => ({ ...prev, siswa: true }));
    if (isPelatihActive) setOpenGroups((prev) => ({ ...prev, pelatih: true }));
    if (isPaketActive) setOpenGroups((prev) => ({ ...prev, paket: true }));
    if (isKeuanganActive) setOpenGroups((prev) => ({ ...prev, keuangan: true }));
  }, [isSiswaActive, isPelatihActive, isPaketActive, isKeuanganActive]);

  const toggleGroup = (key: string) => {
    setOpenGroups((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

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
          <button
            type="button"
            className={`menu-parent ${isSiswaActive ? 'active-parent' : ''}`}
            onClick={() => toggleGroup('siswa')}
            aria-expanded={openGroups.siswa}
          >
            <span className="menu-icon">
              <Users size={18} />
            </span>
            <span>Siswa</span>
            <span className={`menu-arrow ${openGroups.siswa ? 'open' : ''}`}>
              <ChevronDown size={14} />
            </span>
          </button>

          {openGroups.siswa && (
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
          )}
        </div>

        {/* PELATIH */}
        <div className="menu-group">
          <button
            type="button"
            className={`menu-parent ${isPelatihActive ? 'active-parent' : ''}`}
            onClick={() => toggleGroup('pelatih')}
            aria-expanded={openGroups.pelatih}
          >
            <span className="menu-icon">
              <GraduationCap size={18} />
            </span>
            <span>Pelatih</span>
            <span className={`menu-arrow ${openGroups.pelatih ? 'open' : ''}`}>
              <ChevronDown size={14} />
            </span>
          </button>

          {openGroups.pelatih && (
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
          )}
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

        {/* PEMBAYARAN SPP (UNTUK PELATIH) */}
        {isPelatih && (
          <Link
            href="/paket-pembayaran/spp"
            className={`menu ${isPaketPembayaranSpp ? 'active' : ''}`}
            onClick={onClose}
          >
            <span className="menu-icon">
              <CreditCard size={18} />
            </span>
            <span>Pembayaran SPP</span>
          </Link>
        )}

        {/* PAKET & PEMBAYARAN (UNTUK OWNER & ADMIN) */}
        {!isPelatih && (
          <div className="menu-group">
            <button
              type="button"
              className={`menu-parent ${isPaketActive ? 'active-parent' : ''}`}
              onClick={() => toggleGroup('paket')}
              aria-expanded={openGroups.paket}
            >
              <span className="menu-icon">
                <CreditCard size={18} />
              </span>
              <span>Paket & SPP</span>
              <span className={`menu-arrow ${openGroups.paket ? 'open' : ''}`}>
                <ChevronDown size={14} />
              </span>
            </button>

            {openGroups.paket && (
              <div className="submenu">
                <Link
                  href="/paket-pembayaran/spp"
                  className={`submenu-item ${isPaketPembayaranSpp ? 'active' : ''}`}
                  onClick={onClose}
                >
                  Pembayaran SPP
                </Link>

                <Link
                  href="/paket-pembayaran/katalog"
                  className={`submenu-item ${isPaketPembayaranKatalog ? 'active' : ''}`}
                  onClick={onClose}
                >
                  Katalog Paket Kursus
                </Link>
              </div>
            )}
          </div>
        )}

        {!isPelatih && (
          <>
            {/* KEUANGAN & KAS (UNTUK OWNER & ADMIN) */}
            <div className="menu-group">
              <button
                type="button"
                className={`menu-parent ${isKeuanganActive ? 'active-parent' : ''}`}
                onClick={() => toggleGroup('keuangan')}
                aria-expanded={openGroups.keuangan}
              >
                <span className="menu-icon">
                  <Wallet size={18} />
                </span>
                <span>Keuangan & Kas</span>
                <span className={`menu-arrow ${openGroups.keuangan ? 'open' : ''}`}>
                  <ChevronDown size={14} />
                </span>
              </button>

              {openGroups.keuangan && (
                <div className="submenu">
                  <Link
                    href="/keuangan/buku-kas"
                    className={`submenu-item ${isKeuanganBukuKas ? 'active' : ''}`}
                    onClick={onClose}
                  >
                    Buku Kas Operasional
                  </Link>

                  <Link
                    href="/keuangan/honor-pelatih"
                    className={`submenu-item ${isKeuanganHonor ? 'active' : ''}`}
                    onClick={onClose}
                  >
                    Honor Pelatih
                  </Link>

                  {role === 'Owner' && (
                    <Link
                      href="/keuangan/audit-log"
                      className={`submenu-item ${isKeuanganAudit ? 'active' : ''}`}
                      onClick={onClose}
                    >
                      Audit Log Pembatalan
                    </Link>
                  )}
                </div>
              )}
            </div>

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

