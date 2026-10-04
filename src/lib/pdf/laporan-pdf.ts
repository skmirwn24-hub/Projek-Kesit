import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { LaporanDetailData, SertifikatSiswa } from '@/types/laporan';
import { formatTanggal } from '../utils';

const BULAN_NAMES = [
  '',
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

/**
 * Generate dan unduh PDF Rapor Perkembangan Siswa KESIT
 */
export function generateRaporPDF(data: LaporanDetailData): void {
  const { laporan, details } = data;
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // 1. Header Banner Navy
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 32, 'F');

  // Accent Line Cyan
  doc.setFillColor(6, 182, 212); // cyan-500
  doc.rect(0, 32, pageWidth, 2.5, 'F');

  // Club Name & Header Info
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('KESIT SWIMMING CLUB & ACADEMY', 14, 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text('Sistem Informasi Terpadu Pelatihan & Pembinaan Renang Prestasi', 14, 19);
  doc.text('Email: management@kesit.com | Hotline: 0812-3456-7890', 14, 25);

  // Document Title Badge (Right-aligned)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(56, 189, 248); // sky-400
  doc.text('RAPOR PERKEMBANGAN SISWA', pageWidth - 14, 13, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(226, 232, 240);
  doc.text(`No: ${laporan.nomor_rapor}`, pageWidth - 14, 19, { align: 'right' });
  doc.text(
    `Periode: ${BULAN_NAMES[laporan.periode_bulan]} ${laporan.periode_tahun}`,
    pageWidth - 14,
    25,
    { align: 'right' }
  );

  // 2. Student Info Card
  doc.setFillColor(248, 250, 252); // slate-50
  doc.roundedRect(14, 38, pageWidth - 28, 30, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(14, 38, pageWidth - 28, 30, 2, 2, 'D');

  let yLeft = 45;
  const colLeftLabel = 18;
  const colLeftVal = 55;

  const leftFields: [string, string][] = [
    ['Nama Lengkap', laporan.nama_siswa],
    ['ID Siswa', laporan.id_siswa],
    ['Kelas / Kategori', `${laporan.kelas || 'Reguler'} (${laporan.nama_paket || '-'})`],
    ['Lokasi Kolam', laporan.lokasi || '-'],
  ];

  leftFields.forEach(([lbl, val]) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text(lbl, colLeftLabel, yLeft);
    doc.text(':', colLeftVal - 3, yLeft);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(String(val), colLeftVal, yLeft);
    yLeft += 5.5;
  });

  let yRight = 45;
  const colRightLabel = 110;
  const colRightVal = 148;

  const rightFields: [string, string][] = [
    ['Pelatih Pembimbing', laporan.nama_pelatih],
    ['Level Kemampuan Saat Ini', laporan.level_saat_ini],
    ['Rekomendasi Level', laporan.rekomendasi_level || '-'],
    ['Tanggal Penilaian', formatTanggal(laporan.tanggal_penilaian)],
  ];

  rightFields.forEach(([lbl, val]) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text(lbl, colRightLabel, yRight);
    doc.text(':', colRightVal - 3, yRight);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(String(val), colRightVal, yRight);
    yRight += 5.5;
  });

  // 3. Highlight Status Box (Score & Status)
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, 72, pageWidth - 28, 16, 2, 2, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, 72, pageWidth - 28, 16, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  doc.text('NILAI RATA-RATA KOMPETENSI', 20, 78);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(2, 132, 199); // sky-600
  doc.text(`${Number(laporan.nilai_rata_rata).toFixed(2)} / 5.00`, 20, 85);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  doc.text('STATUS KENAIKAN LEVEL', 90, 78);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  const isNaik =
    laporan.status_kenaikan === 'Naik Level' || laporan.status_kenaikan === 'Lulus Tingkat';
  doc.setTextColor(isNaik ? 16 : 71, isNaik ? 185 : 85, isNaik ? 129 : 105);
  doc.text(laporan.status_kenaikan.toUpperCase(), 90, 85);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  doc.text('STATUS DOKUMEN', 150, 78);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(laporan.status_dokumen, 150, 85);

  // 4. Table Detail Evaluasi Teknik Renang
  const tableRows = details.map((d, index) => {
    let cap = '-';
    if (d.jarak_tempuh_meter > 0 && d.catatan_waktu_detik > 0) {
      cap = `${d.jarak_tempuh_meter}m (${d.catatan_waktu_detik} dtk)`;
    } else if (d.jarak_tempuh_meter > 0) {
      cap = `${d.jarak_tempuh_meter} meter`;
    } else if (d.catatan_waktu_detik > 0) {
      cap = `${d.catatan_waktu_detik} detik`;
    }

    const desc = d.keterangan ? ` (${d.keterangan})` : '';

    return [
      String(index + 1),
      d.kategori_teknik,
      Number(d.skor_posisi_tubuh).toFixed(1),
      Number(d.skor_gerakan_kaki).toFixed(1),
      Number(d.skor_gerakan_tangan).toFixed(1),
      Number(d.skor_pernapasan).toFixed(1),
      Number(d.skor_koordinasi).toFixed(1),
      Number(d.skor_akhir_gaya).toFixed(1),
      cap + desc,
    ];
  });

  autoTable(doc, {
    startY: 92,
    head: [
      [
        'No',
        'Kompetensi / Aspek Teknik',
        'Posisi',
        'Kaki',
        'Tangan',
        'Napas',
        'Koord',
        'Skor',
        'Capaian & Catatan',
      ],
    ],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
      cellPadding: 2.2,
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { fontStyle: 'bold', cellWidth: 38 },
      2: { halign: 'center', cellWidth: 14 },
      3: { halign: 'center', cellWidth: 14 },
      4: { halign: 'center', cellWidth: 14 },
      5: { halign: 'center', cellWidth: 14 },
      6: { halign: 'center', cellWidth: 14 },
      7: { halign: 'center', fontStyle: 'bold', textColor: [2, 132, 199], cellWidth: 14 },
      8: { cellWidth: 'auto' },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: 14, right: 14 },
  });

  // Calculate position after table
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const finalY = (doc as any).lastAutoTable?.finalY || 180;

  // 5. Evaluator Notes
  const notesY = Math.min(finalY + 6, 215);

  doc.setFillColor(254, 252, 232); // amber-50
  doc.roundedRect(14, notesY, pageWidth - 28, 30, 2, 2, 'F');
  doc.setDrawColor(253, 230, 138); // amber-200
  doc.roundedRect(14, notesY, pageWidth - 28, 30, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(146, 64, 14); // amber-800
  doc.text('CATATAN PEMBINAAN & SARAN PELATIH:', 18, notesY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(69, 26, 3);

  const notesText =
    laporan.catatan_pelatih ||
    laporan.catatan_umum ||
    'Siswa menunjukkan semangat latihan yang sangat baik. Terus tingkatkan daya tahan dan konsistensi irama kayuhan renang.';
  const splitNotes = doc.splitTextToSize(notesText, pageWidth - 36);
  doc.text(splitNotes, 18, notesY + 12);

  if (laporan.catatan_head_coach) {
    doc.setFont('helvetica', 'bold');
    doc.text('Review Head Coach:', 18, notesY + 22);
    doc.setFont('helvetica', 'normal');
    doc.text(laporan.catatan_head_coach, 50, notesY + 22);
  }

  // 6. Signatures Block
  const sigY = notesY + 36;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);

  // Left: Wali Siswa
  doc.text('Mengetahui,', 25, sigY, { align: 'center' });
  doc.text('Orang Tua / Wali Siswa', 25, sigY + 4, { align: 'center' });
  doc.line(10, sigY + 22, 40, sigY + 22);
  doc.text(`(${laporan.nama_wali || '.........................'})`, 25, sigY + 26, {
    align: 'center',
  });

  // Center: Pelatih Pembimbing
  doc.text('Pelatih Pembimbing,', pageWidth / 2, sigY, { align: 'center' });
  doc.text('KESIT Swimming Club', pageWidth / 2, sigY + 4, { align: 'center' });
  doc.line(pageWidth / 2 - 20, sigY + 22, pageWidth / 2 + 20, sigY + 22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(laporan.nama_pelatih, pageWidth / 2, sigY + 26, { align: 'center' });

  // Right: Head Coach / Disetujui
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Kepala Pelatih (Head Coach),', pageWidth - 25, sigY, { align: 'center' });
  doc.text('Manajemen KESIT', pageWidth - 25, sigY + 4, { align: 'center' });
  doc.line(pageWidth - 40, sigY + 22, pageWidth - 10, sigY + 22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(laporan.disetujui_oleh || 'Head Coach KESIT', pageWidth - 25, sigY + 26, {
    align: 'center',
  });

  // Save / Trigger Download
  const filename = `Rapor_${laporan.id_siswa}_${laporan.nama_siswa.replace(/\s+/g, '_')}_${BULAN_NAMES[laporan.periode_bulan]}_${laporan.periode_tahun}.pdf`;
  doc.save(filename);
}

/**
 * Generate dan unduh Sertifikat Kenaikan Tingkat Siswa KESIT
 */
export function generateSertifikatPDF(
  cert: SertifikatSiswa,
  siswaNama: string,
  idSiswa: string
): void {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Background Frame
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Outer Border (Navy)
  doc.setDrawColor(15, 23, 42); // slate-900
  doc.setLineWidth(2);
  doc.rect(8, 8, pageWidth - 16, pageHeight - 16, 'D');

  // Inner Border (Gold/Teal)
  doc.setDrawColor(217, 119, 6); // amber-600 gold
  doc.setLineWidth(0.8);
  doc.rect(11, 11, pageWidth - 22, pageHeight - 22, 'D');

  // Subtle Corner Accents
  doc.setFillColor(217, 119, 6);
  doc.circle(11, 11, 2, 'F');
  doc.circle(pageWidth - 11, 11, 2, 'F');
  doc.circle(11, pageHeight - 11, 2, 'F');
  doc.circle(pageWidth - 11, pageHeight - 11, 2, 'F');

  // Header Logo / Branding
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(15, 23, 42);
  doc.text('KESIT SWIMMING CLUB & ACADEMY', pageWidth / 2, 28, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text('Klub Renang & Pusat Pelatihan Akuatik Berprestasi Indonesia', pageWidth / 2, 34, {
    align: 'center',
  });

  // Certificate Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(180, 83, 9); // amber-700
  doc.text('SERTIFIKAT KELULUSAN & KENAIKAN TINGKAT', pageWidth / 2, 48, { align: 'center' });

  // Certificate Number
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`Nomor: ${cert.nomor_sertifikat}`, pageWidth / 2, 54, { align: 'center' });

  // Divider Line
  doc.setDrawColor(203, 213, 225);
  doc.line(pageWidth / 2 - 40, 58, pageWidth / 2 + 40, 58);

  // Body Text
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(51, 65, 85);
  doc.text('Dengan penuh apresiasi, sertifikat ini secara resmi dianugerahkan kepada:', pageWidth / 2, 68, {
    align: 'center',
  });

  // Student Name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(15, 23, 42);
  doc.text(siswaNama.toUpperCase(), pageWidth / 2, 82, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`ID Siswa: ${idSiswa}`, pageWidth / 2, 88, { align: 'center' });

  // Achievement text
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(51, 65, 85);
  doc.text(
    'Telah menyelesaikan seluruh tahapan kurikulum evaluasi teknik dan dinyatakan berhasil naik ke tingkat:',
    pageWidth / 2,
    98,
    { align: 'center' }
  );

  // Level Badge Box
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(pageWidth / 2 - 60, 105, 120, 14, 2, 2, 'F');
  doc.setDrawColor(180, 83, 9);
  doc.roundedRect(pageWidth / 2 - 60, 105, 120, 14, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(180, 83, 9);
  doc.text(cert.level_kelulusan.toUpperCase(), pageWidth / 2, 114, { align: 'center' });

  // Predikat
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(2, 132, 199); // sky-600
  doc.text(`Predikat Pencapaian: ${cert.predikat}`, pageWidth / 2, 128, { align: 'center' });

  // Bottom info & Signatures
  const bottomY = 148;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.text(`Ditetapkan pada: ${formatTanggal(cert.tanggal_terbit)}`, 40, bottomY);

  // Signatures
  doc.text('Manajer Operasional,', 40, bottomY + 12);
  doc.line(40, bottomY + 32, 85, bottomY + 32);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Manajemen KESIT', 40, bottomY + 36);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`${cert.penandatangan_jabatan},`, pageWidth - 85, bottomY + 12);
  doc.line(pageWidth - 85, bottomY + 32, pageWidth - 40, bottomY + 32);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(cert.penandatangan_nama, pageWidth - 85, bottomY + 36);

  // Download
  const filename = `Sertifikat_${idSiswa}_${siswaNama.replace(/\s+/g, '_')}_${cert.level_kelulusan.replace(/\s+/g, '_')}.pdf`;
  doc.save(filename);
}
