'use server';

import { getCurrentUser } from '@/server/services/auth.service';
import * as penilaianService from '@/server/services/penilaian.service';
import { penilaianSchema, PenilaianInput } from '@/server/validators/penilaian.schema';
import { PenilaianPelatihView } from '@/types/database';

export async function getPenilaianAction(): Promise<{
  success: boolean;
  data?: PenilaianPelatihView[];
  error?: string;
}> {
  try {
    const data = await penilaianService.fetchPenilaianList();
    return { success: true, data };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal memuat penilaian pelatih.';
    return { success: false, error: message };
  }
}

export async function submitPenilaianAction(
  rawInput: PenilaianInput
): Promise<{ success: boolean; error?: string }> {
  const { profile } = await getCurrentUser();
  if (!profile) {
    return { success: false, error: 'Sesi tidak valid, silakan login kembali.' };
  }

  const parsed = penilaianSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || 'Data penilaian tidak valid.',
    };
  }

  return penilaianService.submitPenilaian(parsed.data, profile.role);
}
