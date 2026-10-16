-- ========================================================
-- KESIT Management - Migration 013: Fix Security - Laporan Siswa
-- Memperbaiki notifikasi UNRESTRICTED pada tabel laporan_siswa,
-- detail_evaluasi_renang, sertifikat_siswa, dan view terkait.
-- Penyebab UNRESTRICTED:
--   1. UPDATE policy tanpa WITH CHECK memungkinkan row hijacking
--   2. ALL policy tanpa WITH CHECK pada detail & sertifikat
--   3. View v_laporan_siswa & v_laporan_siswa_pelatih tidak security_invoker
--   4. Akses anon tidak diblokir ke tabel dan view laporan
--   5. SECURITY DEFINER functions dapat dipanggil oleh PUBLIC/anon
-- ========================================================

-- --------------------------------------------------------
-- 1. REVOKE AKSES ANON DARI TABEL LAPORAN SISWA
-- --------------------------------------------------------
REVOKE ALL ON public.laporan_siswa FROM anon;
REVOKE ALL ON public.detail_evaluasi_renang FROM anon;
REVOKE ALL ON public.sertifikat_siswa FROM anon;

-- --------------------------------------------------------
-- 2. TAMBAHKAN WITH CHECK PADA POLICY UPDATE laporan_siswa
--    Tanpa WITH CHECK, Supabase Advisor menandai UPDATE policy
--    sebagai UNRESTRICTED karena user bisa mengubah kolom
--    (misal pelatih_id) ke nilai yang tidak diizinkan.
-- --------------------------------------------------------
DROP POLICY IF EXISTS "Owner, Admin, or Coach can update laporan_siswa" ON public.laporan_siswa;

CREATE POLICY "Owner, Admin, or Coach can update laporan_siswa"
  ON public.laporan_siswa FOR UPDATE
  TO authenticated
  USING (
    (SELECT public.kesit_is_admin_or_owner())
    OR
    EXISTS (
      SELECT 1 FROM public.siswa s
      JOIN public.user_profiles up ON up.id = auth.uid()
      WHERE s.id = laporan_siswa.siswa_id
        AND up.role = 'Pelatih'
        AND (s.pelatih_pemilik_id = up.pelatih_id OR laporan_siswa.pelatih_id = up.pelatih_id)
    )
  )
  WITH CHECK (
    (SELECT public.kesit_is_admin_or_owner())
    OR
    EXISTS (
      SELECT 1 FROM public.siswa s
      JOIN public.user_profiles up ON up.id = auth.uid()
      WHERE s.id = laporan_siswa.siswa_id
        AND up.role = 'Pelatih'
        AND (s.pelatih_pemilik_id = up.pelatih_id OR laporan_siswa.pelatih_id = up.pelatih_id)
    )
  );

-- --------------------------------------------------------
-- 3. PERBAIKI POLICY ALL detail_evaluasi_renang
--    Policy FOR ALL tanpa WITH CHECK dianggap UNRESTRICTED
-- --------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can read detail_evaluasi" ON public.detail_evaluasi_renang;
DROP POLICY IF EXISTS "Manage detail_evaluasi via parent policy" ON public.detail_evaluasi_renang;

-- SELECT untuk semua authenticated
CREATE POLICY "Authenticated users can read detail_evaluasi"
  ON public.detail_evaluasi_renang FOR SELECT
  TO authenticated
  USING (true);

-- INSERT/UPDATE/DELETE dibatasi ke pelatih pemilik atau admin
CREATE POLICY "Admin or Coach can manage detail_evaluasi"
  ON public.detail_evaluasi_renang FOR ALL
  TO authenticated
  USING (
    (SELECT public.kesit_is_admin_or_owner())
    OR
    EXISTS (
      SELECT 1 FROM public.laporan_siswa ls
      JOIN public.user_profiles up ON up.id = auth.uid()
      WHERE ls.id = detail_evaluasi_renang.laporan_id
        AND up.role = 'Pelatih'
        AND ls.pelatih_id = up.pelatih_id
    )
  )
  WITH CHECK (
    (SELECT public.kesit_is_admin_or_owner())
    OR
    EXISTS (
      SELECT 1 FROM public.laporan_siswa ls
      JOIN public.user_profiles up ON up.id = auth.uid()
      WHERE ls.id = detail_evaluasi_renang.laporan_id
        AND up.role = 'Pelatih'
        AND ls.pelatih_id = up.pelatih_id
    )
  );

-- --------------------------------------------------------
-- 4. PERBAIKI POLICY ALL sertifikat_siswa
--    Policy FOR ALL tanpa WITH CHECK dianggap UNRESTRICTED
-- --------------------------------------------------------
DROP POLICY IF EXISTS "Owner and Admin can manage sertifikat_siswa" ON public.sertifikat_siswa;

CREATE POLICY "Owner and Admin can manage sertifikat_siswa"
  ON public.sertifikat_siswa FOR ALL
  TO authenticated
  USING ((SELECT public.kesit_is_admin_or_owner()))
  WITH CHECK ((SELECT public.kesit_is_admin_or_owner()));

-- --------------------------------------------------------
-- 5. SET security_invoker PADA VIEW LAPORAN SISWA
--    View tanpa security_invoker=true berjalan dengan hak
--    view owner (biasanya postgres/superuser) dan bypass RLS,
--    sehingga Supabase Advisor menandainya sebagai UNRESTRICTED.
-- --------------------------------------------------------
ALTER VIEW public.v_laporan_siswa SET (security_invoker = true);
ALTER VIEW public.v_laporan_siswa_pelatih SET (security_invoker = true);

-- --------------------------------------------------------
-- 6. REVOKE ANON DAN GRANT AUTHENTICATED PADA VIEW LAPORAN
-- --------------------------------------------------------
REVOKE ALL ON public.v_laporan_siswa FROM anon;
REVOKE ALL ON public.v_laporan_siswa_pelatih FROM anon;

GRANT SELECT ON public.v_laporan_siswa TO authenticated;
GRANT SELECT ON public.v_laporan_siswa_pelatih TO authenticated;

-- --------------------------------------------------------
-- 7. REVOKE PUBLIC DARI FUNCTION SECURITY DEFINER LAPORAN
--    Postgres grants EXECUTE ke PUBLIC secara default pada setiap
--    function baru, sehingga anon bisa memanggil function ini.
-- --------------------------------------------------------
REVOKE EXECUTE ON FUNCTION public.kesit_simpan_laporan_siswa(
  UUID, UUID, UUID, INTEGER, INTEGER, DATE, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB
) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.kesit_simpan_laporan_siswa(
  UUID, UUID, UUID, INTEGER, INTEGER, DATE, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB
) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.kesit_hapus_laporan_siswa(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.kesit_hapus_laporan_siswa(UUID) TO authenticated;
