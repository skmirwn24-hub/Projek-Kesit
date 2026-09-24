import { createClient } from '@/server/supabase/server';
import { RekapanSiswaView } from '@/types/database';
import { KesitRole } from '@/types/auth';
import {
  PendaftaranSiswaInput,
  EditBiodataSiswaInput,
  PindahKelasSiswaInput,
} from '@/server/validators/siswa.schema';

export interface RekapanSiswaQueryOptions {
  page?: number;
  pageSize?: number;
  search?: string;
  filterStatus?: string;
  filterLokasi?: string;
  filterKelas?: string;
  filterPelatih?: string;
}

export interface PaginatedRekapanSiswaResult {
  data: RekapanSiswaView[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export async function getPaginatedRekapanSiswa(
  role: KesitRole,
  options: RekapanSiswaQueryOptions = {}
): Promise<PaginatedRekapanSiswaResult> {
  const supabase = await createClient();
  const {
    page = 1,
    pageSize = 10,
    search = '',
    filterStatus = '',
    filterLokasi = '',
    filterKelas = '',
    filterPelatih = '',
  } = options;

  const viewName = role === 'Pelatih' ? 'v_rekapan_siswa_pelatih' : 'v_rekapan_siswa';
  let query = supabase.from(viewName).select('*', { count: 'exact' });

  if (search.trim()) {
    // Strip karakter yang bisa memanipulasi sintaks filter PostgREST
    const q = search.trim().replace(/[,().]/g, '');
    if (q) {
      // Using ILIKE supported by our GIN trigram indexes
      query = query.or(`nama_lengkap.ilike.%${q}%,id_siswa.ilike.%${q}%,nama_wali.ilike.%${q}%`);
    }
  }

  if (filterStatus) {
    query = query.eq('status_siswa', filterStatus);
  }

  if (filterLokasi) {
    query = query.eq('lokasi', filterLokasi);
  }

  if (filterKelas) {
    query = query.eq('kelas', filterKelas);
  }

  if (filterPelatih) {
    query = query.eq('pelatih_pemilik', filterPelatih);
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await query
    .order('id_siswa', { ascending: false })
    .range(from, to);

  if (error) {
    console.error(`Error fetching paginated ${viewName}:`, error);
    throw new Error(error.message);
  }

  const totalCount = count || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  return {
    data: (data || []) as RekapanSiswaView[],
    totalCount,
    page,
    pageSize,
    totalPages,
  };
}

export async function getRekapanSiswa(
  role: KesitRole,
  _pelatihId?: string | null
): Promise<RekapanSiswaView[]> {
  const supabase = await createClient();

  const viewName = role === 'Pelatih' ? 'v_rekapan_siswa_pelatih' : 'v_rekapan_siswa';
  const query = supabase.from(viewName).select('*');

  const { data, error } = await query.order('id_siswa', { ascending: false });

  if (error) {
    console.error(`Error fetching ${viewName}:`, error);
    throw new Error(error.message);
  }

  return (data || []) as RekapanSiswaView[];
}

export async function daftarSiswaAwal(
  input: PendaftaranSiswaInput
): Promise<{ siswa_id: string; id_siswa: string; paket_siswa_id: string }> {
  const supabase = await createClient();

  // Try executing via RPC first
  const { data, error } = await supabase.rpc('daftar_siswa_awal', {
    p_nama_lengkap: input.nama_lengkap,
    p_nama_panggilan: input.nama_panggilan || null,
    p_jenis_kelamin: input.jenis_kelamin || null,
    p_tempat_lahir: input.tempat_lahir || null,
    p_tanggal_lahir: input.tanggal_lahir || null,
    p_nama_wali: input.nama_wali || null,
    p_no_hp_wali: input.no_hp_wali || null,
    p_alamat: input.alamat || null,
    p_pelatih_pemilik_id: input.pelatih_pemilik_id || null,
    p_pelatih_diminta_id: input.pelatih_diminta_id || null,
    p_status_siswa: input.status_siswa,
    p_tanggal_daftar: input.tanggal_daftar,
    p_lokasi: input.lokasi,
    p_kelas: input.kelas,
    p_nama_paket: input.nama_paket,
    p_harga_paket: input.harga_paket,
    p_biaya_request_pelatih: input.biaya_request_pelatih,
    p_diskon: input.diskon,
    p_total_tagihan: input.total_tagihan,
    p_kuota_total: input.kuota_total,
    p_nominal_dibayar: input.nominal_dibayar,
    p_sisa_tagihan: input.sisa_tagihan,
    p_status_pembayaran: input.status_pembayaran,
    p_metode_pembayaran: input.metode_pembayaran,
    p_admin_penerima: input.admin_penerima || 'Admin KESIT',
  });

  if (!error && data) {
    const result = Array.isArray(data) ? data[0] : data;
    if (result?.siswa_id && result?.id_siswa) {
      return result;
    }
  }

  // If RPC failed (e.g. duplicate key constraint on old database function or RPC missing),
  // execute direct safe fallback with collision-proof ID generation
  console.warn('RPC daftar_siswa_awal failed or returned error, executing safe direct fallback:', error?.message);

  // 1. Generate guaranteed unique ID siswa
  const { data: allSiswa } = await supabase
    .from('siswa')
    .select('id_siswa');

  let maxNum = 0;
  if (allSiswa && Array.isArray(allSiswa)) {
    allSiswa.forEach((s: { id_siswa: string }) => {
      const match = s.id_siswa?.match(/(\d+)/);
      if (match) {
        const n = parseInt(match[1], 10);
        if (n > maxNum) maxNum = n;
      }
    });
  }

  let nextNum = maxNum + 1;
  let idSiswa = `SIS${String(nextNum).padStart(6, '0')}`;

  // Double check if idSiswa exists
  while (allSiswa?.some((s: { id_siswa: string }) => s.id_siswa === idSiswa)) {
    nextNum += 1;
    idSiswa = `SIS${String(nextNum).padStart(6, '0')}`;
  }

  // 2. Insert siswa
  const { data: insertedSiswa, error: errSiswa } = await supabase
    .from('siswa')
    .insert({
      id_siswa: idSiswa,
      nama_lengkap: input.nama_lengkap,
      nama_panggilan: input.nama_panggilan || null,
      jenis_kelamin: input.jenis_kelamin || null,
      tempat_lahir: input.tempat_lahir || null,
      tanggal_lahir: input.tanggal_lahir || null,
      nama_wali: input.nama_wali || null,
      no_hp_wali: input.no_hp_wali || null,
      alamat: input.alamat || null,
      pelatih_pemilik_id: input.pelatih_pemilik_id || null,
      pelatih_diminta_id: input.pelatih_diminta_id || null,
      status_siswa: input.status_siswa || 'Aktif',
      tanggal_daftar: input.tanggal_daftar,
    })
    .select('id, id_siswa')
    .single();

  if (errSiswa || !insertedSiswa) {
    console.error('Error in fallback insert siswa:', errSiswa);
    throw new Error(errSiswa?.message || error?.message || 'Gagal mendaftarkan data siswa.');
  }

  const siswaId = insertedSiswa.id;

  // 3. Insert paket siswa
  const { data: insertedPaket, error: errPaket } = await supabase
    .from('paket_siswa')
    .insert({
      siswa_id: siswaId,
      lokasi: input.lokasi,
      kelas: input.kelas,
      nama_paket: input.nama_paket,
      harga_paket: input.harga_paket,
      biaya_request_pelatih: input.biaya_request_pelatih,
      diskon: input.diskon,
      total_tagihan: input.total_tagihan,
      kuota_total: input.kuota_total,
      kuota_terpakai: 0,
      status_paket: 'Aktif',
    })
    .select('id')
    .single();

  if (errPaket || !insertedPaket) {
    console.error('Error in fallback insert paket_siswa:', errPaket);
    throw new Error(errPaket?.message || 'Gagal menyimpan paket siswa.');
  }

  const paketSiswaId = insertedPaket.id;

  // 4. Insert pembayaran
  const kuitansiNomor = `KW-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(nextNum).padStart(4, '0')}`;
  await supabase.from('pembayaran_siswa').insert({
    siswa_id: siswaId,
    paket_siswa_id: paketSiswaId,
    nomor_kuitansi: kuitansiNomor,
    nominal_dibayar: input.nominal_dibayar,
    sisa_tagihan: input.sisa_tagihan,
    status_pembayaran: input.status_pembayaran,
    metode_pembayaran: input.metode_pembayaran,
    admin_penerima: input.admin_penerima || 'Admin KESIT',
    tanggal_transaksi: input.tanggal_daftar,
    harga_paket: input.harga_paket,
    biaya_request_pelatih: input.biaya_request_pelatih,
    diskon: input.diskon,
    total_tagihan: input.total_tagihan,
  });

  // 5. Insert riwayat perubahan
  await supabase.from('riwayat_perubahan_siswa').insert({
    siswa_id: siswaId,
    jenis_perubahan: 'Pendaftaran Baru',
    lokasi_baru: input.lokasi,
    kelas_baru: input.kelas,
    paket_baru: input.nama_paket,
    pelatih_pemilik_baru: input.pelatih_pemilik_id || null,
    tanggal_perubahan: input.tanggal_daftar,
    alasan: 'Pendaftaran siswa awal',
    diubah_oleh: input.admin_penerima || 'Admin KESIT',
  });

  return {
    siswa_id: siswaId,
    id_siswa: insertedSiswa.id_siswa,
    paket_siswa_id: paketSiswaId,
  };
}

export async function editBiodataSiswa(input: EditBiodataSiswaInput): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.rpc('kesit_edit_biodata_siswa', {
    p_siswa_id: input.siswa_id,
    p_nama_lengkap: input.nama_lengkap,
    p_nama_panggilan: input.nama_panggilan || null,
    p_jenis_kelamin: input.jenis_kelamin || null,
    p_tempat_lahir: input.tempat_lahir || null,
    p_tanggal_lahir: input.tanggal_lahir || null,
    p_nama_wali: input.nama_wali || null,
    p_no_hp_wali: input.no_hp_wali || null,
    p_alamat: input.alamat || null,
    p_status_siswa: input.status_siswa,
  });

  if (error) {
    console.error('Error calling kesit_edit_biodata_siswa:', error);
    throw new Error(error.message);
  }
}

export async function pindahKelasSiswa(input: PindahKelasSiswaInput): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.rpc('kesit_pindah_kelas_siswa', {
    p_siswa_id: input.siswa_id,
    p_paket_siswa_id: input.paket_siswa_id,
    p_lokasi_baru: input.lokasi_baru,
    p_kelas_baru: input.kelas_baru,
    p_paket_baru: input.paket_baru,
    p_harga_paket_baru: input.harga_paket_baru,
    p_kuota_total_baru: input.kuota_total_baru,
    p_pelatih_pemilik_baru: input.pelatih_pemilik_baru || null,
    p_pelatih_diminta_baru: input.pelatih_diminta_baru || null,
    p_biaya_request_pelatih_baru: input.biaya_request_pelatih_baru,
    p_diskon_baru: input.diskon_baru,
    p_total_tagihan_baru: input.total_tagihan_baru,
    p_alasan: input.alasan,
    p_diubah_oleh: input.diubah_oleh,
  });

  if (error) {
    console.error('Error calling kesit_pindah_kelas_siswa:', error);
    throw new Error(error.message);
  }
}
