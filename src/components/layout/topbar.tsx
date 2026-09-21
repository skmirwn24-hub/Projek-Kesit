'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface TopbarProps {
  title?: string;
  subtitle?: string;
  breadcrumb?: BreadcrumbItem[];
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  actions?: React.ReactNode;
}

export function Topbar({
  title = 'Dashboard',
  subtitle,
  breadcrumb,
  searchPlaceholder = 'Cari...',
  searchValue,
  onSearchChange,
  actions,
}: TopbarProps) {
  const { profile } = useAuth();
  const displayName = profile?.nama_tampilan || profile?.username || 'User KESIT';
  const roleName = profile?.role || 'Administrator';
  const initial = (displayName.trim().charAt(0) || 'K').toUpperCase();

  return (
    <header className="topbar">
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

      <div className="topbar-right">
        {actions && <div className="topbar-actions">{actions}</div>}

        {onSearchChange && (
          <div className="top-search">
            <span className="search-icon">⌕</span>
            <input
              type="text"
              id="searchTop"
              placeholder={searchPlaceholder}
              value={searchValue || ''}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        )}

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
