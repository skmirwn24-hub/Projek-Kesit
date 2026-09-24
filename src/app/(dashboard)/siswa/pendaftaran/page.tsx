'use client';

import React, { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { usePelatih } from '@/hooks/use-pelatih';
import { useSWRConfig } from 'swr';
import { SWR_KEYS } from '@/lib/swr-keys';
import { daftarSiswaAction } from '@/server/actions/siswa.actions';
import {
  DATA_LOKASI,
  DATA_PAKET,
} from '@/server/constants/master-data';
import { Topbar } from '@/components/layout/topbar';
import { formatRupiah } from '@/lib/utils';
import { generateKuitansiPDF, KuitansiData } from '@/lib/pdf';
import { useToast } from '@/components/ui/toast';
import {
  User,
  Users,
  MapPin,
  CreditCard,
  ArrowRight,
  ArrowLeft,
  Check,
  RotateCcw,
  Sparkles,
  MessageCircle,
  Download,
  PlusCircle,
  FileCheck2,
} from 'lucide-react';

type StepId = 1 | 2 | 3 | 4;

const STEPS = [
  { id: 1 as StepId, title: 'Biodata Siswa', desc: 'Identitas siswa', icon: User },
  { id: 2 as StepId, title: 'Data Wali', desc: 'Kontak WhatsApp', icon: Users },
  { id: 3 as StepId, title: 'Lokasi & Paket', desc: 'Kelas & pelatih', icon: MapPin },
  { id: 4 as StepId, title: 'Pembayaran', desc: 'SPP awal & kuitansi', icon: CreditCard },
];

export default function PendaftaranSiswaPage() {
  const { profile } = useAuth();
  const toast = useToast();
  const { mutate } = useSWRConfig();
  const { pelatih: allPelatih } = usePelatih();
  const pelatihList = useMemo(
    () => allPelatih.filter((p) => p.status !== 'Nonaktif'),
    [allPelatih]
  );

  // Stepper state
  const [currentStep, setCurrentStep] = useState<StepId>(1);

  // Step 1: Form inputs - Biodata Siswa
  const [namaLengkap, setNamaLengkap] = useState('');
  const [namaPanggilan, setNamaPanggilan] = useState('');
  const [jenisKelamin, setJenisKelamin] = useState('Laki-laki');
  const [tempatLahir, setTempatLahir] = useState('');
  const [tanggalLahir, setTanggalLahir] = useState('');
  const [tanggalDaftar, setTanggalDaftar] = useState(
    new Date().toISOString().split('T')[0]
  );

  // Step 2: Form inputs - Data Wali
  const [namaWali, setNamaWali] = useState('');
  const [noHpWali, setNoHpWali] = useState('');
  const [alamat, setAlamat] = useState('');

  // Step 3: Form inputs - Lokasi, Kelas & Paket
  const [lokasi, setLokasi] = useState('');
  const [kelas, setKelas] = useState('');
  const [pelatihPemilikState, setPelatihPemilik] = useState('');
  const pelatihPemilik = pelatihPemilikState || (pelatihList[0]?.id ?? '');
  const [pelatihDiminta, setPelatihDiminta] = useState('');

  const [paket, setPaket] = useState('');
  const [hargaPaket, setHargaPaket] = useState(0);
  const [kuotaPertemuan, setKuotaPertemuan] = useState(0);
  const [biayaRequest, setBiayaRequest] = useState(0);
  // Diskon bug fix: use number | '' to allow clean deletion/backspace
  const [diskon, setDiskon] = useState<number | ''>('');
  const [statusSiswa, setStatusSiswa] = useState('Aktif');

  // Step 4: Form inputs - Pembayaran
  const [nominalDibayar, setNominalDibayar] = useState<number | ''>('');
  const [metodePembayaran, setMetodePembayaran] = useState('Tunai');
  const defaultAdmin = profile?.nama_tampilan || profile?.username || 'Admin KESIT';
  const [adminPenerimaCustom, setAdminPenerima] = useState<string | null>(null);
  const adminPenerima = adminPenerimaCustom ?? defaultAdmin;

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
  const diskonNum = typeof diskon === 'number' ? diskon : 0;
  const totalTagihan = Math.max(0, hargaPaket + biayaRequest - diskonNum);
  const dibayarNum = Number(nominalDibayar) || 0;
  const sisaTagihan = Math.max(0, totalTagihan - dibayarNum);
  const statusBayar = dibayarNum >= totalTagihan && totalTagihan > 0 ? 'Lunas' : 'Belum Lunas';

  const resetForm = () => {
    setNamaLengkap('');
    setNamaPanggilan('');
    setJenisKelamin('Laki-laki');
    setTempatLahir('');
    setTanggalLahir('');
    setTanggalDaftar(new Date().toISOString().split('T')[0]);
    setNamaWali('');
    setNoHpWali('');
    setAlamat('');
    setLokasi('');
    setKelas('');
    setPelatihPemilik('');
    setPelatihDiminta('');
    setPaket('');
    setHargaPaket(0);
    setKuotaPertemuan(0);
    setBiayaRequest(0);
    setDiskon('');
    setStatusSiswa('Aktif');
    setNominalDibayar('');
    setMetodePembayaran('Tunai');
    setHasilDaftar(null);
    setCurrentStep(1);
  };

  // Step Validation Logic
  const validateStep = (step: StepId): boolean => {
    if (step === 1) {
      if (!namaLengkap.trim()) {
        toast.warning('Mohon isi Nama Lengkap siswa.');
        return false;
      }
      if (!namaPanggilan.trim()) {
        toast.warning('Mohon isi Nama Panggilan siswa.');
        return false;
      }
      if (!tanggalDaftar) {
        toast.warning('Mohon tentukan Tanggal Daftar.');
        return false;
      }
      return true;
    }

    if (step === 2) {
      if (!namaWali.trim()) {
        toast.warning('Mohon isi Nama Wali.');
        return false;
      }
      if (!noHpWali.trim()) {
        toast.warning('Mohon isi Nomor WhatsApp Wali.');
        return false;
      }
      return true;
    }

    if (step === 3) {
      if (!lokasi) {
        toast.warning('Mohon pilih Lokasi Latihan.');
        return false;
      }
      if (!kelas) {
        toast.warning('Mohon pilih Jenis Kelas.');
        return false;
      }
      if (!pelatihPemilik) {
        toast.warning('Mohon pilih Pelatih Pemilik.');
        return false;
      }
      if (!paket) {
        toast.warning('Mohon pilih Paket Latihan.');
        return false;
      }
      return true;
    }

    return true;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 4) {
        setCurrentStep((prev) => (prev + 1) as StepId);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as StepId);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleStepClick = (targetStep: StepId) => {
    if (targetStep < currentStep) {
      setCurrentStep(targetStep);
      return;
    }
    for (let s = currentStep; s < targetStep; s++) {
      if (!validateStep(s as StepId)) return;
    }
    setCurrentStep(targetStep);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(1) || !validateStep(2) || !validateStep(3)) {
      return;
    }

    if (nominalDibayar === '' || Number(nominalDibayar) < 0) {
      toast.warning('Mohon masukkan Nominal Pembayaran.');
      return;
    }

    setSubmitting(true);
    const coachOwner = pelatihList.find((p) => p.id === pelatihPemilik);
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
        diskon: diskonNum,
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
        diskon: diskonNum,
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
      mutate(SWR_KEYS.SISWA_REKAPAN);
      mutate(SWR_KEYS.DASHBOARD);

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

  const progressPercent = (currentStep / 4) * 100;
  const currentStepObj = STEPS.find((s) => s.id === currentStep)!;

  return (
    <>
      <Topbar
        title="Pendaftaran Siswa"
        subtitle="Pendaftaran siswa baru bertahap, paket, pembayaran dan kuitansi"
      />

      {/* HASIL PENDAFTARAN (JIKA BERHASIL) */}
      {hasilDaftar ? (
        <section id="bagianSetelahDaftar" className="panel">
          <div className="section-title">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-success)',
                }}
              >
                <FileCheck2 size={24} />
              </div>
              <div>
                <h2>Pendaftaran Berhasil!</h2>
                <p>Data siswa tersimpan dan kuitansi resmi siap digunakan</p>
              </div>
            </div>
          </div>

          <div className="package-summary" style={{ marginTop: '16px' }}>
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

            <div className="button-area" style={{ marginTop: '20px' }}>
              <button
                type="button"
                id="btnUnduhUlang"
                className="secondary"
                onClick={() => generateKuitansiPDF(hasilDaftar.kuitansi)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                <Download size={16} />
                Unduh Ulang Kuitansi PDF
              </button>

              <button
                type="button"
                id="btnWhatsApp"
                className="primary"
                onClick={handleKirimWhatsApp}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#25D366',
                  borderColor: '#25D366',
                }}
              >
                <MessageCircle size={16} />
                Buka WhatsApp Wali
              </button>

              <button
                type="button"
                className="secondary"
                onClick={resetForm}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                <PlusCircle size={16} />
                Daftarkan Siswa Baru
              </button>
            </div>
          </div>
        </section>
      ) : (
        /* FORM PENDAFTARAN WIZARD MULTI-STEP */
        <section className="panel">
          {/* STEPPER HEADER (DESKTOP) */}
          <div className="wizard-stepper-wrapper">
            <nav className="wizard-stepper" aria-label="Progress Pendaftaran">
              {STEPS.map((step, idx) => {
                const Icon = step.icon;
                const isActive = currentStep === step.id;
                const isCompleted = currentStep > step.id;

                return (
                  <React.Fragment key={step.id}>
                    <button
                      type="button"
                      className={`wizard-step-item ${isActive ? 'active' : ''} ${
                        isCompleted ? 'completed' : ''
                      }`}
                      onClick={() => handleStepClick(step.id)}
                      aria-current={isActive ? 'step' : undefined}
                    >
                      <div className="wizard-step-icon">
                        {isCompleted ? <Check size={18} /> : <Icon size={18} />}
                      </div>
                      <div className="wizard-step-info">
                        <span className="wizard-step-title">{step.title}</span>
                        <span className="wizard-step-desc">{step.desc}</span>
                      </div>
                    </button>

                    {idx < STEPS.length - 1 && (
                      <div
                        className={`wizard-step-divider ${
                          currentStep > step.id ? 'filled' : ''
                        }`}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </nav>

            {/* STEPPER HEADER (MOBILE) */}
            <div className="wizard-mobile-stepper">
              <div className="wizard-mobile-header">
                <div>
                  <span className="wizard-mobile-step-badge">
                    Langkah {currentStep} dari 4
                  </span>
                  <div className="wizard-mobile-step-title">{currentStepObj.title}</div>
                </div>
                <div style={{ color: 'var(--text-dim)', fontSize: '12px' }}>
                  {Math.round(progressPercent)}%
                </div>
              </div>

              <div className="wizard-mobile-progress-track">
                <div
                  className="wizard-mobile-progress-bar"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className="wizard-mobile-pills">
                {STEPS.map((step) => {
                  const isActive = currentStep === step.id;
                  const isCompleted = currentStep > step.id;
                  return (
                    <button
                      key={step.id}
                      type="button"
                      className={`wizard-mobile-pill ${isActive ? 'active' : ''} ${
                        isCompleted ? 'completed' : ''
                      }`}
                      onClick={() => handleStepClick(step.id)}
                    >
                      {isCompleted ? <Check size={13} /> : step.id}
                      <span>{step.title.split(' ')[0]}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <form id="formPendaftaran" onSubmit={handleSubmit}>
            {/* ============================================================== */}
            {/* STEP 1: BIODATA SISWA                                          */}
            {/* ============================================================== */}
            {currentStep === 1 && (
              <div className="wizard-step-content">
                <div className="section-title">
                  <div>
                    <h2>1. Biodata Siswa</h2>
                    <p>Informasi identitas dan tanggal pendaftaran calon siswa</p>
                  </div>
                </div>

                <div className="form-grid">
                  <label>
                    Nama Lengkap *
                    <input
                      type="text"
                      id="namaLengkap"
                      required
                      placeholder="Contoh: Muhammad Kevin Sanjaya"
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
                      placeholder="Contoh: Kevin"
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
                      placeholder="Contoh: Jakarta"
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

                <div className="wizard-actions">
                  <button
                    type="button"
                    className="secondary"
                    onClick={resetForm}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <RotateCcw size={15} />
                    Bersihkan
                  </button>

                  <button
                    type="button"
                    className="primary wizard-btn-next"
                    onClick={handleNextStep}
                  >
                    Lanjut ke Data Wali
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* STEP 2: DATA WALI & KONTAK                                     */}
            {/* ============================================================== */}
            {currentStep === 2 && (
              <div className="wizard-step-content">
                <div className="section-title">
                  <div>
                    <h2>2. Data Wali</h2>
                    <p>Nomor WhatsApp aktif digunakan untuk pengiriman kuitansi digital</p>
                  </div>
                </div>

                <div className="form-grid">
                  <label>
                    Nama Wali *
                    <input
                      type="text"
                      id="namaWali"
                      required
                      placeholder="Nama orang tua / wali"
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
                    Alamat Domisili
                    <textarea
                      id="alamat"
                      rows={3}
                      placeholder="Alamat lengkap tempat tinggal"
                      value={alamat}
                      onChange={(e) => setAlamat(e.target.value)}
                    ></textarea>
                  </label>
                </div>

                <div className="wizard-actions">
                  <button
                    type="button"
                    className="secondary wizard-btn-prev"
                    onClick={handlePrevStep}
                  >
                    <ArrowLeft size={16} />
                    Kembali ke Biodata
                  </button>

                  <button
                    type="button"
                    className="primary wizard-btn-next"
                    onClick={handleNextStep}
                  >
                    Lanjut ke Lokasi & Paket
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* STEP 3: LOKASI, KELAS & PAKET                                  */}
            {/* ============================================================== */}
            {currentStep === 3 && (
              <div className="wizard-step-content">
                <div className="section-title">
                  <div>
                    <h2>3. Lokasi, Kelas & Paket</h2>
                    <p>Tentukan lokasi latihan, kelas, pelatih, dan paket yang diambil</p>
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

                  {/* DISKON INPUT - BUG FIXED: Allows clean backspace & empty input */}
                  <label>
                    Diskon (Potongan Harga)
                    <input
                      type="number"
                      id="diskon"
                      min="0"
                      placeholder="0"
                      value={diskon}
                      onChange={(e) => {
                        const val = e.target.value;
                        setDiskon(val === '' ? '' : Math.max(0, Number(val)));
                      }}
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

                {/* RINGKASAN PAKET PREVIEW */}
                {paket && (
                  <div id="ringkasanPaket" className="package-summary" style={{ marginTop: '18px' }}>
                    <div className="summary-heading">
                      <h3>Ringkasan Paket Terpilih</h3>
                      <p>Rincian alokasi kelas dan estimasi tagihan</p>
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
                        <strong id="ringkasanDiskon">{formatRupiah(diskonNum)}</strong>
                      </div>

                      <div className="summary-item">
                        <span>Total Tagihan</span>
                        <strong id="ringkasanTotalTagihan">{formatRupiah(totalTagihan)}</strong>
                      </div>
                    </div>
                  </div>
                )}

                <div className="wizard-actions">
                  <button
                    type="button"
                    className="secondary wizard-btn-prev"
                    onClick={handlePrevStep}
                  >
                    <ArrowLeft size={16} />
                    Kembali ke Data Wali
                  </button>

                  <button
                    type="button"
                    className="primary wizard-btn-next"
                    onClick={handleNextStep}
                  >
                    Lanjut ke Pembayaran
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* STEP 4: PEMBAYARAN SPP AWAL & KONFIRMASI                       */}
            {/* ============================================================== */}
            {currentStep === 4 && (
              <div className="wizard-step-content">
                <div className="section-title">
                  <div>
                    <h2>4. Pembayaran SPP Awal</h2>
                    <p>Rincian tagihan awal dan konfirmasi pembayaran</p>
                  </div>
                </div>

                {/* REKAP RINGKAS DATA SISWA & PAKET */}
                <div className="wizard-summary-recap">
                  <div className="wizard-summary-recap-header">
                    <h4>
                      <Sparkles size={16} color="var(--color-primary)" />
                      Konfirmasi Pendaftaran
                    </h4>
                    <button
                      type="button"
                      className="wizard-summary-recap-edit"
                      onClick={() => setCurrentStep(1)}
                    >
                      Ubah Data
                    </button>
                  </div>

                  <div className="wizard-recap-grid">
                    <div className="wizard-recap-item">
                      <span>Calon Siswa</span>
                      <strong>{namaLengkap || '-'} ({namaPanggilan || '-'})</strong>
                    </div>

                    <div className="wizard-recap-item">
                      <span>Wali & Kontak</span>
                      <strong>{namaWali || '-'} ({noHpWali || '-'})</strong>
                    </div>

                    <div className="wizard-recap-item">
                      <span>Kelas & Paket</span>
                      <strong>{kelas || '-'} • {paket || '-'} ({lokasi || '-'})</strong>
                    </div>

                    <div className="wizard-recap-item">
                      <span>Pelatih</span>
                      <strong>
                        {pelatihList.find((p) => p.id === pelatihPemilik)?.nama || '-'}
                        {pelatihDiminta ? ` (Req: ${pelatihList.find((p) => p.id === pelatihDiminta)?.nama})` : ''}
                      </strong>
                    </div>
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

                <div className="wizard-actions">
                  <button
                    type="button"
                    className="secondary wizard-btn-prev"
                    onClick={handlePrevStep}
                    disabled={submitting}
                  >
                    <ArrowLeft size={16} />
                    Kembali ke Paket
                  </button>

                  <button
                    type="submit"
                    className="primary wizard-btn-next"
                    disabled={submitting}
                  >
                    {submitting ? 'Menyimpan & Menerbitkan...' : 'Daftarkan & Buat Kuitansi PDF'}
                  </button>
                </div>
              </div>
            )}
          </form>
        </section>
      )}
    </>
  );
}
