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

  const activeFilterCount = useMemo(() => {
    return [
      search !== '',
      filterDokumen !== 'ALL',
      filterKenaikan !== 'ALL',
      filterLevel !== 'ALL',
      filterBulan !== '0',
      filterPelatih !== 'ALL',
    ].filter(Boolean).length;
  }, [search, filterDokumen, filterKenaikan, filterLevel, filterBulan, filterPelatih]);

  const isFiltered = activeFilterCount > 0;

  return (
    <div className="min-h-screen bg-[#0f1115] text-slate-100 flex flex-col">
      <Topbar
        breadcrumb={[
          { label: 'KESIT Management' },
          { label: 'Laporan & Rapor Siswa' },
        ]}
      />

      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-5">

        {/* ── Header ───────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 shrink-0">
              <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
            </span>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-tight">
                Rapor &amp; Laporan Siswa
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5 leading-snug">
                Evaluasi berkala teknik renang, kenaikan tingkat &amp; sertifikat resmi KESIT.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              disabled={loading}
              className="border-[#2b303c] text-slate-300 hover:text-white text-xs sm:text-sm gap-1.5 h-10 px-3.5"
              title="Segarkan Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Segarkan</span>
            </Button>
            <Button
              size="sm"
              onClick={handleCreateNew}
              className="bg-sky-500 hover:bg-sky-600 text-white text-xs sm:text-sm font-semibold gap-1.5 h-10 px-4 flex-1 sm:flex-initial shadow-xs justify-center"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Rapor Baru</span>
            </Button>
          </div>
        </div>

        {/* ── Stats Cards ──────────────────────────────────────────────── */}
        <LaporanStatsCards stats={stats} />

        {/* ── Filter Toolbar ───────────────────────────────────────────── */}
        <div className="bg-[#181a20] border border-[#272b35] rounded-2xl overflow-hidden shadow-sm">
          {/* Filter Header */}
          <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-[#272b35]">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-300">
              <Filter className="w-4 h-4 text-sky-400" />
              <span>Filter &amp; Pencarian</span>
              {isFiltered && (
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 text-[10px] font-bold">
                  {activeFilterCount}
                </span>
              )}
            </div>
            {isFiltered && (
              <button
                type="button"
                onClick={handleResetFilter}
                className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1.5 transition-colors font-medium"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </button>
            )}
          </div>

          {/* Filter Fields */}
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            {/* Search */}
            <div className="relative sm:col-span-2 lg:col-span-2">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                placeholder="Cari siswa, ID, no. rapor..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 text-sm bg-[#131519] h-10"
              />
            </div>

            {/* Status Dokumen */}
            <Select
              value={filterDokumen}
              onChange={(e) => setFilterDokumen(e.target.value)}
              className="text-sm bg-[#131519] h-10"
            >
              <option value="ALL">Semua Status</option>
              <option value="Draft">Draft</option>
              <option value="Final">Final</option>
              <option value="Terkirim">Terkirim</option>
            </Select>

            {/* Status Kenaikan */}
            <Select
              value={filterKenaikan}
              onChange={(e) => setFilterKenaikan(e.target.value)}
              className="text-sm bg-[#131519] h-10"
            >
              <option value="ALL">Semua Kenaikan</option>
              <option value="Bertahan">Bertahan</option>
              <option value="Naik Level">Naik Level</option>
              <option value="Lulus Tingkat">Lulus Tingkat</option>
            </Select>

            {/* Level Renang */}
            <Select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              className="text-sm bg-[#131519] h-10"
            >
              <option value="ALL">Semua Jenjang</option>
              {DAFTAR_LEVEL_RENANG.map((lvl) => (
                <option key={lvl} value={lvl}>{lvl}</option>
              ))}
            </Select>

            {/* Periode Bulan */}
            <Select
              value={filterBulan}
              onChange={(e) => setFilterBulan(e.target.value)}
              className="text-sm bg-[#131519] h-10"
            >
              {BULAN_OPTIONS.map((b) => (
                <option key={b.value} value={b.value}>{b.label}</option>
              ))}
            </Select>
          </div>
        </div>

        {/* ── Tabel / Card List ────────────────────────────────────────── */}
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
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3.5 sm:p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-xs sm:text-sm leading-relaxed">
                Apakah Anda yakin ingin menghapus arsip rapor ini? Seluruh rincian nilai teknik dan sertifikat terkait akan dihapus secara permanen.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeleteId(null)}
                disabled={isDeleting}
                className="text-xs sm:text-sm h-9 px-3 text-slate-300"
              >
                Batal
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="bg-rose-500 hover:bg-rose-600 text-white text-xs sm:text-sm font-semibold gap-1.5 h-9 px-3.5 shadow-xs"
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
