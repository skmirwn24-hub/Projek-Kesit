import { KesitRole } from '@/types/auth';
import { hasPermission } from '@/server/constants/roles';
import * as siswaRepo from '@/server/repositories/siswa.repository';
import {
  PendaftaranSiswaInput,
  EditBiodataSiswaInput,
  PindahKelasSiswaInput,
} from '@/server/validators/siswa.schema';
import { RekapanSiswaView } from '@/types/database';

export async function registerSiswa(
  input: PendaftaranSiswaInput,
  userRole: KesitRole
): Promise<{ success: boolean; siswaId?: string; idSiswa?: string; error?: string }> {
  if (!hasPermission(userRole, 'siswa:create')) {
    return { success: false, error: 'Akses ditolak: role Anda tidak diizinkan mendaftarkan siswa.' };
  }

  // Recalculate and enforce consistent server-side calculations
  const totalTagihan = input.harga_paket + input.biaya_request_pelatih - input.diskon;
  const sisaTagihan = Math.max(0, totalTagihan - input.nominal_dibayar);
  const statusPembayaran = input.nominal_dibayar >= totalTagihan ? 'Lunas' : 'Belum Lunas';

  const sanitizedInput: PendaftaranSiswaInput = {
    ...input,
    total_tagihan: totalTagihan,
    sisa_tagihan: sisaTagihan,
    status_pembayaran: statusPembayaran,
  };

  try {
    const result = await siswaRepo.daftarSiswaAwal(sanitizedInput);
    return {
      success: true,
      siswaId: result?.siswa_id,
      idSiswa: result?.id_siswa,
    };
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal mendaftarkan siswa.' };
  }
}

export async function updateSiswaBiodata(
  input: EditBiodataSiswaInput,
  userRole: KesitRole
): Promise<{ success: boolean; error?: string }> {
  if (!hasPermission(userRole, 'siswa:update')) {
    return { success: false, error: 'Akses ditolak: role Anda tidak diizinkan mengedit siswa.' };
  }

  try {
    await siswaRepo.editBiodataSiswa(input);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal memperbarui biodata siswa.' };
  }
}

export async function moveSiswaClass(
  input: PindahKelasSiswaInput,
  userRole: KesitRole
): Promise<{ success: boolean; error?: string }> {
  if (!hasPermission(userRole, 'siswa:move')) {
    return { success: false, error: 'Akses ditolak: role Anda tidak diizinkan memindahkan kelas.' };
  }

  const totalTagihan = input.harga_paket_baru + input.biaya_request_pelatih_baru - input.diskon_baru;
  const sanitizedInput: PindahKelasSiswaInput = {
    ...input,
    total_tagihan_baru: totalTagihan,
  };

  try {
    await siswaRepo.pindahKelasSiswa(sanitizedInput);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal memproses pindah kelas.' };
  }
}

export async function fetchRekapanSiswa(
  userRole: KesitRole,
  pelatihId?: string | null
): Promise<RekapanSiswaView[]> {
  const data = await siswaRepo.getRekapanSiswa(userRole, pelatihId);

  // If Pelatih, mask payment information for privacy / access control
  if (userRole === 'Pelatih') {
    return data.map((item) => ({
      ...item,
      harga_paket: 0,
      biaya_request_pelatih: 0,
      diskon: 0,
      total_tagihan: 0,
      nominal_dibayar: 0,
      sisa_tagihan: 0,
      status_pembayaran: null,
      metode_pembayaran: null,
      admin_penerima: null,
    }));
  }

  return data;
}
