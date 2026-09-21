'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { getRiwayatAction } from '@/server/actions/riwayat.actions';
import { RiwayatPerubahanSiswa } from '@/types/database';
import { formatTanggal } from '@/lib/utils';
import { Topbar } from '@/components/layout/topbar';

export default function RiwayatPage() {
  const { profile, role } = useAuth();
  const [data, setData] = useState<RiwayatPerubahanSiswa[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [filterJenis, setFilterJenis] = useState('');
  const [filterBulan, setFilterBulan] = useState('');
  const [filterTahun, setFilterTahun] = useState('');

  // Pagination
  const [halamanSaatIni, setHalamanSaatIni] = useState(1);
  const [jumlahPerHalaman, setJumlahPerHalaman] = useState(10);

  // Detail Modal
  const [detailItem, setDetailItem] = useState<RiwayatPerubahanSiswa | null>(null);

  const displayName = profile?.nama_tampilan || profile?.username || 'Admin KESIT';

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getRiwayatAction();
      if (res.success && res.data) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load riwayat:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter logic matching legacy
  const dataFiltered = useMemo(() => {
    return data.filter((item) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchNama = (item.nama_siswa || '').toLowerCase().includes(q);
        const matchId = (item.id_siswa || '').toLowerCase().includes(q);
        const matchJenis = (item.jenis_perubahan || '').toLowerCase().includes(q);
        if (!matchNama && !matchId && !matchJenis) return false;
      }

      if (filterJenis && item.jenis_perubahan !== filterJenis) {
        return false;
      }

      if (filterBulan && item.created_at) {
        const itemMonth = new Date(item.created_at).getMonth() + 1;
        if (itemMonth !== Number(filterBulan)) return false;
      }

      if (filterTahun && item.created_at) {
        const itemYear = new Date(item.created_at).getFullYear();
        if (itemYear !== Number(filterTahun)) return false;
      }

      return true;
    });
  }, [data, search, filterJenis, filterBulan, filterTahun]);

  // Statistics
  const statTotal = dataFiltered.length;
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const statBulanIni = data.filter((r) => {
    if (!r.created_at) return false;
    const d = new Date(r.created_at);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }).length;
  const statSiswaCount = new Set(data.map((r) => r.id_siswa).filter(Boolean)).size;

  // Pagination calculations
  const totalHalaman = Math.max(1, Math.ceil(dataFiltered.length / jumlahPerHalaman));
  const currentPage = Math.min(halamanSaatIni, totalHalaman);
  const indexAwal = (currentPage - 1) * jumlahPerHalaman;
  const indexAkhir = indexAwal + jumlahPerHalaman;
  const currentItems = dataFiltered.slice(indexAwal, indexAkhir);

  const handleResetFilter = () => {
    setSearch('');
    setFilterJenis('');
    setFilterBulan('');
    setFilterTahun('');
    setHalamanSaatIni(1);
  };

  // Available years for dropdown
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    years.add(new Date().getFullYear());
    data.forEach((r) => {
      if (r.created_at) {
        years.add(new Date(r.created_at).getFullYear());
      }
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [data]);

  if (role === 'Pelatih') {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)' }}>
        <h2>Akses Dibatasi</h2>
        <p>Halaman riwayat perubahan hanya dapat diakses oleh Owner dan Admin KESIT.</p>
      </div>
    );
  }

  return (
    <>
      {/* TOPBAR */}
      <Topbar
        title="Riwayat"
        breadcrumb={[{ label: 'KESIT Management' }, { label: 'Riwayat' }]}
        searchPlaceholder="Cari siswa atau perubahan..."
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val);
          setHalamanSaatIni(1);
        }}
      />

      {/* STATISTIK */}
      <section className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue">↻</div>
          <div>
            <strong id="statTotal">{statTotal}</strong>
            <span>Total Riwayat</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green">↑</div>
          <div>
            <strong id="statBulanIni">{statBulanIni}</strong>
            <span>Perubahan Bulan Ini</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon orange">👥</div>
          <div>
            <strong id="statSiswa">{statSiswaCount}</strong>
            <span>Siswa Tercatat</span>
          </div>
        </div>
      </section>

      {/* FILTER */}
      <section className="filter-section">
        <div className="filter-grid">
          <label>
            <span>Cari</span>
            <input
              type="text"
              id="searchInput"
              placeholder="Nama siswa, ID, kelas..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setHalamanSaatIni(1);
              }}
            />
          </label>

          <label>
            <span>Jenis Perubahan</span>
            <select
              id="filterJenis"
              value={filterJenis}
              onChange={(e) => {
                setFilterJenis(e.target.value);
                setHalamanSaatIni(1);
              }}
            >
              <option value="">Semua Perubahan</option>
              <option value="Naik / Pindah Kelas">Naik / Pindah Kelas</option>
              <option value="Pendaftaran Baru">Pendaftaran Baru</option>
            </select>
          </label>

          <label>
            <span>Bulan</span>
            <select
              id="filterBulan"
              value={filterBulan}
              onChange={(e) => {
                setFilterBulan(e.target.value);
                setHalamanSaatIni(1);
              }}
            >
              <option value="">Semua Bulan</option>
              <option value="01">Januari</option>
              <option value="02">Februari</option>
              <option value="03">Maret</option>
              <option value="04">April</option>
              <option value="05">Mei</option>
              <option value="06">Juni</option>
              <option value="07">Juli</option>
              <option value="08">Agustus</option>
              <option value="09">September</option>
              <option value="10">Oktober</option>
              <option value="11">November</option>
              <option value="12">Desember</option>
            </select>
          </label>

          <label>
            <span>Tahun</span>
            <select
              id="filterTahun"
              value={filterTahun}
              onChange={(e) => {
                setFilterTahun(e.target.value);
                setHalamanSaatIni(1);
              }}
            >
              <option value="">Semua Tahun</option>
              {availableYears.map((y) => (
                <option key={y} value={String(y)}>
                  {y}
                </option>
              ))}
            </select>
          </label>

          <div className="filter-buttons">
            <button type="button" id="btnReset" className="btn reset" onClick={handleResetFilter}>
              Reset
            </button>
            <button type="button" id="btnCari" className="btn search">
              Cari
            </button>
          </div>
        </div>
      </section>

      {/* TABEL RIWAYAT */}
      <section className="table-card">
        <div className="table-header" style={{ padding: '20px 22px 14px' }}>
          <div>
            <h2>Riwayat Perubahan Siswa</h2>
            <p style={{ color: 'var(--muted)', fontSize: '13px', marginTop: '4px' }}>
              Catatan perubahan kelas, paket, lokasi dan pelatih siswa.
            </p>
          </div>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>Tanggal</th>
                <th>Siswa</th>
                <th>Jenis Perubahan</th>
                <th>Lokasi</th>
                <th>Kelas</th>
                <th>Paket</th>
                <th>Pelatih Pemilik</th>
                <th>Dicatat Oleh</th>
                <th>Aksi</th>
              </tr>
            </thead>

            <tbody id="tableBody">
              {loading ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '36px' }}>
                    Memuat data riwayat...
                  </td>
                </tr>
              ) : currentItems.length === 0 ? (
                <tr>
                  <td colSpan={10}>
                    <div id="emptyState" className="empty-state">
                      <h3>Belum ada riwayat</h3>
                      <p>Riwayat perubahan siswa akan tampil di sini.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                currentItems.map((item, idx) => {
                  const lokasi = item.lokasi_baru || item.lokasi_lama || '-';
                  const kelas = item.kelas_baru || item.kelas_lama || '-';
                  const paket = item.paket_baru || item.paket_lama || '-';
                  const pelatih = item.nama_pelatih_baru || item.nama_pelatih_lama || '-';
                  const dicatatOleh = item.diubah_oleh || 'Admin KESIT';

                  return (
                    <tr key={item.id}>
                      <td>{indexAwal + idx + 1}</td>
                      <td>{formatTanggal(item.created_at)}</td>
                      <td>
                        <strong>{item.nama_siswa || '-'}</strong>
                        <br />
                        <small style={{ color: 'var(--muted)' }}>{item.id_siswa || '-'}</small>
                      </td>
                      <td>
                        <span className="status-badge badge-orange">{item.jenis_perubahan}</span>
                      </td>
                      <td>{lokasi}</td>
                      <td>{kelas}</td>
                      <td>{paket}</td>
                      <td>{pelatih}</td>
                      <td>{dicatatOleh}</td>
                      <td>
                        <button
                          type="button"
                          className="detail-button"
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
              {Math.min(indexAkhir, dataFiltered.length)} dari {dataFiltered.length} riwayat
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
           MODAL DETAIL RIWAYAT
      ====================================================== */}
      {detailItem && (
        <div id="detailModal" className="modal">
          <div className="modal-backdrop" onClick={() => setDetailItem(null)}></div>

          <div className="modal-content">
            <div className="modal-header">
              <div>
                <span className="modal-label">DETAIL RIWAYAT</span>
                <h2 id="detailNamaSiswa">{detailItem.nama_siswa || '-'}</h2>
                <p id="detailIdSiswa">{detailItem.id_siswa || '-'}</p>
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
              {/* INFORMASI PERUBAHAN */}
              <section className="detail-card">
                <h3>Informasi Perubahan</h3>
                <div className="detail-list">
                  <div>
                    <span>Tanggal</span>
                    <strong id="dTanggal">{formatTanggal(detailItem.created_at)}</strong>
                  </div>
                  <div>
                    <span>Jenis Perubahan</span>
                    <strong id="dJenis">{detailItem.jenis_perubahan}</strong>
                  </div>
                  <div>
                    <span>Dicatat Oleh</span>
                    <strong id="dDiubahOleh">
                      {detailItem.diubah_oleh || (detailItem as any).detail?.dicatat_oleh || 'Admin KESIT'}
                    </strong>
                  </div>
                  <div>
                    <span>Alasan / Catatan</span>
                    <strong id="dAlasan">
                      {detailItem.alasan || (detailItem as any).detail?.alasan || '-'}
                    </strong>
                  </div>
                </div>
              </section>

              {/* SEBELUM */}
              <section className="detail-card">
                <h3>Sebelum</h3>
                <div className="detail-list">
                  <div>
                    <span>Lokasi</span>
                    <strong id="dLokasiLama">
                      {detailItem.lokasi_lama || (detailItem as any).detail?.lokasi_lama || '-'}
                    </strong>
                  </div>
                  <div>
                    <span>Kelas</span>
                    <strong id="dKelasLama">
                      {detailItem.kelas_lama || (detailItem as any).detail?.kelas_lama || '-'}
                    </strong>
                  </div>
                  <div>
                    <span>Paket</span>
                    <strong id="dPaketLama">
                      {detailItem.paket_lama || (detailItem as any).detail?.nama_paket_lama || '-'}
                    </strong>
                  </div>
                  <div>
                    <span>Pelatih Pemilik</span>
                    <strong id="dPelatihLama">
                      {detailItem.nama_pelatih_lama || (detailItem as any).detail?.pelatih_pemilik_lama_nama || '-'}
                    </strong>
                  </div>
                </div>
              </section>

              {/* SESUDAH */}
              <section className="detail-card">
                <h3>Sesudah</h3>
                <div className="detail-list">
                  <div>
                    <span>Lokasi</span>
                    <strong id="dLokasiBaru">
                      {detailItem.lokasi_baru || (detailItem as any).detail?.lokasi_baru || '-'}
                    </strong>
                  </div>
                  <div>
                    <span>Kelas</span>
                    <strong id="dKelasBaru">
                      {detailItem.kelas_baru || (detailItem as any).detail?.kelas_baru || '-'}
                    </strong>
                  </div>
                  <div>
                    <span>Paket</span>
                    <strong id="dPaketBaru">
                      {detailItem.paket_baru || (detailItem as any).detail?.nama_paket_baru || '-'}
                    </strong>
                  </div>
                  <div>
                    <span>Pelatih Pemilik</span>
                    <strong id="dPelatihBaru">
                      {detailItem.nama_pelatih_baru || (detailItem as any).detail?.pelatih_pemilik_baru_nama || '-'}
                    </strong>
                  </div>
                </div>
              </section>
            </div>

            <div className="detail-actions" style={{ padding: '0 22px 20px' }}>
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
    </>
  );
}
