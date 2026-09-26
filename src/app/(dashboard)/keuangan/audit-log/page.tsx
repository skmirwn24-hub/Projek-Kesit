'use client';

import React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Topbar } from '@/components/layout/topbar';
import { AuditLogTab } from '@/components/keuangan/audit-log-tab';
import { Loader2, ShieldAlert } from 'lucide-react';

export default function AuditLogPage() {
  const { role, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        color: 'var(--text-muted)',
      }}>
        <Loader2 className="animate-spin" size={32} />
        <span>Memuat data...</span>
      </div>
    );
  }

  if (role !== 'Owner') {
    return (
      <div style={{
        minHeight: '50vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        textAlign: 'center',
      }}>
        <ShieldAlert size={48} color="var(--color-danger)" />
        <h2 style={{ margin: 0 }}>Akses Terbatas</h2>
        <p style={{ color: 'var(--text-muted)', maxWidth: '420px' }}>
          Halaman Audit Log Pembatalan hanya dapat diakses oleh Owner KESIT Management.
        </p>
      </div>
    );
  }

  return (
    <>
      <Topbar
        title="Audit Log Pembatalan Kas"
        subtitle="Jejak audit permanen transaksi kas yang dibatalkan (soft delete) untuk integritas pembukuan klub"
      />
      <AuditLogTab />
    </>
  );
}
