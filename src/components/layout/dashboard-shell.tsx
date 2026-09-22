'use client';

import React, { createContext, useContext, useState } from 'react';
import { Sidebar } from '@/components/layout/sidebar';

interface DashboardShellContextValue {
  isMobileOpen: boolean;
  openMobileNav: () => void;
  closeMobileNav: () => void;
  toggleMobileNav: () => void;
}

const DashboardShellContext = createContext<DashboardShellContextValue | undefined>(undefined);

export function useMobileNav() {
  const ctx = useContext(DashboardShellContext);
  if (!ctx) {
    return {
      isMobileOpen: false,
      openMobileNav: () => {},
      closeMobileNav: () => {},
      toggleMobileNav: () => {},
    };
  }
  return ctx;
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const openMobileNav = () => setIsMobileOpen(true);
  const closeMobileNav = () => setIsMobileOpen(false);
  const toggleMobileNav = () => setIsMobileOpen((prev) => !prev);

  return (
    <DashboardShellContext.Provider
      value={{ isMobileOpen, openMobileNav, closeMobileNav, toggleMobileNav }}
    >
      <div className="app">
        {/* Backdrop overlay for mobile drawer */}
        <div
          className={`sidebar-backdrop ${isMobileOpen ? 'active' : ''}`}
          onClick={closeMobileNav}
          aria-hidden="true"
        />

        {/* Sidebar */}
        <Sidebar isOpen={isMobileOpen} onClose={closeMobileNav} />

        {/* Main Content */}
        <main className="main">{children}</main>
      </div>
    </DashboardShellContext.Provider>
  );
}
