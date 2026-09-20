import { KesitRole } from '@/types/auth';
import { Pelatih } from '@/types/database';
import { hasPermission } from '@/server/constants/roles';
import * as pelatihRepo from '@/server/repositories/pelatih.repository';
import { PelatihInput } from '@/server/validators/pelatih.schema';

export async function fetchPelatihList(): Promise<Pelatih[]> {
  return pelatihRepo.getAllPelatih();
}

export async function addPelatih(
  input: PelatihInput,
  userRole: KesitRole
): Promise<{ success: boolean; data?: Pelatih; error?: string }> {
  if (!hasPermission(userRole, 'pelatih:write')) {
    return { success: false, error: 'Akses ditolak: role Anda tidak diizinkan menambah pelatih.' };
  }

  try {
    const result = await pelatihRepo.createPelatih(input);
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal menambahkan data pelatih.' };
  }
}

export async function editPelatih(
  id: string,
  input: PelatihInput,
  userRole: KesitRole
): Promise<{ success: boolean; data?: Pelatih; error?: string }> {
  if (!hasPermission(userRole, 'pelatih:write')) {
    return { success: false, error: 'Akses ditolak: role Anda tidak diizinkan mengubah data pelatih.' };
  }

  try {
    const result = await pelatihRepo.updatePelatih(id, input);
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal memperbarui data pelatih.' };
  }
}
