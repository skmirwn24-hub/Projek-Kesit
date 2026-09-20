import { z } from 'zod';

export const pelatihSchema = z.object({
  nama: z.string().min(1, 'Nama pelatih wajib diisi'),
  no_hp: z.string().optional().default(''),
  email: z.string().email('Format email tidak valid').optional().or(z.literal('')),
  alamat: z.string().optional().default(''),
  tanggal_lahir: z.string().optional().nullable(),
  pendidikan: z.string().optional().default(''),
  sertifikat: z.string().optional().default(''),
  status: z.enum(['Aktif', 'Training', 'Nonaktif']).default('Aktif'),
  tanggal_mulai_training: z.string().optional().nullable(),
  tanggal_berakhir_training: z.string().optional().nullable(),
});

export const updatePelatihSchema = pelatihSchema.extend({
  id: z.string().uuid('ID pelatih tidak valid'),
});

export type PelatihInput = z.infer<typeof pelatihSchema>;
export type UpdatePelatihInput = z.infer<typeof updatePelatihSchema>;
