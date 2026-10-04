-- ========================================================
-- KESIT Management - Migration 012: Laporan & Rapor Perkembangan Siswa
-- Modul Evaluasi Teknik Renang 4 Gaya, Kenaikan Level & Sertifikasi
-- ========================================================

-- --------------------------------------------------------
-- 1. TABEL: laporan_siswa
-- Data master rapor evaluasi berkala siswa
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.laporan_siswa (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nomor_rapor TEXT UNIQUE NOT NULL,
  siswa_id UUID NOT NULL REFERENCES public.siswa(id) ON DELETE CASCADE,
  pelatih_id UUID REFERENCES public.pelatih(id) ON DELETE SET NULL,
  periode_bulan INTEGER NOT NULL CHECK (periode_bulan BETWEEN 1 AND 12),
  periode_tahun INTEGER NOT NULL CHECK (periode_tahun >= 2020),
  tanggal_penilaian DATE NOT NULL DEFAULT CURRENT_DATE,
  level_saat_ini TEXT NOT NULL DEFAULT 'Pemula',
  rekomendasi_level TEXT,
  status_kenaikan TEXT NOT NULL DEFAULT 'Bertahan' CHECK (status_kenaikan IN ('Bertahan', 'Naik Level', 'Lulus Tingkat')),
  status_dokumen TEXT NOT NULL DEFAULT 'Draft' CHECK (status_dokumen IN ('Draft', 'Final', 'Terkirim')),
  nilai_rata_rata NUMERIC(4, 2) NOT NULL DEFAULT 0,
  catatan_umum TEXT,
  catatan_pelatih TEXT,
  catatan_head_coach TEXT,
  disetujui_oleh TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger updated_at
DROP TRIGGER IF EXISTS trg_laporan_siswa_updated_at ON public.laporan_siswa;
CREATE TRIGGER trg_laporan_siswa_updated_at
BEFORE UPDATE ON public.laporan_siswa
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- --------------------------------------------------------
-- 2. TABEL: detail_evaluasi_renang
-- Rincian evaluasi teknik renang per gaya/kompetensi
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.detail_evaluasi_renang (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  laporan_id UUID NOT NULL REFERENCES public.laporan_siswa(id) ON DELETE CASCADE,
  kategori_teknik TEXT NOT NULL CHECK (
    kategori_teknik IN (
      'Pengenalan Air',
      'Gaya Dada',
      'Gaya Bebas',
      'Gaya Punggung',
      'Gaya Kupu-Kupu',
      'Daya Tahan & Waktu'
    )
  ),
  skor_posisi_tubuh NUMERIC(3, 1) NOT NULL DEFAULT 0 CHECK (skor_posisi_tubuh BETWEEN 0 AND 5),
  skor_gerakan_kaki NUMERIC(3, 1) NOT NULL DEFAULT 0 CHECK (skor_gerakan_kaki BETWEEN 0 AND 5),
  skor_gerakan_tangan NUMERIC(3, 1) NOT NULL DEFAULT 0 CHECK (skor_gerakan_tangan BETWEEN 0 AND 5),
  skor_pernapasan NUMERIC(3, 1) NOT NULL DEFAULT 0 CHECK (skor_pernapasan BETWEEN 0 AND 5),
  skor_koordinasi NUMERIC(3, 1) NOT NULL DEFAULT 0 CHECK (skor_koordinasi BETWEEN 0 AND 5),
  skor_akhir_gaya NUMERIC(3, 1) NOT NULL DEFAULT 0,
  jarak_tempuh_meter INTEGER NOT NULL DEFAULT 0,
  catatan_waktu_detik NUMERIC(6, 2) NOT NULL DEFAULT 0,
  keterangan TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --------------------------------------------------------
-- 3. TABEL: sertifikat_siswa
-- Data sertifikat kelulusan / kenaikan tingkat resmi
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sertifikat_siswa (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  laporan_id UUID REFERENCES public.laporan_siswa(id) ON DELETE SET NULL,
  siswa_id UUID NOT NULL REFERENCES public.siswa(id) ON DELETE CASCADE,
  nomor_sertifikat TEXT UNIQUE NOT NULL,
  level_kelulusan TEXT NOT NULL,
  tanggal_terbit DATE NOT NULL DEFAULT CURRENT_DATE,
  penandatangan_nama TEXT NOT NULL DEFAULT 'Head Coach KESIT',
  penandatangan_jabatan TEXT NOT NULL DEFAULT 'Kepala Pelatih',
  predikat TEXT NOT NULL DEFAULT 'Sangat Baik',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --------------------------------------------------------
-- 4. INDEKS UNTUK PERFORMA QUERY
-- --------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_laporan_siswa_siswa_id ON public.laporan_siswa(siswa_id);
CREATE INDEX IF NOT EXISTS idx_laporan_siswa_pelatih_id ON public.laporan_siswa(pelatih_id);
CREATE INDEX IF NOT EXISTS idx_laporan_siswa_periode ON public.laporan_siswa(periode_tahun DESC, periode_bulan DESC);
CREATE INDEX IF NOT EXISTS idx_laporan_siswa_status ON public.laporan_siswa(status_dokumen);
CREATE INDEX IF NOT EXISTS idx_detail_evaluasi_laporan_id ON public.detail_evaluasi_renang(laporan_id);
CREATE INDEX IF NOT EXISTS idx_sertifikat_siswa_id ON public.sertifikat_siswa(siswa_id);

-- --------------------------------------------------------
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- --------------------------------------------------------
ALTER TABLE public.laporan_siswa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detail_evaluasi_renang ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sertifikat_siswa ENABLE ROW LEVEL SECURITY;

-- Policy laporan_siswa: SELECT
DROP POLICY IF EXISTS "Authenticated users can read laporan_siswa" ON public.laporan_siswa;
CREATE POLICY "Authenticated users can read laporan_siswa"
  ON public.laporan_siswa FOR SELECT
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
  );

-- Policy laporan_siswa: INSERT
DROP POLICY IF EXISTS "Owner, Admin, or Coach can insert laporan_siswa" ON public.laporan_siswa;
CREATE POLICY "Owner, Admin, or Coach can insert laporan_siswa"
  ON public.laporan_siswa FOR INSERT
  TO authenticated
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

-- Policy laporan_siswa: UPDATE
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
  );

-- Policy laporan_siswa: DELETE
DROP POLICY IF EXISTS "Only Owner and Admin can delete laporan_siswa" ON public.laporan_siswa;
CREATE POLICY "Only Owner and Admin can delete laporan_siswa"
  ON public.laporan_siswa FOR DELETE
  TO authenticated
  USING ((SELECT public.kesit_is_admin_or_owner()));

-- Policy detail_evaluasi_renang: ALL
DROP POLICY IF EXISTS "Authenticated users can read detail_evaluasi" ON public.detail_evaluasi_renang;
CREATE POLICY "Authenticated users can read detail_evaluasi"
  ON public.detail_evaluasi_renang FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Manage detail_evaluasi via parent policy" ON public.detail_evaluasi_renang;
CREATE POLICY "Manage detail_evaluasi via parent policy"
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
  );

-- Policy sertifikat_siswa: SELECT (Semua yang login bisa baca)
DROP POLICY IF EXISTS "Authenticated users can read sertifikat_siswa" ON public.sertifikat_siswa;
CREATE POLICY "Authenticated users can read sertifikat_siswa"
  ON public.sertifikat_siswa FOR SELECT
  TO authenticated
  USING (true);

-- Policy sertifikat_siswa: MANAGE (Owner & Admin)
DROP POLICY IF EXISTS "Owner and Admin can manage sertifikat_siswa" ON public.sertifikat_siswa;
CREATE POLICY "Owner and Admin can manage sertifikat_siswa"
  ON public.sertifikat_siswa FOR ALL
  TO authenticated
  USING ((SELECT public.kesit_is_admin_or_owner()));

-- --------------------------------------------------------
-- 6. VIEWS
-- --------------------------------------------------------
CREATE OR REPLACE VIEW public.v_laporan_siswa AS
SELECT
  l.id,
  l.nomor_rapor,
  l.siswa_id,
  s.id_siswa,
  s.nama_lengkap AS nama_siswa,
  s.nama_panggilan,
  s.jenis_kelamin,
  s.nama_wali,
  s.no_hp_wali,
  s.status_siswa,
  l.pelatih_id,
  COALESCE(p.nama, 'Belum Ditentukan') AS nama_pelatih,
  ps.lokasi,
  ps.kelas,
  ps.nama_paket,
  l.periode_bulan,
  l.periode_tahun,
  l.tanggal_penilaian,
  l.level_saat_ini,
  l.rekomendasi_level,
  l.status_kenaikan,
  l.status_dokumen,
  l.nilai_rata_rata,
  l.catatan_umum,
  l.catatan_pelatih,
  l.catatan_head_coach,
  l.disetujui_oleh,
  cert.id AS sertifikat_id,
  cert.nomor_sertifikat,
  cert.tanggal_terbit AS tanggal_terbit_sertifikat,
  cert.predikat AS predikat_sertifikat,
  l.created_at,
  l.updated_at
FROM public.laporan_siswa l
JOIN public.siswa s ON s.id = l.siswa_id
LEFT JOIN public.pelatih p ON p.id = l.pelatih_id
LEFT JOIN LATERAL (
  SELECT * FROM public.paket_siswa ps2
  WHERE ps2.siswa_id = s.id
  ORDER BY ps2.created_at DESC
  LIMIT 1
) ps ON true
LEFT JOIN public.sertifikat_siswa cert ON cert.laporan_id = l.id;

CREATE OR REPLACE VIEW public.v_laporan_siswa_pelatih AS
SELECT v.*
FROM public.v_laporan_siswa v
JOIN public.siswa s ON s.id = v.siswa_id
WHERE s.pelatih_pemilik_id IN (
  SELECT up.pelatih_id FROM public.user_profiles up WHERE up.id = auth.uid()
) OR v.pelatih_id IN (
  SELECT up.pelatih_id FROM public.user_profiles up WHERE up.id = auth.uid()
);

-- --------------------------------------------------------
-- 7. FUNCTION: kesit_simpan_laporan_siswa (Atomik)
-- --------------------------------------------------------
CREATE OR REPLACE FUNCTION public.kesit_simpan_laporan_siswa(
  p_laporan_id UUID,
  p_siswa_id UUID,
  p_pelatih_id UUID,
  p_periode_bulan INTEGER,
  p_periode_tahun INTEGER,
  p_tanggal_penilaian DATE,
  p_level_saat_ini TEXT,
  p_rekomendasi_level TEXT,
  p_status_kenaikan TEXT,
  p_status_dokumen TEXT,
  p_catatan_umum TEXT,
  p_catatan_pelatih TEXT,
  p_catatan_head_coach TEXT,
  p_detail_evaluasi JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_role TEXT;
  v_user_pelatih_id UUID;
  v_user_name TEXT;
  v_laporan_id UUID := p_laporan_id;
  v_nomor_rapor TEXT;
  v_nomor_sertifikat TEXT;
  v_sertifikat_id UUID;
  v_item JSONB;
  v_total_skor NUMERIC := 0;
  v_count_item INTEGER := 0;
  v_rata_rata NUMERIC(4, 2) := 0;
  v_skor_akhir_item NUMERIC(3, 1);
  v_predikat TEXT;
  v_counter INTEGER;
BEGIN
  -- 1. Validasi Auth Pemanggil
  SELECT up.role, up.pelatih_id, COALESCE(up.nama_tampilan, up.username)
  INTO v_role, v_user_pelatih_id, v_user_name
  FROM public.user_profiles up
  WHERE up.id = auth.uid();

  IF v_role IS NULL THEN
    RAISE EXCEPTION 'Akses ditolak: sesi login tidak valid.';
  END IF;

  -- 2. Hak akses pelatih
  IF v_role = 'Pelatih' THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.siswa s
      WHERE s.id = p_siswa_id AND (s.pelatih_pemilik_id = v_user_pelatih_id OR p_pelatih_id = v_user_pelatih_id)
    ) THEN
      RAISE EXCEPTION 'Akses ditolak: Anda hanya dapat membuat atau mengubah rapor siswa bimbingan sendiri.';
    END IF;
  END IF;

  -- 3. Hitung rata-rata dari detail evaluasi
  IF jsonb_array_length(p_detail_evaluasi) > 0 THEN
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_detail_evaluasi)
    LOOP
      v_skor_akhir_item := ROUND((
        COALESCE((v_item->>'skor_posisi_tubuh')::NUMERIC, 0) +
        COALESCE((v_item->>'skor_gerakan_kaki')::NUMERIC, 0) +
        COALESCE((v_item->>'skor_gerakan_tangan')::NUMERIC, 0) +
        COALESCE((v_item->>'skor_pernapasan')::NUMERIC, 0) +
        COALESCE((v_item->>'skor_koordinasi')::NUMERIC, 0)
      ) / 5.0, 1);

      v_total_skor := v_total_skor + v_skor_akhir_item;
      v_count_item := v_count_item + 1;
    END LOOP;
  END IF;

  IF v_count_item > 0 THEN
    v_rata_rata := ROUND(v_total_skor / v_count_item::NUMERIC, 2);
  ELSE
    v_rata_rata := 0;
  END IF;

  -- 4. INSERT atau UPDATE Master Laporan
  IF v_laporan_id IS NULL THEN
    -- Generate nomor rapor: RPR-YYYYMM-XXXX
    SELECT COUNT(*) + 1 INTO v_counter
    FROM public.laporan_siswa
    WHERE periode_tahun = p_periode_tahun AND periode_bulan = p_periode_bulan;

    v_nomor_rapor := 'RPR-' || p_periode_tahun::TEXT || LPAD(p_periode_bulan::TEXT, 2, '0') || '-' || LPAD(v_counter::TEXT, 4, '0');

    INSERT INTO public.laporan_siswa (
      nomor_rapor,
      siswa_id,
      pelatih_id,
      periode_bulan,
      periode_tahun,
      tanggal_penilaian,
      level_saat_ini,
      rekomendasi_level,
      status_kenaikan,
      status_dokumen,
      nilai_rata_rata,
      catatan_umum,
      catatan_pelatih,
      catatan_head_coach,
      disetujui_oleh
    ) VALUES (
      v_nomor_rapor,
      p_siswa_id,
      p_pelatih_id,
      p_periode_bulan,
      p_periode_tahun,
      p_tanggal_penilaian,
      p_level_saat_ini,
      p_rekomendasi_level,
      p_status_kenaikan,
      p_status_dokumen,
      v_rata_rata,
      p_catatan_umum,
      p_catatan_pelatih,
      p_catatan_head_coach,
      CASE WHEN p_status_dokumen = 'Final' THEN v_user_name ELSE NULL END
    )
    RETURNING id INTO v_laporan_id;
  ELSE
    -- Ambil nomor rapor lama
    SELECT nomor_rapor INTO v_nomor_rapor FROM public.laporan_siswa WHERE id = v_laporan_id;

    UPDATE public.laporan_siswa
    SET
      pelatih_id = p_pelatih_id,
      periode_bulan = p_periode_bulan,
      periode_tahun = p_periode_tahun,
      tanggal_penilaian = p_tanggal_penilaian,
      level_saat_ini = p_level_saat_ini,
      rekomendasi_level = p_rekomendasi_level,
      status_kenaikan = p_status_kenaikan,
      status_dokumen = p_status_dokumen,
      nilai_rata_rata = v_rata_rata,
      catatan_umum = p_catatan_umum,
      catatan_pelatih = p_catatan_pelatih,
      catatan_head_coach = p_catatan_head_coach,
      disetujui_oleh = CASE WHEN p_status_dokumen = 'Final' THEN v_user_name ELSE disetujui_oleh END
    WHERE id = v_laporan_id;

    -- Hapus detail lama untuk digantikan yang baru
    DELETE FROM public.detail_evaluasi_renang WHERE laporan_id = v_laporan_id;
  END IF;

  -- 5. Insert Detail Evaluasi
  IF jsonb_array_length(p_detail_evaluasi) > 0 THEN
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_detail_evaluasi)
    LOOP
      v_skor_akhir_item := ROUND((
        COALESCE((v_item->>'skor_posisi_tubuh')::NUMERIC, 0) +
        COALESCE((v_item->>'skor_gerakan_kaki')::NUMERIC, 0) +
        COALESCE((v_item->>'skor_gerakan_tangan')::NUMERIC, 0) +
        COALESCE((v_item->>'skor_pernapasan')::NUMERIC, 0) +
        COALESCE((v_item->>'skor_koordinasi')::NUMERIC, 0)
      ) / 5.0, 1);

      INSERT INTO public.detail_evaluasi_renang (
        laporan_id,
        kategori_teknik,
        skor_posisi_tubuh,
        skor_gerakan_kaki,
        skor_gerakan_tangan,
        skor_pernapasan,
        skor_koordinasi,
        skor_akhir_gaya,
        jarak_tempuh_meter,
        catatan_waktu_detik,
        keterangan
      ) VALUES (
        v_laporan_id,
        v_item->>'kategori_teknik',
        COALESCE((v_item->>'skor_posisi_tubuh')::NUMERIC, 0),
        COALESCE((v_item->>'skor_gerakan_kaki')::NUMERIC, 0),
        COALESCE((v_item->>'skor_gerakan_tangan')::NUMERIC, 0),
        COALESCE((v_item->>'skor_pernapasan')::NUMERIC, 0),
        COALESCE((v_item->>'skor_koordinasi')::NUMERIC, 0),
        v_skor_akhir_item,
        COALESCE((v_item->>'jarak_tempuh_meter')::INTEGER, 0),
        COALESCE((v_item->>'catatan_waktu_detik')::NUMERIC, 0),
        v_item->>'keterangan'
      );
    END LOOP;
  END IF;

  -- 6. Otomatisasi Sertifikat jika Naik Level / Lulus Tingkat dan status Final
  IF p_status_kenaikan IN ('Naik Level', 'Lulus Tingkat') AND p_status_dokumen IN ('Final', 'Terkirim') THEN
    SELECT id, nomor_sertifikat INTO v_sertifikat_id, v_nomor_sertifikat
    FROM public.sertifikat_siswa
    WHERE laporan_id = v_laporan_id;

    IF v_rata_rata >= 4.5 THEN
      v_predikat := 'Dengan Pujian (Cum Laude)';
    ELSIF v_rata_rata >= 4.0 THEN
      v_predikat := 'Sangat Baik';
    ELSIF v_rata_rata >= 3.0 THEN
      v_predikat := 'Baik';
    ELSE
      v_predikat := 'Cukup';
    END IF;

    IF v_sertifikat_id IS NULL THEN
      SELECT COUNT(*) + 1 INTO v_counter FROM public.sertifikat_siswa WHERE EXTRACT(YEAR FROM tanggal_terbit) = p_periode_tahun;
      v_nomor_sertifikat := 'CERT/KESIT/' || p_periode_tahun::TEXT || '/' || LPAD(v_counter::TEXT, 4, '0');

      INSERT INTO public.sertifikat_siswa (
        laporan_id,
        siswa_id,
        nomor_sertifikat,
        level_kelulusan,
        tanggal_terbit,
        penandatangan_nama,
        penandatangan_jabatan,
        predikat
      ) VALUES (
        v_laporan_id,
        p_siswa_id,
        v_nomor_sertifikat,
        COALESCE(p_rekomendasi_level, p_level_saat_ini),
        p_tanggal_penilaian,
        'Head Coach KESIT',
        'Kepala Pelatih & Evaluator',
        v_predikat
      )
      RETURNING id INTO v_sertifikat_id;
    ELSE
      UPDATE public.sertifikat_siswa
      SET
        level_kelulusan = COALESCE(p_rekomendasi_level, p_level_saat_ini),
        tanggal_terbit = p_tanggal_penilaian,
        predikat = v_predikat
      WHERE id = v_sertifikat_id;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'laporan_id', v_laporan_id,
    'nomor_rapor', v_nomor_rapor,
    'nilai_rata_rata', v_rata_rata,
    'sertifikat_id', v_sertifikat_id,
    'nomor_sertifikat', v_nomor_sertifikat
  );
END;
$$;

-- --------------------------------------------------------
-- 8. FUNCTION: kesit_hapus_laporan_siswa
-- --------------------------------------------------------
CREATE OR REPLACE FUNCTION public.kesit_hapus_laporan_siswa(p_laporan_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_role TEXT;
  v_pelatih_id UUID;
  v_status_dokumen TEXT;
  v_owner_laporan_pelatih UUID;
BEGIN
  SELECT up.role, up.pelatih_id INTO v_role, v_pelatih_id
  FROM public.user_profiles up
  WHERE up.id = auth.uid();

  IF v_role IS NULL THEN
    RAISE EXCEPTION 'Akses ditolak: sesi login tidak valid.';
  END IF;

  SELECT status_dokumen, pelatih_id
  INTO v_status_dokumen, v_owner_laporan_pelatih
  FROM public.laporan_siswa
  WHERE id = p_laporan_id;

  IF v_status_dokumen IS NULL THEN
    RAISE EXCEPTION 'Data laporan tidak ditemukan.';
  END IF;

  IF v_role = 'Pelatih' THEN
    IF v_owner_laporan_pelatih != v_pelatih_id THEN
      RAISE EXCEPTION 'Akses ditolak: Anda hanya dapat menghapus laporan yang Anda buat sendiri.';
    END IF;
    IF v_status_dokumen != 'Draft' THEN
      RAISE EXCEPTION 'Laporan dengan status Final atau Terkirim tidak dapat dihapus oleh Pelatih.';
    END IF;
  END IF;

  -- Hapus detail evaluasi & sertifikat terkait
  DELETE FROM public.detail_evaluasi_renang WHERE laporan_id = p_laporan_id;
  DELETE FROM public.sertifikat_siswa WHERE laporan_id = p_laporan_id;
  DELETE FROM public.laporan_siswa WHERE id = p_laporan_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- Grant execute ke role Supabase
GRANT EXECUTE ON FUNCTION public.kesit_simpan_laporan_siswa TO authenticated;
GRANT EXECUTE ON FUNCTION public.kesit_hapus_laporan_siswa TO authenticated;
