'use client';

import React from 'react';
import Link from 'next/link';
import { Menu } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useMobileNav } from '@/components/layout/dashboard-shell';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface TopbarProps {
  title?: string;
  subtitle?: string;
  breadcrumb?: BreadcrumbItem[];
  actions?: React.ReactNode;
  onToggleMobileMenu?: () => void;
}

export function Topbar({
  title = 'Dashboard',
  subtitle,
  breadcrumb,
  actions,
  onToggleMobileMenu,
}: TopbarProps) {
  const { profile } = useAuth();
  const { toggleMobileNav } = useMobileNav();
  const handleToggle = onToggleMobileMenu || toggleMobileNav;

  const displayName = profile?.nama_tampilan || profile?.username || 'User KESIT';
  const roleName = profile?.role || 'Administrator';
  const initial = (displayName.trim().charAt(0) || 'K').toUpperCase();

  return (
    <header className="topbar">
      <div className="topbar-header-row">
        <button
          type="button"
          className="hamburger-btn"
          onClick={handleToggle}
          aria-label="Buka navigasi menu"
        >
          <Menu size={20} />
        </button>

        <div className="page-heading">
          <h1>{title}</h1>
          {breadcrumb && breadcrumb.length > 0 ? (
            <div className="breadcrumb">
              {breadcrumb.map((item, idx) => (
                <React.Fragment key={idx}>
                  {idx > 0 && <span className="breadcrumb-sep">›</span>}
                  {item.href ? (
                    <Link href={item.href}>{item.label}</Link>
                  ) : (
                    <span>{item.label}</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          ) : subtitle ? (
            <p>{subtitle}</p>
          ) : null}
        </div>
      </div>

      <div className="topbar-right">
        {actions && <div className="topbar-actions">{actions}</div>}

        <div className="admin-box">
          <div className="admin-icon">{initial}</div>
          <div className="admin-info">
            <strong>{displayName}</strong>
            <small>{roleName}</small>
          </div>
        </div>
      </div>
    </header>
  );
}

