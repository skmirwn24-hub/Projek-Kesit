-- ========================================================
-- KESIT Management - Migration 007: Security Hardening
-- Menutup celah PostgREST / direct API, membatasi hak akses anon,
-- mengamankan data keuangan, dan memperkuat RLS & SECURITY DEFINER.
-- ========================================================

-- --------------------------------------------------------
-- 1. REVOKE HAK AKSES ANON DARI SEMUA TABEL PUBLIK
-- --------------------------------------------------------
REVOKE ALL ON public.user_profiles FROM anon;
REVOKE ALL ON public.pelatih FROM anon;
REVOKE ALL ON public.siswa FROM anon;
REVOKE ALL ON public.paket_siswa FROM anon;
REVOKE ALL ON public.pembayaran_siswa FROM anon;
REVOKE ALL ON public.penilaian_pelatih FROM anon;
REVOKE ALL ON public.riwayat_perubahan_siswa FROM anon;
REVOKE ALL ON public.absensi_siswa FROM anon;

-- --------------------------------------------------------
-- 2. HARDENING RLS: PEMBAYARAN SISWA (KRITIS)
-- Hanya Owner dan Admin yang boleh melihat data pembayaran & keuangan
-- --------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can read pembayaran_siswa" ON public.pembayaran_siswa;
DROP POLICY IF EXISTS "Only Owner and Admin can read pembayaran_siswa" ON public.pembayaran_siswa;

CREATE POLICY "Only Owner and Admin can read pembayaran_siswa"
  ON public.pembayaran_siswa FOR SELECT
  TO authenticated
  USING ((SELECT public.kesit_is_admin_or_owner()));

-- --------------------------------------------------------
-- 3. HARDENING RLS: PENILAIAN PELATIH (TINGGI)
-- Admin/Owner bisa melihat semua, Pelatih hanya bisa melihat penilaian miliknya
-- --------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can read penilaian_pelatih" ON public.penilaian_pelatih;
DROP POLICY IF EXISTS "Admin/Owner or own penilaian" ON public.penilaian_pelatih;

CREATE POLICY "Admin/Owner or own penilaian"
  ON public.penilaian_pelatih FOR SELECT
  TO authenticated
  USING (
    (SELECT public.kesit_is_admin_or_owner())
    OR
    pelatih_id IN (
      SELECT up.pelatih_id FROM public.user_profiles up WHERE up.id = auth.uid()
    )
  );

-- --------------------------------------------------------
-- 4. HARDENING RLS: ABSENSI SISWA (KRITIS)
-- Perketat INSERT, UPDATE, DELETE, dan SELECT absensi_siswa
-- --------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can read absensi_siswa" ON public.absensi_siswa;
DROP POLICY IF EXISTS "Authenticated users can insert absensi_siswa" ON public.absensi_siswa;
DROP POLICY IF EXISTS "Authenticated users can update absensi_siswa" ON public.absensi_siswa;
DROP POLICY IF EXISTS "Authenticated users can delete absensi_siswa" ON public.absensi_siswa;
DROP POLICY IF EXISTS "Pelatih can insert absensi for owned students" ON public.absensi_siswa;
DROP POLICY IF EXISTS "Pelatih can update absensi for owned students" ON public.absensi_siswa;
DROP POLICY IF EXISTS "Pelatih can delete absensi for owned students" ON public.absensi_siswa;
DROP POLICY IF EXISTS "Admin or relevant Pelatih can read absensi" ON public.absensi_siswa;
DROP POLICY IF EXISTS "Admin or owning Pelatih can insert absensi" ON public.absensi_siswa;
DROP POLICY IF EXISTS "Admin or owning Pelatih can update absensi" ON public.absensi_siswa;
DROP POLICY IF EXISTS "Only Owner and Admin can delete absensi" ON public.absensi_siswa;

-- SELECT: Admin/Owner, atau Pelatih pengajar, atau Pelatih pemilik siswa
CREATE POLICY "Admin or relevant Pelatih can read absensi"
  ON public.absensi_siswa FOR SELECT
  TO authenticated
  USING (
    (SELECT public.kesit_is_admin_or_owner())
    OR
    pelatih_id IN (
      SELECT up.pelatih_id FROM public.user_profiles up WHERE up.id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1
      FROM public.siswa s
      JOIN public.user_profiles up ON up.id = auth.uid()
      WHERE s.id = absensi_siswa.siswa_id
        AND s.pelatih_pemilik_id = up.pelatih_id
        AND up.pelatih_id IS NOT NULL
    )
  );

-- INSERT: Admin/Owner atau Pelatih pemilik siswa
CREATE POLICY "Admin or owning Pelatih can insert absensi"
  ON public.absensi_siswa FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT public.kesit_is_admin_or_owner())
    OR
    EXISTS (
      SELECT 1
      FROM public.siswa s
      JOIN public.user_profiles up ON up.id = auth.uid()
      WHERE s.id = absensi_siswa.siswa_id
        AND s.pelatih_pemilik_id = up.pelatih_id
        AND up.pelatih_id IS NOT NULL
    )
  );

-- UPDATE: Admin/Owner atau Pelatih pemilik siswa
CREATE POLICY "Admin or owning Pelatih can update absensi"
  ON public.absensi_siswa FOR UPDATE
  TO authenticated
  USING (
    (SELECT public.kesit_is_admin_or_owner())
    OR
    EXISTS (
      SELECT 1
      FROM public.siswa s
      JOIN public.user_profiles up ON up.id = auth.uid()
      WHERE s.id = absensi_siswa.siswa_id
        AND s.pelatih_pemilik_id = up.pelatih_id
        AND up.pelatih_id IS NOT NULL
    )
  );

-- DELETE: Hanya Admin & Owner
CREATE POLICY "Only Owner and Admin can delete absensi"
  ON public.absensi_siswa FOR DELETE
  TO authenticated
  USING ((SELECT public.kesit_is_admin_or_owner()));

-- --------------------------------------------------------
-- 5. HARDENING RLS: USER PROFILES
-- Pastikan user_profiles hanya bisa dibaca oleh authenticated
-- --------------------------------------------------------
DROP POLICY IF EXISTS "Users can read own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Owners and Admins can read all profiles" ON public.user_profiles;

CREATE POLICY "Users can read own profile"
  ON public.user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Owners and Admins can read all profiles"
  ON public.user_profiles FOR SELECT
  TO authenticated
  USING ((SELECT public.kesit_is_admin_or_owner()));

-- --------------------------------------------------------
-- 6. HARDENING SECURITY DEFINER FUNCTIONS DENGAN ROLE GUARDS
-- --------------------------------------------------------

-- 6.1 daftar_siswa_awal: Guard Owner/Admin
CREATE OR REPLACE FUNCTION public.daftar_siswa_awal(
  p_nama_lengkap TEXT,
  p_nama_panggilan TEXT,
  p_jenis_kelamin TEXT,
  p_tempat_lahir TEXT,
  p_tanggal_lahir DATE,
  p_nama_wali TEXT,
  p_no_hp_wali TEXT,
  p_alamat TEXT,
  p_pelatih_pemilik_id UUID,
  p_pelatih_diminta_id UUID,
  p_status_siswa TEXT,
  p_tanggal_daftar DATE,
  p_lokasi TEXT,
  p_kelas TEXT,
  p_nama_paket TEXT,
  p_harga_paket NUMERIC,
  p_biaya_request_pelatih NUMERIC,
  p_diskon NUMERIC,
  p_total_tagihan NUMERIC,
  p_kuota_total INTEGER,
  p_nominal_dibayar NUMERIC,
  p_sisa_tagihan NUMERIC,
  p_status_pembayaran TEXT,
  p_metode_pembayaran TEXT,
  p_admin_penerima TEXT
)
RETURNS TABLE (
  siswa_id UUID,
  id_siswa TEXT,
  paket_siswa_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_siswa_id UUID;
  v_id_siswa TEXT;
  v_paket_id UUID;
  v_count INTEGER;
  v_kuitansi TEXT;
BEGIN
  -- Guard: hanya Owner/Admin yang diizinkan mendaftarkan siswa
  IF NOT public.kesit_is_admin_or_owner() THEN
    RAISE EXCEPTION 'Akses ditolak: hanya Owner/Admin yang diizinkan mendaftarkan siswa.';
  END IF;

  SELECT COALESCE(
    MAX(
      CASE 
        WHEN id_siswa ~ '^SIS[0-9]+$' THEN SUBSTRING(id_siswa FROM 4)::INTEGER 
        ELSE 0 
      END
    ), 
    0
  ) + 1 INTO v_count FROM public.siswa;
  v_id_siswa := 'SIS' || LPAD(v_count::TEXT, 6, '0');

  WHILE EXISTS (SELECT 1 FROM public.siswa WHERE id_siswa = v_id_siswa) LOOP
    v_count := v_count + 1;
    v_id_siswa := 'SIS' || LPAD(v_count::TEXT, 6, '0');
  END LOOP;

  INSERT INTO public.siswa (
    id_siswa, nama_lengkap, nama_panggilan, jenis_kelamin,
    tempat_lahir, tanggal_lahir, nama_wali, no_hp_wali, alamat,
    pelatih_pemilik_id, pelatih_diminta_id, status_siswa, tanggal_daftar
  ) VALUES (
    v_id_siswa, p_nama_lengkap, p_nama_panggilan, p_jenis_kelamin,
    p_tempat_lahir, p_tanggal_lahir, p_nama_wali, p_no_hp_wali, p_alamat,
    p_pelatih_pemilik_id, p_pelatih_diminta_id, p_status_siswa, p_tanggal_daftar
  )
  RETURNING id INTO v_siswa_id;

  INSERT INTO public.paket_siswa (
    siswa_id, lokasi, kelas, nama_paket, harga_paket,
    biaya_request_pelatih, diskon, total_tagihan, kuota_total,
    kuota_terpakai, status_paket
  ) VALUES (
    v_siswa_id, p_lokasi, p_kelas, p_nama_paket, p_harga_paket,
    p_biaya_request_pelatih, p_diskon, p_total_tagihan, p_kuota_total,
    0, 'Aktif'
  )
  RETURNING id INTO v_paket_id;

  v_kuitansi := 'KW-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(v_count::TEXT, 4, '0');

  INSERT INTO public.pembayaran_siswa (
    siswa_id, paket_siswa_id, nomor_kuitansi, nominal_dibayar,
    sisa_tagihan, status_pembayaran, metode_pembayaran, admin_penerima,
    tanggal_transaksi, harga_paket, biaya_request_pelatih, diskon, total_tagihan
  ) VALUES (
    v_siswa_id, v_paket_id, v_kuitansi, p_nominal_dibayar,
    p_sisa_tagihan, p_status_pembayaran, p_metode_pembayaran, p_admin_penerima,
    p_tanggal_daftar, p_harga_paket, p_biaya_request_pelatih, p_diskon, p_total_tagihan
  );

  INSERT INTO public.riwayat_perubahan_siswa (
    siswa_id, jenis_perubahan, lokasi_baru, kelas_baru,
    paket_baru, pelatih_pemilik_baru, tanggal_perubahan,
    alasan, diubah_oleh
  ) VALUES (
    v_siswa_id, 'Pendaftaran Baru', p_lokasi, p_kelas,
    p_nama_paket, p_pelatih_pemilik_id, p_tanggal_daftar,
    'Pendaftaran siswa awal', p_admin_penerima
  );

  RETURN QUERY SELECT v_siswa_id, v_id_siswa, v_paket_id;
END;
$$;

-- 6.2 kesit_edit_biodata_siswa: Guard Owner/Admin
CREATE OR REPLACE FUNCTION public.kesit_edit_biodata_siswa(
  p_siswa_id UUID,
  p_nama_lengkap TEXT,
  p_nama_panggilan TEXT,
  p_jenis_kelamin TEXT,
  p_tempat_lahir TEXT,
  p_tanggal_lahir DATE,
  p_nama_wali TEXT,
  p_no_hp_wali TEXT,
  p_alamat TEXT,
  p_status_siswa TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Guard: hanya Owner/Admin yang diizinkan mengedit biodata siswa
  IF NOT public.kesit_is_admin_or_owner() THEN
    RAISE EXCEPTION 'Akses ditolak: hanya Owner/Admin yang diizinkan mengedit biodata siswa.';
  END IF;

  UPDATE public.siswa SET
    nama_lengkap = p_nama_lengkap,
    nama_panggilan = p_nama_panggilan,
    jenis_kelamin = p_jenis_kelamin,
    tempat_lahir = p_tempat_lahir,
    tanggal_lahir = p_tanggal_lahir,
    nama_wali = p_nama_wali,
    no_hp_wali = p_no_hp_wali,
    alamat = p_alamat,
    status_siswa = p_status_siswa
  WHERE id = p_siswa_id;
END;
$$;

-- 6.3 kesit_pindah_kelas_siswa: Guard Owner/Admin
CREATE OR REPLACE FUNCTION public.kesit_pindah_kelas_siswa(
  p_siswa_id UUID,
  p_paket_siswa_id UUID,
  p_lokasi_baru TEXT,
  p_kelas_baru TEXT,
  p_paket_baru TEXT,
  p_harga_paket_baru NUMERIC,
  p_kuota_total_baru INTEGER,
  p_pelatih_pemilik_baru UUID,
  p_pelatih_diminta_baru UUID,
  p_biaya_request_pelatih_baru NUMERIC,
  p_diskon_baru NUMERIC,
  p_total_tagihan_baru NUMERIC,
  p_alasan TEXT,
  p_diubah_oleh TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old RECORD;
BEGIN
  -- Guard: hanya Owner/Admin yang diizinkan memindahkan kelas siswa
  IF NOT public.kesit_is_admin_or_owner() THEN
    RAISE EXCEPTION 'Akses ditolak: hanya Owner/Admin yang diizinkan memindahkan kelas siswa.';
  END IF;

  SELECT lokasi, kelas, nama_paket INTO v_old
  FROM public.paket_siswa WHERE id = p_paket_siswa_id;

  UPDATE public.paket_siswa SET status_paket = 'Nonaktif'
  WHERE id = p_paket_siswa_id;

  INSERT INTO public.paket_siswa (
    siswa_id, lokasi, kelas, nama_paket, harga_paket,
    biaya_request_pelatih, diskon, total_tagihan, kuota_total,
    kuota_terpakai, status_paket
  ) VALUES (
    p_siswa_id, p_lokasi_baru, p_kelas_baru, p_paket_baru,
    p_harga_paket_baru, p_biaya_request_pelatih_baru, p_diskon_baru,
    p_total_tagihan_baru, p_kuota_total_baru, 0, 'Aktif'
  );

  UPDATE public.siswa SET
    pelatih_pemilik_id = p_pelatih_pemilik_baru,
    pelatih_diminta_id = p_pelatih_diminta_baru
  WHERE id = p_siswa_id;

  INSERT INTO public.riwayat_perubahan_siswa (
    siswa_id, jenis_perubahan, lokasi_lama, kelas_lama, paket_lama,
    lokasi_baru, kelas_baru, paket_baru, pelatih_pemilik_baru,
    tanggal_perubahan, alasan, diubah_oleh
  ) VALUES (
    p_siswa_id, 'Pindah Kelas', v_old.lokasi, v_old.kelas, v_old.nama_paket,
    p_lokasi_baru, p_kelas_baru, p_paket_baru, p_pelatih_pemilik_baru,
    CURRENT_DATE, p_alasan, p_diubah_oleh
  );
END;
$$;

-- 6.4 kesit_absen_siswa: Guard Owner/Admin atau Pelatih Pemilik
CREATE OR REPLACE FUNCTION public.kesit_absen_siswa(
  p_siswa_id        UUID,
  p_paket_siswa_id  UUID,
  p_pelatih_id      UUID,
  p_tanggal         DATE,
  p_nomor_sesi      INTEGER,
  p_kategori        TEXT,
  p_status_hadir    TEXT,
  p_catatan         TEXT,
  p_dicatat_oleh    UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_absensi_id UUID;
  v_existing_id UUID;
  v_existing_hadir TEXT;
BEGIN
  -- Guard: hanya Owner/Admin atau Pelatih pemilik siswa
  IF NOT public.kesit_is_admin_or_owner() THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.siswa s
      JOIN public.user_profiles up ON up.pelatih_id = s.pelatih_pemilik_id
      WHERE s.id = p_siswa_id AND up.id = auth.uid() AND up.pelatih_id IS NOT NULL
    ) THEN
      RAISE EXCEPTION 'Akses ditolak: siswa ini bukan milik Anda.';
    END IF;
  END IF;

  IF p_nomor_sesi IS NOT NULL THEN
    SELECT id, status_hadir INTO v_existing_id, v_existing_hadir
    FROM public.absensi_siswa
    WHERE siswa_id = p_siswa_id
      AND date_trunc('month', tanggal)::DATE = date_trunc('month', p_tanggal)::DATE
      AND nomor_sesi = p_nomor_sesi
      AND kategori = p_kategori
    LIMIT 1;
  ELSE
    SELECT id, status_hadir INTO v_existing_id, v_existing_hadir
    FROM public.absensi_siswa
    WHERE siswa_id = p_siswa_id
      AND tanggal = p_tanggal
      AND kategori = p_kategori
    LIMIT 1;
  END IF;

  IF v_existing_id IS NOT NULL THEN
    UPDATE public.absensi_siswa SET
      pelatih_id    = p_pelatih_id,
      tanggal       = p_tanggal,
      status_hadir  = p_status_hadir,
      catatan       = p_catatan,
      dicatat_oleh  = p_dicatat_oleh
    WHERE id = v_existing_id;

    v_absensi_id := v_existing_id;

    IF v_existing_hadir != p_status_hadir AND p_paket_siswa_id IS NOT NULL THEN
      IF p_status_hadir = 'Hadir' THEN
        UPDATE public.paket_siswa
        SET kuota_terpakai = GREATEST(0, kuota_terpakai + 1)
        WHERE id = p_paket_siswa_id;
      ELSE
        UPDATE public.paket_siswa
        SET kuota_terpakai = GREATEST(0, kuota_terpakai - 1)
        WHERE id = p_paket_siswa_id;
      END IF;
    END IF;
  ELSE
    INSERT INTO public.absensi_siswa (
      siswa_id, paket_siswa_id, pelatih_id,
      tanggal, nomor_sesi, kategori,
      status_hadir, catatan, dicatat_oleh
    ) VALUES (
      p_siswa_id, p_paket_siswa_id, p_pelatih_id,
      p_tanggal, p_nomor_sesi, p_kategori,
      p_status_hadir, p_catatan, p_dicatat_oleh
    )
    RETURNING id INTO v_absensi_id;

    IF p_status_hadir = 'Hadir' AND p_paket_siswa_id IS NOT NULL THEN
      UPDATE public.paket_siswa
      SET kuota_terpakai = kuota_terpakai + 1
      WHERE id = p_paket_siswa_id;
    END IF;
  END IF;

  RETURN v_absensi_id;
END;
$$;

-- 6.5 kesit_batalkan_absen: Guard Owner/Admin atau Pelatih Pemilik
CREATE OR REPLACE FUNCTION public.kesit_batalkan_absen(p_absensi_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_paket_id UUID;
  v_hadir TEXT;
BEGIN
  -- Guard: hanya Owner/Admin atau Pelatih pemilik siswa
  IF NOT public.kesit_is_admin_or_owner() THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.absensi_siswa a
      JOIN public.siswa s ON s.id = a.siswa_id
      JOIN public.user_profiles up ON up.pelatih_id = s.pelatih_pemilik_id
      WHERE a.id = p_absensi_id AND up.id = auth.uid() AND up.pelatih_id IS NOT NULL
    ) THEN
      RAISE EXCEPTION 'Akses ditolak: absensi siswa ini bukan milik Anda.';
    END IF;
  END IF;

  SELECT paket_siswa_id, status_hadir INTO v_paket_id, v_hadir
  FROM public.absensi_siswa
  WHERE id = p_absensi_id;

  DELETE FROM public.absensi_siswa WHERE id = p_absensi_id;

  IF v_hadir = 'Hadir' AND v_paket_id IS NOT NULL THEN
    UPDATE public.paket_siswa
    SET kuota_terpakai = GREATEST(0, kuota_terpakai - 1)
    WHERE id = v_paket_id;
  END IF;
END;
$$;

-- 6.6 get_dashboard_summary: Masking Keuangan untuk Pelatih, Revoke dari Anon
CREATE OR REPLACE FUNCTION public.get_dashboard_summary()
RETURNS json
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT json_build_object(
    'total_siswa', (SELECT count(*) FROM public.siswa),
    'siswa_aktif', (SELECT count(*) FROM public.siswa WHERE status_siswa = 'Aktif'),
    'siswa_lunas', (
      CASE WHEN public.kesit_is_admin_or_owner() THEN
        (SELECT count(DISTINCT s.id) 
         FROM public.siswa s
         JOIN LATERAL (
           SELECT pb.status_pembayaran FROM public.pembayaran_siswa pb
           WHERE pb.siswa_id = s.id
           ORDER BY pb.created_at DESC LIMIT 1
         ) last_pb ON last_pb.status_pembayaran = 'Lunas')
      ELSE 0 END
    ),
    'siswa_belum_lunas', (
      CASE WHEN public.kesit_is_admin_or_owner() THEN
        (SELECT count(DISTINCT s.id) 
         FROM public.siswa s
         JOIN LATERAL (
           SELECT pb.status_pembayaran FROM public.pembayaran_siswa pb
           WHERE pb.siswa_id = s.id
           ORDER BY pb.created_at DESC LIMIT 1
         ) last_pb ON last_pb.status_pembayaran = 'Belum Lunas')
      ELSE 0 END
    ),
    'total_pelatih', (SELECT count(*) FROM public.pelatih),
    'pelatih_aktif', (SELECT count(*) FROM public.pelatih WHERE status = 'Aktif'),
    'pelatih_training', (SELECT count(*) FROM public.pelatih WHERE status = 'Training'),
    'pelatih_nonaktif', (SELECT count(*) FROM public.pelatih WHERE status = 'Nonaktif'),
    'total_pendapatan', (
      CASE WHEN public.kesit_is_admin_or_owner() THEN
        (SELECT coalesce(sum(nominal_dibayar), 0) FROM public.pembayaran_siswa)
      ELSE 0 END
    ),
    'sisa_piutang', (
      CASE WHEN public.kesit_is_admin_or_owner() THEN
        (SELECT coalesce(sum(sisa_tagihan), 0) FROM public.pembayaran_siswa)
      ELSE 0 END
    )
  );
$$;

-- --------------------------------------------------------
-- 7. CABUT AKSES ANON DAN PUBLIC DARI FUNGSI-FUNGSI SENSITIF
-- --------------------------------------------------------
REVOKE EXECUTE ON FUNCTION public.get_dashboard_summary() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_dashboard_summary() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.kesit_email_dari_username(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.kesit_email_dari_username(TEXT) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.kesit_is_admin_or_owner() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.kesit_is_admin_or_owner() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.kesit_current_role() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.kesit_current_role() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.daftar_siswa_awal FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.daftar_siswa_awal TO authenticated;

REVOKE EXECUTE ON FUNCTION public.kesit_edit_biodata_siswa FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.kesit_edit_biodata_siswa TO authenticated;

REVOKE EXECUTE ON FUNCTION public.kesit_pindah_kelas_siswa FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.kesit_pindah_kelas_siswa TO authenticated;

REVOKE EXECUTE ON FUNCTION public.kesit_absen_siswa(UUID, UUID, UUID, DATE, INTEGER, TEXT, TEXT, TEXT, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.kesit_absen_siswa(UUID, UUID, UUID, DATE, INTEGER, TEXT, TEXT, TEXT, UUID) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.kesit_batalkan_absen(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.kesit_batalkan_absen(UUID) TO authenticated;

-- --------------------------------------------------------
-- 8. VIEW REKAPAN SISWA PELATIH: MASKING NILAI KEUANGAN DI TINGKAT DB
-- --------------------------------------------------------
CREATE OR REPLACE VIEW public.v_rekapan_siswa_pelatih AS
SELECT
  s.id,
  s.id_siswa,
  s.nama_lengkap,
  s.nama_panggilan,
  s.jenis_kelamin,
  s.tempat_lahir,
  s.tanggal_lahir,
  s.nama_wali,
  s.no_hp_wali,
  s.alamat,
  s.status_siswa,
  s.tanggal_daftar,
  pp.nama AS pelatih_pemilik,
  pd.nama AS pelatih_diminta,
  ps.id AS paket_siswa_id,
  ps.lokasi,
  ps.kelas,
  ps.nama_paket,
  0::NUMERIC AS harga_paket,
  0::NUMERIC AS biaya_request_pelatih,
  0::NUMERIC AS diskon,
  0::NUMERIC AS total_tagihan,
  ps.kuota_total,
  ps.kuota_terpakai,
  ps.status_paket,
  NULL::TEXT AS nomor_kuitansi,
  0::NUMERIC AS nominal_dibayar,
  0::NUMERIC AS sisa_tagihan,
  NULL::TEXT AS status_pembayaran,
  NULL::TEXT AS metode_pembayaran,
  NULL::TEXT AS admin_penerima,
  NULL::DATE AS tanggal_transaksi
FROM public.siswa s
LEFT JOIN public.pelatih pp ON pp.id = s.pelatih_pemilik_id
LEFT JOIN public.pelatih pd ON pd.id = s.pelatih_diminta_id
LEFT JOIN LATERAL (
  SELECT * FROM public.paket_siswa ps2
  WHERE ps2.siswa_id = s.id
  ORDER BY ps2.created_at DESC
  LIMIT 1
) ps ON true
WHERE s.pelatih_pemilik_id IN (
  SELECT up.pelatih_id FROM public.user_profiles up WHERE up.id = auth.uid()
);

-- --------------------------------------------------------
-- 9. SET SECURITY INVOKER PADA SEMUA VIEW
-- --------------------------------------------------------
ALTER VIEW public.v_rekapan_siswa SET (security_invoker = true);
ALTER VIEW public.v_rekapan_siswa_pelatih SET (security_invoker = true);
ALTER VIEW public.v_penilaian_pelatih SET (security_invoker = true);
ALTER VIEW public.v_siswa_untuk_absensi SET (security_invoker = true);
ALTER VIEW public.v_absensi_siswa SET (security_invoker = true);

REVOKE ALL ON public.v_rekapan_siswa FROM anon;
REVOKE ALL ON public.v_rekapan_siswa_pelatih FROM anon;
REVOKE ALL ON public.v_penilaian_pelatih FROM anon;
REVOKE ALL ON public.v_siswa_untuk_absensi FROM anon;
REVOKE ALL ON public.v_absensi_siswa FROM anon;

GRANT SELECT ON public.v_rekapan_siswa TO authenticated;
GRANT SELECT ON public.v_rekapan_siswa_pelatih TO authenticated;
GRANT SELECT ON public.v_penilaian_pelatih TO authenticated;
GRANT SELECT ON public.v_siswa_untuk_absensi TO authenticated;
GRANT SELECT ON public.v_absensi_siswa TO authenticated;
