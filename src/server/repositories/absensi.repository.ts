import { createClient } from '@/server/supabase/server';
import { AbsensiSiswaView, SiswaUntukAbsensiView, KategoriKelas } from '@/types/database';
import { AbsensiSiswaInput } from '@/server/validators/absensi.schema';

// --------------------------------------------------------
// getSiswaUntukAbsensi
// Ambil daftar siswa aktif milik pelatih tertentu per kategori,
// berikut status absensi untuk sesi/tanggal yang diminta.
// --------------------------------------------------------
export interface SiswaAbsensiEnriched extends SiswaUntukAbsensiView {
  absensi_id: string | null;
  status_hadir: 'Hadir' | 'Tidak Hadir' | null;
  pelatih_mengajar_id: string | null;
}

export async function getSiswaUntukAbsensi(
  pelatihPemilikId: string,
  kategori: KategoriKelas,
  bulan: number,
  tahun: number,
  nomorSesi?: number | null, // untuk Reguler/Private
  tanggal?: string | null    // untuk Prestasi (ISO date)
): Promise<SiswaAbsensiEnriched[]> {
  const supabase = await createClient();

  // 1. Ambil semua siswa aktif milik pelatih ini dengan kategori yang dipilih
  const { data: siswaList, error: siswaError } = await supabase
    .from('v_siswa_untuk_absensi')
    .select('*')
    .eq('pelatih_pemilik_id', pelatihPemilikId)
    .eq('kategori', kategori)
    .order('nama_lengkap', { ascending: true });

  if (siswaError) {
    console.error('Error fetching siswa untuk absensi:', siswaError);
    throw new Error(siswaError.message);
  }

  if (!siswaList || siswaList.length === 0) {
    return [];
  }

  const siswaIds = siswaList.map((s: SiswaUntukAbsensiView) => s.siswa_id);

  // 2. Ambil data absensi yang sudah ada untuk sesi/tanggal yang diminta
  let absensiQuery = supabase
    .from('absensi_siswa')
    .select('id, siswa_id, nomor_sesi, tanggal, status_hadir, pelatih_id')
    .in('siswa_id', siswaIds)
    .eq('kategori', kategori);

  if (kategori === 'Prestasi') {
    // Prestasi: filter by tanggal spesifik
    const targetDate = tanggal || new Date().toISOString().split('T')[0];
    absensiQuery = absensiQuery.eq('tanggal', targetDate).is('nomor_sesi', null);
  } else {
    // Reguler/Private: filter by bulan+tahun, dan nomor_sesi jika ada
    const firstDay = `${tahun}-${String(bulan).padStart(2, '0')}-01`;
    const lastDay = new Date(tahun, bulan, 0).toISOString().split('T')[0];
    absensiQuery = absensiQuery.gte('tanggal', firstDay).lte('tanggal', lastDay);
    if (nomorSesi != null) {
      absensiQuery = absensiQuery.eq('nomor_sesi', nomorSesi);
    }
  }

  const { data: absensiList, error: absensiError } = await absensiQuery;

  if (absensiError) {
    console.error('Error fetching absensi:', absensiError);
    throw new Error(absensiError.message);
  }

  // 3. Map absensi ke siswa
  const absensiMap = new Map<string, { id: string; status_hadir: 'Hadir' | 'Tidak Hadir'; pelatih_id: string | null }>();
  (absensiList || []).forEach((ab: {
    id: string;
    siswa_id: string;
    status_hadir: 'Hadir' | 'Tidak Hadir';
    pelatih_id: string | null;
  }) => {
    absensiMap.set(ab.siswa_id, {
      id: ab.id,
      status_hadir: ab.status_hadir,
      pelatih_id: ab.pelatih_id,
    });
  });

  return (siswaList as SiswaUntukAbsensiView[]).map((siswa) => {
    const existing = absensiMap.get(siswa.siswa_id);
    return {
      ...siswa,
      absensi_id: existing?.id ?? null,
      status_hadir: existing?.status_hadir ?? null,
      pelatih_mengajar_id: existing?.pelatih_id ?? null,
    };
  });
}

// --------------------------------------------------------
// getAbsensiByBulan
// Ambil rekap semua absensi dalam satu bulan per pelatih & kategori
// --------------------------------------------------------
export async function getAbsensiByBulan(
  pelatihPemilikId: string,
  kategori: KategoriKelas,
  bulan: number,
  tahun: number
): Promise<AbsensiSiswaView[]> {
  const supabase = await createClient();

  const firstDay = `${tahun}-${String(bulan).padStart(2, '0')}-01`;
  const lastDay = new Date(tahun, bulan, 0).toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('v_absensi_siswa')
    .select('*')
    .eq('pelatih_pemilik_id', pelatihPemilikId)
    .eq('kategori', kategori)
    .gte('tanggal', firstDay)
    .lte('tanggal', lastDay)
    .order('tanggal', { ascending: true })
    .order('nama_lengkap', { ascending: true });

  if (error) {
    console.error('Error fetching absensi by bulan:', error);
    throw new Error(error.message);
  }

  return (data || []) as AbsensiSiswaView[];
}

// --------------------------------------------------------
// getSemuaAbsensiByBulan
// Untuk Owner/Admin: rekap semua pelatih, semua kategori
// --------------------------------------------------------
export async function getSemuaAbsensiByBulan(
  bulan: number,
  tahun: number,
  filterPelatihId?: string | null,
  filterKategori?: KategoriKelas | null
): Promise<AbsensiSiswaView[]> {
  const supabase = await createClient();

  const firstDay = `${tahun}-${String(bulan).padStart(2, '0')}-01`;
  const lastDay = new Date(tahun, bulan, 0).toISOString().split('T')[0];

  let query = supabase
    .from('v_absensi_siswa')
    .select('*')
    .gte('tanggal', firstDay)
    .lte('tanggal', lastDay)
    .order('tanggal', { ascending: true });

  if (filterPelatihId) {
    query = query.eq('pelatih_pemilik_id', filterPelatihId);
  }

  if (filterKategori) {
    query = query.eq('kategori', filterKategori);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching semua absensi by bulan:', error);
    throw new Error(error.message);
  }

  return (data || []) as AbsensiSiswaView[];
}

// --------------------------------------------------------
// absenSiswa
// Panggil RPC kesit_absen_siswa (insert atau update)
// --------------------------------------------------------
export async function absenSiswa(
  input: AbsensiSiswaInput,
  dicatatOleh: string
): Promise<string> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('kesit_absen_siswa', {
    p_siswa_id:       input.siswa_id,
    p_paket_siswa_id: input.paket_siswa_id || null,
    p_pelatih_id:     input.pelatih_id || null,
    p_tanggal:        input.tanggal,
    p_nomor_sesi:     input.nomor_sesi ?? null,
    p_kategori:       input.kategori,
    p_status_hadir:   input.status_hadir,
    p_catatan:        input.catatan || null,
    p_dicatat_oleh:   dicatatOleh,
  });

  if (error) {
    console.error('Error calling kesit_absen_siswa:', error);
    throw new Error(error.message);
  }

  return data as string;
}

// --------------------------------------------------------
// batalkanAbsen
// Panggil RPC kesit_batalkan_absen
// --------------------------------------------------------
export async function batalkanAbsen(absensiId: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.rpc('kesit_batalkan_absen', {
    p_absensi_id: absensiId,
  });

  if (error) {
    console.error('Error calling kesit_batalkan_absen:', error);
    throw new Error(error.message);
  }
}

// --------------------------------------------------------
// getSesiTerpakaiBulanIni
// Hitung berapa sesi sudah terpakai per siswa di bulan ini (Reguler/Private)
// Return: Map<siswa_id, Set<nomor_sesi>>
// --------------------------------------------------------
export async function getSesiTerpakaiBulanIni(
  pelatihPemilikId: string,
  kategori: 'Reguler' | 'Private',
  bulan: number,
  tahun: number
): Promise<Map<string, Set<number>>> {
  const supabase = await createClient();

  const firstDay = `${tahun}-${String(bulan).padStart(2, '0')}-01`;
  const lastDay = new Date(tahun, bulan, 0).toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('absensi_siswa')
    .select('siswa_id, nomor_sesi')
    .eq('kategori', kategori)
    .not('nomor_sesi', 'is', null)
    .gte('tanggal', firstDay)
    .lte('tanggal', lastDay);

  if (error) {
    console.error('Error fetching sesi terpakai:', error);
    throw new Error(error.message);
  }

  // Filter hanya siswa milik pelatih ini
  const { data: siswaIds } = await supabase
    .from('siswa')
    .select('id')
    .eq('pelatih_pemilik_id', pelatihPemilikId)
    .eq('status_siswa', 'Aktif');

  const validSiswaIds = new Set((siswaIds || []).map((s: { id: string }) => s.id));

  const result = new Map<string, Set<number>>();
  (data || []).forEach((row: { siswa_id: string; nomor_sesi: number | null }) => {
    if (!validSiswaIds.has(row.siswa_id) || row.nomor_sesi == null) return;
    if (!result.has(row.siswa_id)) result.set(row.siswa_id, new Set());
    result.get(row.siswa_id)!.add(row.nomor_sesi);
  });

  return result;
}
