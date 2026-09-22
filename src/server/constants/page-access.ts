import { KesitRole } from '@/types/auth';

export const KESIT_PAGE_ACCESS: Record<string, KesitRole[]> = {
  '/': ['Owner', 'Admin', 'Pelatih'],
  '/siswa/pendaftaran': ['Owner', 'Admin'],
  '/siswa/rekapan': ['Owner', 'Admin', 'Pelatih'],
  '/pelatih': ['Owner', 'Admin', 'Pelatih'],
  '/penilaian': ['Owner', 'Admin', 'Pelatih'],
  '/riwayat': ['Owner', 'Admin'],
  '/jadwal': ['Owner', 'Admin', 'Pelatih'],
  '/absensi': ['Owner', 'Admin', 'Pelatih'],
  '/laporan-siswa': ['Owner', 'Admin', 'Pelatih'],
  '/paket-pembayaran': ['Owner', 'Admin'],
  '/keuangan': ['Owner', 'Admin'],
  '/pengaturan': ['Owner', 'Admin'],
};

export function canAccessPage(pathname: string, role: KesitRole): boolean {
  // Check exact path or prefix match
  const allowedRoles = KESIT_PAGE_ACCESS[pathname];
  if (allowedRoles) {
    return allowedRoles.includes(role);
  }

  // Check prefix match for nested routes
  for (const [route, roles] of Object.entries(KESIT_PAGE_ACCESS)) {
    if (route !== '/' && pathname.startsWith(route)) {
      return roles.includes(role);
    }
  }

  return true;
}
