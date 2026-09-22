'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import {
  getRekapanSiswaAction,
  editSiswaAction,
  pindahKelasAction,
} from '@/server/actions/siswa.actions';
import { getPelatihAction } from '@/server/actions/pelatih.actions';
import { RekapanSiswaView, Pelatih, JenisKelamin, SiswaStatus } from '@/types/database';
import { DATA_LOKASI, DATA_PAKET } from '@/server/constants/master-data';
import { formatRupiah, formatTanggal } from '@/lib/utils';
import { Topbar } from '@/components/layout/topbar';
import { useToast } from '@/components/ui/toast';
import { SkeletonCard, SkeletonTable } from '@/components/ui/skeleton';

export default function RekapanSiswaPage() {
  const { profile, role } = useAuth();
  const toast = useToast();
  const [data, setData] = useState<RekapanSiswaView[]>([]);
  const [pelatihList, setPelatihList] = useState<Pelatih[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [filterLokasi, setFilterLokasi] = useState('');
  const [filterKelas, setFilterKelas] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPelatih, setFilterPelatih] = useState('');

  const [halamanSaatIni, setHalamanSaatIni] = useState(1);
  const [jumlahPerHalaman, setJumlahPerHalaman] = useState(10);

  const [detailItem, setDetailItem] = useState<RekapanSiswaView | null>(null);
  const [editItem, setEditItem] = useState<RekapanSiswaView | null>(null);
  const [pindahItem, setPindahItem] = useState<RekapanSiswaView | null>(null);

  const [editNamaLengkap, setEditNamaLengkap] = useState('');
  const [editNamaPanggilan, setEditNamaPanggilan] = useState('');
  const [editJenisKelamin, setEditJenisKelamin] = useState<JenisKelamin>('Laki-laki');
  const [editTempatLahir, setEditTempatLahir] = useState('');
  const [editTanggalLahir, setEditTanggalLahir] = useState('');
  const [editStatusSiswa, setEditStatusSiswa] = useState<SiswaStatus>('Aktif');
  const [editNamaWali, setEditNamaWali] = useState('');
  const [editNoHpWali, setEditNoHpWali] = useState('');
  const [editAlamat, setEditAlamat] = useState('');
  const [submittingEdit, setSubmittingEdit] = useState(false);

  // Pindah form state
  const [pindahLokasi, setPindahLokasi] = useState('');
  const [pindahKelas, setPindahKelas] = useState('');
  const [pindahPaket, setPindahPaket] = useState('');
  const [pindahHargaPaket, setPindahHargaPaket] = useState(0);
  const [pindahKuota, setPindahKuota] = useState(6);
  const [pindahPelatihPemilik, setPindahPelatihPemilik] = useState('');
  const [pindahPelatihDiminta, setPindahPelatihDiminta] = useState('');
  const [pindahBiayaRequest, setPindahBiayaRequest] = useState(0);
  const [pindahDiskon, setPindahDiskon] = useState(0);
  const [pindahAlasan, setPindahAlasan] = useState('');
  const [submittingPindah, setSubmittingPindah] = useState(false);

  const isPelatih = role === 'Pelatih';
  const canManage = role === 'Owner' || role === 'Admin';

  const loadData = async () => {
    setLoading(true);
    try {
      const [siswaRes, pelatihRes] = await Promise.all([
        getRekapanSiswaAction(),
        getPelatihAction(),
      ]);

      if (siswaRes.success && siswaRes.data) {
        setData(siswaRes.data);
      }
      if (pelatihRes.success && pelatihRes.data) {
        setPelatihList(pelatihRes.data);
      }
    } catch (err) {
      console.error('Failed to load rekapan siswa:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Keyboard shortcut: Escape to close any open modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDetailItem(null);
        setEditItem(null);
        setPindahItem(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filter logic identical to legacy
  const dataTampil = useMemo(() => {
    return data.filter((item) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchNama = (item.nama_lengkap || '').toLowerCase().includes(q);
        const matchId = (item.id_siswa || '').toLowerCase().includes(q);
        const matchWali = (item.nama_wali || '').toLowerCase().includes(q);
        if (!matchNama && !matchId && !matchWali) return false;
      }

      if (filterLokasi && item.lokasi !== filterLokasi) return false;
      if (filterKelas && item.kelas !== filterKelas) return false;

      if (filterStatus) {
        if (filterStatus === 'Aktif' && item.status_siswa !== 'Aktif') return false;
        if (filterStatus === 'Tidak Aktif' && item.status_siswa === 'Aktif') return false;
        if (filterStatus === 'Lunas' && item.status_pembayaran !== 'Lunas') return false;
        if (filterStatus === 'Belum Lunas' && item.status_pembayaran !== 'Belum Lunas')
          return false;
      }

      if (filterPelatih) {
        const coach = pelatihList.find((p) => p.id === filterPelatih);
        const coachName = coach ? coach.nama.toLowerCase() : '';
        const matchId =
          item.pelatih_pemilik_id === filterPelatih ||
          item.pelatih_diminta_id === filterPelatih;
        const matchName =
          coachName &&
          ((item.pelatih_pemilik || '').toLowerCase() === coachName ||
            (item.pelatih_diminta || '').toLowerCase() === coachName);
        if (!matchId && !matchName) return false;
      }

      return true;
    });
  }, [data, search, filterLokasi, filterKelas, filterStatus, filterPelatih, pelatihList]);

  // Stats: Agregat global sekolah (stabil, tidak fluktuatif saat filter/search dijalankan)
  const statTotal = data.length;
  const statAktif = data.filter((s) => s.status_siswa === 'Aktif').length;
  const statMenunggu = data.filter(
    (s) => s.status_pembayaran === 'Belum Lunas'
  ).length;
  const statNonAktif = data.filter((s) => s.status_siswa !== 'Aktif').length;
  const statLokasi = new Set(data.map((s) => s.lokasi).filter(Boolean)).size;
  const statKelas = new Set(data.map((s) => s.kelas).filter(Boolean)).size;

  // Pagination calculations
  const totalHalaman = Math.max(1, Math.ceil(dataTampil.length / jumlahPerHalaman));
  const currentPage = Math.min(halamanSaatIni, totalHalaman);
  const indexAwal = (currentPage - 1) * jumlahPerHalaman;
  const indexAkhir = indexAwal + jumlahPerHalaman;
  const currentItems = dataTampil.slice(indexAwal, indexAkhir);

  const handleResetFilter = () => {
    setSearch('');
    setFilterLokasi('');
    setFilterKelas('');
    setFilterStatus('');
    setFilterPelatih('');
    setHalamanSaatIni(1);
  };

  // Open Edit
  const openEditModal = (item: RekapanSiswaView) => {
    setDetailItem(null);
    setEditItem(item);
    setEditNamaLengkap(item.nama_lengkap || '');
    setEditNamaPanggilan(item.nama_panggilan || '');
    setEditJenisKelamin((item.jenis_kelamin as JenisKelamin) || 'Laki-laki');
    setEditTempatLahir(item.tempat_lahir || '');
    setEditTanggalLahir(item.tanggal_lahir || '');
    setEditStatusSiswa((item.status_siswa as SiswaStatus) || 'Aktif');
    setEditNamaWali(item.nama_wali || '');
    setEditNoHpWali(item.no_hp_wali || '');
    setEditAlamat(item.alamat || '');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem) return;
    setSubmittingEdit(true);
    try {
      const res = await editSiswaAction({
        siswa_id: editItem.id,
        nama_lengkap: editNamaLengkap,
        nama_panggilan: editNamaPanggilan || '',
        jenis_kelamin: editJenisKelamin,
        tempat_lahir: editTempatLahir || '',
        tanggal_lahir: editTanggalLahir || null,
        nama_wali: editNamaWali || '',
        no_hp_wali: editNoHpWali || '',
        alamat: editAlamat || '',
        status_siswa: editStatusSiswa,
      });

      if (!res.success) {
        toast.error(res.error || 'Gagal menyimpan perubahan.');
        return;
      }

      toast.success('Data siswa berhasil diperbarui.');
      setEditItem(null);
      await loadData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan sistem.';
      toast.error(message);
    } finally {
      setSubmittingEdit(false);
    }
  };

  // Open Pindah
  const openPindahModal = (item: RekapanSiswaView) => {
    setDetailItem(null);
    setPindahItem(item);
    setPindahLokasi('');
    setPindahKelas('');
    setPindahPaket('');
    setPindahHargaPaket(0);
    setPindahKuota(6);
    setPindahPelatihPemilik(item.pelatih_pemilik_id || '');
    setPindahPelatihDiminta('');
    setPindahBiayaRequest(0);
    setPindahDiskon(0);
    setPindahAlasan('');
  };

  const handlePindahLokasiChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setPindahLokasi(val);
    const kelasOpts = DATA_LOKASI[val] || [];
    if (kelasOpts.length > 0) {
      setPindahKelas(kelasOpts[0]);
      updatePindahPaketByKelas(kelasOpts[0]);
    } else {
      setPindahKelas('');
      setPindahPaket('');
    }
  };

  const updatePindahPaketByKelas = (k: string) => {
    const paketOpts = DATA_PAKET[k] || [];
    if (paketOpts.length > 0) {
      setPindahPaket(paketOpts[0].nama);
      setPindahHargaPaket(paketOpts[0].harga);
      setPindahKuota(paketOpts[0].kuota);
    } else {
      setPindahPaket('');
      setPindahHargaPaket(0);
      setPindahKuota(0);
    }
  };

  const handlePindahKelasChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setPindahKelas(val);
    updatePindahPaketByKelas(val);
  };

  const handlePindahPaketChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setPindahPaket(val);
    const list = DATA_PAKET[pindahKelas] || [];
    const found = list.find((p) => p.nama === val);
    if (found) {
      setPindahHargaPaket(found.harga);
      setPindahKuota(found.kuota);
    }
  };

  const handlePindahPelatihDimintaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setPindahPelatihDiminta(val);
    setPindahBiayaRequest(val ? 25000 : 0);
  };

  const pindahTotalTagihan = Math.max(0, pindahHargaPaket + pindahBiayaRequest - pindahDiskon);

  const handleSavePindah = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pindahItem) return;
    if (!pindahLokasi || !pindahKelas || !pindahPaket || !pindahPelatihPemilik) {
      toast.warning('Semua field wajib diisi.');
      return;
    }

    setSubmittingPindah(true);
    try {
      const res = await pindahKelasAction({
        siswa_id: pindahItem.id,
        paket_siswa_id: pindahItem.paket_siswa_id || pindahItem.id,
        lokasi_baru: pindahLokasi,
        kelas_baru: pindahKelas,
        paket_baru: pindahPaket,
        harga_paket_baru: pindahHargaPaket,
        kuota_total_baru: pindahKuota,
        pelatih_pemilik_baru: pindahPelatihPemilik || null,
        pelatih_diminta_baru: pindahPelatihDiminta || null,
        biaya_request_pelatih_baru: pindahBiayaRequest,
        diskon_baru: pindahDiskon,
        total_tagihan_baru: pindahTotalTagihan,
        alasan: pindahAlasan || 'Perubahan / kenaikan paket oleh Admin',
        diubah_oleh: displayName,
      });

      if (!res.success) {
        toast.error(res.error || 'Gagal memindahkan kelas siswa.');
        return;
      }

      toast.success('Kelas siswa berhasil dipindahkan.');
      setPindahItem(null);
      await loadData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan sistem.';
      toast.error(message);
    } finally {
      setSubmittingPindah(false);
    }
  };

  const displayName = profile?.nama_tampilan || profile?.username || 'Admin KESIT';

  return (
    <>
      {/* TOPBAR */}
      <Topbar
        title="Rekapan Siswa"
        breadcrumb={[{ label: 'Siswa' }, { label: 'Rekapan Siswa' }]}
      />

      {/* STATISTIK */}
      <section className="stats-grid">
        {loading ? (
          <SkeletonCard count={isPelatih ? 5 : 6} />
        ) : (
          <>
            <div className="stat-card">
              <div className="stat-icon blue">👥</div>
              <div>
                <strong id="statTotal">{statTotal}</strong>
                <span>Total Siswa</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon green">✓</div>
              <div>
                <strong id="statAktif">{statAktif}</strong>
                <span>Aktif</span>
              </div>
            </div>

            {!isPelatih && (
              <div className="stat-card" id="statMenungguCard">
                <div className="stat-icon orange">Rp</div>
                <div>
                  <strong id="statMenunggu">{statMenunggu}</strong>
                  <span>Menunggu Pembayaran</span>
                </div>
              </div>
            )}

            <div className="stat-card">
              <div className="stat-icon red">×</div>
              <div>
                <strong id="statNonAktif">{statNonAktif}</strong>
                <span>Non Aktif</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon dark">◎</div>
              <div>
                <strong id="statLokasi">{statLokasi}</strong>
                <span>Lokasi</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon dark">◇</div>
              <div>
                <strong id="statKelas">{statKelas}</strong>
                <span>Jenis Kelas</span>
              </div>
            </div>
          </>
        )}
      </section>

      {/* FILTER */}
      <section className="filter-section">
        <div className="filter-grid">
          <label className="filter-item-search">
            <span>Cari Siswa</span>
            <input
              type="text"
              id="searchInput"
              placeholder="Nama, ID, atau wali..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setHalamanSaatIni(1);
              }}
            />
          </label>

          <label>
            <span>Lokasi</span>
            <select
              id="filterLokasi"
              value={filterLokasi}
              onChange={(e) => {
                setFilterLokasi(e.target.value);
                setHalamanSaatIni(1);
              }}
            >
              <option value="">Semua Lokasi</option>
              {Object.keys(DATA_LOKASI).map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Kelas</span>
            <select
              id="filterKelas"
              value={filterKelas}
              onChange={(e) => {
                setFilterKelas(e.target.value);
                setHalamanSaatIni(1);
              }}
            >
              <option value="">Semua Kelas</option>
              <option value="Reguler">Reguler</option>
              <option value="Private">Private</option>
              <option value="Prestasi">Prestasi</option>
            </select>
          </label>

          <label>
            <span>Status</span>
            <select
              id="filterStatus"
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setHalamanSaatIni(1);
              }}
            >
              <option value="">Semua Status</option>
              <option value="Aktif">Aktif</option>
              <option value="Tidak Aktif">Non Aktif</option>
              {!isPelatih && (
                <>
                  <option value="Lunas">Pembayaran Lunas</option>
                  <option value="Belum Lunas">Belum Lunas</option>
                </>
              )}
            </select>
          </label>

          {!isPelatih && (
            <label>
              <span>Pelatih</span>
              <select
                id="filterPelatih"
                value={filterPelatih}
                onChange={(e) => {
                  setFilterPelatih(e.target.value);
                  setHalamanSaatIni(1);
                }}
              >
                <option value="">Semua Pelatih</option>
                {pelatihList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nama}
                  </option>
                ))}
              </select>
            </label>
          )}

          <div className="filter-buttons">
            <button type="button" id="btnReset" className="btn reset" onClick={handleResetFilter}>
              Reset Filter
            </button>
          </div>
        </div>

        <div className="filter-toolbar">
          <div className="results-counter">
            Menampilkan <strong>{dataTampil.length}</strong> dari {data.length} siswa
          </div>

          {canManage && (
            <Link href="/siswa/pendaftaran" className="btn tambah">
              + Tambah Siswa
            </Link>
          )}
        </div>
      </section>

      {/* TABEL SISWA */}
      <section className="table-card">
        <div className="table-wrapper">
          <table className="compact-student-table">
            <thead>
              <tr>
                <th>Nama Siswa</th>
                <th>Paket</th>
                <th>Kuota</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>

            <tbody id="tableBody">
              {loading ? (
                <SkeletonTable rows={6} cols={5} />
              ) : currentItems.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div id="emptyState" className="empty-state">
                      <h3>Belum ada data siswa</h3>
                      <p>Silakan lakukan pendaftaran siswa terlebih dahulu.</p>
                      {canManage && (
                        <Link href="/siswa/pendaftaran" className="btn tambah">
                          + Daftarkan Siswa
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                currentItems.map((siswa) => {
                  const kuotaTotal = Number(siswa.kuota_total || 0);
                  const kuotaTerpakai = Number(siswa.kuota_terpakai || 0);
                  const sisaKuota = Math.max(kuotaTotal - kuotaTerpakai, 0);
                  const persentase =
                    kuotaTotal > 0 ? Math.min((kuotaTerpakai / kuotaTotal) * 100, 100) : 0;

                  return (
                    <tr key={siswa.id}>
                      <td>
                        <div className="student-name">{siswa.nama_lengkap}</div>
                        <div className="student-sub">{siswa.id_siswa || '-'}</div>
                      </td>

                      <td>
                        <div className="package-name">{siswa.nama_paket || '-'}</div>
                        <div className="student-sub">{siswa.lokasi || '-'}</div>
                      </td>

                      <td>
                        <div className="quota-box compact">
                          <div className="quota-text">
                            Sisa {sisaKuota} / {kuotaTotal}
                          </div>
                          <div className="quota-bar">
                            <div className="quota-progress" style={{ width: `${persentase}%` }}></div>
                          </div>
                        </div>
                      </td>

                      <td>
                        {siswa.status_siswa === 'Aktif' ? (
                          <span className="status-badge badge-green">Aktif</span>
                        ) : (
                          <span className="status-badge badge-red">Non Aktif</span>
                        )}
                      </td>

                      <td>
                        <div className="action-buttons">
                          <button
                            type="button"
                            className="detail-button"
                            onClick={() => setDetailItem(siswa)}
                          >
                            Detail
                          </button>
                          {canManage && (
                            <>
                              <button
                                type="button"
                                className="edit-button"
                                onClick={() => openEditModal(siswa)}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="pindah-button"
                                onClick={() => openPindahModal(siswa)}
                              >
                                Naik / Pindah
                              </button>
                            </>
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

        {/* PAGINATION */}
        <div className="table-footer">
          <div className="rows-info">
            <select
              id="rowsPerPage"
              value={jumlahPerHalaman}
              onChange={(e) => {
                setJumlahPerHalaman(Number(e.target.value));
                setHalamanSaatIni(1);
              }}
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </select>

            <span id="tableInfo">
              Menampilkan {statTotal > 0 ? indexAwal + 1 : 0} -{' '}
              {Math.min(indexAkhir, dataTampil.length)} dari {dataTampil.length} siswa
            </span>
          </div>

          <div id="pagination" className="pagination">
            <button
              type="button"
              className="page-button"
              disabled={currentPage <= 1}
              onClick={() => setHalamanSaatIni((p) => Math.max(1, p - 1))}
            >
              ‹
            </button>

            {Array.from({ length: totalHalaman }, (_, i) => i + 1)
              .slice(Math.max(0, currentPage - 3), Math.min(totalHalaman, currentPage + 2))
              .map((page) => (
                <button
                  key={page}
                  type="button"
                  className={`page-button ${page === currentPage ? 'active' : ''}`}
                  onClick={() => setHalamanSaatIni(page)}
                >
                  {page}
                </button>
              ))}

            <button
              type="button"
              className="page-button"
              disabled={currentPage >= totalHalaman}
              onClick={() => setHalamanSaatIni((p) => Math.min(totalHalaman, p + 1))}
            >
              ›
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div>
          <strong>KESIT Management</strong>
          <span>Sistem Manajemen Klub Renang</span>
        </div>
        <div>v1.0 &nbsp; | &nbsp; 2026</div>
      </footer>

      {/* =====================================================
           MODAL DETAIL SISWA
      ====================================================== */}
      {detailItem && (
        <div id="detailModal" className="modal">
          <div className="modal-backdrop" onClick={() => setDetailItem(null)}></div>

          <div className="modal-content">
            <div className="modal-header">
              <div>
                <span className="modal-label">DETAIL SISWA</span>
                <h2 id="detailNama">{detailItem.nama_lengkap}</h2>
                <p id="detailId">{detailItem.id_siswa}</p>
              </div>

              <button
                type="button"
                id="btnCloseModal"
                className="close-button"
                onClick={() => setDetailItem(null)}
              >
                ×
              </button>
            </div>

            <div className="detail-grid">
              {/* BIODATA */}
              <section className="detail-card">
                <h3>Biodata Siswa</h3>
                <div className="detail-list">
                  <div>
                    <span>Nama Lengkap</span>
                    <strong id="dNamaLengkap">{detailItem.nama_lengkap || '-'}</strong>
                  </div>
                  <div>
                    <span>Nama Panggilan</span>
                    <strong id="dNamaPanggilan">{detailItem.nama_panggilan || '-'}</strong>
                  </div>
                  <div>
                    <span>Jenis Kelamin</span>
                    <strong id="dGender">{detailItem.jenis_kelamin || '-'}</strong>
                  </div>
                  <div>
                    <span>Tempat Lahir</span>
                    <strong id="dTempatLahir">{detailItem.tempat_lahir || '-'}</strong>
                  </div>
                  <div>
                    <span>Tanggal Lahir</span>
                    <strong id="dTanggalLahir">
                      {detailItem.tanggal_lahir ? formatTanggal(detailItem.tanggal_lahir) : '-'}
                    </strong>
                  </div>
                  <div>
                    <span>Tanggal Daftar</span>
                    <strong id="dTanggalDaftar">
                      {detailItem.tanggal_daftar ? formatTanggal(detailItem.tanggal_daftar) : '-'}
                    </strong>
                  </div>
                  <div>
                    <span>Status Siswa</span>
                    <strong id="dStatusSiswa">{detailItem.status_siswa}</strong>
                  </div>
                </div>
              </section>

              {/* WALI */}
              <section className="detail-card">
                <h3>Data Wali</h3>
                <div className="detail-list">
                  <div>
                    <span>Nama Wali</span>
                    <strong id="dNamaWali">{detailItem.nama_wali || '-'}</strong>
                  </div>
                  <div>
                    <span>WhatsApp</span>
                    <strong id="dWhatsapp">{detailItem.no_hp_wali || '-'}</strong>
                  </div>
                  <div>
                    <span>Alamat</span>
                    <strong id="dAlamat">{detailItem.alamat || '-'}</strong>
                  </div>
                </div>
              </section>

              {/* KELAS */}
              <section className="detail-card">
                <h3>Kelas & Pelatih</h3>
                <div className="detail-list">
                  <div>
                    <span>Lokasi</span>
                    <strong id="dLokasi">{detailItem.lokasi || '-'}</strong>
                  </div>
                  <div>
                    <span>Kelas</span>
                    <strong id="dKelas">{detailItem.kelas || '-'}</strong>
                  </div>
                  <div>
                    <span>Paket</span>
                    <strong id="dPaket">{detailItem.nama_paket || '-'}</strong>
                  </div>
                  <div>
                    <span>Pelatih Pemilik</span>
                    <strong id="dPelatihPemilik">{detailItem.pelatih_pemilik || '-'}</strong>
                  </div>
                  <div>
                    <span>Pelatih Diminta</span>
                    <strong id="dPelatihDiminta">{detailItem.pelatih_diminta || '-'}</strong>
                  </div>
                  <div>
                    <span>Kuota Paket</span>
                    <strong id="dKuota">
                      {detailItem.kuota_terpakai} / {detailItem.kuota_total} Sesi
                    </strong>
                  </div>
                </div>
              </section>

              {/* PEMBAYARAN */}
              {!isPelatih && (
                <section className="detail-card" id="detailPembayaranSection">
                  <h3>Pembayaran</h3>
                  <div className="detail-list">
                    <div>
                      <span>Harga Paket</span>
                      <strong id="dHarga">{formatRupiah(detailItem.harga_paket)}</strong>
                    </div>
                    <div>
                      <span>Biaya Request</span>
                      <strong id="dRequest">
                        {formatRupiah(detailItem.biaya_request_pelatih)}
                      </strong>
                    </div>
                    <div>
                      <span>Diskon</span>
                      <strong id="dDiskon">{formatRupiah(detailItem.diskon)}</strong>
                    </div>
                    <div>
                      <span>Total Tagihan</span>
                      <strong id="dTotal">{formatRupiah(detailItem.total_tagihan)}</strong>
                    </div>
                    <div>
                      <span>Dibayar</span>
                      <strong id="dDibayar">{formatRupiah(detailItem.nominal_dibayar)}</strong>
                    </div>
                    <div>
                      <span>Sisa Tagihan</span>
                      <strong id="dSisa">{formatRupiah(detailItem.sisa_tagihan)}</strong>
                    </div>
                    <div>
                      <span>Status Pembayaran</span>
                      <strong id="dStatusPembayaran">{detailItem.status_pembayaran}</strong>
                    </div>
                    <div>
                      <span>Metode Pembayaran</span>
                      <strong id="dMetode">{detailItem.metode_pembayaran || '-'}</strong>
                    </div>
                    <div>
                      <span>Admin Penerima</span>
                      <strong id="dAdmin">{detailItem.admin_penerima || '-'}</strong>
                    </div>
                  </div>
                </section>
              )}
            </div>

            <div className="detail-actions">
              {canManage && (
                <>
                  <button
                    type="button"
                    className="detail-action"
                    id="btnEditDariDetail"
                    onClick={() => openEditModal(detailItem)}
                  >
                    Edit Biodata
                  </button>

                  <button
                    type="button"
                    className="detail-action"
                    id="btnPindahDariDetail"
                    onClick={() => openPindahModal(detailItem)}
                  >
                    Naik / Pindah Kelas
                  </button>
                </>
              )}

              <button
                type="button"
                className="detail-action"
                onClick={() => setDetailItem(null)}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
           MODAL EDIT BIODATA
      ====================================================== */}
      {editItem && (
        <div id="editModal" className="modal">
          <div className="modal-backdrop" onClick={() => setEditItem(null)}></div>

          <div className="modal-content modal-form-content">
            <div className="modal-header">
              <div>
                <span className="modal-label">EDIT BIODATA</span>
                <h2>Edit Data Siswa</h2>
                <p id="editInfoSiswa">
                  {editItem.nama_lengkap} ({editItem.id_siswa})
                </p>
              </div>

              <button
                type="button"
                id="btnCloseEdit"
                className="close-button"
                onClick={() => setEditItem(null)}
              >
                ×
              </button>
            </div>

            <form id="formEditSiswa" onSubmit={handleSaveEdit}>
              <div className="form-section">
                <h3>Biodata Siswa</h3>
                <div className="form-grid">
                  <label className="form-field">
                    <span>ID Siswa</span>
                    <input type="text" id="editIdSiswa" value={editItem.id_siswa} readOnly />
                  </label>

                  <label className="form-field">
                    <span>Nama Lengkap *</span>
                    <input
                      type="text"
                      id="editNamaLengkap"
                      required
                      value={editNamaLengkap}
                      onChange={(e) => setEditNamaLengkap(e.target.value)}
                    />
                  </label>

                  <label className="form-field">
                    <span>Nama Panggilan</span>
                    <input
                      type="text"
                      id="editNamaPanggilan"
                      value={editNamaPanggilan}
                      onChange={(e) => setEditNamaPanggilan(e.target.value)}
                    />
                  </label>

                  <label className="form-field">
                    <span>Jenis Kelamin *</span>
                    <select
                      id="editJenisKelamin"
                      required
                      value={editJenisKelamin}
                      onChange={(e) => setEditJenisKelamin(e.target.value as JenisKelamin)}
                    >
                      <option value="Laki-laki">Laki-laki</option>
                      <option value="Perempuan">Perempuan</option>
                    </select>
                  </label>

                  <label className="form-field">
                    <span>Tempat Lahir</span>
                    <input
                      type="text"
                      id="editTempatLahir"
                      value={editTempatLahir}
                      onChange={(e) => setEditTempatLahir(e.target.value)}
                    />
                  </label>

                  <label className="form-field">
                    <span>Tanggal Lahir</span>
                    <input
                      type="date"
                      id="editTanggalLahir"
                      value={editTanggalLahir}
                      onChange={(e) => setEditTanggalLahir(e.target.value)}
                    />
                  </label>

                  <label className="form-field">
                    <span>Status Siswa *</span>
                    <select
                      id="editStatusSiswa"
                      required
                      value={editStatusSiswa}
                      onChange={(e) => setEditStatusSiswa(e.target.value as SiswaStatus)}
                    >
                      <option value="Aktif">Aktif</option>
                      <option value="Nonaktif">Tidak Aktif</option>
                      <option value="Cuti">Cuti</option>
                    </select>
                  </label>
                </div>
              </div>

              <div className="form-section">
                <h3>Data Wali</h3>
                <div className="form-grid">
                  <label className="form-field">
                    <span>Nama Wali</span>
                    <input
                      type="text"
                      id="editNamaWali"
                      value={editNamaWali}
                      onChange={(e) => setEditNamaWali(e.target.value)}
                    />
                  </label>

                  <label className="form-field">
                    <span>No. WhatsApp</span>
                    <input
                      type="text"
                      id="editNoHpWali"
                      value={editNoHpWali}
                      onChange={(e) => setEditNoHpWali(e.target.value)}
                    />
                  </label>

                  <label className="form-field full">
                    <span>Alamat</span>
                    <textarea
                      id="editAlamat"
                      rows={3}
                      value={editAlamat}
                      onChange={(e) => setEditAlamat(e.target.value)}
                    ></textarea>
                  </label>
                </div>
              </div>

              <div className="modal-form-actions">
                <button
                  type="button"
                  id="btnBatalEdit"
                  className="btn secondary"
                  onClick={() => setEditItem(null)}
                >
                  Batal
                </button>

                <button
                  type="submit"
                  id="btnSimpanEdit"
                  className="btn save"
                  disabled={submittingEdit}
                >
                  {submittingEdit ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================
           MODAL NAIK / PINDAH KELAS
      ====================================================== */}
      {pindahItem && (
        <div id="pindahModal" className="modal">
          <div className="modal-backdrop" onClick={() => setPindahItem(null)}></div>

          <div className="modal-content modal-form-content">
            <div className="modal-header">
              <div>
                <span className="modal-label">PERUBAHAN KELAS</span>
                <h2>Naik / Pindah Kelas</h2>
                <p id="pindahInfoSiswa">
                  {pindahItem.nama_lengkap} ({pindahItem.id_siswa})
                </p>
              </div>

              <button
                type="button"
                id="btnClosePindah"
                className="close-button"
                onClick={() => setPindahItem(null)}
              >
                ×
              </button>
            </div>

            <form id="formPindahKelas" onSubmit={handleSavePindah}>
              {/* DATA SEBELUM */}
              <div className="form-section">
                <h3>Data Sekarang</h3>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
                    gap: '12px',
                  }}
                >
                  <div style={{ background: '#13161b', padding: '10px 14px', borderRadius: '10px' }}>
                    <span style={{ color: 'var(--muted)', fontSize: '12px', display: 'block' }}>Lokasi</span>
                    <strong>{pindahItem.lokasi || '-'}</strong>
                  </div>
                  <div style={{ background: '#13161b', padding: '10px 14px', borderRadius: '10px' }}>
                    <span style={{ color: 'var(--muted)', fontSize: '12px', display: 'block' }}>Kelas</span>
                    <strong>{pindahItem.kelas || '-'}</strong>
                  </div>
                  <div style={{ background: '#13161b', padding: '10px 14px', borderRadius: '10px' }}>
                    <span style={{ color: 'var(--muted)', fontSize: '12px', display: 'block' }}>Paket</span>
                    <strong>{pindahItem.nama_paket || '-'}</strong>
                  </div>
                  <div style={{ background: '#13161b', padding: '10px 14px', borderRadius: '10px' }}>
                    <span style={{ color: 'var(--muted)', fontSize: '12px', display: 'block' }}>Pelatih Pemilik</span>
                    <strong>{pindahItem.pelatih_pemilik || '-'}</strong>
                  </div>
                </div>
              </div>

              {/* DATA BARU */}
              <div className="form-section">
                <h3>Data Baru</h3>
                <div className="form-grid">
                  <label className="form-field">
                    <span>Lokasi Baru *</span>
                    <select
                      id="pindahLokasiBaru"
                      required
                      value={pindahLokasi}
                      onChange={handlePindahLokasiChange}
                    >
                      <option value="">Pilih Lokasi</option>
                      {Object.keys(DATA_LOKASI).map((loc) => (
                        <option key={loc} value={loc}>
                          {loc}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="form-field">
                    <span>Kelas Baru *</span>
                    <select
                      id="pindahKelasBaru"
                      required
                      value={pindahKelas}
                      onChange={handlePindahKelasChange}
                    >
                      <option value="">Pilih lokasi terlebih dahulu</option>
                      {(DATA_LOKASI[pindahLokasi] || []).map((k) => (
                        <option key={k} value={k}>
                          {k}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="form-field">
                    <span>Paket Baru *</span>
                    <select
                      id="pindahPaketBaru"
                      required
                      value={pindahPaket}
                      onChange={handlePindahPaketChange}
                    >
                      <option value="">Pilih kelas terlebih dahulu</option>
                      {(DATA_PAKET[pindahKelas] || []).map((p) => (
                        <option key={p.nama} value={p.nama}>
                          {p.nama}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="form-field">
                    <span>Pelatih Pemilik Baru *</span>
                    <select
                      id="pindahPelatihBaru"
                      required
                      value={pindahPelatihPemilik}
                      onChange={(e) => setPindahPelatihPemilik(e.target.value)}
                    >
                      <option value="">Pilih pelatih</option>
                      {pelatihList.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nama}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="form-field">
                    <span>Pelatih Diminta Baru</span>
                    <select
                      id="pindahPelatihDimintaBaru"
                      value={pindahPelatihDiminta}
                      onChange={handlePindahPelatihDimintaChange}
                    >
                      <option value="">Tidak Request Pelatih</option>
                      {pelatihList.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nama}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="form-field">
                    <span>Harga Paket</span>
                    <input
                      type="text"
                      id="pindahHargaBaru"
                      value={formatRupiah(pindahHargaPaket)}
                      readOnly
                    />
                  </label>

                  <label className="form-field">
                    <span>Kuota Pertemuan</span>
                    <input
                      type="text"
                      id="pindahKuotaBaru"
                      value={`${pindahKuota} Pertemuan`}
                      readOnly
                    />
                  </label>

                  <label className="form-field">
                    <span>Biaya Request</span>
                    <input
                      type="text"
                      id="pindahBiayaRequestBaru"
                      value={formatRupiah(pindahBiayaRequest)}
                      readOnly
                    />
                  </label>

                  <label className="form-field">
                    <span>Diskon</span>
                    <input
                      type="number"
                      id="pindahDiskonBaru"
                      min="0"
                      value={pindahDiskon}
                      onChange={(e) => setPindahDiskon(Number(e.target.value) || 0)}
                    />
                  </label>

                  <label className="form-field">
                    <span>Total Tagihan Baru</span>
                    <input
                      type="text"
                      id="pindahTotalTagihanBaru"
                      value={formatRupiah(pindahTotalTagihan)}
                      readOnly
                    />
                  </label>

                  <label className="form-field full">
                    <span>Alasan Perpindahan</span>
                    <textarea
                      id="pindahAlasan"
                      rows={3}
                      placeholder="Contoh: Siswa naik level ke Pra-Prestasi..."
                      value={pindahAlasan}
                      onChange={(e) => setPindahAlasan(e.target.value)}
                    ></textarea>
                  </label>
                </div>
              </div>

              <div className="modal-form-actions">
                <button
                  type="button"
                  id="btnBatalPindah"
                  className="btn secondary"
                  onClick={() => setPindahItem(null)}
                >
                  Batal
                </button>

                <button
                  type="submit"
                  id="btnSimpanPindah"
                  className="btn save"
                  disabled={submittingPindah}
                >
                  {submittingPindah ? 'Menyimpan...' : 'Simpan Perpindahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
