'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import {
  getPenilaianAction,
  submitPenilaianAction,
} from '@/server/actions/penilaian.actions';
import { getPelatihAction } from '@/server/actions/pelatih.actions';
import { PenilaianPelatihView, Pelatih } from '@/types/database';
import { formatTanggal } from '@/lib/utils';
import { Topbar } from '@/components/layout/topbar';

export default function PenilaianPelatihPage() {
  const { profile, role } = useAuth();
  const [data, setData] = useState<PenilaianPelatihView[]>([]);
  const [pelatihList, setPelatihList] = useState<Pelatih[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [pelatihId, setPelatihId] = useState('');
  const [tanggalPenilaian, setTanggalPenilaian] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [kedisiplinan, setKedisiplinan] = useState<number | ''>('');
  const [kehadiran, setKehadiran] = useState<number | ''>('');
  const [kualitasMengajar, setKualitasMengajar] = useState<number | ''>('');
  const [komunikasi, setKomunikasi] = useState<number | ''>('');
  const [administrasiLaporan, setAdministrasiLaporan] = useState<number | ''>('');
  const [catatan, setCatatan] = useState('');

  // Pelanggaran & Sanksi
  const [kategoriPelanggaran, setKategoriPelanggaran] = useState('Tidak Ada');
  const [jenisSanksi, setJenisSanksi] = useState('Tidak Ada');
  const [detailPelanggaran, setDetailPelanggaran] = useState('');
  const [tanggalMulaiSanksi, setTanggalMulaiSanksi] = useState('');
  const [catatanSanksi, setCatatanSanksi] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Filters for History Table
  const [searchRiwayat, setSearchRiwayat] = useState('');
  const [filterSanksi, setFilterSanksi] = useState('');

  // Modal detail
  const [detailItem, setDetailItem] = useState<PenilaianPelatihView | null>(null);

  const canGrade = role === 'Owner' || role === 'Admin';
  const displayName = profile?.nama_tampilan || profile?.username || 'Admin KESIT';

  const loadData = async () => {
    setLoading(true);
    try {
      const [penilaianRes, pelatihRes] = await Promise.all([
        getPenilaianAction(),
        getPelatihAction(),
      ]);

      if (penilaianRes.success && penilaianRes.data) {
        setData(penilaianRes.data);
      }
      if (pelatihRes.success && pelatihRes.data) {
        const available = pelatihRes.data.filter((p) => p.status !== 'Nonaktif');
        setPelatihList(available);
      }
    } catch (err) {
      console.error('Failed to load penilaian:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Automatic Sanksi Calculations
  const sanksiCalculation = useMemo(() => {
    if (jenisSanksi === 'Tidak Ada') {
      return {
        durasiHari: 0,
        persentaseDenda: '0%',
        sesiTanpaHonor: '0 sesi',
      };
    }
    if (jenisSanksi === 'Teguran') {
      return {
        durasiHari: 30,
        persentaseDenda: '0%',
        sesiTanpaHonor: '0 sesi',
      };
    }
    if (jenisSanksi === 'SP-1') {
      return {
        durasiHari: 90,
        persentaseDenda: '20%',
        sesiTanpaHonor: '5 sesi',
      };
    }
    if (jenisSanksi === 'SP-2') {
      return {
        durasiHari: 180,
        persentaseDenda: '50%',
        sesiTanpaHonor: '10 sesi',
      };
    }
    if (jenisSanksi === 'SP-3') {
      return {
        durasiHari: 365,
        persentaseDenda: '100%',
        sesiTanpaHonor: 'Nonaktif',
      };
    }
    return {
      durasiHari: 0,
      persentaseDenda: '100%',
      sesiTanpaHonor: 'Putus Kerja Sama',
    };
  }, [jenisSanksi]);

  const tanggalBerakhirSanksi = useMemo(() => {
    if (!tanggalMulaiSanksi || sanksiCalculation.durasiHari === 0) return '-';
    const d = new Date(tanggalMulaiSanksi);
    d.setDate(d.getDate() + sanksiCalculation.durasiHari);
    return d.toISOString().split('T')[0];
  }, [tanggalMulaiSanksi, sanksiCalculation]);

  // Stats
  const statTotal = new Set(data.map((p) => p.pelatih_id)).size;
  const statMemenuhiKKM = data.filter((p) => (p.nilai_rata_rata ?? p.rata_rata ?? 0) >= 4.0).length;
  const statBelumKKM = data.filter((p) => (p.nilai_rata_rata ?? p.rata_rata ?? 0) < 4.0).length;
  const statSanksiAktif = data.filter((p) => {
    const s = p.status_sanksi || (p.jenis_sanksi && p.jenis_sanksi !== 'Tidak Ada' ? 'Aktif' : 'Tidak Ada');
    return s === 'Aktif' || s === 'Permanen';
  }).length;

  // Filtered Table Data
  const riwayatFiltered = useMemo(() => {
    return data.filter((item) => {
      if (searchRiwayat.trim()) {
        const q = searchRiwayat.toLowerCase();
        const matchName = (item.nama_pelatih || '').toLowerCase().includes(q);
        if (!matchName) return false;
      }
      if (filterSanksi) {
        const itemSanksi = item.jenis_sanksi || item.sanksi || 'Tidak Ada';
        if (filterSanksi === 'Tidak Ada' && itemSanksi !== 'Tidak Ada') return false;
        if (filterSanksi !== 'Tidak Ada' && itemSanksi !== filterSanksi) return false;
      }
      return true;
    });
  }, [data, searchRiwayat, filterSanksi]);

  const resetForm = () => {
    setPelatihId('');
    setKedisiplinan('');
    setKehadiran('');
    setKualitasMengajar('');
    setKomunikasi('');
    setAdministrasiLaporan('');
    setCatatan('');
    setKategoriPelanggaran('Tidak Ada');
    setJenisSanksi('Tidak Ada');
    setDetailPelanggaran('');
    setTanggalMulaiSanksi('');
    setCatatanSanksi('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pelatihId) {
      alert('Pilih pelatih terlebih dahulu.');
      return;
    }
    if (
      kedisiplinan === '' ||
      kehadiran === '' ||
      kualitasMengajar === '' ||
      komunikasi === '' ||
      administrasiLaporan === ''
    ) {
      alert('Semua aspek penilaian wajib diisi.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await submitPenilaianAction({
        pelatih_id: pelatihId,
        tanggal_penilaian: tanggalPenilaian,
        kedisiplinan: Number(kedisiplinan),
        kehadiran: Number(kehadiran),
        kualitas_mengajar: Number(kualitasMengajar),
        komunikasi: Number(komunikasi),
        administrasi_laporan: Number(administrasiLaporan),
        catatan: catatan.trim() || null,
        dinilai_oleh: 'Owner KESIT',
        diinput_oleh: displayName,
        kategori_pelanggaran: kategoriPelanggaran,
        detail_pelanggaran: detailPelanggaran.trim() || null,
        jenis_sanksi: jenisSanksi,
        tanggal_mulai_sanksi: jenisSanksi !== 'Tidak Ada' && tanggalMulaiSanksi ? tanggalMulaiSanksi : null,
        persentase_denda: parseFloat(sanksiCalculation.persentaseDenda) || 0,
        nominal_denda: 0,
        sesi_tanpa_honor: parseInt(sanksiCalculation.sesiTanpaHonor) || 0,
        catatan_sanksi: catatanSanksi.trim() || null,
        diputuskan_oleh: jenisSanksi !== 'Tidak Ada' ? 'Owner KESIT' : null,
      });

      if (!res.success) {
        alert(res.error || 'Gagal menyimpan penilaian.');
        return;
      }

      alert('Penilaian pelatih berhasil disimpan.');
      resetForm();
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
      <Topbar
        title="Penilaian Pelatih"
        subtitle="Penilaian, KKM, pelanggaran dan sanksi pelatih KESIT Management"
      />

      {/* STATISTIK */}
      <section className="stats-grid">
        <div className="stat-card">
          <span>Pelatih Pernah Dinilai</span>
          <strong id="statTotalPelatih">{statTotal}</strong>
        </div>

        <div className="stat-card">
          <span>Memenuhi KKM</span>
          <strong id="statMemenuhiKKM">{statMemenuhiKKM}</strong>
        </div>

        <div className="stat-card">
          <span>Belum Memenuhi KKM</span>
          <strong id="statBelumKKM">{statBelumKKM}</strong>
        </div>

        <div className="stat-card">
          <span>Sanksi Aktif</span>
          <strong id="statSanksiAktif">{statSanksiAktif}</strong>
        </div>
      </section>

      {/* FORM PENILAIAN */}
      {canGrade && (
        <section className="panel" style={{ marginBottom: '28px' }}>
          <div className="panel-header">
            <div>
              <h2>Form Penilaian Pelatih</h2>
              <p>
                Penilaian hanya berdasarkan keputusan Owner KESIT Management. Admin bertugas
                menginput hasil keputusan ke dalam sistem.
              </p>
            </div>
          </div>

          {/* INFORMASI OWNER */}
          <div className="owner-info">
            <div>
              <span>Penilai / Pengambil Keputusan</span>
              <strong>Sukma Irawan & Ari Setiawan</strong>
            </div>

            <div>
              <span>KKM Pelatih</span>
              <strong>4.00</strong>
            </div>

            <div>
              <span>Diinput Oleh</span>
              <strong id="adminInputInfo">{displayName}</strong>
            </div>
          </div>

          <form id="formPenilaian" className="form-grid" onSubmit={handleSubmit} onReset={resetForm}>
            {/* DATA PENILAIAN */}
            <div className="section-title full">
              <h3>Data Penilaian</h3>
              <p>Pilih pelatih dan tanggal penilaian.</p>
            </div>

            <div className="form-group full">
              <label htmlFor="pelatihId">Pilih Pelatih *</label>
              <select
                id="pelatihId"
                required
                value={pelatihId}
                onChange={(e) => setPelatihId(e.target.value)}
              >
                <option value="">Pilih pelatih...</option>
                {pelatihList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nama} ({p.status})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="tanggalPenilaian">Tanggal Penilaian *</label>
              <input
                type="date"
                id="tanggalPenilaian"
                required
                value={tanggalPenilaian}
                onChange={(e) => setTanggalPenilaian(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>KKM</label>
              <input type="text" value="4.00" readOnly />
            </div>

            {/* ASPEK PENILAIAN */}
            <div className="section-title full">
              <h3>Aspek Penilaian</h3>
              <p>
                1 = Sangat Kurang, 2 = Kurang, 3 = Cukup, 4 = Baik, 5 = Sangat Baik
              </p>
            </div>

            <div className="form-group">
              <label htmlFor="kedisiplinan">Kedisiplinan *</label>
              <select
                id="kedisiplinan"
                required
                value={kedisiplinan}
                onChange={(e) => setKedisiplinan(Number(e.target.value) || '')}
              >
                <option value="">Pilih nilai</option>
                <option value="1">1 - Sangat Kurang</option>
                <option value="2">2 - Kurang</option>
                <option value="3">3 - Cukup</option>
                <option value="4">4 - Baik</option>
                <option value="5">5 - Sangat Baik</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="kehadiran">Kehadiran *</label>
              <select
                id="kehadiran"
                required
                value={kehadiran}
                onChange={(e) => setKehadiran(Number(e.target.value) || '')}
              >
                <option value="">Pilih nilai</option>
                <option value="1">1 - Sangat Kurang</option>
                <option value="2">2 - Kurang</option>
                <option value="3">3 - Cukup</option>
                <option value="4">4 - Baik</option>
                <option value="5">5 - Sangat Baik</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="kualitasMengajar">Kualitas Mengajar *</label>
              <select
                id="kualitasMengajar"
                required
                value={kualitasMengajar}
                onChange={(e) => setKualitasMengajar(Number(e.target.value) || '')}
              >
                <option value="">Pilih nilai</option>
                <option value="1">1 - Sangat Kurang</option>
                <option value="2">2 - Kurang</option>
                <option value="3">3 - Cukup</option>
                <option value="4">4 - Baik</option>
                <option value="5">5 - Sangat Baik</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="komunikasi">Komunikasi *</label>
              <select
                id="komunikasi"
                required
                value={komunikasi}
                onChange={(e) => setKomunikasi(Number(e.target.value) || '')}
              >
                <option value="">Pilih nilai</option>
                <option value="1">1 - Sangat Kurang</option>
                <option value="2">2 - Kurang</option>
                <option value="3">3 - Cukup</option>
                <option value="4">4 - Baik</option>
                <option value="5">5 - Sangat Baik</option>
              </select>
            </div>

            <div className="form-group full">
              <label htmlFor="administrasiLaporan">Administrasi / Laporan *</label>
              <select
                id="administrasiLaporan"
                required
                value={administrasiLaporan}
                onChange={(e) => setAdministrasiLaporan(Number(e.target.value) || '')}
              >
                <option value="">Pilih nilai</option>
                <option value="1">1 - Sangat Kurang</option>
                <option value="2">2 - Kurang</option>
                <option value="3">3 - Cukup</option>
                <option value="4">4 - Baik</option>
                <option value="5">5 - Sangat Baik</option>
              </select>
            </div>

            <div className="form-group full">
              <label htmlFor="catatan">Catatan Penilaian</label>
              <textarea
                id="catatan"
                rows={4}
                placeholder="Catatan evaluasi dari Owner..."
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
              ></textarea>
            </div>

            {/* PELANGGARAN */}
            <div className="section-title full">
              <h3>Pelanggaran</h3>
              <p>Seluruh catatan pelanggaran tetap tersimpan permanen dalam sistem.</p>
            </div>

            <div className="form-group">
              <label htmlFor="kategoriPelanggaran">Kategori Pelanggaran</label>
              <select
                id="kategoriPelanggaran"
                value={kategoriPelanggaran}
                onChange={(e) => setKategoriPelanggaran(e.target.value)}
              >
                <option value="Tidak Ada">Tidak Ada</option>
                <option value="Ringan">Ringan</option>
                <option value="Sedang">Sedang</option>
                <option value="Berat">Berat</option>
                <option value="Sangat Berat">Sangat Berat</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="jenisSanksi">Keputusan Sanksi Owner</label>
              <select
                id="jenisSanksi"
                value={jenisSanksi}
                onChange={(e) => setJenisSanksi(e.target.value)}
              >
                <option value="Tidak Ada">Tidak Ada</option>
                <option value="Teguran">Teguran</option>
                <option value="SP-1">SP-1</option>
                <option value="SP-2">SP-2</option>
                <option value="SP-3">SP-3</option>
                <option value="Pemutusan Kerja Sama">Pemutusan Kerja Sama</option>
              </select>
            </div>

            <div className="form-group full">
              <label htmlFor="detailPelanggaran">Detail Pelanggaran</label>
              <textarea
                id="detailPelanggaran"
                rows={4}
                placeholder="Tuliskan kronologi atau detail pelanggaran..."
                value={detailPelanggaran}
                onChange={(e) => setDetailPelanggaran(e.target.value)}
              ></textarea>
            </div>

            {/* SANKSI */}
            {jenisSanksi !== 'Tidak Ada' && (
              <>
                <div className="section-title full">
                  <h3>Sanksi</h3>
                  <p>
                    Masa berlaku, persentase denda dan sesi tanpa honor ditentukan otomatis oleh
                    sistem berdasarkan keputusan Owner.
                  </p>
                </div>

                <div className="form-group">
                  <label htmlFor="tanggalMulaiSanksi">Tanggal Mulai Sanksi</label>
                  <input
                    type="date"
                    id="tanggalMulaiSanksi"
                    value={tanggalMulaiSanksi}
                    onChange={(e) => setTanggalMulaiSanksi(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="tanggalBerakhirSanksi">Tanggal Berakhir</label>
                  <input
                    type="text"
                    id="tanggalBerakhirSanksi"
                    placeholder="Otomatis"
                    readOnly
                    value={tanggalBerakhirSanksi}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="persentaseDenda">Persentase Denda</label>
                  <input
                    type="text"
                    id="persentaseDenda"
                    value={sanksiCalculation.persentaseDenda}
                    readOnly
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="sesiTanpaHonor">Sanksi Sesi Tanpa Honor</label>
                  <input
                    type="text"
                    id="sesiTanpaHonor"
                    value={sanksiCalculation.sesiTanpaHonor}
                    readOnly
                  />
                </div>

                <div className="form-group full">
                  <label htmlFor="nominalDendaPreview">Nominal Denda</label>
                  <input
                    type="text"
                    id="nominalDendaPreview"
                    value="Dihitung otomatis berdasarkan hak SPP pelatih"
                    readOnly
                  />
                </div>

                <div className="form-group full">
                  <label htmlFor="catatanSanksi">Catatan Sanksi</label>
                  <textarea
                    id="catatanSanksi"
                    rows={4}
                    placeholder="Catatan keputusan atau arahan Owner..."
                    value={catatanSanksi}
                    onChange={(e) => setCatatanSanksi(e.target.value)}
                  ></textarea>
                </div>

                {/* INFORMASI ATURAN */}
                <div className="sanksi-info full">
                  <div>
                    <strong>Teguran</strong>
                    <span>Berlaku 30 hari</span>
                  </div>

                  <div>
                    <strong>SP-1</strong>
                    <span>
                      Berlaku 3 bulan • Denda 20% • 5 sesi tanpa honor untuk ketentuan yang berlaku
                    </span>
                  </div>

                  <div>
                    <strong>SP-2</strong>
                    <span>
                      Berlaku 6 bulan • Denda 50% • 10 sesi tanpa honor untuk ketentuan yang berlaku
                    </span>
                  </div>

                  <div>
                    <strong>SP-3</strong>
                    <span>Denda 100% • Penonaktifan / pemberhentian kerja sama</span>
                  </div>
                </div>
              </>
            )}

            {/* ACTION */}
            <div className="form-actions full">
              <button type="reset" className="secondary-btn" disabled={submitting}>
                Reset
              </button>

              <button type="submit" className="primary-btn" disabled={submitting}>
                {submitting ? 'Menyimpan...' : 'Simpan Penilaian'}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* RIWAYAT */}
      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Riwayat Penilaian & Sanksi</h2>
            <p>Riwayat penilaian dan pelanggaran tersimpan permanen.</p>
          </div>
        </div>

        <div className="filters">
          <div className="filter-item search-item">
            <label htmlFor="searchRiwayat">Cari Pelatih</label>
            <input
              type="text"
              id="searchRiwayat"
              placeholder="Cari nama pelatih..."
              value={searchRiwayat}
              onChange={(e) => setSearchRiwayat(e.target.value)}
            />
          </div>

          <div className="filter-item">
            <label htmlFor="filterSanksi">Sanksi</label>
            <select
              id="filterSanksi"
              value={filterSanksi}
              onChange={(e) => setFilterSanksi(e.target.value)}
            >
              <option value="">Semua Sanksi</option>
              <option value="Tidak Ada">Tidak Ada</option>
              <option value="Teguran">Teguran</option>
              <option value="SP-1">SP-1</option>
              <option value="SP-2">SP-2</option>
              <option value="SP-3">SP-3</option>
              <option value="Pemutusan Kerja Sama">Pemutusan Kerja Sama</option>
            </select>
          </div>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>Tanggal</th>
                <th>Pelatih</th>
                <th>Nilai</th>
                <th>KKM</th>
                <th>Status KKM</th>
                <th>Pelanggaran</th>
                <th>Sanksi</th>
                <th>Status Sanksi</th>
                <th>Berakhir</th>
                <th>Diinput Admin</th>
                <th>Aksi</th>
              </tr>
            </thead>

            <tbody id="riwayatTableBody">
              {loading ? (
                <tr>
                  <td colSpan={12} className="loading-cell">
                    Memuat riwayat penilaian...
                  </td>
                </tr>
              ) : riwayatFiltered.length === 0 ? (
                <tr>
                  <td colSpan={12} className="empty-cell">
                    Belum ada riwayat penilaian.
                  </td>
                </tr>
              ) : (
                riwayatFiltered.map((item, idx) => {
                  const avg = item.rata_rata ?? 0;
                  const isMemenuhi = avg >= 4.0;
                  const hasSanksi = item.sanksi && item.sanksi !== 'Tidak Ada';

                  return (
                    <tr key={item.id}>
                      <td>{idx + 1}</td>
                      <td>{formatTanggal(item.tanggal_penilaian)}</td>
                      <td>
                        <strong>{item.nama_pelatih || '-'}</strong>
                      </td>
                      <td>
                        <strong>{avg.toFixed(2)}</strong>
                      </td>
                      <td>4.00</td>
                      <td>
                        <span
                          className={`status-badge ${
                            isMemenuhi ? 'status-active' : 'status-inactive'
                          }`}
                        >
                          {isMemenuhi ? 'Memenuhi' : 'Belum KKM'}
                        </span>
                      </td>
                      <td>{item.catatan?.includes('Pelanggaran') ? 'Ada' : '-'}</td>
                      <td>
                        <span
                          className={`status-badge ${
                            hasSanksi ? 'status-training' : 'status-active'
                          }`}
                        >
                          {item.sanksi || 'Tidak Ada'}
                        </span>
                      </td>
                      <td>{hasSanksi ? 'Aktif' : '-'}</td>
                      <td>-</td>
                      <td>{item.diinput_oleh || item.dinilai_oleh || item.penilai || 'Admin'}</td>
                      <td>
                        <button
                          type="button"
                          className="secondary-btn"
                          style={{ minHeight: '32px', padding: '0 10px', fontSize: '12px' }}
                          onClick={() => setDetailItem(item)}
                        >
                          Detail
                        </button>
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
           MODAL DETAIL
      ====================================================== */}
      {detailItem && (
        <div className="modal-backdrop" id="detailModal" style={{ display: 'flex' }}>
          <div className="modal-card">
            <div className="modal-header">
              <div>
                <h2>Detail Penilaian Pelatih</h2>
                <p id="detailNamaPelatih">{detailItem.nama_pelatih}</p>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={() => setDetailItem(null)}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-box">
                  <span>Tanggal Penilaian</span>
                  <strong>{formatTanggal(detailItem.tanggal_penilaian)}</strong>
                </div>

                <div className="detail-box">
                  <span>Rata-Rata Nilai</span>
                  <strong>{detailItem.rata_rata?.toFixed(2) ?? '-'} / 5.00</strong>
                </div>

                <div className="detail-box">
                  <span>Status KKM</span>
                  <strong>{(detailItem.rata_rata ?? 0) >= 4.0 ? 'Memenuhi KKM' : 'Belum Memenuhi KKM'}</strong>
                </div>

                <div className="detail-box">
                  <span>Sanksi</span>
                  <strong>{detailItem.sanksi || 'Tidak Ada'}</strong>
                </div>

                <div className="detail-box">
                  <span>Kedisiplinan</span>
                  <strong>{detailItem.kedisiplinan ?? '-'} / 5</strong>
                </div>

                <div className="detail-box">
                  <span>Kualitas Mengajar</span>
                  <strong>{detailItem.kualitas_mengajar ?? '-'} / 5</strong>
                </div>

                <div className="detail-box">
                  <span>Komunikasi</span>
                  <strong>{detailItem.komunikasi ?? '-'} / 5</strong>
                </div>

                <div className="detail-box">
                  <span>Kehadiran</span>
                  <strong>{detailItem.kehadiran ?? detailItem.penampilan ?? '-'} / 5</strong>
                </div>

                <div className="detail-box">
                  <span>Administrasi / Laporan</span>
                  <strong>{detailItem.administrasi_laporan ?? detailItem.tanggung_jawab ?? '-'} / 5</strong>
                </div>
              </div>

              {detailItem.catatan && (
                <div className="detail-text-box">
                  <span>Catatan & Evaluasi</span>
                  <p style={{ whiteSpace: 'pre-wrap' }}>{detailItem.catatan}</p>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="secondary-btn"
                onClick={() => setDetailItem(null)}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
