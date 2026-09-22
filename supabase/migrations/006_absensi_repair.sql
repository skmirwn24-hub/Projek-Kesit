-- ========================================================
-- KESIT Management - Migration 006: Repair Absensi Setup
-- Jalankan file ini di Supabase SQL Editor jika tabel/view absensi belum ada.
-- Ini bersifat idempotent: aman dijalankan berulang kali.
-- ========================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABLE: absensi_siswa
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

CREATE UNIQUE INDEX IF NOT EXISTS uq_absensi_reguler_private
  ON public.absensi_siswa (
    siswa_id,
    EXTRACT(YEAR FROM tanggal),
    EXTRACT(MONTH FROM tanggal),
    nomor_sesi,
    kategori
  )
  WHERE nomor_sesi IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_absensi_prestasi
  ON public.absensi_siswa (siswa_id, tanggal, kategori)
  WHERE nomor_sesi IS NULL;

CREATE INDEX IF NOT EXISTS idx_absensi_siswa_lookup
  ON public.absensi_siswa (siswa_id, tanggal, kategori);

CREATE INDEX IF NOT EXISTS idx_absensi_pelatih_lookup
  ON public.absensi_siswa (pelatih_id, tanggal);

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

GRANT EXECUTE ON FUNCTION public.kesit_absen_siswa(UUID, UUID, UUID, DATE, INTEGER, TEXT, TEXT, TEXT, UUID) TO authenticated;

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

GRANT EXECUTE ON FUNCTION public.kesit_batalkan_absen(UUID) TO authenticated;

-- 6. OPTIONAL: ensure auth users can read relevant tables
GRANT SELECT ON public.absensi_siswa TO authenticated;
GRANT SELECT ON public.v_absensi_siswa TO authenticated;
GRANT SELECT ON public.v_siswa_untuk_absensi TO authenticated;
