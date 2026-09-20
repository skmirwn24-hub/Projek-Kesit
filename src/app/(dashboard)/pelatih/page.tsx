'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import {
  getPelatihAction,
  createPelatihAction,
  updatePelatihAction,
} from '@/server/actions/pelatih.actions';
import { Pelatih, PelatihStatus } from '@/types/database';
import { formatTanggal } from '@/lib/utils';
import '@/styles/pelatih.css';

export default function PelatihPage() {
  const { profile, role } = useAuth();
  const [data, setData] = useState<Pelatih[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Modals
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailPelatih, setDetailPelatih] = useState<Pelatih | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [nama, setNama] = useState('');
  const [noHp, setNoHp] = useState('');
  const [email, setEmail] = useState('');
  const [alamat, setAlamat] = useState('');
  const [tanggalLahir, setTanggalLahir] = useState('');
  const [pendidikan, setPendidikan] = useState('');
  const [sertifikat, setSertifikat] = useState('');
  const [status, setStatus] = useState<PelatihStatus>('Aktif');
  const [tanggalMulaiTraining, setTanggalMulaiTraining] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canManage = role === 'Owner' || role === 'Admin';
  const displayName = profile?.nama_tampilan || profile?.username || 'Admin KESIT';

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getPelatihAction();
      if (res.success && res.data) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load coaches:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered data
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchNama = (item.nama || '').toLowerCase().includes(q);
        const matchHp = (item.no_hp || '').toLowerCase().includes(q);
        const matchEmail = (item.email || '').toLowerCase().includes(q);
        if (!matchNama && !matchHp && !matchEmail) return false;
      }
      if (filterStatus) {
        if (filterStatus === 'Aktif' && item.status !== 'Aktif') return false;
        if (filterStatus === 'Training' && item.status !== 'Training') return false;
        if (filterStatus === 'Nonaktif' && item.status !== 'Nonaktif') return false;
      }
      return true;
    });
  }, [data, search, filterStatus]);

  // Statistics
  const statTotal = data.length;
  const statAktif = data.filter((p) => p.status === 'Aktif').length;
  const statTraining = data.filter((p) => p.status === 'Training').length;
  const statNonAktif = data.filter((p) => p.status === 'Nonaktif').length;

  const handleOpenTambah = () => {
    setEditingId(null);
    setNama('');
    setNoHp('');
    setEmail('');
    setAlamat('');
    setTanggalLahir('');
    setPendidikan('');
    setSertifikat('');
    setStatus('Aktif');
    setTanggalMulaiTraining('');
    setFormModalOpen(true);
  };

  const handleOpenEdit = (pelatih: Pelatih) => {
    setDetailModalOpen(false);
    setEditingId(pelatih.id);
    setNama(pelatih.nama || '');
    setNoHp(pelatih.no_hp || '');
    setEmail(pelatih.email || '');
    setAlamat(pelatih.alamat || '');
    setTanggalLahir(pelatih.tanggal_lahir || '');
    setPendidikan(pelatih.pendidikan || '');
    setSertifikat(pelatih.sertifikat || '');
    setStatus(pelatih.status as PelatihStatus);
    setTanggalMulaiTraining(pelatih.tanggal_mulai_training || '');
    setFormModalOpen(true);
  };

  const handleOpenDetail = (pelatih: Pelatih) => {
    setDetailPelatih(pelatih);
    setDetailModalOpen(true);
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) {
      alert('Nama pelatih wajib diisi.');
      return;
    }

    setSubmitting(true);
    try {
      let tglBerakhir: string | undefined = undefined;
      if (status === 'Training' && tanggalMulaiTraining) {
        const d = new Date(tanggalMulaiTraining);
        d.setMonth(d.getMonth() + 3);
        tglBerakhir = d.toISOString().split('T')[0];
      }

      if (editingId) {
        const res = await updatePelatihAction({
          id: editingId,
          nama: nama.trim(),
          no_hp: noHp.trim() || '',
          email: email.trim() || undefined,
          alamat: alamat.trim() || '',
          tanggal_lahir: tanggalLahir || null,
          pendidikan: pendidikan.trim() || '',
          sertifikat: sertifikat.trim() || '',
          status,
          tanggal_mulai_training: status === 'Training' ? tanggalMulaiTraining || null : null,
          tanggal_berakhir_training: tglBerakhir || null,
        });

        if (!res.success) {
          alert(res.error || 'Gagal memperbarui data pelatih.');
          return;
        }

        alert('Data pelatih berhasil diperbarui.');
      } else {
        const res = await createPelatihAction({
          nama: nama.trim(),
          no_hp: noHp.trim() || '',
          email: email.trim() || undefined,
          alamat: alamat.trim() || '',
          tanggal_lahir: tanggalLahir || null,
          pendidikan: pendidikan.trim() || '',
          sertifikat: sertifikat.trim() || '',
          status,
          tanggal_mulai_training: status === 'Training' ? tanggalMulaiTraining || null : null,
          tanggal_berakhir_training: tglBerakhir || null,
        });

        if (!res.success) {
          alert(res.error || 'Gagal menambahkan pelatih.');
          return;
        }

        alert('Pelatih baru berhasil ditambahkan.');
      }

      setFormModalOpen(false);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* TOPBAR */}
      <header className="topbar">
        <div>
          <h1>Pelatih</h1>
          <p>Kelola data, status, dan masa training pelatih KESIT Management.</p>
        </div>

        <div className="topbar-actions">
          <div className="topbar-badge">{displayName}</div>

          {canManage && (
            <button
              type="button"
              className="primary-btn"
              id="btnTambahPelatih"
              onClick={handleOpenTambah}
            >
              + Tambah Pelatih
            </button>
          )}
        </div>
      </header>

      {/* STATS */}
      <section className="stats-grid">
        <div className="stat-card">
          <span>Total Pelatih</span>
          <strong id="statTotalPelatih">{statTotal}</strong>
        </div>

        <div className="stat-card">
          <span>Aktif</span>
          <strong id="statPelatihAktif">{statAktif}</strong>
        </div>

        <div className="stat-card">
          <span>Training</span>
          <strong id="statPelatihTraining">{statTraining}</strong>
        </div>

        <div className="stat-card">
          <span>Tidak Aktif</span>
          <strong id="statPelatihNonAktif">{statNonAktif}</strong>
        </div>
      </section>

      {/* PANEL */}
      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Daftar Pelatih</h2>
            <p>Data pelatih lama dapat diperbarui tanpa mengubah ID pelatih.</p>
          </div>
        </div>

        {/* FILTERS */}
        <div className="filters">
          <div className="filter-item search-item">
            <label htmlFor="searchPelatih">Cari Pelatih</label>
            <input
              type="text"
              id="searchPelatih"
              placeholder="Cari nama pelatih..."
              autoComplete="off"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="filter-item">
            <label htmlFor="filterStatus">Status</label>
            <select
              id="filterStatus"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">Semua Status</option>
              <option value="Aktif">Aktif</option>
              <option value="Training">Training</option>
              <option value="Nonaktif">Tidak Aktif</option>
            </select>
          </div>
        </div>

        {/* TABLE */}
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>Nama Pelatih</th>
                <th>Kontak</th>
                <th>Status</th>
                <th>Masa Training</th>
                <th>Siswa Milik</th>
                <th>Aksi</th>
              </tr>
            </thead>

            <tbody id="pelatihTableBody">
              {loading ? (
                <tr>
                  <td colSpan={7} className="loading-cell">
                    Memuat data pelatih...
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="empty-cell">
                    Tidak ada data pelatih.
                  </td>
                </tr>
              ) : (
                filteredData.map((pelatih, index) => {
                  let badgeClass = 'status-active';
                  let statusLabel = pelatih.status as string;
                  if (pelatih.status === 'Training') {
                    badgeClass = 'status-training';
                  } else if (pelatih.status === 'Nonaktif') {
                    badgeClass = 'status-inactive';
                    statusLabel = 'Tidak Aktif';
                  }

                  return (
                    <tr key={pelatih.id}>
                      <td>{index + 1}</td>
                      <td>
                        <div className="coach-name">{pelatih.nama}</div>
                        <span style={{ fontSize: '12px', color: '#9ba0a8' }}>{pelatih.id}</span>
                      </td>
                      <td>
                        <div className="contact-text">
                          <strong>{pelatih.no_hp || '-'}</strong>
                          <span>{pelatih.email || '-'}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`status-badge ${badgeClass}`}>{statusLabel}</span>
                      </td>
                      <td>
                        {pelatih.status === 'Training' && pelatih.tanggal_mulai_training ? (
                          <div className="training-text">
                            <strong>Mulai: {formatTanggal(pelatih.tanggal_mulai_training)}</strong>
                            <span>
                              Berakhir:{' '}
                              {pelatih.tanggal_berakhir_training
                                ? formatTanggal(pelatih.tanggal_berakhir_training)
                                : '-'}
                            </span>
                          </div>
                        ) : (
                          <span style={{ color: '#9ba0a8' }}>-</span>
                        )}
                      </td>
                      <td>
                        <span className="student-count">
                          {pelatih.total_siswa_milik ?? 0} Siswa
                        </span>
                      </td>
                      <td>
                        <div className="action-btns" style={{ display: 'flex', gap: '8px' }}>
                          <button
                            type="button"
                            className="secondary-btn"
                            style={{ minHeight: '34px', padding: '0 12px', fontSize: '13px' }}
                            onClick={() => handleOpenDetail(pelatih)}
                          >
                            Detail
                          </button>

                          {canManage && (
                            <button
                              type="button"
                              className="primary-btn"
                              style={{ minHeight: '34px', padding: '0 12px', fontSize: '13px' }}
                              onClick={() => handleOpenEdit(pelatih)}
                            >
                              Edit
                            </button>
                          )}
                        </div>
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
           MODAL TAMBAH / EDIT PELATIH
      ====================================================== */}
      {formModalOpen && (
        <div className="modal-backdrop" id="formModal" style={{ display: 'flex' }}>
          <div className="modal-card modal-form-card">
            <div className="modal-header">
              <div>
                <h2 id="formModalTitle">
                  {editingId ? 'Edit Data Pelatih' : 'Tambah Pelatih'}
                </h2>
                <p id="formModalSubtitle">
                  {editingId
                    ? 'Perbarui data pelatih KESIT Management.'
                    : 'Masukkan data pelatih KESIT Management.'}
                </p>
              </div>

              <button
                type="button"
                className="modal-close"
                id="closeFormModalBtn"
                onClick={() => setFormModalOpen(false)}
              >
                ×
              </button>
            </div>

            <form id="formPelatih" onSubmit={handleSaveForm}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group full">
                    <label htmlFor="namaPelatih">Nama Pelatih *</label>
                    <input
                      type="text"
                      id="namaPelatih"
                      placeholder="Nama lengkap pelatih"
                      required
                      value={nama}
                      onChange={(e) => setNama(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="noHpPelatih">No. HP</label>
                    <input
                      type="text"
                      id="noHpPelatih"
                      placeholder="08xxxxxxxxxx"
                      value={noHp}
                      onChange={(e) => setNoHp(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="emailPelatih">Email</label>
                    <input
                      type="email"
                      id="emailPelatih"
                      placeholder="email@contoh.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  <div className="form-group full">
                    <label htmlFor="alamatPelatih">Alamat</label>
                    <textarea
                      id="alamatPelatih"
                      rows={3}
                      placeholder="Alamat lengkap pelatih"
                      value={alamat}
                      onChange={(e) => setAlamat(e.target.value)}
                    ></textarea>
                  </div>

                  <div className="form-group">
                    <label htmlFor="tanggalLahirPelatih">Tanggal Lahir</label>
                    <input
                      type="date"
                      id="tanggalLahirPelatih"
                      value={tanggalLahir}
                      onChange={(e) => setTanggalLahir(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="pendidikanPelatih">Pendidikan</label>
                    <input
                      type="text"
                      id="pendidikanPelatih"
                      placeholder="Contoh: S1 Pendidikan Olahraga"
                      value={pendidikan}
                      onChange={(e) => setPendidikan(e.target.value)}
                    />
                  </div>

                  <div className="form-group full">
                    <label htmlFor="sertifikatPelatih">Sertifikat</label>
                    <textarea
                      id="sertifikatPelatih"
                      rows={3}
                      placeholder="Contoh: Lisensi Renang, CPR / First Aid, Pelatih Nasional"
                      value={sertifikat}
                      onChange={(e) => setSertifikat(e.target.value)}
                    ></textarea>
                  </div>

                  <div className="form-group">
                    <label htmlFor="statusPelatih">Status Pelatih</label>
                    <select
                      id="statusPelatih"
                      required
                      value={status}
                      onChange={(e) => setStatus(e.target.value as PelatihStatus)}
                    >
                      <option value="Aktif">Aktif</option>
                      <option value="Training">Training</option>
                      <option value="Nonaktif">Tidak Aktif</option>
                    </select>
                  </div>

                  {status === 'Training' && (
                    <>
                      <div className="form-group" id="trainingDateGroup">
                        <label htmlFor="tanggalMulaiTraining">Tanggal Mulai Training</label>
                        <input
                          type="date"
                          id="tanggalMulaiTraining"
                          value={tanggalMulaiTraining}
                          onChange={(e) => setTanggalMulaiTraining(e.target.value)}
                        />
                      </div>

                      <div className="training-info full" id="trainingInfo">
                        <strong>Masa Training</strong>
                        <span id="trainingInfoText">
                          Training berlaku 3 bulan sejak tanggal mulai.
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="secondary-btn"
                  id="cancelFormBtn"
                  onClick={() => setFormModalOpen(false)}
                >
                  Batal
                </button>

                <button
                  type="submit"
                  className="primary-btn"
                  id="savePelatihBtn"
                  disabled={submitting}
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Pelatih'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================
           MODAL DETAIL PELATIH
      ====================================================== */}
      {detailModalOpen && detailPelatih && (
        <div className="modal-backdrop" id="detailModal" style={{ display: 'flex' }}>
          <div className="modal-card">
            <div className="modal-header">
              <div>
                <h2>Detail Pelatih</h2>
                <p id="detailNamaPelatih">{detailPelatih.nama}</p>
              </div>

              <button
                type="button"
                className="modal-close"
                id="closeDetailModalBtn"
                onClick={() => setDetailModalOpen(false)}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-box">
                  <span>Nama</span>
                  <strong id="detailNama">{detailPelatih.nama}</strong>
                </div>

                <div className="detail-box">
                  <span>Status</span>
                  <strong id="detailStatus">{detailPelatih.status}</strong>
                </div>

                <div className="detail-box">
                  <span>No. HP</span>
                  <strong id="detailNoHp">{detailPelatih.no_hp || '-'}</strong>
                </div>

                <div className="detail-box">
                  <span>Email</span>
                  <strong id="detailEmail">{detailPelatih.email || '-'}</strong>
                </div>

                <div className="detail-box">
                  <span>Tanggal Lahir</span>
                  <strong id="detailTanggalLahir">
                    {detailPelatih.tanggal_lahir ? formatTanggal(detailPelatih.tanggal_lahir) : '-'}
                  </strong>
                </div>

                <div className="detail-box">
                  <span>Pendidikan</span>
                  <strong id="detailPendidikan">{detailPelatih.pendidikan || '-'}</strong>
                </div>

                <div className="detail-box">
                  <span>Mulai Training</span>
                  <strong id="detailMulaiTraining">
                    {detailPelatih.tanggal_mulai_training
                      ? formatTanggal(detailPelatih.tanggal_mulai_training)
                      : '-'}
                  </strong>
                </div>

                <div className="detail-box">
                  <span>Berakhir Training</span>
                  <strong id="detailBerakhirTraining">
                    {detailPelatih.tanggal_berakhir_training
                      ? formatTanggal(detailPelatih.tanggal_berakhir_training)
                      : '-'}
                  </strong>
                </div>

                <div className="detail-box">
                  <span>Jumlah Siswa Milik</span>
                  <strong id="detailJumlahSiswa">{detailPelatih.total_siswa_milik ?? 0} Siswa</strong>
                </div>
              </div>

              <div className="detail-text-box">
                <span>Alamat</span>
                <p id="detailAlamat">{detailPelatih.alamat || '-'}</p>
              </div>

              <div className="detail-text-box">
                <span>Sertifikat</span>
                <p id="detailSertifikat">{detailPelatih.sertifikat || '-'}</p>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="secondary-btn"
                id="closeDetailFooterBtn"
                onClick={() => setDetailModalOpen(false)}
              >
                Tutup
              </button>

              {canManage && (
                <button
                  type="button"
                  className="primary-btn"
                  id="editFromDetailBtn"
                  onClick={() => handleOpenEdit(detailPelatih)}
                >
                  Edit Data
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
