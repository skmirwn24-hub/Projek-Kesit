'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import { SWR_KEYS } from '@/lib/swr-keys';
import { getSiswaPembayaranAction } from '@/server/actions/keuangan.actions';
import { SiswaPembayaranRow } from '@/types/keuangan';
import { ModalBayarSpp } from './modal-bayar-spp';
import { usePelatih } from '@/hooks/use-pelatih';
import { DATA_LOKASI } from '@/server/constants/master-data';
import { formatRupiah } from '@/lib/utils';
import { Search, CreditCard, Users, AlertCircle, CheckCircle2, MessageCircle } from 'lucide-react';

export function SiswaSppTab() {
  const { pelatih: pelatihList } = usePelatih();

  // Filters
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('Semua');
  const [filterPelatih, setFilterPelatih] = useState<string>('Semua');
  const [filterLokasi, setFilterLokasi] = useState<string>('Semua');

  const [activeSiswaBayar, setActiveSiswaBayar] = useState<SiswaPembayaranRow | null>(null);

  const { data: siswaList = [], isLoading, mutate } = useSWR(
    [SWR_KEYS.KEUANGAN_SISWA, search, filterStatus, filterPelatih, filterLokasi],
    async () => {
      const res = await getSiswaPembayaranAction({
        search,
        status: filterStatus === 'Semua' ? undefined : filterStatus,
        pelatihIdFilter: filterPelatih === 'Semua' ? undefined : filterPelatih,
        lokasi: filterLokasi === 'Semua' ? undefined : filterLokasi,
      });
      if (!res.success) throw new Error(res.error || 'Gagal memuat siswa');
      return res.data || [];
    },
    { revalidateOnFocus: true }
  );

  const totalSiswa = siswaList.length;
  const siswaBelumLunas = siswaList.filter((s) => s.status_pembayaran === 'Belum Lunas').length;
  const totalSisaTagihan = siswaList.reduce((acc, s) => acc + s.sisa_tagihan, 0);

  const hasActiveFilters = search.trim() !== '' || filterStatus !== 'Semua' || filterPelatih !== 'Semua' || filterLokasi !== 'Semua';

  const resetFilters = () => {
    setSearch('');
    setFilterStatus('Semua');
    setFilterPelatih('Semua');
    setFilterLokasi('Semua');
  };

  const getWhatsAppReminderUrl = (siswa: SiswaPembayaranRow) => {
    if (!siswa.no_hp_wali) return null;
    let phone = siswa.no_hp_wali.replace(/\D/g, '');
    if (phone.startsWith('0')) phone = '62' + phone.slice(1);
    const pesan = `Halo Bapak/Ibu ${siswa.nama_wali || 'Wali Murid'},\n\nKami dari KESIT Management ingin menginformasikan terkait tagihan SPP ananda *${siswa.nama_lengkap}* (${siswa.kelas || 'Renang'} - ${siswa.nama_paket || 'Paket Kursus'}).\n\n- Total Tagihan: *${formatRupiah(siswa.total_tagihan)}*\n- Sudah Dibayar: *${formatRupiah(siswa.nominal_dibayar)}*\n- Sisa Tagihan: *${formatRupiah(siswa.sisa_tagihan)}*\n- Status: *Belum Lunas*\n\nPembayaran dapat dilakukan secara tunai di kolam atau transfer. Terima kasih banyak atas perhatiannya! 🙏🏊‍♂️`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(pesan)}`;
  };

  return (
    <div>
      {/* 3 Metric Cards (Clickable) */}
      <div className="responsive-stats-grid">
        <div
          className="panel responsive-stat-card"
          onClick={() => setFilterStatus('Semua')}
          style={{
            cursor: 'pointer',
            border: filterStatus === 'Semua' ? '1px solid var(--color-primary)' : '1px solid var(--border)',
            transition: 'border-color 0.15s ease',
          }}
          title="Klik untuk tampilkan semua murid"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                Total Murid Terdata
              </span>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 700, margin: '6px 0 0 0' }}>
                {totalSiswa}
              </h2>
            </div>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'rgba(37, 99, 235, 0.15)',
              color: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Users size={22} />
            </div>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '8px', display: 'block' }}>
            Seluruh murid KESIT (klik untuk reset filter)
          </span>
        </div>

        <div
          className="panel responsive-stat-card"
          onClick={() => setFilterStatus('Belum Lunas')}
          style={{
            cursor: 'pointer',
            border: filterStatus === 'Belum Lunas' ? '1px solid var(--color-warning)' : '1px solid var(--border)',
            transition: 'border-color 0.15s ease',
          }}
          title="Klik untuk filter murid Belum Lunas"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                Murid Belum Lunas
              </span>
              <h2 style={{
                fontSize: '1.6rem',
                fontWeight: 700,
                margin: '6px 0 0 0',
                color: siswaBelumLunas > 0 ? 'var(--color-warning)' : 'var(--color-success)',
              }}>
                {siswaBelumLunas}
              </h2>
            </div>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'rgba(245, 158, 11, 0.15)',
              color: 'var(--color-warning)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <AlertCircle size={22} />
            </div>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '8px', display: 'block' }}>
            Klik kartu ini untuk langsung filter belum lunas
          </span>
        </div>

        <div className="panel responsive-stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                Total Piutang Belum Terbayar
              </span>
              <h2 style={{
                fontSize: '1.6rem',
                fontWeight: 700,
                margin: '6px 0 0 0',
                color: totalSisaTagihan > 0 ? 'var(--color-danger)' : 'var(--color-success)',
                fontVariantNumeric: 'tabular-nums',
              }}>
                {formatRupiah(totalSisaTagihan)}
              </h2>
            </div>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'rgba(239, 68, 68, 0.15)',
              color: 'var(--color-danger)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <CreditCard size={22} />
            </div>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '8px', display: 'block' }}>
            Akumulasi tagihan SPP yang belum terbayar
          </span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="panel responsive-toolbar-panel">
        <div className="responsive-toolbar-row">
          {/* Search */}
          <div className="responsive-toolbar-search">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari murid, ID, atau nama wali..."
              style={{ width: '100%', paddingLeft: '34px', paddingRight: '12px' }}
            />
            <Search
              size={16}
              style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }}
            />
          </div>

          {/* Interactive Status Segment Buttons */}
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

          {/* Select Filters */}
          <div className="responsive-toolbar-filters">
            {/* Filter Pelatih */}
            <select
              value={filterPelatih}
              onChange={(e) => setFilterPelatih(e.target.value)}
              style={{ padding: '7px 12px' }}
            >
              <option value="Semua">Semua Pelatih</option>
              {pelatihList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nama}
                </option>
              ))}
            </select>

            {/* Filter Lokasi */}
            <select
              value={filterLokasi}
              onChange={(e) => setFilterLokasi(e.target.value)}
              style={{ padding: '7px 12px' }}
            >
              <option value="Semua">Semua Lokasi</option>
              {Object.keys(DATA_LOKASI).map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>

            {/* Reset Filter Button */}
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

      {/* Tabel Seluruh Murid */}
      <div className="panel">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID / Nama Murid</th>
                <th>Kelas & Paket</th>
                <th>Pelatih</th>
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
                  <td colSpan={8} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                    Memuat data seluruh murid...
                  </td>
                </tr>
              ) : siswaList.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                      <AlertCircle size={36} color="var(--text-dim)" />
                      <span style={{ fontSize: '0.95rem', fontWeight: 500 }}>
                        Tidak ada data murid yang sesuai kriteria pencarian / filter.
                      </span>
                      {hasActiveFilters && (
                        <button
                          type="button"
                          className="secondary"
                          onClick={resetFilters}
                          style={{ padding: '6px 14px', fontSize: '0.85rem' }}
                        >
                          Reset Semua Filter
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
                            {siswa.id_siswa} {siswa.lokasi ? `• ${siswa.lokasi}` : ''}
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
                      <td style={{ fontSize: '0.88rem' }}>
                        {siswa.nama_pelatih_pemilik || '-'}
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
                            {isLunas ? 'Bayar Tambahan' : 'Bayar SPP'}
                          </button>

                          {waReminderUrl && (
                            <a
                              href={waReminderUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="secondary"
                              title={`Kirim pengingat SPP via WhatsApp ke ${siswa.nama_wali || 'Wali'}`}
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
                              <span>Ingatkan</span>
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
          isPelatih={false}
          onClose={() => setActiveSiswaBayar(null)}
          onSuccess={() => {
            mutate();
          }}
        />
      )}
    </div>
  );
}
