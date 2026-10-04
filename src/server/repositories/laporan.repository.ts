import { createClient } from '@/server/supabase/server';
import { KesitRole } from '@/types/auth';
import {
  VLaporanSiswa,
  DetailEvaluasiRenang,
  SertifikatSiswa,
  LaporanDetailData,
  StatusDokumenRapor,
} from '@/types/laporan';
import { SimpanLaporanInput } from '@/server/validators/laporan.schema';

export interface LaporanFilterOptions {
  search?: string;
  statusDokumen?: string;
  statusKenaikan?: string;
  bulan?: number;
  tahun?: number;
  pelatihId?: string;
  level?: string;
}

export async function getLaporanList(
  role: KesitRole,
  filters: LaporanFilterOptions = {}
): Promise<VLaporanSiswa[]> {
  const supabase = await createClient();
  const viewName = role === 'Pelatih' ? 'v_laporan_siswa_pelatih' : 'v_laporan_siswa';

  let query = supabase.from(viewName).select('*').order('tanggal_penilaian', { ascending: false });

  if (filters.search && filters.search.trim()) {
    const q = filters.search.trim().replace(/[,().]/g, '');
    if (q) {
      query = query.or(`nama_siswa.ilike.%${q}%,id_siswa.ilike.%${q}%,nomor_rapor.ilike.%${q}%`);
    }
  }

  if (filters.statusDokumen && filters.statusDokumen !== 'ALL') {
    query = query.eq('status_dokumen', filters.statusDokumen);
  }

  if (filters.statusKenaikan && filters.statusKenaikan !== 'ALL') {
    query = query.eq('status_kenaikan', filters.statusKenaikan);
  }

  if (filters.bulan && filters.bulan > 0) {
    query = query.eq('periode_bulan', filters.bulan);
  }

  if (filters.tahun && filters.tahun > 0) {
    query = query.eq('periode_tahun', filters.tahun);
  }

  if (filters.pelatihId && filters.pelatihId !== 'ALL') {
    query = query.eq('pelatih_id', filters.pelatihId);
  }

  if (filters.level && filters.level !== 'ALL') {
    query = query.eq('level_saat_ini', filters.level);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching v_laporan_siswa:', error);
    throw new Error(error.message);
  }

  return (data || []) as VLaporanSiswa[];
}

export async function getLaporanDetail(laporanId: string): Promise<LaporanDetailData | null> {
  const supabase = await createClient();

  // 1. Ambil data master laporan
  const { data: laporanData, error: laporanError } = await supabase
    .from('v_laporan_siswa')
    .select('*')
    .eq('id', laporanId)
    .single();

  if (laporanError || !laporanData) {
    console.error('Error fetching detail laporan:', laporanError);
    return null;
  }

  // 2. Ambil detail evaluasi renang per gaya
  const { data: detailData, error: detailError } = await supabase
    .from('detail_evaluasi_renang')
    .select('*')
    .eq('laporan_id', laporanId)
    .order('created_at', { ascending: true });

  if (detailError) {
    console.error('Error fetching detail_evaluasi_renang:', detailError);
  }

  // 3. Ambil sertifikat jika ada
  const { data: certData } = await supabase
    .from('sertifikat_siswa')
    .select('*')
    .eq('laporan_id', laporanId)
    .maybeSingle();

  return {
    laporan: laporanData as VLaporanSiswa,
    details: (detailData || []) as DetailEvaluasiRenang[],
    sertifikat: certData as SertifikatSiswa | null,
  };
}

export async function simpanLaporanRpc(
  input: SimpanLaporanInput
): Promise<{ success: boolean; laporan_id: string; nomor_rapor: string; nilai_rata_rata: number; sertifikat_id?: string; nomor_sertifikat?: string }> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('kesit_simpan_laporan_siswa', {
    p_laporan_id: input.laporan_id || null,
    p_siswa_id: input.siswa_id,
    p_pelatih_id: input.pelatih_id,
    p_periode_bulan: input.periode_bulan,
    p_periode_tahun: input.periode_tahun,
    p_tanggal_penilaian: input.tanggal_penilaian,
    p_level_saat_ini: input.level_saat_ini,
    p_rekomendasi_level: input.rekomendasi_level || null,
    p_status_kenaikan: input.status_kenaikan,
    p_status_dokumen: input.status_dokumen,
    p_catatan_umum: input.catatan_umum || null,
    p_catatan_pelatih: input.catatan_pelatih || null,
    p_catatan_head_coach: input.catatan_head_coach || null,
    p_detail_evaluasi: input.detail_evaluasi,
  });

  if (error) {
    console.error('Error invoking kesit_simpan_laporan_siswa:', error);
    throw new Error(error.message);
  }

  return data;
}

export async function hapusLaporanRpc(laporanId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.rpc('kesit_hapus_laporan_siswa', {
    p_laporan_id: laporanId,
  });

  if (error) {
    console.error('Error invoking kesit_hapus_laporan_siswa:', error);
    throw new Error(error.message);
  }
}

export async function updateStatusDokumen(
  laporanId: string,
  status: StatusDokumenRapor
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('laporan_siswa')
    .update({ status_dokumen: status })
    .eq('id', laporanId);

  if (error) {
    console.error('Error updating status_dokumen:', error);
    throw new Error(error.message);
  }
}

export interface SiswaOption {
  id: string;
  id_siswa: string;
  nama_lengkap: string;
  nama_panggilan: string | null;
  jenis_kelamin: string | null;
  nama_wali: string | null;
  no_hp_wali: string | null;
  pelatih_pemilik_id: string | null;
  pelatih_pemilik: string | null;
  kelas: string | null;
  lokasi: string | null;
  nama_paket: string | null;
}

export async function getSiswaOptionsForLaporan(role: KesitRole): Promise<SiswaOption[]> {
  const supabase = await createClient();
  const viewName = role === 'Pelatih' ? 'v_rekapan_siswa_pelatih' : 'v_rekapan_siswa';

  const { data, error } = await supabase
    .from(viewName)
    .select('id, id_siswa, nama_lengkap, nama_panggilan, jenis_kelamin, nama_wali, no_hp_wali, pelatih_pemilik_id, pelatih_pemilik, kelas, lokasi, nama_paket')
    .eq('status_siswa', 'Aktif')
    .order('nama_lengkap', { ascending: true });

  if (error) {
    console.error('Error fetching siswa options:', error);
    return [];
  }

  return (data || []) as SiswaOption[];
}

export interface PelatihOption {
  id: string;
  nama: string;
}

export async function getPelatihOptions(): Promise<PelatihOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('pelatih')
    .select('id, nama')
    .eq('status', 'Aktif')
    .order('nama', { ascending: true });

  if (error) {
    console.error('Error fetching pelatih options:', error);
    return [];
  }

  return (data || []) as PelatihOption[];
}
