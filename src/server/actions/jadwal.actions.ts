'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/server/services/auth.service';
import { JadwalPelatihInput, jadwalPelatihSchema } from '@/server/validators/jadwal.schema';
import * as jadwalService from '@/server/services/jadwal.service';
import { z } from 'zod';

export async function createJadwalAction(input: JadwalPelatihInput) {
  try {
    const { profile } = await getCurrentUser();
    if (!profile) return { success: false, error: 'Unauthorized' };

    const role = profile.role;
    const currentPelatihId = profile.pelatih_id || undefined;
    
    // validate input
    const validated = jadwalPelatihSchema.parse(input);

    const result = await jadwalService.addJadwal(validated, role, currentPelatihId);
    if (result.success) {
      revalidatePath('/jadwal');
    }
    return result;
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message || 'Input tidak valid' };
    }
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan sistem.';
    return { success: false, error: message };
  }
}

export async function updateJadwalAction(id: string, input: Partial<JadwalPelatihInput>, ownerPelatihId: string) {
  try {
    const { profile } = await getCurrentUser();
    if (!profile) return { success: false, error: 'Unauthorized' };

    const role = profile.role;
    const currentPelatihId = profile.pelatih_id || undefined;
    
    const result = await jadwalService.editJadwal(id, input, role, ownerPelatihId, currentPelatihId);
    if (result.success) {
      revalidatePath('/jadwal');
    }
    return result;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan sistem.';
    return { success: false, error: message };
  }
}

export async function deleteJadwalAction(id: string, ownerPelatihId: string) {
  try {
    const { profile } = await getCurrentUser();
    if (!profile) return { success: false, error: 'Unauthorized' };

    const role = profile.role;
    const currentPelatihId = profile.pelatih_id || undefined;
    
    const result = await jadwalService.removeJadwal(id, role, ownerPelatihId, currentPelatihId);
    if (result.success) {
      revalidatePath('/jadwal');
    }
    return result;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan sistem.';
    return { success: false, error: message };
  }
}
