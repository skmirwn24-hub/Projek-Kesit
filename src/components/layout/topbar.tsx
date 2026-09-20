'use client';

import React from 'react';
import { useAuth } from '@/hooks/use-auth';

interface TopbarProps {
  title?: string;
  subtitle?: string;
}

export function Topbar({
  title = 'Dashboard',
  subtitle = 'Selamat datang di KESIT Management',
}: TopbarProps) {
  const { profile } = useAuth();
  const displayName = profile?.nama_tampilan || profile?.username || 'User KESIT';
  const roleName = profile?.role || 'Administrator';
  const initial = (displayName.trim().charAt(0) || 'K').toUpperCase();

  return (
    <header className="topbar">
      <div className="page-heading">
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>

      <div className="admin-box">
        <div className="admin-icon">{initial}</div>
        <div className="admin-info">
          <strong>{displayName}</strong>
          <small>{roleName}</small>
        </div>
      </div>
    </header>
  );
}
