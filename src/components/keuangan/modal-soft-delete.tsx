'use client';

import React, { useState } from 'react';
import { KasTransaksi } from '@/types/keuangan';
import { softDeleteKasTransaksiAction } from '@/server/actions/keuangan.actions';
import { formatRupiah, formatTanggal } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';
import { AlertTriangle, X } from 'lucide-react';

import { Modal } from '@/components/ui/modal';

interface ModalSoftDeleteProps {
  transaksi: KasTransaksi;
  onClose: () => void;
  onSuccess: () => void;
}

export function ModalSoftDelete({ transaksi, onClose, onSuccess }: ModalSoftDeleteProps) {
  const toast = useToast();
  const [alasan, setAlasan] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alasan.trim() || alasan.trim().length < 3) {
      toast.warning('Alasan pembatalan wajib diisi minimal 3 karakter.');
      return;
    }

    setLoading(true);
    try {
      const res = await softDeleteKasTransaksiAction({
        transaksi_id: transaksi.id,
        alasan: alasan.trim(),
      });

      if (!res.success) {
        toast.error(res.error || 'Gagal membatalkan transaksi.');
        setLoading(false);
        return;
      }

      toast.success('Transaksi berhasil dibatalkan dan tercatat di audit log.');
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Batalkan Transaksi Kas (Soft Delete)"
      subtitle="Kepatuhan pembukuan: Data tidak dihapus permanen, melainkan tercatat di audit log"
      maxWidth="md"
    >

        <div style={{
          background: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          borderRadius: '8px',
          padding: '12px',
          fontSize: '0.85rem',
          color: 'var(--text-muted)',
          marginBottom: '16px',
        }}>
          Pembatalan ini bersifat <strong>Soft Delete</strong> (tidak menghapus fisik data). Transaksi akan dikeluarkan dari saldo kas aktif namun tersimpan permanen di <strong>Audit Log</strong> untuk kepatuhan pembukuan.
        </div>

        <div style={{
          background: 'var(--bg-panel-soft)',
          borderRadius: '8px',
          padding: '12px 14px',
          fontSize: '0.85rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          marginBottom: '16px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>No. Transaksi:</span>
            <strong>{transaksi.nomor_transaksi}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Tanggal & Kategori:</span>
            <span>{formatTanggal(transaksi.tanggal_transaksi)} ({transaksi.kategori})</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Nominal:</span>
            <strong style={{ color: transaksi.jenis_transaksi === 'Masuk' ? 'var(--color-success)' : 'var(--color-danger)' }}>
              {transaksi.jenis_transaksi === 'Masuk' ? '+' : '-'} {formatRupiah(transaksi.nominal)}
            </strong>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="form-group">
            <label htmlFor="alasanBatal" style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>
              Alasan Pembatalan (Wajib Audit) *
            </label>
            <textarea
              id="alasanBatal"
              rows={3}
              value={alasan}
              onChange={(e) => setAlasan(e.target.value)}
              placeholder="Contoh: Salah input nominal / transaksi duplikat kasir"
              required
              style={{ width: '100%', padding: '8px 12px', fontSize: '0.9rem' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="secondary"
              onClick={onClose}
              disabled={loading}
            >
              Kembali
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                background: 'var(--color-danger)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '9px 16px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {loading ? 'Memproses...' : 'Ya, Batalkan Transaksi'}
            </button>
          </div>
        </form>
    </Modal>
  );
}
