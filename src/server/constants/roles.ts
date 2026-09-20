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
  ],
  Pelatih: [
    'siswa:read',
    'pelatih:read',
    'penilaian:read',
  ],
};

export function hasPermission(role: KesitRole, permission: Permission): boolean {
  return KESIT_PERMISSIONS[role]?.includes(permission) ?? false;
}
