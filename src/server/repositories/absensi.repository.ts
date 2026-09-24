import { createClient } from '@/server/supabase/server';
import { AbsensiSiswaView, SiswaUntukAbsensiView, KategoriKelas } from '@/types/database';
import { AbsensiSiswaInput } from '@/server/validators/absensi.schema';

function isMissingSupabaseObject(error: { code?: string; message?: string } | null | undefined): boolean {
  if (!error) return false;

  const code = error.code ?? '';
  const message = error.message ?? '';

  return (
    code === '42P01' ||
    code === '42704' ||
    /does not exist|not found/i.test(message) && /absensi|v_siswa_untuk_absensi|v_absensi_siswa|kesit_absen_siswa|kesit_batalkan_absen/i.test(message)
  );
}

function getMissingAbsensiMessage(): string {
  return 'Tabel absensi belum dibuat di database Supabase. Jalankan migrasi absensi di Supabase SQL Editor (absensi_siswa, v_siswa_untuk_absensi, v_absensi_siswa, dan fungsi terkait).';
}

// --------------------------------------------------------
// getSiswaUntukAbsensi
// Ambil daftar siswa aktif milik pelatih tertentu per kategori,
// berikut status absensi untuk sesi/tanggal yang diminta.
// Dilengkapi fallback query langsung ke tabel siswa jika view belum ada.
// --------------------------------------------------------
export interface SiswaAbsensiEnriched extends SiswaUntukAbsensiView {
  absensi_id: string | null;
  status_hadir: 'Hadir' | 'Tidak Hadir' | null;
  pelatih_mengajar_id: string | null;
}

export async function getSiswaUntukAbsensi(
  pelatihPemilikId: string | null | undefined,
  kategori: KategoriKelas,
  bulan: number,
  tahun: number,
  nomorSesi?: number | null, // untuk Reguler/Private
  tanggal?: string | null    // untuk Prestasi (ISO date)
): Promise<SiswaAbsensiEnriched[]> {
  const supabase = await createClient();

  let siswaList: SiswaUntukAbsensiView[] = [];

  // 1. Coba ambil dari view v_siswa_untuk_absensi
  let viewQuery = supabase
    .from('v_siswa_untuk_absensi')
    .select('*')
    .eq('kategori', kategori)
    .order('nama_lengkap', { ascending: true });

  if (pelatihPemilikId && pelatihPemilikId !== 'ALL' && pelatihPemilikId.trim() !== '') {
    viewQuery = viewQuery.eq('pelatih_pemilik_id', pelatihPemilikId);
  }

  const { data: viewData, error: viewError } = await viewQuery;

  if (!viewError && viewData) {
    siswaList = viewData as SiswaUntukAbsensiView[];
  } else {
    // Fallback query langsung dari tabel siswa, paket_siswa, dan pelatih
    console.warn('v_siswa_untuk_absensi view not found or error, fallback to direct table query:', viewError?.message);

    let directQuery = supabase
      .from('siswa')
      .select(`
        id,
        id_siswa,
        nama_lengkap,
        nama_panggilan,
        pelatih_pemilik_id,
        pelatih:pelatih_pemilik_id (id, nama),
        paket_siswa (
          id,
          kelas,
          nama_paket,
          kuota_total,
          kuota_terpakai,
          status_paket,
          created_at
        )
      `)
      .eq('status_siswa', 'Aktif')
      .order('nama_lengkap', { ascending: true });

    if (pelatihPemilikId && pelatihPemilikId !== 'ALL' && pelatihPemilikId.trim() !== '') {
      directQuery = directQuery.eq('pelatih_pemilik_id', pelatihPemilikId);
    }

    const { data: rawSiswa, error: directError } = await directQuery;

    if (directError) {
      console.error('Error fetching direct siswa:', directError);
      if (isMissingSupabaseObject(directError)) {
        throw new Error(getMissingAbsensiMessage());
      }
      throw new Error(directError.message);
    }

    if (rawSiswa) {
      type RawSiswaItem = {
        id: string;
        id_siswa: string;
        nama_lengkap: string;
        nama_panggilan: string | null;
        pelatih_pemilik_id: string | null;
        pelatih?: { nama?: string } | null;
        paket_siswa?: Array<{
          id: string;
          kelas?: string | null;
          kuota_total?: number | null;
          kuota_terpakai?: number | null;
          nama_paket?: string | null;
          status_paket?: string | null;
        }> | null;
      };

      siswaList = (rawSiswa as unknown as RawSiswaItem[])
        .map((s) => {
          const pakets = Array.isArray(s.paket_siswa) ? s.paket_siswa : [];
          const activePaket = pakets.find((p) => p.status_paket === 'Aktif') || pakets[0];

          let derivedKategori: KategoriKelas = 'Reguler';
          const kelasStr = (activePaket?.kelas || '').toLowerCase();
          if (kelasStr.includes('private') && !kelasStr.includes('semi')) {
            derivedKategori = 'Private';
          } else if (kelasStr.includes('prestasi')) {
            derivedKategori = 'Prestasi';
          } else {
            derivedKategori = 'Reguler';
          }

          const coachName = s.pelatih?.nama || (Array.isArray(s.pelatih) ? s.pelatih[0]?.nama : null) || 'Belum Ditentukan';

          return {
            siswa_id: s.id,
            id_siswa: s.id_siswa,
            nama_lengkap: s.nama_lengkap,
            nama_panggilan: s.nama_panggilan,
            pelatih_pemilik_id: s.pelatih_pemilik_id,
            pelatih_pemilik: coachName,
            paket_siswa_id: activePaket?.id || s.id,
            kategori: derivedKategori,
            kuota_total: activePaket?.kuota_total ?? (derivedKategori === 'Private' ? 10 : derivedKategori === 'Prestasi' ? 16 : 6),
            kuota_terpakai: activePaket?.kuota_terpakai ?? 0,
            nama_paket: activePaket?.nama_paket ?? 'Paket Standar',
          };
        })
        .filter((s: SiswaUntukAbsensiView) => s.kategori === kategori);
    }
  }

  if (!siswaList || siswaList.length === 0) {
    return [];
  }

  const siswaIds = siswaList.map((s: SiswaUntukAbsensiView) => s.siswa_id);

  // 2. Ambil data absensi yang sudah ada untuk sesi/tanggal yang diminta
  const absensiMap = new Map<string, { id: string; status_hadir: 'Hadir' | 'Tidak Hadir'; pelatih_id: string | null }>();

  try {
    let absensiQuery = supabase
      .from('absensi_siswa')
      .select('id, siswa_id, nomor_sesi, tanggal, status_hadir, pelatih_id')
      .in('siswa_id', siswaIds)
      .eq('kategori', kategori);

    if (kategori === 'Prestasi') {
      const targetDate = tanggal || new Date().toISOString().split('T')[0];
      absensiQuery = absensiQuery.eq('tanggal', targetDate).is('nomor_sesi', null);
    } else {
      const firstDay = `${tahun}-${String(bulan).padStart(2, '0')}-01`;
      const lastDay = new Date(tahun, bulan, 0).toISOString().split('T')[0];
      absensiQuery = absensiQuery.gte('tanggal', firstDay).lte('tanggal', lastDay);
      if (nomorSesi != null) {
        absensiQuery = absensiQuery.eq('nomor_sesi', nomorSesi);
      }
    }

    const { data: absensiList, error: absensiError } = await absensiQuery;

    if (!absensiError && absensiList) {
      absensiList.forEach((ab: {
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
    }
  } catch (err) {
    console.warn('absensi_siswa table not ready yet, skipping existing status mapping:', err);
  }

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

  if (!error && data) {
    return data as AbsensiSiswaView[];
  }

  // Fallback direct query on absensi_siswa
  try {
    const { data: directData } = await supabase
      .from('absensi_siswa')
      .select(`
        id,
        siswa_id,
        paket_siswa_id,
        pelatih_id,
        tanggal,
        nomor_sesi,
        kategori,
        status_hadir,
        catatan,
        created_at,
        siswa:siswa_id (
          id_siswa,
          nama_lengkap,
          pelatih_pemilik_id,
          pelatih:pelatih_pemilik_id (nama)
        ),
        pelatih_mengajar:pelatih_id (nama)
      `)
      .eq('kategori', kategori)
      .gte('tanggal', firstDay)
      .lte('tanggal', lastDay)
      .order('tanggal', { ascending: true });

    if (directData) {
      type RawDirectAbsensiItem = {
        id: string;
        siswa_id: string;
        paket_siswa_id: string | null;
        pelatih_id: string | null;
        nomor_sesi: number | null;
        tanggal: string;
        kategori: KategoriKelas;
        status_hadir: 'Hadir' | 'Tidak Hadir';
        catatan: string | null;
        dicatat_oleh: string | null;
        created_at: string;
        siswa?: {
          id_siswa?: string;
          nama_lengkap?: string;
          nama_panggilan?: string | null;
          pelatih_pemilik_id?: string | null;
          pelatih?: { nama?: string } | null;
        } | null;
        pelatih_mengajar?: { nama?: string } | null;
        paket?: { kuota_total?: number | null; kuota_terpakai?: number | null } | null;
      };

      return (directData as unknown as RawDirectAbsensiItem[]).map((d) => ({
        id: d.id,
        siswa_id: d.siswa_id,
        id_siswa: d.siswa?.id_siswa || '-',
        nama_lengkap: d.siswa?.nama_lengkap || 'Siswa',
        nama_panggilan: d.siswa?.nama_panggilan || null,
        pelatih_pemilik_id: d.siswa?.pelatih_pemilik_id || null,
        pelatih_pemilik: d.siswa?.pelatih?.nama || '-',
        pelatih_id: d.pelatih_id || null,
        nama_pelatih_mengajar: d.pelatih_mengajar?.nama || '-',
        paket_siswa_id: d.paket_siswa_id,
        nomor_sesi: d.nomor_sesi,
        tanggal: d.tanggal,
        kategori: d.kategori,
        status_hadir: d.status_hadir,
        catatan: d.catatan,
        kuota_total: 0,
        kuota_terpakai: 0,
        dicatat_oleh: null,
        created_at: d.created_at,
      }));
    }
  } catch {
    // fallback returns empty
  }

  return [];
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

  if (filterPelatihId && filterPelatihId !== 'ALL') {
    query = query.eq('pelatih_pemilik_id', filterPelatihId);
  }

  if (filterKategori) {
    query = query.eq('kategori', filterKategori);
  }

  const { data, error } = await query;

  if (!error && data) {
    return data as AbsensiSiswaView[];
  }

  return [];
}

// --------------------------------------------------------
// absenSiswa
// Panggil RPC kesit_absen_siswa (insert atau update)
// dengan fallback direct insert/update jika RPC belum ada
// --------------------------------------------------------
export async function absenSiswa(
  input: AbsensiSiswaInput,
  dicatatOleh: string
): Promise<string> {
  const supabase = await createClient();

  // 1. Coba panggil RPC kesit_absen_siswa
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

  if (!error && data) {
    return data as string;
  }

  if (isMissingSupabaseObject(error)) {
    throw new Error(getMissingAbsensiMessage());
  }

  if (error) {
    if (/akses ditolak|permission denied|violates|bukan milik|hanya dapat/i.test(error.message)) {
      throw new Error(error.message);
    }
  }

  console.warn('kesit_absen_siswa RPC not available or failed, executing direct upsert:', error?.message);

  // 2. Direct fallback into absensi_siswa
  let checkQuery = supabase
    .from('absensi_siswa')
    .select('id, status_hadir')
    .eq('siswa_id', input.siswa_id)
    .eq('kategori', input.kategori);

  if (input.nomor_sesi != null) {
    const firstDay = `${input.tanggal.slice(0, 7)}-01`;
    const lastDay = `${input.tanggal.slice(0, 7)}-31`;
    checkQuery = checkQuery
      .eq('nomor_sesi', input.nomor_sesi)
      .gte('tanggal', firstDay)
      .lte('tanggal', lastDay);
  } else {
    checkQuery = checkQuery.eq('tanggal', input.tanggal);
  }

  const { data: existingRows } = await checkQuery.limit(1);
  const existing = existingRows && existingRows.length > 0 ? existingRows[0] : null;

  let absensiId = '';

  if (existing) {
    absensiId = existing.id;
    await supabase
      .from('absensi_siswa')
      .update({
        pelatih_id: input.pelatih_id || null,
        tanggal: input.tanggal,
        status_hadir: input.status_hadir,
        catatan: input.catatan || null,
        dicatat_oleh: dicatatOleh,
      })
      .eq('id', existing.id);

    // Update kuota jika status berubah
    if (existing.status_hadir !== input.status_hadir && input.paket_siswa_id) {
      const { data: pkt } = await supabase.from('paket_siswa').select('kuota_terpakai').eq('id', input.paket_siswa_id).single();
      const currentKuota = pkt?.kuota_terpakai || 0;
      const nextKuota = input.status_hadir === 'Hadir' ? currentKuota + 1 : Math.max(0, currentKuota - 1);
      await supabase.from('paket_siswa').update({ kuota_terpakai: nextKuota }).eq('id', input.paket_siswa_id);
    }
  } else {
    const { data: inserted, error: insertError } = await supabase
      .from('absensi_siswa')
      .insert({
        siswa_id: input.siswa_id,
        paket_siswa_id: input.paket_siswa_id || null,
        pelatih_id: input.pelatih_id || null,
        tanggal: input.tanggal,
        nomor_sesi: input.nomor_sesi ?? null,
        kategori: input.kategori,
        status_hadir: input.status_hadir,
        catatan: input.catatan || null,
        dicatat_oleh: dicatatOleh,
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('Direct insert absensi_siswa failed:', insertError);
      throw new Error(insertError.message || error?.message || 'Gagal menyimpan absensi siswa.');
    }

    absensiId = inserted.id;

    if (input.status_hadir === 'Hadir' && input.paket_siswa_id) {
      const { data: pkt } = await supabase.from('paket_siswa').select('kuota_terpakai').eq('id', input.paket_siswa_id).single();
      const currentKuota = pkt?.kuota_terpakai || 0;
      await supabase.from('paket_siswa').update({ kuota_terpakai: currentKuota + 1 }).eq('id', input.paket_siswa_id);
    }
  }

  return absensiId;
}

// --------------------------------------------------------
// batalkanAbsen
// Panggil RPC kesit_batalkan_absen atau direct fallback
// --------------------------------------------------------
export async function batalkanAbsen(absensiId: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.rpc('kesit_batalkan_absen', {
    p_absensi_id: absensiId,
  });

  if (!error) return;

  if (isMissingSupabaseObject(error)) {
    throw new Error(getMissingAbsensiMessage());
  }

  console.warn('kesit_batalkan_absen RPC not available, fallback to direct delete:', error.message);

  const { data: rec } = await supabase
    .from('absensi_siswa')
    .select('paket_siswa_id, status_hadir')
    .eq('id', absensiId)
    .single();

  await supabase.from('absensi_siswa').delete().eq('id', absensiId);

  if (rec && rec.status_hadir === 'Hadir' && rec.paket_siswa_id) {
    const { data: pkt } = await supabase.from('paket_siswa').select('kuota_terpakai').eq('id', rec.paket_siswa_id).single();
    const currentKuota = pkt?.kuota_terpakai || 0;
    await supabase.from('paket_siswa').update({ kuota_terpakai: Math.max(0, currentKuota - 1) }).eq('id', rec.paket_siswa_id);
  }
}

export async function isAbsensiOwnedByPelatih(
  absensiId: string,
  pelatihId: string
): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('absensi_siswa')
    .select('id, siswa:siswa_id(pelatih_pemilik_id)')
    .eq('id', absensiId)
    .maybeSingle();

  if (error || !data) return false;
  const siswa = Array.isArray(data.siswa) ? data.siswa[0] : data.siswa;
  return siswa?.pelatih_pemilik_id === pelatihId;
}

export async function isSiswaOwnedByPelatih(
  siswaId: string,
  pelatihId: string
): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('siswa')
    .select('id, pelatih_pemilik_id')
    .eq('id', siswaId)
    .maybeSingle();

  if (error || !data) return false;
  return data.pelatih_pemilik_id === pelatihId;
}
