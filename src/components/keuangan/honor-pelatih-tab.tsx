'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import { SWR_KEYS } from '@/lib/swr-keys';
import { getHonorPelatihKalkulasiAction } from '@/server/actions/keuangan.actions';
import { HonorKalkulasiPelatih } from '@/types/keuangan';
import { ModalHonor } from './modal-honor';
import { formatRupiah } from '@/lib/utils';
import {
  Award,
  Settings,
  CheckCircle2,
  Calendar,
  DollarSign,
  Info,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface HonorPelatihTabProps {
  isOwner: boolean;
}

const NAMA_BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

export function HonorPelatihTab({ isOwner }: HonorPelatihTabProps) {
  const currentDate = new Date();
  const [selectedBulan, setSelectedBulan] = useState(currentDate.getMonth() + 1);
  const [selectedTahun, setSelectedTahun] = useState(currentDate.getFullYear());

  // Modal State
  const [activeModalHonor, setActiveModalHonor] = useState<{
    mode: 'tarif' | 'cairkan';
    honor: HonorKalkulasiPelatih;
  } | null>(null);

  const periodeStr = `${selectedTahun}-${String(selectedBulan).padStart(2, '0')}-01`;

  const { data: honorList = [], isLoading, mutate } = useSWR(
    [SWR_KEYS.KEUANGAN_HONOR, selectedBulan, selectedTahun],
    async () => {
      const res = await getHonorPelatihKalkulasiAction(selectedBulan, selectedTahun);
      if (!res.success) throw new Error(res.error || 'Gagal memuat kalkulasi honor');
      return res.data || [];
    },
    { revalidateOnFocus: true }
  );

  const totalHonorBulanIni = honorList.reduce((acc, h) => acc + h.nominal_kalkulasi, 0);
  const totalAnakDiajarBulanIni = honorList.reduce((acc, h) => acc + h.total_siswa_diajar, 0);
  const pelatihDicairkan = honorList.filter((h) => h.status_cair === 'Dicairkan').length;
  const honorBelumCair = honorList.filter((h) => h.status_cair !== 'Dicairkan').reduce((acc, h) => acc + h.nominal_kalkulasi, 0);

  const handlePrevMonth = () => {
    if (selectedBulan === 1) {
      setSelectedBulan(12);
      setSelectedTahun((prev) => prev - 1);
    } else {
      setSelectedBulan((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedBulan === 12) {
      setSelectedBulan(1);
      setSelectedTahun((prev) => prev + 1);
    } else {
      setSelectedBulan((prev) => prev + 1);
    }
  };

  return (
    <div>
      {/* Top Banner Info Formula */}
      <div
        className="responsive-banner"
        style={{
          background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.08), rgba(245, 158, 11, 0.08))',
          border: '1px solid rgba(37, 99, 235, 0.2)',
          borderRadius: '16px',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'rgba(37, 99, 235, 0.15)',
            color: 'var(--color-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Award size={22} />
          </div>
          <div>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', fontWeight: 600 }}>
              Kalkulasi Honor Pelatih (Per Anak Hadir)
            </h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Dihitung otomatis dari log kehadiran siswa di modul Absensi (status: Hadir) dikalikan tarif dasar per anak.
            </p>
          </div>
        </div>

        {/* Periode Selector with Quick Previous/Next Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="secondary"
            onClick={handlePrevMonth}
            title="Bulan sebelumnya"
            style={{ padding: '6px 8px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <ChevronLeft size={16} />
          </button>

          <Calendar size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <select
            value={selectedBulan}
            onChange={(e) => setSelectedBulan(Number(e.target.value))}
            style={{ padding: '7px 12px' }}
          >
            {NAMA_BULAN.map((nama, idx) => (
              <option key={idx} value={idx + 1}>
                {nama}
              </option>
            ))}
          </select>

          <select
            value={selectedTahun}
            onChange={(e) => setSelectedTahun(Number(e.target.value))}
            style={{ padding: '7px 12px' }}
          >
            {[2024, 2025, 2026, 2027].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          <button
            type="button"
            className="secondary"
            onClick={handleNextMonth}
            title="Bulan berikutnya"
            style={{ padding: '6px 8px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Mini Stats Bar */}
      <div className="responsive-stats-grid">
        <div className="panel responsive-stat-card">
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>
            Pelatih Terdata & Pencairan
          </span>
          <strong style={{ fontSize: '1.35rem', marginTop: '4px', display: 'block' }}>
            {honorList.length} Pelatih
          </strong>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px', display: 'block' }}>
            {pelatihDicairkan} dicairkan • {honorList.length - pelatihDicairkan} draft
          </span>
        </div>

        <div className="panel responsive-stat-card">
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>
            Total Kehadiran Anak Diajar ({NAMA_BULAN[selectedBulan - 1]})
          </span>
          <strong style={{ fontSize: '1.35rem', marginTop: '4px', display: 'block', color: 'var(--color-primary)' }}>
            {totalAnakDiajarBulanIni} Sesi Kehadiran
          </strong>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px', display: 'block' }}>
            Log absensi terkonfirmasi hadir
          </span>
        </div>

        <div className="panel responsive-stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>
                Estimasi Beban Honor ({NAMA_BULAN[selectedBulan - 1]})
              </span>
              <strong style={{ fontSize: '1.35rem', marginTop: '4px', display: 'block', color: 'var(--color-warning)' }}>
                {formatRupiah(totalHonorBulanIni)}
              </strong>
            </div>
            {honorBelumCair > 0 && (
              <span className="badge badge-warning" style={{ fontSize: '0.72rem' }}>
                Draft: {formatRupiah(honorBelumCair)}
              </span>
            )}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px', display: 'block' }}>
            Akumulasi honor seluruh pelatih
          </span>
        </div>
      </div>

      {/* Tabel Honor Pelatih */}
      <div className="panel">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nama Pelatih</th>
                <th>Kehadiran Anak (Absensi)</th>
                <th>Tarif Dasar Per Anak</th>
                <th>Estimasi Total Honor</th>
                <th>Status Pencairan</th>
                {isOwner && <th style={{ textAlign: 'center' }}>Aksi Owner</th>}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={isOwner ? 6 : 5} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                    Menghitung honor pelatih...
                  </td>
                </tr>
              ) : honorList.length === 0 ? (
                <tr>
                  <td colSpan={isOwner ? 6 : 5} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                    Tidak ada pelatih terdaftar.
                  </td>
                </tr>
              ) : (
                honorList.map((h) => {
                  const isCair = h.status_cair === 'Dicairkan';
                  return (
                    <tr key={h.pelatih_id}>
                      <td>
                        <strong style={{ color: 'var(--text-main)', fontSize: '0.95rem' }}>
                          {h.nama_pelatih}
                        </strong>
                      </td>
                      <td style={{ fontVariantNumeric: 'tabular-nums' }}>
                        <span style={{ fontWeight: 600 }}>
                          {h.total_siswa_diajar}
                        </span>{' '}
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>kehadiran anak</span>
                      </td>
                      <td style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {formatRupiah(h.tarif_dasar)}
                      </td>
                      <td style={{ fontVariantNumeric: 'tabular-nums' }}>
                        <div style={{
                          fontWeight: 700,
                          fontSize: '0.95rem',
                          color: 'var(--color-success)',
                        }}>
                          {formatRupiah(h.nominal_kalkulasi)}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                          {h.total_siswa_diajar} kehadiran × {formatRupiah(h.tarif_dasar)}
                        </div>
                      </td>
                      <td>
                        {isCair ? (
                          <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle2 size={12} />
                            Dicairkan ({h.nomor_slip || 'Slip'})
                          </span>
                        ) : (
                          <span className="badge badge-warning">
                            Draft (Belum Dicairkan)
                          </span>
                        )}
                      </td>
                      {isOwner && (
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            <button
                              type="button"
                              className="secondary"
                              onClick={() => setActiveModalHonor({ mode: 'tarif', honor: h })}
                              title="Ubah tarif honor per anak"
                              style={{ padding: '6px 10px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                              <Settings size={13} />
                              Tarif
                            </button>

                            {!isCair ? (
                              <button
                                type="button"
                                className="primary"
                                onClick={() => setActiveModalHonor({ mode: 'cairkan', honor: h })}
                                style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                              >
                                <DollarSign size={13} />
                                Cairkan
                              </button>
                            ) : (
                              <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', alignSelf: 'center', padding: '0 6px' }}>
                                Sudah di Kas
                              </span>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Honor (Atur Tarif / Cairkan) */}
      {activeModalHonor && (
        <ModalHonor
          mode={activeModalHonor.mode}
          honor={activeModalHonor.honor}
          periodeStr={periodeStr}
          onClose={() => setActiveModalHonor(null)}
          onSuccess={() => {
            mutate();
          }}
        />
      )}
    </div>
  );
}
