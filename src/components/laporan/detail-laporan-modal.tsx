'use client';

import React, { useState } from 'react';
import {
  Award,
  Download,
  Share2,
  CheckCircle2,
  Calendar,
  User,
  Star,
  Activity,
  ArrowRight,
  Phone,
} from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LaporanDetailData } from '@/types/laporan';
import { generateRaporPDF, generateSertifikatPDF } from '@/lib/pdf/laporan-pdf';
import { formatTanggal } from '@/lib/utils';
import { updateStatusLaporanAction } from '@/server/actions/laporan.actions';

interface DetailLaporanModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: LaporanDetailData | null;
  onStatusUpdated?: () => void;
}

const BULAN_NAMES = [
  '',
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

export function DetailLaporanModal({
  isOpen,
  onClose,
  data,
  onStatusUpdated,
}: DetailLaporanModalProps) {
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  if (!data) return null;
  const { laporan, details, sertifikat } = data;

  const handleDownloadRapor = () => {
    generateRaporPDF(data);
  };

  const handleDownloadSertifikat = () => {
    if (sertifikat) {
      generateSertifikatPDF(sertifikat, laporan.nama_siswa, laporan.id_siswa);
    } else {
      const fallbackCert = {
        id: 'temp',
        laporan_id: laporan.id,
        siswa_id: laporan.siswa_id,
        nomor_sertifikat:
          laporan.nomor_sertifikat || `CERT/KESIT/${laporan.periode_tahun}/001`,
        level_kelulusan: laporan.rekomendasi_level || laporan.level_saat_ini,
        tanggal_terbit: laporan.tanggal_penilaian,
        penandatangan_nama: 'Head Coach KESIT',
        penandatangan_jabatan: 'Kepala Pelatih & Evaluator',
        predikat:
          Number(laporan.nilai_rata_rata) >= 4.5
            ? 'Dengan Pujian (Cum Laude)'
            : Number(laporan.nilai_rata_rata) >= 4.0
            ? 'Sangat Baik'
            : 'Baik',
        created_at: new Date().toISOString(),
      };
      generateSertifikatPDF(fallbackCert, laporan.nama_siswa, laporan.id_siswa);
    }
  };

  const handleShareWhatsApp = () => {
    const rawPhone = laporan.no_hp_wali || '';
    let formattedPhone = rawPhone.replace(/\D/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '62' + formattedPhone.slice(1);
    }

    const naikInfo =
      laporan.status_kenaikan === 'Naik Level' || laporan.status_kenaikan === 'Lulus Tingkat'
        ? `🎉 *Selamat! Ananda dinyatakan ${laporan.status_kenaikan.toUpperCase()} ke: ${
            laporan.rekomendasi_level || laporan.level_saat_ini
          }*`
        : `*Status Evaluasi:* ${laporan.status_kenaikan} (${laporan.level_saat_ini})`;

    const text = `Halo Bapak/Ibu Wali dari *${laporan.nama_siswa}*,

Berikut ringkasan hasil evaluasi dan Rapor Perkembangan Renang di *KESIT Swimming Club*:
📋 *No. Rapor:* ${laporan.nomor_rapor}
🗓️ *Periode:* ${BULAN_NAMES[laporan.periode_bulan]} ${laporan.periode_tahun}
🏊 *Level Saat Ini:* ${laporan.level_saat_ini}
⭐ *Nilai Rata-rata:* ${Number(laporan.nilai_rata_rata).toFixed(2)} / 5.00
${naikInfo}

👨‍🏫 *Catatan Pelatih (${laporan.nama_pelatih}):*
"${laporan.catatan_pelatih || laporan.catatan_umum || 'Perkembangan teknik renang ananda sangat membanggakan. Terus jaga semangat latihan!'}"

Dokumen Rapor & Sertifikat resmi telah diterbitkan oleh Manajemen KESIT. Terima kasih atas kepercayaan dan kerjasamanya! 🙏`;

    const url = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(
      text
    )}`;
    window.open(url, '_blank');
  };

  const handleMarkAsSent = async () => {
    setIsUpdatingStatus(true);
    try {
      const res = await updateStatusLaporanAction(laporan.id, 'Terkirim');
      if (res.success && onStatusUpdated) {
        onStatusUpdated();
      }
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const canDownloadCert =
    laporan.status_kenaikan === 'Naik Level' ||
    laporan.status_kenaikan === 'Lulus Tingkat' ||
    Boolean(laporan.sertifikat_id);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Detail Rapor Perkembangan Siswa"
      subtitle={`No. Rapor: ${laporan.nomor_rapor}`}
      maxWidth="3xl"
      noPadding
    >
      {/* Scrollable Body */}
      <div className="p-4 sm:p-6 space-y-5 overflow-y-auto max-h-[calc(88vh-135px)] custom-scrollbar flex-1">
        
        {/* Header Summary Card */}
        <div className="bg-gradient-to-r from-[#1e232d] to-[#16191f] border border-[#2e3440] rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Student identity */}
            <div className="flex items-start gap-3.5 min-w-0">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400 font-bold text-base sm:text-lg shrink-0">
                {laporan.nama_siswa.charAt(0)}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base sm:text-lg font-bold text-white leading-tight">
                    {laporan.nama_siswa}
                  </h3>
                  <span className="text-xs px-2 py-0.5 rounded-md bg-[#252a34] text-slate-300 font-mono">
                    {laporan.id_siswa}
                  </span>
                  <Badge
                    variant={
                      laporan.status_dokumen === 'Final'
                        ? 'success'
                        : laporan.status_dokumen === 'Terkirim'
                        ? 'info'
                        : 'warning'
                    }
                    className="text-xs"
                  >
                    {laporan.status_dokumen}
                  </Badge>
                </div>

                <div className="text-xs text-slate-300 mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span>Wali: <strong className="text-white">{laporan.nama_wali || '-'}</strong></span>
                  {laporan.no_hp_wali && (
                    <span className="flex items-center gap-1 text-slate-400">
                      <Phone className="w-3 h-3 text-slate-500" />
                      {laporan.no_hp_wali}
                    </span>
                  )}
                  <span>Pelatih: <strong className="text-sky-400">{laporan.nama_pelatih}</strong></span>
                </div>
              </div>
            </div>

            {/* Score Highlight Box */}
            <div className="flex items-center justify-between sm:justify-start gap-3 bg-[#111317] border border-[#262a34] px-4 py-2.5 rounded-xl shrink-0">
              <div>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                  Nilai Rata-Rata
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span className="text-lg sm:text-xl font-black text-white">
                    {Number(laporan.nilai_rata_rata || 0).toFixed(2)}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">/ 5.0</span>
                </div>
              </div>
            </div>
          </div>

          {/* Level Transition Pill */}
          <div className="pt-3 border-t border-[#2a2f3a] flex flex-wrap items-center justify-between gap-2.5 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-slate-400">Jenjang:</span>
              <span className="px-2.5 py-1 rounded-md bg-[#242933] text-slate-200 font-semibold">
                {laporan.level_saat_ini}
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span
                className={`px-2.5 py-1 rounded-md font-bold ${
                  laporan.status_kenaikan !== 'Bertahan'
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'bg-[#242933] text-slate-400'
                }`}
              >
                {laporan.rekomendasi_level || laporan.level_saat_ini} ({laporan.status_kenaikan})
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-slate-400">
              <Calendar className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span>
                {BULAN_NAMES[laporan.periode_bulan]} {laporan.periode_tahun} ({formatTanggal(laporan.tanggal_penilaian)})
              </span>
            </div>
          </div>
        </div>

        {/* Detailed Competency Scorecard */}
        <div className="space-y-3">
          <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-sky-400 shrink-0" />
            <span>Evaluasi Penguasaan Teknik Renang ({details.length} Aspek Dinilai)</span>
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {details.map((item, idx) => (
              <div
                key={idx}
                className="bg-[#181a20] border border-[#272b35] rounded-xl p-3.5 sm:p-4 space-y-3"
              >
                {/* Header aspect */}
                <div className="flex items-center justify-between gap-2">
                  <h5 className="text-xs sm:text-sm font-bold text-slate-100 flex items-center gap-2 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-sky-400 shrink-0" />
                    <span className="truncate">{item.kategori_teknik}</span>
                  </h5>
                  <div className="flex items-center gap-1 bg-[#232731] px-2.5 py-1 rounded-md shrink-0">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span className="text-xs font-bold text-white">
                      {Number(item.skor_akhir_gaya || 0).toFixed(1)}
                    </span>
                  </div>
                </div>

                {/* Sub-scores: responsive layout so text is NEVER truncated */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 text-xs">
                  <div className="bg-[#131519] p-2 rounded-lg border border-[#222630] flex flex-col justify-between">
                    <p className="text-slate-400 text-[11px] leading-tight">Posisi</p>
                    <p className="font-extrabold text-white mt-0.5">
                      {Number(item.skor_posisi_tubuh || 0).toFixed(1)}
                    </p>
                  </div>
                  <div className="bg-[#131519] p-2 rounded-lg border border-[#222630] flex flex-col justify-between">
                    <p className="text-slate-400 text-[11px] leading-tight">Kaki</p>
                    <p className="font-extrabold text-white mt-0.5">
                      {Number(item.skor_gerakan_kaki || 0).toFixed(1)}
                    </p>
                  </div>
                  <div className="bg-[#131519] p-2 rounded-lg border border-[#222630] flex flex-col justify-between">
                    <p className="text-slate-400 text-[11px] leading-tight">Tangan</p>
                    <p className="font-extrabold text-white mt-0.5">
                      {Number(item.skor_gerakan_tangan || 0).toFixed(1)}
                    </p>
                  </div>
                  <div className="bg-[#131519] p-2 rounded-lg border border-[#222630] flex flex-col justify-between">
                    <p className="text-slate-400 text-[11px] leading-tight">Napas</p>
                    <p className="font-extrabold text-white mt-0.5">
                      {Number(item.skor_pernapasan || 0).toFixed(1)}
                    </p>
                  </div>
                  <div className="bg-[#131519] p-2 rounded-lg border border-[#222630] col-span-2 sm:col-span-1 flex flex-col justify-between">
                    <p className="text-slate-400 text-[11px] leading-tight">Koordinasi</p>
                    <p className="font-extrabold text-white mt-0.5">
                      {Number(item.skor_koordinasi || 0).toFixed(1)}
                    </p>
                  </div>
                </div>

                {/* Distance and remarks */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-400 pt-2 border-t border-[#232731] gap-1">
                  <span>
                    Jarak / Waktu:{' '}
                    <strong className="text-slate-200">
                      {item.jarak_tempuh_meter > 0 ? `${item.jarak_tempuh_meter}m` : '-'}
                      {item.catatan_waktu_detik > 0
                        ? ` (${item.catatan_waktu_detik} dtk)`
                        : ''}
                    </strong>
                  </span>
                  {item.keterangan && (
                    <span className="text-slate-300 italic truncate max-w-full sm:max-w-[200px]">
                      &quot;{item.keterangan}&quot;
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Coach Remarks Card */}
        <div className="bg-[#181a20] border border-[#272b35] rounded-xl p-4 space-y-2">
          <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
            <User className="w-3.5 h-3.5 text-sky-400" />
            <span>Catatan Pembinaan Pelatih</span>
          </h4>
          <p className="text-xs sm:text-sm text-slate-200 bg-[#121418] p-3 rounded-lg border border-[#22252e] leading-relaxed">
            {laporan.catatan_pelatih ||
              laporan.catatan_umum ||
              'Tidak ada catatan khusus dari pelatih.'}
          </p>
        </div>

        {/* Certificate Card (if applicable) */}
        {canDownloadCert && (
          <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/25 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-amber-500/20 text-amber-400 shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h5 className="text-xs sm:text-sm font-bold text-white">
                  Sertifikat Kelulusan &amp; Kenaikan Tingkat
                </h5>
                <p className="text-xs text-slate-300 mt-0.5">
                  {sertifikat?.nomor_sertifikat ||
                    laporan.nomor_sertifikat ||
                    'Tersedia untuk diunduh resmi'}
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleDownloadSertifikat}
              className="border-amber-500/40 text-amber-300 hover:bg-amber-500/10 gap-1.5 text-xs font-semibold h-9 w-full sm:w-auto shrink-0 justify-center"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh Sertifikat</span>
            </Button>
          </div>
        )}
      </div>

      {/* Modal Sticky Footer Actions */}
      <div className="p-3.5 sm:px-6 sm:py-3.5 border-t border-[#262a34] bg-[#14161b] flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 shrink-0">
        <div className="flex items-center justify-between sm:justify-start gap-2">
          {laporan.status_dokumen === 'Final' && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleMarkAsSent}
              disabled={isUpdatingStatus}
              className="text-xs border-[#353b49] text-slate-300 hover:text-white h-9"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mr-1.5" />
              Tandai Terkirim
            </Button>
          )}

          <Button
            size="sm"
            variant="ghost"
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-white h-9"
          >
            Tutup
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleShareWhatsApp}
            className="text-xs font-semibold border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 gap-1.5 h-9 flex-1 sm:flex-initial justify-center"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Kirim WhatsApp</span>
          </Button>

          <Button
            size="sm"
            onClick={handleDownloadRapor}
            className="text-xs font-semibold bg-sky-500 hover:bg-sky-600 text-white gap-1.5 h-9 flex-1 sm:flex-initial justify-center shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Unduh Rapor PDF</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
}
