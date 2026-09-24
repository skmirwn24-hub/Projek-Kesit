import { KesitRole } from '@/types/auth';
import { Pelatih } from '@/types/database';
import { hasPermission } from '@/server/constants/roles';
import * as pelatihRepo from '@/server/repositories/pelatih.repository';
import { PelatihInput } from '@/server/validators/pelatih.schema';

let cachedPelatih: { data: Pelatih[]; timestamp: number } | null = null;
const PELATIH_CACHE_TTL_MS = 60 * 1000; // 60 detik

export async function fetchPelatihList(): Promise<Pelatih[]> {
  const now = Date.now();
  if (cachedPelatih && now - cachedPelatih.timestamp < PELATIH_CACHE_TTL_MS) {
    return cachedPelatih.data;
  }
  const data = await pelatihRepo.getAllPelatih();
  cachedPelatih = { data, timestamp: now };
  return data;
}

export function invalidatePelatihCache(): void {
  cachedPelatih = null;
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
    invalidatePelatihCache();
    return { success: true, data: result };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal menambahkan data pelatih.';
    return { success: false, error: message };
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
    invalidatePelatihCache();
    return { success: true, data: result };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal memperbarui data pelatih.';
    return { success: false, error: message };
  }
}
