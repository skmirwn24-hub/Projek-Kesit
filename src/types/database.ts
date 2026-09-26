// ========================================================
// KESIT Management - Database Entities Types
// Sinkron 100% dengan Schema Remote Supabase (qqhhmebquplfwqtismqb)
// ========================================================

import { KesitRole } from './auth';

export type PelatihStatus = 'Aktif' | 'Training' | 'Nonaktif';
export type SiswaStatus = 'Aktif' | 'Nonaktif' | 'Cuti';
export type JenisKelamin = 'Laki-laki' | 'Perempuan';
export type StatusPembayaran = 'Lunas' | 'Belum Lunas';
export type KategoriKelas = 'Reguler' | 'Private' | 'Prestasi';
export type StatusHadir = 'Hadir' | 'Tidak Hadir';

export interface Pelatih {
  id: string;
  nama: string;
  no_hp: string | null;
  email: string | null;
  alamat: string | null;
  tanggal_lahir: string | null;
  pendidikan: string | null;
  sertifikat: string | null;
  status: PelatihStatus;
  tanggal_mulai_training: string | null;
  tanggal_berakhir_training: string | null;
  total_siswa_milik?: number;
  created_at: string;
}

export interface Siswa {
  id: string;
  id_siswa: string;
  nama_lengkap: string;
  nama_panggilan: string | null;
  jenis_kelamin: JenisKelamin | null;
  tempat_lahir: string | null;
  tanggal_lahir: string | null;
  nama_wali: string | null;
  no_hp_wali: string | null;
  alamat: string | null;
  pelatih_pemilik_id: string | null;
  pelatih_diminta_id: string | null;
  status_siswa: SiswaStatus;
  tanggal_daftar: string;
  created_at: string;
}

export interface PaketSiswa {
  id: string;
  siswa_id: string;
  lokasi: string | null;
  kelas: string | null;
  nama_paket: string | null;
  harga_paket: number;
  biaya_request_pelatih: number;
  diskon: number;
  total_tagihan: number;
  kuota_total: number;
  kuota_terpakai: number;
  status_paket: string;
  created_at: string;
}

export interface PembayaranSiswa {
  id: string;
  siswa_id: string;
  paket_siswa_id: string | null;
  nomor_kuitansi: string | null;
  harga_paket?: number;
  biaya_request_pelatih?: number;
  diskon?: number;
  total_tagihan?: number;
  nominal_dibayar: number;
  sisa_tagihan: number;
  status_pembayaran: StatusPembayaran | null;
  metode_pembayaran: string | null;
  admin_penerima: string | null;
  tanggal_transaksi: string | null;
  created_at: string;
}

export interface RekapanSiswaView {
  id: string;
  id_siswa: string;
  nama_lengkap: string;
  nama_panggilan: string | null;
  jenis_kelamin: JenisKelamin | null;
  tempat_lahir: string | null;
  tanggal_lahir: string | null;
  nama_wali: string | null;
  no_hp_wali: string | null;
  alamat: string | null;
  status_siswa: SiswaStatus;
  tanggal_daftar: string;
  pelatih_pemilik: string | null;
  pelatih_diminta: string | null;
  pelatih_pemilik_id?: string | null;
  pelatih_diminta_id?: string | null;
  paket_siswa_id: string | null;
  lokasi: string | null;
  kelas: string | null;
  nama_paket: string | null;
  harga_paket: number;
  biaya_request_pelatih: number;
  diskon: number;
  total_tagihan: number;
  kuota_total: number;
  kuota_terpakai: number;
  status_paket: string | null;
  nomor_kuitansi: string | null;
  nominal_dibayar: number | null;
  sisa_tagihan: number | null;
  status_pembayaran: StatusPembayaran | null;
  metode_pembayaran: string | null;
  admin_penerima: string | null;
  tanggal_transaksi: string | null;
}

export interface PenilaianPelatih {
  id: string;
  pelatih_id: string;
  tanggal_penilaian: string;
  kedisiplinan: number;
  kehadiran: number;
  kualitas_mengajar: number;
  komunikasi: number;
  administrasi_laporan: number;
  catatan: string | null;
  dinilai_oleh: string | null;
  diinput_oleh: string | null;
  kategori_pelanggaran: string | null;
  detail_pelanggaran: string | null;
  jenis_sanksi: string | null;
  tanggal_mulai_sanksi: string | null;
  persentase_denda: number;
  nominal_denda: number;
  sesi_tanpa_honor: number;
  catatan_sanksi: string | null;
  diputuskan_oleh: string | null;
  created_at: string;
}

export interface PenilaianPelatihView {
  id: string;
  pelatih_id: string;
  nama_pelatih: string;
  status_pelatih?: PelatihStatus;
  tanggal_penilaian: string;
  nilai_rata_rata: number;
  kkm: number;
  status_kkm: string;
  kategori_pelanggaran: string | null;
  detail_pelanggaran: string | null;
  jenis_sanksi: string | null;
  tanggal_mulai_sanksi: string | null;
  tanggal_berakhir_sanksi: string | null;
  status_sanksi: string | null;
  persentase_denda: number;
  nominal_denda: number;
  sesi_tanpa_honor: number;
  catatan: string | null;
  catatan_sanksi: string | null;
  diinput_oleh: string | null;
  dinilai_oleh?: string | null;
  kedisiplinan?: number;
  kehadiran?: number;
  kualitas_mengajar?: number;
  komunikasi?: number;
  administrasi_laporan?: number;
  created_at: string;
  // Compatibility aliases
  penilai?: string | null;
  penampilan?: number;
  tanggung_jawab?: number;
  rata_rata?: number;
  sanksi?: string | null;
}

export interface RiwayatPerubahanSiswa {
  id: string;
  siswa_id: string;
  jenis_perubahan: string;
  lokasi_lama: string | null;
  kelas_lama: string | null;
  paket_lama: string | null;
  pelatih_pemilik_lama: string | null;
  lokasi_baru: string | null;
  kelas_baru: string | null;
  paket_baru: string | null;
  pelatih_pemilik_baru: string | null;
  tanggal_perubahan: string | null;
  alasan: string | null;
  diubah_oleh: string | null;
  created_at: string;
  nama_siswa?: string;
  id_siswa?: string;
  nama_pelatih_lama?: string;
  nama_pelatih_baru?: string;
}

export interface AbsensiSiswa {
  id: string;
  siswa_id: string;
  paket_siswa_id: string | null;
  pelatih_id: string | null;
  tanggal: string;
  nomor_sesi: number | null;
  kategori: KategoriKelas;
  status_hadir: StatusHadir;
  catatan: string | null;
  dicatat_oleh: string | null;
  created_at: string;
}

export interface AbsensiSiswaView {
  id: string;
  siswa_id: string;
  id_siswa: string;
  nama_lengkap: string;
  nama_panggilan: string | null;
  pelatih_pemilik_id: string | null;
  pelatih_pemilik: string | null;
  pelatih_id: string | null;
  nama_pelatih_mengajar: string | null;
  tanggal: string;
  nomor_sesi: number | null;
  kategori: KategoriKelas;
  status_hadir: StatusHadir;
  catatan: string | null;
  paket_siswa_id: string | null;
  kuota_total: number;
  kuota_terpakai: number;
  dicatat_oleh: string | null;
  created_at: string;
}

export interface SiswaUntukAbsensiView {
  siswa_id: string;
  id_siswa: string;
  nama_lengkap: string;
  nama_panggilan: string | null;
  pelatih_pemilik_id: string | null;
  pelatih_pemilik: string | null;
  paket_siswa_id: string | null;
  kategori: KategoriKelas | null;
  kuota_total: number;
  kuota_terpakai: number;
  nama_paket: string | null;
  // Populated client-side: absensi status untuk sesi/hari aktif
  absensi_id?: string | null;
  status_hadir?: StatusHadir | null;
  pelatih_mengajar_id?: string | null;
}

export interface DashboardStats {
  totalSiswa: number;
  siswaAktif: number;
  siswaLunas: number;
  siswaBelumLunas: number;
  totalPelatih: number;
  pelatihAktif: number;
  pelatihTraining: number;
  pelatihNonaktif: number;
  totalPendapatan: number;
  sisaPiutang: number;
  saldoKas?: number;
  totalKasMasuk?: number;
  totalKasKeluar?: number;
}

export type HariJadwal = 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu' | 'Minggu';

export interface JadwalPelatih {
  id: string;
  pelatih_id: string;
  hari: HariJadwal;
  jam_mulai: string;
  tempat: string;
  kelas: string;
  created_at: string;
  updated_at: string;
}

export interface JadwalPelatihView extends JadwalPelatih {
  nama_pelatih: string;
}
