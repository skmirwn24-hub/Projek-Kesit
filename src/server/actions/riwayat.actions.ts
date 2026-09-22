'use server';

import { getCurrentUser } from '@/server/services/auth.service';
import { hasPermission } from '@/server/constants/roles';
import * as riwayatRepo from '@/server/repositories/riwayat.repository';
import { RiwayatPerubahanSiswa } from '@/types/database';

export async function getRiwayatAction(): Promise<{
  success: boolean;
  data?: RiwayatPerubahanSiswa[];
  error?: string;
}> {
  const { profile } = await getCurrentUser();
  if (!profile) {
    return { success: false, error: 'Sesi tidak valid, silakan login kembali.' };
  }

  if (!hasPermission(profile.role, 'riwayat:read')) {
    return { success: false, error: 'Akses ditolak: role Anda tidak diizinkan melihat riwayat.' };
  }

  try {
    const data = await riwayatRepo.getRiwayatPerubahanSiswa();
    return { success: true, data };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal memuat log riwayat.';
    return { success: false, error: message };
  }
}
