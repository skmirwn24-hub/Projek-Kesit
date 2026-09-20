export const DATA_LOKASI: Record<string, string[]> = {
  'Kolam Renang Danau Biru AlBanawi': ['Reguler', 'Private', 'Prestasi'],
  'Cafe Fameliza': ['Reguler'],
  'Agrowisata Onokabe': ['Reguler'],
};

export interface PaketItem {
  nama: string;
  harga: number;
  kuota: number;
}

export const DATA_PAKET: Record<string, PaketItem[]> = {
  Reguler: [
    { nama: 'Reguler Pemula', harga: 100000, kuota: 6 },
    { nama: 'Reguler Pra Prestasi', harga: 120000, kuota: 6 },
  ],
  Private: [
    { nama: 'Private Pemula', harga: 250000, kuota: 10 },
    { nama: 'Private Pra Prestasi', harga: 300000, kuota: 10 },
  ],
  Prestasi: [
    { nama: 'Prestasi 4x / Minggu', harga: 200000, kuota: 16 },
    { nama: 'Prestasi 6x / Minggu', harga: 250000, kuota: 24 },
    { nama: 'Prestasi 8x / Minggu', harga: 300000, kuota: 32 },
  ],
};

export const METODE_PEMBAYARAN = [
  'Transfer BCA',
  'Transfer Mandiri',
  'Transfer BRI',
  'QRIS',
  'Cash',
];

export const OWNER_KESIT = 'Sukma Irawan & Ari Setiawan';
