import { z } from 'zod';

export const catatKasTransaksiSchema = z.object({
  jenis_transaksi: z.enum(['Masuk', 'Keluar'], {
    error: 'Jenis transaksi harus Masuk atau Keluar',
  }),
  kategori: z.string().min(1, 'Kategori transaksi wajib dipilih'),
  nominal: z.number().positive('Nominal transaksi harus lebih dari 0'),
  tanggal_transaksi: z.string().min(1, 'Tanggal transaksi wajib diisi'),
  lokasi: z.string().optional().nullable(),
  keterangan: z.string().optional().nullable(),
  metode_pembayaran: z.string().min(1).default('Tunai'),
});

export type CatatKasTransaksiInput = z.infer<typeof catatKasTransaksiSchema>;

export const softDeleteKasTransaksiSchema = z.object({
  transaksi_id: z.string().uuid('ID transaksi tidak valid'),
  alasan: z.string().min(3, 'Alasan pembatalan minimal 3 karakter untuk integritas audit'),
});

export type SoftDeleteKasTransaksiInput = z.infer<typeof softDeleteKasTransaksiSchema>;

export const bayarSppSiswaSchema = z.object({
  siswa_id: z.string().uuid('ID siswa tidak valid'),
  nominal: z.number().positive('Nominal pembayaran harus lebih dari 0'),
  metode: z.string().min(1).default('Tunai'),
  tanggal: z.string().min(1, 'Tanggal pembayaran wajib diisi'),
  jalur: z.enum(['Admin / Kasir', 'Titip Pelatih']).default('Admin / Kasir'),
  penerima_pelatih_id: z.string().uuid().optional().nullable(),
  catatan: z.string().optional().default(''),
});

export type BayarSppSiswaInput = z.infer<typeof bayarSppSiswaSchema>;

export const updateTarifHonorSchema = z.object({
  pelatih_id: z.string().uuid('ID pelatih tidak valid'),
  kategori_kelas: z.enum(['Semua', 'Reguler', 'Private', 'Prestasi']).default('Semua'),
  tarif_per_anak: z.number().min(0, 'Tarif tidak boleh negatif'),
  keterangan: z.string().optional().nullable(),
});

export type UpdateTarifHonorInput = z.infer<typeof updateTarifHonorSchema>;

export const cairkanHonorSchema = z.object({
  pelatih_id: z.string().uuid('ID pelatih tidak valid'),
  periode_bulan: z.string().min(1, 'Periode bulan wajib diisi'), // format: 'YYYY-MM-01'
  total_siswa_diajar: z.number().int().min(0),
  tarif_dasar: z.number().min(0),
  nominal_kalkulasi: z.number().min(0),
  nominal_penyesuaian: z.number().default(0),
  nominal_final: z.number().min(0),
  catatan: z.string().optional().default(''),
});

export type CairkanHonorInput = z.infer<typeof cairkanHonorSchema>;
