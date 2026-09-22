-- ========================================================
-- KESIT Management - Performance Optimization Migration
-- ========================================================

-- --------------------------------------------------------
-- 1. EXTENSIONS
-- --------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- --------------------------------------------------------
-- 2. COMPOSITE INDEXES UNTUK VIEW v_rekapan_siswa (LATERAL JOINS)
-- Menghilangkan Sequential Table Scan O(N*M)
-- --------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_paket_siswa_lookup 
  ON public.paket_siswa(siswa_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_pembayaran_siswa_lookup 
  ON public.pembayaran_siswa(siswa_id, paket_siswa_id, created_at DESC);

-- --------------------------------------------------------
-- 3. FOREIGN KEY INDEXES (Percepat JOIN & ON DELETE CASCADE)
-- --------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_siswa_pelatih_pemilik 
  ON public.siswa(pelatih_pemilik_id);

CREATE INDEX IF NOT EXISTS idx_siswa_pelatih_diminta 
  ON public.siswa(pelatih_diminta_id);

CREATE INDEX IF NOT EXISTS idx_penilaian_pelatih_lookup 
  ON public.penilaian_pelatih(pelatih_id, tanggal_penilaian DESC);

CREATE INDEX IF NOT EXISTS idx_riwayat_siswa_lookup 
  ON public.riwayat_perubahan_siswa(siswa_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_riwayat_pelatih_lama 
  ON public.riwayat_perubahan_siswa(pelatih_pemilik_lama);

CREATE INDEX IF NOT EXISTS idx_riwayat_pelatih_baru 
  ON public.riwayat_perubahan_siswa(pelatih_pemilik_baru);

CREATE INDEX IF NOT EXISTS idx_user_profiles_pelatih 
  ON public.user_profiles(pelatih_id);

-- --------------------------------------------------------
-- 4. SEARCH INDEXES (Pencarian Cepat Siswa & Pelatih)
-- --------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_siswa_id_siswa 
  ON public.siswa(id_siswa);

CREATE INDEX IF NOT EXISTS idx_siswa_nama_trgm 
  ON public.siswa USING gin (nama_lengkap gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_siswa_wali_trgm 
  ON public.siswa USING gin (nama_wali gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_pelatih_nama 
  ON public.pelatih(nama);

-- --------------------------------------------------------
-- 5. FUNCTION: get_dashboard_summary (Agregasi Instan < 5ms)
-- Menggantikan penarikan seluruh data tabel ke memory Node.js
-- --------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_dashboard_summary()
RETURNS JSON
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT json_build_object(
    'total_siswa', (SELECT count(*) FROM public.siswa),
    'siswa_aktif', (SELECT count(*) FROM public.siswa WHERE status_siswa = 'Aktif'),
    'siswa_lunas', (
      SELECT count(DISTINCT s.id) 
      FROM public.siswa s
      JOIN LATERAL (
        SELECT pb.status_pembayaran FROM public.pembayaran_siswa pb
        WHERE pb.siswa_id = s.id
        ORDER BY pb.created_at DESC LIMIT 1
      ) last_pb ON last_pb.status_pembayaran = 'Lunas'
    ),
    'siswa_belum_lunas', (
      SELECT count(DISTINCT s.id) 
      FROM public.siswa s
      JOIN LATERAL (
        SELECT pb.status_pembayaran FROM public.pembayaran_siswa pb
        WHERE pb.siswa_id = s.id
        ORDER BY pb.created_at DESC LIMIT 1
      ) last_pb ON last_pb.status_pembayaran = 'Belum Lunas'
    ),
    'total_pelatih', (SELECT count(*) FROM public.pelatih),
    'pelatih_aktif', (SELECT count(*) FROM public.pelatih WHERE status = 'Aktif'),
    'pelatih_training', (SELECT count(*) FROM public.pelatih WHERE status = 'Training'),
    'pelatih_nonaktif', (SELECT count(*) FROM public.pelatih WHERE status = 'Nonaktif'),
    'total_pendapatan', (SELECT coalesce(sum(nominal_dibayar), 0) FROM public.pembayaran_siswa),
    'sisa_piutang', (SELECT coalesce(sum(sisa_tagihan), 0) FROM public.pembayaran_siswa)
  );
$$;

GRANT EXECUTE ON FUNCTION public.get_dashboard_summary() TO authenticated, anon;

-- --------------------------------------------------------
-- 6. OPTIMASI RLS POLICIES DENGAN CACHING (SELECT ...)
-- --------------------------------------------------------
-- Pelatih
DROP POLICY IF EXISTS "Owner and Admin can insert pelatih" ON public.pelatih;
CREATE POLICY "Owner and Admin can insert pelatih"
  ON public.pelatih FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT public.kesit_is_admin_or_owner()));

DROP POLICY IF EXISTS "Owner and Admin can update pelatih" ON public.pelatih;
CREATE POLICY "Owner and Admin can update pelatih"
  ON public.pelatih FOR UPDATE
  TO authenticated
  USING ((SELECT public.kesit_is_admin_or_owner()));

-- Siswa
DROP POLICY IF EXISTS "Owner and Admin can insert siswa" ON public.siswa;
CREATE POLICY "Owner and Admin can insert siswa"
  ON public.siswa FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT public.kesit_is_admin_or_owner()));

DROP POLICY IF EXISTS "Owner and Admin can update siswa" ON public.siswa;
CREATE POLICY "Owner and Admin can update siswa"
  ON public.siswa FOR UPDATE
  TO authenticated
  USING ((SELECT public.kesit_is_admin_or_owner()));

-- Paket Siswa
DROP POLICY IF EXISTS "Owner and Admin can manage paket_siswa" ON public.paket_siswa;
CREATE POLICY "Owner and Admin can manage paket_siswa"
  ON public.paket_siswa FOR ALL
  TO authenticated
  USING ((SELECT public.kesit_is_admin_or_owner()));

-- Pembayaran Siswa
DROP POLICY IF EXISTS "Owner and Admin can manage pembayaran_siswa" ON public.pembayaran_siswa;
CREATE POLICY "Owner and Admin can manage pembayaran_siswa"
  ON public.pembayaran_siswa FOR ALL
  TO authenticated
  USING ((SELECT public.kesit_is_admin_or_owner()));

-- Penilaian Pelatih
DROP POLICY IF EXISTS "Owner and Admin can manage penilaian_pelatih" ON public.penilaian_pelatih;
CREATE POLICY "Owner and Admin can manage penilaian_pelatih"
  ON public.penilaian_pelatih FOR ALL
  TO authenticated
  USING ((SELECT public.kesit_is_admin_or_owner()));

-- Riwayat
DROP POLICY IF EXISTS "Owner and Admin can insert riwayat" ON public.riwayat_perubahan_siswa;
CREATE POLICY "Owner and Admin can insert riwayat"
  ON public.riwayat_perubahan_siswa FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT public.kesit_is_admin_or_owner()));
