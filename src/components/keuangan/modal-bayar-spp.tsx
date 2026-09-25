'use client';

import React, { useState } from 'react';
import { SiswaPembayaranRow } from '@/types/keuangan';
import { bayarSppSiswaAction } from '@/server/actions/keuangan.actions';
import { generateKuitansiPDF, KuitansiData } from '@/lib/pdf';
import { formatRupiah } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';
import { usePelatih } from '@/hooks/use-pelatih';
import { X, CheckCircle, Download, MessageCircle, CreditCard, ArrowRight } from 'lucide-react';

import { Modal } from '@/components/ui/modal';

interface ModalBayarSppProps {
  siswa: SiswaPembayaranRow;
  isPelatih: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ModalBayarSpp({ siswa, isPelatih, onClose, onSuccess }: ModalBayarSppProps) {
  const toast = useToast();
  const { pelatih: pelatihList } = usePelatih();

  const [nominal, setNominal] = useState<number | ''>(siswa.sisa_tagihan > 0 ? siswa.sisa_tagihan : '');
  const [metode, setMetode] = useState('Tunai');
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [jalur, setJalur] = useState<'Admin / Kasir' | 'Titip Pelatih'>(
    isPelatih ? 'Titip Pelatih' : 'Admin / Kasir'
  );
  const [selectedPelatihId, setSelectedPelatihId] = useState<string>(
    siswa.pelatih_pemilik_id || (pelatihList[0]?.id ?? '')
  );
  const [catatan, setCatatan] = useState('');
  const [loading, setLoading] = useState(false);

  // Success state result
  const [suksesResult, setSuksesResult] = useState<{
    kuitansi: KuitansiData;
    noHpWali: string | null;
    namaWali: string | null;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nom = Number(nominal);
    if (!nom || nom <= 0) {
      toast.warning('Nominal pembayaran harus lebih dari 0.');
      return;
    }

    setLoading(true);
    try {
      const res = await bayarSppSiswaAction({
        siswa_id: siswa.siswa_id,
        nominal: nom,
        metode,
        tanggal,
        jalur: isPelatih ? 'Titip Pelatih' : jalur,
        penerima_pelatih_id: jalur === 'Titip Pelatih' ? selectedPelatihId : null,
        catatan,
      });

      if (!res.success || !res.data) {
        toast.error(res.error || 'Gagal memproses pembayaran.');
        setLoading(false);
        return;
      }

      const d = res.data;
      const kuitansiData: KuitansiData = {
        nomorKuitansi: d.nomor_kuitansi,
        tanggal: tanggal,
        namaSiswa: d.nama_siswa,
        idSiswa: siswa.id_siswa,
        kelas: d.kelas,
        namaPaket: d.nama_paket,
        lokasi: d.lokasi,
        hargaPaket: siswa.total_tagihan,
        biayaRequestPelatih: 0,
        diskon: 0,
        totalTagihan: siswa.total_tagihan,
        nominalDibayar: nom,
        sisaTagihan: d.sisa_tagihan,
        statusPembayaran: d.status_pembayaran,
        metodePembayaran: metode,
        adminPenerima: isPelatih ? (siswa.nama_pelatih_pemilik || 'Pelatih') : 'Kasir KESIT',
        pelatihPemilik: siswa.nama_pelatih_pemilik,
      };

      // Auto trigger download PDF kuitansi
      try {
        generateKuitansiPDF(kuitansiData);
      } catch (err) {
        console.error('Error generating PDF:', err);
      }

      setSuksesResult({
        kuitansi: kuitansiData,
        noHpWali: siswa.no_hp_wali,
        namaWali: siswa.nama_wali,
      });

      toast.success('Pembayaran berhasil dicatat & Kuitansi PDF siap!');
      onSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleKirimWhatsApp = () => {
    if (!suksesResult || !suksesResult.noHpWali) {
      toast.warning('Nomor WhatsApp wali tidak tersedia.');
      return;
    }

    let phone = suksesResult.noHpWali.replace(/\D/g, '');
    if (phone.startsWith('0')) {
      phone = '62' + phone.slice(1);
    }

    const k = suksesResult.kuitansi;
    const pesan = `Halo Bapak/Ibu ${suksesResult.namaWali || ''},\n\nTerima kasih, pembayaran SPP ananda *${k.namaSiswa}* telah kami terima dengan rincian berikut:\n\n- No. Kuitansi: *${k.nomorKuitansi}*\n- Tanggal: ${k.tanggal}\n- Kelas: ${k.kelas} (${k.namaPaket})\n- Nominal Dibayar: *${formatRupiah(k.nominalDibayar)}*\n- Sisa Tagihan: *${formatRupiah(k.sisaTagihan)}*\n- Status: *${k.statusPembayaran}*\n- Metode: ${k.metodePembayaran}\n\nKuitansi digital resmi telah diterbitkan. Salam Prestasi KESIT Management! 🏊‍♂️`;

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(pesan)}`, '_blank');
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={suksesResult ? 'Pembayaran Berhasil!' : isPelatih ? 'Terima Pembayaran SPP di Kolam' : 'Catat Pembayaran SPP'}
      subtitle={`${siswa.nama_lengkap} (${siswa.id_siswa})`}
      maxWidth="lg"
    >

        {suksesResult ? (
          <div style={{ padding: '8px 0' }}>
            <div style={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              color: 'var(--color-success)',
            }}>
              <CheckCircle size={28} />
              <div>
                <strong style={{ display: 'block', fontSize: '1rem' }}>Transaksi Tersimpan</strong>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  No. Kuitansi: {suksesResult.kuitansi.nomorKuitansi}
                </span>
              </div>
            </div>

            <div style={{
              background: 'var(--bg-panel-soft)',
              borderRadius: '10px',
              padding: '14px',
              fontSize: '0.9rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              marginBottom: '20px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Nominal Dibayar:</span>
                <strong style={{ color: 'var(--color-success)' }}>
                  {formatRupiah(suksesResult.kuitansi.nominalDibayar)}
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Sisa Tagihan:</span>
                <strong>{formatRupiah(suksesResult.kuitansi.sisaTagihan)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Status Pembayaran:</span>
                <span className={`badge ${suksesResult.kuitansi.statusPembayaran === 'Lunas' ? 'badge-success' : 'badge-warning'}`}>
                  {suksesResult.kuitansi.statusPembayaran}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                type="button"
                className="secondary"
                onClick={() => generateKuitansiPDF(suksesResult.kuitansi)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%' }}
              >
                <Download size={16} />
                Unduh Ulang Kuitansi PDF
              </button>

              {suksesResult.noHpWali && (
                <button
                  type="button"
                  onClick={handleKirimWhatsApp}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    width: '100%',
                    background: '#25D366',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px',
                    fontWeight: 600,
                  }}
                >
                  <MessageCircle size={18} />
                  Kirim Kuitansi ke WhatsApp Wali
                </button>
              )}

              <button
                type="button"
                className="primary"
                onClick={onClose}
                style={{ marginTop: '6px' }}
              >
                Selesai
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Info Siswa & Tagihan Box */}
            <div style={{
              background: 'var(--bg-panel-soft)',
              padding: '12px 16px',
              borderRadius: '10px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>Paket & Kelas</span>
                <strong style={{ fontSize: '0.9rem' }}>{siswa.kelas || '-'} ({siswa.nama_paket || '-'})</strong>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>Sisa Tagihan</span>
                <strong style={{ fontSize: '1.05rem', color: siswa.sisa_tagihan > 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>
                  {formatRupiah(siswa.sisa_tagihan)}
                </strong>
              </div>
            </div>

            {/* Input Nominal */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label htmlFor="nominalBayar" style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)' }}>
                  Nominal Pembayaran (Rp) *
                </label>
                {typeof nominal === 'number' && nominal > 0 && (
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-primary)' }}>
                    {formatRupiah(nominal)}
                  </span>
                )}
              </div>
              <input
                id="nominalBayar"
                type="number"
                min="1000"
                step="1000"
                value={nominal}
                onChange={(e) => setNominal(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="Contoh: 350000"
                required
                style={{ width: '100%', fontSize: '1.05rem', padding: '10px 12px', fontWeight: 600 }}
              />

              {/* Quick Amount Pills */}
              {siswa.sisa_tagihan > 0 && (
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setNominal(siswa.sisa_tagihan)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      border: '1px solid rgba(37, 99, 235, 0.4)',
                      background: 'rgba(37, 99, 235, 0.15)',
                      color: 'var(--color-primary)',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    ⚡ Bayar Lunas ({formatRupiah(siswa.sisa_tagihan)})
                  </button>
                  {[50000, 100000, 150000, 200000].map((amt) => {
                    if (amt >= siswa.sisa_tagihan) return null;
                    return (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setNominal(amt)}
                        style={{
                          padding: '4px 8px',
                          borderRadius: '6px',
                          border: '1px solid var(--border)',
                          background: 'var(--bg-panel-soft)',
                          color: 'var(--text-muted)',
                          fontSize: '0.78rem',
                          cursor: 'pointer',
                        }}
                      >
                        {formatRupiah(amt)}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Live Remaining Calculation Preview */}
              {typeof nominal === 'number' && nominal > 0 && (
                <div style={{
                  marginTop: '8px',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  background: 'var(--bg-panel-soft)',
                  fontSize: '0.8rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <span style={{ color: 'var(--text-muted)' }}>Estimasi Sisa Tagihan:</span>
                  <strong style={{
                    color: Math.max(0, siswa.sisa_tagihan - nominal) === 0 ? 'var(--color-success)' : 'var(--color-warning)',
                  }}>
                    {Math.max(0, siswa.sisa_tagihan - nominal) === 0
                      ? '✅ Lunas (Rp 0)'
                      : formatRupiah(Math.max(0, siswa.sisa_tagihan - nominal))}
                  </strong>
                </div>
              )}
            </div>

            {/* Input Tanggal & Metode */}
            <div className="modal-two-col">
              <div className="form-group">
                <label htmlFor="tglBayar" style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)' }}>
                  Tanggal Bayar
                </label>
                <input
                  id="tglBayar"
                  type="date"
                  value={tanggal}
                  onChange={(e) => setTanggal(e.target.value)}
                  required
                  style={{ width: '100%', padding: '9px 12px' }}
                />
              </div>

              <div className="form-group">
                <label htmlFor="metodeBayar" style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)' }}>
                  Metode Bayar
                </label>
                <select
                  id="metodeBayar"
                  value={metode}
                  onChange={(e) => setMetode(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px' }}
                >
                  <option value="Tunai">Tunai</option>
                  <option value="Transfer">Transfer Bank</option>
                  <option value="QRIS">QRIS</option>
                </select>
              </div>
            </div>

            {/* Jalur Penerimaan (Khusus Admin/Owner) */}
            {!isPelatih && (
              <div className="form-group">
                <label htmlFor="jalurPenerimaan" style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)' }}>
                  Jalur Penerimaan Uang
                </label>
                <select
                  id="jalurPenerimaan"
                  value={jalur}
                  onChange={(e) => setJalur(e.target.value as 'Admin / Kasir' | 'Titip Pelatih')}
                  style={{ width: '100%', padding: '9px 12px' }}
                >
                  <option value="Admin / Kasir">Langsung ke Admin / Kasir</option>
                  <option value="Titip Pelatih">Titip via Pelatih di Kolam</option>
                </select>

                {jalur === 'Titip Pelatih' && (
                  <div style={{ marginTop: '8px' }}>
                    <label htmlFor="pelatihPenerima" style={{ fontSize: '0.8rem', color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>
                      Pilih Pelatih Penerima:
                    </label>
                    <select
                      id="pelatihPenerima"
                      value={selectedPelatihId}
                      onChange={(e) => setSelectedPelatihId(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px' }}
                    >
                      {pelatihList.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nama}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* Catatan */}
            <div className="form-group">
              <label htmlFor="catatanBayar" style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)' }}>
                Catatan (Opsional)
              </label>
              <input
                id="catatanBayar"
                type="text"
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Contoh: Titipan pelunasan bulan September"
                style={{ width: '100%', padding: '8px 12px' }}
              />
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <button
                type="button"
                className="secondary"
                onClick={onClose}
                disabled={loading}
              >
                Batal
              </button>
              <button
                type="submit"
                className="primary"
                disabled={loading}
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                {loading ? 'Menyimpan...' : 'Simpan & Buat Kuitansi'}
                <ArrowRight size={16} />
              </button>
            </div>
          </form>
        )}
    </Modal>
  );
}
