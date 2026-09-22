import { z } from 'zod';

export const penilaianSchema = z.object({
  pelatih_id: z.string().uuid('Pilih pelatih yang valid'),
  tanggal_penilaian: z.string().min(1, 'Tanggal penilaian wajib diisi'),
  kedisiplinan: z.coerce.number().min(1).max(5),
  kehadiran: z.coerce.number().min(1).max(5),
  kualitas_mengajar: z.coerce.number().min(1).max(5),
  komunikasi: z.coerce.number().min(1).max(5),
  administrasi_laporan: z.coerce.number().min(1).max(5),
  catatan: z.string().optional().nullable(),
  dinilai_oleh: z.string().optional().nullable(),
  diinput_oleh: z.string().optional().nullable(),
  kategori_pelanggaran: z.string().optional().default('Tidak Ada'),
  detail_pelanggaran: z.string().optional().nullable(),
  jenis_sanksi: z.string().optional().default('Tidak Ada'),
  tanggal_mulai_sanksi: z.string().optional().nullable(),
  persentase_denda: z.coerce.number().optional().default(0),
  nominal_denda: z.coerce.number().optional().default(0),
  sesi_tanpa_honor: z.coerce.number().optional().default(0),
  catatan_sanksi: z.string().optional().nullable(),
  diputuskan_oleh: z.string().optional().nullable(),
});

export type PenilaianInput = z.infer<typeof penilaianSchema>;
