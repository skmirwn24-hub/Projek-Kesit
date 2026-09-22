import { jsPDF } from 'jspdf';
import { formatRupiah, formatTanggal } from './utils';

export interface KuitansiData {
  nomorKuitansi: string;
  tanggal: string;
  namaSiswa: string;
  idSiswa: string;
  kelas: string;
  namaPaket: string;
  lokasi: string;
  hargaPaket: number;
  biayaRequestPelatih: number;
  diskon: number;
  totalTagihan: number;
  nominalDibayar: number;
  sisaTagihan: number;
  statusPembayaran: string;
  metodePembayaran: string;
  adminPenerima: string;
  pelatihPemilik?: string | null;
}

export function generateKuitansiPDF(data: KuitansiData): void {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [120, 210],
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Header Background bar
  doc.setFillColor(24, 28, 36);
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Header Titles
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('KESIT MANAGEMENT', 12, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(200, 210, 225);
  doc.text('Klub Renang & Pelatihan Akuatik Berprestasi', 12, 18);
  doc.text('Email: management@kesit.com | WhatsApp: 0812-3456-7890', 12, 23);

  // Kuitansi Badge / Info
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text('BUKTI PEMBAYARAN', pageWidth - 14, 12, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(180, 195, 215);
  doc.text(`No: ${data.nomorKuitansi}`, pageWidth - 14, 18, { align: 'right' });
  doc.text(`Tgl: ${formatTanggal(data.tanggal)}`, pageWidth - 14, 23, { align: 'right' });

  // Body layout
  doc.setTextColor(20, 20, 20);

  // Left Column: Student Details
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('DATA SISWA & KELAS', 12, 38);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  let y = 45;
  const lineSpacing = 6;

  const leftFields = [
    ['ID Siswa', data.idSiswa],
    ['Nama Siswa', data.namaSiswa],
    ['Kelas', data.kelas],
    ['Paket', data.namaPaket],
    ['Lokasi', data.lokasi],
    ['Pelatih', data.pelatihPemilik || '-'],
  ];

  leftFields.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, 12, y);
    doc.text(':', 40, y);
    doc.setFont('helvetica', 'normal');
    doc.text(String(value), 43, y);
    y += lineSpacing;
  });

  // Right Column: Payment Details Box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(105, 33, 93, 50, 3, 3, 'F');
  doc.setDrawColor(220, 225, 235);
  doc.roundedRect(105, 33, 93, 50, 3, 3, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text('RINCIAN BIAYA', 110, 40);

  let rightY = 47;
  const rightFields = [
    ['Biaya Paket', formatRupiah(data.hargaPaket)],
    ['Biaya Request Pelatih', formatRupiah(data.biayaRequestPelatih)],
    ['Diskon', `- ${formatRupiah(data.diskon)}`],
    ['Total Tagihan', formatRupiah(data.totalTagihan)],
    ['Nominal Dibayar', formatRupiah(data.nominalDibayar)],
    ['Sisa Tagihan', formatRupiah(data.sisaTagihan)],
  ];

  doc.setFontSize(8.5);
  rightFields.forEach(([label, val], idx) => {
    doc.setFont('helvetica', idx === 3 || idx === 4 ? 'bold' : 'normal');
    if (idx === 3) doc.setTextColor(2, 132, 199);
    else if (idx === 4) doc.setTextColor(22, 101, 52);
    else if (idx === 5) doc.setTextColor(data.sisaTagihan > 0 ? 185 : 100, 28, 28);
    else doc.setTextColor(71, 85, 105);

    doc.text(label, 110, rightY);
    doc.text(val, 192, rightY, { align: 'right' });
    rightY += 5.5;
  });

  // Bottom section: Payment status, method, and signature
  doc.setDrawColor(226, 232, 240);
  doc.line(12, 88, pageWidth - 12, 88);

  // Status Badge
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(50, 50, 50);
  doc.text(`Status: ${data.statusPembayaran.toUpperCase()}`, 12, 96);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`Metode: ${data.metodePembayaran}`, 12, 102);
  doc.text(`* Bukti pembayaran sah dan tercatat di sistem KESIT Management.`, 12, 108);

  // Signature on the right
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('Admin Penerima,', pageWidth - 45, 94, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.text(data.adminPenerima, pageWidth - 45, 110, { align: 'center' });

  // Trigger download in browser
  doc.save(`Kuitansi_${data.idSiswa}_${data.nomorKuitansi}.pdf`);
}
