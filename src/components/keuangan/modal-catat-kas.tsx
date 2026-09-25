'use client';

import React, { useState } from 'react';
import { catatKasTransaksiAction } from '@/server/actions/keuangan.actions';
import { useToast } from '@/components/ui/toast';
import { X, ArrowDownRight, ArrowUpRight } from 'lucide-react';

import { Modal } from '@/components/ui/modal';

interface ModalCatatKasProps {
  onClose: () => void;
  onSuccess: () => void;
}

const KATEGORI_MASUK = [
  'SPP Siswa',
  'Pendaftaran Baru',
  'Penjualan Merchandise / Alat',
  'Donasi / Sponsor',
  'Kas Masuk Lainnya',
];

const KATEGORI_KELUAR = [
  'Sewa Kolam Renang',
  'Honor Pelatih',
  'Konsumsi & Transport',
  'Pembelian Alat / Sarana',
  'Perawatan & Kebersihan',
  'Operasional Kantor / Listrik',
  'Pengeluaran Lainnya',
];

export function ModalCatatKas({ onClose, onSuccess }: ModalCatatKasProps) {
  const toast = useToast();

  const [jenis, setJenis] = useState<'Masuk' | 'Keluar'>('Masuk');
  const [kategori, setKategori] = useState(KATEGORI_MASUK[0]);
  const [nominal, setNominal] = useState<number | ''>('');
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [lokasi, setLokasi] = useState('Pusat');
  const [metode, setMetode] = useState('Tunai');
  const [keterangan, setKeterangan] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJenisChange = (newJenis: 'Masuk' | 'Keluar') => {
    setJenis(newJenis);
    setKategori(newJenis === 'Masuk' ? KATEGORI_MASUK[0] : KATEGORI_KELUAR[0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nom = Number(nominal);
    if (!nom || nom <= 0) {
      toast.warning('Nominal transaksi harus lebih dari 0.');
      return;
    }

    setLoading(true);
    try {
      const res = await catatKasTransaksiAction({
        jenis_transaksi: jenis,
        kategori,
        nominal: nom,
        tanggal_transaksi: tanggal,
        lokasi,
        keterangan,
        metode_pembayaran: metode,
      });

      if (!res.success) {
        toast.error(res.error || 'Gagal menyimpan transaksi kas.');
        setLoading(false);
        return;
      }

      toast.success('Transaksi kas berhasil dicatat!');
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
      title="Catat Transaksi Kas"
      subtitle="Pencatatan kas masuk operasional atau kas keluar klub"
      maxWidth="md"
    >

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Switch Jenis Transaksi */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button
              type="button"
              onClick={() => handleJenisChange('Masuk')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid',
                borderColor: jenis === 'Masuk' ? 'var(--color-success)' : 'var(--border)',
                background: jenis === 'Masuk' ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-panel-soft)',
                color: jenis === 'Masuk' ? 'var(--color-success)' : 'var(--text-muted)',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <ArrowDownRight size={18} />
              Kas Masuk (Pemasukan)
            </button>

            <button
              type="button"
              onClick={() => handleJenisChange('Keluar')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid',
                borderColor: jenis === 'Keluar' ? 'var(--color-danger)' : 'var(--border)',
                background: jenis === 'Keluar' ? 'rgba(239, 68, 68, 0.15)' : 'var(--bg-panel-soft)',
                color: jenis === 'Keluar' ? 'var(--color-danger)' : 'var(--text-muted)',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <ArrowUpRight size={18} />
              Kas Keluar (Pengeluaran)
            </button>
          </div>

          {/* Kategori */}
          <div className="form-group">
            <label htmlFor="kategoriKas" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              Kategori Transaksi *
            </label>
            <select
              id="kategoriKas"
              value={kategori}
              onChange={(e) => setKategori(e.target.value)}
              required
              style={{ width: '100%', padding: '9px 12px' }}
            >
              {(jenis === 'Masuk' ? KATEGORI_MASUK : KATEGORI_KELUAR).map((kat) => (
                <option key={kat} value={kat}>
                  {kat}
                </option>
              ))}
            </select>
          </div>

          {/* Nominal */}
          <div className="form-group">
            <label htmlFor="nominalKas" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              Nominal (Rp) *
            </label>
            <input
              id="nominalKas"
              type="number"
              min="1000"
              step="1000"
              value={nominal}
              onChange={(e) => setNominal(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="Contoh: 150000"
              required
              style={{ width: '100%', padding: '9px 12px', fontSize: '1rem' }}
            />
          </div>

          {/* Tanggal & Metode */}
          <div className="modal-two-col">
            <div className="form-group">
              <label htmlFor="tglKas" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                Tanggal
              </label>
              <input
                id="tglKas"
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                required
                style={{ width: '100%', padding: '9px 12px' }}
              />
            </div>

            <div className="form-group">
              <label htmlFor="metodeKas" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                Metode Pembayaran
              </label>
              <select
                id="metodeKas"
                value={metode}
                onChange={(e) => setMetode(e.target.value)}
                style={{ width: '100%', padding: '9px 12px' }}
              >
                <option value="Tunai">Tunai</option>
                <option value="Transfer">Transfer Bank</option>
                <option value="QRIS">QRIS</option>
              </select>
            </div>
          </div>

          {/* Lokasi Kolam */}
          <div className="form-group">
            <label htmlFor="lokasiKas" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              Cabang / Lokasi Kolam
            </label>
            <input
              id="lokasiKas"
              type="text"
              value={lokasi}
              onChange={(e) => setLokasi(e.target.value)}
              placeholder="Pusat / Tirtamerta / Salsabila / dll"
              style={{ width: '100%', padding: '8px 12px' }}
            />
          </div>

          {/* Keterangan */}
          <div className="form-group">
            <label htmlFor="keteranganKas" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              Keterangan / Rincian
            </label>
            <input
              id="keteranganKas"
              type="text"
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              placeholder="Contoh: Pembayaran sewa jalur kolam minggu ke-2"
              style={{ width: '100%', padding: '8px 12px' }}
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="secondary"
              onClick={onClose}
              disabled={loading}
            >
              Batal
            </button>
            <button
              type="submit"
              className="primary"
              disabled={loading}
            >
              {loading ? 'Menyimpan...' : 'Simpan Transaksi'}
            </button>
          </div>
        </form>
    </Modal>
  );
}
