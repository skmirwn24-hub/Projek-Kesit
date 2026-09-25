'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import { SWR_KEYS } from '@/lib/swr-keys';
import { getKasSummaryAction, getKasMutasiAction } from '@/server/actions/keuangan.actions';
import { KasTransaksi } from '@/types/keuangan';
import { ModalCatatKas } from './modal-catat-kas';
import { ModalSoftDelete } from './modal-soft-delete';
import { formatRupiah, formatTanggal } from '@/lib/utils';
import {
  Wallet,
  ArrowDownRight,
  ArrowUpRight,
  Plus,
  Search,
  Filter,
  Trash2,
  Calendar,
} from 'lucide-react';

interface BukuKasTabProps {
  isOwner: boolean;
}

export function BukuKasTab({ isOwner }: BukuKasTabProps) {
  const [showModalCatat, setShowModalCatat] = useState(false);
  const [selectedSoftDelete, setSelectedSoftDelete] = useState<KasTransaksi | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [jenis, setJenis] = useState<'Semua' | 'Masuk' | 'Keluar'>('Semua');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [datePreset, setDatePreset] = useState<'all' | 'this_month' | 'today'>('all');

  const applyDatePreset = (preset: 'all' | 'this_month' | 'today') => {
    setDatePreset(preset);
    if (preset === 'all') {
      setStartDate('');
      setEndDate('');
    } else if (preset === 'today') {
      const today = new Date().toISOString().split('T')[0];
      setStartDate(today);
      setEndDate(today);
    } else if (preset === 'this_month') {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
      setStartDate(firstDay);
      setEndDate(lastDay);
    }
  };

  const hasActiveFilters = search.trim() !== '' || jenis !== 'Semua' || startDate !== '' || endDate !== '';

  const resetFilters = () => {
    setSearch('');
    setJenis('Semua');
    setStartDate('');
    setEndDate('');
    setDatePreset('all');
  };

  // 1. Fetch Kas Summary
  const { data: summary, mutate: mutateSummary } = useSWR(
    SWR_KEYS.KEUANGAN_SUMMARY,
    async () => {
      const res = await getKasSummaryAction();
      if (!res.success) throw new Error(res.error || 'Gagal memuat summary');
      return res.data;
    },
    { revalidateOnFocus: true }
  );

  // 2. Fetch Kas Mutasi
  const { data: mutasiList = [], isLoading, mutate: mutateMutasi } = useSWR(
    [SWR_KEYS.KEUANGAN_MUTASI, jenis, startDate, endDate, search],
    async () => {
      const res = await getKasMutasiAction({
        jenis,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        search,
      });
      if (!res.success) throw new Error(res.error || 'Gagal memuat mutasi kas');
      return res.data || [];
    },
    { revalidateOnFocus: true }
  );

  const refreshAll = () => {
    mutateSummary();
    mutateMutasi();
  };

  const netCashflow = (summary?.totalMasuk ?? 0) - (summary?.totalKeluar ?? 0);

  return (
    <div>
      {/* 3 Metric Cards */}
      <div className="responsive-stats-grid">
        {/* Saldo Kas */}
        <div className="responsive-stat-card" style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                Saldo Kas Klub Terkini
              </span>
              <h2 className="stat-amount" style={{
                color: (summary?.saldoKas ?? 0) >= 0 ? 'var(--color-success)' : 'var(--color-danger)',
              }}>
                {formatRupiah(summary?.saldoKas ?? 0)}
              </h2>
            </div>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'rgba(37, 99, 235, 0.15)',
              color: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Wallet size={20} />
            </div>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '8px', display: 'block' }}>
            Akumulasi Kas Masuk dikurangi Kas Keluar aktif
          </span>
        </div>

        {/* Total Pemasukan */}
        <div className="responsive-stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                Total Pemasukan (Kas Masuk)
              </span>
              <h2 className="stat-amount" style={{ color: 'var(--color-success)' }}>
                {formatRupiah(summary?.totalMasuk ?? 0)}
              </h2>
            </div>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'rgba(16, 185, 129, 0.15)',
              color: 'var(--color-success)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <ArrowDownRight size={20} />
            </div>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '8px', display: 'block' }}>
            SPP siswa, pendaftaran baru, & kas masuk lainnya
          </span>
        </div>

        {/* Total Pengeluaran */}
        <div className="responsive-stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                Total Pengeluaran (Kas Keluar)
              </span>
              <h2 className="stat-amount" style={{ color: 'var(--color-danger)' }}>
                {formatRupiah(summary?.totalKeluar ?? 0)}
              </h2>
            </div>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'rgba(239, 68, 68, 0.15)',
              color: 'var(--color-danger)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <ArrowUpRight size={20} />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
              Sewa kolam, honor, & operasional
            </span>
            <span style={{
              fontSize: '0.72rem',
              fontWeight: 600,
              color: netCashflow >= 0 ? 'var(--color-success)' : 'var(--color-danger)',
            }}>
              Net: {netCashflow >= 0 ? '+' : ''}{formatRupiah(netCashflow)}
            </span>
          </div>
        </div>
      </div>

      {/* Action & Filter Panel */}
      <div className="responsive-toolbar-panel">
        <div className="responsive-toolbar-row">
          {/* Left: Button Catat Kas */}
          <button
            type="button"
            className="primary responsive-toolbar-fullbtn"
            onClick={() => setShowModalCatat(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px' }}
          >
            <Plus size={18} />
            Catat Transaksi Kas
          </button>

          {/* Right: Search & Filters */}
          <div className="responsive-toolbar-filters">
            {/* Search */}
            <div className="responsive-toolbar-search">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nomor, keterangan, kategori..."
                style={{ width: '100%', paddingLeft: '34px', paddingRight: '10px' }}
              />
              <Search
                size={15}
                style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }}
              />
            </div>

            {/* Filter Jenis Quick Chips */}
            <select
              value={jenis}
              onChange={(e) => setJenis(e.target.value as 'Semua' | 'Masuk' | 'Keluar')}
              style={{ padding: '7px 12px' }}
            >
              <option value="Semua">Semua Arus Kas</option>
              <option value="Masuk">⬇️ Kas Masuk</option>
              <option value="Keluar">⬆️ Kas Keluar</option>
            </select>

            {/* Quick Date Presets */}
            <div style={{ display: 'inline-flex', gap: '4px', background: 'var(--bg-panel-soft)', padding: '3px', borderRadius: '8px' }}>
              <button
                type="button"
                onClick={() => applyDatePreset('all')}
                style={{
                  padding: '5px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '0.78rem',
                  fontWeight: datePreset === 'all' ? 600 : 500,
                  background: datePreset === 'all' ? 'var(--color-primary)' : 'transparent',
                  color: datePreset === 'all' ? '#ffffff' : 'var(--text-muted)',
                  cursor: 'pointer',
                }}
              >
                Semua
              </button>
              <button
                type="button"
                onClick={() => applyDatePreset('this_month')}
                style={{
                  padding: '5px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '0.78rem',
                  fontWeight: datePreset === 'this_month' ? 600 : 500,
                  background: datePreset === 'this_month' ? 'var(--color-primary)' : 'transparent',
                  color: datePreset === 'this_month' ? '#ffffff' : 'var(--text-muted)',
                  cursor: 'pointer',
                }}
              >
                Bulan Ini
              </button>
              <button
                type="button"
                onClick={() => applyDatePreset('today')}
                style={{
                  padding: '5px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '0.78rem',
                  fontWeight: datePreset === 'today' ? 600 : 500,
                  background: datePreset === 'today' ? 'var(--color-primary)' : 'transparent',
                  color: datePreset === 'today' ? '#ffffff' : 'var(--text-muted)',
                  cursor: 'pointer',
                }}
              >
                Hari Ini
              </button>
            </div>

            {/* Date Pickers */}
            <div className="date-range-filter-group">
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setDatePreset('all');
                }}
                style={{ padding: '6px 10px', fontSize: '0.82rem' }}
                title="Mulai tanggal"
              />
              <span style={{ color: 'var(--text-dim)', textAlign: 'center' }}>-</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setDatePreset('all');
                }}
                style={{ padding: '6px 10px', fontSize: '0.82rem' }}
                title="Sampai tanggal"
              />
            </div>

            {/* Reset Button */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="secondary"
                style={{ padding: '6px 12px', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
              >
                Reset Filter
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabel Mutasi Kas */}
      <div className="panel">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>No. Transaksi</th>
                <th>Tanggal</th>
                <th>Jenis</th>
                <th>Kategori</th>
                <th>Keterangan / Lokasi</th>
                <th>Metode</th>
                <th>Nominal</th>
                <th>Dicatat Oleh</th>
                {isOwner && <th style={{ textAlign: 'center' }}>Aksi</th>}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={isOwner ? 9 : 8} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                    Memuat mutasi kas...
                  </td>
                </tr>
              ) : mutasiList.length === 0 ? (
                <tr>
                  <td colSpan={isOwner ? 9 : 8} style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '1.8rem' }}>🔍</span>
                      <strong style={{ color: 'var(--text-main)', fontSize: '0.95rem' }}>Tidak ada transaksi yang cocok</strong>
                      <span style={{ fontSize: '0.85rem' }}>Coba ubah kata kunci pencarian atau reset filter tanggal & arus kas.</span>
                      {hasActiveFilters && (
                        <button type="button" onClick={resetFilters} className="secondary" style={{ marginTop: '8px', fontSize: '0.85rem' }}>
                          Reset Semua Filter
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                mutasiList.map((t) => {
                  const isMasuk = t.jenis_transaksi === 'Masuk';
                  return (
                    <tr key={t.id}>
                      <td style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.85rem' }}>
                        {t.nomor_transaksi}
                      </td>
                      <td style={{ fontSize: '0.85rem' }}>
                        {formatTanggal(t.tanggal_transaksi)}
                      </td>
                      <td>
                        <span className={`badge ${isMasuk ? 'badge-success' : 'badge-danger'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          {isMasuk ? <ArrowDownRight size={12} /> : <ArrowUpRight size={12} />}
                          {t.jenis_transaksi}
                        </span>
                      </td>
                      <td style={{ fontWeight: 500 }}>
                        {t.kategori}
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '0.88rem' }}>{t.keterangan || '-'}</span>
                          {t.lokasi && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                              📍 {t.lokasi}
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {t.metode_pembayaran}
                      </td>
                      <td style={{
                        fontVariantNumeric: 'tabular-nums',
                        fontWeight: 700,
                        color: isMasuk ? 'var(--color-success)' : 'var(--color-danger)',
                      }}>
                        {isMasuk ? '+' : '-'} {formatRupiah(t.nominal)}
                      </td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {t.dibuat_oleh}
                      </td>
                      {isOwner && (
                        <td style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => setSelectedSoftDelete(t)}
                            title="Batalkan transaksi kas (Soft Delete)"
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--color-danger)',
                              cursor: 'pointer',
                              padding: '6px',
                              borderRadius: '6px',
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
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

      {/* Modal Catat Kas Baru */}
      {showModalCatat && (
        <ModalCatatKas
          onClose={() => setShowModalCatat(false)}
          onSuccess={refreshAll}
        />
      )}

      {/* Modal Soft Delete */}
      {selectedSoftDelete && (
        <ModalSoftDelete
          transaksi={selectedSoftDelete}
          onClose={() => setSelectedSoftDelete(null)}
          onSuccess={refreshAll}
        />
      )}
    </div>
  );
}
