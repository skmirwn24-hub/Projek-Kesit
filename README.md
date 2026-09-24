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
  Aplikasi operasional terpadu untuk klub renang <b>KESIT</b> berbasis Next.js 16 App Router dan Supabase PostgreSQL. Dokumentasi ini memuat <b>alur bisnis riil</b> yang telah berjalan penuh di dalam basis kode, disertai diagram alir (flowchart) akurat tanpa rekayasa fitur.
</p>

</div>

---

## 📑 Daftar Isi

- [1. Gambaran Umum & Status Fitur](#1-gambaran-umum--status-fitur)
  - [1.1 Fitur Aktif & Berjalan Penuh](#11-fitur-aktif--berjalan-penuh)
  - [1.2 Fitur Dalam Tahap Pengembangan (Coming Soon)](#12-fitur-dalam-tahap-pengembangan-coming-soon)
- [2. Matriks Peran & Hak Akses (RBAC)](#2-matriks-peran--hak-akses-rbac)
- [3. Flowchart Alur Bisnis Riil Sistem (Mermaid Diagrams)](#3-flowchart-alur-bisnis-riil-sistem)
  - [3.1 Flowchart Menyeluruh (End-to-End System Life Cycle)](#31-flowchart-menyeluruh-end-to-end-system-life-cycle)
  - [3.2 Flowchart Per-Fitur Riil](#32-flowchart-per-fitur-riil)
    - [A. Autentikasi, Sesi & Otorisasi RBAC](#a-autentikasi-sesi--otorisasi-rbac)
    - [B. Pendaftaran Siswa Baru (4-Step Wizard)](#b-pendaftaran-siswa-baru-4-step-wizard)
    - [C. Rekapan Siswa & Pindah Kelas / Paket](#c-rekapan-siswa--pindah-kelas--paket)
    - [D. Presensi Multi-Sesi & Pemotongan Kuota Otomatis](#d-presensi-multi-sesi--pemotongan-kuota-otomatis)
    - [E. Manajemen Jadwal Latihan Pelatih](#e-manajemen-jadwal-latihan-pelatih)
    - [F. Manajemen Data Pelatih & Masa Training](#f-manajemen-data-pelatih--masa-training)
    - [G. Penilaian Kinerja Pelatih & Sanksi](#g-penilaian-kinerja-pelatih--sanksi)
    - [H. Log Riwayat & Audit Perubahan Siswa](#h-log-riwayat--audit-perubahan-siswa)
- [4. Arsitektur & Teknologi](#4-arsitektur--teknologi)
- [5. Struktur Direktori Proyek](#5-struktur-direktori-proyek)
- [6. Panduan Instalasi & Menjalankan Lokal](#6-panduan-instalasi--menjalankan-lokal)
- [7. Skrip Database & Migrasi](#7-skrip-database--migrasi)
- [8. Standar Kode & Git Workflow](#8-standar-kode--git-workflow)

---

## 1. Gambaran Umum & Status Fitur

Sistem ini dibangun untuk memfasilitasi kebutuhan operasional nyata di sekolah renang **KESIT**. Agar dokumentasi ini akurat dan dapat dipercaya, berikut adalah pemetaan status fitur yang **benar-benar ada di dalam kode saat ini**:

### 1.1 Fitur Aktif & Berjalan Penuh

| Halaman / Modul | Rute URL | Status | Deskripsi Riil yang Sudah Ada |
| :--- | :--- | :---: | :--- |
| **Login & Autentikasi** | `/login` | ✅ Aktif | Login identifier (email/username), verifikasi password Supabase, proteksi status akun aktif, cookie sesi SSR. |
| **Dashboard Utama** | `/` | ✅ Aktif | Metrik ringkasan siswa, pelatih aktif, cabang lokasi, tabel operasional hari ini, dan rekap tagihan/piutang SPP. |
| **Pendaftaran Siswa** | `/siswa/pendaftaran` | ✅ Aktif | Wizard 4 langkah (*Biodata*, *Wali*, *Paket*, *Pembayaran SPP Awal*), live preview tagihan, unduh Kuitansi PDF resmi (`jsPDF`), share WhatsApp wali. |
| **Rekapan Siswa** | `/siswa/rekapan` | ✅ Aktif | Tabel siswa, pencarian & filter kelas, modal detail kuota/histori, dan modal mutasi/pindah kelas & paket. |
| **Presensi Multi-Sesi** | `/absensi` | ✅ Aktif | Presensi per tanggal, kategori (Reguler/Private/Prestasi) & sesi (Sesi 1/2). Hadir = kuota otomatis `-1`, Izin = simpan catatan, fitur Batal Presensi pulihkan kuota `+1`. |
| **Jadwal Pelatih** | `/jadwal` | ✅ Aktif | Filter hari & pelatih, kelola slot jam & kolam, pembatasan hak akses (pelatih hanya jadwal sendiri vs admin/owner kelola semua). |
| **Data Pelatih** | `/pelatih` | ✅ Aktif | Statistik pelatih, tambah/edit pelatih, status (*Aktif*, *Training*, *Nonaktif*), otomatisasi masa training 3 bulan, pelacakan jumlah siswa milik. |
| **Penilaian Pelatih** | `/penilaian` | ✅ Aktif | Evaluasi 5 pilar KPI skor 1-5, standar KKM 4.00, pencatatan pelanggaran, putusan sanksi (*Teguran*, *SP-1*, *SP-2*, *SP-3*, *Putus Mitra*), riwayat evaluasi. |
| **Riwayat / Audit Log** | `/riwayat` | ✅ Aktif | Log audit riwayat mutasi siswa, pendaftaran, filter jenis perubahan, bulan, tahun, dan paginasi data. |

### 1.2 Fitur Dalam Tahap Pengembangan (Coming Soon)

Halaman-halaman berikut saat ini berstatus placeholder/halaman persiapan (`<ComingSoon />`) dan **belum memiliki logika bisnis aktif**:

| Modul Persiapan | Rute URL | Status | Rencana Fungsionalitas Mendatang |
| :--- | :--- | :---: | :--- |
| **Keuangan, Kas & Penggajian** | `/keuangan` | ⏳ *Coming Soon* | Buku kas operasional klub, pencatatan kas masuk/keluar, dan sistem penggajian pelatih per sesi. |
| **Katalog Paket & Pembayaran** | `/paket-pembayaran`| ⏳ *Coming Soon* | Katalog tarif paket, perpanjangan kuota mandiri, dan modul pelunasan tagihan bertahap. |
| **Rapor & Laporan Siswa** | `/laporan-siswa` | ⏳ *Coming Soon* | Rapor perkembangan gaya renang (dada, bebas, punggung, kupu-kupu) dan sertifikasi kenaikan tingkat. |
| **Pengaturan Sistem** | `/pengaturan` | ⏳ *Coming Soon* | Konfigurasi akun staf internal, manajemen cabang kolam, dan pencadangan data sistem. |

---

## 2. Matriks Peran & Hak Akses (RBAC)

Aturan hak akses yang diimplementasikan pada Server Actions (`src/server/actions/`) dan Server Services (`src/server/services/`):

| Aksi / Modul | Owner (Superadmin) | Admin | Pelatih |
| :--- | :---: | :---: | :---: |
| **Login & Dashboard** | ✅ Penuh | ✅ Penuh | ✅ Ringkasan Pribadi |
| **Pendaftaran Siswa Baru** | ✅ | ✅ | ❌ |
| **Lihat Rekapan Siswa** | ✅ (Semua) | ✅ (Semua) | 👁️ (Hanya Siswa Milik Sendiri) |
| **Pindah Kelas / Paket Siswa** | ✅ | ✅ | ❌ |
| **Presensi Siswa (Hadir / Izin / Batal)** | ✅ | ✅ | ✅ (Siswa Bimbingan / Sesi Terkait) |
| **Kelola Jadwal Latihan** | ✅ (Semua) | ✅ (Semua) | ✅ (Hanya Jadwal Sendiri) |
| **Kelola Data & Status Pelatih** | ✅ | ✅ | ❌ |
| **Input Penilaian & Sanksi Pelatih** | ✅ (Penilai & Putusan) | ✅ (Petugas Input) | ❌ |
| **Lihat Riwayat Penilaian Pelatih** | ✅ | ✅ | 👁️ (Rapor Sendiri) |
| **Lihat Riwayat Perubahan Siswa** | ✅ | ✅ | ❌ |

---

## 3. Flowchart Alur Bisnis Riil Sistem

### 3.1 Flowchart Menyeluruh (End-to-End System Life Cycle)

Diagram alir komprehensif yang menghubungkan seluruh modul yang **sudah aktif dan terintegrasi** saat ini:

```mermaid
flowchart TD
    subgraph S1["1. Sesi & Autentikasi (/login)"]
        A1[Pengguna Input Email/Username & Password] --> A2{Verifikasi Supabase Auth & Status Akun}
        A2 -->|Valid & Aktif| A3[Set Cookie Sesi & Masuk ke Dashboard]
        A2 -->|Tidak Valid / Nonaktif| A4[Tampilkan Notifikasi Error]
    end

    subgraph S2["2. Pendaftaran Siswa Baru (/siswa/pendaftaran)"]
        A3 --> B1[Admin/Owner Buka Form Pendaftaran Wizard]
        B1 --> B2[Langkah 1: Input Biodata Siswa]
        B2 --> B3[Langkah 2: Input Data & Kontak WhatsApp Wali]
        B3 --> B4[Langkah 3: Pilih Lokasi, Kelas, Pelatih & Paket + Input Diskon]
        B4 --> B5[Langkah 4: Konfirmasi Tagihan & Input Nominal Dibayar]
        B5 --> B6[(Simpan ke Database Siswa & Pembayaran Awal)]
        B6 --> B7[Generate Otomatis Kuitansi Resmi PDF jsPDF]
        B7 --> B8[Bagikan Rincian Kuitansi via WhatsApp Wali Murid]
    end

    subgraph S3["3. Penjadwalan & Pelatih (/pelatih & /jadwal)"]
        A3 --> C1[Kelola Data Pelatih di /pelatih]
        C1 --> C2[Input Pelatih, Status Aktif/Training & Hitung 3 Bulan Masa Training]
        A3 --> C3[Kelola Jadwal di /jadwal]
        C3 --> C4[Atur Slot: Pelatih, Hari, Jam Mulai, Kolam & Kelas]
        C4 --> C5{Hak Akses Role}
        C5 -->|Pelatih| C6[Hanya Boleh Kelola Jadwal Sendiri]
        C5 -->|Admin / Owner| C7[Bebas Kelola Seluruh Jadwal Pelatih]
    end

    subgraph S4["4. Pelaksanaan Sesi & Presensi (/absensi)"]
        C4 --> D1[Sesi Latihan Berlangsung di Kolam]
        D1 --> D2[Buka Halaman Presensi di /absensi]
        D2 --> D3[Pilih Tanggal, Kategori Kelas & Sesi: Sesi 1 atau Sesi 2]
        D3 --> D4{Aksi Presensi Siswa}
        D4 -->|Klik Hadir| D5[Status Hadir: Kuota Siswa Otomatis Berkurang -1]
        D4 -->|Klik Tidak Hadir / Izin| D6[Status Izin: Simpan Catatan, Kuota Siswa Tetap]
        D4 -->|Klik Batal Absen| D7[Status Batal: Kuota Siswa Kembali Dipulihkan +1]
        D5 --> D8[Catat Otomatis Pelatih yang Bertugas di Sesi Ini]
    end

    subgraph S5["5. Rekapan Siswa & Pindah Kelas (/siswa/rekapan)"]
        D5 --> E1[Monitoring Data di /siswa/rekapan]
        E1 --> E2{Perlu Mutasi / Pindah Kelas?}
        E2 -->|Ya| E3[Buka Modal Pindah Kelas]
        E3 --> E4[Pilih Lokasi Baru, Paket Baru, Diskon Baru & Alasan]
        E4 --> E5[(Simpan Perubahan & Catat ke Log Audit /riwayat)]
    end

    subgraph S6["6. Penilaian Kinerja & Sanksi Pelatih (/penilaian)"]
        D8 --> F1[Evaluasi Berkala di /penilaian]
        F1 --> F2[Input Skor 5 Pilar KPI 1-5: KKM 4.00]
        F2 --> F3{Ada Pelanggaran Indisipliner?}
        F3 -->|Ya| F4[Pilih Pelanggaran & Putusan Sanksi: Teguran / SP-1 / SP-2 / SP-3 / Putus Mitra]
        F3 -->|Tidak| F5[Status Aman & Memenuhi KKM]
        F4 --> F6[Kalkulasi Durasi Sanksi, % Denda & Sesi Tanpa Honor]
        F6 --> F7[(Tersimpan Permanen di Riwayat Penilaian Pelatih)]
    end
```

---

### 3.2 Flowchart Per-Fitur Riil

#### A. Autentikasi, Sesi & Otorisasi RBAC

Alur login di [src/app/(auth)/login/page.tsx](file:///Users/faizulmushofa/Documents/my-project/Projek-Kesit/src/app/(auth)/login/page.tsx) yang mendukung identifier email atau username, verifikasi status akun aktif dan aktivasi profil:

```mermaid
flowchart TD
    Start([Mulai]) --> Input[Input Identifier: Email/Username & Password]
    Input --> CheckEmail{Format Email?}
    
    CheckEmail -- Ya --> SupabaseAuth[Panggil Supabase Auth signInWithPassword]
    CheckEmail -- Tidak --> ResolveEmail[Cari Email via user_profiles berdasarkan Username]
    
    ResolveEmail --> EmailFound{Ditemukan?}
    EmailFound -- Tidak --> ErrNotFound[Gagal: Username Tidak Terdaftar]
    EmailFound -- Ya --> SupabaseAuth
    
    SupabaseAuth --> AuthOK{Password Cocok?}
    AuthOK -- Tidak --> ErrPass[Gagal: Password Salah]
    AuthOK -- Ya --> GetProfile[Ambil Data user_profiles]
    
    GetProfile --> CheckActive{status_akun == 'Aktif'?}
    CheckActive -- Tidak --> ErrInactive[Gagal: Akun Dinonaktifkan]
    CheckActive -- Ya --> CheckAct{aktivasi_selesai == true?}
    CheckAct -- Tidak --> ErrUnact[Gagal: Aktivasi Belum Selesai]
    CheckAct -- Ya --> SetCookie[Set Cookie: httpOnly: false, sameSite: lax, secure]
    
    SetCookie --> GoDashboard[Redirect ke /dashboard]
    GoDashboard --> Middleware[Cek Akses Role: Owner / Admin / Pelatih]
```

---

#### B. Pendaftaran Siswa Baru (4-Step Wizard)

Alur formulir pendaftaran bertahap di [src/app/(dashboard)/siswa/pendaftaran/page.tsx](file:///Users/faizulmushofa/Documents/my-project/Projek-Kesit/src/app/(dashboard)/siswa/pendaftaran/page.tsx):

```mermaid
flowchart TD
    Start([Buka Halaman Pendaftaran]) --> S1[Langkah 1: Biodata Siswa]
    S1 --> V1{Nama & Tgl Daftar Lengkap?}
    V1 -- Tidak --> T1[Peringatan: Lengkapi Biodata] --> S1
    V1 -- Ya --> S2[Langkah 2: Data Wali]
    
    S2 --> V2{Nama & No. WhatsApp Terisi?}
    V2 -- Tidak --> T2[Peringatan: Lengkapi Kontak Wali] --> S2
    V2 -- Ya --> S3[Langkah 3: Lokasi, Kelas & Paket]
    
    S3 --> SelectOptions[Pilih Lokasi, Kelas, Pelatih & Paket]
    SelectOptions --> FillDiscount[Input Diskon: State number / empty]
    FillDiscount --> LiveRecap[Live Preview Ringkasan Paket & Total Tagihan]
    LiveRecap --> V3{Lokasi, Kelas & Paket Terpilih?}
    V3 -- Tidak --> T3[Peringatan: Lengkapi Paket] --> S3
    V3 -- Ya --> S4[Langkah 4: Pembayaran & Konfirmasi]
    
    S4 --> ReviewCard[Review Ringkasan Siswa, Wali & Paket]
    ReviewCard --> InputPay[Input Nominal Dibayar & Admin Penerima]
    InputPay --> CalcBill[Kalkulasi Sisa Tagihan & Status Lunas/Belum Lunas]
    
    CalcBill --> Submit[Klik: Daftarkan & Buat Kuitansi PDF]
    Submit --> CallAction[Panggil daftarSiswaAction]
    CallAction --> SaveData[(Simpan ke Database Siswa & Pembayaran)]
    
    SaveData --> NoKuitansi[Generate Nomor KST-XXXXXX]
    NoKuitansi --> GenPDF[Generate PDF Kuitansi via jsPDF]
    GenPDF --> DownloadPDF[Otomatis Unduh Kuitansi PDF]
    DownloadPDF --> PanelSuccess[Tampilkan Hasil Pendaftaran Berhasil]
    
    PanelSuccess --> OpenWA[Tombol: Buka WhatsApp Wali wa.me]
    PanelSuccess --> ResetForm[Tombol: Daftarkan Siswa Baru]
```

---

#### C. Rekapan Siswa & Pindah Kelas / Paket

Alur pemantauan data siswa dan mutasi kelas di [src/app/(dashboard)/siswa/rekapan/page.tsx](file:///Users/faizulmushofa/Documents/my-project/Projek-Kesit/src/app/(dashboard)/siswa/rekapan/page.tsx):

```mermaid
flowchart TD
    Start([Buka Rekapan Siswa]) --> Fetch[Query Data Siswa via SWR Hook]
    Fetch --> Filter[Pencarian Nama / Filter Kelas / Filter Status]
    Filter --> Table[Tabel Rekapan Siswa]
    
    Table --> Action{Pilih Aksi Siswa}
    
    Action -->|Detail Siswa| DetailModal[Buka Modal Detail Siswa]
    DetailModal --> ShowInfo[Lihat Data Diri, Wali, Kuota Terpakai/Total & Histori Pindah]
    
    Action -->|Pindah Kelas / Paket| MoveModal[Buka Modal Pindah Kelas]
    MoveModal --> InputNewData[Pilih Lokasi Baru, Kelas Baru, Paket Baru & Pelatih Baru]
    InputNewData --> InputNewDiscount[Input Diskon Baru & Hitung Tagihan Baru]
    InputNewData --> InputReason[Input Alasan Perpindahan]
    InputReason --> SaveMove[Panggil pindahKelasAction]
    SaveMove --> SaveMoveDB[(Update paket_siswa & Catat Log ke riwayat)]
    SaveMoveDB --> Mutate[Revalidasi Cache SWR & Refresh Tabel]
```

---

#### D. Presensi Multi-Sesi & Pemotongan Kuota Otomatis

Alur absensi harian di [src/app/(dashboard)/absensi/page.tsx](file:///Users/faizulmushofa/Documents/my-project/Projek-Kesit/src/app/(dashboard)/absensi/page.tsx) dengan kuota otomatis dan pembatalan aman:

```mermaid
flowchart TD
    Start([Buka Modul Presensi]) --> SelectParam[Pilih Tanggal, Kategori & Nomor Sesi: 1 atau 2]
    SelectParam --> QueryStudents[Ambil Data Siswa Sesi Tersebut via SWR Cache]
    QueryStudents --> RenderCards[Tampilkan Daftar Kartu Siswa]
    
    RenderCards --> ClickStatus{Pilih Tombol Kehadiran}
    
    ClickStatus -->|Hadir| ActionHadir[Panggil absenSiswaAction status Hadir]
    ActionHadir --> SaveHadir[(Simpan ke absensi_siswa)]
    SaveHadir --> TriggerDeduct[Trigger Database: Kuota Siswa -1]
    TriggerDeduct --> LogCoach[Catat Otomatis Pelatih Bertugas di Sesi Ini]
    
    ClickStatus -->|Tidak Hadir / Izin / Sakit| ActionIzin[Panggil absenSiswaAction status Izin/Sakit]
    ActionIzin --> SaveIzin[(Simpan Catatan Izin, Kuota Siswa Tidak Berkurang)]
    
    ClickStatus -->|Batal Absensi| ActionBatal[Panggil batalkanAbsensiAction]
    ActionBatal --> RevertQuota[(Trigger Database: Kuota Siswa Kembali Pulih +1)]
    
    LogCoach --> RefreshUI[Revalidasi Cache SWR & Perbarui Metrik Sesi]
    SaveIzin --> RefreshUI
    RevertQuota --> RefreshUI
```

---

#### E. Manajemen Jadwal Latihan Pelatih

Alur pengaturan jadwal di [src/app/(dashboard)/jadwal/page.tsx](file:///Users/faizulmushofa/Documents/my-project/Projek-Kesit/src/app/(dashboard)/jadwal/page.tsx) dengan pengawasan hak akses:

```mermaid
flowchart TD
    Start([Buka Halaman Jadwal]) --> LoadData[Query Data Jadwal via useJadwal Hook]
    LoadData --> FilterGrid[Filter per Hari & Filter per Pelatih]
    FilterGrid --> DisplayGrid[Tampilkan Tabel Jadwal Mengajar]
    
    DisplayGrid --> ChooseAction{Aksi Pengguna}
    
    ChooseAction -->|Tambah Jadwal| ModalAdd[Buka Modal Tambah Jadwal]
    ChooseAction -->|Edit Jadwal| ModalEdit[Buka Modal Edit Jadwal]
    ChooseAction -->|Hapus Jadwal| ConfirmDel[Konfirmasi Hapus Jadwal]
    
    ModalAdd --> FillData[Pilih Pelatih, Hari, Jam Mulai, Kolam & Kelas]
    ModalEdit --> FillData
    
    FillData --> RoleCheck{Periksa Role}
    RoleCheck -->|Pelatih| CheckSelf{Jadwal Milik Sendiri?}
    CheckSelf -- Tidak --> Deny[Ditolak: Hanya Bisa Kelola Jadwal Sendiri]
    CheckSelf -- Ya --> ExecSave[Panggil createJadwalAction / updateJadwalAction]
    
    RoleCheck -->|Admin / Owner| ExecSave
    
    ConfirmDel --> CheckDelRole{Periksa Role Hapus}
    CheckDelRole -->|Valid| ExecDelete[Panggil deleteJadwalAction]
    CheckDelRole -->|Tidak Valid| Deny
    
    ExecSave --> SaveDB[(Simpan ke tabel jadwal_pelatih)]
    ExecDelete --> DeleteDB[(Hapus dari tabel jadwal_pelatih)]
    SaveDB --> Revalidate[revalidatePath /jadwal & Mutate SWR]
    DeleteDB --> Revalidate
```

---

#### F. Manajemen Data Pelatih & Masa Training

Alur pendataan pelatih di [src/app/(dashboard)/pelatih/page.tsx](file:///Users/faizulmushofa/Documents/my-project/Projek-Kesit/src/app/(dashboard)/pelatih/page.tsx):

```mermaid
flowchart TD
    Start([Buka Halaman Pelatih]) --> FetchCoaches[Query Pelatih via usePelatih Hook]
    FetchCoaches --> FilterCoach[Cari Nama/HP/Email & Filter Status: Aktif/Training/Nonaktif]
    FilterCoach --> CoachTable[Tabel Data Pelatih]
    
    CoachTable --> CoachAction{Pilih Aksi}
    
    CoachAction -->|Detail Pelatih| DetailModal[Buka Modal Detail Pelatih]
    DetailModal --> ShowCoachData[Lihat Kontak, Masa Training & Jumlah Siswa Milik]
    
    CoachAction -->|Tambah / Edit Pelatih| FormModal[Buka Form Tambah / Edit Pelatih]
    FormModal --> InputBasic[Input Nama, No. HP, Email, Alamat, Pendidikan, Sertifikat]
    InputBasic --> SelectStatus{Status Pelatih?}
    
    SelectStatus -->|Training| SetTrainingDate[Input Tanggal Mulai Training]
    SetTrainingDate --> AutoCalcEndDate[Hitung Otomatis Tanggal Berakhir: +3 Bulan]
    SelectStatus -->|Aktif / Nonaktif| ClearTraining[Tanpa Masa Training]
    
    AutoCalcEndDate --> SubmitCoach[Panggil createPelatihAction / updatePelatihAction]
    ClearTraining --> SubmitCoach
    
    SubmitCoach --> SaveCoachDB[(Simpan ke tabel pelatih)]
    SaveCoachDB --> RefreshCoaches[Revalidasi SWR & Perbarui Tampilan Tabel]
```

---

#### G. Penilaian Kinerja Pelatih & Sanksi

Alur evaluasi 5 pilar kompetensi dan penegakan sanksi di [src/app/(dashboard)/penilaian/page.tsx](file:///Users/faizulmushofa/Documents/my-project/Projek-Kesit/src/app/(dashboard)/penilaian/page.tsx):

```mermaid
flowchart TD
    Start([Buka Modul Penilaian]) --> CheckAccess{Bolehkah Menilai?}
    CheckAccess -->|Pelatih| ReadOnlyHistory[Hanya Bisa Melihat Riwayat Penilaian Sendiri]
    CheckAccess -->|Owner / Admin| ShowForm[Tampilkan Form Penilaian & Riwayat]
    
    ShowForm --> SelectTarget[Pilih Pelatih & Tanggal Penilaian]
    SelectTarget --> Rate5KPI[Input Skor 1-5: Kedisiplinan, Kehadiran, Mengajar, Komunikasi, Laporan]
    Rate5KPI --> ViolationCheck{Terdapat Pelanggaran Indisipliner?}
    
    ViolationCheck -- Ya --> PickViolation[Pilih Kategori: Ringan / Sedang / Berat / Sangat Berat]
    PickViolation --> InputChronology[Tulis Kronologi Pelanggaran]
    InputChronology --> DecideSanction[Pilih Sanksi: Teguran / SP-1 / SP-2 / SP-3 / Putus Mitra]
    DecideSanction --> AutoCalcSanction[Hitung Otomatis: Durasi Hari, % Denda, Sesi Tanpa Honor]
    
    ViolationCheck -- Tidak --> NoSanction[Sanksi: Tidak Ada]
    
    AutoCalcSanction --> SaveRating[Panggil submitPenilaianAction]
    NoSanction --> SaveRating
    
    SaveRating --> SaveRatingDB[(Simpan Permanen ke tabel penilaian_pelatih)]
    SaveRatingDB --> RefreshRatingUI[Revalidasi SWR & Masuk ke Tabel Riwayat Penilaian]
```

---

#### H. Log Riwayat & Audit Perubahan Siswa

Alur penelusuran audit di [src/app/(dashboard)/riwayat/page.tsx](file:///Users/faizulmushofa/Documents/my-project/Projek-Kesit/src/app/(dashboard)/riwayat/page.tsx):

```mermaid
flowchart TD
    Start([Buka Modul Riwayat]) --> LoadAudit[Ambil Data Log via useRiwayat Hook]
    LoadAudit --> FilterAudit[Filter Pencarian, Jenis Perubahan, Bulan & Tahun]
    FilterAudit --> PaginateAudit[Paginasi 10 Data per Halaman]
    PaginateAudit --> AuditTable[Tabel Log Perubahan Siswa]
    
    AuditTable --> ClickDetail[Klik Tombol Detail]
    ClickDetail --> OpenAuditModal[Buka Modal Detail Riwayat]
    OpenAuditModal --> DisplayAuditData[Tampilkan Data Sebelum & Sesudah Perubahan, Tanggal & Petugas]
```

---

## 4. Arsitektur & Teknologi

```
┌────────────────────────────────────────────────────────┐
│                   CLIENT (BROWSER)                     │
│  Next.js 16 Client Components (React 19)               │
│  - SWR (Real-time Cache, Auto Revalidation & Mutate)   │
│  - CSS Responsive + Tailwind CSS v4 Global Tokens      │
│  - Lucide React Icons & jsPDF Kuitansi Engine          │
└───────────────────────────┬────────────────────────────┘
                            │ HTTPS / Server Actions
┌───────────────────────────▼────────────────────────────┐
│               SERVER (NEXT.JS 16 APP ROUTER)           │
│  - Server Actions (/src/server/actions/*)              │
│  - Input Validation via Zod 4 (/src/server/validators) │
│  - Business Services Layer (/src/server/services/*)    │
│  - Direct Repository Layer (/src/server/repositories/*)│
│  - Session & Cookie Config (/src/server/supabase/*)    │
└───────────────────────────┬────────────────────────────┘
                            │ PostgreSQL Protocol / REST
┌───────────────────────────▼────────────────────────────┐
│               SUPABASE CLOUD DATABASE                  │
│  - PostgreSQL 15+ Engine                               │
│  - Row Level Security (RLS) & Multi-Role Policies      │
│  - Triggers: Auto Quota Deduct & Audit Log Insertion   │
│  - Database Views (v_absensi_siswa, v_jadwal_pelatih)  │
└────────────────────────────────────────────────────────┘
```

- **Frontend:** Next.js `16.3.5` (App Router), React `19.2.8`, Lucide Icons `1.47.0`
- **Data Fetching:** SWR `2.5.1` (Optimistic mutation & background refetch)
- **Validasi Data:** Zod `4.6.5`
- **Penerbitan Kuitansi:** jsPDF `4.2.1` & jsPDF-AutoTable `5.0.8`
- **Desain & Gaya:** Tailwind CSS `v4` & Custom Global Design Tokens (`globals.css`)
- **Backend & Autentikasi:** Supabase Auth & SSR Package `@supabase/ssr 0.12.7`
- **Basis Data:** Supabase PostgreSQL with RLS, Stored Functions & Triggers

---

## 5. Struktur Direktori Proyek

```bash
Projek-Kesit/
├── .agents/                    # Konfigurasi skill dan panduan AI coding assistant
├── public/                     # Aset publik statis (favicon, logo klub, ikon)
├── scripts/                    # Skrip utilitas mandiri basis data
│   ├── migrate.mjs             # Menjalankan migrasi SQL berurutan
│   ├── seed.mjs                # Mengisi data awal master & akun uji coba
│   └── sync-prod-to-dev.mjs    # Sinkronisasi skema production ke lokal
├── src/
│   ├── app/                    # Next.js App Router (Rute & Halaman)
│   │   ├── (auth)/login/       # Halaman Login
│   │   ├── (dashboard)/        # Layout dashboard berotentikasi & Topbar
│   │   │   ├── absensi/        # Presensi multi-sesi & kuota otomatis (Aktif)
│   │   │   ├── jadwal/         # Manajemen jadwal latihan pelatih (Aktif)
│   │   │   ├── keuangan/       # Placeholder Keuangan & Kas (Coming Soon)
│   │   │   ├── laporan-siswa/  # Placeholder Rapor Siswa (Coming Soon)
│   │   │   ├── paket-pembayaran/# Placeholder Katalog Paket (Coming Soon)
│   │   │   ├── pelatih/        # Manajemen data pelatih & training (Aktif)
│   │   │   ├── pengaturan/     # Placeholder Pengaturan Sistem (Coming Soon)
│   │   │   ├── penilaian/      # Evaluasi performa KPI pelatih & sanksi (Aktif)
│   │   │   ├── riwayat/        # Log audit & histori mutasi siswa (Aktif)
│   │   │   ├── siswa/
│   │   │   │   ├── pendaftaran/# Wizard 4 langkah siswa baru (Aktif)
│   │   │   │   └── rekapan/    # Tabel siswa, detail & mutasi kelas (Aktif)
│   │   │   └── page.tsx        # Dashboard ringkasan metrik utama (Aktif)
│   │   ├── api/                # API Route Handlers (/api/jadwal)
│   │   ├── globals.css         # Design system & CSS responsive
│   │   └── layout.tsx          # Root HTML layout & toast provider
│   ├── components/             # Reusable UI & Layout Components
│   │   ├── layout/             # Topbar, Sidebar, DashboardShell
│   │   └── ui/                 # Toast, Modal, DataTable, Skeleton, Button, ComingSoon
│   ├── hooks/                  # Custom Hooks (useAuth, usePelatih, useJadwal, usePenilaian, useRiwayat)
│   ├── lib/                    # Utilitas (pdf.ts, utils.ts, swr-keys.ts)
│   ├── server/                 # Arsitektur Backend Server-Side
│   │   ├── actions/            # Next.js Server Actions ('use server')
│   │   ├── constants/          # Master lokasi, paket, data sesi, peran (RBAC)
│   │   ├── repositories/       # Query langsung ke database Supabase
│   │   ├── services/           # Logika bisnis & aturan otorisasi
│   │   ├── supabase/           # Server client, admin client, cookie config
│   │   └── validators/         # Zod schemas untuk validasi input
│   └── types/                  # Definisi TypeScript interface & database types
├── supabase/
│   └── migrations/             # Berkas SQL migrasi database (001 s/d 010)
├── next.config.ts              # Konfigurasi Next.js (optimasi package imports)
├── package.json                # Dependensi proyek & npm scripts
└── tsconfig.json               # Konfigurasi TypeScript compiler
```

---

## 6. Panduan Instalasi & Menjalankan Lokal

### 6.1 Prasyarat Sistem
- **Node.js:** Versi `20.x` atau lebih baru
- **NPM:** Versi `10.x` atau lebih baru
- **Proyek Supabase:** Instance Supabase PostgreSQL aktif

### 6.2 Langkah Instalasi

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

## 7. Skrip Database & Migrasi

Tersedia sejumlah perintah otomatis pada `package.json`:

- `npm run db:migrate`  
  Menjalankan seluruh berkas SQL migrasi pada folder `supabase/migrations/` secara berurutan menggunakan koneksi `DATABASE_URL`.
- `npm run db:seed`  
  Membuat akun bawaan Owner/Admin/Pelatih serta menginisialisasi master paket dan lokasi latihan.
- `npm run db:sync-prod`  
  Menyinkronkan skema produksi ke basis data pengembangan lokal.

---

## 8. Standar Kode & Git Workflow

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
