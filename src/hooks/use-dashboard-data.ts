'use client';

import useSWR from 'swr';
import { SWR_KEYS } from '@/lib/swr-keys';
import { getDashboardStatsAction } from '@/server/actions/dashboard.actions';
import { getRekapanSiswaAction } from '@/server/actions/siswa.actions';
import { DashboardStats, RekapanSiswaView } from '@/types/database';

interface DashboardData {
  stats: DashboardStats | null;
  operasionalSiswa: RekapanSiswaView[];
}

async function fetchDashboardData(): Promise<DashboardData> {
  const [statsRes, siswaRes] = await Promise.all([
    getDashboardStatsAction(),
    getRekapanSiswaAction(),
  ]);

  if (!statsRes.success || !statsRes.data) {
    throw new Error(statsRes.error || 'Gagal memuat statistik dashboard.');
  }

  return {
    stats: statsRes.data,
    operasionalSiswa: siswaRes.success && siswaRes.data ? siswaRes.data.slice(0, 5) : [],
  };
}

export function useDashboardData() {
  const { data, error, isLoading, isValidating, mutate } = useSWR<DashboardData>(
    SWR_KEYS.DASHBOARD,
    fetchDashboardData
  );

  return {
    stats: data?.stats ?? null,
    operasionalSiswa: data?.operasionalSiswa ?? [],
    isLoading,
    isValidating,
    error: error ? (error instanceof Error ? error.message : 'Terjadi kesalahan') : null,
    mutateDashboard: mutate,
  };
}
