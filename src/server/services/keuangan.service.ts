import { KesitRole } from '@/types/auth';
import { hasPermission } from '@/server/constants/roles';
import * as keuanganRepo from '@/server/repositories/keuangan.repository';
import {
  KasTransaksi,
  KasSummary,
  SiswaPembayaranRow,
  HonorKalkulasiPelatih,
  PengaturanHonorPelatih,
} from '@/types/keuangan';
import {
  CatatKasTransaksiInput,
  SoftDeleteKasTransaksiInput,
  BayarSppSiswaInput,
  UpdateTarifHonorInput,
  CairkanHonorInput,
} from '@/server/validators/keuangan.schema';

// --------------------------------------------------------
// 1. Kas Summary
// --------------------------------------------------------
export async function getKasSummary(userRole: KesitRole): Promise<KasSummary> {
  if (!hasPermission(userRole, 'keuangan:read')) {
    throw new Error('Akses ditolak: role Anda tidak memiliki izin melihat ringkasan keuangan.');
  }
  return keuanganRepo.getKasSummary();
}

// --------------------------------------------------------
// 2. Mutasi Kas Operasional
// --------------------------------------------------------
export async function getKasMutasi(
  userRole: KesitRole,
  options: keuanganRepo.QueryMutasiOptions = {}
): Promise<KasTransaksi[]> {
  if (!hasPermission(userRole, 'keuangan:read')) {
    throw new Error('Akses ditolak: role Anda tidak memiliki izin melihat mutasi kas.');
  }
  return keuanganRepo.getKasMutasi(options);
}

// --------------------------------------------------------
// 3. Audit Log Transaksi Dibatalkan (Khusus Owner)
// --------------------------------------------------------
export async function getAuditLog(userRole: KesitRole): Promise<KasTransaksi[]> {
  if (!hasPermission(userRole, 'keuangan:delete')) {
    throw new Error('Akses ditolak: Hanya Owner yang dapat mengakses audit log transaksi dibatalkan.');
  }
  return keuanganRepo.getAuditLogSoftDeleted();
}

// --------------------------------------------------------
// 4. Tambah Transaksi Kas
// --------------------------------------------------------
export async function createKasTransaksi(
  input: CatatKasTransaksiInput,
  userRole: KesitRole,
  adminName: string
): Promise<KasTransaksi> {
  if (!hasPermission(userRole, 'keuangan:write')) {
    throw new Error('Akses ditolak: role Anda tidak memiliki izin mencatat transaksi kas.');
  }

  return keuanganRepo.insertKasTransaksi({
    jenis_transaksi: input.jenis_transaksi,
    kategori: input.kategori,
    nominal: input.nominal,
    tanggal_transaksi: input.tanggal_transaksi,
    lokasi: input.lokasi,
    keterangan: input.keterangan,
    metode_pembayaran: input.metode_pembayaran,
    dibuat_oleh: adminName,
  });
}

// --------------------------------------------------------
// 5. Soft Delete Transaksi Kas (Khusus Owner)
// --------------------------------------------------------
export async function softDeleteKasTransaksi(
  input: SoftDeleteKasTransaksiInput,
  userRole: KesitRole
): Promise<{ success: boolean; id: string; deleted_by: string; alasan_hapus: string }> {
  if (!hasPermission(userRole, 'keuangan:delete')) {
    throw new Error('Akses ditolak: Hanya Owner yang berhak membatalkan/menghapus transaksi kas.');
  }

  return keuanganRepo.softDeleteKasTransaksi(input.transaksi_id, input.alasan);
}

// --------------------------------------------------------
// 6. Bayar SPP Siswa (Pelatih, Admin, Owner)
// --------------------------------------------------------
export async function processBayarSpp(
  input: BayarSppSiswaInput,
  userRole: KesitRole,
  pelatihId: string | null | undefined,
  adminName: string
): Promise<{
  success: boolean;
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
}> {
  // Cek permission: Pelatih butuh pembayaran:koleksi_siswa, Admin/Owner butuh pembayaran:write atau keuangan:write
  if (userRole === 'Pelatih') {
    if (!hasPermission(userRole, 'pembayaran:koleksi_siswa')) {
      throw new Error('Akses ditolak: Anda tidak diizinkan mencatat pembayaran SPP.');
    }
    // Paksa jalur titip pelatih dan penerima = pelatihId
    input.jalur = 'Titip Pelatih';
    input.penerima_pelatih_id = pelatihId || null;
  } else if (!hasPermission(userRole, 'keuangan:write') && !hasPermission(userRole, 'pembayaran:write')) {
    throw new Error('Akses ditolak: role Anda tidak memiliki izin mencatat pembayaran.');
  }

  return keuanganRepo.bayarSppSiswa({
    siswa_id: input.siswa_id,
    nominal: input.nominal,
    metode: input.metode,
    tanggal: input.tanggal,
    jalur: input.jalur,
    penerima_pelatih_id: input.penerima_pelatih_id,
    admin_penerima: adminName,
    catatan: input.catatan,
  });
}

// --------------------------------------------------------
// 7. Tabel Daftar Pembayaran Siswa
// --------------------------------------------------------
export async function getSiswaPembayaran(
  userRole: KesitRole,
  pelatihId: string | null | undefined,
  options: { search?: string; status?: string; lokasi?: string; pelatihIdFilter?: string } = {}
): Promise<SiswaPembayaranRow[]> {
  // Baik Pelatih, Admin, maupun Owner boleh memanggil fungsi ini (dengan scope masing-masing)
  return keuanganRepo.getSiswaPembayaranList(userRole, pelatihId, options);
}

// --------------------------------------------------------
// 8. Kalkulasi Honor Pelatih
// --------------------------------------------------------
export async function getHonorKalkulasi(
  userRole: KesitRole,
  bulan: number,
  tahun: number
): Promise<HonorKalkulasiPelatih[]> {
  if (!hasPermission(userRole, 'keuangan:read') && !hasPermission(userRole, 'honor:manage')) {
    throw new Error('Akses ditolak: Anda tidak memiliki izin melihat data honor pelatih.');
  }
  return keuanganRepo.getHonorPelatihKalkulasi(bulan, tahun);
}

// --------------------------------------------------------
// 9. Simpan Tarif Honor (Khusus Owner)
// --------------------------------------------------------
export async function updateTarifHonor(
  input: UpdateTarifHonorInput,
  userRole: KesitRole
): Promise<PengaturanHonorPelatih> {
  if (!hasPermission(userRole, 'honor:manage')) {
    throw new Error('Akses ditolak: Hanya Owner yang berhak mengubah konfigurasi tarif honor pelatih.');
  }

  return keuanganRepo.upsertTarifHonor(
    input.pelatih_id,
    input.tarif_per_anak,
    input.kategori_kelas,
    input.keterangan || ''
  );
}

// --------------------------------------------------------
// 10. Cairkan Honor Pelatih (Khusus Owner)
// --------------------------------------------------------
export async function cairkanHonor(
  input: CairkanHonorInput,
  userRole: KesitRole,
  adminName: string
): Promise<{ success: boolean; nomor_slip: string; kas_transaksi_id: string }> {
  if (!hasPermission(userRole, 'honor:manage')) {
    throw new Error('Akses ditolak: Hanya Owner yang berhak mencairkan honor pelatih ke buku kas.');
  }

  return keuanganRepo.cairkanHonorPelatih(input, adminName);
}
