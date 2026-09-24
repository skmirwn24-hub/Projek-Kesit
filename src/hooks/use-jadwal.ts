import useSWR from 'swr';
import { JadwalPelatihView } from '@/types/database';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useJadwal() {
  const { data, error, isLoading, mutate } = useSWR<{ success: boolean; data?: JadwalPelatihView[]; error?: string }>(
    '/api/jadwal',
    fetcher
  );

  return {
    jadwal: data?.success && data.data ? data.data : [],
    isLoading,
    error: error || data?.error,
    mutateJadwal: mutate,
  };
}
