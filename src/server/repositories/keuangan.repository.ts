import { createClient } from '@/server/supabase/server';
import {
  KasTransaksi,
  KasSummary,
  SiswaPembayaranRow,
  HonorKalkulasiPelatih,
  PengaturanHonorPelatih,
} from '@/types/keuangan';
import { KesitRole } from '@/types/auth';

// --------------------------------------------------------
// 1. Kas Summary
// --------------------------------------------------------
export async function getKasSummary(): Promise<KasSummary> {
  const supabase = await createClient();

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  const startOfMonthStr = startOfMonth.toISOString().split('T')[0];

  // 1. Query mutasi kas aktif
  const { data: kasData, error: kasError } = await supabase
    .from('kas_transaksi')
    .select('nominal, jenis_transaksi, tanggal_transaksi')
    .eq('is_deleted', false);

  if (kasError) {
    console.error('Error fetching kas_transaksi summary:', kasError);
  }

  let totalMasuk = 0;
  let totalKeluar = 0;
  let transaksiBulanIni = 0;

  (kasData || []).forEach((row) => {
    const nom = Number(row.nominal) || 0;
    if (row.jenis_transaksi === 'Masuk') {
      totalMasuk += nom;
    } else if (row.jenis_transaksi === 'Keluar') {
      totalKeluar += nom;
    }
    if (row.tanggal_transaksi >= startOfMonthStr) {
      transaksiBulanIni++;
    }
  });

  const saldoKas = totalMasuk - totalKeluar;

  // 2. Query total piutang siswa (dari paket aktif dan pembayaran)
  const { data: siswaData } = await supabase
    .from('v_rekapan_siswa')
    .select('sisa_tagihan, status_pembayaran');

  let totalPiutangSiswa = 0;
  (siswaData || []).forEach((row) => {
    if (row.status_pembayaran === 'Belum Lunas') {
      totalPiutangSiswa += Number(row.sisa_tagihan) || 0;
    }
  });

  return {
    saldoKas,
    totalMasuk,
    totalKeluar,
    transaksiBulanIni,
    totalPiutangSiswa,
  };
}

// --------------------------------------------------------
// 2. Mutasi Kas (Buku Kas Operasional)
// --------------------------------------------------------
export interface QueryMutasiOptions {
  startDate?: string;
  endDate?: string;
  jenis?: 'Masuk' | 'Keluar' | 'Semua';
  kategori?: string;
  lokasi?: string;
  search?: string;
}

export async function getKasMutasi(options: QueryMutasiOptions = {}): Promise<KasTransaksi[]> {
  const supabase = await createClient();

  let query = supabase
    .from('kas_transaksi')
    .select('*')
    .eq('is_deleted', false)
    .order('tanggal_transaksi', { ascending: false })
    .order('created_at', { ascending: false });

  if (options.startDate) {
    query = query.gte('tanggal_transaksi', options.startDate);
  }
  if (options.endDate) {
    query = query.lte('tanggal_transaksi', options.endDate);
  }
  if (options.jenis && options.jenis !== 'Semua') {
    query = query.eq('jenis_transaksi', options.jenis);
  }
  if (options.kategori && options.kategori !== 'Semua') {
    query = query.eq('kategori', options.kategori);
  }
  if (options.lokasi && options.lokasi !== 'Semua') {
    query = query.eq('lokasi', options.lokasi);
  }
  if (options.search && options.search.trim() !== '') {
    const s = `%${options.search.trim()}%`;
    query = query.or(`nomor_transaksi.ilike.${s},keterangan.ilike.${s},dibuat_oleh.ilike.${s}`);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching kas_mutasi:', error);
    throw new Error(error.message || 'Gagal memuat mutasi kas.');
  }

  return (data || []) as KasTransaksi[];
}

// --------------------------------------------------------
// 3. Audit Log Transaksi Dibatalkan (Soft Deleted)
// --------------------------------------------------------
export async function getAuditLogSoftDeleted(): Promise<KasTransaksi[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('kas_transaksi')
    .select('*')
    .eq('is_deleted', true)
    .order('deleted_at', { ascending: false });

  if (error) {
    console.error('Error fetching audit soft deleted kas:', error);
    throw new Error(error.message || 'Gagal memuat log transaksi dibatalkan.');
  }

  return (data || []) as KasTransaksi[];
}

// --------------------------------------------------------
// 4. Catat Kas Transaksi Baru
// --------------------------------------------------------
export async function insertKasTransaksi(data: {
  jenis_transaksi: 'Masuk' | 'Keluar';
  kategori: string;
  nominal: number;
  tanggal_transaksi: string;
  lokasi?: string | null;
  keterangan?: string | null;
  metode_pembayaran: string;
  dibuat_oleh: string;
}): Promise<KasTransaksi> {
  const supabase = await createClient();

  const prefix = data.jenis_transaksi === 'Masuk' ? 'KM' : 'KK';
  const dateStr = data.tanggal_transaksi.replace(/-/g, '');
  const rand = Math.floor(1000 + Math.random() * 9000);
  const nomorTransaksi = `${prefix}-${dateStr}-${rand}`;

  const { data: inserted, error } = await supabase
    .from('kas_transaksi')
    .insert({
      nomor_transaksi: nomorTransaksi,
      tanggal_transaksi: data.tanggal_transaksi,
      jenis_transaksi: data.jenis_transaksi,
      kategori: data.kategori,
      nominal: data.nominal,
      lokasi: data.lokasi || null,
      keterangan: data.keterangan || null,
      metode_pembayaran: data.metode_pembayaran || 'Tunai',
      dibuat_oleh: data.dibuat_oleh,
    })
    .select('*')
    .single();

  if (error) {
    console.error('Error inserting kas_transaksi:', error);
    throw new Error(error.message || 'Gagal menyimpan transaksi kas.');
  }

  return inserted as KasTransaksi;
}

// --------------------------------------------------------
// 5. Soft Delete Kas Transaksi
// --------------------------------------------------------
export async function softDeleteKasTransaksi(
  transaksiId: string,
  alasan: string
): Promise<{ success: boolean; id: string; deleted_by: string; alasan_hapus: string }> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('kesit_soft_delete_kas_transaksi', {
    p_transaksi_id: transaksiId,
    p_alasan: alasan,
  });

  if (error) {
    console.error('Error in kesit_soft_delete_kas_transaksi:', error);
    throw new Error(error.message || 'Gagal membatalkan transaksi kas.');
  }

  return data;
}

// --------------------------------------------------------
// 6. Bayar SPP Siswa (Atomik)
// --------------------------------------------------------
export async function bayarSppSiswa(input: {
  siswa_id: string;
  nominal: number;
  metode: string;
  tanggal: string;
  jalur: 'Admin / Kasir' | 'Titip Pelatih';
  penerima_pelatih_id?: string | null;
  admin_penerima: string;
  catatan?: string;
}): Promise<{
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
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('kesit_bayar_spp_siswa', {
    p_siswa_id: input.siswa_id,
    p_nominal: input.nominal,
    p_metode: input.metode,
    p_tanggal: input.tanggal,
    p_jalur: input.jalur,
    p_penerima_pelatih_id: input.penerima_pelatih_id || null,
    p_admin_penerima: input.admin_penerima,
    p_catatan: input.catatan || '',
  });

  if (error) {
    console.error('Error in kesit_bayar_spp_siswa RPC:', error);
    throw new Error(error.message || 'Gagal memproses pembayaran SPP.');
  }

  return data;
}

// --------------------------------------------------------
// 7. Tabel Pembayaran Siswa (Daftar Murid)
// --------------------------------------------------------
export async function getSiswaPembayaranList(
  role: KesitRole,
  pelatihId?: string | null,
  options: { search?: string; status?: string; lokasi?: string; pelatihIdFilter?: string } = {}
): Promise<SiswaPembayaranRow[]> {
  const supabase = await createClient();

  const viewName = role === 'Pelatih' ? 'v_rekapan_siswa_pelatih' : 'v_rekapan_siswa';

  let query = supabase
    .from(viewName)
    .select(`
      id,
      id_siswa,
      nama_lengkap,
      nama_panggilan,
      nama_wali,
      no_hp_wali,
      lokasi,
      kelas,
      nama_paket,
      pelatih_pemilik,
      pelatih_pemilik_id,
      total_tagihan,
      nominal_dibayar,
      sisa_tagihan,
      status_pembayaran,
      tanggal_daftar,
      paket_siswa_id
    `)
    .order('nama_lengkap', { ascending: true });

  // Jika Pelatih, v_rekapan_siswa_pelatih otomatis memfilter via database RLS.
  // Jika filter pelatih dipilih oleh Admin/Owner:
  if (role !== 'Pelatih' && options.pelatihIdFilter && options.pelatihIdFilter !== 'Semua') {
    query = query.or(`pelatih_pemilik_id.eq.${options.pelatihIdFilter},pelatih_pemilik.eq.${options.pelatihIdFilter}`);
  }

  if (options.status && options.status !== 'Semua') {
    query = query.eq('status_pembayaran', options.status);
  }

  if (options.lokasi && options.lokasi !== 'Semua') {
    query = query.eq('lokasi', options.lokasi);
  }

  if (options.search && options.search.trim() !== '') {
    const s = `%${options.search.trim()}%`;
    query = query.or(`nama_lengkap.ilike.${s},id_siswa.ilike.${s},nama_wali.ilike.${s}`);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching siswa pembayaran list:', error);
    throw new Error(error.message || 'Gagal memuat daftar pembayaran siswa.');
  }

  return (data || []).map((row) => ({
    siswa_id: row.id,
    id_siswa: row.id_siswa,
    nama_lengkap: row.nama_lengkap,
    nama_panggilan: row.nama_panggilan,
    nama_wali: row.nama_wali,
    no_hp_wali: row.no_hp_wali,
    lokasi: row.lokasi,
    kelas: row.kelas,
    nama_paket: row.nama_paket,
    pelatih_pemilik_id: row.pelatih_pemilik_id,
    nama_pelatih_pemilik: row.pelatih_pemilik,
    total_tagihan: Number(row.total_tagihan) || 0,
    nominal_dibayar: Number(row.nominal_dibayar) || 0,
    sisa_tagihan: Number(row.sisa_tagihan) || 0,
    status_pembayaran: (row.status_pembayaran as 'Lunas' | 'Belum Lunas') || 'Belum Lunas',
    tanggal_daftar: row.tanggal_daftar,
    paket_siswa_id: row.paket_siswa_id,
  }));
}

// --------------------------------------------------------
// 8. Rekap & Kalkulasi Honor Pelatih per Anak Hadir
// --------------------------------------------------------
export async function getHonorPelatihKalkulasi(
  bulan: number,
  tahun: number
): Promise<HonorKalkulasiPelatih[]> {
  const supabase = await createClient();

  // 1. Ambil daftar semua pelatih aktif
  const { data: pelatihList, error: pErr } = await supabase
    .from('pelatih')
    .select('id, nama, status')
    .neq('status', 'Nonaktif')
    .order('nama', { ascending: true });

  if (pErr) {
    console.error('Error fetching pelatih list for honor:', pErr);
    throw new Error(pErr.message || 'Gagal memuat daftar pelatih.');
  }

  // 2. Ambil pengaturan tarif
  const { data: tarifSettings } = await supabase
    .from('pengaturan_honor_pelatih')
    .select('*');

  const tarifMap = new Map<string, number>();
  (tarifSettings || []).forEach((t) => {
    tarifMap.set(`${t.pelatih_id}_${t.kategori_kelas}`, Number(t.tarif_per_anak));
    if (t.kategori_kelas === 'Semua') {
      tarifMap.set(`${t.pelatih_id}_default`, Number(t.tarif_per_anak));
    }
  });

  // 3. Ambil absensi siswa hadir pada bulan & tahun terpilih
  const startDate = `${tahun}-${String(bulan).padStart(2, '0')}-01`;
  const nextMonth = bulan === 12 ? 1 : bulan + 1;
  const nextYear = bulan === 12 ? tahun + 1 : tahun;
  const endDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;

  const { data: absensiRows, error: aErr } = await supabase
    .from('absensi_siswa')
    .select('pelatih_id, siswa_id, kategori, status_hadir, tanggal')
    .eq('status_hadir', 'Hadir')
    .gte('tanggal', startDate)
    .lt('tanggal', endDate);

  if (aErr) {
    console.error('Error fetching absensi for honor calculation:', aErr);
  }

  // Hitung jumlah anak hadir per pelatih
  const countMap = new Map<string, number>();
  (absensiRows || []).forEach((a) => {
    if (a.pelatih_id) {
      countMap.set(a.pelatih_id, (countMap.get(a.pelatih_id) || 0) + 1);
    }
  });

  // 4. Ambil status pencairan honor bulan ini
  const { data: pencairanList } = await supabase
    .from('pencairan_honor_pelatih')
    .select('id, nomor_slip, pelatih_id, status, nominal_final')
    .eq('periode_bulan', startDate);

  const cairMap = new Map<string, { id: string; nomor_slip: string; status: 'Draft' | 'Disetujui' | 'Dicairkan' }>();
  (pencairanList || []).forEach((pc) => {
    cairMap.set(pc.pelatih_id, {
      id: pc.id,
      nomor_slip: pc.nomor_slip,
      status: pc.status as 'Draft' | 'Disetujui' | 'Dicairkan',
    });
  });

  const DEFAULT_TARIF = 15000;

  return (pelatihList || []).map((p) => {
    const totalAnak = countMap.get(p.id) || 0;
    const tarifDasar = tarifMap.get(`${p.id}_default`) ?? DEFAULT_TARIF;
    const nominalKalkulasi = totalAnak * tarifDasar;
    const existingCair = cairMap.get(p.id);

    return {
      pelatih_id: p.id,
      nama_pelatih: p.nama,
      total_siswa_diajar: totalAnak,
      tarif_dasar: tarifDasar,
      nominal_kalkulasi: nominalKalkulasi,
      status_cair: existingCair?.status || 'Draft',
      slip_id: existingCair?.id || null,
      nomor_slip: existingCair?.nomor_slip || null,
    };
  });
}

// --------------------------------------------------------
// 9. Update Pengaturan Tarif Honor
// --------------------------------------------------------
export async function upsertTarifHonor(
  pelatihId: string,
  tarifPerAnak: number,
  kategoriKelas: string = 'Semua',
  keterangan: string = ''
): Promise<PengaturanHonorPelatih> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('pengaturan_honor_pelatih')
    .upsert(
      {
        pelatih_id: pelatihId,
        kategori_kelas: kategoriKelas,
        tarif_per_anak: tarifPerAnak,
        keterangan: keterangan || null,
      },
      { onConflict: 'pelatih_id,kategori_kelas' }
    )
    .select('*')
    .single();

  if (error) {
    console.error('Error upserting tarif honor:', error);
    throw new Error(error.message || 'Gagal menyimpan tarif honor pelatih.');
  }

  return data as PengaturanHonorPelatih;
}

// --------------------------------------------------------
// 10. Cairkan Honor Pelatih (Khusus Owner)
// --------------------------------------------------------
export async function cairkanHonorPelatih(
  input: {
    pelatih_id: string;
    periode_bulan: string;
    total_siswa_diajar: number;
    tarif_dasar: number;
    nominal_kalkulasi: number;
    nominal_penyesuaian: number;
    nominal_final: number;
    catatan: string;
  },
  adminName: string
): Promise<{ success: boolean; nomor_slip: string; kas_transaksi_id: string }> {
  const supabase = await createClient();

  // 1. Ambil nama pelatih
  const { data: pData } = await supabase
    .from('pelatih')
    .select('nama')
    .eq('id', input.pelatih_id)
    .single();

  const namaPelatih = pData?.nama || 'Pelatih';

  // 2. Generate nomor slip & nomor kas
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(1000 + Math.random() * 9000);
  const nomorSlip = `SLIP-${dateStr}-${rand}`;
  const nomorKas = `KK-${dateStr}-${rand}`;

  // 3. Insert ke kas_transaksi sebagai Kas Keluar
  const { data: kasInserted, error: kErr } = await supabase
    .from('kas_transaksi')
    .insert({
      nomor_transaksi: nomorKas,
      tanggal_transaksi: new Date().toISOString().split('T')[0],
      jenis_transaksi: 'Keluar',
      kategori: 'Honor Pelatih',
      nominal: input.nominal_final,
      keterangan: `Pembayaran Honor: ${namaPelatih} (${input.total_siswa_diajar} kehadiran anak) [${nomorSlip}]`,
      metode_pembayaran: 'Transfer',
      dibuat_oleh: adminName,
    })
    .select('id')
    .single();

  if (kErr || !kasInserted) {
    console.error('Error inserting kas transaksi for honor:', kErr);
    throw new Error(kErr?.message || 'Gagal membukukan kas keluar untuk honor.');
  }

  const kasTransaksiId = kasInserted.id;

  // 4. Insert / Upsert ke pencairan_honor_pelatih
  const { error: pErr } = await supabase
    .from('pencairan_honor_pelatih')
    .insert({
      nomor_slip: nomorSlip,
      pelatih_id: input.pelatih_id,
      periode_bulan: input.periode_bulan,
      total_siswa_diajar: input.total_siswa_diajar,
      tarif_dasar: input.tarif_dasar,
      nominal_kalkulasi: input.nominal_kalkulasi,
      nominal_penyesuaian: input.nominal_penyesuaian,
      nominal_final: input.nominal_final,
      catatan: input.catatan || '',
      status: 'Dicairkan',
      disetujui_oleh: adminName,
      kas_transaksi_id: kasTransaksiId,
    });

  if (pErr) {
    console.error('Error recording pencairan honor:', pErr);
    throw new Error(pErr.message || 'Gagal menyimpan data pencairan honor.');
  }

  return {
    success: true,
    nomor_slip: nomorSlip,
    kas_transaksi_id: kasTransaksiId,
  };
}
