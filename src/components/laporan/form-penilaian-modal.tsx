'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  User,
  Calendar,
  Award,
  Star,
  Activity,
  Plus,
  Trash2,
  CheckCircle,
} from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { SiswaOption, PelatihOption } from '@/server/repositories/laporan.repository';
import {
  KategoriTeknikRenang,
  DAFTAR_LEVEL_RENANG,
  TEKNIK_DEFAULT,
  LaporanDetailData,
  StatusKenaikan,
  StatusDokumenRapor,
} from '@/types/laporan';
import { submitLaporanAction } from '@/server/actions/laporan.actions';
import { DetailEvaluasiInput } from '@/server/validators/laporan.schema';

interface FormPenilaianModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  siswaOptions: SiswaOption[];
  pelatihOptions: PelatihOption[];
  editData?: LaporanDetailData | null;
}

const BULAN_LIST = [
  { value: '1', label: 'Januari' },
  { value: '2', label: 'Februari' },
  { value: '3', label: 'Maret' },
  { value: '4', label: 'April' },
  { value: '5', label: 'Mei' },
  { value: '6', label: 'Juni' },
  { value: '7', label: 'Juli' },
  { value: '8', label: 'Agustus' },
  { value: '9', label: 'September' },
  { value: '10', label: 'Oktober' },
  { value: '11', label: 'November' },
  { value: '12', label: 'Desember' },
];

export function FormPenilaianModal({
  isOpen,
  onClose,
  onSuccess,
  siswaOptions,
  pelatihOptions,
  editData,
}: FormPenilaianModalProps) {
  const isEdit = Boolean(editData);
  const now = new Date();

  // Basic info states
  const [siswaId, setSiswaId] = useState('');
  const [pelatihId, setPelatihId] = useState('');
  const [periodeBulan, setPeriodeBulan] = useState(String(now.getMonth() + 1));
  const [periodeTahun, setPeriodeTahun] = useState(String(now.getFullYear()));
  const [tanggalPenilaian, setTanggalPenilaian] = useState(
    now.toISOString().split('T')[0]
  );
  const [levelSaatIni, setLevelSaatIni] = useState<string>(DAFTAR_LEVEL_RENANG[0]);
  const [rekomendasiLevel, setRekomendasiLevel] = useState<string>(DAFTAR_LEVEL_RENANG[1]);
  const [statusKenaikan, setStatusKenaikan] = useState<StatusKenaikan>('Bertahan');
  const [catatanPelatih, setCatatanPelatih] = useState('');
  const [catatanHeadCoach, setCatatanHeadCoach] = useState('');

  // Detailed scores
  const [evaluasiList, setEvaluasiList] = useState<DetailEvaluasiInput[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Populate on open or edit
  useEffect(() => {
    if (editData) {
      const { laporan, details } = editData;
      setSiswaId(laporan.siswa_id);
      setPelatihId(laporan.pelatih_id || '');
      setPeriodeBulan(String(laporan.periode_bulan));
      setPeriodeTahun(String(laporan.periode_tahun));
      setTanggalPenilaian(laporan.tanggal_penilaian);
      setLevelSaatIni(laporan.level_saat_ini);
      setRekomendasiLevel(laporan.rekomendasi_level || '');
      setStatusKenaikan(laporan.status_kenaikan);
      setCatatanPelatih(laporan.catatan_pelatih || laporan.catatan_umum || '');
      setCatatanHeadCoach(laporan.catatan_head_coach || '');

      setEvaluasiList(
        details.map((d) => ({
          kategori_teknik: d.kategori_teknik,
          skor_posisi_tubuh: Number(d.skor_posisi_tubuh) || 0,
          skor_gerakan_kaki: Number(d.skor_gerakan_kaki) || 0,
          skor_gerakan_tangan: Number(d.skor_gerakan_tangan) || 0,
          skor_pernapasan: Number(d.skor_pernapasan) || 0,
          skor_koordinasi: Number(d.skor_koordinasi) || 0,
          jarak_tempuh_meter: d.jarak_tempuh_meter || 0,
          catatan_waktu_detik: Number(d.catatan_waktu_detik) || 0,
          keterangan: d.keterangan || '',
        }))
      );
    } else {
      setSiswaId(siswaOptions[0]?.id || '');
      setPelatihId(pelatihOptions[0]?.id || '');
      setPeriodeBulan(String(now.getMonth() + 1));
      setPeriodeTahun(String(now.getFullYear()));
      setTanggalPenilaian(now.toISOString().split('T')[0]);
      setLevelSaatIni(DAFTAR_LEVEL_RENANG[0]);
      setRekomendasiLevel(DAFTAR_LEVEL_RENANG[1]);
      setStatusKenaikan('Bertahan');
      setCatatanPelatih('');
      setCatatanHeadCoach('');

      setEvaluasiList(
        TEKNIK_DEFAULT.map((tech) => ({
          kategori_teknik: tech,
          skor_posisi_tubuh: 3.5,
          skor_gerakan_kaki: 3.5,
          skor_gerakan_tangan: 3.5,
          skor_pernapasan: 3.5,
          skor_koordinasi: 3.5,
          jarak_tempuh_meter: tech === 'Daya Tahan & Waktu' ? 25 : 0,
          catatan_waktu_detik: 0,
          keterangan: '',
        }))
      );
    }
    setErrorMessage('');
  }, [isOpen, editData, siswaOptions, pelatihOptions]);

  // When selected student changes, auto-select assigned coach
  const handleSiswaChange = (id: string) => {
    setSiswaId(id);
    const chosen = siswaOptions.find((s) => s.id === id);
    if (chosen?.pelatih_pemilik_id) {
      setPelatihId(chosen.pelatih_pemilik_id);
    }
  };

  // Helper to update specific technique score field
  const updateScore = (
    index: number,
    field: keyof DetailEvaluasiInput,
    value: string | number
  ) => {
    setEvaluasiList((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  // Add more technique
  const handleAddTechnique = () => {
    setEvaluasiList((prev) => [
      ...prev,
      {
        kategori_teknik: 'Gaya Bebas',
        skor_posisi_tubuh: 3.0,
        skor_gerakan_kaki: 3.0,
        skor_gerakan_tangan: 3.0,
        skor_pernapasan: 3.0,
        skor_koordinasi: 3.0,
        jarak_tempuh_meter: 0,
        catatan_waktu_detik: 0,
        keterangan: '',
      },
    ]);
  };

  // Remove technique
  const handleRemoveTechnique = (index: number) => {
    if (evaluasiList.length <= 1) return;
    setEvaluasiList((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Calculate overall live average
  const calculatedAverage = useMemo(() => {
    if (evaluasiList.length === 0) return 0;
    const totalAll = evaluasiList.reduce((acc, curr) => {
      const rowAvg =
        (curr.skor_posisi_tubuh +
          curr.skor_gerakan_kaki +
          curr.skor_gerakan_tangan +
          curr.skor_pernapasan +
          curr.skor_koordinasi) /
        5;
      return acc + rowAvg;
    }, 0);
    return Number((totalAll / evaluasiList.length).toFixed(2));
  }, [evaluasiList]);

  // Handle Form Submit (Draft or Final)
  const handleSubmit = async (targetStatus: StatusDokumenRapor) => {
    setErrorMessage('');
    if (!siswaId) {
      setErrorMessage('Pilih siswa yang akan dinilai.');
      return;
    }
    if (!pelatihId) {
      setErrorMessage('Pilih pelatih penilai.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await submitLaporanAction({
        laporan_id: editData?.laporan.id,
        siswa_id: siswaId,
        pelatih_id: pelatihId,
        periode_bulan: parseInt(periodeBulan, 10),
        periode_tahun: parseInt(periodeTahun, 10),
        tanggal_penilaian: tanggalPenilaian,
        level_saat_ini: levelSaatIni,
        rekomendasi_level: rekomendasiLevel,
        status_kenaikan: statusKenaikan,
        status_dokumen: targetStatus,
        catatan_umum: catatanPelatih,
        catatan_pelatih: catatanPelatih,
        catatan_head_coach: catatanHeadCoach,
        detail_evaluasi: evaluasiList,
      });

      if (!res.success) {
        setErrorMessage(res.error || 'Gagal menyimpan rapor siswa.');
      } else {
        onSuccess();
        onClose();
      }
    } catch {
      setErrorMessage('Terjadi kesalahan sistem saat menyimpan rapor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Rapor Siswa' : 'Buat Rapor Perkembangan Siswa'}
      subtitle="Evaluasi berkala kompetensi teknik renang & rekomendasi tingkat"
      maxWidth="3xl"
      noPadding
    >
      {/* Scrollable Form Body */}
      <div className="p-4 sm:p-6 space-y-5 overflow-y-auto max-h-[calc(88vh-135px)] custom-scrollbar flex-1">
        
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs sm:text-sm font-medium">
            {errorMessage}
          </div>
        )}

        {/* Section 1: Basic Info */}
        <div className="bg-[#181a20] border border-[#272b35] rounded-xl p-4 sm:p-5 space-y-4">
          <h4 className="text-xs sm:text-sm font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
            <User className="w-4 h-4" />
            <span>1. Data Siswa &amp; Periode Evaluasi</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Student */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Pilih Siswa Renang *
              </label>
              <Select
                value={siswaId}
                onChange={(e) => handleSiswaChange(e.target.value)}
                disabled={isEdit}
                className="text-sm bg-[#131519] h-10"
              >
                <option value="">-- Pilih Siswa --</option>
                {siswaOptions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nama_lengkap} ({s.id_siswa}) - {s.kelas || 'Reguler'}
                  </option>
                ))}
              </Select>
            </div>

            {/* Coach */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Pelatih Penilai *
              </label>
              <Select
                value={pelatihId}
                onChange={(e) => setPelatihId(e.target.value)}
                className="text-sm bg-[#131519] h-10"
              >
                <option value="">-- Pilih Pelatih --</option>
                {pelatihOptions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nama}
                  </option>
                ))}
              </Select>
            </div>

            {/* Month */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Periode Bulan
              </label>
              <Select
                value={periodeBulan}
                onChange={(e) => setPeriodeBulan(e.target.value)}
                className="text-sm bg-[#131519] h-10"
              >
                {BULAN_LIST.map((b) => (
                  <option key={b.value} value={b.value}>
                    {b.label}
                  </option>
                ))}
              </Select>
            </div>

            {/* Year */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Periode Tahun
              </label>
              <Input
                type="number"
                value={periodeTahun}
                onChange={(e) => setPeriodeTahun(e.target.value)}
                min={2020}
                max={2030}
                className="text-sm bg-[#131519] h-10"
              />
            </div>

            {/* Date */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Tanggal Evaluasi / Penilaian
              </label>
              <Input
                type="date"
                value={tanggalPenilaian}
                onChange={(e) => setTanggalPenilaian(e.target.value)}
                className="text-sm bg-[#131519] h-10"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Level Progression */}
        <div className="bg-[#181a20] border border-[#272b35] rounded-xl p-4 sm:p-5 space-y-4">
          <h4 className="text-xs sm:text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <Award className="w-4 h-4" />
            <span>2. Jenjang &amp; Status Kenaikan Tingkat</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Level Saat Ini
              </label>
              <Select
                value={levelSaatIni}
                onChange={(e) => setLevelSaatIni(e.target.value)}
                className="text-sm bg-[#131519] h-10"
              >
                {DAFTAR_LEVEL_RENANG.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Rekomendasi Level Berikutnya
              </label>
              <Select
                value={rekomendasiLevel}
                onChange={(e) => setRekomendasiLevel(e.target.value)}
                className="text-sm bg-[#131519] h-10"
              >
                {DAFTAR_LEVEL_RENANG.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Status Keputusan
              </label>
              <Select
                value={statusKenaikan}
                onChange={(e) => setStatusKenaikan(e.target.value as StatusKenaikan)}
                className="text-sm bg-[#131519] h-10"
              >
                <option value="Bertahan">Bertahan di Level Ini</option>
                <option value="Naik Level">Naik Level Berikutnya</option>
                <option value="Lulus Tingkat">Lulus Tingkat (Cetak Sertifikat)</option>
              </Select>
            </div>
          </div>
        </div>

        {/* Section 3: Scorecard 6 Swimming Techniques */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <h4 className="text-xs sm:text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-4 h-4" />
              <span>3. Evaluasi Aspek Teknik Renang (Skala 0 - 5.0)</span>
            </h4>

            {/* Live Score Counter */}
            <div className="flex items-center gap-2 bg-[#121418] border border-[#272b35] px-3.5 py-1.5 rounded-lg shrink-0 self-start sm:self-auto">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span className="text-xs text-slate-300 font-medium">Rata-rata:</span>
              <span className="text-sm font-extrabold text-white">
                {calculatedAverage.toFixed(2)}
              </span>
              <span className="text-xs text-slate-500">/ 5.0</span>
            </div>
          </div>

          <div className="space-y-3.5">
            {evaluasiList.map((item, index) => {
              const itemAvg = (
                (item.skor_posisi_tubuh +
                  item.skor_gerakan_kaki +
                  item.skor_gerakan_tangan +
                  item.skor_pernapasan +
                  item.skor_koordinasi) /
                5.0
              ).toFixed(1);

              return (
                <div
                  key={index}
                  className="bg-[#181a20] border border-[#272b35] rounded-xl p-3.5 sm:p-4 space-y-3.5 relative group shadow-2xs"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <span className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 text-xs font-bold flex items-center justify-center shrink-0">
                        {index + 1}
                      </span>
                      <Select
                        value={item.kategori_teknik}
                        onChange={(e) =>
                          updateScore(
                            index,
                            'kategori_teknik',
                            e.target.value as KategoriTeknikRenang
                          )
                        }
                        className="text-xs sm:text-sm font-bold text-white bg-[#131519] max-w-full sm:max-w-[260px] h-9"
                      >
                        {TEKNIK_DEFAULT.map((tech) => (
                          <option key={tech} value={tech}>
                            {tech}
                          </option>
                        ))}
                      </Select>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center gap-1.5 bg-[#121419] px-2.5 py-1 rounded-md border border-[#242833]">
                        <span className="text-xs text-slate-400">Rata:</span>
                        <span className="text-xs font-bold text-sky-400">{itemAvg}</span>
                      </div>
                      {evaluasiList.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveTechnique(index)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Hapus baris ini"
                          aria-label="Hapus baris"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 5 Indicator Rating Inputs */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Posisi Tubuh ({item.skor_posisi_tubuh})
                      </label>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="5"
                        value={item.skor_posisi_tubuh}
                        onChange={(e) =>
                          updateScore(
                            index,
                            'skor_posisi_tubuh',
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="text-center font-bold text-sm bg-[#121418] h-9"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Gerakan Kaki ({item.skor_gerakan_kaki})
                      </label>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="5"
                        value={item.skor_gerakan_kaki}
                        onChange={(e) =>
                          updateScore(
                            index,
                            'skor_gerakan_kaki',
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="text-center font-bold text-sm bg-[#121418] h-9"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Gerakan Tangan ({item.skor_gerakan_tangan})
                      </label>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="5"
                        value={item.skor_gerakan_tangan}
                        onChange={(e) =>
                          updateScore(
                            index,
                            'skor_gerakan_tangan',
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="text-center font-bold text-sm bg-[#121418] h-9"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Pernapasan ({item.skor_pernapasan})
                      </label>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="5"
                        value={item.skor_pernapasan}
                        onChange={(e) =>
                          updateScore(
                            index,
                            'skor_pernapasan',
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="text-center font-bold text-sm bg-[#121418] h-9"
                      />
                    </div>

                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Koordinasi ({item.skor_koordinasi})
                      </label>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="5"
                        value={item.skor_koordinasi}
                        onChange={(e) =>
                          updateScore(
                            index,
                            'skor_koordinasi',
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="text-center font-bold text-sm bg-[#121418] h-9"
                      />
                    </div>
                  </div>

                  {/* Distance, Time Trial, and remarks */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-[#232731]">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">
                        Jarak Tempuh (meter)
                      </label>
                      <Input
                        type="number"
                        placeholder="Contoh: 25"
                        value={item.jarak_tempuh_meter || ''}
                        onChange={(e) =>
                          updateScore(
                            index,
                            'jarak_tempuh_meter',
                            parseInt(e.target.value, 10) || 0
                          )
                        }
                        className="text-xs sm:text-sm bg-[#121418] h-9"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-slate-400 mb-1">
                        Waktu Tempuh (detik)
                      </label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="Contoh: 28.5"
                        value={item.catatan_waktu_detik || ''}
                        onChange={(e) =>
                          updateScore(
                            index,
                            'catatan_waktu_detik',
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="text-xs sm:text-sm bg-[#121418] h-9"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-slate-400 mb-1">
                        Keterangan Capaian
                      </label>
                      <Input
                        type="text"
                        placeholder="Catatan teknik..."
                        value={item.keterangan || ''}
                        onChange={(e) =>
                          updateScore(index, 'keterangan', e.target.value)
                        }
                        className="text-xs sm:text-sm bg-[#121418] h-9"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddTechnique}
            className="w-full border-dashed border-[#2f3542] text-slate-300 hover:text-white text-xs sm:text-sm gap-1.5 py-3 h-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Aspek / Gaya Renang Lainnya</span>
          </Button>
        </div>

        {/* Section 4: Catatan Pelatih & Head Coach */}
        <div className="bg-[#181a20] border border-[#272b35] rounded-xl p-4 sm:p-5 space-y-3.5">
          <h4 className="text-xs sm:text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-sky-400" />
            <span>4. Catatan Pembinaan &amp; Saran Latihan</span>
          </h4>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Catatan Pelatih untuk Siswa &amp; Wali
            </label>
            <textarea
              rows={3}
              value={catatanPelatih}
              onChange={(e) => setCatatanPelatih(e.target.value)}
              placeholder="Contoh: Kemampuan meluncur dan kayuhan tangan gaya dada sudah sangat rapi. Perlu memperkuat daya tahan napas pada jarak 50m..."
              className="w-full rounded-xl bg-[#121418] border border-[#272b35] p-3 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-hidden focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Catatan Review Head Coach (Opsional)
            </label>
            <Input
              type="text"
              value={catatanHeadCoach}
              onChange={(e) => setCatatanHeadCoach(e.target.value)}
              placeholder="Contoh: Disetujui naik ke jenjang Intermediate..."
              className="text-xs sm:text-sm bg-[#121418] h-10"
            />
          </div>
        </div>
      </div>

      {/* Modal Sticky Footer Actions */}
      <div className="p-3.5 sm:px-6 sm:py-3.5 border-t border-[#262a34] bg-[#14161b] flex items-center justify-between gap-3 shrink-0">
        <Button
          type="button"
          variant="ghost"
          onClick={onClose}
          disabled={isSubmitting}
          className="text-xs sm:text-sm text-slate-400 hover:text-white h-9 sm:h-10"
        >
          Batal
        </Button>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleSubmit('Draft')}
            disabled={isSubmitting}
            className="text-xs sm:text-sm font-semibold border-[#363c4a] text-slate-300 hover:text-white h-9 sm:h-10"
          >
            Simpan Draft
          </Button>

          <Button
            type="button"
            onClick={() => handleSubmit('Final')}
            disabled={isSubmitting}
            className="text-xs sm:text-sm font-semibold bg-sky-500 hover:bg-sky-600 text-white gap-1.5 h-9 sm:h-10 shadow-xs"
          >
            <CheckCircle className="w-4 h-4" />
            <span>{isSubmitting ? 'Menyimpan...' : 'Finalisasi & Terbitkan'}</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
}
