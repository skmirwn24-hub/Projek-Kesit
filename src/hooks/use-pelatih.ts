'use client';

import useSWR from 'swr';
import { SWR_KEYS } from '@/lib/swr-keys';
import { getPelatihAction } from '@/server/actions/pelatih.actions';
import { Pelatih } from '@/types/database';

async function fetchPelatih(): Promise<Pelatih[]> {
  const res = await getPelatihAction();
  if (!res.success || !res.data) {
    throw new Error(res.error || 'Gagal memuat data pelatih.');
  }
  return res.data;
}

export function usePelatih() {
  const { data, error, isLoading, isValidating, mutate } = useSWR<Pelatih[]>(
    SWR_KEYS.PELATIH,
    fetchPelatih
  );

  return {
    pelatih: data ?? [],
    isLoading,
    isValidating,
    error: error ? (error instanceof Error ? error.message : 'Terjadi kesalahan') : null,
    mutatePelatih: mutate,
  };
}
