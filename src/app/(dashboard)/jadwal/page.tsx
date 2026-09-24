'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useJadwal } from '@/hooks/use-jadwal';
import { usePelatih } from '@/hooks/use-pelatih';
import {
  createJadwalAction,
  updateJadwalAction,
  deleteJadwalAction,
} from '@/server/actions/jadwal.actions';
import { JadwalPelatihView, HariJadwal } from '@/types/database';
import { Topbar } from '@/components/layout/topbar';
import { useToast } from '@/components/ui/toast';
import { SkeletonCard, SkeletonTable } from '@/components/ui/skeleton';

const HARI_LIST: HariJadwal[] = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
const TEMPAT_LIST = [
  'Pandantoyo, Danau Biru Albanawi',
  'Baron, Cafe Fameliza',
  'Baron, Taman Ono Kabe',
] as const;
type TempatOption = (typeof TEMPAT_LIST)[number];

const KELAS_LIST = ['Reguler', 'Private', 'Prestasi'] as const;
type KelasOption = (typeof KELAS_LIST)[number];

const JAM_LIST = Array.from({ length: 10 }, (_, i) => {
  const jam = i + 7;
  return `${jam < 10 ? '0' : ''}${jam}:00`;
});

export default function JadwalPage() {
  const { profile, role } = useAuth();
  const toast = useToast();
  
  const { jadwal: data, isLoading: loading, mutateJadwal } = useJadwal();
  const { pelatih: pelatihData } = usePelatih();

  // Filters
  const [filterHari, setFilterHari] = useState<string>('');
  const [filterPelatih, setFilterPelatih] = useState<string>('');

  // Modals
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [pelatihId, setPelatihId] = useState('');
  const [hari, setHari] = useState<HariJadwal>('Senin');
  const [jamMulai, setJamMulai] = useState('07:00');
  const [tempat, setTempat] = useState<TempatOption>(TEMPAT_LIST[0]);
  const [kelas, setKelas] = useState<KelasOption>(KELAS_LIST[0]);
  const [submitting, setSubmitting] = useState(false);

  const isAdminOrOwner = role === 'Owner' || role === 'Admin';
  const currentPelatihId = profile?.pelatih_id;

  // Keyboard shortcut: Escape to close modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setFormModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filtered data
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      if (filterHari && item.hari !== filterHari) return false;
      if (filterPelatih && item.pelatih_id !== filterPelatih) return false;
      return true;
    });
  }, [data, filterHari, filterPelatih]);

  const handleOpenTambah = () => {
    setEditingId(null);
    setPelatihId(isAdminOrOwner ? '' : (currentPelatihId || ''));
    setHari('Senin');
    setJamMulai('07:00');
    setTempat(TEMPAT_LIST[0]);
    setKelas(KELAS_LIST[0]);
    setFormModalOpen(true);
  };

  const handleOpenEdit = (item: JadwalPelatihView) => {
    setEditingId(item.id);
    setPelatihId(item.pelatih_id);
    setHari(item.hari);
    setJamMulai(item.jam_mulai);
    setTempat(item.tempat as TempatOption);
    setKelas(item.kelas as KelasOption);
    setFormModalOpen(true);
  };

  const handleDelete = async (item: JadwalPelatihView) => {
    if (!confirm('Apakah Anda yakin ingin menghapus jadwal ini?')) return;
    
    try {
      const res = await deleteJadwalAction(item.id, item.pelatih_id);
      if (!res.success) {
        toast.error(res.error || 'Gagal menghapus jadwal.');
        return;
      }
      toast.success('Jadwal berhasil dihapus.');
      await mutateJadwal();
    } catch (err: unknown) {
      toast.error('Terjadi kesalahan sistem.');
    }
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pelatihId) {
      toast.warning('Silakan pilih pelatih.');
      return;
    }

    setSubmitting(true);
    try {
      if (editingId) {
        const jadwalItem = data.find((d) => d.id === editingId);
        const ownerPelatihId = jadwalItem?.pelatih_id || '';
        const res = await updateJadwalAction(
          editingId,
          {
            pelatih_id: pelatihId,
            hari,
            jam_mulai: jamMulai,
            tempat,
            kelas,
          },
          ownerPelatihId
        );

        if (!res.success) {
          toast.error(res.error || 'Gagal memperbarui jadwal.');
          return;
        }
        toast.success('Jadwal berhasil diperbarui.');
      } else {
        const res = await createJadwalAction({
          pelatih_id: pelatihId,
          hari,
          jam_mulai: jamMulai,
          tempat,
          kelas,
        });

        if (!res.success) {
          toast.error(res.error || 'Gagal menambahkan jadwal.');
          return;
        }
        toast.success('Jadwal baru berhasil ditambahkan.');
      }

      setFormModalOpen(false);
      await mutateJadwal();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan sistem.';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const calculateSelesai = (mulai: string) => {
    const [jam] = mulai.split(':');
    const sel = parseInt(jam, 10) + 1;
    return `${sel < 10 ? '0' : ''}${sel}:00`;
  };

  return (
    <>
      <Topbar
        title="Jadwal Pelatih"
        subtitle="Lihat dan kelola jadwal mengajar pelatih KESIT Management"
      />

      <section className="panel mt-6">
        <div
          className="panel-header"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div>
            <h2>Daftar Jadwal</h2>
            <p>Jadwal mingguan untuk semua pelatih yang terdaftar.</p>
          </div>

          <button
            type="button"
            className="btn-primary"
            onClick={handleOpenTambah}
          >
            + Tambah Jadwal
          </button>
        </div>

        {/* FILTERS */}
        <div className="filters">
          <div className="filter-item">
            <label htmlFor="filterHari">Hari</label>
            <select
              id="filterHari"
              value={filterHari}
              onChange={(e) => setFilterHari(e.target.value)}
            >
              <option value="">Semua Hari</option>
              {HARI_LIST.map((h) => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
          </div>

          <div className="filter-item">
            <label htmlFor="filterPelatih">Pelatih</label>
            <select
              id="filterPelatih"
              value={filterPelatih}
              onChange={(e) => setFilterPelatih(e.target.value)}
            >
              <option value="">Semua Pelatih</option>
              {pelatihData.map((p) => (
                <option key={p.id} value={p.id}>{p.nama}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="results-counter" style={{ fontSize: '13px', color: '#64748b', marginTop: '12px', padding: '0 4px' }}>
          Menampilkan <strong>{filteredData.length}</strong> jadwal
        </div>

        {/* TABLE */}
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>Hari</th>
                <th>Jam</th>
                <th>Pelatih</th>
                <th>Kelas</th>
                <th>Tempat</th>
                <th>Aksi</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <SkeletonTable rows={5} cols={7} />
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="empty-cell">
                    Tidak ada data jadwal.
                  </td>
                </tr>
              ) : (
                filteredData.map((item, index) => {
                  const canEdit = isAdminOrOwner || item.pelatih_id === currentPelatihId;
                  return (
                    <tr key={item.id}>
                      <td>{index + 1}</td>
                      <td><strong>{item.hari}</strong></td>
                      <td>
                        <div className="contact-text">
                          <strong>{item.jam_mulai} - {calculateSelesai(item.jam_mulai)}</strong>
                        </div>
                      </td>
                      <td>
                        <div className="coach-name">{item.nama_pelatih}</div>
                      </td>
                      <td>
                        <span className="status-badge" style={{ backgroundColor: '#eff6ff', color: '#1d4ed8' }}>
                          {item.kelas}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '13px' }}>{item.tempat}</span>
                      </td>
                      <td>
                        {canEdit && (
                          <div className="action-btns" style={{ display: 'flex', gap: '8px' }}>
                            <button
                              type="button"
                              className="secondary-btn"
                              style={{ minHeight: '34px', padding: '0 12px', fontSize: '13px' }}
                              onClick={() => handleOpenEdit(item)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="secondary-btn"
                              style={{ minHeight: '34px', padding: '0 12px', fontSize: '13px', color: '#ef4444', borderColor: '#fee2e2', backgroundColor: '#fef2f2' }}
                              onClick={() => handleDelete(item)}
                            >
                              Hapus
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* =====================================================
           MODAL TAMBAH / EDIT JADWAL
      ====================================================== */}
      {formModalOpen && (
        <div className="modal-backdrop" id="formModal" style={{ display: 'flex' }}>
          <div className="modal-card modal-form-card" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <div>
                <h2>{editingId ? 'Edit Jadwal' : 'Tambah Jadwal'}</h2>
                <p>Masukkan detail jadwal mengajar.</p>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setFormModalOpen(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSaveForm}>
              <div className="modal-body">
                <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
                  
                  <div className="form-group full">
                    <label htmlFor="inputPelatih">Pelatih *</label>
                    <select
                      id="inputPelatih"
                      required
                      value={pelatihId}
                      onChange={(e) => setPelatihId(e.target.value)}
                      disabled={!isAdminOrOwner && !!currentPelatihId}
                    >
                      <option value="" disabled>-- Pilih Pelatih --</option>
                      {pelatihData.map((p) => (
                        <option key={p.id} value={p.id}>{p.nama}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group full">
                    <label htmlFor="inputHari">Hari *</label>
                    <select
                      id="inputHari"
                      required
                      value={hari}
                      onChange={(e) => setHari(e.target.value as HariJadwal)}
                    >
                      {HARI_LIST.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group full">
                    <label htmlFor="inputJam">Jam Mulai (Durasi 60 Menit) *</label>
                    <select
                      id="inputJam"
                      required
                      value={jamMulai}
                      onChange={(e) => setJamMulai(e.target.value)}
                    >
                      {JAM_LIST.map((j) => (
                        <option key={j} value={j}>{j}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group full">
                    <label htmlFor="inputKelas">Kelas *</label>
                    <select
                      id="inputKelas"
                      required
                      value={kelas}
                      onChange={(e) => setKelas(e.target.value as KelasOption)}
                    >
                      {KELAS_LIST.map((k) => (
                        <option key={k} value={k}>{k}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group full">
                    <label htmlFor="inputTempat">Tempat *</label>
                    <select
                      id="inputTempat"
                      required
                      value={tempat}
                      onChange={(e) => setTempat(e.target.value as TempatOption)}
                    >
                      {TEMPAT_LIST.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => setFormModalOpen(false)}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="primary-btn"
                  disabled={submitting}
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Jadwal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
