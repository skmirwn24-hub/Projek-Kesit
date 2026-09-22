-- ========================================================
-- KESIT Management - Migration 004: Fix Pendaftaran & Absensi Sync
-- 1. Perbaikan generator ID Siswa di fungsi daftar_siswa_awal (mencegah duplicate key error)
-- 2. Perbaikan VIEW v_siswa_untuk_absensi agar otomatis memuat semua siswa aktif (Reguler, Private, Prestasi)
-- ========================================================

-- --------------------------------------------------------
-- 1. UPDATE FUNCTION: daftar_siswa_awal
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
  -- Generate unique ID siswa safely based on MAX numerical index
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

  -- Safety loop: ensure ID does not already exist
  WHILE EXISTS (SELECT 1 FROM public.siswa WHERE id_siswa = v_id_siswa) LOOP
    v_count := v_count + 1;
    v_id_siswa := 'SIS' || LPAD(v_count::TEXT, 6, '0');
  END LOOP;

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
    tanggal_transaksi, harga_paket, biaya_request_pelatih, diskon, total_tagihan
  ) VALUES (
    v_siswa_id, v_paket_id, v_kuitansi, p_nominal_dibayar,
    p_sisa_tagihan, p_status_pembayaran, p_metode_pembayaran, p_admin_penerima,
    p_tanggal_daftar, p_harga_paket, p_biaya_request_pelatih, p_diskon, p_total_tagihan
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
-- 2. UPDATE VIEW: v_siswa_untuk_absensi
-- --------------------------------------------------------
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
