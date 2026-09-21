-- ========================================================
-- KESIT Management - Database Schema
-- Sinkron 100% dengan Schema Remote Supabase (qqhhmebquplfwqtismqb)
-- ========================================================

-- --------------------------------------------------------
-- EXTENSIONS
-- --------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- --------------------------------------------------------
-- TABLE: user_profiles
-- Profil pengguna yang terhubung ke auth.users
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  nama_tampilan TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'Pelatih' CHECK (role IN ('Owner', 'Admin', 'Pelatih')),
  status_akun TEXT NOT NULL DEFAULT 'Aktif' CHECK (status_akun IN ('Aktif', 'Nonaktif')),
  pelatih_id UUID,
  aktivasi_selesai BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Helper function (SECURITY DEFINER) to bypass RLS and avoid infinite recursion
CREATE OR REPLACE FUNCTION public.kesit_is_admin_or_owner()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role IN ('Owner', 'Admin')
  );
$$;

GRANT EXECUTE ON FUNCTION public.kesit_is_admin_or_owner() TO authenticated;
GRANT EXECUTE ON FUNCTION public.kesit_is_admin_or_owner() TO anon;

DROP POLICY IF EXISTS "Users can read own profile" ON public.user_profiles;
CREATE POLICY "Users can read own profile"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Owners and Admins can read all profiles" ON public.user_profiles;
CREATE POLICY "Owners and Admins can read all profiles"
  ON public.user_profiles FOR SELECT
  USING (public.kesit_is_admin_or_owner());

-- --------------------------------------------------------
-- TABLE: pelatih
-- Data master pelatih
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.pelatih (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nama TEXT NOT NULL,
  no_hp TEXT,
  email TEXT,
  alamat TEXT,
  tanggal_lahir DATE,
  pendidikan TEXT,
  sertifikat TEXT,
  status TEXT NOT NULL DEFAULT 'Aktif' CHECK (status IN ('Aktif', 'Training', 'Nonaktif')),
  tanggal_mulai_training DATE,
  tanggal_berakhir_training DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.pelatih ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read pelatih" ON public.pelatih;
CREATE POLICY "Authenticated users can read pelatih"
  ON public.pelatih FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Owner and Admin can insert pelatih" ON public.pelatih;
CREATE POLICY "Owner and Admin can insert pelatih"
  ON public.pelatih FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid() AND up.role IN ('Owner', 'Admin')
    )
  );

DROP POLICY IF EXISTS "Owner and Admin can update pelatih" ON public.pelatih;
CREATE POLICY "Owner and Admin can update pelatih"
  ON public.pelatih FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid() AND up.role IN ('Owner', 'Admin')
    )
  );

-- --------------------------------------------------------
-- TABLE: siswa
-- Data siswa terdaftar
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.siswa (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_siswa TEXT UNIQUE NOT NULL,
  nama_lengkap TEXT NOT NULL,
  nama_panggilan TEXT,
  jenis_kelamin TEXT CHECK (jenis_kelamin IN ('Laki-laki', 'Perempuan')),
  tempat_lahir TEXT,
  tanggal_lahir DATE,
  nama_wali TEXT,
  no_hp_wali TEXT,
  alamat TEXT,
  pelatih_pemilik_id UUID REFERENCES public.pelatih(id),
  pelatih_diminta_id UUID REFERENCES public.pelatih(id),
  status_siswa TEXT NOT NULL DEFAULT 'Aktif' CHECK (status_siswa IN ('Aktif', 'Nonaktif', 'Cuti')),
  tanggal_daftar DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.siswa ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read siswa" ON public.siswa;
CREATE POLICY "Authenticated users can read siswa"
  ON public.siswa FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Owner and Admin can insert siswa" ON public.siswa;
CREATE POLICY "Owner and Admin can insert siswa"
  ON public.siswa FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid() AND up.role IN ('Owner', 'Admin')
    )
  );

DROP POLICY IF EXISTS "Owner and Admin can update siswa" ON public.siswa;
CREATE POLICY "Owner and Admin can update siswa"
  ON public.siswa FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid() AND up.role IN ('Owner', 'Admin')
    )
  );

-- --------------------------------------------------------
-- TABLE: paket_siswa
-- Data paket renang yang diambil siswa
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.paket_siswa (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  siswa_id UUID NOT NULL REFERENCES public.siswa(id) ON DELETE CASCADE,
  lokasi TEXT,
  kelas TEXT,
  nama_paket TEXT,
  harga_paket NUMERIC NOT NULL DEFAULT 0,
  biaya_request_pelatih NUMERIC NOT NULL DEFAULT 0,
  diskon NUMERIC NOT NULL DEFAULT 0,
  total_tagihan NUMERIC NOT NULL DEFAULT 0,
  kuota_total INTEGER NOT NULL DEFAULT 0,
  kuota_terpakai INTEGER NOT NULL DEFAULT 0,
  status_paket TEXT NOT NULL DEFAULT 'Aktif',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.paket_siswa ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read paket_siswa" ON public.paket_siswa;
CREATE POLICY "Authenticated users can read paket_siswa"
  ON public.paket_siswa FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Owner and Admin can manage paket_siswa" ON public.paket_siswa;
CREATE POLICY "Owner and Admin can manage paket_siswa"
  ON public.paket_siswa FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid() AND up.role IN ('Owner', 'Admin')
    )
  );

-- --------------------------------------------------------
-- TABLE: pembayaran_siswa
-- Data pembayaran transaksi kuitansi siswa
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.pembayaran_siswa (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  siswa_id UUID NOT NULL REFERENCES public.siswa(id) ON DELETE CASCADE,
  paket_siswa_id UUID REFERENCES public.paket_siswa(id) ON DELETE SET NULL,
  nomor_kuitansi TEXT,
  harga_paket NUMERIC NOT NULL DEFAULT 0,
  biaya_request_pelatih NUMERIC NOT NULL DEFAULT 0,
  diskon NUMERIC NOT NULL DEFAULT 0,
  total_tagihan NUMERIC NOT NULL DEFAULT 0,
  nominal_dibayar NUMERIC NOT NULL DEFAULT 0,
  sisa_tagihan NUMERIC NOT NULL DEFAULT 0,
  status_pembayaran TEXT NOT NULL DEFAULT 'Belum Lunas',
  metode_pembayaran TEXT,
  admin_penerima TEXT,
  tanggal_transaksi DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.pembayaran_siswa ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read pembayaran_siswa" ON public.pembayaran_siswa;
CREATE POLICY "Authenticated users can read pembayaran_siswa"
  ON public.pembayaran_siswa FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Owner and Admin can manage pembayaran_siswa" ON public.pembayaran_siswa;
CREATE POLICY "Owner and Admin can manage pembayaran_siswa"
  ON public.pembayaran_siswa FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid() AND up.role IN ('Owner', 'Admin')
    )
  );

-- --------------------------------------------------------
-- TABLE: penilaian_pelatih
-- Evaluasi kinerja dan catatan kedisiplinan/sanksi pelatih
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.penilaian_pelatih (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pelatih_id UUID NOT NULL REFERENCES public.pelatih(id) ON DELETE CASCADE,
  tanggal_penilaian DATE NOT NULL,
  kedisiplinan NUMERIC NOT NULL DEFAULT 0,
  kehadiran NUMERIC NOT NULL DEFAULT 0,
  kualitas_mengajar NUMERIC NOT NULL DEFAULT 0,
  komunikasi NUMERIC NOT NULL DEFAULT 0,
  administrasi_laporan NUMERIC NOT NULL DEFAULT 0,
  catatan TEXT,
  dinilai_oleh TEXT,
  diinput_oleh TEXT,
  kategori_pelanggaran TEXT DEFAULT 'Tidak Ada',
  detail_pelanggaran TEXT,
  jenis_sanksi TEXT DEFAULT 'Tidak Ada',
  tanggal_mulai_sanksi DATE,
  persentase_denda NUMERIC DEFAULT 0,
  nominal_denda NUMERIC DEFAULT 0,
  sesi_tanpa_honor INTEGER DEFAULT 0,
  catatan_sanksi TEXT,
  diputuskan_oleh TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.penilaian_pelatih ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read penilaian_pelatih" ON public.penilaian_pelatih;
CREATE POLICY "Authenticated users can read penilaian_pelatih"
  ON public.penilaian_pelatih FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Owner and Admin can manage penilaian_pelatih" ON public.penilaian_pelatih;
CREATE POLICY "Owner and Admin can manage penilaian_pelatih"
  ON public.penilaian_pelatih FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid() AND up.role IN ('Owner', 'Admin')
    )
  );

-- --------------------------------------------------------
-- TABLE: riwayat_perubahan_siswa
-- Audit log perubahan kelas, paket, atau pelatih siswa
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.riwayat_perubahan_siswa (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  siswa_id UUID NOT NULL REFERENCES public.siswa(id) ON DELETE CASCADE,
  jenis_perubahan TEXT NOT NULL,
  lokasi_lama TEXT,
  kelas_lama TEXT,
  paket_lama TEXT,
  pelatih_pemilik_lama UUID REFERENCES public.pelatih(id),
  lokasi_baru TEXT,
  kelas_baru TEXT,
  paket_baru TEXT,
  pelatih_pemilik_baru UUID REFERENCES public.pelatih(id),
  tanggal_perubahan DATE NOT NULL DEFAULT CURRENT_DATE,
  alasan TEXT,
  diubah_oleh TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.riwayat_perubahan_siswa ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read riwayat" ON public.riwayat_perubahan_siswa;
CREATE POLICY "Authenticated users can read riwayat"
  ON public.riwayat_perubahan_siswa FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Owner and Admin can insert riwayat" ON public.riwayat_perubahan_siswa;
CREATE POLICY "Owner and Admin can insert riwayat"
  ON public.riwayat_perubahan_siswa FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid() AND up.role IN ('Owner', 'Admin')
    )
  );

-- --------------------------------------------------------
-- FUNCTION: kesit_status_sanksi
-- Menghitung status aktif/selesai sanksi pelatih
-- --------------------------------------------------------
CREATE OR REPLACE FUNCTION public.kesit_status_sanksi(p_jenis_sanksi TEXT, p_tanggal_mulai DATE)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_durasi INTEGER := 0;
  v_berakhir DATE;
BEGIN
  IF p_jenis_sanksi IS NULL OR p_jenis_sanksi = 'Tidak Ada' THEN
    RETURN 'Tidak Ada';
  END IF;

  IF p_jenis_sanksi = 'Putus Kerja Sama' THEN
    RETURN 'Permanen';
  END IF;

  IF p_tanggal_mulai IS NULL THEN
    RETURN 'Aktif';
  END IF;

  IF p_jenis_sanksi = 'Teguran' THEN v_durasi := 30;
  ELSIF p_jenis_sanksi = 'SP-1' THEN v_durasi := 90;
  ELSIF p_jenis_sanksi = 'SP-2' THEN v_durasi := 180;
  ELSIF p_jenis_sanksi = 'SP-3' THEN v_durasi := 365;
  END IF;

  v_berakhir := p_tanggal_mulai + (v_durasi || ' days')::INTERVAL;
  IF CURRENT_DATE > v_berakhir THEN
    RETURN 'Selesai';
  ELSE
    RETURN 'Aktif';
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.kesit_status_sanksi(TEXT, DATE) TO authenticated, anon;

-- --------------------------------------------------------
-- VIEW: v_rekapan_siswa
-- View gabungan data siswa, paket aktif, pembayaran, dan pelatih
-- --------------------------------------------------------
CREATE OR REPLACE VIEW public.v_rekapan_siswa AS
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
  ps.harga_paket,
  ps.biaya_request_pelatih,
  ps.diskon,
  ps.total_tagihan,
  ps.kuota_total,
  ps.kuota_terpakai,
  ps.status_paket,
  pb.nomor_kuitansi,
  pb.nominal_dibayar,
  pb.sisa_tagihan,
  pb.status_pembayaran,
  pb.metode_pembayaran,
  pb.admin_penerima,
  pb.tanggal_transaksi
FROM public.siswa s
LEFT JOIN public.pelatih pp ON pp.id = s.pelatih_pemilik_id
LEFT JOIN public.pelatih pd ON pd.id = s.pelatih_diminta_id
LEFT JOIN LATERAL (
  SELECT * FROM public.paket_siswa ps2
  WHERE ps2.siswa_id = s.id
  ORDER BY ps2.created_at DESC
  LIMIT 1
) ps ON true
LEFT JOIN LATERAL (
  SELECT * FROM public.pembayaran_siswa pb2
  WHERE pb2.siswa_id = s.id AND pb2.paket_siswa_id = ps.id
  ORDER BY pb2.created_at DESC
  LIMIT 1
) pb ON true;

-- --------------------------------------------------------
-- VIEW: v_rekapan_siswa_pelatih
-- View terbatas untuk role Pelatih (hanya siswa miliknya)
-- --------------------------------------------------------
CREATE OR REPLACE VIEW public.v_rekapan_siswa_pelatih AS
SELECT
  v.*
FROM public.v_rekapan_siswa v
JOIN public.siswa s ON s.id = v.id
WHERE s.pelatih_pemilik_id IN (
  SELECT up.pelatih_id FROM public.user_profiles up WHERE up.id = auth.uid()
);

-- --------------------------------------------------------
-- VIEW: v_penilaian_pelatih
-- Gabungan penilaian + data pelatih + kalkulasi KKM & sanksi
-- --------------------------------------------------------
CREATE OR REPLACE VIEW public.v_penilaian_pelatih AS
SELECT
  pn.id,
  pn.pelatih_id,
  p.nama AS nama_pelatih,
  p.status AS status_pelatih,
  pn.tanggal_penilaian,
  ROUND((pn.kedisiplinan + pn.kehadiran + pn.kualitas_mengajar + pn.komunikasi + pn.administrasi_laporan) / 5.0, 2) AS nilai_rata_rata,
  4.00 AS kkm,
  CASE
    WHEN ROUND((pn.kedisiplinan + pn.kehadiran + pn.kualitas_mengajar + pn.komunikasi + pn.administrasi_laporan) / 5.0, 2) >= 4.00 THEN 'Mencapai KKM'
    ELSE 'Di Bawah KKM'
  END AS status_kkm,
  pn.kategori_pelanggaran,
  pn.detail_pelanggaran,
  pn.jenis_sanksi,
  pn.tanggal_mulai_sanksi,
  CASE
    WHEN pn.tanggal_mulai_sanksi IS NOT NULL AND pn.jenis_sanksi = 'Teguran' THEN (pn.tanggal_mulai_sanksi + INTERVAL '30 days')::DATE
    WHEN pn.tanggal_mulai_sanksi IS NOT NULL AND pn.jenis_sanksi = 'SP-1' THEN (pn.tanggal_mulai_sanksi + INTERVAL '90 days')::DATE
    WHEN pn.tanggal_mulai_sanksi IS NOT NULL AND pn.jenis_sanksi = 'SP-2' THEN (pn.tanggal_mulai_sanksi + INTERVAL '180 days')::DATE
    WHEN pn.tanggal_mulai_sanksi IS NOT NULL AND pn.jenis_sanksi = 'SP-3' THEN (pn.tanggal_mulai_sanksi + INTERVAL '365 days')::DATE
    ELSE NULL
  END AS tanggal_berakhir_sanksi,
  public.kesit_status_sanksi(pn.jenis_sanksi, pn.tanggal_mulai_sanksi) AS status_sanksi,
  pn.persentase_denda,
  pn.nominal_denda,
  pn.sesi_tanpa_honor,
  pn.catatan,
  pn.catatan_sanksi,
  pn.diinput_oleh,
  pn.created_at
FROM public.penilaian_pelatih pn
JOIN public.pelatih p ON p.id = pn.pelatih_id;

-- --------------------------------------------------------
-- FUNCTION: kesit_current_role
-- Mendapatkan role pengguna aktif dari user_profiles
-- --------------------------------------------------------
CREATE OR REPLACE FUNCTION public.kesit_current_role()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role
  FROM public.user_profiles
  WHERE id = auth.uid();
  RETURN COALESCE(v_role, 'Anonim');
END;
$$;

GRANT EXECUTE ON FUNCTION public.kesit_current_role() TO authenticated;

-- --------------------------------------------------------
-- FUNCTION: kesit_email_dari_username
-- Mencari email auth berdasarkan username di user_profiles
-- --------------------------------------------------------
CREATE OR REPLACE FUNCTION public.kesit_email_dari_username(p_username TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email TEXT;
BEGIN
  SELECT au.email INTO v_email
  FROM public.user_profiles up
  JOIN auth.users au ON au.id = up.id
  WHERE LOWER(up.username) = LOWER(p_username)
    AND up.status_akun = 'Aktif'
    AND up.aktivasi_selesai = TRUE
  LIMIT 1;

  RETURN v_email;
END;
$$;

GRANT EXECUTE ON FUNCTION public.kesit_email_dari_username(TEXT) TO anon, authenticated;

-- --------------------------------------------------------
-- FUNCTION: daftar_siswa_awal
-- Mendaftarkan siswa baru beserta paket dan pembayaran pertamanya
-- --------------------------------------------------------
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
  -- Generate ID siswa (SIS000001, SIS000002, ...)
  SELECT COUNT(*) + 1 INTO v_count FROM public.siswa;
  v_id_siswa := 'SIS' || LPAD(v_count::TEXT, 6, '0');

  -- Insert siswa
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

  -- Insert paket siswa
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

  -- Generate Kuitansi
  v_kuitansi := 'KW-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(v_count::TEXT, 4, '0');

  -- Insert pembayaran siswa
  INSERT INTO public.pembayaran_siswa (
    siswa_id, paket_siswa_id, nomor_kuitansi, nominal_dibayar,
    sisa_tagihan, status_pembayaran, metode_pembayaran, admin_penerima,
    tanggal_transaksi
  ) VALUES (
    v_siswa_id, v_paket_id, v_kuitansi, p_nominal_dibayar,
    p_sisa_tagihan, p_status_pembayaran, p_metode_pembayaran, p_admin_penerima,
    p_tanggal_daftar
  );

  -- Log riwayat perubahan siswa
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

GRANT EXECUTE ON FUNCTION public.daftar_siswa_awal TO authenticated;

-- --------------------------------------------------------
-- FUNCTION: kesit_edit_biodata_siswa
-- Update data biodata siswa
-- --------------------------------------------------------
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

GRANT EXECUTE ON FUNCTION public.kesit_edit_biodata_siswa TO authenticated;

-- --------------------------------------------------------
-- FUNCTION: kesit_pindah_kelas_siswa
-- Pindah kelas/paket siswa dan catat riwayat
-- --------------------------------------------------------
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
  -- Ambil data lama untuk log
  SELECT lokasi, kelas, nama_paket INTO v_old
  FROM public.paket_siswa WHERE id = p_paket_siswa_id;

  -- Nonaktifkan paket lama
  UPDATE public.paket_siswa SET status_paket = 'Nonaktif'
  WHERE id = p_paket_siswa_id;

  -- Buat paket baru
  INSERT INTO public.paket_siswa (
    siswa_id, lokasi, kelas, nama_paket, harga_paket,
    biaya_request_pelatih, diskon, total_tagihan, kuota_total,
    kuota_terpakai, status_paket
  ) VALUES (
    p_siswa_id, p_lokasi_baru, p_kelas_baru, p_paket_baru,
    p_harga_paket_baru, p_biaya_request_pelatih_baru, p_diskon_baru,
    p_total_tagihan_baru, p_kuota_total_baru, 0, 'Aktif'
  );

  -- Update pelatih di siswa
  UPDATE public.siswa SET
    pelatih_pemilik_id = p_pelatih_pemilik_baru,
    pelatih_diminta_id = p_pelatih_diminta_baru
  WHERE id = p_siswa_id;

  -- Log riwayat perubahan
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

GRANT EXECUTE ON FUNCTION public.kesit_pindah_kelas_siswa TO authenticated;
