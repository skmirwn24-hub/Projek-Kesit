-- ========================================================
-- KESIT Management - Migration 011: Manajemen Keuangan & Kas
-- Skema Buku Kas, Soft Delete Audit, Pembayaran SPP Lapangan,
-- Pengaturan & Pencairan Honor Pelatih per Anak Hadir.
-- ========================================================

-- --------------------------------------------------------
-- 1. PERLUASAN TABEL pembayaran_siswa
-- --------------------------------------------------------
ALTER TABLE public.pembayaran_siswa
  ADD COLUMN IF NOT EXISTS penerima_pelatih_id UUID REFERENCES public.pelatih(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS jalur_penerimaan TEXT NOT NULL DEFAULT 'Admin / Kasir'
    CHECK (jalur_penerimaan IN ('Admin / Kasir', 'Titip Pelatih')),
  ADD COLUMN IF NOT EXISTS catatan TEXT;

-- Update RLS pembayaran_siswa: Pelatih boleh membaca pembayaran siswa binaannya
DROP POLICY IF EXISTS "Only Owner and Admin can read pembayaran_siswa" ON public.pembayaran_siswa;
DROP POLICY IF EXISTS "Owner, Admin, or Coach for own students can read pembayaran_siswa" ON public.pembayaran_siswa;

CREATE POLICY "Owner, Admin, or Coach for own students can read pembayaran_siswa"
  ON public.pembayaran_siswa FOR SELECT
  TO authenticated
  USING (
    (SELECT public.kesit_is_admin_or_owner())
    OR
    EXISTS (
      SELECT 1 FROM public.siswa s
      JOIN public.user_profiles up ON up.id = auth.uid()
      WHERE s.id = pembayaran_siswa.siswa_id
        AND up.role = 'Pelatih'
        AND s.pelatih_pemilik_id = up.pelatih_id
        AND up.pelatih_id IS NOT NULL
    )
  );

-- Pelatih boleh INSERT pembayaran HANYA untuk siswa binaannya sendiri
DROP POLICY IF EXISTS "Owner, Admin, or Coach for own students can insert pembayaran_siswa" ON public.pembayaran_siswa;

CREATE POLICY "Owner, Admin, or Coach for own students can insert pembayaran_siswa"
  ON public.pembayaran_siswa FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT public.kesit_is_admin_or_owner())
    OR
    EXISTS (
      SELECT 1 FROM public.siswa s
      JOIN public.user_profiles up ON up.id = auth.uid()
      WHERE s.id = pembayaran_siswa.siswa_id
        AND up.role = 'Pelatih'
        AND s.pelatih_pemilik_id = up.pelatih_id
        AND up.pelatih_id IS NOT NULL
    )
  );


-- --------------------------------------------------------
-- 2. TABEL: kas_transaksi (Buku Kas Operasional dengan Soft Delete)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.kas_transaksi (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nomor_transaksi TEXT UNIQUE NOT NULL,
  tanggal_transaksi DATE NOT NULL DEFAULT CURRENT_DATE,
  jenis_transaksi TEXT NOT NULL CHECK (jenis_transaksi IN ('Masuk', 'Keluar')),
  kategori TEXT NOT NULL,
  nominal NUMERIC(14, 2) NOT NULL CHECK (nominal > 0),
  lokasi TEXT,
  keterangan TEXT,
  metode_pembayaran TEXT NOT NULL DEFAULT 'Tunai',
  dibuat_oleh TEXT NOT NULL,
  pembayaran_siswa_id UUID REFERENCES public.pembayaran_siswa(id) ON DELETE SET NULL,
  
  -- KOLOM SOFT DELETE & AUDIT TRAIL
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  deleted_by TEXT,
  alasan_hapus TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indeks aktif untuk kalkulasi saldo & performa query harian
CREATE INDEX IF NOT EXISTS idx_kas_transaksi_active 
  ON public.kas_transaksi(tanggal_transaksi DESC, created_at DESC)
  WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_kas_transaksi_deleted 
  ON public.kas_transaksi(deleted_at DESC)
  WHERE is_deleted = TRUE;

-- Trigger updated_at
DROP TRIGGER IF EXISTS trg_kas_transaksi_updated_at ON public.kas_transaksi;
CREATE TRIGGER trg_kas_transaksi_updated_at
BEFORE UPDATE ON public.kas_transaksi
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- RLS: kas_transaksi
ALTER TABLE public.kas_transaksi ENABLE ROW LEVEL SECURITY;

-- SELECT & INSERT: Hanya Owner dan Admin (Pelatih sama sekali tidak bisa membaca kas klub)
DROP POLICY IF EXISTS "Owner and Admin can view kas_transaksi" ON public.kas_transaksi;
CREATE POLICY "Owner and Admin can view kas_transaksi"
  ON public.kas_transaksi FOR SELECT
  TO authenticated
  USING ((SELECT public.kesit_is_admin_or_owner()));

DROP POLICY IF EXISTS "Owner and Admin can insert kas_transaksi" ON public.kas_transaksi;
CREATE POLICY "Owner and Admin can insert kas_transaksi"
  ON public.kas_transaksi FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT public.kesit_is_admin_or_owner()));

-- UPDATE (Soft Delete): Hanya Owner
DROP POLICY IF EXISTS "Only Owner can update kas_transaksi" ON public.kas_transaksi;
CREATE POLICY "Only Owner can update kas_transaksi"
  ON public.kas_transaksi FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.id = auth.uid() AND up.role = 'Owner')
  );

-- ZERO HARD DELETE: Revoke hard delete dari semua role
REVOKE DELETE ON public.kas_transaksi FROM authenticated, anon;


-- --------------------------------------------------------
-- 3. TABEL: pengaturan_honor_pelatih
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.pengaturan_honor_pelatih (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pelatih_id UUID REFERENCES public.pelatih(id) ON DELETE CASCADE,
  kategori_kelas TEXT NOT NULL DEFAULT 'Semua' CHECK (kategori_kelas IN ('Semua', 'Reguler', 'Private', 'Prestasi')),
  tarif_per_anak NUMERIC(12, 2) NOT NULL DEFAULT 15000 CHECK (tarif_per_anak >= 0),
  keterangan TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (pelatih_id, kategori_kelas)
);

DROP TRIGGER IF EXISTS trg_pengaturan_honor_updated_at ON public.pengaturan_honor_pelatih;
CREATE TRIGGER trg_pengaturan_honor_updated_at
BEFORE UPDATE ON public.pengaturan_honor_pelatih
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.pengaturan_honor_pelatih ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owner and Admin can view pengaturan_honor" ON public.pengaturan_honor_pelatih;
CREATE POLICY "Owner and Admin can view pengaturan_honor"
  ON public.pengaturan_honor_pelatih FOR SELECT
  TO authenticated
  USING ((SELECT public.kesit_is_admin_or_owner()));

DROP POLICY IF EXISTS "Only Owner can manage pengaturan_honor" ON public.pengaturan_honor_pelatih;
CREATE POLICY "Only Owner can manage pengaturan_honor"
  ON public.pengaturan_honor_pelatih FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.id = auth.uid() AND up.role = 'Owner')
  );


-- --------------------------------------------------------
-- 4. TABEL: pencairan_honor_pelatih
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.pencairan_honor_pelatih (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nomor_slip TEXT UNIQUE NOT NULL,
  pelatih_id UUID NOT NULL REFERENCES public.pelatih(id) ON DELETE CASCADE,
  periode_bulan DATE NOT NULL,
  total_siswa_diajar INT NOT NULL DEFAULT 0,
  tarif_dasar NUMERIC(12, 2) NOT NULL DEFAULT 0,
  nominal_kalkulasi NUMERIC(12, 2) NOT NULL DEFAULT 0,
  nominal_penyesuaian NUMERIC(12, 2) NOT NULL DEFAULT 0,
  nominal_final NUMERIC(12, 2) NOT NULL DEFAULT 0,
  catatan TEXT,
  status TEXT NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Disetujui', 'Dicairkan')),
  disetujui_oleh TEXT,
  kas_transaksi_id UUID REFERENCES public.kas_transaksi(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_pencairan_honor_updated_at ON public.pencairan_honor_pelatih;
CREATE TRIGGER trg_pencairan_honor_updated_at
BEFORE UPDATE ON public.pencairan_honor_pelatih
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.pencairan_honor_pelatih ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owner and Admin can view pencairan_honor" ON public.pencairan_honor_pelatih;
CREATE POLICY "Owner and Admin can view pencairan_honor"
  ON public.pencairan_honor_pelatih FOR SELECT
  TO authenticated
  USING ((SELECT public.kesit_is_admin_or_owner()));

DROP POLICY IF EXISTS "Only Owner can manage pencairan_honor" ON public.pencairan_honor_pelatih;
CREATE POLICY "Only Owner can manage pencairan_honor"
  ON public.pencairan_honor_pelatih FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.id = auth.uid() AND up.role = 'Owner')
  );


-- --------------------------------------------------------
-- 5. FUNCTION: Pencatatan Pembayaran SPP Atomik & Buku Kas
-- --------------------------------------------------------
CREATE OR REPLACE FUNCTION public.kesit_bayar_spp_siswa(
  p_siswa_id UUID,
  p_nominal NUMERIC,
  p_metode TEXT,
  p_tanggal DATE,
  p_jalur TEXT,
  p_penerima_pelatih_id UUID,
  p_admin_penerima TEXT,
  p_catatan TEXT DEFAULT ''
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_paket_id UUID;
  v_nama_siswa TEXT;
  v_nama_paket TEXT;
  v_kelas TEXT;
  v_lokasi TEXT;
  v_total_tagihan NUMERIC;
  v_sudah_dibayar NUMERIC;
  v_sisa_tagihan_baru NUMERIC;
  v_status_baru TEXT;
  v_nomor_kw TEXT;
  v_nomor_kas TEXT;
  v_pembayaran_id UUID;
  v_kas_id UUID;
  v_caller_role TEXT;
  v_caller_pelatih_id UUID;
BEGIN
  -- Validasi role pemanggil
  SELECT up.role, up.pelatih_id INTO v_caller_role, v_caller_pelatih_id
  FROM public.user_profiles up
  WHERE up.id = auth.uid();

  IF v_caller_role IS NULL THEN
    RAISE EXCEPTION 'Akses ditolak: sesi tidak valid.';
  END IF;

  -- Jika Pelatih, pastikan siswa adalah binaannya
  IF v_caller_role = 'Pelatih' THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.siswa s 
      WHERE s.id = p_siswa_id AND s.pelatih_pemilik_id = v_caller_pelatih_id
    ) THEN
      RAISE EXCEPTION 'Akses ditolak: Pelatih hanya dapat menerima pembayaran dari siswa binaannya sendiri.';
    END IF;
  END IF;

  -- Ambil data siswa & paket aktif
  SELECT s.nama_lengkap, ps.id, ps.nama_paket, ps.kelas, ps.lokasi, ps.total_tagihan
  INTO v_nama_siswa, v_paket_id, v_nama_paket, v_kelas, v_lokasi, v_total_tagihan
  FROM public.siswa s
  JOIN public.paket_siswa ps ON ps.siswa_id = s.id
  WHERE s.id = p_siswa_id
  ORDER BY ps.created_at DESC
  LIMIT 1;

  IF v_paket_id IS NULL THEN
    RAISE EXCEPTION 'Data paket siswa tidak ditemukan.';
  END IF;

  -- Hitung akumulasi pembayaran yang sudah ada
  SELECT COALESCE(SUM(nominal_dibayar), 0)
  INTO v_sudah_dibayar
  FROM public.pembayaran_siswa
  WHERE siswa_id = p_siswa_id AND paket_siswa_id = v_paket_id;

  v_sisa_tagihan_baru := GREATEST(0, v_total_tagihan - (v_sudah_dibayar + p_nominal));
  IF v_sisa_tagihan_baru <= 0 THEN
    v_status_baru := 'Lunas';
  ELSE
    v_status_baru := 'Belum Lunas';
  END IF;

  -- Generate nomor kuitansi & nomor transaksi kas
  v_nomor_kw := 'KW-' || TO_CHAR(p_tanggal, 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 9000 + 1000)::TEXT, 4, '0');
  v_nomor_kas := 'KM-' || TO_CHAR(p_tanggal, 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 9000 + 1000)::TEXT, 4, '0');

  -- 1. Insert ke pembayaran_siswa
  INSERT INTO public.pembayaran_siswa (
    siswa_id,
    paket_siswa_id,
    nomor_kuitansi,
    nominal_dibayar,
    sisa_tagihan,
    status_pembayaran,
    metode_pembayaran,
    admin_penerima,
    tanggal_transaksi,
    harga_paket,
    biaya_request_pelatih,
    diskon,
    total_tagihan,
    penerima_pelatih_id,
    jalur_penerimaan,
    catatan
  ) VALUES (
    p_siswa_id,
    v_paket_id,
    v_nomor_kw,
    p_nominal,
    v_sisa_tagihan_baru,
    v_status_baru,
    p_metode,
    p_admin_penerima,
    p_tanggal,
    0, 0, 0,
    v_total_tagihan,
    p_penerima_pelatih_id,
    p_jalur,
    p_catatan
  ) RETURNING id INTO v_pembayaran_id;

  -- 2. Insert ke kas_transaksi sebagai Kas Masuk
  INSERT INTO public.kas_transaksi (
    nomor_transaksi,
    tanggal_transaksi,
    jenis_transaksi,
    kategori,
    nominal,
    lokasi,
    keterangan,
    metode_pembayaran,
    dibuat_oleh,
    pembayaran_siswa_id
  ) VALUES (
    v_nomor_kas,
    p_tanggal,
    'Masuk',
    'SPP Siswa',
    p_nominal,
    v_lokasi,
    'Pembayaran SPP: ' || v_nama_siswa || ' (' || v_kelas || ' - ' || v_nama_paket || ') [' || v_nomor_kw || ']',
    p_metode,
    p_admin_penerima,
    v_pembayaran_id
  ) RETURNING id INTO v_kas_id;

  RETURN jsonb_build_object(
    'success', true,
    'pembayaran_id', v_pembayaran_id,
    'kas_transaksi_id', v_kas_id,
    'nomor_kuitansi', v_nomor_kw,
    'nomor_transaksi', v_nomor_kas,
    'sisa_tagihan', v_sisa_tagihan_baru,
    'status_pembayaran', v_status_baru,
    'nama_siswa', v_nama_siswa,
    'kelas', v_kelas,
    'nama_paket', v_nama_paket,
    'lokasi', v_lokasi
  );
END;
$$;

-- --------------------------------------------------------
-- 6. FUNCTION: Soft Delete Kas Transaksi (Khusus Owner)
-- --------------------------------------------------------
CREATE OR REPLACE FUNCTION public.kesit_soft_delete_kas_transaksi(
  p_transaksi_id UUID,
  p_alasan TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_caller_role TEXT;
  v_caller_name TEXT;
  v_is_deleted BOOLEAN;
BEGIN
  -- Validasi caller harus Owner
  SELECT up.role, COALESCE(up.nama_tampilan, up.username) INTO v_caller_role, v_caller_name
  FROM public.user_profiles up
  WHERE up.id = auth.uid();

  IF v_caller_role != 'Owner' THEN
    RAISE EXCEPTION 'Akses ditolak: Hanya Owner yang berhak membatalkan/menghapus transaksi kas.';
  END IF;

  IF p_alasan IS NULL OR TRIM(p_alasan) = '' THEN
    RAISE EXCEPTION 'Alasan pembatalan wajib diisi untuk integritas audit keuangan.';
  END IF;

  -- Cek status transaksi
  SELECT is_deleted INTO v_is_deleted
  FROM public.kas_transaksi
  WHERE id = p_transaksi_id;

  IF v_is_deleted IS NULL THEN
    RAISE EXCEPTION 'Transaksi tidak ditemukan.';
  END IF;

  IF v_is_deleted = TRUE THEN
    RAISE EXCEPTION 'Transaksi ini sudah pernah dibatalkan sebelumnya.';
  END IF;

  -- Eksekusi Soft Delete
  UPDATE public.kas_transaksi
  SET is_deleted = TRUE,
      deleted_at = NOW(),
      deleted_by = v_caller_name,
      alasan_hapus = p_alasan
  WHERE id = p_transaksi_id;

  RETURN jsonb_build_object(
    'success', true,
    'id', p_transaksi_id,
    'deleted_by', v_caller_name,
    'alasan_hapus', p_alasan
  );
END;
$$;

-- --------------------------------------------------------
-- 6. PERBARUI VIEW v_rekapan_siswa & v_rekapan_siswa_pelatih
-- Tambahkan s.pelatih_pemilik_id & s.pelatih_diminta_id agar query filter pelatih bekerja presisi
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
  pb.tanggal_transaksi,
  s.pelatih_pemilik_id,
  s.pelatih_diminta_id
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

CREATE OR REPLACE VIEW public.v_rekapan_siswa_pelatih AS
SELECT
  v.*
FROM public.v_rekapan_siswa v
JOIN public.siswa s ON s.id = v.id
WHERE s.pelatih_pemilik_id IN (
  SELECT up.pelatih_id FROM public.user_profiles up WHERE up.id = auth.uid()
);

ALTER VIEW public.v_rekapan_siswa SET (security_invoker = true);
ALTER VIEW public.v_rekapan_siswa_pelatih SET (security_invoker = true);

GRANT SELECT ON public.v_rekapan_siswa TO authenticated;
GRANT SELECT ON public.v_rekapan_siswa_pelatih TO authenticated;

-- --------------------------------------------------------
-- 7. SINKRONISASI / BACKFILL DATA PEMBAYARAN SISWA KE KAS_TRANSAKSI
-- Memastikan seluruh pembayaran SPP terdahulu tercatat di buku kas
-- --------------------------------------------------------
INSERT INTO public.kas_transaksi (
  nomor_transaksi,
  tanggal_transaksi,
  jenis_transaksi,
  kategori,
  nominal,
  lokasi,
  keterangan,
  metode_pembayaran,
  dibuat_oleh,
  pembayaran_siswa_id
)
SELECT
  'KM-' || TO_CHAR(COALESCE(pb.tanggal_transaksi, pb.created_at::date, CURRENT_DATE), 'YYYYMMDD') || '-' || LPAD(ROW_NUMBER() OVER(ORDER BY pb.created_at)::text, 4, '0') AS nomor_transaksi,
  COALESCE(pb.tanggal_transaksi, pb.created_at::date, CURRENT_DATE) AS tanggal_transaksi,
  'Masuk' AS jenis_transaksi,
  'SPP Siswa' AS kategori,
  pb.nominal_dibayar AS nominal,
  COALESCE(ps.lokasi, 'Pusat') AS lokasi,
  'Pembayaran SPP: ' || s.nama_lengkap || ' (' || COALESCE(ps.kelas, '-') || ' - ' || COALESCE(ps.nama_paket, '-') || ') [' || COALESCE(pb.nomor_kuitansi, '-') || ']' AS keterangan,
  COALESCE(pb.metode_pembayaran, 'Tunai') AS metode_pembayaran,
  COALESCE(pb.admin_penerima, 'Admin KESIT') AS dibuat_oleh,
  pb.id AS pembayaran_siswa_id
FROM public.pembayaran_siswa pb
JOIN public.siswa s ON s.id = pb.siswa_id
LEFT JOIN public.paket_siswa ps ON ps.id = pb.paket_siswa_id
WHERE pb.nominal_dibayar > 0
  AND NOT EXISTS (
    SELECT 1 FROM public.kas_transaksi kt WHERE kt.pembayaran_siswa_id = pb.id
  );

-- --------------------------------------------------------
-- 8. TRIGGER OTOMATIS: PEMBAYARAN SISWA -> KAS TRANSAKSI
-- Memastikan setiap pembayaran siswa baru selalu otomatis masuk kas klub
-- --------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trg_sync_pembayaran_siswa_ke_kas()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_nama_siswa TEXT;
  v_kelas TEXT;
  v_nama_paket TEXT;
  v_lokasi TEXT;
  v_nomor_kas TEXT;
BEGIN
  -- Hanya proses jika nominal_dibayar > 0 dan belum ada di kas_transaksi
  IF NEW.nominal_dibayar > 0 THEN
    IF NOT EXISTS (SELECT 1 FROM public.kas_transaksi WHERE pembayaran_siswa_id = NEW.id) THEN
      SELECT s.nama_lengkap, ps.kelas, ps.nama_paket, ps.lokasi
      INTO v_nama_siswa, v_kelas, v_nama_paket, v_lokasi
      FROM public.siswa s
      LEFT JOIN public.paket_siswa ps ON ps.id = NEW.paket_siswa_id
      WHERE s.id = NEW.siswa_id;

      v_nomor_kas := 'KM-' || TO_CHAR(COALESCE(NEW.tanggal_transaksi, CURRENT_DATE), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 9000 + 1000)::TEXT, 4, '0');

      INSERT INTO public.kas_transaksi (
        nomor_transaksi,
        tanggal_transaksi,
        jenis_transaksi,
        kategori,
        nominal,
        lokasi,
        keterangan,
        metode_pembayaran,
        dibuat_oleh,
        pembayaran_siswa_id
      ) VALUES (
        v_nomor_kas,
        COALESCE(NEW.tanggal_transaksi, CURRENT_DATE),
        'Masuk',
        'SPP Siswa',
        NEW.nominal_dibayar,
        COALESCE(v_lokasi, 'Pusat'),
        'Pembayaran SPP: ' || COALESCE(v_nama_siswa, 'Siswa') || ' (' || COALESCE(v_kelas, '-') || ' - ' || COALESCE(v_nama_paket, '-') || ') [' || COALESCE(NEW.nomor_kuitansi, '-') || ']',
        COALESCE(NEW.metode_pembayaran, 'Tunai'),
        COALESCE(NEW.admin_penerima, 'Admin KESIT'),
        NEW.id
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_after_insert_pembayaran_siswa_sync_kas ON public.pembayaran_siswa;
CREATE TRIGGER trg_after_insert_pembayaran_siswa_sync_kas
AFTER INSERT ON public.pembayaran_siswa
FOR EACH ROW
EXECUTE FUNCTION public.trg_sync_pembayaran_siswa_ke_kas();

-- --------------------------------------------------------
-- 9. PERBARUI get_dashboard_summary AGAR KONSISTEN DENGAN KAS KLUB
-- --------------------------------------------------------
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
    'saldo_kas', (
      CASE WHEN public.kesit_is_admin_or_owner() THEN
        (SELECT COALESCE(SUM(CASE WHEN jenis_transaksi = 'Masuk' THEN nominal ELSE -nominal END), 0)
         FROM public.kas_transaksi WHERE is_deleted = false)
      ELSE 0 END
    ),
    'total_kas_masuk', (
      CASE WHEN public.kesit_is_admin_or_owner() THEN
        (SELECT COALESCE(SUM(nominal), 0)
         FROM public.kas_transaksi WHERE jenis_transaksi = 'Masuk' AND is_deleted = false)
      ELSE 0 END
    ),
    'total_kas_keluar', (
      CASE WHEN public.kesit_is_admin_or_owner() THEN
        (SELECT COALESCE(SUM(nominal), 0)
         FROM public.kas_transaksi WHERE jenis_transaksi = 'Keluar' AND is_deleted = false)
      ELSE 0 END
    ),
    'total_pendapatan', (
      CASE WHEN public.kesit_is_admin_or_owner() THEN
        (SELECT COALESCE(SUM(nominal), 0)
         FROM public.kas_transaksi WHERE jenis_transaksi = 'Masuk' AND is_deleted = false)
      ELSE 0 END
    ),
    'sisa_piutang', (
      CASE WHEN public.kesit_is_admin_or_owner() THEN
        (SELECT COALESCE(SUM(sisa_tagihan), 0)
         FROM (
           SELECT DISTINCT ON (s.id) pb.sisa_tagihan
           FROM public.siswa s
           JOIN public.pembayaran_siswa pb ON pb.siswa_id = s.id
           ORDER BY s.id, pb.created_at DESC
         ) sub)
      ELSE 0 END
    )
  );
$$;

GRANT EXECUTE ON FUNCTION public.get_dashboard_summary() TO authenticated;


