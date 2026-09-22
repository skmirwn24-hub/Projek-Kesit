'use client';

import useSWR from 'swr';
import { SWR_KEYS } from '@/lib/swr-keys';
import { getPenilaianAction } from '@/server/actions/penilaian.actions';
import { PenilaianPelatihView } from '@/types/database';

async function fetchPenilaian(): Promise<PenilaianPelatihView[]> {
  const res = await getPenilaianAction();
  if (!res.success || !res.data) {
    throw new Error(res.error || 'Gagal memuat penilaian pelatih.');
  }
  return res.data;
}

export function usePenilaian() {
  const { data, error, isLoading, isValidating, mutate } = useSWR<PenilaianPelatihView[]>(
    SWR_KEYS.PENILAIAN,
    fetchPenilaian
  );

  return {
    penilaian: data ?? [],
    isLoading,
    isValidating,
    error: error ? (error instanceof Error ? error.message : 'Terjadi kesalahan') : null,
    mutatePenilaian: mutate,
  };
}
