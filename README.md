<div align="center">

# 🏊‍♂️ KESIT MANAGEMENT SYSTEM
### *Sistem Informasi Manajemen Terpadu Klub & Sekolah Renang KESIT*

[![Next.js](https://img.shields.io/badge/Next.js-16.3.5-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.8-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-Proprietary-red?style=for-the-badge)](#)

<p align="center">
  Aplikasi tata kelola operasional terpadu yang dirancang khusus untuk klub renang <b>KESIT</b>. Mencakup manajemen pendaftaran bertahap (wizard), kuitansi PDF instan, integrasi WhatsApp, absensi multi-sesi dengan pemotongan kuota otomatis, jadwal mengajar pelatih, penilaian kinerja berbasis KPI, serta pencatatan keuangan real-time.
</p>

</div>

---

## 📑 Daftar Isi

- [1. Gambaran Umum Sistem](#1-gambaran-umum-sistem)
- [2. Fitur-Fitur Unggulan](#2-fitur-fitur-unggulan)
- [3. Matriks Peran & Hak Akses (RBAC)](#3-matriks-peran--hak-akses-rbac)
- [4. Flowchart Alur Bisnis Sistem (Mermaid Diagrams)](#4-flowchart-alur-bisnis-sistem)
  - [4.1 Flowchart Menyeluruh (End-to-End Life Cycle)](#41-flowchart-menyeluruh-end-to-end-life-cycle)
  - [4.2 Flowchart Per-Fitur](#42-flowchart-per-fitur)
    - [A. Autentikasi & Otorisasi RBAC](#a-autentikasi--otorisasi-rbac)
    - [B. Pendaftaran Siswa Baru (4-Step Wizard)](#b-pendaftaran-siswa-baru-4-step-wizard)
    - [C. Rekapan Siswa & Siklus Paket](#c-rekapan-siswa--siklus-paket)
    - [D. Absensi Multi-Sesi & Pemotongan Kuota Otomatis](#d-absensi-multi-sesi--pemotongan-kuota-otomatis)
    - [E. Manajemen Jadwal Latihan Pelatih](#e-manajemen-jadwal-latihan-pelatih)
    - [F. Penilaian Kinerja Pelatih & Sanksi](#f-penilaian-kinerja-pelatih--sanksi)
    - [G. Keuangan & Pelunasan SPP](#g-keuangan--pelunasan-spp)
- [5. Arsitektur & Teknologi](#5-arsitektur--teknologi)
- [6. Struktur Direktori Proyek](#6-struktur-direktori-proyek)
- [7. Panduan Instalasi & Menjalankan Lokal](#7-panduan-instalasi--menjalankan-lokal)
- [8. Skrip Database & Migrasi](#8-skrip-database--migrasi)
- [9. Standar Kode & Git Workflow](#9-standar-kode--git-workflow)

---

## 1. Gambaran Umum Sistem

**KESIT Management System** memadukan kemudahan penggunaan mobile-first dan kestabilan arsitektur Next.js 16 App Router dengan database cloud Supabase (PostgreSQL 15+). 

Sistem ini memecahkan berbagai tantangan operasional harian sekolah renang, antara lain:
- **Pendaftaran Siswa yang Panjang & Rawan Salah:** Dipecah menjadi 4 langkah ringkas (*Biodata Siswa*, *Data Wali*, *Lokasi & Paket*, *Pembayaran SPP Awal*).
- **Pengurangan Kuota yang Rawan Selisih:** Tiap kali siswa diabsen *Hadir*, kuota pertemuan otomatis dipotong 1 oleh sistem database PostgreSQL. Jika terjadi kesalahan, sistem menyediakan fitur *Batal Absensi* yang memulihkan kuota secara aman.
- **Kuitansi & Komunikasi Wali:** Begitu pendaftaran atau pelunasan berhasil, dokumen PDF kuitansi resmi langsung terbit dan dapat dikirim ke nomor WhatsApp wali murid hanya dengan satu sentuhan.
- **Disiplin & Penilaian Pelatih:** Evaluasi bulanan terstruktur berbasis 5 pilar KPI dengan sistem sanksi denda dan pengurangan honor otomatis.

---

## 2. Fitur-Fitur Unggulan

| Fitur | Deskripsi Singkat |
| :--- | :--- |
| **Multi-Step Registration Wizard** | Formulir 4 langkah dengan validasi cerdas, live preview paket latihan, dan kalkulasi diskon yang bebas bug. |
| **Digital Receipt & WhatsApp Share** | Penerbitan kuitansi resmi digital format PDF (`jsPDF`) dan integrasi langsung API WhatsApp (`wa.me`) untuk bukti bayar ke wali. |
| **Smart Multi-Session Attendance** | Presensi siswa berdasarkan kategori (*Reguler*, *Private*, *Prestasi*) dan sesi latihan (Sesi 1 & Sesi 2) yang memotong kuota paket otomatis. |
| **Attendance Caching Engine** | Query absensi berkecepatan tinggi dengan caching berbasis SWR dan optimasi indeks PostgreSQL untuk akses mobile yang mulus. |
| **Trainer Schedule Grid** | Tata kelola jadwal latihan per hari, jam mulai, dan tempat kolam renang dengan aturan hak akses ketat (pelatih hanya kelola jadwal sendiri). |
| **Trainer Performance & Penalty KPI** | Rapor performa pelatih bulanan (skor 1-5) dengan pencatatan pelanggaran, denda nominal, dan sanksi sesi tanpa honor. |
| **Student Lifecycle & Class Mutation** | Pelacakan status siswa (*Aktif*, *Cuti*, *Nonaktif*) serta modul mutasi/pindah kelas & kenaikan paket. |
| **Financial Ledger** | Rekapitulasi pembayaran lunas/tertunggak, pencatatan kas masuk dari SPP, dan pengeluaran operasional klub. |

---

## 3. Matriks Peran & Hak Akses (RBAC)

Aksesibilitas data diproteksi pada level Next.js Server Actions, Route Handlers, dan Row Level Security (RLS) PostgreSQL:

| Modul & Hak Akses | Owner (Superadmin) | Admin | Pelatih |
| :--- | :---: | :---: | :---: |
| **Dashboard Utama** | Penuh | Penuh | Ringkasan Pribadi |
| **Pendaftaran Siswa Baru** | ✅ | ✅ | ❌ |
| **Rekapan Siswa & Pindah Kelas** | ✅ (Semua) | ✅ (Semua) | 👁️ (Hanya Siswa Bimbingan) |
| **Absensi Siswa (Hadir/Batal)** | ✅ | ✅ | ✅ (Siswa Bimbingan/Sesi) |
| **Jadwal Latihan** | ✅ (Semua Pelatih) | ✅ (Semua Pelatih) | ✅ (Jadwal Sendiri) |
| **Penilaian & Sanksi Pelatih** | ✅ (Input & Putusan) | ✅ (Input) | 👁️ (Lihat Rapor Sendiri) |
| **Pembayaran SPP & Kuitansi** | ✅ | ✅ | ❌ |
| **Laporan Kas Keuangan** | ✅ | ✅ | ❌ |
| **Manajemen Akun & Sistem** | ✅ | ❌ | ❌ |

---

## 4. Flowchart Alur Bisnis Sistem

### 4.1 Flowchart Menyeluruh (End-to-End Life Cycle)

Diagram ini mengilustrasikan siklus hidup data dari penerimaan siswa baru hingga evaluasi pelatih dan pembukuan kas klub:

```mermaid
flowchart TD
    subgraph INTAKE["1. Penerimaan & Pendaftaran"]
        A1[Calon Siswa / Wali Murid] --> A2[Formulir Pendaftaran 4-Step Wizard]
        A2 --> A3[Pilih Lokasi, Kelas & Paket Awal]
        A3 --> A4[Pembayaran SPP Awal]
        A4 --> A5[Cetak Kuitansi PDF & Kirim via WhatsApp]
    end

    subgraph ALLOCATION["2. Alokasi & Penjadwalan"]
        A5 --> B1[(Database: Siswa, Paket, Pembayaran)]
        B1 --> B2[Penetapan Pelatih Pemilik & Diminta]
        B2 --> B3[Penyusunan Jadwal Latihan Kolam]
        B3 --> B4[Jadwal Terbit di Dashboard]
    end

    subgraph EXECUTION["3. Pelaksanaan Sesi & Absensi"]
        B4 --> C1[Sesi Latihan di Kolam Renang]
        C1 --> C2[Input Absensi Multi-Sesi: Sesi 1 / 2]
        C2 --> C3{Status Kehadiran Siswa}
        C3 -->|Hadir| C4[Kuota Siswa Otomatis Berkurang -1]
        C3 -->|Izin / Sakit| C5[Kuota Tetap & Catatan Tersimpan]
        C4 --> C6[Kehadiran Pelatih Mengajar Tercatat]
    end

    subgraph EVALUATION["4. Kinerja Pelatih & Sanksi"]
        C6 --> D1[Monitoring Kehadiran Bulanan]
        D1 --> D2[Evaluasi KPI 5 Pilar: Skor 1-5]
        D2 --> D3{Terdapat Pelanggaran?}
        D3 -->|Ya| D4[Sanksi: Peringatan, Denda Rp, Sesi Tanpa Honor]
        D3 -->|Tidak| D5[Honor Pelatih Penuh + Reward]
    end

    subgraph CYCLE_AND_FINANCE["5. Siklus Paket & Pembukuan Kas"]
        C4 --> E1{Kuota Pertemuan Habis?}
        E1 -->|Habis| E2[Notifikasi Perpanjangan Paket / Mutasi Kelas]
        E1 -->|Masih Ada| E3[Lanjut Sesi Pertemuan Berikutnya]
        E2 --> A4
        
        A4 --> F1[Pencatatan Pemasukan SPP & Pendaftaran]
        D4 --> F2[Pemotongan Honor dari Denda Pelanggaran]
        D5 --> F3[Kalkulasi Pengeluaran Honor Bersih]
        F1 --> F4[Laporan Keuangan & Kas Real-Time]
        F2 --> F4
        F3 --> F4
    end
```

---

### 4.2 Flowchart Per-Fitur

#### A. Autentikasi & Otorisasi RBAC

Alur login cerdas yang mengenali username maupun email, verifikasi status akun, penerbitan cookie sesi SSR, dan pengamanan rute dashboard.

```mermaid
flowchart TD
    Start([Mulai]) --> InputCreds[Input Identifier: Email/Username & Password]
    InputCreds --> CheckEmailFormat{Apakah input format email?}
    
    CheckEmailFormat -- Ya --> SupabaseAuth[Supabase Auth: signInWithPassword]
    CheckEmailFormat -- Tidak --> ResolveUsername[Cari email via user_profiles by username]
    
    ResolveUsername --> FoundEmail{Email ditemukan?}
    FoundEmail -- Tidak --> ErrNotFound[Gagal: Akun tidak ditemukan]
    FoundEmail -- Ya --> SupabaseAuth
    
    SupabaseAuth --> AuthSuccess{Kredensial Valid?}
    AuthSuccess -- Tidak --> ErrWrongCreds[Gagal: Password salah]
    AuthSuccess -- Ya --> FetchProfile[Ambil data user_profiles]
    
    FetchProfile --> CheckActive{status_akun == 'Aktif'?}
    CheckActive -- Tidak --> ErrDisabled[Gagal: Akun sedang dinonaktifkan]
    CheckActive -- Ya --> CheckActivated{aktivasi_selesai == true?}
    CheckActivated -- Tidak --> ErrUnactivated[Gagal: Aktivasi belum selesai]
    CheckActivated -- Ya --> SetCookie[Set Cookie: httpOnly: false, sameSite: lax, secure]
    
    SetCookie --> RedirectDashboard[Redirect ke /dashboard]
    RedirectDashboard --> MiddlewareCheck{Evaluasi Role Pengguna}
    
    MiddlewareCheck -->|Owner| AccessFull[Akses Seluruh Modul & Akun]
    MiddlewareCheck -->|Admin| AccessAdmin[Akses Operasional: Siswa, Kas, Absensi]
    MiddlewareCheck -->|Pelatih| AccessCoach[Akses Terbatas: Siswa Sendiri, Absensi, Jadwal]
```

---

#### B. Pendaftaran Siswa Baru (4-Step Wizard)

Alur pendaftaran multi-langkah yang memisahkan beban input form, dilengkapi validasi per tahap dan penerbitan kuitansi instan.

```mermaid
flowchart TD
    Start([Mulai Pendaftaran]) --> Step1[Langkah 1: Biodata Siswa]
    Step1 --> Val1{Nama & Tanggal Daftar Terisi?}
    Val1 -- Tidak --> Toast1[Peringatan: Lengkapi Biodata] --> Step1
    Val1 -- Ya --> Step2[Langkah 2: Data Wali]
    
    Step2 --> Val2{Nama Wali & No. WhatsApp Valid?}
    Val2 -- Tidak --> Toast2[Peringatan: Kontak Wali Wajib Diisi] --> Step2
    Val2 -- Ya --> Step3[Langkah 3: Lokasi, Kelas & Paket]
    
    Step3 --> SelectLocation[Pilih Lokasi & Jenis Kelas]
    SelectLocation --> SelectCoach[Pilih Pelatih Pemilik & Pelatih Diminta]
    SelectCoach --> SelectPackage[Pilih Paket Latihan & Kuota]
    SelectPackage --> InputDiscount[Input Diskon: Bebas Bug Angka 0]
    InputDiscount --> LiveSummary[Preview Ringkasan Paket & Total Tagihan]
    LiveSummary --> Val3{Lokasi, Kelas & Paket Terpilih?}
    Val3 -- Tidak --> Toast3[Peringatan: Lengkapi Pilihan Paket] --> Step3
    Val3 -- Ya --> Step4[Langkah 4: Pembayaran & Konfirmasi]
    
    Step4 --> CheckRecap[Review Kartu Konfirmasi Siswa & Paket]
    CheckRecap --> InputPay[Input Nominal Dibayar & Admin Penerima]
    InputPay --> CalcRemaining[Kalkulasi Sisa Tagihan & Status Lunas/Belum Lunas]
    
    CalcRemaining --> SubmitBtn[Klik: Daftarkan & Buat Kuitansi PDF]
    SubmitBtn --> ServerAction[Panggil daftarSiswaAction]
    ServerAction --> SaveDB[(Simpan ke tabel siswa, paket_siswa, pembayaran)]
    
    SaveDB --> GenerateKuitansi[Generate Nomor Kuitansi KST-XXXXXX]
    GenerateKuitansi --> GenPDF[Generate PDF Kuitansi Resmi via jsPDF]
    GenPDF --> AutoDownload[Otomatis Unduh File Kuitansi]
    AutoDownload --> FinishPanel[Tampilan Hasil Pendaftaran Berhasil]
    
    FinishPanel --> ShareWA[Tombol: Kirim Kuitansi via WhatsApp Wali]
    FinishPanel --> NewRegister[Tombol: Daftarkan Siswa Baru Lainnya]
```

---

#### C. Rekapan Siswa & Siklus Paket

Alur monitoring data siswa, status aktif/cuti, serta proses mutasi/pindah kelas & paket.

```mermaid
flowchart TD
    Start([Buka Rekapan Siswa]) --> FetchStudents[Ambil Data Siswa via SWR Hook]
    FetchStudents --> FilterTable[Pencarian Nama / Filter Kelas / Status Bayar]
    FilterTable --> StudentTable[Tabel Siswa Terdaftar]
    
    StudentTable --> ChooseAction{Pilihan Aksi Siswa}
    
    ChooseAction -->|Detail Siswa| OpenDetailModal[Buka Modal Detail Siswa]
    OpenDetailModal --> ViewDetails[Lihat Data Personal, Histori Kuota, Absensi & Pembayaran]
    
    ChooseAction -->|Pindah Kelas / Paket| OpenMoveModal[Buka Modal Pindah Kelas]
    OpenMoveModal --> InputMoveData[Pilih Lokasi Baru, Kelas Baru & Pelatih Baru]
    InputMoveData --> InputMoveDisc[Input Diskon Baru & Hitung Tagihan Baru]
    InputMoveData --> InputReason[Tulis Alasan Perpindahan]
    InputReason --> SaveMove[Panggil pindahKelasAction]
    SaveMove --> SaveMoveDB[(Update paket_siswa & Catat ke riwayat)]
    SaveMoveDB --> MutateStudents[Revalidasi SWR & Perbarui Tampilan Tabel]
```

---

#### D. Absensi Multi-Sesi & Pemotongan Kuota Otomatis

Alur absensi harian yang memotong kuota paket siswa saat berstatus hadir, dengan kemampuan pembatalan aman.

```mermaid
flowchart TD
    Start([Buka Modul Absensi]) --> ChooseFilter[Pilih Tanggal, Kategori & Nomor Sesi]
    ChooseFilter --> LoadSiswa[Ambil Data Siswa Sesi Tersebut via SWR Cache]
    LoadSiswa --> DisplayList[Tampilkan Kartu / Tabel Siswa]
    
    DisplayList --> ClickAttend{Pilih Status Kehadiran Siswa}
    
    ClickAttend -->|Hadir| MarkHadir[Set Status: Hadir]
    MarkHadir --> CallAbsen[Panggil: absenSiswaAction]
    CallAbsen --> SaveAbsen[(Simpan ke absensi_siswa)]
    SaveAbsen --> DeductQuota[Trigger DB: Kuota Siswa -1]
    DeductQuota --> LogCoachDuty[Catat Log Mengajar Pelatih Bertugas]
    
    ClickAttend -->|Tidak Hadir / Izin / Sakit| MarkIzin[Set Status: Izin / Sakit]
    MarkIzin --> CallAbsenIzin[Panggil: absenSiswaAction]
    CallAbsenIzin --> SaveAbsenIzin[(Simpan Catatan, Kuota Siswa Tetap)]
    
    ClickAttend -->|Batal Absensi| CancelAttend[Klik: Batalkan Absensi]
    CancelAttend --> CallBatal[Panggil: batalkanAbsensiAction]
    CallBatal --> RevertQuota[(Trigger DB: Kuota Siswa Kembali +1)]
    
    LogCoachDuty --> RefreshAbsensiUI[Update Data SWR & Metrik Sesi]
    SaveAbsenIzin --> RefreshAbsensiUI
    RevertQuota --> RefreshAbsensiUI
```

---

#### E. Manajemen Jadwal Latihan Pelatih

Alur pengaturan jadwal latihan mingguan dengan pembatasan hak akses berbasis peran.

```mermaid
flowchart TD
    Start([Buka Halaman Jadwal]) --> LoadSchedule[Query Data via useJadwal Hook]
    LoadSchedule --> FilterDayCoach[Filter berdasarkan Hari & Pelatih]
    FilterDayCoach --> DisplayGrid[Tampilkan Grid Jadwal Mingguan]
    
    DisplayGrid --> ScheduleAction{Pilihan Operasi}
    
    ScheduleAction -->|Tambah Jadwal| OpenAddModal[Buka Form Tambah Jadwal]
    ScheduleAction -->|Edit Jadwal| OpenEditModal[Buka Form Edit Jadwal]
    ScheduleAction -->|Hapus Jadwal| ConfirmDelete[Konfirmasi Hapus Jadwal]
    
    OpenAddModal --> FillSchedule[Input Pelatih, Hari, Jam Mulai, Tempat, Kelas]
    OpenEditModal --> FillSchedule
    
    FillSchedule --> CheckAuth{Periksa Role Pengguna}
    CheckAuth -->|Pelatih| CheckSelfCoach{Mengubah jadwal miliknya sendiri?}
    CheckSelfCoach -- Tidak --> AccessDenied[Tolak: Akses Ditolak]
    CheckSelfCoach -- Ya --> SaveScheduleAction[Panggil createJadwalAction / updateJadwalAction]
    
    CheckAuth -->|Admin / Owner| SaveScheduleAction
    
    ConfirmDelete --> CheckAuthDelete{Periksa Role Hapus}
    CheckAuthDelete -->|Valid| ExecDeleteAction[Panggil deleteJadwalAction]
    CheckAuthDelete -->|Tidak Valid| AccessDenied
    
    SaveScheduleAction --> SaveScheduleDB[(Simpan ke tabel jadwal_pelatih)]
    ExecDeleteAction --> DeleteScheduleDB[(Hapus dari tabel jadwal_pelatih)]
    SaveScheduleDB --> RevalidateJadwal[revalidatePath /jadwal & Mutate SWR]
    DeleteScheduleDB --> RevalidateJadwal
```

---

#### F. Penilaian Kinerja Pelatih & Sanksi

Alur evaluasi 5 pilar kompetensi pelatih, pencatatan pelanggaran, dan penerapan sanksi denda.

```mermaid
flowchart TD
    Start([Buka Modul Penilaian]) --> PickCoach[Pilih Pelatih & Periode Evaluasi]
    PickCoach --> InputScores[Input Skor 1-5: Kedisiplinan, Kehadiran, Mengajar, Komunikasi, Laporan]
    InputScores --> CheckInfraction{Ada Pelanggaran Indisipliner?}
    
    CheckInfraction -- Ya --> InputViolationDetail[Pilih Kategori, Tanggal & Detail Kejadian]
    InputViolationDetail --> SelectPenalty[Tentukan Sanksi: Peringatan, Denda Rp, % Potongan, Sesi Tanpa Honor]
    
    CheckInfraction -- Tidak --> CalculateAverage[Hitung Rata-Rata Skor KPI]
    SelectPenalty --> CalculateAverage
    
    CalculateAverage --> SaveEvaluation[Panggil simpanPenilaianAction]
    SaveEvaluation --> SaveEvaluationDB[(Simpan ke tabel penilaian_pelatih)]
    SaveEvaluationDB --> DeductHonorPool[Otomatis Masuk ke Potongan Honor Pelatih]
    DeductHonorPool --> DisplayScorecard[Tampilkan Rapor Penilaian Pelatih]
```

---

#### G. Keuangan & Pelunasan SPP

Alur pelunasan tagihan sisa bertahap, penerbitan kuitansi pelunasan, dan pembukuan kas masuk.

```mermaid
flowchart TD
    Start([Buka Modul Keuangan]) --> PickPendingStudent[Pilih Siswa dengan Status Belum Lunas]
    PickPendingStudent --> ShowBillInfo[Tampilkan Total Tagihan & Sisa Pembayaran]
    ShowBillInfo --> InputPayAmount[Input Nominal yang Dibayarkan & Metode Bayar]
    
    InputPayAmount --> ValidateNominal{Nominal <= Sisa Tagihan?}
    ValidateNominal -- Tidak --> AlertOverpay[Peringatan: Nominal Melebihi Sisa Tagihan]
    ValidateNominal -- Ya --> ProcessPayment[Panggil bayarTagihanAction]
    
    ProcessPayment --> UpdateDB[(Update tabel pembayaran & paket_siswa)]
    UpdateDB --> CheckPaidOff{Sisa Tagihan Sekarang == 0?}
    
    CheckPaidOff -- Ya --> SetPaidOff[Status Pembayaran: Lunas]
    CheckPaidOff -- Tidak --> SetPartiallyPaid[Status Pembayaran: Belum Lunas]
    
    SetPaidOff --> CreateReceiptPDF[Generate Kuitansi Pelunasan PDF]
    SetPartiallyPaid --> CreateReceiptPDF
    CreateReceiptPDF --> PostToCashLedger[(Catat Otomatis ke Buku Kas Masuk)]
    PostToCashLedger --> UpdateFinancialDashboard[Perbarui Ringkasan Kas & Dashboard]
```

---

## 5. Arsitektur & Teknologi

```
┌────────────────────────────────────────────────────────┐
│                   CLIENT (BROWSER)                     │
│  Next.js 16 Client Components (React 19)               │
│  - SWR (Real-time Cache & Auto Revalidation)           │
│  - Vanilla CSS + Tailwind CSS v4 Global Design System  │
│  - Lucide React Icons & jsPDF Kuitansi Generator       │
└───────────────────────────┬────────────────────────────┘
                            │ HTTPS / Server Actions
┌───────────────────────────▼────────────────────────────┐
│               SERVER (NEXT.JS 16 APP ROUTER)           │
│  - Server Actions (/src/server/actions/*)              │
│  - Input Validation via Zod 4 (/src/server/validators) │
│  - Business Services Layer (/src/server/services/*)    │
│  - Repository Data Access (/src/server/repositories/*) │
│  - Session & Cookie Config (/src/server/supabase/*)    │
└───────────────────────────┬────────────────────────────┘
                            │ PostgreSQL Protocol / REST
┌───────────────────────────▼────────────────────────────┐
│               SUPABASE CLOUD DATABASE                  │
│  - PostgreSQL 15+ Database Engine                      │
│  - Row Level Security (RLS) & Multi-Role Policies      │
│  - Database Triggers (Auto Quota Deduct & Logging)     │
│  - Materialized Views & Strategic Indexes              │
└────────────────────────────────────────────────────────┘
```

- **Frontend Framework:** Next.js `16.3.5` (App Router, Turbopack/Webpack)
- **UI Library:** React `19.2.8` & Lucide Icons `1.47.0`
- **State & Data Fetching:** SWR `2.5.1` (Optimistic updates & cache invalidation)
- **Validation Engine:** Zod `4.6.5`
- **PDF Generation:** jsPDF `4.2.1` & jsPDF-AutoTable `5.0.8`
- **Styling:** Tailwind CSS `v4` & Custom Design Tokens (`globals.css`)
- **Backend & Auth:** Supabase Auth & SSR Client `@supabase/ssr 0.12.7`
- **Database Engine:** Supabase PostgreSQL with RLS, Stored Functions & Triggers

---

## 6. Struktur Direktori Proyek

```bash
Projek-Kesit/
├── .agents/                    # Konfigurasi skill dan aturan AI coding assistant
├── public/                     # Aset statis publik (favicon, logo klub, ikon)
├── scripts/                    # Skrip utilitas database mandiri
│   ├── migrate.mjs             # Menjalankan migrasi SQL berurutan
│   ├── seed.mjs                # Mengisi data awal master & akun uji coba
│   └── sync-prod-to-dev.mjs    # Sinkronisasi skema production ke lokal
├── src/
│   ├── app/                    # Next.js App Router (Rute & Halaman)
│   │   ├── (auth)/login/       # Halaman Login
│   │   ├── (dashboard)/        # Layout utama berotentikasi & Topbar
│   │   │   ├── absensi/        # Presensi multi-sesi & kuota otomatis
│   │   │   ├── jadwal/         # Manajemen jadwal latihan pelatih
│   │   │   ├── keuangan/       # Laporan pembukuan & kas masuk/keluar
│   │   │   ├── laporan-siswa/  # Evaluasi & perkembangan belajar siswa
│   │   │   ├── paket-pembayaran/# Master paket & penagihan SPP
│   │   │   ├── pelatih/        # Direktori & rekap pelatih
│   │   │   ├── pengaturan/     # Pengaturan sistem & akun
│   │   │   ├── penilaian/      # Rapor performa KPI pelatih & sanksi
│   │   │   ├── riwayat/        # Log audit & histori aktivitas sistem
│   │   │   ├── siswa/
│   │   │   │   ├── pendaftaran/# Wizard 4 langkah siswa baru
│   │   │   │   └── rekapan/    # Tabel siswa, detail, & mutasi kelas
│   │   │   └── page.tsx        # Dashboard ringkasan metrik utama
│   │   ├── api/                # API Route Handlers (/api/jadwal, dll)
│   │   ├── globals.css         # Design system & CSS responsive
│   │   └── layout.tsx          # Root HTML layout & provider
│   ├── components/             # Reusable UI & Layout Components
│   │   ├── layout/             # Topbar, Sidebar, DashboardShell
│   │   └── ui/                 # Toast, Modal, DataTable, Skeleton, Button
│   ├── hooks/                  # Custom React Hooks (useAuth, usePelatih, useJadwal)
│   ├── lib/                    # Library umum (pdf.ts, utils.ts, swr-keys.ts)
│   ├── server/                 # Arsitektur Backend & Database Access
│   │   ├── actions/            # Next.js Server Actions ('use server')
│   │   ├── constants/          # Master lokasi, paket, data sesi, peran (RBAC)
│   │   ├── repositories/       # Query langsung ke database Supabase
│   │   ├── services/           # Logika bisnis & aturan otorisasi
│   │   ├── supabase/           # Server client, admin client, cookie config
│   │   └── validators/         # Zod schemas untuk validasi input
│   └── types/                  # Definisi TypeScript interface & database types
├── supabase/
│   └── migrations/             # 001_init_schema.sql s/d 010_jadwal_pelatih.sql
├── next.config.ts              # Konfigurasi Next.js (optimasi package imports)
├── package.json                # Dependensi proyek & npm scripts
└── tsconfig.json               # Konfigurasi TypeScript compiler
```

---

## 7. Panduan Instalasi & Menjalankan Lokal

### 7.1 Prasyarat Sistem
- **Node.js:** Versi `20.x` atau lebih baru
- **NPM:** Versi `10.x` atau lebih baru
- **Proyek Supabase:** Instance Supabase PostgreSQL aktif

### 7.2 Langkah Instalasi

1. **Clone Repositori:**
   ```bash
   git clone git@github.com:skmirwn24-hub/Projek-Kesit.git
   cd Projek-Kesit
   ```

2. **Pasang Dependensi:**
   ```bash
   npm install
   ```

3. **Konfigurasi Environment Variables:**
   Salin berkas template environment:
   ```bash
   cp .env.example .env.local
   ```
   Buka `.env.local` dan sesuaikan nilainya:
   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

   # Database Direct Connection (Untuk script migrasi)
   DATABASE_URL=postgresql://postgres:your-db-password@db.your-project-id.supabase.co:5432/postgres

   # Pengaturan Auth Cookies
   NEXT_PUBLIC_AUTH_COOKIE_NAME=sb-kesit-auth-token
   NEXT_PUBLIC_AUTH_COOKIE_SAMESITE=Lax
   ```

4. **Jalankan Migrasi Database:**
   ```bash
   npm run db:migrate
   ```
   *(Opsional: Jalankan `npm run db:seed` untuk mengisi akun demo awal)*.

5. **Jalankan Server Pengembangan (Dev Server):**
   ```bash
   npm run dev
   ```
   Buka peramban di [http://localhost:3000](http://localhost:3000).

6. **Pengujian Build Produksi:**
   ```bash
   npm run build
   ```

---

## 8. Skrip Database & Migrasi

Tersedia sejumlah perintah otomatis pada `package.json`:

- `npm run db:migrate`  
  Menjalankan seluruh berkas SQL migrasi pada folder `supabase/migrations/` secara berurutan menggunakan koneksi `DATABASE_URL`.
- `npm run db:seed`  
  Membuat akun bawaan Owner/Admin/Pelatih serta menginisialisasi master paket dan lokasi latihan.
- `npm run db:sync-prod`  
  Menyinkronkan skema produksi ke basis data pengembangan lokal.

---

## 9. Standar Kode & Git Workflow

1. **Konvensi Branch:**
   - `main` / `dev`: Branch utama terlindungi.
   - `feat/*`: Fitur atau penambahan halaman baru (contoh: `feat/jadwal`, `feat/documentation`).
   - `fix/*`: Perbaikan kutu atau error (contoh: `fix/diskon-input`, `fix/absensi-caching`).
2. **Aturan Push:**
   - Dilarang keras melakukan *Force Push* (`--force`) ke branch kolaboratif.
   - Pastikan kode lolos validasi typecheck `npx tsc --noEmit` dan `npm run build` sebelum membuat Pull Request.

---

<div align="center">
  <b>© 2026 KESIT Management System. Hak Cipta Dilindungi.</b><br>
  <i>Dibuat dengan dedikasi untuk kemajuan olahraga renang prestasi dan kursus berkualitas.</i>
</div>
