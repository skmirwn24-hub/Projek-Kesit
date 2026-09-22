import { KesitRole, Permission } from '@/types/auth';

export const KESIT_ROLES: Record<string, KesitRole> = {
  OWNER: 'Owner',
  ADMIN: 'Admin',
  PELATIH: 'Pelatih',
};

export const KESIT_PERMISSIONS: Record<KesitRole, Permission[]> = {
  Owner: [
    'siswa:create',
    'siswa:read',
    'siswa:update',
    'siswa:move',
    'pembayaran:read',
    'pembayaran:write',
    'pelatih:read',
    'pelatih:write',
    'penilaian:read',
    'penilaian:write',
    'riwayat:read',
    'akun:manage',
    'absensi:read',
    'absensi:write',
  ],
  Admin: [
    'siswa:create',
    'siswa:read',
    'siswa:update',
    'siswa:move',
    'pembayaran:read',
    'pembayaran:write',
    'pelatih:read',
    'penilaian:read',
    'penilaian:write',
    'riwayat:read',
    'absensi:read',
    'absensi:write',
  ],
  Pelatih: [
    'siswa:read',
    'pelatih:read',
    'penilaian:read',
    'absensi:read',
    'absensi:write', // Dibatasi RLS ke siswa miliknya saja
  ],
};

export function hasPermission(role: KesitRole, permission: Permission): boolean {
  return KESIT_PERMISSIONS[role]?.includes(permission) ?? false;
}
