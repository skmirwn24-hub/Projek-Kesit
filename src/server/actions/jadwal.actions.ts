'use server';

import { revalidatePath } from 'next/cache';
import { KesitRole } from '@/types/auth';
import { getSession } from '@/server/utils/supabase/server';
import { JadwalPelatihInput, jadwalPelatihSchema } from '@/server/validators/jadwal.schema';
import * as jadwalService from '@/server/services/jadwal.service';
import { z } from 'zod';

export async function createJadwalAction(input: JadwalPelatihInput) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: 'Unauthorized' };

    const role = (session.user.user_metadata?.role as KesitRole) || 'Pelatih';
    const currentPelatihId = session.user.user_metadata?.pelatih_id;
    
    // validate input
    const validated = jadwalPelatihSchema.parse(input);

    const result = await jadwalService.addJadwal(validated, role, currentPelatihId);
    if (result.success) {
      revalidatePath('/jadwal');
    }
    return result;
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan sistem.';
    return { success: false, error: message };
  }
}

export async function updateJadwalAction(id: string, input: Partial<JadwalPelatihInput>, ownerPelatihId: string) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: 'Unauthorized' };

    const role = (session.user.user_metadata?.role as KesitRole) || 'Pelatih';
    const currentPelatihId = session.user.user_metadata?.pelatih_id;
    
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
    const session = await getSession();
    if (!session) return { success: false, error: 'Unauthorized' };

    const role = (session.user.user_metadata?.role as KesitRole) || 'Pelatih';
    const currentPelatihId = session.user.user_metadata?.pelatih_id;
    
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
