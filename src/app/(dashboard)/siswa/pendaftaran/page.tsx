'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { getPelatihAction } from '@/server/actions/pelatih.actions';
import { daftarSiswaAction } from '@/server/actions/siswa.actions';
import { Pelatih } from '@/types/database';
import {
  DATA_LOKASI,
  DATA_PAKET,
} from '@/server/constants/master-data';
import { Topbar } from '@/components/layout/topbar';
import { formatRupiah } from '@/lib/utils';
import { generateKuitansiPDF, KuitansiData } from '@/lib/pdf';
import { useToast } from '@/components/ui/toast';

export default function PendaftaranSiswaPage() {
  const { profile } = useAuth();
  const toast = useToast();

  // Master Pelatih state
  const [pelatihList, setPelatihList] = useState<Pelatih[]>([]);

  // Form inputs
  const [namaLengkap, setNamaLengkap] = useState('');
  const [namaPanggilan, setNamaPanggilan] = useState('');
  const [jenisKelamin, setJenisKelamin] = useState('Laki-laki');
  const [tempatLahir, setTempatLahir] = useState('');
  const [tanggalLahir, setTanggalLahir] = useState('');
  const [tanggalDaftar, setTanggalDaftar] = useState(
    new Date().toISOString().split('T')[0]
  );

  const [namaWali, setNamaWali] = useState('');
  const [noHpWali, setNoHpWali] = useState('');
  const [alamat, setAlamat] = useState('');

  const [lokasi, setLokasi] = useState('');
  const [kelas, setKelas] = useState('');
  const [pelatihPemilik, setPelatihPemilik] = useState('');
  const [pelatihDiminta, setPelatihDiminta] = useState('');

  const [paket, setPaket] = useState('');
  const [hargaPaket, setHargaPaket] = useState(0);
  const [kuotaPertemuan, setKuotaPertemuan] = useState(0);
  const [biayaRequest, setBiayaRequest] = useState(0);
  const [diskon, setDiskon] = useState(0);
  const [statusSiswa, setStatusSiswa] = useState('Aktif');

  const [nominalDibayar, setNominalDibayar] = useState<number | ''>('');
  const [metodePembayaran, setMetodePembayaran] = useState('Tunai');
  const [adminPenerima, setAdminPenerima] = useState('');

  // Results & status
  const [submitting, setSubmitting] = useState(false);
  const [hasilDaftar, setHasilDaftar] = useState<{
    idSiswa: string;
    nomorKuitansi: string;
    namaSiswa: string;
    statusPembayaran: string;
    nominalDibayar: number;
    sisaTagihan: number;
    adminPenerima: string;
    kuitansi: KuitansiData;
  } | null>(null);

  useEffect(() => {
    async function loadCoaches() {
      try {
        const res = await getPelatihAction();
        if (res.success && res.data) {
          const available = res.data.filter((p) => p.status !== 'Nonaktif');
          setPelatihList(available);
          if (available.length > 0) {
            setPelatihPemilik(available[0].id);
          }
        }
      } catch (err) {
        console.error('Error loading coaches:', err);
      }
    }
    loadCoaches();
  }, []);

  useEffect(() => {
    if (profile?.nama_tampilan || profile?.username) {
      setAdminPenerima(profile.nama_tampilan || profile.username);
    }
  }, [profile]);

  // Handle Location change
  const handleLokasiChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setLokasi(val);
    const kelasOptions = DATA_LOKASI[val] || [];
    if (kelasOptions.length > 0) {
      setKelas(kelasOptions[0]);
      updatePaketByKelas(kelasOptions[0]);
    } else {
      setKelas('');
      setPaket('');
      setHargaPaket(0);
      setKuotaPertemuan(0);
    }
  };

  // Handle Kelas change
  const handleKelasChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setKelas(val);
    updatePaketByKelas(val);
  };

  const updatePaketByKelas = (k: string) => {
    const paketOptions = DATA_PAKET[k] || [];
    if (paketOptions.length > 0) {
      setPaket(paketOptions[0].nama);
      setHargaPaket(paketOptions[0].harga);
      setKuotaPertemuan(paketOptions[0].kuota);
    } else {
      setPaket('');
      setHargaPaket(0);
      setKuotaPertemuan(0);
    }
  };

  const handlePaketSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setPaket(val);
    const item = (DATA_PAKET[kelas] || []).find((p) => p.nama === val);
    if (item) {
      setHargaPaket(item.harga);
      setKuotaPertemuan(item.kuota);
    }
  };

  const handlePelatihDimintaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setPelatihDiminta(val);
    if (val && val !== '') {
      setBiayaRequest(kelas === 'Prestasi' ? 100000 : 50000);
    } else {
      setBiayaRequest(0);
    }
  };

  // Calculations
  const totalTagihan = Math.max(0, hargaPaket + biayaRequest - diskon);
  const dibayarNum = Number(nominalDibayar) || 0;
  const sisaTagihan = Math.max(0, totalTagihan - dibayarNum);
  const statusBayar = dibayarNum >= totalTagihan && totalTagihan > 0 ? 'Lunas' : 'Belum Lunas';

  const resetForm = () => {
    setNamaLengkap('');
    setNamaPanggilan('');
    setJenisKelamin('Laki-laki');
    setTempatLahir('');
    setTanggalLahir('');
    setNamaWali('');
    setNoHpWali('');
    setAlamat('');
    setDiskon(0);
    setNominalDibayar('');
    setPelatihDiminta('');
    setBiayaRequest(0);
    setHasilDaftar(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaLengkap || !lokasi || !kelas || !paket) {
      toast.warning('Mohon lengkapi data pendaftaran wajib.');
      return;
    }

    setSubmitting(true);
    const coachOwner = pelatihList.find((p) => p.id === pelatihPemilik);
    const coachDiminta = pelatihList.find((p) => p.id === pelatihDiminta);
    const noKuitansi = `KST-${Date.now().toString().slice(-6)}`;

    try {
      const res = await daftarSiswaAction({
        nama_lengkap: namaLengkap,
        nama_panggilan: namaPanggilan,
        jenis_kelamin: jenisKelamin as 'Laki-laki' | 'Perempuan',
        tempat_lahir: tempatLahir,
        tanggal_lahir: tanggalLahir || null,
        nama_wali: namaWali,
        no_hp_wali: noHpWali,
        alamat: alamat,
        pelatih_pemilik_id: pelatihPemilik || null,
        pelatih_diminta_id: pelatihDiminta || null,
        status_siswa: statusSiswa as 'Aktif' | 'Nonaktif' | 'Cuti',
        tanggal_daftar: tanggalDaftar,
        lokasi,
        kelas,
        nama_paket: paket,
        harga_paket: hargaPaket,
        biaya_request_pelatih: biayaRequest,
        diskon,
        total_tagihan: totalTagihan,
        kuota_total: kuotaPertemuan,
        nominal_dibayar: dibayarNum,
        sisa_tagihan: sisaTagihan,
        status_pembayaran: statusBayar,
        metode_pembayaran: metodePembayaran,
        admin_penerima: adminPenerima || 'Admin KESIT',
      });

      if (!res.success || !res.idSiswa) {
        toast.error(res.error || 'Gagal mendaftarkan siswa.');
        setSubmitting(false);
        return;
      }

      const kuitansi: KuitansiData = {
        nomorKuitansi: noKuitansi,
        tanggal: tanggalDaftar,
        namaSiswa: namaLengkap,
        idSiswa: res.idSiswa,
        kelas,
        namaPaket: paket,
        lokasi,
        hargaPaket,
        biayaRequestPelatih: biayaRequest,
        diskon,
        totalTagihan,
        nominalDibayar: dibayarNum,
        sisaTagihan,
        statusPembayaran: statusBayar,
        metodePembayaran,
        adminPenerima: adminPenerima || 'Admin KESIT',
        pelatihPemilik: coachOwner?.nama,
      };

      setHasilDaftar({
        idSiswa: res.idSiswa,
        nomorKuitansi: noKuitansi,
        namaSiswa: namaLengkap,
        statusPembayaran: statusBayar,
        nominalDibayar: dibayarNum,
        sisaTagihan,
        adminPenerima: adminPenerima || 'Admin KESIT',
        kuitansi,
      });

      toast.success('Siswa berhasil didaftarkan dan kuitansi siap diunduh.');

      // Generate and download PDF
      generateKuitansiPDF(kuitansi);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan sistem.';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleKirimWhatsApp = () => {
    if (!hasilDaftar || !noHpWali) return;
    let cleanPhone = noHpWali.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.slice(1);
    }

    const d = hasilDaftar.kuitansi;
    const pesan = `Halo Bapak/Ibu ${namaWali || ''},\n\nTerima kasih telah mendaftarkan ananda *${d.namaSiswa}* di KESIT Management!\n\nBerikut rincian pendaftaran:\n- ID Siswa: *${d.idSiswa}*\n- Kelas: ${d.kelas} (${d.namaPaket})\n- Lokasi: ${d.lokasi}\n- Total Tagihan: ${formatRupiah(d.totalTagihan)}\n- Pembayaran: ${formatRupiah(d.nominalDibayar)} (${d.statusPembayaran})\n- Sisa Tagihan: ${formatRupiah(d.sisaTagihan)}\n\nKuitansi resmi digital telah diterbitkan. Salam Prestasi! 🏊‍♂️`;

    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(pesan)}`, '_blank');
  };

  return (
    <>
      <Topbar
        title="Pendaftaran Siswa"
        subtitle="Pendaftaran siswa, paket, pembayaran dan kuitansi"
      />

      {/* FORM PENDAFTARAN */}
      <section className="panel">
        <form id="formPendaftaran" onSubmit={handleSubmit} onReset={resetForm}>
          {/* BIODATA SISWA */}
          <div className="section-title">
            <div>
              <h2>Biodata Siswa</h2>
              <p>Informasi identitas siswa</p>
            </div>
          </div>

          <div className="form-grid">
            <label>
              Nama Lengkap *
              <input
                type="text"
                id="namaLengkap"
                required
                value={namaLengkap}
                onChange={(e) => setNamaLengkap(e.target.value)}
              />
            </label>

            <label>
              Nama Panggilan *
              <input
                type="text"
                id="namaPanggilan"
                required
                value={namaPanggilan}
                onChange={(e) => setNamaPanggilan(e.target.value)}
              />
            </label>

            <label>
              Jenis Kelamin *
              <select
                id="jenisKelamin"
                required
                value={jenisKelamin}
                onChange={(e) => setJenisKelamin(e.target.value)}
              >
                <option value="Laki-laki">Laki-laki</option>
                <option value="Perempuan">Perempuan</option>
              </select>
            </label>

            <label>
              Tempat Lahir
              <input
                type="text"
                id="tempatLahir"
                value={tempatLahir}
                onChange={(e) => setTempatLahir(e.target.value)}
              />
            </label>

            <label>
              Tanggal Lahir
              <input
                type="date"
                id="tanggalLahir"
                value={tanggalLahir}
                onChange={(e) => setTanggalLahir(e.target.value)}
              />
            </label>

            <label>
              Tanggal Daftar *
              <input
                type="date"
                id="tanggalDaftar"
                required
                value={tanggalDaftar}
                onChange={(e) => setTanggalDaftar(e.target.value)}
              />
            </label>
          </div>

          <div className="form-divider"></div>

          {/* DATA WALI */}
          <div className="section-title">
            <div>
              <h2>Data Wali</h2>
              <p>Nomor WhatsApp digunakan untuk pengiriman kuitansi</p>
            </div>
          </div>

          <div className="form-grid">
            <label>
              Nama Wali *
              <input
                type="text"
                id="namaWali"
                required
                value={namaWali}
                onChange={(e) => setNamaWali(e.target.value)}
              />
            </label>

            <label>
              Nomor WhatsApp Wali *
              <input
                type="tel"
                id="noHpWali"
                placeholder="Contoh: 081234567890"
                required
                value={noHpWali}
                onChange={(e) => setNoHpWali(e.target.value)}
              />
            </label>

            <label className="full-field">
              Alamat
              <textarea
                id="alamat"
                rows={3}
                value={alamat}
                onChange={(e) => setAlamat(e.target.value)}
              ></textarea>
            </label>
          </div>

          <div className="form-divider"></div>

          {/* KELAS & PELATIH */}
          <div className="section-title">
            <div>
              <h2>Lokasi, Kelas & Pelatih</h2>
              <p>Tentukan lokasi, kelas dan pelatih siswa</p>
            </div>
          </div>

          <div className="form-grid">
            <label>
              Lokasi Latihan *
              <select id="lokasi" required value={lokasi} onChange={handleLokasiChange}>
                <option value="">Pilih lokasi</option>
                {Object.keys(DATA_LOKASI).map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Jenis Kelas *
              <select id="kelas" required value={kelas} onChange={handleKelasChange}>
                <option value="">Pilih kelas</option>
                {(DATA_LOKASI[lokasi] || []).map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Pelatih Pemilik *
              <select
                id="pelatihPemilik"
                required
                value={pelatihPemilik}
                onChange={(e) => setPelatihPemilik(e.target.value)}
              >
                <option value="">Pilih pelatih</option>
                {pelatihList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nama} ({p.status})
                  </option>
                ))}
              </select>
            </label>

            <label id="bagianPelatihDiminta">
              Pelatih Diminta (Opsional)
              <select
                id="pelatihDiminta"
                value={pelatihDiminta}
                onChange={handlePelatihDimintaChange}
              >
                <option value="">Tidak Request Pelatih</option>
                {pelatihList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nama}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="form-divider"></div>

          {/* PAKET */}
          <div className="section-title">
            <div>
              <h2>Paket Awal</h2>
              <p>Pilih paket latihan siswa</p>
            </div>
          </div>

          <div className="form-grid">
            <label>
              Nama Paket *
              <select id="paket" required value={paket} onChange={handlePaketSelect}>
                <option value="">Pilih paket</option>
                {(DATA_PAKET[kelas] || []).map((p) => (
                  <option key={p.nama} value={p.nama}>
                    {p.nama}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Harga Paket
              <input type="text" id="hargaPaket" value={formatRupiah(hargaPaket)} readOnly />
            </label>

            <label>
              Total Pertemuan
              <input type="text" id="kuotaPertemuan" value={`${kuotaPertemuan} Pertemuan`} readOnly />
            </label>

            <label>
              Biaya Request Pelatih
              <input
                type="text"
                id="biayaRequestPelatih"
                value={formatRupiah(biayaRequest)}
                readOnly
              />
            </label>

            <label>
              Diskon
              <input
                type="number"
                id="diskon"
                min="0"
                value={diskon}
                onChange={(e) => setDiskon(Number(e.target.value) || 0)}
              />
            </label>

            <label>
              Total Tagihan
              <input type="text" id="totalTagihan" value={formatRupiah(totalTagihan)} readOnly />
            </label>

            <label>
              Status Siswa
              <select
                id="status"
                value={statusSiswa}
                onChange={(e) => setStatusSiswa(e.target.value)}
              >
                <option value="Aktif">Aktif</option>
                <option value="Tidak Aktif">Tidak Aktif</option>
              </select>
            </label>
          </div>

          {/* RINGKASAN PAKET */}
          {paket && (
            <div id="ringkasanPaket" className="package-summary">
              <div className="summary-heading">
                <h3>Ringkasan Paket</h3>
                <p>Detail paket yang dipilih</p>
              </div>

              <div className="summary-grid">
                <div className="summary-item">
                  <span>Lokasi</span>
                  <strong id="ringkasanLokasi">{lokasi || '-'}</strong>
                </div>

                <div className="summary-item">
                  <span>Kelas</span>
                  <strong id="ringkasanKelas">{kelas || '-'}</strong>
                </div>

                <div className="summary-item">
                  <span>Pelatih Pemilik</span>
                  <strong id="ringkasanPelatihPemilik">
                    {pelatihList.find((p) => p.id === pelatihPemilik)?.nama || '-'}
                  </strong>
                </div>

                <div className="summary-item">
                  <span>Pelatih Diminta</span>
                  <strong id="ringkasanPelatihDiminta">
                    {pelatihDiminta
                      ? pelatihList.find((p) => p.id === pelatihDiminta)?.nama || '-'
                      : 'Tidak Request'}
                  </strong>
                </div>

                <div className="summary-item">
                  <span>Paket</span>
                  <strong id="ringkasanNamaPaket">{paket || '-'}</strong>
                </div>

                <div className="summary-item">
                  <span>Harga</span>
                  <strong id="ringkasanHarga">{formatRupiah(hargaPaket)}</strong>
                </div>

                <div className="summary-item">
                  <span>Kuota</span>
                  <strong id="ringkasanKuota">{kuotaPertemuan} Pertemuan</strong>
                </div>

                <div className="summary-item">
                  <span>Biaya Request</span>
                  <strong id="ringkasanBiayaRequest">{formatRupiah(biayaRequest)}</strong>
                </div>

                <div className="summary-item">
                  <span>Diskon</span>
                  <strong id="ringkasanDiskon">{formatRupiah(diskon)}</strong>
                </div>

                <div className="summary-item">
                  <span>Total Tagihan</span>
                  <strong id="ringkasanTotalTagihan">{formatRupiah(totalTagihan)}</strong>
                </div>
              </div>
            </div>
          )}

          <div className="form-divider"></div>

          {/* PEMBAYARAN */}
          <div className="section-title">
            <div>
              <h2>Pembayaran SPP Awal</h2>
              <p>Pembayaran dilakukan pada saat pendaftaran</p>
            </div>
          </div>

          <div className="form-grid">
            <label>
              Total Tagihan
              <input type="text" id="totalPembayaran" value={formatRupiah(totalTagihan)} readOnly />
            </label>

            <label>
              Nominal Dibayar *
              <input
                type="number"
                id="nominalDibayar"
                min="0"
                placeholder="Masukkan nominal pembayaran"
                required
                value={nominalDibayar}
                onChange={(e) => setNominalDibayar(e.target.value === '' ? '' : Number(e.target.value))}
              />
            </label>

            <label>
              Sisa Tagihan
              <input type="text" id="sisaTagihan" value={formatRupiah(sisaTagihan)} readOnly />
            </label>

            <label>
              Status Pembayaran
              <input type="text" id="statusPembayaran" value={statusBayar} readOnly />
            </label>

            <label>
              Metode Pembayaran *
              <select
                id="metodePembayaran"
                required
                value={metodePembayaran}
                onChange={(e) => setMetodePembayaran(e.target.value)}
              >
                <option value="Tunai">Tunai</option>
                <option value="Transfer Bank">Transfer Bank</option>
                <option value="QRIS">QRIS</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </label>

            <label>
              Admin / Penerima Pembayaran *
              <input
                type="text"
                id="namaAdmin"
                required
                value={adminPenerima}
                onChange={(e) => setAdminPenerima(e.target.value)}
              />
            </label>
          </div>

          {/* TOMBOL */}
          <div className="button-area">
            <button type="reset" className="secondary" disabled={submitting}>
              Bersihkan
            </button>

            <button type="submit" className="primary" disabled={submitting}>
              {submitting ? 'Menyimpan...' : 'Daftarkan & Buat Kuitansi PDF'}
            </button>
          </div>
        </form>
      </section>

      {/* HASIL PENDAFTARAN */}
      {hasilDaftar && (
        <section id="bagianSetelahDaftar" className="panel">
          <div className="section-title">
            <div>
              <h2>Pendaftaran Berhasil</h2>
              <p>Data siswa tersimpan dan kuitansi siap digunakan</p>
            </div>
          </div>

          <div className="package-summary">
            <div className="summary-grid">
              <div className="summary-item">
                <span>ID Siswa</span>
                <strong id="hasilIdSiswa">{hasilDaftar.idSiswa}</strong>
              </div>

              <div className="summary-item">
                <span>Nomor Kuitansi</span>
                <strong id="hasilNomorKuitansi">{hasilDaftar.nomorKuitansi}</strong>
              </div>

              <div className="summary-item">
                <span>Nama Siswa</span>
                <strong id="hasilNamaSiswa">{hasilDaftar.namaSiswa}</strong>
              </div>

              <div className="summary-item">
                <span>Status Pembayaran</span>
                <strong id="hasilStatusPembayaran">{hasilDaftar.statusPembayaran}</strong>
              </div>

              <div className="summary-item">
                <span>Dibayar</span>
                <strong id="hasilDibayar">{formatRupiah(hasilDaftar.nominalDibayar)}</strong>
              </div>

              <div className="summary-item">
                <span>Sisa Tagihan</span>
                <strong id="hasilSisaTagihan">{formatRupiah(hasilDaftar.sisaTagihan)}</strong>
              </div>

              <div className="summary-item">
                <span>Admin / Penerima</span>
                <strong id="hasilNamaAdmin">{hasilDaftar.adminPenerima}</strong>
              </div>
            </div>

            <div className="button-area">
              <button
                type="button"
                id="btnUnduhUlang"
                className="secondary"
                onClick={() => generateKuitansiPDF(hasilDaftar.kuitansi)}
              >
                Unduh Ulang Kuitansi PDF
              </button>

              <button
                type="button"
                id="btnWhatsApp"
                className="primary"
                onClick={handleKirimWhatsApp}
              >
                Buka WhatsApp Wali
              </button>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
