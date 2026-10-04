import { z } from 'zod';

export const detailEvaluasiInputSchema = z.object({
  kategori_teknik: z.enum([
    'Pengenalan Air',
    'Gaya Dada',
    'Gaya Bebas',
    'Gaya Punggung',
    'Gaya Kupu-Kupu',
    'Daya Tahan & Waktu',
  ]),
  skor_posisi_tubuh: z.coerce.number().min(0).max(5).default(0),
  skor_gerakan_kaki: z.coerce.number().min(0).max(5).default(0),
  skor_gerakan_tangan: z.coerce.number().min(0).max(5).default(0),
  skor_pernapasan: z.coerce.number().min(0).max(5).default(0),
  skor_koordinasi: z.coerce.number().min(0).max(5).default(0),
  jarak_tempuh_meter: z.coerce.number().min(0).default(0),
  catatan_waktu_detik: z.coerce.number().min(0).default(0),
  keterangan: z.string().optional().nullable().default(''),
});

export const simpanLaporanSchema = z.object({
  laporan_id: z.string().uuid().optional().nullable(),
  siswa_id: z.string().uuid({ message: 'Siswa wajib dipilih' }),
  pelatih_id: z.string().uuid({ message: 'Pelatih penilai wajib dipilih' }),
  periode_bulan: z.coerce.number().int().min(1).max(12),
  periode_tahun: z.coerce.number().int().min(2020),
  tanggal_penilaian: z.string().min(1, { message: 'Tanggal penilaian wajib diisi' }),
  level_saat_ini: z.string().min(1, { message: 'Level saat ini wajib diisi' }),
  rekomendasi_level: z.string().optional().nullable().default(''),
  status_kenaikan: z.enum(['Bertahan', 'Naik Level', 'Lulus Tingkat']).default('Bertahan'),
  status_dokumen: z.enum(['Draft', 'Final', 'Terkirim']).default('Draft'),
  catatan_umum: z.string().optional().nullable().default(''),
  catatan_pelatih: z.string().optional().nullable().default(''),
  catatan_head_coach: z.string().optional().nullable().default(''),
  detail_evaluasi: z.array(detailEvaluasiInputSchema).min(1, {
    message: 'Minimal sertakan 1 aspek teknik evaluasi renang',
  }),
});

export type SimpanLaporanInput = z.infer<typeof simpanLaporanSchema>;
export type DetailEvaluasiInput = z.infer<typeof detailEvaluasiInputSchema>;
