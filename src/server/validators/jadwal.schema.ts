import { z } from 'zod';

export const HARI_OPTIONS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'] as const;
export const TEMPAT_OPTIONS = [
  'Pandantoyo, Danau Biru Albanawi',
  'Baron, Cafe Fameliza',
  'Baron, Taman Ono Kabe',
] as const;
export const KELAS_OPTIONS = ['Reguler', 'Private', 'Prestasi'] as const;

export const jadwalPelatihSchema = z.object({
  pelatih_id: z.string().uuid('Pelatih ID harus valid UUID'),
  hari: z.enum(HARI_OPTIONS, { message: 'Hari wajib dipilih' }),
  jam_mulai: z.string().min(1, 'Jam mulai wajib dipilih'),
  tempat: z.enum(TEMPAT_OPTIONS, { message: 'Tempat wajib dipilih' }),
  kelas: z.enum(KELAS_OPTIONS, { message: 'Kelas wajib dipilih' }),
});

export type JadwalPelatihInput = z.infer<typeof jadwalPelatihSchema>;
