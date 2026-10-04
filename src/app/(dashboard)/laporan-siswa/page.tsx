'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  FileText,
  Plus,
  Search,
  Filter,
  RefreshCw,
  RotateCcw,
  AlertTriangle,
} from 'lucide-react';
import { Topbar } from '@/components/layout/topbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/hooks/use-auth';
import { LaporanStatsCards } from '@/components/laporan/laporan-stats-cards';
import { LaporanTable } from '@/components/laporan/laporan-table';
import { FormPenilaianModal } from '@/components/laporan/form-penilaian-modal';
import { DetailLaporanModal } from '@/components/laporan/detail-laporan-modal';
import {
  VLaporanSiswa,
  LaporanStats,
  LaporanDetailData,
  DAFTAR_LEVEL_RENANG,
} from '@/types/laporan';
import {
  getLaporanListAction,
  getLaporanDetailAction,
  deleteLaporanAction,
  getDropdownDataAction,
} from '@/server/actions/laporan.actions';
import { SiswaOption, PelatihOption } from '@/server/repositories/laporan.repository';
import { generateRaporPDF } from '@/lib/pdf/laporan-pdf';

const BULAN_OPTIONS = [
  { value: '0', label: 'Semua Bulan' },
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

export default function LaporanSiswaPage() {
  const { role } = useAuth();
  const toast = useToast();

  // State List & Stats
  const [list, setList] = useState<VLaporanSiswa[]>([]);
  const [stats, setStats] = useState<LaporanStats>({
    totalRapor: 0,
    totalNaikLevel: 0,
    rataRataNilai: 0,
    totalDraft: 0,
  });
  const [loading, setLoading] = useState(true);

  // Dropdown options
  const [siswaOptions, setSiswaOptions] = useState<SiswaOption[]>([]);
  const [pelatihOptions, setPelatihOptions] = useState<PelatihOption[]>([]);

  // Filter states
  const [search, setSearch] = useState('');
  const [filterDokumen, setFilterDokumen] = useState('ALL');
  const [filterKenaikan, setFilterKenaikan] = useState('ALL');
  const [filterLevel, setFilterLevel] = useState('ALL');
  const [filterBulan, setFilterBulan] = useState('0');
  const [filterTahun, setFilterTahun] = useState(String(new Date().getFullYear()));
  const [filterPelatih, setFilterPelatih] = useState('ALL');

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editDetailData, setEditDetailData] = useState<LaporanDetailData | null>(null);

  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedDetailData, setSelectedDetailData] = useState<LaporanDetailData | null>(null);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch list
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getLaporanListAction({
        search,
        statusDokumen: filterDokumen,
        statusKenaikan: filterKenaikan,
        level: filterLevel,
        bulan: Number(filterBulan),
        tahun: Number(filterTahun),
        pelatihId: filterPelatih,
      });

      if (res.success && res.data) {
        setList(res.data.list);
        setStats(res.data.stats);
      } else {
        toast.error(res.error || 'Gagal memuat daftar rapor.');
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Terjadi kesalahan sistem.');
    } finally {
      setLoading(false);
    }
  }, [
    search,
    filterDokumen,
    filterKenaikan,
    filterLevel,
    filterBulan,
    filterTahun,
    filterPelatih,
    toast,
  ]);

  // Load dropdowns once
  useEffect(() => {
    async function loadDropdowns() {
      const res = await getDropdownDataAction();
      if (res.success && res.data) {
        setSiswaOptions(res.data.siswaOptions);
        setPelatihOptions(res.data.pelatihOptions);
      }
    }
    loadDropdowns();
  }, []);

  // Fetch on filter change
  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 250);
    return () => clearTimeout(timer);
  }, [loadData]);

  // Reset filter
  const handleResetFilter = () => {
    setSearch('');
    setFilterDokumen('ALL');
    setFilterKenaikan('ALL');
    setFilterLevel('ALL');
    setFilterBulan('0');
    setFilterTahun(String(new Date().getFullYear()));
    setFilterPelatih('ALL');
  };

  // Open Detail
  const handleViewDetail = async (id: string) => {
    try {
      const res = await getLaporanDetailAction(id);
      if (res.success && res.data) {
        setSelectedDetailData(res.data);
        setIsDetailOpen(true);
      } else {
        toast.error(res.error || 'Gagal mengambil detail rapor.');
      }
    } catch {
      toast.error('Gagal mengambil detail rapor.');
    }
  };

  // Open Edit
  const handleEdit = async (id: string) => {
    try {
      const res = await getLaporanDetailAction(id);
      if (res.success && res.data) {
        setEditDetailData(res.data);
        setIsFormOpen(true);
      } else {
        toast.error(res.error || 'Gagal mengambil detail rapor.');
      }
    } catch {
      toast.error('Gagal mengambil detail rapor.');
    }
  };

  // Open Create
  const handleCreateNew = () => {
    setEditDetailData(null);
    setIsFormOpen(true);
  };

  // Quick Download PDF from table
  const handleQuickDownload = async (id: string) => {
    try {
      const res = await getLaporanDetailAction(id);
      if (res.success && res.data) {
        generateRaporPDF(res.data);
        toast.success('Rapor PDF berhasil diunduh!');
      } else {
        toast.error('Gagal mengunduh rapor PDF.');
      }
    } catch {
      toast.error('Gagal mengunduh rapor PDF.');
    }
  };

  // Quick WhatsApp Share from table
  const handleQuickShare = (item: VLaporanSiswa) => {
    const rawPhone = item.no_hp_wali || '';
    let formattedPhone = rawPhone.replace(/\D/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '62' + formattedPhone.slice(1);
    }

    const naikInfo =
      item.status_kenaikan === 'Naik Level' || item.status_kenaikan === 'Lulus Tingkat'
        ? `🎉 *Selamat! Ananda dinyatakan ${item.status_kenaikan.toUpperCase()} ke: ${
            item.rekomendasi_level || item.level_saat_ini
          }*`
        : `*Status Evaluasi:* ${item.status_kenaikan}`;

    const text = `Halo Bapak/Ibu Wali dari *${item.nama_siswa}*,

Hasil evaluasi dan Rapor Perkembangan Renang di *KESIT Swimming Club* telah diterbitkan:
📋 *No. Rapor:* ${item.nomor_rapor}
🏊 *Level Saat Ini:* ${item.level_saat_ini}
⭐ *Nilai Rata-rata:* ${Number(item.nilai_rata_rata).toFixed(2)} / 5.00
${naikInfo}

👨‍🏫 *Pelatih Pembimbing:* ${item.nama_pelatih}

Silakan hubungi staf/pelatih untuk mendapatkan berkas cetak resmi Rapor & Sertifikat. Terima kasih! 🙏`;

    const url = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(
      text
    )}`;
    window.open(url, '_blank');
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      const res = await deleteLaporanAction(deleteId);
      if (res.success) {
        toast.success('Rapor siswa berhasil dihapus.');
        setDeleteId(null);
        loadData();
      } else {
        toast.error(res.error || 'Gagal menghapus rapor.');
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Terjadi kesalahan sistem.');
    } finally {
      setIsDeleting(false);
    }
  };

  const isFiltered = useMemo(() => {
    return (
      search !== '' ||
      filterDokumen !== 'ALL' ||
      filterKenaikan !== 'ALL' ||
      filterLevel !== 'ALL' ||
      filterBulan !== '0' ||
      filterPelatih !== 'ALL'
    );
  }, [search, filterDokumen, filterKenaikan, filterLevel, filterBulan, filterPelatih]);

  return (
    <div className="min-h-screen bg-[#0f1115] text-slate-100 flex flex-col">
      <Topbar
        breadcrumb={[
          { label: 'KESIT Management' },
          { label: 'Laporan & Rapor Siswa' },
        ]}
      />

      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
        {/* Header Title & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
                <FileText className="w-5 h-5" />
              </span>
              Rapor & Laporan Perkembangan Siswa
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Evaluasi berkala kompetensi teknik renang, kenaikan tingkat, dan penerbitan sertifikat resmi KESIT.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              disabled={loading}
              className="border-[#2b303c] text-slate-300 hover:text-white text-xs gap-1.5"
              title="Segarkan Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Segarkan
            </Button>

            <Button
              size="sm"
              onClick={handleCreateNew}
              className="bg-sky-500 hover:bg-sky-600 text-white text-xs gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Buat Rapor Siswa
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <LaporanStatsCards stats={stats} />

        {/* Filters Toolbar */}
        <div className="bg-[#181a20] border border-[#272b35] rounded-2xl p-4 space-y-3 shadow-sm">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <Filter className="w-3.5 h-3.5 text-sky-400" />
              <span>Filter & Pencarian Rapor</span>
            </div>

            {isFiltered && (
              <button
                type="button"
                onClick={handleResetFilter}
                className="text-[11px] text-sky-400 hover:text-sky-300 flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                Reset Filter
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {/* Search */}
            <div className="relative lg:col-span-2">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="Cari siswa, ID, no rapor..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 text-xs bg-[#131519]"
              />
            </div>

            {/* Status Dokumen */}
            <div>
              <Select
                value={filterDokumen}
                onChange={(e) => setFilterDokumen(e.target.value)}
                className="text-xs bg-[#131519]"
              >
                <option value="ALL">Semua Dokumen</option>
                <option value="Draft">Draft (Review)</option>
                <option value="Final">Final (Resmi)</option>
                <option value="Terkirim">Terkirim ke Wali</option>
              </Select>
            </div>

            {/* Status Kenaikan */}
            <div>
              <Select
                value={filterKenaikan}
                onChange={(e) => setFilterKenaikan(e.target.value)}
                className="text-xs bg-[#131519]"
              >
                <option value="ALL">Semua Kenaikan</option>
                <option value="Bertahan">Bertahan</option>
                <option value="Naik Level">Naik Level</option>
                <option value="Lulus Tingkat">Lulus Tingkat</option>
              </Select>
            </div>

            {/* Level Renang */}
            <div>
              <Select
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value)}
                className="text-xs bg-[#131519]"
              >
                <option value="ALL">Semua Jenjang</option>
                {DAFTAR_LEVEL_RENANG.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl}
                  </option>
                ))}
              </Select>
            </div>

            {/* Periode Bulan */}
            <div>
              <Select
                value={filterBulan}
                onChange={(e) => setFilterBulan(e.target.value)}
                className="text-xs bg-[#131519]"
              >
                {BULAN_OPTIONS.map((b) => (
                  <option key={b.value} value={b.value}>
                    {b.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </div>

        {/* Laporan Table */}
        <LaporanTable
          list={list}
          loading={loading}
          onViewDetail={handleViewDetail}
          onEdit={handleEdit}
          onDelete={(id) => setDeleteId(id)}
          onQuickDownload={handleQuickDownload}
          onQuickShare={handleQuickShare}
          userRole={role ?? undefined}
        />
      </div>

      {/* Modal Form Input / Edit */}
      {isFormOpen && (
        <FormPenilaianModal
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onSuccess={() => {
            toast.success(
              editDetailData
                ? 'Rapor siswa berhasil diperbarui.'
                : 'Rapor perkembangan siswa berhasil diterbitkan!'
            );
            loadData();
          }}
          siswaOptions={siswaOptions}
          pelatihOptions={pelatihOptions}
          editData={editDetailData}
        />
      )}

      {/* Modal Detail & Print */}
      {isDetailOpen && (
        <DetailLaporanModal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          data={selectedDetailData}
          onStatusUpdated={() => {
            toast.success('Status rapor berhasil diperbarui menjadi Terkirim.');
            loadData();
          }}
        />
      )}

      {/* Modal Confirm Delete */}
      {deleteId && (
        <Modal
          isOpen={Boolean(deleteId)}
          onClose={() => setDeleteId(null)}
          title="Konfirmasi Hapus Rapor"
          subtitle="Tindakan ini tidak dapat dibatalkan"
          maxWidth="sm"
        >
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>
                Apakah Anda yakin ingin menghapus arsip rapor ini? Seluruh rincian nilai teknik dan sertifikat terkait akan dihapus secara permanen.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeleteId(null)}
                disabled={isDeleting}
                className="text-xs"
              >
                Batal
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="bg-rose-500 hover:bg-rose-600 text-white text-xs gap-1.5"
              >
                {isDeleting ? 'Menghapus...' : 'Ya, Hapus Rapor'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
