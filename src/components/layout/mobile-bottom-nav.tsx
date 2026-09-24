'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ClipboardCheck,
  Users,
  GraduationCap,
  Menu,
} from 'lucide-react';
import { useMobileNav } from '@/components/layout/dashboard-shell';

export function MobileBottomNav() {
  const pathname = usePathname();
  const { toggleMobileNav } = useMobileNav();

  const isDashboard = pathname === '/';
  const isAbsensi = pathname.startsWith('/absensi');
  const isSiswa = pathname.startsWith('/siswa');
  const isPelatih = pathname.startsWith('/pelatih');

  return (
    <nav className="mobile-bottom-nav" aria-label="Navigasi Bawah">
      <Link
        href="/"
        className={`bottom-nav-item ${isDashboard ? 'active' : ''}`}
        aria-label="Dashboard"
      >
        <LayoutDashboard size={20} />
        <span>Dashboard</span>
      </Link>

      <Link
        href="/absensi"
        className={`bottom-nav-item ${isAbsensi ? 'active' : ''}`}
        aria-label="Absensi"
      >
        <ClipboardCheck size={20} />
        <span>Absensi</span>
      </Link>

      <Link
        href="/siswa/rekapan"
        className={`bottom-nav-item ${isSiswa ? 'active' : ''}`}
        aria-label="Siswa"
      >
        <Users size={20} />
        <span>Siswa</span>
      </Link>

      <Link
        href="/pelatih"
        className={`bottom-nav-item ${isPelatih ? 'active' : ''}`}
        aria-label="Pelatih"
      >
        <GraduationCap size={20} />
        <span>Pelatih</span>
      </Link>

      <button
        type="button"
        className="bottom-nav-item"
        onClick={toggleMobileNav}
        aria-label="Buka Menu Lengkap"
      >
        <Menu size={20} />
        <span>Menu</span>
      </button>
    </nav>
  );
}
