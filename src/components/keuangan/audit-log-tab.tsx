'use client';

import React from 'react';
import useSWR from 'swr';
import { SWR_KEYS } from '@/lib/swr-keys';
import { getAuditLogAction } from '@/server/actions/keuangan.actions';
import { formatRupiah, formatTanggal } from '@/lib/utils';
import { ShieldAlert, History, AlertTriangle } from 'lucide-react';

export function AuditLogTab() {
  const { data: auditList = [], isLoading } = useSWR(
    SWR_KEYS.KEUANGAN_AUDIT,
    async () => {
      const res = await getAuditLogAction();
      if (!res.success) throw new Error(res.error || 'Gagal memuat audit log');
      return res.data || [];
    },
    { revalidateOnFocus: true }
  );

  return (
    <div>
      {/* Top Banner Warning / Audit Explainer */}
      <div
        className="responsive-banner"
        style={{
          background: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid rgba(239, 68, 68, 0.25)',
          borderRadius: '16px',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'rgba(239, 68, 68, 0.15)',
            color: 'var(--color-danger)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <ShieldAlert size={22} />
          </div>
          <div>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-main)' }}>
              Audit Log: Transaksi Kas Dibatalkan (Soft Delete)
            </h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Sesuai regulasi pembukuan dan integritas keuangan KESIT Management, seluruh data transaksi kas yang pernah dibatalkan tetap disimpan permanen beserta jejak audit dan alasan penghapusannya.
            </p>
          </div>
        </div>
      </div>

      {/* Tabel Audit Log */}
      <div className="panel">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>No. Transaksi</th>
                <th>Tgl Transaksi</th>
                <th>Kategori & Jenis</th>
                <th>Nominal</th>
                <th>Dibatalkan Oleh</th>
                <th>Waktu Pembatalan</th>
                <th>Alasan Pembatalan</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                    Memuat audit log pembatalan...
                  </td>
                </tr>
              ) : auditList.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                    Bersih! Belum ada riwayat transaksi kas yang dibatalkan.
                  </td>
                </tr>
              ) : (
                auditList.map((item) => (
                  <tr key={item.id} style={{ opacity: 0.85 }}>
                    <td style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                      <span style={{ textDecoration: 'line-through', color: 'var(--text-dim)' }}>
                        {item.nomor_transaksi}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>
                      {formatTanggal(item.tanggal_transaksi)}
                    </td>
                    <td>
                      <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                        {item.kategori} ({item.jenis_transaksi})
                      </span>
                    </td>
                    <td style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                      {formatRupiah(item.nominal)}
                    </td>
                    <td>
                      <strong style={{ fontSize: '0.85rem', color: 'var(--color-danger)' }}>
                        {item.deleted_by || 'Owner'}
                      </strong>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                      {item.deleted_at ? new Date(item.deleted_at).toLocaleString('id-ID') : '-'}
                    </td>
                    <td>
                      <span style={{
                        fontSize: '0.85rem',
                        color: 'var(--color-warning)',
                        background: 'rgba(245, 158, 11, 0.1)',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        display: 'inline-block',
                      }}>
                        "{item.alasan_hapus || 'Tidak ada alasan dicatat'}"
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
