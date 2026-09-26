// ========================================================
// KESIT Management - Keuangan & Kas Type Definitions
// ========================================================

export type JenisTransaksiKas = 'Masuk' | 'Keluar';

export interface KasTransaksi {
  id: string;
  nomor_transaksi: string;
  tanggal_transaksi: string;
  jenis_transaksi: JenisTransaksiKas;
  kategori: string;
  nominal: number;
  lokasi: string | null;
  keterangan: string | null;
  metode_pembayaran: string;
  dibuat_oleh: string;
  pembayaran_siswa_id?: string | null;
  is_deleted: boolean;
  deleted_at?: string | null;
  deleted_by?: string | null;
  alasan_hapus?: string | null;
  created_at: string;
  updated_at: string;
}

export interface KasSummary {
  saldoKas: number;
  totalMasuk: number;
  totalKeluar: number;
  transaksiBulanIni: number;
  totalPiutangSiswa: number;
}

export interface PengaturanHonorPelatih {
  id: string;
  pelatih_id: string;
  pelatih_nama?: string;
  kategori_kelas: string;
  tarif_per_anak: number;
  keterangan: string | null;
  updated_at: string;
}

export interface HonorKalkulasiPelatih {
  pelatih_id: string;
  nama_pelatih: string;
  total_siswa_diajar: number;
  tarif_dasar: number;
  nominal_kalkulasi: number;
  status_cair: 'Draft' | 'Disetujui' | 'Dicairkan';
  slip_id?: string | null;
  nomor_slip?: string | null;
}

export interface SiswaPembayaranRow {
  siswa_id: string;
  id_siswa: string;
  nama_lengkap: string;
  nama_panggilan: string | null;
  nama_wali: string | null;
  no_hp_wali: string | null;
  lokasi: string | null;
  kelas: string | null;
  nama_paket: string | null;
  pelatih_pemilik_id: string | null;
  nama_pelatih_pemilik: string | null;
  total_tagihan: number;
  nominal_dibayar: number;
  sisa_tagihan: number;
  status_pembayaran: 'Lunas' | 'Belum Lunas';
  tanggal_daftar: string;
  paket_siswa_id: string | null;
  last_transaksi_date?: string | null;
}
