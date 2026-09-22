'use client';

import useSWR from 'swr';
import { SWR_KEYS } from '@/lib/swr-keys';
import { getRiwayatAction } from '@/server/actions/riwayat.actions';
import { RiwayatPerubahanSiswa } from '@/types/database';

async function fetchRiwayat(): Promise<RiwayatPerubahanSiswa[]> {
  const res = await getRiwayatAction();
  if (!res.success || !res.data) {
    throw new Error(res.error || 'Gagal memuat log riwayat.');
  }
  return res.data;
}

export function useRiwayat() {
  const { data, error, isLoading, isValidating, mutate } = useSWR<RiwayatPerubahanSiswa[]>(
    SWR_KEYS.RIWAYAT,
    fetchRiwayat
  );

  return {
    riwayat: data ?? [],
    isLoading,
    isValidating,
    error: error ? (error instanceof Error ? error.message : 'Terjadi kesalahan') : null,
    mutateRiwayat: mutate,
  };
}
