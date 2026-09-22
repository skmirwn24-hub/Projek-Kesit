import { z } from 'zod';

const optionalUuid = z
  .union([z.string().uuid(), z.literal(''), z.null(), z.undefined()])
  .transform((val) => (val === '' || !val ? null : val));

const optionalDateString = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((val) => (val === '' || !val ? null : val));

export const pendaftaranSiswaSchema = z.object({
  nama_lengkap: z.string().min(1, 'Nama lengkap wajib diisi'),
  nama_panggilan: z.string().optional().default(''),
  jenis_kelamin: z.enum(['Laki-laki', 'Perempuan']).optional().nullable(),
  tempat_lahir: z.string().optional().default(''),
  tanggal_lahir: optionalDateString,
  nama_wali: z.string().optional().default(''),
  no_hp_wali: z.string().optional().default(''),
  alamat: z.string().optional().default(''),
  pelatih_pemilik_id: optionalUuid,
  pelatih_diminta_id: optionalUuid,
  status_siswa: z.enum(['Aktif', 'Nonaktif', 'Cuti']).default('Aktif'),
  tanggal_daftar: z.string().min(1, 'Tanggal daftar wajib diisi'),
  lokasi: z.string().min(1, 'Lokasi wajib dipilih'),
  kelas: z.string().min(1, 'Kelas wajib dipilih'),
  nama_paket: z.string().min(1, 'Paket wajib dipilih'),
  harga_paket: z.coerce.number().min(0),
  biaya_request_pelatih: z.coerce.number().min(0).default(0),
  diskon: z.coerce.number().min(0).default(0),
  total_tagihan: z.coerce.number().min(0),
  kuota_total: z.coerce.number().min(1, 'Kuota minimal 1 pertemuan'),
  nominal_dibayar: z.coerce.number().min(0),
  sisa_tagihan: z.coerce.number().min(0).default(0),
  status_pembayaran: z.enum(['Lunas', 'Belum Lunas']).default('Belum Lunas'),
  metode_pembayaran: z.string().min(1, 'Metode pembayaran wajib dipilih'),
  admin_penerima: z.string().optional().default('Admin KESIT'),
});

export type PendaftaranSiswaInput = z.infer<typeof pendaftaranSiswaSchema>;

export const editBiodataSiswaSchema = z.object({
  siswa_id: z.string().uuid('ID siswa tidak valid'),
  nama_lengkap: z.string().min(1, 'Nama lengkap wajib diisi'),
  nama_panggilan: z.string().optional().default(''),
  jenis_kelamin: z.enum(['Laki-laki', 'Perempuan']).optional().nullable(),
  tempat_lahir: z.string().optional().default(''),
  tanggal_lahir: optionalDateString,
  nama_wali: z.string().optional().default(''),
  no_hp_wali: z.string().optional().default(''),
  alamat: z.string().optional().default(''),
  status_siswa: z.enum(['Aktif', 'Nonaktif', 'Cuti']),
});

export type EditBiodataSiswaInput = z.infer<typeof editBiodataSiswaSchema>;

export const pindahKelasSiswaSchema = z.object({
  siswa_id: z.string().uuid('ID siswa tidak valid'),
  paket_siswa_id: z.string().uuid('ID paket tidak valid'),
  lokasi_baru: z.string().min(1, 'Lokasi baru wajib diisi'),
  kelas_baru: z.string().min(1, 'Kelas baru wajib diisi'),
  paket_baru: z.string().min(1, 'Paket baru wajib diisi'),
  harga_paket_baru: z.coerce.number().min(0),
  kuota_total_baru: z.coerce.number().min(1),
  pelatih_pemilik_baru: optionalUuid,
  pelatih_diminta_baru: optionalUuid,
  biaya_request_pelatih_baru: z.coerce.number().min(0).default(0),
  diskon_baru: z.coerce.number().min(0).default(0),
  total_tagihan_baru: z.coerce.number().min(0),
  alasan: z.string().min(1, 'Alasan pindah kelas wajib diisi'),
  diubah_oleh: z.string().min(1, 'Nama pengubah wajib tercatat'),
});

export type PindahKelasSiswaInput = z.infer<typeof pindahKelasSiswaSchema>;

