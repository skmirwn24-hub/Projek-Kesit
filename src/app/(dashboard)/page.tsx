'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { getDashboardStatsAction } from '@/server/actions/dashboard.actions';
import { getRekapanSiswaAction } from '@/server/actions/siswa.actions';
import { DashboardStats, RekapanSiswaView } from '@/types/database';
import { Topbar } from '@/components/layout/topbar';
import { formatRupiah } from '@/lib/utils';
import { DATA_LOKASI } from '@/server/constants/master-data';

export default function DashboardPage() {
  const { role } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [operasionalSiswa, setOperasionalSiswa] = useState<RekapanSiswaView[]>([]);
  const isPelatih = role === 'Pelatih';

  useEffect(() => {
    async function load() {
      try {
        const [statsRes, siswaRes] = await Promise.all([
          getDashboardStatsAction(),
          getRekapanSiswaAction(),
        ]);
        if (statsRes.success && statsRes.data) {
          setStats(statsRes.data);
        }
        if (siswaRes.success && siswaRes.data) {
          setOperasionalSiswa(siswaRes.data.slice(0, 5));
        }
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      }
    }
    load();
  }, []);

  const totalLokasiCount = Object.keys(DATA_LOKASI).length;

  return (
    <>
      <Topbar
        title="Dashboard"
        subtitle="Selamat datang di KESIT Management"
      />

      {/* STATISTIK CARDS */}
      <section className="cards">
        <div className="card">
          <div className="card-label">Total Siswa</div>
          <div className="card-value" id="totalSiswa">
            {stats?.totalSiswa ?? 0}
          </div>
        </div>

        <div className="card">
          <div className="card-label">Pelatih Aktif</div>
          <div className="card-value" id="totalPelatih">
            {stats?.pelatihAktif ?? 0}
          </div>
        </div>

        <div className="card">
          <div className="card-label">Kelas Hari Ini</div>
          <div className="card-value" id="totalKelasHariIni">
            {operasionalSiswa.length}
          </div>
        </div>

        <div className="card">
          <div className="card-label">Lokasi</div>
          <div className="card-value" id="totalLokasi">
            {totalLokasiCount}
          </div>
        </div>
      </section>

      {/* OPERASIONAL HARI INI */}
      <section className="panel">
        <div className="panel-title">
          <div>
            <h2>Operasional Hari Ini</h2>
            <p>Kelas yang sedang berjalan</p>
          </div>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Kelas</th>
                <th>Lokasi</th>
                <th>Siswa</th>
                <th>Pelatih</th>
                <th>Kuota</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody id="operasionalTableBody">
              {operasionalSiswa.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '24px' }}>
                    Belum ada data operasional hari ini.
                  </td>
                </tr>
              ) : (
                operasionalSiswa.map((item) => (
                  <tr key={item.id}>
                    <td><strong>{item.kelas || '-'}</strong> ({item.nama_paket || '-'})</td>
                    <td>{item.lokasi || '-'}</td>
                    <td>{item.nama_lengkap}</td>
                    <td>{item.pelatih_pemilik || '-'}</td>
                    <td>{item.kuota_terpakai} / {item.kuota_total} Sesi</td>
                    <td>
                      <span className="status">
                        {item.status_siswa}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* KEUANGAN (Owner & Admin only) */}
      {!isPelatih && (
        <>
          <section className="section-heading">
            <div>
              <h2>Keuangan Klub</h2>
              <p>Ringkasan keuangan bulan berjalan</p>
            </div>
          </section>

          <section className="finance-grid">
            <div className="finance-card">
              <span>Pemasukan Bulan Ini</span>
              <strong id="pemasukanBulanIni">
                {formatRupiah(stats?.totalPendapatan ?? 0)}
              </strong>
            </div>

            <div className="finance-card">
              <span>Pengeluaran</span>
              <strong id="pengeluaranBulanIni">
                Rp0
              </strong>
            </div>

            <div className="finance-card">
              <span>Saldo</span>
              <strong id="saldoBulanIni">
                {formatRupiah(stats?.totalPendapatan ?? 0)}
              </strong>
            </div>
          </section>
        </>
      )}
    </>
  );
}
