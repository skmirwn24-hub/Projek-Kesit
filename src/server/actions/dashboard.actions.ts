'use server';

import { getCurrentUser } from '@/server/services/auth.service';
import * as dashboardService from '@/server/services/dashboard.service';
import { DashboardStats } from '@/types/database';

export async function getDashboardStatsAction(): Promise<{
  success: boolean;
  data?: DashboardStats;
  error?: string;
}> {
  const { profile } = await getCurrentUser();
  if (!profile) {
    return { success: false, error: 'Sesi tidak valid, silakan login kembali.' };
  }

  try {
    const data = await dashboardService.getDashboardStats(profile.role, profile.pelatih_id);
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal memuat data statistik dashboard.' };
  }
}
