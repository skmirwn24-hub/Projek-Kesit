import { KesitRole } from '@/types/auth';
import { JadwalPelatih, JadwalPelatihView } from '@/types/database';
import { hasPermission } from '@/server/constants/roles';
import * as jadwalRepo from '@/server/repositories/jadwal.repository';
import { JadwalPelatihInput } from '@/server/validators/jadwal.schema';

export async function fetchJadwalList(): Promise<JadwalPelatihView[]> {
  return await jadwalRepo.getAllJadwal();
}

export async function fetchJadwalPelatih(pelatihId: string): Promise<JadwalPelatihView[]> {
  return await jadwalRepo.getJadwalByPelatih(pelatihId);
}

export async function addJadwal(
  input: JadwalPelatihInput,
  userRole: KesitRole,
  currentPelatihId?: string
): Promise<{ success: boolean; data?: JadwalPelatih; error?: string }> {
  // If Pelatih, they can only add for themselves
  if (userRole === 'Pelatih' && input.pelatih_id !== currentPelatihId) {
    return { success: false, error: 'Akses ditolak: Anda hanya bisa menambah jadwal untuk diri sendiri.' };
  }

  try {
    const result = await jadwalRepo.createJadwal(input);
    return { success: true, data: result };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal menambahkan jadwal.';
    return { success: false, error: message };
  }
}

export async function editJadwal(
  id: string,
  input: Partial<JadwalPelatihInput>,
  userRole: KesitRole,
  ownerPelatihId?: string,
  currentPelatihId?: string
): Promise<{ success: boolean; data?: JadwalPelatih; error?: string }> {
  if (userRole === 'Pelatih' && ownerPelatihId !== currentPelatihId) {
     return { success: false, error: 'Akses ditolak: Anda hanya bisa mengubah jadwal Anda sendiri.' };
  }

  try {
    const result = await jadwalRepo.updateJadwal(id, input);
    return { success: true, data: result };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal memperbarui jadwal.';
    return { success: false, error: message };
  }
}

export async function removeJadwal(
  id: string,
  userRole: KesitRole,
  ownerPelatihId?: string,
  currentPelatihId?: string
): Promise<{ success: boolean; error?: string }> {
  if (userRole === 'Pelatih' && ownerPelatihId !== currentPelatihId) {
    return { success: false, error: 'Akses ditolak: Anda hanya bisa menghapus jadwal Anda sendiri.' };
  }

  try {
    await jadwalRepo.deleteJadwal(id);
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal menghapus jadwal.';
    return { success: false, error: message };
  }
}
