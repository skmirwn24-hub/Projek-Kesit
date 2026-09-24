-- ========================================================
-- KESIT Management - Migration 009: Absensi Query & Caching Performance
-- Optimasi query lookups absensi, rekap bulanan, dan view
-- ========================================================

-- 1. Index pencarian absensi berdasarkan kategori, nomor sesi, tanggal & siswa
CREATE INDEX IF NOT EXISTS idx_absensi_siswa_lookup
  ON public.absensi_siswa (kategori, nomor_sesi, tanggal, siswa_id);

-- 2. Index pencarian absensi Prestasi (tanggal & siswa)
CREATE INDEX IF NOT EXISTS idx_absensi_siswa_prestasi_lookup
  ON public.absensi_siswa (kategori, tanggal, siswa_id)
  WHERE kategori = 'Prestasi';

-- 3. Index agregasi rekap absensi per tanggal & pelatih
CREATE INDEX IF NOT EXISTS idx_absensi_siswa_rekap_bulanan
  ON public.absensi_siswa (tanggal DESC, kategori, pelatih_id);

-- 4. Index filter siswa aktif per pelatih pemilik
CREATE INDEX IF NOT EXISTS idx_siswa_aktif_pelatih
  ON public.siswa (pelatih_pemilik_id, status_siswa)
  WHERE status_siswa = 'Aktif';
