'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import {
  getSiswaUntukAbsensiAction,
  absenSiswaAction,
  batalkanAbsenAction,
  getRekapAbsensiAction,
} from '@/server/actions/absensi.actions';
import { getPelatihAction } from '@/server/actions/pelatih.actions';
import { Pelatih, KategoriKelas, AbsensiSiswaView } from '@/types/database';
import type { SiswaAbsensiEnriched } from '@/server/repositories/absensi.repository';
import { Topbar } from '@/components/layout/topbar';
import { useToast } from '@/components/ui/toast';
import { SkeletonCard } from '@/components/ui/skeleton';
import {
  ClipboardCheck,
  ChevronLeft,
  ChevronRight,
  Users,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Download,
  RotateCcw,
  User,
  Calendar,
  TrendingUp,
} from 'lucide-react';

// -------------------------------------------------------
// Helpers
// -------------------------------------------------------
const BULAN_NAMES = [
  'Januari','Februari','Maret','April','Mei','Juni',
  'Juli','Agustus','September','Oktober','November','Desember',
];

const HARI_NAMES = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];

function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

function isSenin(dateStr: string): boolean {
  return new Date(dateStr).getDay() === 1;
}

function formatTanggalIndo(dateStr: string): string {
  const d = new Date(dateStr);
  return `${HARI_NAMES[d.getDay()]}, ${d.getDate()} ${BULAN_NAMES[d.getMonth()]} ${d.getFullYear()}`;
}

function getMaxSesi(kategori: 'Reguler' | 'Private'): number {
  return kategori === 'Reguler' ? 6 : 10;
}

// -------------------------------------------------------
// Export rekap to CSV
// -------------------------------------------------------
function exportRekapCSV(rekap: AbsensiSiswaView[], bulan: number, tahun: number, kategori: string) {
  const header = 'Nama Siswa,Tanggal,Sesi,Pelatih Mengajar,Status Hadir,Catatan\n';
  const rows = rekap.map((r) => [
    `"${r.nama_lengkap}"`,
    r.tanggal,
    r.nomor_sesi ?? '-',
    `"${r.nama_pelatih_mengajar ?? '-'}"`,
    r.status_hadir,
    `"${r.catatan ?? ''}"`,
  ].join(',')).join('\n');

  const csv = header + rows;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `rekap-absensi-${kategori.toLowerCase()}-${BULAN_NAMES[bulan - 1]}-${tahun}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// -------------------------------------------------------
// Client-side in-memory cache for ultra-fast session & tab switching
// -------------------------------------------------------
const absensiClientCache = new Map<string, { data: SiswaAbsensiEnriched[]; timestamp: number }>();
const rekapClientCache = new Map<string, { data: AbsensiSiswaView[]; timestamp: number }>();

function getCachedAbsensi(key: string): { data: SiswaAbsensiEnriched[]; isFresh: boolean } | null {
  const cached = absensiClientCache.get(key);
  if (!cached) return null;
  return {
    data: cached.data,
    isFresh: Date.now() - cached.timestamp < 45_000,
  };
}

function setCachedAbsensi(key: string, data: SiswaAbsensiEnriched[]): void {
  absensiClientCache.set(key, { data, timestamp: Date.now() });
}

function hasCachedAbsensi(key: string): boolean {
  return absensiClientCache.has(key);
}

function getCachedRekap(key: string): AbsensiSiswaView[] | null {
  const cached = rekapClientCache.get(key);
  if (cached && Date.now() - cached.timestamp < 60_000) {
    return cached.data;
  }
  return null;
}

function setCachedRekap(key: string, data: AbsensiSiswaView[]): void {
  rekapClientCache.set(key, { data, timestamp: Date.now() });
}

function invalidateRekapCache(): void {
  rekapClientCache.clear();
}

// -------------------------------------------------------
// Main Component
// -------------------------------------------------------
export default function AbsensiPage() {
  const { profile, role } = useAuth();
  const toast = useToast();

  const isAdminOrOwner = role === 'Owner' || role === 'Admin';
  const isPelatih = role === 'Pelatih';

  // --- Navigation state ---
  const now = new Date();
  const [activeTab, setActiveTab] = useState<KategoriKelas>('Reguler');
  const [bulan, setBulan] = useState(now.getMonth() + 1);
  const [tahun, setTahun] = useState(now.getFullYear());
  const [selectedSesi, setSelectedSesi] = useState(1);

  // For Owner/Admin/Pelatih: pilih pelatih (null = use role default: coach's own id for coach, 'ALL' for admin)
  const [pelatihList, setPelatihList] = useState<Pelatih[]>([]);
  const [selectedPelatihId, setSelectedPelatihId] = useState<string | null>(null);

  // Pelatih pengganti (per-tab)
  const [penggantiPelatihId, setPenggantiPelatihId] = useState<string>('');

  // --- Data state ---
  const [siswaList, setSiswaList] = useState<SiswaAbsensiEnriched[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Rekap modal
  const [showRekap, setShowRekap] = useState(false);
  const [rekapData, setRekapData] = useState<AbsensiSiswaView[]>([]);
  const [loadingRekap, setLoadingRekap] = useState(false);

  // Derive pelatih pemilik ID to use
  const activePelatihId = useMemo(() => {
    if (selectedPelatihId !== null) return selectedPelatihId;
    if (isPelatih && profile?.pelatih_id) return profile.pelatih_id;
    return 'ALL';
  }, [selectedPelatihId, isPelatih, profile?.pelatih_id]);

  // Helper untuk cache key yang konsisten
  const buildCacheKey = useCallback(
    (tab: KategoriKelas, pelatihId: string, b: number, t: number, sesiOrDate: number | string | null) => {
      return `${tab}:${pelatihId}:${b}:${t}:${sesiOrDate ?? 'all'}`;
    },
    []
  );

  // Today for Prestasi
  const todayDate = todayISO();
  const isTodaySenin = isSenin(todayDate);

  // -------------------------------------------------------
  // Load pelatih list
  // -------------------------------------------------------
  useEffect(() => {
    getPelatihAction().then((res) => {
      if (res.success && res.data) {
        const available = res.data.filter((p) => p.status !== 'Nonaktif');
        setPelatihList(available);
      }
    });
  }, []);

  // -------------------------------------------------------
  // Load siswa untuk absensi dengan Caching & SWR
  // -------------------------------------------------------
  const loadSiswa = useCallback(
    async (forceFresh = false) => {
      const sesiOrDate = activeTab === 'Prestasi' ? todayDate : selectedSesi;
      const cacheKey = buildCacheKey(activeTab, activePelatihId, bulan, tahun, sesiOrDate);
      const cached = getCachedAbsensi(cacheKey);

      if (cached && !forceFresh) {
        // INSTANT RENDER DARI CACHE (0ms, tanpa flicker skeleton)
        setSiswaList(cached.data);
        setLoading(false);

        // Jika data masih segar, tidak perlu network fetch lagi
        if (cached.isFresh) {
          return;
        }
      } else if (!cached) {
        // Hanya tampilkan skeleton jika benar-benar belum pernah di-fetch
        setLoading(true);
        setSiswaList([]);
      }

      try {
        const res = await getSiswaUntukAbsensiAction({
          pelatihPemilikId: activePelatihId === 'ALL' ? null : activePelatihId,
          kategori: activeTab,
          bulan,
          tahun,
          nomorSesi: activeTab !== 'Prestasi' ? selectedSesi : null,
          tanggal: activeTab === 'Prestasi' ? todayDate : null,
        });

        if (res.success && res.data) {
          setCachedAbsensi(cacheKey, res.data);
          setSiswaList(res.data);
        } else if (!cached) {
          toast.error(res.error ?? 'Gagal memuat daftar siswa');
        }
      } finally {
        setLoading(false);
      }
    },
    [activePelatihId, activeTab, bulan, tahun, selectedSesi, todayDate, buildCacheKey, toast]
  );

  useEffect(() => {
    let ignore = false;
    void Promise.resolve().then(async () => {
      if (!ignore) {
        await loadSiswa();
        setPenggantiPelatihId('');
      }
    });
    return () => {
      ignore = true;
    };
  }, [loadSiswa]);

  // -------------------------------------------------------
  // Background Pre-fetching Sesi Berikutnya
  // Mengambil sesi berikutnya secara diam-diam sehingga transisi sesi instan
  // -------------------------------------------------------
  useEffect(() => {
    if (activeTab === 'Prestasi' || loading) return;
    const maxSesi = getMaxSesi(activeTab);
    if (selectedSesi < maxSesi) {
      const nextSesi = selectedSesi + 1;
      const nextKey = buildCacheKey(activeTab, activePelatihId, bulan, tahun, nextSesi);
      if (!hasCachedAbsensi(nextKey)) {
        const timer = setTimeout(() => {
          getSiswaUntukAbsensiAction({
            pelatihPemilikId: activePelatihId === 'ALL' ? null : activePelatihId,
            kategori: activeTab,
            bulan,
            tahun,
            nomorSesi: nextSesi,
            tanggal: null,
          }).then((res) => {
            if (res.success && res.data) {
              setCachedAbsensi(nextKey, res.data);
            }
          });
        }, 400);
        return () => clearTimeout(timer);
      }
    }
  }, [activeTab, activePelatihId, bulan, tahun, selectedSesi, loading, buildCacheKey]);

  // Cek apakah user berhak mengubah absensi siswa ini
  const canEditSiswa = useCallback(
    (siswa: SiswaAbsensiEnriched) => {
      if (isAdminOrOwner) return true;
      if (isPelatih && profile?.pelatih_id && siswa.pelatih_pemilik_id === profile.pelatih_id) {
        return true;
      }
      return false;
    },
    [isAdminOrOwner, isPelatih, profile]
  );

  // -------------------------------------------------------
  // Toggle absensi satu siswa (Optimistic Update)
  // -------------------------------------------------------
  const handleToggleAbsen = async (siswa: SiswaAbsensiEnriched) => {
    if (!profile) return;
    if (!canEditSiswa(siswa)) {
      toast.error('Akses ditolak: Anda hanya dapat mencatat absensi siswa bimbingan Anda.');
      return;
    }

    const sesiOrDate = activeTab === 'Prestasi' ? todayDate : selectedSesi;
    const cacheKey = buildCacheKey(activeTab, activePelatihId, bulan, tahun, sesiOrDate);
    const prevList = [...siswaList];
    const isBatal = !!siswa.absensi_id;
    const oldAbsensiId = siswa.absensi_id;

    // Bersihkan cache rekap agar tersinkronisasi
    invalidateRekapCache();

    if (isBatal) {
      // 1. Optimistic Cancel: update UI instan 0ms
      const optimisticList = siswaList.map((s) => {
        if (s.siswa_id !== siswa.siswa_id) return s;
        return {
          ...s,
          absensi_id: null,
          status_hadir: null,
          kuota_terpakai: s.status_hadir === 'Hadir' ? Math.max(0, s.kuota_terpakai - 1) : s.kuota_terpakai,
        };
      });

      setSiswaList(optimisticList);
      setCachedAbsensi(cacheKey, optimisticList);

      setSaving(true);
      const res = await batalkanAbsenAction({ absensi_id: oldAbsensiId! });
      setSaving(false);

      if (res.success) {
        toast.success(`Absensi ${siswa.nama_lengkap} dibatalkan`);
      } else {
        // Rollback ke state sebelumnya jika gagal
        setSiswaList(prevList);
        setCachedAbsensi(cacheKey, prevList);
        toast.error(res.error ?? 'Gagal membatalkan absensi');
      }
      return;
    }

    // 2. Optimistic Hadir: update UI instan 0ms
    const coachToRecord = penggantiPelatihId || (activePelatihId !== 'ALL' && activePelatihId ? activePelatihId : siswa.pelatih_pemilik_id) || null;
    const tempId = `temp-${siswa.siswa_id}`;
    const optimisticList = siswaList.map((s) => {
      if (s.siswa_id !== siswa.siswa_id) return s;
      return {
        ...s,
        absensi_id: tempId,
        status_hadir: 'Hadir' as const,
        kuota_terpakai: s.status_hadir === 'Hadir' ? s.kuota_terpakai : s.kuota_terpakai + 1,
        pelatih_mengajar_id: coachToRecord,
      };
    });

    setSiswaList(optimisticList);
    setCachedAbsensi(cacheKey, optimisticList);

    setSaving(true);
    const res = await absenSiswaAction({
      siswa_id: siswa.siswa_id,
      paket_siswa_id: siswa.paket_siswa_id,
      pelatih_id: coachToRecord,
      tanggal: activeTab === 'Prestasi' ? todayDate : `${tahun}-${String(bulan).padStart(2,'0')}-01`,
      nomor_sesi: activeTab !== 'Prestasi' ? selectedSesi : null,
      kategori: activeTab,
      status_hadir: 'Hadir',
      catatan: '',
    });
    setSaving(false);

    if (res.success && res.absensiId) {
      toast.success(`${siswa.nama_lengkap} — Hadir ✓`);
      // Update real absensi_id dari database secara senyap
      const confirmedList = optimisticList.map((s) =>
        s.siswa_id === siswa.siswa_id ? { ...s, absensi_id: res.absensiId! } : s
      );
      setSiswaList(confirmedList);
      setCachedAbsensi(cacheKey, confirmedList);
    } else {
      // Rollback jika terjadi kesalahan
      setSiswaList(prevList);
      setCachedAbsensi(cacheKey, prevList);
      toast.error(res.error ?? 'Gagal menyimpan absensi');
    }
  };

  // -------------------------------------------------------
  // Tandai Tidak Hadir (Optimistic Update)
  // -------------------------------------------------------
  const handleTidakHadir = async (siswa: SiswaAbsensiEnriched) => {
    if (!profile) return;
    if (!canEditSiswa(siswa)) {
      toast.error('Akses ditolak: Anda hanya dapat mencatat absensi siswa bimbingan Anda.');
      return;
    }

    const sesiOrDate = activeTab === 'Prestasi' ? todayDate : selectedSesi;
    const cacheKey = buildCacheKey(activeTab, activePelatihId, bulan, tahun, sesiOrDate);
    const prevList = [...siswaList];
    const coachToRecord = penggantiPelatihId || (activePelatihId !== 'ALL' && activePelatihId ? activePelatihId : siswa.pelatih_pemilik_id) || null;
    const tempId = `temp-${siswa.siswa_id}`;

    // Bersihkan cache rekap agar tersinkronisasi
    invalidateRekapCache();

    const optimisticList = siswaList.map((s) => {
      if (s.siswa_id !== siswa.siswa_id) return s;
      const wasHadir = s.status_hadir === 'Hadir';
      return {
        ...s,
        absensi_id: tempId,
        status_hadir: 'Tidak Hadir' as const,
        kuota_terpakai: wasHadir ? Math.max(0, s.kuota_terpakai - 1) : s.kuota_terpakai,
        pelatih_mengajar_id: coachToRecord,
      };
    });

    setSiswaList(optimisticList);
    setCachedAbsensi(cacheKey, optimisticList);

    setSaving(true);
    const res = await absenSiswaAction({
      siswa_id: siswa.siswa_id,
      paket_siswa_id: siswa.paket_siswa_id,
      pelatih_id: coachToRecord,
      tanggal: activeTab === 'Prestasi' ? todayDate : `${tahun}-${String(bulan).padStart(2,'0')}-01`,
      nomor_sesi: activeTab !== 'Prestasi' ? selectedSesi : null,
      kategori: activeTab,
      status_hadir: 'Tidak Hadir',
      catatan: '',
    });
    setSaving(false);

    if (res.success && res.absensiId) {
      toast.success(`${siswa.nama_lengkap} — Tidak Hadir`);
      const confirmedList = optimisticList.map((s) =>
        s.siswa_id === siswa.siswa_id ? { ...s, absensi_id: res.absensiId! } : s
      );
      setSiswaList(confirmedList);
      setCachedAbsensi(cacheKey, confirmedList);
    } else {
      // Rollback jika terjadi kesalahan
      setSiswaList(prevList);
      setCachedAbsensi(cacheKey, prevList);
      toast.error(res.error ?? 'Gagal menyimpan absensi');
    }
  };

  // -------------------------------------------------------
  // Load rekap dengan Caching
  // -------------------------------------------------------
  const handleShowRekap = async () => {
    setShowRekap(true);
    const filterPelatih = activePelatihId === 'ALL' ? null : (activePelatihId || null);
    const rekapKey = `${activeTab}:${activePelatihId}:${bulan}:${tahun}`;

    const cached = getCachedRekap(rekapKey);
    if (cached) {
      setRekapData(cached);
      return;
    }

    setLoadingRekap(true);
    const res = await getRekapAbsensiAction({
      bulan,
      tahun,
      kategori: activeTab,
      filterPelatihId: filterPelatih,
    });
    setLoadingRekap(false);
    if (res.success && res.data) {
      setRekapData(res.data);
      setCachedRekap(rekapKey, res.data);
    } else {
      toast.error(res.error ?? 'Gagal memuat rekap');
    }
  };

  // -------------------------------------------------------
  // Stats
  // -------------------------------------------------------
  const totalSiswa = siswaList.length;
  const totalHadir = siswaList.filter((s) => s.status_hadir === 'Hadir').length;
  const totalTidakHadir = siswaList.filter((s) => s.status_hadir === 'Tidak Hadir').length;
  const totalBelumAbsen = siswaList.filter((s) => !s.status_hadir).length;

  const maxSesi = activeTab !== 'Prestasi' ? getMaxSesi(activeTab as 'Reguler' | 'Private') : 0;

  // -------------------------------------------------------
  // Navigate bulan
  // -------------------------------------------------------
  const handlePrevBulan = () => {
    if (bulan === 1) { setBulan(12); setTahun((y) => y - 1); }
    else setBulan((b) => b - 1);
    setSelectedSesi(1);
  };
  const handleNextBulan = () => {
    if (bulan === 12) { setBulan(1); setTahun((y) => y + 1); }
    else setBulan((b) => b + 1);
    setSelectedSesi(1);
  };

  // -------------------------------------------------------
  // Pelatih name lookup
  // -------------------------------------------------------
  const getPelatihName = (id: string) =>
    pelatihList.find((p) => p.id === id)?.nama ?? id;

  // -------------------------------------------------------
  // Render
  // -------------------------------------------------------
  return (
    <div className="absensi-page">
      <Topbar
        title="Absensi Siswa"
        breadcrumb={[{ label: 'KESIT Management' }, { label: 'Absensi' }]}
      />

      <div className="absensi-content">

        {/* ===== HEADER CONTROLS ===== */}
        <div className="absensi-header-controls">

          {/* Filter Pelatih (dapat diakses oleh Owner, Admin, dan semua Pelatih) */}
          <div className="absensi-pelatih-selector">
            <label className="absensi-label">
              <User size={14} /> Filter Pelatih
            </label>
            <select
              className="absensi-select"
              value={selectedPelatihId || (isPelatih ? profile?.pelatih_id ?? 'ALL' : 'ALL')}
              onChange={(e) => setSelectedPelatihId(e.target.value)}
            >
              <option value="ALL">Semua Pelatih & Siswa</option>
              {pelatihList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nama} {isPelatih && p.id === profile?.pelatih_id ? '★ (Siswa Saya)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Navigator bulan (hanya untuk Reguler & Private) */}
          {activeTab !== 'Prestasi' && (
            <div className="absensi-bulan-nav">
              <button className="absensi-nav-btn" onClick={handlePrevBulan}>
                <ChevronLeft size={16} />
              </button>
              <span className="absensi-bulan-label">
                <Calendar size={14} />
                {BULAN_NAMES[bulan - 1]} {tahun}
              </span>
              <button className="absensi-nav-btn" onClick={handleNextBulan}>
                <ChevronRight size={16} />
              </button>
            </div>
          )}

          {/* Tombol aksi: Segarkan & Rekap */}
          <div className="absensi-header-actions">
            <button
              className="absensi-btn-rekap"
              onClick={() => loadSiswa(true)}
              title="Segarkan data terbaru dari server"
              disabled={loading}
            >
              <RotateCcw size={14} className={loading ? 'spin-icon' : ''} />
              Segarkan
            </button>
            <button className="absensi-btn-rekap" onClick={handleShowRekap}>
              <TrendingUp size={14} />
              Rekap Bulan Ini
            </button>
          </div>
        </div>

        {/* ===== TABS KATEGORI ===== */}
        <div className="absensi-tabs">
          {(['Reguler', 'Private', 'Prestasi'] as KategoriKelas[]).map((k) => (
            <button
              key={k}
              className={`absensi-tab${activeTab === k ? ' active' : ''}`}
              onClick={() => { setActiveTab(k); setSelectedSesi(1); setPenggantiPelatihId(''); }}
            >
              {k}
            </button>
          ))}
        </div>

        {/* ===== SESI SELECTOR (Reguler & Private) ===== */}
        {activeTab !== 'Prestasi' && (
          <div className="absensi-sesi-section">
            <span className="absensi-label">Pilih Sesi:</span>
            <div className="absensi-sesi-grid">
              {Array.from({ length: maxSesi }, (_, i) => i + 1).map((sesi) => (
                <button
                  key={sesi}
                  className={`absensi-sesi-btn${selectedSesi === sesi ? ' active' : ''}`}
                  onClick={() => setSelectedSesi(sesi)}
                >
                  Sesi {sesi}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ===== PRESTASI: Tanggal hari ini ===== */}
        {activeTab === 'Prestasi' && (
          <div className="absensi-prestasi-header">
            <div className="absensi-prestasi-tanggal">
              <Calendar size={16} />
              <span>Absensi hari ini: <strong>{formatTanggalIndo(todayDate)}</strong></span>
            </div>
            {isTodaySenin && (
              <div className="absensi-senin-warning">
                <AlertTriangle size={16} />
                <span>Hari ini Senin — Kelas Prestasi <strong>libur</strong>. Absensi tidak dapat dilakukan.</span>
              </div>
            )}
          </div>
        )}

        {/* ===== PELATIH PENGGANTI ===== */}
        {(activeTab === 'Reguler' || activeTab === 'Private' || activeTab === 'Prestasi') && (
          <div className="absensi-pengganti-section">
            <label className="absensi-label">
              <User size={14} /> Pelatih Mengajar Sesi Ini
            </label>
            <select
              className="absensi-select"
              value={penggantiPelatihId}
              onChange={(e) => setPenggantiPelatihId(e.target.value)}
            >
              <option value="">— Pelatih Pemilik (default) —</option>
              {pelatihList
                .filter((p) => p.id !== activePelatihId)
                .map((p) => (
                  <option key={p.id} value={p.id}>{p.nama}</option>
                ))}
            </select>
            {penggantiPelatihId && (
              <span className="absensi-pengganti-badge">
                Pengganti: {getPelatihName(penggantiPelatihId)}
              </span>
            )}
          </div>
        )}

        {/* ===== STATS CARDS ===== */}
        <div className="absensi-stats-row">
          <div className="absensi-stat-card">
            <Users size={18} />
            <div>
              <span className="absensi-stat-num">{totalSiswa}</span>
              <span className="absensi-stat-label">Total Siswa</span>
            </div>
          </div>
          <div className="absensi-stat-card hadir">
            <CheckCircle2 size={18} />
            <div>
              <span className="absensi-stat-num">{totalHadir}</span>
              <span className="absensi-stat-label">Hadir</span>
            </div>
          </div>
          <div className="absensi-stat-card tidak-hadir">
            <XCircle size={18} />
            <div>
              <span className="absensi-stat-num">{totalTidakHadir}</span>
              <span className="absensi-stat-label">Tidak Hadir</span>
            </div>
          </div>
          <div className="absensi-stat-card belum">
            <ClipboardCheck size={18} />
            <div>
              <span className="absensi-stat-num">{totalBelumAbsen}</span>
              <span className="absensi-stat-label">Belum Absen</span>
            </div>
          </div>
        </div>

        {/* ===== DAFTAR SISWA ===== */}
        <div className="absensi-list-container">
          <div className="absensi-list-header">
            <h3 className="absensi-list-title">
              Daftar Siswa — {activeTab}
              {activeTab !== 'Prestasi' && ` (Sesi ${selectedSesi}/${maxSesi})`}
              {activeTab === 'Prestasi' && ` — Hari Ini`}
            </h3>
            {totalSiswa > 0 && (
              <span className="absensi-progress">
                {totalHadir + totalTidakHadir}/{totalSiswa} tercatat
              </span>
            )}
          </div>

          {/* Disabled overlay untuk Prestasi hari Senin */}
          {activeTab === 'Prestasi' && isTodaySenin ? (
            <div className="absensi-disabled-overlay">
              <AlertTriangle size={40} />
              <p>Absensi Prestasi tidak tersedia pada hari Senin</p>
            </div>
          ) : loading ? (
            <div className="absensi-loading">
              {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
            </div>
          ) : siswaList.length === 0 ? (
            <div className="absensi-empty">
              <Users size={48} />
              <p>Tidak ada siswa {activeTab} yang terdaftar untuk pelatih ini</p>
            </div>
          ) : (
            <div className="absensi-student-list">
              {siswaList.map((siswa) => {
                const sudahHadir = siswa.status_hadir === 'Hadir';
                const sudahTidakHadir = siswa.status_hadir === 'Tidak Hadir';
                const sudahAbsen = !!siswa.absensi_id;

                return (
                  <div
                    key={siswa.siswa_id}
                    className={`absensi-student-row${sudahHadir ? ' hadir' : sudahTidakHadir ? ' tidak-hadir' : ''}`}
                  >
                    {/* Status indicator */}
                    <div className="absensi-student-indicator">
                      {sudahHadir ? (
                        <CheckCircle2 className="icon-hadir" size={22} />
                      ) : sudahTidakHadir ? (
                        <XCircle className="icon-tidak-hadir" size={22} />
                      ) : (
                        <div className="icon-belum" />
                      )}
                    </div>

                    {/* Student info */}
                    <div className="absensi-student-info">
                      <span className="absensi-student-name">{siswa.nama_lengkap}</span>
                      <span className="absensi-student-meta">
                        {siswa.id_siswa}
                        {siswa.nama_paket && ` · ${siswa.nama_paket}`}
                        {activeTab !== 'Prestasi' && (
                          <> · <strong>{siswa.kuota_terpakai}/{siswa.kuota_total}</strong> sesi</>
                        )}
                        {activeTab === 'Prestasi' && (
                          <> · <strong>{siswa.kuota_terpakai}×</strong> bulan ini</>
                        )}
                        {siswa.pelatih_pemilik && (
                          <> · Pelatih: <strong>{siswa.pelatih_pemilik}</strong></>
                        )}
                      </span>
                      {sudahAbsen && siswa.pelatih_mengajar_id && siswa.pelatih_mengajar_id !== siswa.pelatih_pemilik_id && (
                        <span className="absensi-student-pengganti">
                          Pengganti: {getPelatihName(siswa.pelatih_mengajar_id)}
                        </span>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="absensi-student-actions">
                      {!canEditSiswa(siswa) ? (
                        <span
                          className="absensi-badge-readonly"
                          title={`Hanya dapat diubah oleh pelatih pemilik (${siswa.pelatih_pemilik || '-'}) atau Admin/Owner`}
                        >
                          Read-Only
                        </span>
                      ) : sudahAbsen ? (
                        <button
                          className="absensi-btn-batal"
                          onClick={() => handleToggleAbsen(siswa)}
                          disabled={saving}
                          title="Batalkan absensi"
                        >
                          <RotateCcw size={14} />
                          Batal
                        </button>
                      ) : (
                        <>
                          <button
                            className="absensi-btn-hadir"
                            onClick={() => handleToggleAbsen(siswa)}
                            disabled={saving}
                          >
                            <CheckCircle2 size={14} />
                            Hadir
                          </button>
                          <button
                            className="absensi-btn-tidak-hadir"
                            onClick={() => handleTidakHadir(siswa)}
                            disabled={saving}
                          >
                            <XCircle size={14} />
                            Tidak
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ===== MODAL REKAP ===== */}
      {showRekap && (
        <div className="absensi-modal-backdrop" onClick={() => setShowRekap(false)}>
          <div className="absensi-modal" onClick={(e) => e.stopPropagation()}>
            <div className="absensi-modal-header">
              <h2>Rekap Absensi — {activeTab}</h2>
              <span className="absensi-modal-period">
                {BULAN_NAMES[bulan - 1]} {tahun}
              </span>
              <div className="absensi-modal-actions">
                <button
                  className="absensi-btn-export"
                  onClick={() => exportRekapCSV(rekapData, bulan, tahun, activeTab)}
                  disabled={rekapData.length === 0}
                >
                  <Download size={14} />
                  Export CSV
                </button>
                <button className="absensi-modal-close" onClick={() => setShowRekap(false)}>
                  ✕
                </button>
              </div>
            </div>

            <div className="absensi-modal-body">
              {loadingRekap ? (
                <div className="absensi-loading">
                  {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
                </div>
              ) : rekapData.length === 0 ? (
                <div className="absensi-empty">
                  <ClipboardCheck size={40} />
                  <p>Belum ada data absensi di bulan ini</p>
                </div>
              ) : (
                <table className="absensi-rekap-table">
                  <thead>
                    <tr>
                      <th>Nama Siswa</th>
                      <th>Tanggal</th>
                      {activeTab !== 'Prestasi' && <th>Sesi</th>}
                      <th>Pelatih Mengajar</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rekapData.map((r) => (
                      <tr key={r.id}>
                        <td>
                          <span className="rekap-nama">{r.nama_lengkap}</span>
                        </td>
                        <td>{r.tanggal}</td>
                        {activeTab !== 'Prestasi' && <td>Sesi {r.nomor_sesi ?? '-'}</td>}
                        <td>{r.nama_pelatih_mengajar ?? r.pelatih_pemilik ?? '-'}</td>
                        <td>
                          <span className={`rekap-badge ${r.status_hadir === 'Hadir' ? 'hadir' : 'tidak-hadir'}`}>
                            {r.status_hadir}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
