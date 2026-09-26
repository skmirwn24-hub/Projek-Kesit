'use client';

import React, { useState } from 'react';
import { HonorKalkulasiPelatih } from '@/types/keuangan';
import { updateTarifHonorAction, cairkanHonorPelatihAction } from '@/server/actions/keuangan.actions';
import { formatRupiah } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';
import { Modal } from '@/components/ui/modal';
import { CheckCircle, Settings, DollarSign } from 'lucide-react';

interface ModalHonorProps {
  mode: 'tarif' | 'cairkan';
  honor: HonorKalkulasiPelatih;
  periodeStr: string; // format: 'YYYY-MM-01'
  onClose: () => void;
  onSuccess: () => void;
}

export function ModalHonor({ mode, honor, periodeStr, onClose, onSuccess }: ModalHonorProps) {
  const toast = useToast();

  // Mode tarif state
  const [tarifBaru, setTarifBaru] = useState<number | ''>(honor.tarif_dasar);
  const [kategoriKelas, setKategoriKelas] = useState<'Semua' | 'Reguler' | 'Private' | 'Prestasi'>('Semua');

  // Mode cairkan state
  const [penyesuaian, setPenyesuaian] = useState<number | ''>(0);
  const [catatan, setCatatan] = useState('');
  const [loading, setLoading] = useState(false);

  const nominalPenyesuaianNum = typeof penyesuaian === 'number' ? penyesuaian : 0;
  const nominalFinal = Math.max(0, honor.nominal_kalkulasi + nominalPenyesuaianNum);

  const handleSimpanTarif = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = Number(tarifBaru);
    if (t < 0) {
      toast.warning('Tarif per anak tidak boleh negatif.');
      return;
    }

    setLoading(true);
    try {
      const res = await updateTarifHonorAction({
        pelatih_id: honor.pelatih_id,
        kategori_kelas: kategoriKelas,
        tarif_per_anak: t,
        keterangan: `Diperbarui oleh Owner pada ${new Date().toLocaleDateString('id-ID')}`,
      });

      if (!res.success) {
        toast.error(res.error || 'Gagal menyimpan tarif honor.');
        setLoading(false);
        return;
      }

      toast.success(`Tarif honor untuk ${honor.nama_pelatih} berhasil disimpan!`);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCairkanHonor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (nominalFinal <= 0 && honor.total_siswa_diajar > 0) {
      toast.warning('Nominal final honor harus lebih dari 0.');
      return;
    }

    setLoading(true);
    try {
      const res = await cairkanHonorPelatihAction({
        pelatih_id: honor.pelatih_id,
        periode_bulan: periodeStr,
        total_siswa_diajar: honor.total_siswa_diajar,
        tarif_dasar: honor.tarif_dasar,
        nominal_kalkulasi: honor.nominal_kalkulasi,
        nominal_penyesuaian: nominalPenyesuaianNum,
        nominal_final: nominalFinal,
        catatan,
      });

      if (!res.success) {
        toast.error(res.error || 'Gagal mencairkan honor.');
        setLoading(false);
        return;
      }

      toast.success(`Honor untuk ${honor.nama_pelatih} berhasil dicairkan ke Buku Kas!`);
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
      title={mode === 'tarif' ? 'Atur Tarif Honor Pelatih' : 'Pencairan Honor ke Buku Kas'}
      subtitle={`Pelatih: ${honor.nama_pelatih} • Periode ${new Date(periodeStr).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}`}
      maxWidth="md"
    >
      {mode === 'tarif' ? (
          <form onSubmit={handleSimpanTarif} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="form-group">
              <label htmlFor="kategoriHonor" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                Kategori Kelas
              </label>
              <select
                id="kategoriHonor"
                value={kategoriKelas}
                onChange={(e) => setKategoriKelas(e.target.value as 'Semua' | 'Reguler' | 'Private' | 'Prestasi')}
                style={{ width: '100%', padding: '9px 12px' }}
              >
                <option value="Semua">Semua Kelas (Tarif Umum)</option>
                <option value="Reguler">Reguler</option>
                <option value="Private">Private</option>
                <option value="Prestasi">Prestasi</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="tarifInput" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                Tarif Dasar Per Anak Hadir (Rp) *
              </label>
              <input
                id="tarifInput"
                type="number"
                min="0"
                step="1000"
                value={tarifBaru}
                onChange={(e) => setTarifBaru(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="Contoh: 15000"
                required
                style={{ width: '100%', padding: '9px 12px', fontSize: '1rem' }}
              />
            </div>

            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', background: 'var(--bg-panel-soft)', padding: '10px 14px', borderRadius: '8px' }}>
              Tarif ini menjadi acuan perkalian jumlah absensi kehadiran siswa yang diajar oleh pelatih bersangkutan pada periode bulanan.
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
              <button type="button" className="secondary" onClick={onClose} disabled={loading}>
                Batal
              </button>
              <button type="submit" className="primary" disabled={loading}>
                {loading ? 'Menyimpan...' : 'Simpan Tarif'}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleCairkanHonor} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{
              background: 'var(--bg-panel-soft)',
              borderRadius: '8px',
              padding: '12px 14px',
              fontSize: '0.9rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Kehadiran Anak (Absensi):</span>
                <strong>{honor.total_siswa_diajar} kehadiran anak</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Tarif Per Anak:</span>
                <span>{formatRupiah(honor.tarif_dasar)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Kalkulasi Dasar:</span>
                <strong>{formatRupiah(honor.nominal_kalkulasi)}</strong>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="penyesuaianHonor" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                Penyesuaian / Bonus (+) atau Potongan (-)
              </label>
              <input
                id="penyesuaianHonor"
                type="number"
                step="5000"
                value={penyesuaian}
                onChange={(e) => setPenyesuaian(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="Contoh: 50000 atau -25000"
                style={{ width: '100%', padding: '9px 12px' }}
              />
            </div>

            <div className="form-group">
              <label htmlFor="catatanHonor" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                Keterangan / Catatan Pencairan
              </label>
              <input
                id="catatanHonor"
                type="text"
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Contoh: Termasuk bonus pelatih terbaik bulan ini"
                style={{ width: '100%', padding: '8px 12px' }}
              />
            </div>

            <div style={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '8px',
              padding: '12px 14px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-main)', fontWeight: 500 }}>
                Total Honor Dicairkan:
              </span>
              <strong style={{ fontSize: '1.15rem', color: 'var(--color-success)' }}>
                {formatRupiah(nominalFinal)}
              </strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px', flexWrap: 'wrap' }}>
              <button type="button" className="secondary" onClick={onClose} disabled={loading}>
                Batal
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{
                  background: 'var(--color-success)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '9px 18px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <CheckCircle size={16} />
                {loading ? 'Memproses...' : 'Setujui & Cairkan ke Buku Kas'}
              </button>
            </div>
          </form>
        )}
    </Modal>
  );
}
