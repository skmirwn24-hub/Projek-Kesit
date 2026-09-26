'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import { SWR_KEYS } from '@/lib/swr-keys';
import { getSiswaPembayaranAction } from '@/server/actions/keuangan.actions';
import { SiswaPembayaranRow } from '@/types/keuangan';
import { ModalBayarSpp } from './modal-bayar-spp';
import { formatRupiah } from '@/lib/utils';
import { Search, CreditCard, CheckCircle2, AlertCircle, MessageCircle } from 'lucide-react';

export function PelatihPembayaranView() {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'Semua' | 'Belum Lunas' | 'Lunas'>('Semua');
  const [activeSiswaBayar, setActiveSiswaBayar] = useState<SiswaPembayaranRow | null>(null);

  const { data: siswaList = [], isLoading, mutate } = useSWR(
    [SWR_KEYS.KEUANGAN_SISWA, search, filterStatus],
    async () => {
      const res = await getSiswaPembayaranAction({
        search,
        status: filterStatus === 'Semua' ? undefined : filterStatus,
      });
      if (!res.success) {
        throw new Error(res.error || 'Gagal memuat data siswa.');
      }
      return res.data || [];
    },
    { revalidateOnFocus: true }
  );

  const totalSiswa = siswaList.length;
  const siswaBelumLunas = siswaList.filter((s) => s.status_pembayaran === 'Belum Lunas').length;
  const totalSisaTagihan = siswaList.reduce((acc, s) => acc + s.sisa_tagihan, 0);

  const hasActiveFilters = search.trim() !== '' || filterStatus !== 'Semua';

  const resetFilters = () => {
    setSearch('');
    setFilterStatus('Semua');
  };

  const getWhatsAppReminderUrl = (siswa: SiswaPembayaranRow) => {
    if (!siswa.no_hp_wali) return null;
    let phone = siswa.no_hp_wali.replace(/\D/g, '');
    if (phone.startsWith('0')) phone = '62' + phone.slice(1);
    const pesan = `Halo Bapak/Ibu ${siswa.nama_wali || 'Wali Murid'},\n\nSalam dari pelatih KESIT Management untuk ananda *${siswa.nama_lengkap}*.\n\nKami menginformasikan bahwa pembayaran SPP ananda (${siswa.kelas || 'Renang'} - ${siswa.nama_paket || 'Paket Kursus'}) dapat dibayarkan langsung saat sesi latihan di kolam:\n- Total Tagihan: *${formatRupiah(siswa.total_tagihan)}*\n- Sudah Dibayar: *${formatRupiah(siswa.nominal_dibayar)}*\n- Sisa Tagihan: *${formatRupiah(siswa.sisa_tagihan)}*\n\nKuitansi digital resmi akan langsung diterbitkan setelah pembayaran. Terima kasih banyak! 🙏🏊‍♂️`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(pesan)}`;
  };

  return (
    <div>
      {/* Top Banner / Info Card */}
      <div
        className="responsive-banner"
        style={{
          background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.12), rgba(16, 185, 129, 0.08))',
          border: '1px solid rgba(37, 99, 235, 0.25)',
          borderRadius: '16px',
          marginBottom: '20px',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 6px 0', color: 'var(--text-main)' }}>
            Penerimaan SPP Murid Binaan
          </h2>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Catat pembayaran SPP langsung dari murid di kolam renang. Tagihan otomatis berkurang dan kuitansi digital resmi langsung terbit.
          </p>
        </div>

        {/* Mini Stats (Interactive) */}
        <div className="responsive-banner-stats">
          <div
            className="responsive-banner-stat-box"
            onClick={() => setFilterStatus('Semua')}
            style={{
              background: 'var(--bg-panel)',
              border: filterStatus === 'Semua' ? '1px solid var(--color-primary)' : '1px solid var(--border)',
              borderRadius: '12px',
              cursor: 'pointer',
            }}
            title="Klik untuk tampilkan semua murid"
          >
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Murid Binaan</span>
            <strong style={{ fontSize: '1.15rem' }}>{totalSiswa}</strong>
          </div>

          <div
            className="responsive-banner-stat-box"
            onClick={() => setFilterStatus('Belum Lunas')}
            style={{
              background: 'var(--bg-panel)',
              border: filterStatus === 'Belum Lunas' ? '1px solid var(--color-warning)' : '1px solid var(--border)',
              borderRadius: '12px',
              cursor: 'pointer',
            }}
            title="Klik untuk filter murid belum lunas"
          >
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Belum Lunas</span>
            <strong style={{ fontSize: '1.15rem', color: siswaBelumLunas > 0 ? 'var(--color-warning)' : 'var(--color-success)' }}>
              {siswaBelumLunas}
            </strong>
          </div>

          <div
            className="responsive-banner-stat-box"
            style={{
              background: 'var(--bg-panel)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
            }}
          >
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Total Sisa Tagihan</span>
            <strong style={{ fontSize: '1.15rem', color: totalSisaTagihan > 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>
              {formatRupiah(totalSisaTagihan)}
            </strong>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="panel responsive-toolbar-panel">
        <div className="responsive-toolbar-row">
          <div className="responsive-toolbar-search">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama murid atau ID siswa..."
              style={{ width: '100%', paddingLeft: '34px', paddingRight: '12px' }}
            />
            <Search
              size={16}
              style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }}
            />
          </div>

          {/* Segmented Filter Buttons */}
          <div style={{ display: 'inline-flex', gap: '4px', background: 'var(--bg-panel-soft)', padding: '3px', borderRadius: '8px' }}>
            <button
              type="button"
              onClick={() => setFilterStatus('Semua')}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                border: 'none',
                fontSize: '0.82rem',
                fontWeight: filterStatus === 'Semua' ? 600 : 500,
                background: filterStatus === 'Semua' ? 'var(--color-primary)' : 'transparent',
                color: filterStatus === 'Semua' ? '#ffffff' : 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              Semua
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('Belum Lunas')}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                border: 'none',
                fontSize: '0.82rem',
                fontWeight: filterStatus === 'Belum Lunas' ? 600 : 500,
                background: filterStatus === 'Belum Lunas' ? 'rgba(245, 158, 11, 0.2)' : 'transparent',
                color: filterStatus === 'Belum Lunas' ? 'var(--color-warning)' : 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              ⚠️ Belum Lunas ({siswaBelumLunas})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('Lunas')}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                border: 'none',
                fontSize: '0.82rem',
                fontWeight: filterStatus === 'Lunas' ? 600 : 500,
                background: filterStatus === 'Lunas' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                color: filterStatus === 'Lunas' ? 'var(--color-success)' : 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              ✅ Lunas
            </button>
          </div>

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

      {/* Table Panel */}
      <div className="panel">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID / Nama Murid</th>
                <th>Kelas & Paket</th>
                <th>Total Tagihan</th>
                <th>Terbayar</th>
                <th>Sisa Tagihan</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                    Memuat data murid binaan...
                  </td>
                </tr>
              ) : siswaList.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                      <AlertCircle size={36} color="var(--text-dim)" />
                      <span style={{ fontSize: '0.95rem', fontWeight: 500 }}>
                        Tidak ada murid binaan yang sesuai kriteria pencarian / filter.
                      </span>
                      {hasActiveFilters && (
                        <button
                          type="button"
                          className="secondary"
                          onClick={resetFilters}
                          style={{ padding: '6px 14px', fontSize: '0.85rem' }}
                        >
                          Reset Filter
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                siswaList.map((siswa) => {
                  const isLunas = siswa.status_pembayaran === 'Lunas';
                  const waReminderUrl = !isLunas ? getWhatsAppReminderUrl(siswa) : null;
                  return (
                    <tr
                      key={siswa.siswa_id}
                      style={{
                        background: !isLunas ? 'rgba(245, 158, 11, 0.02)' : undefined,
                      }}
                    >
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <strong style={{ color: 'var(--text-main)', fontSize: '0.95rem' }}>
                            {siswa.nama_lengkap}
                          </strong>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                            {siswa.id_siswa} {siswa.nama_wali ? `• Wali: ${siswa.nama_wali}` : ''}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span>{siswa.kelas || '-'}</span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {siswa.nama_paket || '-'}
                          </span>
                        </div>
                      </td>
                      <td style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {formatRupiah(siswa.total_tagihan)}
                      </td>
                      <td style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--color-success)' }}>
                        {formatRupiah(siswa.nominal_dibayar)}
                      </td>
                      <td style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                        <span style={{ color: siswa.sisa_tagihan > 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>
                          {formatRupiah(siswa.sisa_tagihan)}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${isLunas ? 'badge-success' : 'badge-warning'}`}>
                          {siswa.status_pembayaran}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            type="button"
                            className={isLunas ? 'secondary' : 'primary'}
                            onClick={() => setActiveSiswaBayar(siswa)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '6px 12px',
                              fontSize: '0.82rem',
                            }}
                          >
                            <CreditCard size={14} />
                            {isLunas ? 'Bayar Tambahan' : 'Terima SPP'}
                          </button>

                          {waReminderUrl && (
                            <a
                              href={waReminderUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="secondary"
                              title={`Kirim info/pengingat SPP via WhatsApp ke ${siswa.nama_wali || 'Wali'}`}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '6px 10px',
                                fontSize: '0.82rem',
                                color: '#25D366',
                                borderColor: 'rgba(37, 211, 102, 0.4)',
                                textDecoration: 'none',
                              }}
                            >
                              <MessageCircle size={14} />
                              <span>WA</span>
                            </a>
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
      </div>

      {/* Modal Bayar SPP */}
      {activeSiswaBayar && (
        <ModalBayarSpp
          siswa={activeSiswaBayar}
          isPelatih={true}
          onClose={() => setActiveSiswaBayar(null)}
          onSuccess={() => {
            mutate();
          }}
        />
      )}
    </div>
  );
}
