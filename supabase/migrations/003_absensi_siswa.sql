-- ========================================================
-- KESIT Management - Fitur Absensi Siswa
-- Migration 003: absensi_siswa table, RLS, indexes, functions, views
-- ========================================================

-- --------------------------------------------------------
-- TABLE: absensi_siswa
-- Mencatat kehadiran siswa per sesi latihan
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.absensi_siswa (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  siswa_id        UUID NOT NULL REFERENCES public.siswa(id) ON DELETE CASCADE,
  paket_siswa_id  UUID REFERENCES public.paket_siswa(id) ON DELETE SET NULL,
  -- Pelatih yang mengajar sesi ini (bisa pengganti, bisa pemilik)
  pelatih_id      UUID REFERENCES public.pelatih(id) ON DELETE SET NULL,
  tanggal         DATE NOT NULL DEFAULT CURRENT_DATE,
  -- Nomor urut sesi dalam bulan (untuk Reguler & Private); NULL untuk Prestasi
  nomor_sesi      INTEGER CHECK (nomor_sesi IS NULL OR nomor_sesi >= 1),
  kategori        TEXT NOT NULL CHECK (kategori IN ('Reguler', 'Private', 'Prestasi')),
  status_hadir    TEXT NOT NULL DEFAULT 'Hadir' CHECK (status_hadir IN ('Hadir', 'Tidak Hadir')),
  catatan         TEXT,
  dicatat_oleh    UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.absensi_siswa ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------
-- UNIQUE CONSTRAINTS
-- --------------------------------------------------------

-- 1 siswa hanya boleh diabsen 1x per hari per kategori (untuk Prestasi)
CREATE UNIQUE INDEX IF NOT EXISTS uq_absensi_siswa_harian
  ON public.absensi_siswa (siswa_id, tanggal, kategori)
  WHERE nomor_sesi IS NULL;

-- 1 nomor sesi per siswa per bulan per kategori (untuk Reguler & Private)
CREATE UNIQUE INDEX IF NOT EXISTS uq_absensi_sesi_bulanan
  ON public.absensi_siswa (siswa_id, date_trunc('month', tanggal)::DATE, nomor_sesi, kategori)
  WHERE nomor_sesi IS NOT NULL;

-- --------------------------------------------------------
-- PERFORMANCE INDEXES
-- --------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_absensi_pelatih_tanggal
  ON public.absensi_siswa (pelatih_id, tanggal DESC);

CREATE INDEX IF NOT EXISTS idx_absensi_siswa_tanggal
  ON public.absensi_siswa (siswa_id, tanggal DESC);

CREATE INDEX IF NOT EXISTS idx_absensi_tanggal_kategori
  ON public.absensi_siswa (tanggal DESC, kategori);

CREATE INDEX IF NOT EXISTS idx_absensi_paket
  ON public.absensi_siswa (paket_siswa_id);

-- --------------------------------------------------------
-- RLS POLICIES
-- --------------------------------------------------------

-- SELECT: semua authenticated bisa baca (filter dilakukan di view)
DROP POLICY IF EXISTS "Authenticated users can read absensi_siswa" ON public.absensi_siswa;
CREATE POLICY "Authenticated users can read absensi_siswa"
  ON public.absensi_siswa FOR SELECT
  TO authenticated
  USING (true);

-- INSERT: Owner/Admin bisa input semua; Pelatih hanya bisa input untuk siswa miliknya
DROP POLICY IF EXISTS "Pelatih can insert absensi for owned students" ON public.absensi_siswa;
CREATE POLICY "Pelatih can insert absensi for owned students"
  ON public.absensi_siswa FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Owner atau Admin boleh semua
    (SELECT public.kesit_is_admin_or_owner())
    OR
    -- Pelatih hanya untuk siswa yang pelatih_pemilik_id = pelatih_id di user_profiles
    EXISTS (
      SELECT 1
      FROM public.siswa s
      JOIN public.user_profiles up ON up.id = auth.uid()
      WHERE s.id = absensi_siswa.siswa_id
        AND s.pelatih_pemilik_id = up.pelatih_id
        AND up.pelatih_id IS NOT NULL
    )
  );

-- UPDATE: Owner/Admin boleh semua; Pelatih boleh update record siswa miliknya
DROP POLICY IF EXISTS "Pelatih can update absensi for owned students" ON public.absensi_siswa;
CREATE POLICY "Pelatih can update absensi for owned students"
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

-- DELETE: Owner/Admin boleh semua; Pelatih boleh hapus record siswa miliknya
DROP POLICY IF EXISTS "Pelatih can delete absensi for owned students" ON public.absensi_siswa;
CREATE POLICY "Pelatih can delete absensi for owned students"
  ON public.absensi_siswa FOR DELETE
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

-- --------------------------------------------------------
-- FUNCTION: kesit_absen_siswa
-- Insert atau update record absensi + update kuota_terpakai
-- --------------------------------------------------------
CREATE OR REPLACE FUNCTION public.kesit_absen_siswa(
  p_siswa_id        UUID,
  p_paket_siswa_id  UUID,
  p_pelatih_id      UUID,
  p_tanggal         DATE,
  p_nomor_sesi      INTEGER,  -- NULL untuk Prestasi
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
  -- Cek apakah sudah ada record absensi untuk kondisi ini
  IF p_nomor_sesi IS NOT NULL THEN
    -- Reguler/Private: cek by siswa + bulan + nomor_sesi + kategori
    SELECT id, status_hadir INTO v_existing_id, v_existing_hadir
    FROM public.absensi_siswa
    WHERE siswa_id = p_siswa_id
      AND date_trunc('month', tanggal)::DATE = date_trunc('month', p_tanggal)::DATE
      AND nomor_sesi = p_nomor_sesi
      AND kategori = p_kategori
    LIMIT 1;
  ELSE
    -- Prestasi: cek by siswa + tanggal + kategori
    SELECT id, status_hadir INTO v_existing_id, v_existing_hadir
    FROM public.absensi_siswa
    WHERE siswa_id = p_siswa_id
      AND tanggal = p_tanggal
      AND kategori = p_kategori
    LIMIT 1;
  END IF;

  IF v_existing_id IS NOT NULL THEN
    -- Update record yang ada
    UPDATE public.absensi_siswa SET
      pelatih_id    = p_pelatih_id,
      tanggal       = p_tanggal,
      status_hadir  = p_status_hadir,
      catatan       = p_catatan,
      dicatat_oleh  = p_dicatat_oleh
    WHERE id = v_existing_id;

    v_absensi_id := v_existing_id;

    -- Jika status berubah, update kuota
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
    -- Insert record baru
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

    -- Tambah kuota_terpakai jika hadir
    IF p_status_hadir = 'Hadir' AND p_paket_siswa_id IS NOT NULL THEN
      UPDATE public.paket_siswa
      SET kuota_terpakai = kuota_terpakai + 1
      WHERE id = p_paket_siswa_id;
    END IF;
  END IF;

  RETURN v_absensi_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.kesit_absen_siswa(UUID, UUID, UUID, DATE, INTEGER, TEXT, TEXT, TEXT, UUID) TO authenticated;

-- --------------------------------------------------------
-- FUNCTION: kesit_batalkan_absen
-- Hapus record absensi dan kembalikan kuota_terpakai
-- --------------------------------------------------------
CREATE OR REPLACE FUNCTION public.kesit_batalkan_absen(
  p_absensi_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rec RECORD;
BEGIN
  SELECT siswa_id, paket_siswa_id, status_hadir
  INTO v_rec
  FROM public.absensi_siswa
  WHERE id = p_absensi_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Record absensi tidak ditemukan: %', p_absensi_id;
  END IF;

  -- Kembalikan kuota jika hadir
  IF v_rec.status_hadir = 'Hadir' AND v_rec.paket_siswa_id IS NOT NULL THEN
    UPDATE public.paket_siswa
    SET kuota_terpakai = GREATEST(0, kuota_terpakai - 1)
    WHERE id = v_rec.paket_siswa_id;
  END IF;

  DELETE FROM public.absensi_siswa WHERE id = p_absensi_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.kesit_batalkan_absen(UUID) TO authenticated;

-- --------------------------------------------------------
-- VIEW: v_absensi_siswa
-- Join absensi dengan data siswa dan pelatih
-- --------------------------------------------------------
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
  pl.nama AS nama_pelatih_mengajar,
  ab.tanggal,
  ab.nomor_sesi,
  ab.kategori,
  ab.status_hadir,
  ab.catatan,
  ab.paket_siswa_id,
  ps.kuota_total,
  ps.kuota_terpakai,
  ab.dicatat_oleh,
  ab.created_at
FROM public.absensi_siswa ab
JOIN public.siswa s ON s.id = ab.siswa_id
LEFT JOIN public.pelatih pp ON pp.id = s.pelatih_pemilik_id
LEFT JOIN public.pelatih pl ON pl.id = ab.pelatih_id
LEFT JOIN public.paket_siswa ps ON ps.id = ab.paket_siswa_id;

-- --------------------------------------------------------
-- VIEW: v_siswa_untuk_absensi
-- Data siswa aktif siap diabsen: siswa + paket aktif terbaru
-- Dipakai untuk build daftar absensi per pelatih & kategori
-- --------------------------------------------------------
CREATE OR REPLACE VIEW public.v_siswa_untuk_absensi AS
SELECT
  s.id AS siswa_id,
  s.id_siswa,
  s.nama_lengkap,
  s.nama_panggilan,
  s.pelatih_pemilik_id,
  pp.nama AS pelatih_pemilik,
  ps.id AS paket_siswa_id,
  ps.kelas AS kategori,
  ps.kuota_total,
  ps.kuota_terpakai,
  ps.nama_paket
FROM public.siswa s
LEFT JOIN public.pelatih pp ON pp.id = s.pelatih_pemilik_id
LEFT JOIN LATERAL (
  SELECT *
  FROM public.paket_siswa ps2
  WHERE ps2.siswa_id = s.id
    AND ps2.status_paket = 'Aktif'
  ORDER BY ps2.created_at DESC
  LIMIT 1
) ps ON true
WHERE s.status_siswa = 'Aktif'
  AND ps.id IS NOT NULL;
