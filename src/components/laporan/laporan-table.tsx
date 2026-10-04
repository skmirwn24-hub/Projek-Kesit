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
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];

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
        <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-slate-400">Memuat data laporan siswa...</p>
      </div>
    );
  }

  if (list.length === 0) {
    return (
      <div className="bg-[#181a20] border border-[#272b35] rounded-2xl p-12 text-center">
        <div className="w-12 h-12 rounded-xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
          <FileText className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-bold text-white mb-1">Belum Ada Rapor Siswa</h4>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          Belum ada arsip rapor perkembangan siswa untuk kriteria filter yang dipilih. Silakan
          buat evaluasi baru dengan menekan tombol &quot;+ Buat Rapor Siswa&quot;.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[#181a20] border border-[#272b35] rounded-2xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-[#14161b] border-b border-[#272b35] text-slate-400">
              <th className="py-3.5 px-4 font-semibold">No. Rapor & Tgl</th>
              <th className="py-3.5 px-4 font-semibold">Siswa & Wali</th>
              <th className="py-3.5 px-4 font-semibold">Kelas & Pelatih</th>
              <th className="py-3.5 px-4 font-semibold">Periode & Level</th>
              <th className="py-3.5 px-4 font-semibold text-center">Skor Rata-Rata</th>
              <th className="py-3.5 px-4 font-semibold text-center">Kenaikan Level</th>
              <th className="py-3.5 px-4 font-semibold text-center">Status</th>
              <th className="py-3.5 px-4 font-semibold text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#242833]">
            {list.map((item) => {
              const isNaik =
                item.status_kenaikan === 'Naik Level' ||
                item.status_kenaikan === 'Lulus Tingkat';

              return (
                <tr
                  key={item.id}
                  className="hover:bg-[#1d2028] transition-colors group"
                >
                  {/* No. Rapor & Tanggal */}
                  <td className="py-3.5 px-4">
                    <p className="font-mono font-bold text-slate-200">
                      {item.nomor_rapor}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {formatTanggal(item.tanggal_penilaian)}
                    </p>
                  </td>

                  {/* Siswa & Wali */}
                  <td className="py-3.5 px-4">
                    <p className="font-bold text-white flex items-center gap-1.5">
                      {item.nama_siswa}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                      {item.id_siswa} {item.nama_wali ? `• Wali: ${item.nama_wali}` : ''}
                    </p>
                  </td>

                  {/* Kelas & Pelatih */}
                  <td className="py-3.5 px-4">
                    <p className="text-slate-200 font-medium">{item.kelas || 'Reguler'}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Pelatih: {item.nama_pelatih}
                    </p>
                  </td>

                  {/* Periode & Level */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                      <span className="truncate max-w-[120px]">{item.level_saat_ini}</span>
                      {item.rekomendasi_level && isNaik && (
                        <>
                          <ArrowRight className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span className="text-emerald-400 font-bold truncate max-w-[120px]">
                            {item.rekomendasi_level}
                          </span>
                        </>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Periode: {BULAN_NAMES[item.periode_bulan]} {item.periode_tahun}
                    </p>
                  </td>

                  {/* Skor Rata-Rata */}
                  <td className="py-3.5 px-4 text-center">
                    <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#111317] border border-[#242833]">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span className="font-bold text-white">
                        {Number(item.nilai_rata_rata).toFixed(2)}
                      </span>
                    </div>
                  </td>

                  {/* Kenaikan Level */}
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                        isNaik
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-700/30 text-slate-400 border border-slate-700/50'
                      }`}
                    >
                      {isNaik && <Award className="w-3 h-3 mr-1" />}
                      {item.status_kenaikan}
                    </span>
                  </td>

                  {/* Status Dokumen */}
                  <td className="py-3.5 px-4 text-center">
                    <Badge
                      variant={
                        item.status_dokumen === 'Final'
                          ? 'success'
                          : item.status_dokumen === 'Terkirim'
                          ? 'info'
                          : 'warning'
                      }
                    >
                      {item.status_dokumen}
                    </Badge>
                  </td>

                  {/* Aksi */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onViewDetail(item.id)}
                        className="p-1.5 h-auto text-slate-400 hover:text-white"
                        title="Lihat Detail Scorecard"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onQuickDownload(item.id)}
                        className="p-1.5 h-auto text-slate-400 hover:text-sky-400"
                        title="Unduh Rapor PDF"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onQuickShare(item)}
                        className="p-1.5 h-auto text-slate-400 hover:text-emerald-400"
                        title="Bagikan ke WhatsApp Wali"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onEdit(item.id)}
                        className="p-1.5 h-auto text-slate-400 hover:text-amber-400"
                        title="Edit Rapor"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>

                      {userRole !== 'Pelatih' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onDelete(item.id)}
                          className="p-1.5 h-auto text-slate-500 hover:text-rose-400"
                          title="Hapus Rapor"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
