-- ========================================================
-- KESIT Management - Migration 005: Full Absensi & Pendaftaran Setup
-- Jalankan file ini di Supabase SQL Editor untuk mengaktifkan seluruh fitur Absensi & Pendaftaran
-- ========================================================

-- 1. TABEL: absensi_siswa
CREATE TABLE IF NOT EXISTS public.absensi_siswa (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  siswa_id UUID NOT NULL REFERENCES public.siswa(id) ON DELETE CASCADE,
  paket_siswa_id UUID REFERENCES public.paket_siswa(id) ON DELETE SET NULL,
  pelatih_id UUID REFERENCES public.pelatih(id) ON DELETE SET NULL,
  tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
  nomor_sesi INTEGER,
  kategori TEXT NOT NULL CHECK (kategori IN ('Reguler', 'Private', 'Prestasi')),
  status_hadir TEXT NOT NULL DEFAULT 'Hadir' CHECK (status_hadir IN ('Hadir', 'Tidak Hadir')),
  catatan TEXT,
  dicatat_oleh UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique indexes
CREATE UNIQUE INDEX IF NOT EXISTS uq_absensi_reguler_private
  ON public.absensi_siswa (siswa_id, (date_trunc('month', tanggal)::DATE), nomor_sesi, kategori)
  WHERE nomor_sesi IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_absensi_prestasi
  ON public.absensi_siswa (siswa_id, tanggal, kategori)
  WHERE nomor_sesi IS NULL;

CREATE INDEX IF NOT EXISTS idx_absensi_siswa_lookup
  ON public.absensi_siswa (siswa_id, tanggal, kategori);

CREATE INDEX IF NOT EXISTS idx_absensi_pelatih_lookup
  ON public.absensi_siswa (pelatih_id, tanggal);

-- RLS
ALTER TABLE public.absensi_siswa ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read absensi_siswa" ON public.absensi_siswa;
CREATE POLICY "Authenticated users can read absensi_siswa"
  ON public.absensi_siswa FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert absensi_siswa" ON public.absensi_siswa;
CREATE POLICY "Authenticated users can insert absensi_siswa"
  ON public.absensi_siswa FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update absensi_siswa" ON public.absensi_siswa;
CREATE POLICY "Authenticated users can update absensi_siswa"
  ON public.absensi_siswa FOR UPDATE
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can delete absensi_siswa" ON public.absensi_siswa;
CREATE POLICY "Authenticated users can delete absensi_siswa"
  ON public.absensi_siswa FOR DELETE
  TO authenticated
  USING (true);

-- 2. VIEW: v_siswa_untuk_absensi
CREATE OR REPLACE VIEW public.v_siswa_untuk_absensi AS
SELECT
  s.id AS siswa_id,
  s.id_siswa,
  s.nama_lengkap,
  s.nama_panggilan,
  s.pelatih_pemilik_id,
  COALESCE(pp.nama, 'Belum Ditentukan') AS pelatih_pemilik,
  COALESCE(ps.id, s.id) AS paket_siswa_id,
  CASE 
    WHEN ps.kelas ILIKE '%Private%' AND ps.kelas NOT ILIKE '%Semi%' THEN 'Private'
    WHEN ps.kelas ILIKE '%Prestasi%' THEN 'Prestasi'
    ELSE 'Reguler'
  END AS kategori,
  COALESCE(ps.kuota_total, 
    CASE 
      WHEN ps.kelas ILIKE '%Private%' THEN 10
      WHEN ps.kelas ILIKE '%Prestasi%' THEN 16
      ELSE 6
    END
  ) AS kuota_total,
  COALESCE(ps.kuota_terpakai, 0) AS kuota_terpakai,
  COALESCE(ps.nama_paket, 'Paket Standar') AS nama_paket
FROM public.siswa s
LEFT JOIN public.pelatih pp ON pp.id = s.pelatih_pemilik_id
LEFT JOIN LATERAL (
  SELECT *
  FROM public.paket_siswa ps2
  WHERE ps2.siswa_id = s.id
  ORDER BY ps2.created_at DESC
  LIMIT 1
) ps ON true
WHERE s.status_siswa = 'Aktif';

-- 3. VIEW: v_absensi_siswa
CREATE OR REPLACE VIEW public.v_absensi_siswa AS
SELECT
  ab.id,
  ab.siswa_id,
  s.id_siswa,
  s.nama_lengkap,
  s.nama_panggilan,
  s.pelatih_pemilik_id,
  pp.nama AS pelatih_pemilik,
  ab.pelatih_id,
  pm.nama AS nama_pelatih_mengajar,
  ab.tanggal,
  ab.nomor_sesi,
  ab.kategori,
  ab.status_hadir,
  ab.catatan,
  ab.paket_siswa_id,
  COALESCE(ps.kuota_total, 6) AS kuota_total,
  COALESCE(ps.kuota_terpakai, 0) AS kuota_terpakai,
  ab.dicatat_oleh,
  ab.created_at
FROM public.absensi_siswa ab
JOIN public.siswa s ON s.id = ab.siswa_id
LEFT JOIN public.pelatih pp ON pp.id = s.pelatih_pemilik_id
LEFT JOIN public.pelatih pm ON pm.id = ab.pelatih_id
LEFT JOIN public.paket_siswa ps ON ps.id = ab.paket_siswa_id;

-- 4. FUNCTION: kesit_absen_siswa
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

GRANT EXECUTE ON FUNCTION public.kesit_absen_siswa TO authenticated;

-- 5. FUNCTION: kesit_batalkan_absen
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

GRANT EXECUTE ON FUNCTION public.kesit_batalkan_absen TO authenticated;

-- 6. FUNCTION: daftar_siswa_awal (Anti-Collision ID Generator)
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

GRANT EXECUTE ON FUNCTION public.daftar_siswa_awal TO authenticated;
