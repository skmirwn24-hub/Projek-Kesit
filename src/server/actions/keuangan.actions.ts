'use server';

import { getCurrentUser } from '@/server/services/auth.service';
import * as keuanganService from '@/server/services/keuangan.service';
import {
  catatKasTransaksiSchema,
  softDeleteKasTransaksiSchema,
  bayarSppSiswaSchema,
  updateTarifHonorSchema,
  cairkanHonorSchema,
  CatatKasTransaksiInput,
  SoftDeleteKasTransaksiInput,
  BayarSppSiswaInput,
  UpdateTarifHonorInput,
  CairkanHonorInput,
} from '@/server/validators/keuangan.schema';
import {
  KasTransaksi,
  KasSummary,
  SiswaPembayaranRow,
  HonorKalkulasiPelatih,
} from '@/types/keuangan';

// --------------------------------------------------------
// 1. Get Kas Summary
// --------------------------------------------------------
export async function getKasSummaryAction(): Promise<{
  success: boolean;
  data?: KasSummary;
  error?: string;
}> {
  const { profile } = await getCurrentUser();
  if (!profile) {
    return { success: false, error: 'Sesi tidak valid, silakan login kembali.' };
  }

  try {
    const data = await keuanganService.getKasSummary(profile.role);
    return { success: true, data };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal memuat ringkasan kas.';
    return { success: false, error: message };
  }
}

// --------------------------------------------------------
// 2. Get Kas Mutasi
// --------------------------------------------------------
export async function getKasMutasiAction(options: {
  startDate?: string;
  endDate?: string;
  jenis?: 'Masuk' | 'Keluar' | 'Semua';
  kategori?: string;
  lokasi?: string;
  search?: string;
} = {}): Promise<{
  success: boolean;
  data?: KasTransaksi[];
  error?: string;
}> {
  const { profile } = await getCurrentUser();
  if (!profile) {
    return { success: false, error: 'Sesi tidak valid, silakan login kembali.' };
  }

  try {
    const data = await keuanganService.getKasMutasi(profile.role, options);
    return { success: true, data };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal memuat mutasi kas.';
    return { success: false, error: message };
  }
}

// --------------------------------------------------------
// 3. Get Audit Log Soft Deleted (Khusus Owner)
// --------------------------------------------------------
export async function getAuditLogAction(): Promise<{
  success: boolean;
  data?: KasTransaksi[];
  error?: string;
}> {
  const { profile } = await getCurrentUser();
  if (!profile) {
    return { success: false, error: 'Sesi tidak valid, silakan login kembali.' };
  }

  try {
    const data = await keuanganService.getAuditLog(profile.role);
    return { success: true, data };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal memuat audit log.';
    return { success: false, error: message };
  }
}

// --------------------------------------------------------
// 4. Catat Transaksi Kas Baru
// --------------------------------------------------------
export async function catatKasTransaksiAction(
  rawInput: CatatKasTransaksiInput
): Promise<{
  success: boolean;
  data?: KasTransaksi;
  error?: string;
}> {
  const { profile } = await getCurrentUser();
  if (!profile) {
    return { success: false, error: 'Sesi tidak valid, silakan login kembali.' };
  }

  const parsed = catatKasTransaksiSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || 'Data transaksi kas tidak valid.',
    };
  }

  const adminName = profile.nama_tampilan || profile.username;

  try {
    const data = await keuanganService.createKasTransaksi(parsed.data, profile.role, adminName);
    return { success: true, data };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal menyimpan transaksi kas.';
    return { success: false, error: message };
  }
}

// --------------------------------------------------------
// 5. Soft Delete Transaksi Kas (Khusus Owner)
// --------------------------------------------------------
export async function softDeleteKasTransaksiAction(
  rawInput: SoftDeleteKasTransaksiInput
): Promise<{
  success: boolean;
  error?: string;
}> {
  const { profile } = await getCurrentUser();
  if (!profile) {
    return { success: false, error: 'Sesi tidak valid, silakan login kembali.' };
  }

  const parsed = softDeleteKasTransaksiSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || 'Data pembatalan tidak valid.',
    };
  }

  try {
    await keuanganService.softDeleteKasTransaksi(parsed.data, profile.role);
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal membatalkan transaksi kas.';
    return { success: false, error: message };
  }
}

// --------------------------------------------------------
// 6. Bayar SPP Siswa (Pelatih, Admin, Owner)
// --------------------------------------------------------
export async function bayarSppSiswaAction(
  rawInput: BayarSppSiswaInput
): Promise<{
  success: boolean;
  data?: {
    pembayaran_id: string;
    kas_transaksi_id: string;
    nomor_kuitansi: string;
    nomor_transaksi: string;
    sisa_tagihan: number;
    status_pembayaran: string;
    nama_siswa: string;
    kelas: string;
    nama_paket: string;
    lokasi: string;
  };
  error?: string;
}> {
  const { profile } = await getCurrentUser();
  if (!profile) {
    return { success: false, error: 'Sesi tidak valid, silakan login kembali.' };
  }

  const parsed = bayarSppSiswaSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || 'Data pembayaran tidak valid.',
    };
  }

  const adminName = profile.nama_tampilan || profile.username;

  try {
    const result = await keuanganService.processBayarSpp(
      parsed.data,
      profile.role,
      profile.pelatih_id,
      adminName
    );
    return { success: true, data: result };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal memproses pembayaran SPP.';
    return { success: false, error: message };
  }
}

// --------------------------------------------------------
// 7. Get Daftar Siswa Pembayaran
// --------------------------------------------------------
export async function getSiswaPembayaranAction(options: {
  search?: string;
  status?: string;
  lokasi?: string;
  pelatihIdFilter?: string;
} = {}): Promise<{
  success: boolean;
  data?: SiswaPembayaranRow[];
  error?: string;
}> {
  const { profile } = await getCurrentUser();
  if (!profile) {
    return { success: false, error: 'Sesi tidak valid, silakan login kembali.' };
  }

  try {
    const data = await keuanganService.getSiswaPembayaran(
      profile.role,
      profile.pelatih_id,
      options
    );
    return { success: true, data };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal memuat data pembayaran siswa.';
    return { success: false, error: message };
  }
}

// --------------------------------------------------------
// 8. Get Honor Pelatih Kalkulasi
// --------------------------------------------------------
export async function getHonorPelatihKalkulasiAction(
  bulan: number,
  tahun: number
): Promise<{
  success: boolean;
  data?: HonorKalkulasiPelatih[];
  error?: string;
}> {
  const { profile } = await getCurrentUser();
  if (!profile) {
    return { success: false, error: 'Sesi tidak valid, silakan login kembali.' };
  }

  try {
    const data = await keuanganService.getHonorKalkulasi(profile.role, bulan, tahun);
    return { success: true, data };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal menghitung honor pelatih.';
    return { success: false, error: message };
  }
}

// --------------------------------------------------------
// 9. Update Tarif Honor Pelatih (Khusus Owner)
// --------------------------------------------------------
export async function updateTarifHonorAction(
  rawInput: UpdateTarifHonorInput
): Promise<{
  success: boolean;
  error?: string;
}> {
  const { profile } = await getCurrentUser();
  if (!profile) {
    return { success: false, error: 'Sesi tidak valid, silakan login kembali.' };
  }

  const parsed = updateTarifHonorSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || 'Data tarif honor tidak valid.',
    };
  }

  try {
    await keuanganService.updateTarifHonor(parsed.data, profile.role);
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal memperbarui tarif honor pelatih.';
    return { success: false, error: message };
  }
}

// --------------------------------------------------------
// 10. Cairkan Honor Pelatih (Khusus Owner)
// --------------------------------------------------------
export async function cairkanHonorPelatihAction(
  rawInput: CairkanHonorInput
): Promise<{
  success: boolean;
  data?: { nomor_slip: string; kas_transaksi_id: string };
  error?: string;
}> {
  const { profile } = await getCurrentUser();
  if (!profile) {
    return { success: false, error: 'Sesi tidak valid, silakan login kembali.' };
  }

  const parsed = cairkanHonorSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || 'Data pencairan honor tidak valid.',
    };
  }

  const adminName = profile.nama_tampilan || profile.username;

  try {
    const result = await keuanganService.cairkanHonor(parsed.data, profile.role, adminName);
    return { success: true, data: result };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal mencairkan honor pelatih.';
    return { success: false, error: message };
  }
}
