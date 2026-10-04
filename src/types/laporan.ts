// ========================================================
// KESIT Management - Laporan & Rapor Siswa Types
// ========================================================

export type KategoriTeknikRenang =
  | 'Pengenalan Air'
  | 'Gaya Dada'
  | 'Gaya Bebas'
  | 'Gaya Punggung'
  | 'Gaya Kupu-Kupu'
  | 'Daya Tahan & Waktu';

export type StatusKenaikan = 'Bertahan' | 'Naik Level' | 'Lulus Tingkat';

export type StatusDokumenRapor = 'Draft' | 'Final' | 'Terkirim';

export const DAFTAR_LEVEL_RENANG = [
  'Pengenalan Air (Water Safety)',
  'Pemula 1 (Dasar Meluncur & Kaki)',
  'Pemula 2 (Gaya Dada & Bebas Pemula)',
  'Menengah (Gaya Dada & Bebas Mahir, Punggung)',
  'Lanjutan (4 Gaya Lengkap & Pembalikan)',
  'Prestasi / Atletik',
] as const;

export const TEKNIK_DEFAULT: KategoriTeknikRenang[] = [
  'Pengenalan Air',
  'Gaya Dada',
  'Gaya Bebas',
  'Gaya Punggung',
  'Gaya Kupu-Kupu',
  'Daya Tahan & Waktu',
];

export interface DetailEvaluasiRenang {
  id?: string;
  laporan_id?: string;
  kategori_teknik: KategoriTeknikRenang;
  skor_posisi_tubuh: number;
  skor_gerakan_kaki: number;
  skor_gerakan_tangan: number;
  skor_pernapasan: number;
  skor_koordinasi: number;
  skor_akhir_gaya: number;
  jarak_tempuh_meter: number;
  catatan_waktu_detik: number;
  keterangan?: string | null;
  created_at?: string;
}

export interface LaporanSiswa {
  id: string;
  nomor_rapor: string;
  siswa_id: string;
  pelatih_id: string | null;
  periode_bulan: number;
  periode_tahun: number;
  tanggal_penilaian: string;
  level_saat_ini: string;
  rekomendasi_level: string | null;
  status_kenaikan: StatusKenaikan;
  status_dokumen: StatusDokumenRapor;
  nilai_rata_rata: number;
  catatan_umum: string | null;
  catatan_pelatih: string | null;
  catatan_head_coach: string | null;
  disetujui_oleh: string | null;
  created_at: string;
  updated_at: string;
}

export interface VLaporanSiswa {
  id: string;
  nomor_rapor: string;
  siswa_id: string;
  id_siswa: string;
  nama_siswa: string;
  nama_panggilan: string | null;
  jenis_kelamin: string | null;
  nama_wali: string | null;
  no_hp_wali: string | null;
  status_siswa: string;
  pelatih_id: string | null;
  nama_pelatih: string;
  lokasi: string | null;
  kelas: string | null;
  nama_paket: string | null;
  periode_bulan: number;
  periode_tahun: number;
  tanggal_penilaian: string;
  level_saat_ini: string;
  rekomendasi_level: string | null;
  status_kenaikan: StatusKenaikan;
  status_dokumen: StatusDokumenRapor;
  nilai_rata_rata: number;
  catatan_umum: string | null;
  catatan_pelatih: string | null;
  catatan_head_coach: string | null;
  disetujui_oleh: string | null;
  sertifikat_id?: string | null;
  nomor_sertifikat?: string | null;
  tanggal_terbit_sertifikat?: string | null;
  predikat_sertifikat?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SertifikatSiswa {
  id: string;
  laporan_id: string | null;
  siswa_id: string;
  nomor_sertifikat: string;
  level_kelulusan: string;
  tanggal_terbit: string;
  penandatangan_nama: string;
  penandatangan_jabatan: string;
  predikat: string;
  created_at: string;
}

export interface LaporanDetailData {
  laporan: VLaporanSiswa;
  details: DetailEvaluasiRenang[];
  sertifikat?: SertifikatSiswa | null;
}

export interface LaporanStats {
  totalRapor: number;
  totalNaikLevel: number;
  rataRataNilai: number;
  totalDraft: number;
}
