import { z } from 'zod';

export const absensiSiswaSchema = z.object({
  siswa_id: z.string().uuid('ID siswa tidak valid'),
  paket_siswa_id: z.string().uuid().optional().nullable(),
  pelatih_id: z.string().uuid().optional().nullable(), // null berarti pelatih pemilik sendiri
  tanggal: z.string().min(1, 'Tanggal wajib diisi'), // ISO date string
  nomor_sesi: z.number().int().min(1).optional().nullable(), // null untuk Prestasi
  kategori: z.enum(['Reguler', 'Private', 'Prestasi']),
  status_hadir: z.enum(['Hadir', 'Tidak Hadir']).default('Hadir'),
  catatan: z.string().optional().default(''),
});

export type AbsensiSiswaInput = z.infer<typeof absensiSiswaSchema>;

export const batalkanAbsensiSchema = z.object({
  absensi_id: z.string().uuid('ID absensi tidak valid'),
});

export type BatalkanAbsensiInput = z.infer<typeof batalkanAbsensiSchema>;

export const queryAbsensiSchema = z.object({
  pelatih_id: z.string().uuid().optional().nullable(),
  kategori: z.enum(['Reguler', 'Private', 'Prestasi']).optional(),
  bulan: z.number().int().min(1).max(12).optional(),
  tahun: z.number().int().min(2020).optional(),
});

export type QueryAbsensiInput = z.infer<typeof queryAbsensiSchema>;
