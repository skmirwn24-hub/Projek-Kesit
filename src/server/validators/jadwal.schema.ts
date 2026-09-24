import { z } from 'zod';
import { HariJadwal } from '@/types/database';

export const jadwalPelatihSchema = z.object({
  pelatih_id: z.string().uuid({ message: 'Pelatih ID harus valid UUID' }),
  hari: z.enum(['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'], {
    required_error: 'Hari wajib dipilih',
  }),
  jam_mulai: z.string({ required_error: 'Jam mulai wajib dipilih' }),
  tempat: z.enum(['Pandantoyo, Danau Biru Albanawi', 'Baron, Cafe Fameliza', 'Baron, Taman Ono Kabe'], {
    required_error: 'Tempat wajib dipilih',
  }),
  kelas: z.enum(['Reguler', 'Private', 'Prestasi'], {
    required_error: 'Kelas wajib dipilih',
  }),
});

export type JadwalPelatihInput = z.infer<typeof jadwalPelatihSchema>;
