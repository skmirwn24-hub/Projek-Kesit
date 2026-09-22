'use client';

import useSWR from 'swr';
import { SWR_KEYS } from '@/lib/swr-keys';
import { getRekapanSiswaAction } from '@/server/actions/siswa.actions';
import { RekapanSiswaView } from '@/types/database';

async function fetchRekapanSiswa(): Promise<RekapanSiswaView[]> {
  const res = await getRekapanSiswaAction();
  if (!res.success || !res.data) {
    throw new Error(res.error || 'Gagal memuat rekapan siswa.');
  }
  return res.data;
}

export function useSiswaRekapan() {
  const { data, error, isLoading, isValidating, mutate } = useSWR<RekapanSiswaView[]>(
    SWR_KEYS.SISWA_REKAPAN,
    fetchRekapanSiswa
  );

  return {
    siswa: data ?? [],
    isLoading,
    isValidating,
    error: error ? (error instanceof Error ? error.message : 'Terjadi kesalahan') : null,
    mutateSiswa: mutate,
  };
}
