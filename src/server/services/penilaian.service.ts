import { KesitRole } from '@/types/auth';
import { PenilaianPelatihView } from '@/types/database';
import { hasPermission } from '@/server/constants/roles';
import * as penilaianRepo from '@/server/repositories/penilaian.repository';
import { PenilaianInput } from '@/server/validators/penilaian.schema';

export async function fetchPenilaianList(): Promise<PenilaianPelatihView[]> {
  return penilaianRepo.getAllPenilaian();
}

export async function submitPenilaian(
  input: PenilaianInput,
  userRole: KesitRole
): Promise<{ success: boolean; error?: string }> {
  if (!hasPermission(userRole, 'penilaian:write')) {
    return { success: false, error: 'Akses ditolak: role Anda tidak diizinkan memberi penilaian.' };
  }

  try {
    await penilaianRepo.createPenilaian(input);
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal menyimpan penilaian pelatih.';
    return { success: false, error: message };
  }
}
