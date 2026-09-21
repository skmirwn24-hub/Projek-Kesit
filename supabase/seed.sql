-- ========================================================
-- KESIT Management - Seed Data Development
-- Data awal untuk pengujian lokal / development
-- Sinkron dengan Schema Database Remote
-- ========================================================

-- Pastikan extension uuid-ossp aktif
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- --------------------------------------------------------
-- 1. SEED PELATIH
-- --------------------------------------------------------
INSERT INTO public.pelatih (id, nama, no_hp, email, alamat, status, pendidikan, sertifikat)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Budi Santoso, S.Pd.', '081234567890', 'budi@kesit.com', 'Jl. Renang Sehat No. 1, Jakarta', 'Aktif', 'S1 Pendidikan Olahraga', 'Lisensi C Akuatik Indonesia'),
  ('22222222-2222-2222-2222-222222222222', 'Siti Rahmawati', '081298765432', 'siti@kesit.com', 'Jl. Melati Indah No. 15, Tangerang', 'Aktif', 'D3 Fisioterapi', 'Sertifikat Pelatih Dasar Renang'),
  ('33333333-3333-3333-3333-333333333333', 'Ahmad Fauzi', '081377889900', 'fauzi@kesit.com', 'Jl. Kenanga Raya No. 4, Bekasi', 'Training', 'SMA Negeri 1 Jakarta', 'Pelatihan Renang Tingkat Daerah')
ON CONFLICT (id) DO NOTHING;

-- --------------------------------------------------------
-- 2. SEED SISWA
-- --------------------------------------------------------
INSERT INTO public.siswa (
  id, id_siswa, nama_lengkap, nama_panggilan, jenis_kelamin, 
  tempat_lahir, tanggal_lahir, nama_wali, no_hp_wali, alamat, 
  pelatih_pemilik_id, pelatih_diminta_id, status_siswa, tanggal_daftar
) VALUES 
  (
    '44444444-4444-4444-4444-444444444441', 'SIS000001', 'Kenzi Alfarizi', 'Kenzi', 'Laki-laki',
    'Jakarta', '2015-05-12', 'Bambang Susilo', '081122334455', 'Jl. Cempaka Putih No. 12',
    '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Aktif', CURRENT_DATE - INTERVAL '30 days'
  ),
  (
    '44444444-4444-4444-4444-444444444442', 'SIS000002', 'Aisyah Putri Azzahra', 'Aisyah', 'Perempuan',
    'Tangerang', '2017-08-20', 'Rina Wulandari', '081566778899', 'Jl. Bintaro Sektor 7',
    '22222222-2222-2222-2222-222222222222', NULL, 'Aktif', CURRENT_DATE - INTERVAL '15 days'
  ),
  (
    '44444444-4444-4444-4444-444444444443', 'SIS000003', 'Fathan Rizky Ramadan', 'Fathan', 'Laki-laki',
    'Bekasi', '2016-02-10', 'Hendra Gunawan', '081899001122', 'Jl. Patriot No. 8',
    '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Aktif', CURRENT_DATE - INTERVAL '5 days'
  )
ON CONFLICT (id) DO NOTHING;

-- --------------------------------------------------------
-- 3. SEED PAKET SISWA
-- --------------------------------------------------------
INSERT INTO public.paket_siswa (
  id, siswa_id, lokasi, kelas, nama_paket, harga_paket, 
  biaya_request_pelatih, diskon, total_tagihan, kuota_total, kuota_terpakai, 
  status_paket
) VALUES 
  (
    '55555555-5555-5555-5555-555555555551', '44444444-4444-4444-4444-444444444441',
    'Kolam Renang GOR Bulungan', 'Private', 'Private Bulanan (4x Pertemuan)',
    800000, 50000, 0, 850000, 4, 2, 'Aktif'
  ),
  (
    '55555555-5555-5555-5555-555555555552', '44444444-4444-4444-4444-444444444442',
    'Kolam Renang Bintaro Modern', 'Reguler', 'Reguler Paket 8 Sesi',
    600000, 0, 50000, 550000, 8, 3, 'Aktif'
  ),
  (
    '55555555-5555-5555-5555-555555555553', '44444444-4444-4444-4444-444444444443',
    'Kolam Renang Harapan Indah', 'Semi Private', 'Semi Private 6 Sesi',
    750000, 25000, 0, 775000, 6, 1, 'Aktif'
  )
ON CONFLICT (id) DO NOTHING;

-- --------------------------------------------------------
-- 4. SEED PEMBAYARAN SISWA
-- --------------------------------------------------------
INSERT INTO public.pembayaran_siswa (
  id, siswa_id, paket_siswa_id, nomor_kuitansi, harga_paket,
  biaya_request_pelatih, diskon, total_tagihan, nominal_dibayar, 
  sisa_tagihan, status_pembayaran, metode_pembayaran, admin_penerima, tanggal_transaksi
) VALUES 
  (
    '66666666-6666-6666-6666-666666666661', '44444444-4444-4444-4444-444444444441',
    '55555555-5555-5555-5555-555555555551', 'KW-20260901-0001', 800000, 50000, 0, 850000,
    850000, 0, 'Lunas', 'Transfer BCA', 'Admin KESIT', CURRENT_DATE - INTERVAL '30 days'
  ),
  (
    '66666666-6666-6666-6666-666666666662', '44444444-4444-4444-4444-444444444442',
    '55555555-5555-5555-5555-555555555552', 'KW-20260910-0002', 600000, 0, 50000, 550000,
    300000, 250000, 'Belum Lunas', 'Cash', 'Admin KESIT', CURRENT_DATE - INTERVAL '15 days'
  ),
  (
    '66666666-6666-6666-6666-666666666663', '44444444-4444-4444-4444-444444444443',
    '55555555-5555-5555-5555-555555555553', 'KW-20260915-0003', 750000, 25000, 0, 775000,
    775000, 0, 'Lunas', 'QRIS', 'Admin KESIT', CURRENT_DATE - INTERVAL '5 days'
  )
ON CONFLICT (id) DO NOTHING;

-- --------------------------------------------------------
-- 5. SEED PENILAIAN PELATIH
-- --------------------------------------------------------
INSERT INTO public.penilaian_pelatih (
  id, pelatih_id, tanggal_penilaian, kedisiplinan, kehadiran, kualitas_mengajar,
  komunikasi, administrasi_laporan, catatan, dinilai_oleh, diinput_oleh,
  kategori_pelanggaran, detail_pelanggaran, jenis_sanksi, tanggal_mulai_sanksi,
  persentase_denda, nominal_denda, sesi_tanpa_honor, catatan_sanksi, diputuskan_oleh
) VALUES 
  (
    '77777777-7777-7777-7777-777777777771', '11111111-1111-1111-1111-111111111111', CURRENT_DATE - INTERVAL '10 days',
    5, 5, 5, 4, 5,
    'Sangat baik dalam mendampingi siswa pemula dan tepat waktu.', 'Owner KESIT', 'Admin KESIT',
    'Tidak Ada', NULL, 'Tidak Ada', NULL,
    0, 0, 0, NULL, NULL
  ),
  (
    '77777777-7777-7777-7777-777777777772', '22222222-2222-2222-2222-222222222222', CURRENT_DATE - INTERVAL '7 days',
    4, 4, 4, 5, 4,
    'Komunikasi dengan orang tua siswa sangat memuaskan.', 'Owner KESIT', 'Admin KESIT',
    'Tidak Ada', NULL, 'Tidak Ada', NULL,
    0, 0, 0, NULL, NULL
  ),
  (
    '77777777-7777-7777-7777-777777777773', '33333333-3333-3333-3333-333333333333', CURRENT_DATE - INTERVAL '2 days',
    2, 2, 3, 2, 3,
    'Sering terlambat dan kurang berinisiatif dalam materi pengajaran.', 'Owner KESIT', 'Admin KESIT',
    'Kedisiplinan', 'Terlambat lebih dari 3x dalam 1 bulan', 'Teguran', CURRENT_DATE - INTERVAL '2 days',
    0, 0, 0, 'Teguran lisan pertama', 'Owner KESIT'
  )
ON CONFLICT (id) DO NOTHING;

-- --------------------------------------------------------
-- 6. SEED RIWAYAT PERUBAHAN SISWA
-- --------------------------------------------------------
INSERT INTO public.riwayat_perubahan_siswa (
  id, siswa_id, jenis_perubahan, lokasi_baru, kelas_baru, paket_baru,
  pelatih_pemilik_baru, tanggal_perubahan, alasan, diubah_oleh
) VALUES 
  (
    '88888888-8888-8888-8888-888888888881', '44444444-4444-4444-4444-444444444441', 'Pendaftaran Baru',
    'Kolam Renang GOR Bulungan', 'Private', 'Private Bulanan (4x Pertemuan)',
    '11111111-1111-1111-1111-111111111111', CURRENT_DATE - INTERVAL '30 days',
    'Pendaftaran siswa awal', 'Admin KESIT'
  ),
  (
    '88888888-8888-8888-8888-888888888882', '44444444-4444-4444-4444-444444444442', 'Pendaftaran Baru',
    'Kolam Renang Bintaro Modern', 'Reguler', 'Reguler Paket 8 Sesi',
    '22222222-2222-2222-2222-222222222222', CURRENT_DATE - INTERVAL '15 days',
    'Pendaftaran siswa awal', 'Admin KESIT'
  )
ON CONFLICT (id) DO NOTHING;

