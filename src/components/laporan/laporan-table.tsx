'use client';

import React from 'react';
import {
  FileText,
  Eye,
  Download,
  Share2,
  Award,
  Star,
  Edit2,
  Trash2,
  ArrowRight,
  User,
  GraduationCap,
  CalendarDays,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { VLaporanSiswa } from '@/types/laporan';
import { formatTanggal } from '@/lib/utils';

interface LaporanTableProps {
  list: VLaporanSiswa[];
  loading: boolean;
  onViewDetail: (laporanId: string) => void;
  onEdit: (laporanId: string) => void;
  onDelete: (laporanId: string) => void;
  onQuickDownload: (laporanId: string) => void;
  onQuickShare: (item: VLaporanSiswa) => void;
  userRole?: string;
}

const BULAN_NAMES = [
  '',
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
];

function StatusDokumenBadge({ status }: { status: string }) {
  return (
    <Badge
      variant={
        status === 'Final' ? 'success' : status === 'Terkirim' ? 'info' : 'warning'
      }
      className="text-xs font-semibold px-2.5 py-0.5"
    >
      {status}
    </Badge>
  );
}

function KenaikanBadge({ status }: { status: string }) {
  const isNaik = status === 'Naik Level' || status === 'Lulus Tingkat';
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold ${
        isNaik
          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
          : 'bg-slate-700/30 text-slate-400 border border-slate-700/50'
      }`}
    >
      {isNaik && <Award className="w-3.5 h-3.5" />}
      {status}
    </span>
  );
}

// ─── Card untuk tampilan Mobile (< lg) ──────────────────────────────────────
function LaporanCard({
  item,
  onViewDetail,
  onEdit,
  onDelete,
  onQuickDownload,
  onQuickShare,
  userRole,
}: {
  item: VLaporanSiswa;
  onViewDetail: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onQuickDownload: (id: string) => void;
  onQuickShare: (item: VLaporanSiswa) => void;
  userRole?: string;
}) {
  const isNaik = item.status_kenaikan === 'Naik Level' || item.status_kenaikan === 'Lulus Tingkat';
  const rataRata = Number(item.nilai_rata_rata || 0);

  return (
    <div className="bg-[#181b21] border border-[#2a2f3a] rounded-2xl p-4 sm:p-5 space-y-4 hover:border-slate-600 transition-all shadow-xs">
      {/* Top Row: Siswa Name, Badges */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base sm:text-lg font-bold text-white leading-tight">
              {item.nama_siswa}
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-md bg-[#222732] text-slate-400 font-mono">
              {item.id_siswa}
            </span>
          </div>
          <p className="text-xs text-sky-400 font-mono mt-1 font-semibold">
            {item.nomor_rapor}
          </p>
        </div>

        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <StatusDokumenBadge status={item.status_dokumen} />
          <KenaikanBadge status={item.status_kenaikan} />
        </div>
      </div>

      {/* Info Grid (2 Columns, cleanly spaced) */}
      <div className="grid grid-cols-2 gap-3 pt-1 border-t border-[#242833] text-xs">
        {/* Pelatih & Kelas */}
        <div className="space-y-0.5 min-w-0">
          <p className="text-slate-400 font-medium flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Pelatih</span>
          </p>
          <p className="font-semibold text-slate-200 truncate">
            {item.nama_pelatih || '-'}
          </p>
          <p className="text-slate-400 text-[11px] truncate">
            Kelas: {item.kelas || 'Reguler'}
          </p>
        </div>

        {/* Periode & Tanggal */}
        <div className="space-y-0.5 min-w-0">
          <p className="text-slate-400 font-medium flex items-center gap-1.5">
            <CalendarDays className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Periode</span>
          </p>
          <p className="font-semibold text-slate-200">
            {BULAN_NAMES[item.periode_bulan]} {item.periode_tahun}
          </p>
          <p className="text-slate-400 text-[11px]">
            {formatTanggal(item.tanggal_penilaian)}
          </p>
        </div>

        {/* Level Progression */}
        <div className="col-span-2 space-y-1 pt-1 border-t border-[#242833]/60">
          <p className="text-slate-400 font-medium flex items-center gap-1.5">
            <GraduationCap className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Jenjang Kemampuan</span>
          </p>
          <div className="flex items-center gap-1.5 flex-wrap text-xs">
            <span className="font-semibold text-slate-200 bg-[#222732] px-2.5 py-1 rounded-md">
              {item.level_saat_ini}
            </span>
            {item.rekomendasi_level && isNaik && (
              <>
                <ArrowRight className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-md">
                  {item.rekomendasi_level}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Skor Highlight Banner */}
      <div className="bg-[#121418] border border-[#272b35] rounded-xl px-3.5 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4 fill-amber-400 text-amber-400 shrink-0" />
          <span className="text-xs font-medium text-slate-300">Skor Rata-Rata</span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-base font-extrabold text-white">
            {rataRata.toFixed(2)}
          </span>
          <span className="text-xs text-slate-400">/ 5.00</span>
        </div>
      </div>

      {/* Card Footer Actions */}
      <div className="flex items-center justify-between pt-1 border-t border-[#242833] gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onViewDetail(item.id)}
          className="h-9 px-3.5 text-xs font-semibold border-sky-500/30 text-sky-400 hover:bg-sky-500/10 gap-1.5 flex-1 justify-center"
        >
          <Eye className="w-4 h-4" />
          <span>Lihat Rapor</span>
        </Button>

        <div className="flex items-center gap-1 shrink-0">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onQuickDownload(item.id)}
            className="w-9 h-9 p-0 text-slate-300 hover:text-sky-400 hover:bg-sky-500/10 rounded-xl"
            title="Unduh PDF"
            aria-label="Unduh PDF"
          >
            <Download className="w-4 h-4" />
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => onQuickShare(item)}
            className="w-9 h-9 p-0 text-slate-300 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-xl"
            title="Bagikan ke WhatsApp"
            aria-label="Bagikan ke WhatsApp"
          >
            <Share2 className="w-4 h-4" />
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => onEdit(item.id)}
            className="w-9 h-9 p-0 text-slate-300 hover:text-amber-400 hover:bg-amber-500/10 rounded-xl"
            title="Edit Rapor"
            aria-label="Edit Rapor"
          >
            <Edit2 className="w-4 h-4" />
          </Button>

          {userRole !== 'Pelatih' && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDelete(item.id)}
              className="w-9 h-9 p-0 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl"
              title="Hapus Rapor"
              aria-label="Hapus Rapor"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Baris Tabel untuk Desktop (≥ lg) ───────────────────────────────────────
function LaporanRow({
  item,
  onViewDetail,
  onEdit,
  onDelete,
  onQuickDownload,
  onQuickShare,
  userRole,
}: {
  item: VLaporanSiswa;
  onViewDetail: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onQuickDownload: (id: string) => void;
  onQuickShare: (item: VLaporanSiswa) => void;
  userRole?: string;
}) {
  const isNaik = item.status_kenaikan === 'Naik Level' || item.status_kenaikan === 'Lulus Tingkat';

  return (
    <tr className="hover:bg-[#1d2028] transition-colors group border-b border-[#242833] last:border-0">
      {/* No. Rapor & Tanggal */}
      <td className="py-4 px-5">
        <p className="font-mono font-semibold text-sm text-sky-400">{item.nomor_rapor}</p>
        <p className="text-xs text-slate-400 mt-0.5">{formatTanggal(item.tanggal_penilaian)}</p>
      </td>

      {/* Siswa */}
      <td className="py-4 px-5">
        <p className="font-bold text-sm text-white">{item.nama_siswa}</p>
        <p className="text-xs text-slate-400 mt-0.5 font-mono">{item.id_siswa}</p>
        {item.nama_wali && (
          <p className="text-xs text-slate-400 mt-0.5">Wali: {item.nama_wali}</p>
        )}
      </td>

      {/* Kelas & Pelatih */}
      <td className="py-4 px-5">
        <p className="text-sm text-slate-200 font-medium">{item.kelas || 'Reguler'}</p>
        <p className="text-xs text-slate-400 mt-0.5">{item.nama_pelatih}</p>
      </td>

      {/* Periode & Level */}
      <td className="py-4 px-5">
        <div className="flex items-center gap-1.5 text-sm text-slate-200 font-medium flex-wrap">
          <span>{item.level_saat_ini}</span>
          {item.rekomendasi_level && isNaik && (
            <>
              <ArrowRight className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="text-emerald-400 font-bold">{item.rekomendasi_level}</span>
            </>
          )}
        </div>
        <p className="text-xs text-slate-400 mt-0.5">
          {BULAN_NAMES[item.periode_bulan]} {item.periode_tahun}
        </p>
      </td>

      {/* Skor */}
      <td className="py-4 px-5 text-center">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#111317] border border-[#242833]">
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          <span className="text-sm font-bold text-white">
            {Number(item.nilai_rata_rata || 0).toFixed(2)}
          </span>
        </div>
      </td>

      {/* Kenaikan */}
      <td className="py-4 px-5 text-center">
        <KenaikanBadge status={item.status_kenaikan} />
      </td>

      {/* Status */}
      <td className="py-4 px-5 text-center">
        <StatusDokumenBadge status={item.status_dokumen} />
      </td>

      {/* Aksi */}
      <td className="py-4 px-5">
        <div className="flex items-center justify-end gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onViewDetail(item.id)}
            className="w-8 h-8 p-0 text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-lg"
            title="Lihat Detail Scorecard"
            aria-label="Lihat Detail Scorecard"
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onQuickDownload(item.id)}
            className="w-8 h-8 p-0 text-slate-300 hover:text-sky-400 hover:bg-sky-500/10 rounded-lg"
            title="Unduh Rapor PDF"
            aria-label="Unduh Rapor PDF"
          >
            <Download className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onQuickShare(item)}
            className="w-8 h-8 p-0 text-slate-300 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg"
            title="Bagikan ke WhatsApp Wali"
            aria-label="Bagikan ke WhatsApp Wali"
          >
            <Share2 className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onEdit(item.id)}
            className="w-8 h-8 p-0 text-slate-300 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg"
            title="Edit Rapor"
            aria-label="Edit Rapor"
          >
            <Edit2 className="w-4 h-4" />
          </Button>
          {userRole !== 'Pelatih' && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDelete(item.id)}
              className="w-8 h-8 p-0 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg"
              title="Hapus Rapor"
              aria-label="Hapus Rapor"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
}

// ─── Main Export ─────────────────────────────────────────────────────────────
export function LaporanTable({
  list,
  loading,
  onViewDetail,
  onEdit,
  onDelete,
  onQuickDownload,
  onQuickShare,
  userRole,
}: LaporanTableProps) {
  if (loading) {
    return (
      <div className="bg-[#181a20] border border-[#272b35] rounded-2xl p-12 text-center">
        <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm font-medium text-slate-300">Memuat data rapor siswa...</p>
      </div>
    );
  }

  if (list.length === 0) {
    return (
      <div className="bg-[#181a20] border border-[#272b35] rounded-2xl p-12 text-center">
        <div className="w-14 h-14 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-4">
          <FileText className="w-7 h-7" />
        </div>
        <h4 className="text-base font-bold text-white mb-2">Belum Ada Rapor Siswa</h4>
        <p className="text-sm text-slate-400 max-w-sm mx-auto leading-relaxed">
          Belum ada arsip rapor perkembangan untuk filter yang dipilih. Silakan ubah filter atau buat evaluasi baru.
        </p>
      </div>
    );
  }

  const sharedProps = { onViewDetail, onEdit, onDelete, onQuickDownload, onQuickShare, userRole };

  return (
    <>
      {/* ── Mobile: Card List (< lg) ── */}
      <div className="lg:hidden space-y-3.5">
        {list.map((item) => (
          <LaporanCard key={item.id} item={item} {...sharedProps} />
        ))}
      </div>

      {/* ── Desktop: Table (≥ lg) ── */}
      <div className="hidden lg:block bg-[#181a20] border border-[#272b35] rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#14161b] border-b border-[#272b35]">
                <th className="py-3.5 px-5 text-xs font-semibold text-slate-400 tracking-wider uppercase">No. Rapor &amp; Tgl</th>
                <th className="py-3.5 px-5 text-xs font-semibold text-slate-400 tracking-wider uppercase">Siswa &amp; Wali</th>
                <th className="py-3.5 px-5 text-xs font-semibold text-slate-400 tracking-wider uppercase">Kelas &amp; Pelatih</th>
                <th className="py-3.5 px-5 text-xs font-semibold text-slate-400 tracking-wider uppercase">Periode &amp; Level</th>
                <th className="py-3.5 px-5 text-xs font-semibold text-slate-400 tracking-wider uppercase text-center">Skor</th>
                <th className="py-3.5 px-5 text-xs font-semibold text-slate-400 tracking-wider uppercase text-center">Kenaikan</th>
                <th className="py-3.5 px-5 text-xs font-semibold text-slate-400 tracking-wider uppercase text-center">Status</th>
                <th className="py-3.5 px-5 text-xs font-semibold text-slate-400 tracking-wider uppercase text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {list.map((item) => (
                <LaporanRow key={item.id} item={item} {...sharedProps} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
