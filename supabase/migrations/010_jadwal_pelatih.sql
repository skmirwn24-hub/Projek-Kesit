-- ========================================================
-- KESIT Management - Jadwal Pelatih Migration
-- ========================================================

-- --------------------------------------------------------
-- TABLE: jadwal_pelatih
-- Data jadwal mengajar pelatih
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.jadwal_pelatih (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pelatih_id UUID NOT NULL REFERENCES public.pelatih(id) ON DELETE CASCADE,
  hari TEXT NOT NULL CHECK (hari IN ('Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu')),
  jam_mulai TEXT NOT NULL,
  tempat TEXT NOT NULL,
  kelas TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger to update 'updated_at' column
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_jadwal_pelatih_updated_at ON public.jadwal_pelatih;
CREATE TRIGGER trg_jadwal_pelatih_updated_at
BEFORE UPDATE ON public.jadwal_pelatih
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();


ALTER TABLE public.jadwal_pelatih ENABLE ROW LEVEL SECURITY;

-- Policy: Semua user yang authenticated bisa melihat (SELECT) semua jadwal
DROP POLICY IF EXISTS "Authenticated users can read jadwal_pelatih" ON public.jadwal_pelatih;
CREATE POLICY "Authenticated users can read jadwal_pelatih"
  ON public.jadwal_pelatih FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Admin & Owner bisa manage (INSERT/UPDATE/DELETE) semua jadwal
DROP POLICY IF EXISTS "Admin and Owner can manage all jadwal_pelatih" ON public.jadwal_pelatih;
CREATE POLICY "Admin and Owner can manage all jadwal_pelatih"
  ON public.jadwal_pelatih FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid() AND up.role IN ('Owner', 'Admin')
    )
  );

-- Policy: Pelatih bisa manage (INSERT/UPDATE/DELETE) jadwalnya sendiri
DROP POLICY IF EXISTS "Pelatih can manage their own jadwal_pelatih" ON public.jadwal_pelatih;
CREATE POLICY "Pelatih can manage their own jadwal_pelatih"
  ON public.jadwal_pelatih FOR ALL
  TO authenticated
  USING (
    pelatih_id = (
      SELECT pelatih_id FROM public.user_profiles 
      WHERE id = auth.uid() AND role = 'Pelatih'
    )
  );

-- VIEW: v_jadwal_pelatih
-- View gabungan dengan nama pelatih
CREATE OR REPLACE VIEW public.v_jadwal_pelatih AS
SELECT
  jp.id,
  jp.pelatih_id,
  p.nama AS nama_pelatih,
  jp.hari,
  jp.jam_mulai,
  jp.tempat,
  jp.kelas,
  jp.created_at,
  jp.updated_at
FROM public.jadwal_pelatih jp
JOIN public.pelatih p ON p.id = jp.pelatih_id;
