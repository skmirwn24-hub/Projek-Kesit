'use server';

import { getCurrentUser } from '@/server/services/auth.service';
import * as siswaService from '@/server/services/siswa.service';
import {
  pendaftaranSiswaSchema,
  editBiodataSiswaSchema,
  pindahKelasSiswaSchema,
  PendaftaranSiswaInput,
  EditBiodataSiswaInput,
  PindahKelasSiswaInput,
} from '@/server/validators/siswa.schema';
import { RekapanSiswaView } from '@/types/database';

export async function daftarSiswaAction(
  rawInput: PendaftaranSiswaInput
): Promise<{ success: boolean; siswaId?: string; idSiswa?: string; error?: string }> {
  const { profile } = await getCurrentUser();
  if (!profile) {
    return { success: false, error: 'Sesi tidak valid, silakan login kembali.' };
  }

  const parsed = pendaftaranSiswaSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || 'Data pendaftaran tidak valid.',
    };
  }

  return siswaService.registerSiswa(parsed.data, profile.role);
}

export async function editSiswaAction(
  rawInput: EditBiodataSiswaInput
): Promise<{ success: boolean; error?: string }> {
  const { profile } = await getCurrentUser();
  if (!profile) {
    return { success: false, error: 'Sesi tidak valid, silakan login kembali.' };
  }

  const parsed = editBiodataSiswaSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || 'Data edit siswa tidak valid.',
    };
  }

  return siswaService.updateSiswaBiodata(parsed.data, profile.role);
}

export async function pindahKelasAction(
  rawInput: PindahKelasSiswaInput
): Promise<{ success: boolean; error?: string }> {
  const { profile } = await getCurrentUser();
  if (!profile) {
    return { success: false, error: 'Sesi tidak valid, silakan login kembali.' };
  }

  const parsed = pindahKelasSiswaSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || 'Data pindah kelas tidak valid.',
    };
  }

  return siswaService.moveSiswaClass(parsed.data, profile.role);
}

export async function getPaginatedRekapanSiswaAction(
  options: {
    page?: number;
    pageSize?: number;
    search?: string;
    filterStatus?: string;
    filterLokasi?: string;
    filterKelas?: string;
    filterPelatih?: string;
  } = {}
): Promise<{
  success: boolean;
  data?: RekapanSiswaView[];
  totalCount?: number;
  totalPages?: number;
  page?: number;
  pageSize?: number;
  error?: string;
}> {
  const { profile } = await getCurrentUser();
  if (!profile) {
    return { success: false, error: 'Sesi tidak valid, silakan login kembali.' };
  }

  try {
    const result = await siswaService.fetchPaginatedRekapanSiswa(profile.role, options);
    return {
      success: true,
      data: result.data,
      totalCount: result.totalCount,
      totalPages: result.totalPages,
      page: result.page,
      pageSize: result.pageSize,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal memuat rekapan siswa.';
    return { success: false, error: message };
  }
}

export async function getRekapanSiswaAction(): Promise<{
  success: boolean;
  data?: RekapanSiswaView[];
  error?: string;
}> {
  const { profile } = await getCurrentUser();
  if (!profile) {
    return { success: false, error: 'Sesi tidak valid, silakan login kembali.' };
  }

  try {
    const data = await siswaService.fetchRekapanSiswa(profile.role, profile.pelatih_id);
    return { success: true, data };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal memuat rekapan siswa.';
    return { success: false, error: message };
  }
}
