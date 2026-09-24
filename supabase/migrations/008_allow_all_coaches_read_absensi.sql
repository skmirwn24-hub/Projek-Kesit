-- ========================================================
-- KESIT Management - Migration 008: Allow All Coaches Read-Only Absensi
-- Mengizinkan seluruh user authenticated (termasuk semua pelatih)
-- untuk membaca data absensi seluruh siswa secara transparan (Read-Only).
-- Hak INSERT, UPDATE, dan DELETE tetap dijaga ketat:
-- - INSERT: Hanya Owner, Admin, dan Pelatih pemilik siswa
-- - UPDATE: Hanya Owner, Admin, dan Pelatih pemilik siswa
-- - DELETE: Hanya Owner dan Admin
-- - RPC kesit_absen_siswa & kesit_batalkan_absen tetap diverifikasi kepemilikannya
-- ========================================================

DROP POLICY IF EXISTS "Admin or relevant Pelatih can read absensi" ON public.absensi_siswa;
DROP POLICY IF EXISTS "Authenticated users can read absensi" ON public.absensi_siswa;
DROP POLICY IF EXISTS "Authenticated users can read absensi_siswa" ON public.absensi_siswa;

CREATE POLICY "Authenticated users can read absensi"
  ON public.absensi_siswa FOR SELECT
  TO authenticated
  USING (true);

-- Pastikan view v_absensi_siswa dan v_siswa_untuk_absensi dapat dibaca authenticated
GRANT SELECT ON public.absensi_siswa TO authenticated;
GRANT SELECT ON public.v_absensi_siswa TO authenticated;
GRANT SELECT ON public.v_siswa_untuk_absensi TO authenticated;
