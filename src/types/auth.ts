// ========================================================
// KESIT Management - Shared Auth Types
// ========================================================

export type KesitRole = 'Owner' | 'Admin' | 'Pelatih';

export type AccountStatus = 'Aktif' | 'Nonaktif';

export interface UserProfile {
  id: string;
  username: string;
  nama_tampilan: string;
  role: KesitRole;
  status_akun: AccountStatus;
  pelatih_id: string | null;
  aktivasi_selesai: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AuthSessionUser {
  id: string;
  email?: string;
  profile: UserProfile;
}

export type Permission =
  | 'siswa:create'
  | 'siswa:read'
  | 'siswa:update'
  | 'siswa:move'
  | 'pembayaran:read'
  | 'pembayaran:write'
  | 'pembayaran:koleksi_siswa'
  | 'keuangan:read'
  | 'keuangan:write'
  | 'keuangan:delete'
  | 'honor:manage'
  | 'pelatih:read'
  | 'pelatih:write'
  | 'penilaian:read'
  | 'penilaian:write'
  | 'riwayat:read'
  | 'akun:manage'
  | 'absensi:read'
  | 'absensi:write';
