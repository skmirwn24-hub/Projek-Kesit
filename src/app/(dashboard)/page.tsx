'use client';

import React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useDashboardData } from '@/hooks/use-dashboard-data';
import { Topbar } from '@/components/layout/topbar';
import { formatRupiah } from '@/lib/utils';
import { DATA_LOKASI } from '@/server/constants/master-data';
import { Skeleton, SkeletonTable } from '@/components/ui/skeleton';

export default function DashboardPage() {
  const { role } = useAuth();
  const { stats, operasionalSiswa, isLoading: loading } = useDashboardData();
  const isPelatih = role === 'Pelatih';

  const totalLokasiCount = Object.keys(DATA_LOKASI).length;

  return (
    <>
      <Topbar
        title="Dashboard"
        subtitle="Selamat datang di KESIT Management"
      />

      {/* STATISTIK CARDS */}
      <section className="cards">
        {loading ? (
          <>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="card">
                <Skeleton style={{ height: '14px', width: '40%', marginBottom: '8px' }} />
                <Skeleton style={{ height: '28px', width: '60%' }} />
              </div>
            ))}
          </>
        ) : (
          <>
            <div className="card">
              <div className="card-label">Total Siswa</div>
              <div className="card-value" id="totalSiswa">
                {stats?.totalSiswa ?? 0}
              </div>
            </div>

            <div className="card">
              <div className="card-label">Siswa Aktif</div>
              <div className="card-value" id="totalSiswaAktif">
                {stats?.siswaAktif ?? 0}
              </div>
            </div>

            <div className="card">
              <div className="card-label">Pelatih Aktif</div>
              <div className="card-value" id="totalPelatih">
                {stats?.pelatihAktif ?? 0}
              </div>
            </div>

            <div className="card">
              <div className="card-label">Cabang Lokasi</div>
              <div className="card-value" id="totalLokasi">
                {totalLokasiCount}
              </div>
            </div>
          </>
        )}
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
              {loading ? (
                <SkeletonTable rows={4} cols={6} />
              ) : operasionalSiswa.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
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

      {/* KEUANGAN & KAS KLUB (Owner & Admin only) */}
      {!isPelatih && (
        <>
          <section className="section-heading">
            <div>
              <h2>Keuangan & Kas Klub</h2>
              <p>Ringkasan realisasi saldo kas klub, pengeluaran, dan piutang tagihan siswa</p>
            </div>
          </section>

          <section className="finance-grid">
            {loading ? (
              <>
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="finance-card">
                    <Skeleton style={{ height: '14px', width: '50%', marginBottom: '8px' }} />
                    <Skeleton style={{ height: '24px', width: '70%' }} />
                  </div>
                ))}
              </>
            ) : (
              <>
                <div className="finance-card">
                  <span>Saldo Kas Klub Terkini</span>
                  <strong id="saldoKasKlub" style={{ color: (stats?.saldoKas ?? 0) >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                    {formatRupiah(stats?.saldoKas ?? stats?.totalPendapatan ?? 0)}
                  </strong>
                </div>

                <div className="finance-card">
                  <span>Total Kas Masuk</span>
                  <strong id="totalKasMasuk" style={{ color: 'var(--color-success)' }}>
                    {formatRupiah(stats?.totalKasMasuk ?? stats?.totalPendapatan ?? 0)}
                  </strong>
                </div>

                <div className="finance-card">
                  <span>Total Kas Keluar</span>
                  <strong id="totalKasKeluar" style={{ color: (stats?.totalKasKeluar ?? 0) > 0 ? 'var(--color-danger)' : 'inherit' }}>
                    {formatRupiah(stats?.totalKasKeluar ?? 0)}
                  </strong>
                </div>

                <div className="finance-card">
                  <span>Sisa Tagihan SPP (Piutang)</span>
                  <strong id="sisaPiutangSiswa" style={{ color: (stats?.sisaPiutang ?? 0) > 0 ? 'var(--color-warning)' : 'inherit' }}>
                    {formatRupiah(stats?.sisaPiutang ?? 0)}
                  </strong>
                </div>

                <div className="finance-card">
                  <span>Status Pelunasan Siswa</span>
                  <strong id="statusSiswaLunas" style={{ fontSize: '15px' }}>
                    {stats?.siswaLunas ?? 0} Lunas • {stats?.siswaBelumLunas ?? 0} Belum Lunas
                  </strong>
                </div>
              </>
            )}
          </section>
        </>
      )}
    </>
  );
}

