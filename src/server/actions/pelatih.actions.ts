'use server';

import { getCurrentUser } from '@/server/services/auth.service';
import * as pelatihService from '@/server/services/pelatih.service';
import {
  pelatihSchema,
  updatePelatihSchema,
  PelatihInput,
  UpdatePelatihInput,
} from '@/server/validators/pelatih.schema';
import { Pelatih } from '@/types/database';

export async function getPelatihAction(): Promise<{
  success: boolean;
  data?: Pelatih[];
  error?: string;
}> {
  try {
    const data = await pelatihService.fetchPelatihList();
    return { success: true, data };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal memuat data pelatih.';
    return { success: false, error: message };
  }
}

export async function createPelatihAction(
  rawInput: PelatihInput
): Promise<{ success: boolean; data?: Pelatih; error?: string }> {
  const { profile } = await getCurrentUser();
  if (!profile) {
    return { success: false, error: 'Sesi tidak valid, silakan login kembali.' };
  }

  const parsed = pelatihSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || 'Data pelatih tidak valid.',
    };
  }

  return pelatihService.addPelatih(parsed.data, profile.role);
}

export async function updatePelatihAction(
  rawInput: UpdatePelatihInput
): Promise<{ success: boolean; data?: Pelatih; error?: string }> {
  const { profile } = await getCurrentUser();
  if (!profile) {
    return { success: false, error: 'Sesi tidak valid, silakan login kembali.' };
  }

  const parsed = updatePelatihSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || 'Data update pelatih tidak valid.',
    };
  }

  const { id, ...updateData } = parsed.data;
  return pelatihService.editPelatih(id, updateData, profile.role);
}
