console.log("KESIT Management - Rekapan Siswa versi edit aktif");

const OWNER_KESIT = "Sukma Irawan & Ari Setiawan";

const dataLokasi = {
  "Kolam Renang Danau Biru AlBanawi": ["Reguler", "Private", "Prestasi"],
  "Cafe Fameliza": ["Reguler"],
  "Agrowisata Onokabe": ["Reguler"]
};

const dataPaket = {
  Reguler: [
    { nama: "Reguler Pemula", harga: 100000, kuota: 6 },
    { nama: "Reguler Pra Prestasi", harga: 120000, kuota: 6 }
  ],
  Private: [
    { nama: "Private Pemula", harga: 250000, kuota: 10 },
    { nama: "Private Pra Prestasi", harga: 300000, kuota: 10 }
  ],
  Prestasi: [
    { nama: "Prestasi 4x / Minggu", harga: 200000, kuota: 16 },
    { nama: "Prestasi 6x / Minggu", harga: 250000, kuota: 24 },
    { nama: "Prestasi 8x / Minggu", harga: 300000, kuota: 32 }
  ]
};

let semuaSiswa = [];
let dataTampil = [];
let semuaPelatih = [];
let mapPelatihId = new Map();
let halamanSaatIni = 1;
let jumlahPerHalaman = 10;
let siswaTerpilih = null;
let emailAdminLogin = "";

function roleAktif() {
  return window.KESIT_AUTH?.role || sessionStorage.getItem("kesit_role") || "";
}

function adalahPelatih() {
  return roleAktif() === "Pelatih";
}

function bolehKelolaSiswa() {
  return ["Owner", "Admin"].includes(roleAktif());
}

async function tungguAuthSiap() {
  if (window.KESIT_AUTH_READY) {
    await window.KESIT_AUTH_READY;
  } else if (typeof window.cekLoginAdmin === "function") {
    await window.cekLoginAdmin();
  }
}

function aturTampilanSesuaiRole() {
  const pelatih = adalahPelatih();

  document.querySelectorAll('[data-role-only]').forEach((el) => {
    const daftar = String(el.dataset.roleOnly || "")
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
    el.style.display = daftar.includes(roleAktif()) ? "" : "none";
  });

  const pembayaran = document.getElementById("detailPembayaranSection");
  if (pembayaran) pembayaran.style.display = pelatih ? "none" : "";

  const menunggu = document.getElementById("statMenungguCard");
  if (menunggu) menunggu.style.display = pelatih ? "none" : "";

  document.querySelectorAll('[data-payment-status="true"]').forEach((el) => {
    el.hidden = pelatih;
  });

  if (pelatih && filterPelatih) {
    const label = filterPelatih.closest("label");
    if (label) label.style.display = "none";
  }
}

const $ = (id) => document.getElementById(id);

const tableBody = $("tableBody");
const emptyState = $("emptyState");
const searchInput = $("searchInput");
const searchTop = $("searchTop");
const filterLokasi = $("filterLokasi");
const filterKelas = $("filterKelas");
const filterStatus = $("filterStatus");
const filterPelatih = $("filterPelatih");
const btnReset = $("btnReset");
const btnCari = $("btnCari");
const rowsPerPage = $("rowsPerPage");
const tableInfo = $("tableInfo");
const pagination = $("pagination");

const detailModal = $("detailModal");
const editModal = $("editModal");
const pindahModal = $("pindahModal");


/* =====================================================
   STATUS PELATIH
===================================================== */

function normalisasiStatusPelatih(status) {
  const nilai =
    String(status || "")
      .trim()
      .toLowerCase();

  if (nilai === "training") {
    return "Training";
  }

  if (
    nilai === "tidak aktif" ||
    nilai === "nonaktif" ||
    nilai === "non aktif"
  ) {
    return "Tidak Aktif";
  }

  return "Aktif";
}


function tanggalISOKeLokal(nilai) {
  if (!nilai) {
    return null;
  }

  const bagian =
    String(nilai)
      .split("-")
      .map(Number);

  if (
    bagian.length !== 3 ||
    bagian.some(
      (angka) =>
        !Number.isFinite(angka)
    )
  ) {
    return null;
  }

  return new Date(
    bagian[0],
    bagian[1] - 1,
    bagian[2]
  );
}


function trainingSudahBerakhir(pelatih) {
  if (
    normalisasiStatusPelatih(
      pelatih.status
    ) !== "Training"
  ) {
    return false;
  }

  const akhir =
    tanggalISOKeLokal(
      pelatih.tanggal_berakhir_training
    );

  if (!akhir) {
    return false;
  }

  const hariIni =
    new Date();

  hariIni.setHours(
    0,
    0,
    0,
    0
  );

  akhir.setHours(
    0,
    0,
    0,
    0
  );

  return hariIni > akhir;
}


function pelatihTersediaOperasional(
  pelatih
) {
  if (
    pelatih.nama ===
    OWNER_KESIT
  ) {
    return true;
  }

  const status =
    normalisasiStatusPelatih(
      pelatih.status
    );

  if (
    status ===
    "Tidak Aktif"
  ) {
    return false;
  }

  if (
    status === "Training" &&
    trainingSudahBerakhir(
      pelatih
    )
  ) {
    return false;
  }

  return true;
}


function labelPelatih(pelatih) {
  return (
    normalisasiStatusPelatih(
      pelatih.status
    ) === "Training"
      ? `${pelatih.nama} — Training`
      : pelatih.nama
  );
}


/* =====================================================
   LOAD PELATIH
===================================================== */

async function loadPelatih() {
  const {
    data,
    error
  } =
    await window.supabaseClient
      .from("pelatih")
      .select(
        "id,nama,status,tanggal_mulai_training,tanggal_berakhir_training"
      )
      .order(
        "nama",
        {
          ascending: true
        }
      );

  if (error) {
    throw new Error(
      `Data pelatih gagal dimuat: ${error.message}`
    );
  }

  semuaPelatih =
    (data || [])
      .filter(
        pelatihTersediaOperasional
      );

  mapPelatihId =
    new Map(
      semuaPelatih.map(
        (pelatih) => [
          pelatih.nama,
          pelatih.id
        ]
      )
    );
}


/* =====================================================
   LOAD DATA SISWA
===================================================== */

async function loadData() {
  await tungguAuthSiap();

  const { data: sessionData, error: sessionError } =
    await window.supabaseClient.auth.getSession();

  if (sessionError || !sessionData.session) {
    window.location.href = "index.html";
    return;
  }

  emailAdminLogin =
    window.KESIT_AUTH?.nama ||
    window.KESIT_AUTH?.username ||
    sessionData.session.user?.email ||
    "User KESIT";

  const namaView = adalahPelatih()
    ? "v_rekapan_siswa_pelatih"
    : "v_rekapan_siswa";

  const permintaan = [
    window.supabaseClient
      .from(namaView)
      .select("*")
      .order("tanggal_daftar", { ascending: false })
  ];

  if (bolehKelolaSiswa()) {
    permintaan.push(loadPelatih());
  }

  const hasil = await Promise.all(permintaan);
  const hasilSiswa = hasil[0];

  if (hasilSiswa.error) {
    throw new Error(`Rekapan siswa gagal dimuat: ${hasilSiswa.error.message}`);
  }

  semuaSiswa = (hasilSiswa.data || []).map(normalisasiDataSiswa);
  dataTampil = [...semuaSiswa];

  aturTampilanSesuaiRole();
  updateStatistik();
  isiFilter();
  renderTable();
}


/* =====================================================
   NORMALISASI VIEW
===================================================== */

function normalisasiDataSiswa(row) {
  return {
    id:
      row.id,

    idSiswa:
      row.id_siswa,

    namaLengkap:
      row.nama_lengkap,

    namaPanggilan:
      row.nama_panggilan,

    jenisKelamin:
      row.jenis_kelamin,

    tempatLahir:
      row.tempat_lahir,

    tanggalLahir:
      row.tanggal_lahir,

    namaWali:
      row.nama_wali,

    noHpWali:
      row.no_hp_wali,

    alamat:
      row.alamat,

    statusSiswa:
      row.status_siswa,

    tanggalDaftar:
      row.tanggal_daftar,

    pelatihPemilik:
      row.pelatih_pemilik,

    pelatihDiminta:
      row.pelatih_diminta,

    paketSiswaId:
      row.paket_siswa_id,

    lokasi:
      row.lokasi,

    kelas:
      row.kelas,

    paket:
      row.nama_paket,

    hargaPaket:
      Number(
        row.harga_paket || 0
      ),

    biayaRequestPelatih:
      Number(
        row.biaya_request_pelatih ||
        0
      ),

    diskon:
      Number(
        row.diskon || 0
      ),

    totalTagihan:
      Number(
        row.total_tagihan || 0
      ),

    kuota:
      Number(
        row.kuota_total || 0
      ),

    kuotaTerpakai:
      Number(
        row.kuota_terpakai || 0
      ),

    statusPaket:
      row.status_paket,

    nomorKuitansi:
      row.nomor_kuitansi ?? null,

    nominalDibayar:
      row.nominal_dibayar == null ? null : Number(row.nominal_dibayar),

    sisaTagihan:
      row.sisa_tagihan == null ? null : Number(row.sisa_tagihan),

    statusPembayaran:
      row.status_pembayaran ?? null,

    metodePembayaran:
      row.metode_pembayaran ?? null,

    namaAdmin:
      row.admin_penerima ?? null,

    tanggalTransaksi:
      row.tanggal_transaksi ?? null
  };
}


/* =====================================================
   STATISTIK
===================================================== */

function updateStatistik() {
  $("statTotal").innerText =
    semuaSiswa.length;

  $("statAktif").innerText =
    semuaSiswa.filter(
      (siswa) =>
        siswa.statusSiswa ===
        "Aktif"
    ).length;

  $("statNonAktif").innerText =
    semuaSiswa.filter(
      (siswa) =>
        siswa.statusSiswa ===
        "Tidak Aktif"
    ).length;

  $("statMenunggu").innerText =
    adalahPelatih()
      ? 0
      : semuaSiswa.filter(
          (siswa) =>
            siswa.statusPembayaran &&
            siswa.statusPembayaran !== "Lunas"
        ).length;

  $("statLokasi").innerText =
    new Set(
      semuaSiswa
        .map(
          (siswa) =>
            siswa.lokasi
        )
        .filter(Boolean)
    ).size;

  $("statKelas").innerText =
    new Set(
      semuaSiswa
        .map(
          (siswa) =>
            siswa.kelas
        )
        .filter(Boolean)
    ).size;
}


/* =====================================================
   FILTER
===================================================== */

function isiSelectUnik(
  element,
  daftar,
  labelAwal
) {
  const nilaiSekarang =
    element.value;

  const unik =
    [
      ...new Set(
        daftar.filter(Boolean)
      )
    ].sort(
      (a, b) =>
        a.localeCompare(
          b,
          "id"
        )
    );

  element.innerHTML =
    `<option value="">${labelAwal}</option>`;

  unik.forEach(
    (nilai) => {
      const option =
        document.createElement(
          "option"
        );

      option.value =
        nilai;

      option.textContent =
        nilai;

      element.appendChild(
        option
      );
    }
  );

  if (
    unik.includes(
      nilaiSekarang
    )
  ) {
    element.value =
      nilaiSekarang;
  }
}


function isiFilter() {
  isiSelectUnik(
    filterLokasi,
    semuaSiswa.map(
      (siswa) =>
        siswa.lokasi
    ),
    "Semua Lokasi"
  );

  isiSelectUnik(
    filterKelas,
    semuaSiswa.map(
      (siswa) =>
        siswa.kelas
    ),
    "Semua Kelas"
  );

  isiSelectUnik(
    filterPelatih,
    semuaSiswa.flatMap(
      (siswa) => [
        siswa.pelatihPemilik,
        siswa.pelatihDiminta
      ]
    ),
    "Semua Pelatih"
  );
}


function jalankanFilter() {
  const keyword =
    searchInput.value
      .trim()
      .toLowerCase();

  const lokasiDipilih =
    filterLokasi.value;

  const kelasDipilih =
    filterKelas.value;

  const statusDipilih =
    filterStatus.value;

  const pelatihDipilih =
    filterPelatih.value;

  dataTampil =
    semuaSiswa.filter(
      (siswa) => {
        const gabungan =
          [
            siswa.idSiswa,
            siswa.namaLengkap,
            siswa.namaPanggilan,
            siswa.namaWali,
            siswa.noHpWali
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

        const cocokCari =
          !keyword ||
          gabungan.includes(
            keyword
          );

        const cocokLokasi =
          !lokasiDipilih ||
          siswa.lokasi ===
          lokasiDipilih;

        const cocokKelas =
          !kelasDipilih ||
          siswa.kelas ===
          kelasDipilih;

        const cocokPelatih =
          !pelatihDipilih ||
          siswa.pelatihPemilik ===
          pelatihDipilih ||
          siswa.pelatihDiminta ===
          pelatihDipilih;

        let cocokStatus =
          true;

        if (
          statusDipilih ===
            "Aktif" ||
          statusDipilih ===
            "Tidak Aktif"
        ) {
          cocokStatus =
            siswa.statusSiswa ===
            statusDipilih;
        }

        else if (statusDipilih && !adalahPelatih()) {
          cocokStatus = siswa.statusPembayaran === statusDipilih;
        }

        return (
          cocokCari &&
          cocokLokasi &&
          cocokKelas &&
          cocokPelatih &&
          cocokStatus
        );
      }
    );

  halamanSaatIni =
    1;

  renderTable();
}


function resetFilter() {
  searchInput.value = "";
  searchTop.value = "";
  filterLokasi.value = "";
  filterKelas.value = "";
  filterStatus.value = "";
  filterPelatih.value = "";

  dataTampil =
    [...semuaSiswa];

  halamanSaatIni =
    1;

  renderTable();
}


/* =====================================================
   RENDER TABLE
===================================================== */

function renderTable() {
  tableBody.innerHTML = "";

  if (!dataTampil.length) {
    emptyState.classList.remove("hidden");
    tableInfo.innerText = "Menampilkan 0 siswa";
    pagination.innerHTML = "";
    return;
  }

  emptyState.classList.add("hidden");

  const totalHalaman = Math.ceil(dataTampil.length / jumlahPerHalaman);
  if (halamanSaatIni > totalHalaman) halamanSaatIni = totalHalaman;

  const indexAwal = (halamanSaatIni - 1) * jumlahPerHalaman;
  const indexAkhir = indexAwal + jumlahPerHalaman;
  const daftar = dataTampil.slice(indexAwal, indexAkhir);

  daftar.forEach((siswa) => {
    const kuotaTotal = Number(siswa.kuota || 0);
    const kuotaTerpakai = Number(siswa.kuotaTerpakai || 0);
    const sisaKuota = Math.max(kuotaTotal - kuotaTerpakai, 0);
    const persentase = kuotaTotal > 0
      ? Math.min((kuotaTerpakai / kuotaTotal) * 100, 100)
      : 0;

    const tombolKelola = bolehKelolaSiswa()
      ? `
        <button type="button" class="edit-button" data-action="edit" data-id="${aman(siswa.idSiswa)}">Edit</button>
        <button type="button" class="pindah-button" data-action="pindah" data-id="${aman(siswa.idSiswa)}">Naik / Pindah</button>
      `
      : "";

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>
        <div class="student-name">${aman(siswa.namaLengkap)}</div>
        <div class="student-sub">${aman(siswa.idSiswa || "-")}</div>
      </td>

      <td>
        <div class="package-name">${aman(siswa.paket || "-")}</div>
        <div class="student-sub">${aman(siswa.lokasi || "-")}</div>
      </td>

      <td>
        <div class="quota-box compact">
          <div class="quota-text">Sisa ${sisaKuota} / ${kuotaTotal}</div>
          <div class="quota-bar">
            <div class="quota-progress" style="width:${persentase}%"></div>
          </div>
        </div>
      </td>

      <td>${buatBadgeStatus(siswa.statusSiswa)}</td>

      <td>
        <div class="action-buttons">
          <button type="button" class="detail-button" data-action="detail" data-id="${aman(siswa.idSiswa)}">Detail</button>
          ${tombolKelola}
        </div>
      </td>
    `;

    tableBody.appendChild(row);
  });

  pasangEventAksi();

  const nomorAwal = indexAwal + 1;
  const nomorAkhir = Math.min(indexAkhir, dataTampil.length);
  tableInfo.innerText = `Menampilkan ${nomorAwal} - ${nomorAkhir} dari ${dataTampil.length} siswa`;
  renderPagination(totalHalaman);
}


/* =====================================================
   EVENT AKSI TABEL
===================================================== */

function pasangEventAksi() {
  tableBody
    .querySelectorAll(
      "button[data-action]"
    )
    .forEach(
      (button) => {
        button.addEventListener(
          "click",
          () => {
            const siswa =
              semuaSiswa.find(
                (item) =>
                  item.idSiswa ===
                  button.dataset.id
              );

            if (!siswa) {
              return;
            }

            if (
              button.dataset.action ===
              "detail"
            ) {
              bukaDetail(
                siswa
              );
            }

            if (button.dataset.action === "edit" && bolehKelolaSiswa()) {
              bukaEdit(siswa);
            }

            if (button.dataset.action === "pindah" && bolehKelolaSiswa()) {
              bukaPindah(siswa);
            }
          }
        );
      }
    );
}


/* =====================================================
   BADGE
===================================================== */

function buatBadgePembayaran(
  status
) {
  if (
    status === "Lunas"
  ) {
    return `
      <span class="payment-badge badge-green">
        Lunas
      </span>
    `;
  }

  if (
    status ===
    "Dibayar Sebagian"
  ) {
    return `
      <span class="payment-badge badge-orange">
        Sebagian
      </span>
    `;
  }

  return `
    <span class="payment-badge badge-red">
      Belum Dibayar
    </span>
  `;
}


function buatBadgeStatus(
  status
) {
  return (
    status === "Aktif"
      ? `
        <span class="status-badge badge-green">
          Aktif
        </span>
      `
      : `
        <span class="status-badge badge-red">
          Non Aktif
        </span>
      `
  );
}


/* =====================================================
   PAGINATION
===================================================== */

function renderPagination(
  totalHalaman
) {
  pagination.innerHTML =
    "";

  if (
    totalHalaman <= 1
  ) {
    return;
  }

  const prev =
    buatTombolHalaman(
      "‹",
      halamanSaatIni - 1
    );

  prev.disabled =
    halamanSaatIni === 1;

  pagination.appendChild(
    prev
  );

  const mulai =
    Math.max(
      1,
      halamanSaatIni - 2
    );

  const akhir =
    Math.min(
      totalHalaman,
      halamanSaatIni + 2
    );

  for (
    let i = mulai;
    i <= akhir;
    i++
  ) {
    const tombol =
      buatTombolHalaman(
        i,
        i
      );

    if (
      i === halamanSaatIni
    ) {
      tombol.classList.add(
        "active"
      );
    }

    pagination.appendChild(
      tombol
    );
  }

  const next =
    buatTombolHalaman(
      "›",
      halamanSaatIni + 1
    );

  next.disabled =
    halamanSaatIni ===
    totalHalaman;

  pagination.appendChild(
    next
  );
}


function buatTombolHalaman(
  label,
  halaman
) {
  const tombol =
    document.createElement(
      "button"
    );

  tombol.type =
    "button";

  tombol.className =
    "page-button";

  tombol.textContent =
    label;

  tombol.addEventListener(
    "click",
    () => {
      halamanSaatIni =
        halaman;

      renderTable();
    }
  );

  return tombol;
}


/* =====================================================
   MODAL DASAR
===================================================== */

function bukaModal(
  modal
) {
  modal.classList.remove(
    "hidden"
  );

  document.body.classList.add(
    "modal-open"
  );
}


function tutupModal(
  modal
) {
  modal.classList.add(
    "hidden"
  );

  if (
    [
      detailModal,
      editModal,
      pindahModal
    ].every(
      (item) =>
        item.classList.contains(
          "hidden"
        )
    )
  ) {
    document.body.classList.remove(
      "modal-open"
    );
  }
}
/* =====================================================
   DETAIL SISWA
===================================================== */

function bukaDetail(
  siswa
) {
  siswaTerpilih =
    siswa;

  $("detailNama").innerText =
    siswa.namaLengkap ||
    "-";

  $("detailId").innerText =
    siswa.idSiswa ||
    "-";

  $("dNamaLengkap").innerText =
    siswa.namaLengkap ||
    "-";

  $("dNamaPanggilan").innerText =
    siswa.namaPanggilan ||
    "-";

  $("dGender").innerText =
    siswa.jenisKelamin ||
    "-";

  $("dTempatLahir").innerText =
    siswa.tempatLahir ||
    "-";

  $("dTanggalLahir").innerText =
    formatTanggalIndonesia(
      siswa.tanggalLahir
    );

  $("dTanggalDaftar").innerText =
    formatTanggalIndonesia(
      siswa.tanggalDaftar
    );

  $("dStatusSiswa").innerText =
    siswa.statusSiswa ||
    "-";

  $("dNamaWali").innerText =
    siswa.namaWali ||
    "-";

  $("dWhatsapp").innerText =
    siswa.noHpWali ||
    "-";

  $("dAlamat").innerText =
    siswa.alamat ||
    "-";

  $("dLokasi").innerText =
    siswa.lokasi ||
    "-";

  $("dKelas").innerText =
    siswa.kelas ||
    "-";

  $("dPaket").innerText =
    siswa.paket ||
    "-";

  $("dPelatihPemilik").innerText =
    siswa.pelatihPemilik ||
    "-";

  $("dPelatihDiminta").innerText =
    siswa.pelatihDiminta ||
    "Tidak Request";

  $("dKuota").innerText =
    `${siswa.kuotaTerpakai || 0} / ${siswa.kuota || 0}`;

  const pembayaranSection = $("detailPembayaranSection");
  if (pembayaranSection) {
    pembayaranSection.style.display = adalahPelatih() ? "none" : "";
  }

  $("btnEditDariDetail").style.display = bolehKelolaSiswa() ? "" : "none";
  $("btnPindahDariDetail").style.display = bolehKelolaSiswa() ? "" : "none";
  $("btnPembayaran").style.display = bolehKelolaSiswa() ? "" : "none";

  if (adalahPelatih()) {
    bukaModal(detailModal);
    return;
  }

  $("dHarga").innerText =
    formatRupiah(
      siswa.hargaPaket
    );

  $("dRequest").innerText =
    formatRupiah(
      siswa.biayaRequestPelatih
    );

  $("dDiskon").innerText =
    formatRupiah(
      siswa.diskon
    );

  $("dTotal").innerText =
    formatRupiah(
      siswa.totalTagihan
    );

  $("dDibayar").innerText =
    formatRupiah(
      siswa.nominalDibayar
    );

  $("dSisa").innerText =
    formatRupiah(
      siswa.sisaTagihan
    );

  $("dStatusPembayaran").innerText =
    siswa.statusPembayaran ||
    "-";

  $("dMetode").innerText =
    siswa.metodePembayaran ||
    "-";

  $("dAdmin").innerText =
    siswa.namaAdmin ||
    "-";

  bukaModal(
    detailModal
  );
}


/* =====================================================
   EDIT BIODATA
===================================================== */

function bukaEdit(
  siswa
) {
  if (!bolehKelolaSiswa()) {
    alert("Akses ditolak. Pelatih hanya dapat melihat detail siswa terkait.");
    return;
  }

  siswaTerpilih =
    siswa;

  $("editSiswaId").value =
    siswa.id ||
    "";

  $("editIdSiswa").value =
    siswa.idSiswa ||
    "";

  $("editInfoSiswa").innerText =
    `${siswa.namaLengkap || "-"} • ${siswa.idSiswa || "-"}`;

  $("editNamaLengkap").value =
    siswa.namaLengkap ||
    "";

  $("editNamaPanggilan").value =
    siswa.namaPanggilan ||
    "";

  $("editJenisKelamin").value =
    siswa.jenisKelamin ||
    "";

  $("editTempatLahir").value =
    siswa.tempatLahir ||
    "";

  $("editTanggalLahir").value =
    siswa.tanggalLahir ||
    "";

  $("editStatusSiswa").value =
    siswa.statusSiswa ||
    "Aktif";

  $("editNamaWali").value =
    siswa.namaWali ||
    "";

  $("editNoHpWali").value =
    siswa.noHpWali ||
    "";

  $("editAlamat").value =
    siswa.alamat ||
    "";

  bukaModal(
    editModal
  );
}


$("formEditSiswa").addEventListener(
  "submit",
  async function (
    event
  ) {
    event.preventDefault();

    if (!bolehKelolaSiswa()) {
      alert("Akses ditolak.");
      return;
    }

    const btn =
      $("btnSimpanEdit");

    const teksAsli =
      btn.innerText;

    btn.disabled =
      true;

    btn.innerText =
      "Menyimpan...";

    try {
      const siswaId =
        $("editSiswaId").value;

      if (!siswaId) {
        throw new Error(
          "ID database siswa tidak ditemukan."
        );
      }

      const {
        error
      } =
        await window.supabaseClient
          .rpc(
            "kesit_edit_biodata_siswa",
            {
              p_siswa_id:
                siswaId,

              p_nama_lengkap:
                $("editNamaLengkap")
                  .value
                  .trim(),

              p_nama_panggilan:
                $("editNamaPanggilan")
                  .value
                  .trim(),

              p_jenis_kelamin:
                $("editJenisKelamin")
                  .value,

              p_tempat_lahir:
                $("editTempatLahir")
                  .value
                  .trim(),

              p_tanggal_lahir:
                $("editTanggalLahir")
                  .value ||
                null,

              p_nama_wali:
                $("editNamaWali")
                  .value
                  .trim(),

              p_no_hp_wali:
                $("editNoHpWali")
                  .value
                  .trim(),

              p_alamat:
                $("editAlamat")
                  .value
                  .trim(),

              p_status_siswa:
                $("editStatusSiswa")
                  .value
            }
          );

      if (error) {
        throw error;
      }

      alert(
        "Biodata siswa berhasil diperbarui."
      );

      tutupModal(
        editModal
      );

      await loadData();
    }

    catch (error) {
      console.error(
        error
      );

      alert(
        "Gagal menyimpan biodata siswa.\n\n" +
        error.message
      );
    }

    finally {
      btn.disabled =
        false;

      btn.innerText =
        teksAsli;
    }
  }
);


/* =====================================================
   DATA DROPDOWN PINDAH KELAS
===================================================== */

function isiKelasPindah(
  lokasiDipilih
) {
  const select =
    $("pindahKelasBaru");

  select.innerHTML =
    `<option value="">Pilih kelas</option>`;

  const daftar =
    dataLokasi[
      lokasiDipilih
    ] || [];

  daftar.forEach(
    (namaKelas) => {
      const option =
        document.createElement(
          "option"
        );

      option.value =
        namaKelas;

      option.textContent =
        namaKelas;

      select.appendChild(
        option
      );
    }
  );
}


function isiPaketPindah(
  kelasDipilih
) {
  const select =
    $("pindahPaketBaru");

  select.innerHTML =
    `<option value="">Pilih paket</option>`;

  const daftar =
    dataPaket[
      kelasDipilih
    ] || [];

  daftar.forEach(
    (item) => {
      const option =
        document.createElement(
          "option"
        );

      option.value =
        item.nama;

      option.textContent =
        item.nama;

      select.appendChild(
        option
      );
    }
  );
}


function isiPelatihPindah(
  kelasDipilih
) {
  const selectPemilik =
    $("pindahPelatihPemilik");

  const selectDiminta =
    $("pindahPelatihDiminta");

  selectPemilik.innerHTML =
    `<option value="">Pilih pelatih</option>`;

  selectDiminta.innerHTML =
    `<option value="">Tidak Request Pelatih</option>`;

  let daftar =
    [...semuaPelatih];

  if (
    kelasDipilih ===
    "Prestasi"
  ) {
    daftar =
      semuaPelatih.filter(
        (pelatih) =>
          pelatih.nama ===
          OWNER_KESIT
      );
  }

  daftar.forEach(
    (pelatih) => {
      const optionPemilik =
        document.createElement(
          "option"
        );

      optionPemilik.value =
        pelatih.id;

      optionPemilik.textContent =
        labelPelatih(
          pelatih
        );

      selectPemilik.appendChild(
        optionPemilik
      );
    }
  );

  semuaPelatih.forEach(
    (pelatih) => {
      const optionDiminta =
        document.createElement(
          "option"
        );

      optionDiminta.value =
        pelatih.id;

      optionDiminta.textContent =
        labelPelatih(
          pelatih
        );

      selectDiminta.appendChild(
        optionDiminta
      );
    }
  );

  if (
    kelasDipilih ===
    "Prestasi"
  ) {
    const owner =
      semuaPelatih.find(
        (pelatih) =>
          pelatih.nama ===
          OWNER_KESIT
      );

    if (owner) {
      selectPemilik.value =
        owner.id;
    }
  }
}


function aturPelatihDimintaPindah(
  kelasDipilih
) {
  const bagian =
    $("bagianPindahPelatihDiminta");

  if (
    kelasDipilih ===
    "Private"
  ) {
    bagian.style.display =
      "flex";
  }

  else {
    bagian.style.display =
      "none";

    $("pindahPelatihDiminta").value =
      "";
  }

  hitungBiayaRequestPindah();
}


function cariPaketPindah() {
  const kelas =
    $("pindahKelasBaru").value;

  const namaPaket =
    $("pindahPaketBaru").value;

  if (
    !kelas ||
    !namaPaket
  ) {
    return null;
  }

  return (
    dataPaket[
      kelas
    ] || []
  ).find(
    (item) =>
      item.nama ===
      namaPaket
  ) || null;
}


function updateInfoPaketPindah() {
  const data =
    cariPaketPindah();

  if (!data) {
    $("pindahHargaPaket").value =
      "";

    $("pindahHargaPaket").dataset.nilai =
      0;

    $("pindahKuota").value =
      "";

    $("pindahKuota").dataset.nilai =
      0;

    hitungTotalPindah();

    return;
  }

  $("pindahHargaPaket").dataset.nilai =
    data.harga;

  $("pindahHargaPaket").value =
    formatRupiah(
      data.harga
    );

  $("pindahKuota").dataset.nilai =
    data.kuota;

  $("pindahKuota").value =
    `${data.kuota} pertemuan`;

  hitungTotalPindah();
}


function hitungBiayaRequestPindah() {
  const kelas =
    $("pindahKelasBaru").value;

  let biaya =
    0;

  if (
    kelas === "Private" &&
    $("pindahPelatihDiminta").value
  ) {
    const pelatihId =
      $("pindahPelatihDiminta").value;

    const pelatih =
      semuaPelatih.find(
        (item) =>
          item.id ===
          pelatihId
      );

    if (
      pelatih &&
      pelatih.nama ===
      OWNER_KESIT
    ) {
      biaya =
        100000;
    }

    else {
      biaya =
        50000;
    }
  }

  $("pindahBiayaRequest").dataset.nilai =
    biaya;

  $("pindahBiayaRequest").value =
    formatRupiah(
      biaya
    );

  hitungTotalPindah();
}


function hitungTotalPindah() {
  const harga =
    Number(
      $("pindahHargaPaket")
        .dataset.nilai ||
      0
    );

  const request =
    Number(
      $("pindahBiayaRequest")
        .dataset.nilai ||
      0
    );

  let diskon =
    Number(
      $("pindahDiskon")
        .value ||
      0
    );

  if (
    diskon < 0
  ) {
    diskon =
      0;

    $("pindahDiskon").value =
      0;
  }

  const subtotal =
    harga +
    request;

  if (
    diskon >
    subtotal
  ) {
    diskon =
      subtotal;

    $("pindahDiskon").value =
      subtotal;
  }

  const total =
    Math.max(
      subtotal -
      diskon,
      0
    );

  $("pindahTotalTagihan").dataset.nilai =
    total;

  $("pindahTotalTagihan").value =
    formatRupiah(
      total
    );
}


/* =====================================================
   BUKA PINDAH KELAS
===================================================== */

function bukaPindah(
  siswa
) {
  if (!bolehKelolaSiswa()) {
    alert("Akses ditolak. Perubahan kelas hanya dapat dilakukan Owner/Admin.");
    return;
  }

  siswaTerpilih =
    siswa;

  $("pindahSiswaId").value =
    siswa.id ||
    "";

  $("pindahPaketSiswaId").value =
    siswa.paketSiswaId ||
    "";

  $("pindahInfoSiswa").innerText =
    `${siswa.namaLengkap || "-"} • ${siswa.idSiswa || "-"}`;

  $("pindahLokasiLama").innerText =
    siswa.lokasi ||
    "-";

  $("pindahKelasLama").innerText =
    siswa.kelas ||
    "-";

  $("pindahPaketLama").innerText =
    siswa.paket ||
    "-";

  $("pindahPelatihLama").innerText =
    siswa.pelatihPemilik ||
    "-";

  $("pindahLokasiBaru").value =
    "";

  $("pindahKelasBaru").innerHTML =
    `<option value="">Pilih lokasi terlebih dahulu</option>`;

  $("pindahPaketBaru").innerHTML =
    `<option value="">Pilih kelas terlebih dahulu</option>`;

  $("pindahPelatihPemilik").innerHTML =
    `<option value="">Pilih pelatih</option>`;

  $("pindahPelatihDiminta").innerHTML =
    `<option value="">Tidak Request Pelatih</option>`;

  $("pindahHargaPaket").value =
    "";

  $("pindahHargaPaket").dataset.nilai =
    0;

  $("pindahKuota").value =
    "";

  $("pindahKuota").dataset.nilai =
    0;

  $("pindahBiayaRequest").value =
    formatRupiah(
      0
    );

  $("pindahBiayaRequest").dataset.nilai =
    0;

  $("pindahDiskon").value =
    0;

  $("pindahTotalTagihan").value =
    formatRupiah(
      0
    );

  $("pindahTotalTagihan").dataset.nilai =
    0;

  $("pindahAlasan").value =
    "";

  $("bagianPindahPelatihDiminta")
    .style.display =
    "none";

  bukaModal(
    pindahModal
  );
}


/* =====================================================
   EVENT PINDAH KELAS
===================================================== */

$("pindahLokasiBaru").addEventListener(
  "change",
  function () {
    isiKelasPindah(
      this.value
    );

    $("pindahPaketBaru").innerHTML =
      `<option value="">Pilih kelas terlebih dahulu</option>`;

    $("pindahPelatihPemilik").innerHTML =
      `<option value="">Pilih pelatih</option>`;

    $("pindahPelatihDiminta").innerHTML =
      `<option value="">Tidak Request Pelatih</option>`;

    updateInfoPaketPindah();

    aturPelatihDimintaPindah(
      ""
    );
  }
);


$("pindahKelasBaru").addEventListener(
  "change",
  function () {
    isiPaketPindah(
      this.value
    );

    isiPelatihPindah(
      this.value
    );

    aturPelatihDimintaPindah(
      this.value
    );

    updateInfoPaketPindah();
  }
);


$("pindahPaketBaru").addEventListener(
  "change",
  updateInfoPaketPindah
);


$("pindahPelatihDiminta").addEventListener(
  "change",
  hitungBiayaRequestPindah
);


$("pindahDiskon").addEventListener(
  "input",
  hitungTotalPindah
);


/* =====================================================
   SIMPAN PINDAH KELAS
===================================================== */

$("formPindahKelas").addEventListener(
  "submit",
  async function (
    event
  ) {
    event.preventDefault();

    if (!bolehKelolaSiswa()) {
      alert("Akses ditolak.");
      return;
    }

    const btn =
      $("btnSimpanPindah");

    const teksAsli =
      btn.innerText;

    btn.disabled =
      true;

    btn.innerText =
      "Menyimpan...";

    try {
      const siswaId =
        $("pindahSiswaId").value;

      const paketSiswaId =
        $("pindahPaketSiswaId").value;

      const lokasiBaru =
        $("pindahLokasiBaru").value;

      const kelasBaru =
        $("pindahKelasBaru").value;

      const paketBaru =
        $("pindahPaketBaru").value;

      const pelatihPemilikBaru =
        $("pindahPelatihPemilik").value;

      const pelatihDimintaBaru =
        $("pindahPelatihDiminta").value ||
        null;

      if (
        !siswaId ||
        !paketSiswaId
      ) {
        throw new Error(
          "Data siswa atau paket aktif tidak ditemukan."
        );
      }

      if (
        !lokasiBaru ||
        !kelasBaru ||
        !paketBaru ||
        !pelatihPemilikBaru
      ) {
        throw new Error(
          "Lokasi, kelas, paket, dan Pelatih Pemilik wajib dipilih."
        );
      }

      if (
        kelasBaru !== "Private" &&
        pelatihDimintaBaru
      ) {
        throw new Error(
          "Pelatih Diminta hanya berlaku untuk kelas Private."
        );
      }

      const harga =
        Number(
          $("pindahHargaPaket")
            .dataset.nilai ||
          0
        );

      const kuota =
        Number(
          $("pindahKuota")
            .dataset.nilai ||
          0
        );

      const biayaRequest =
        Number(
          $("pindahBiayaRequest")
            .dataset.nilai ||
          0
        );

      const diskon =
        Number(
          $("pindahDiskon")
            .value ||
          0
        );

      const total =
        Number(
          $("pindahTotalTagihan")
            .dataset.nilai ||
          0
        );

      const {
        error
      } =
        await window.supabaseClient
          .rpc(
            "kesit_pindah_kelas_siswa",
            {
              p_siswa_id:
                siswaId,

              p_paket_siswa_id:
                paketSiswaId,

              p_lokasi_baru:
                lokasiBaru,

              p_kelas_baru:
                kelasBaru,

              p_paket_baru:
                paketBaru,

              p_harga_paket_baru:
                harga,

              p_kuota_total_baru:
                kuota,

              p_pelatih_pemilik_baru:
                pelatihPemilikBaru,

              p_pelatih_diminta_baru:
                pelatihDimintaBaru,

              p_biaya_request_pelatih_baru:
                biayaRequest,

              p_diskon_baru:
                diskon,

              p_total_tagihan_baru:
                total,

              p_alasan:
                $("pindahAlasan")
                  .value
                  .trim(),

              p_diubah_oleh:
                emailAdminLogin
            }
          );

      if (error) {
        throw error;
      }

      alert(
        "Perubahan kelas berhasil disimpan dan riwayat telah dicatat."
      );

      tutupModal(
        pindahModal
      );

      await loadData();
    }

    catch (error) {
      console.error(
        error
      );

      alert(
        "Gagal menyimpan perubahan kelas.\n\n" +
        error.message
      );
    }

    finally {
      btn.disabled =
        false;

      btn.innerText =
        teksAsli;
    }
  }
);
/* =====================================================
   TOMBOL MODAL
===================================================== */

$("btnCloseModal").addEventListener(
  "click",
  function () {
    tutupModal(
      detailModal
    );
  }
);


$("btnCloseEdit").addEventListener(
  "click",
  function () {
    tutupModal(
      editModal
    );
  }
);


$("btnBatalEdit").addEventListener(
  "click",
  function () {
    tutupModal(
      editModal
    );
  }
);


$("btnClosePindah").addEventListener(
  "click",
  function () {
    tutupModal(
      pindahModal
    );
  }
);


$("btnBatalPindah").addEventListener(
  "click",
  function () {
    tutupModal(
      pindahModal
    );
  }
);


document.querySelectorAll(
  "[data-close-detail='true']"
).forEach(
  (element) => {
    element.addEventListener(
      "click",
      function () {
        tutupModal(
          detailModal
        );
      }
    );
  }
);


document.querySelectorAll(
  "[data-close-edit='true']"
).forEach(
  (element) => {
    element.addEventListener(
      "click",
      function () {
        tutupModal(
          editModal
        );
      }
    );
  }
);


document.querySelectorAll(
  "[data-close-pindah='true']"
).forEach(
  (element) => {
    element.addEventListener(
      "click",
      function () {
        tutupModal(
          pindahModal
        );
      }
    );
  }
);


/* =====================================================
   DETAIL -> EDIT / PINDAH
===================================================== */

$("btnEditDariDetail").addEventListener(
  "click",
  function () {
    if (!siswaTerpilih) {
      return;
    }

    const siswa =
      siswaTerpilih;

    tutupModal(
      detailModal
    );

    bukaEdit(
      siswa
    );
  }
);


$("btnPindahDariDetail").addEventListener(
  "click",
  function () {
    if (!siswaTerpilih) {
      return;
    }

    const siswa =
      siswaTerpilih;

    tutupModal(
      detailModal
    );

    bukaPindah(
      siswa
    );
  }
);


/* =====================================================
   TOMBOL DETAIL LAIN
===================================================== */

$("btnLaporan").addEventListener(
  "click",
  function () {
    alert(
      "Menu Laporan Siswa akan dihubungkan pada tahap pengembangan berikutnya."
    );
  }
);


$("btnAbsensi").addEventListener(
  "click",
  function () {
    alert(
      "Menu Absensi akan dihubungkan pada tahap pengembangan berikutnya."
    );
  }
);


$("btnPembayaran").addEventListener(
  "click",
  function () {
    alert(
      "Riwayat pembayaran akan dihubungkan ke menu Paket & Pembayaran."
    );
  }
);


/* =====================================================
   SEARCH & FILTER EVENT
===================================================== */

searchTop.addEventListener(
  "input",
  function () {
    searchInput.value =
      searchTop.value;

    jalankanFilter();
  }
);


searchInput.addEventListener(
  "input",
  function () {
    searchTop.value =
      searchInput.value;
  }
);


searchInput.addEventListener(
  "keydown",
  function (event) {
    if (
      event.key ===
      "Enter"
    ) {
      event.preventDefault();

      jalankanFilter();
    }
  }
);


btnCari.addEventListener(
  "click",
  jalankanFilter
);


btnReset.addEventListener(
  "click",
  resetFilter
);


filterLokasi.addEventListener(
  "change",
  jalankanFilter
);


filterKelas.addEventListener(
  "change",
  jalankanFilter
);


filterStatus.addEventListener(
  "change",
  jalankanFilter
);


filterPelatih.addEventListener(
  "change",
  jalankanFilter
);


rowsPerPage.addEventListener(
  "change",
  function () {
    jumlahPerHalaman =
      Number(
        rowsPerPage.value
      );

    halamanSaatIni =
      1;

    renderTable();
  }
);


/* =====================================================
   ESC UNTUK TUTUP MODAL
===================================================== */

document.addEventListener(
  "keydown",
  function (event) {
    if (
      event.key !==
      "Escape"
    ) {
      return;
    }

    if (
      !pindahModal.classList.contains(
        "hidden"
      )
    ) {
      tutupModal(
        pindahModal
      );

      return;
    }

    if (
      !editModal.classList.contains(
        "hidden"
      )
    ) {
      tutupModal(
        editModal
      );

      return;
    }

    if (
      !detailModal.classList.contains(
        "hidden"
      )
    ) {
      tutupModal(
        detailModal
      );
    }
  }
);


/* =====================================================
   HELPER USIA
===================================================== */

function hitungUsia(
  tanggalLahir
) {
  if (!tanggalLahir) {
    return null;
  }

  const lahir =
    tanggalISOKeLokal(
      tanggalLahir
    );

  if (!lahir) {
    return null;
  }

  const hariIni =
    new Date();

  let usia =
    hariIni.getFullYear() -
    lahir.getFullYear();

  const selisihBulan =
    hariIni.getMonth() -
    lahir.getMonth();

  if (
    selisihBulan < 0 ||
    (
      selisihBulan === 0 &&
      hariIni.getDate() <
      lahir.getDate()
    )
  ) {
    usia--;
  }

  return Math.max(
    usia,
    0
  );
}


/* =====================================================
   FORMAT RUPIAH
===================================================== */

function formatRupiah(
  angka
) {
  return new Intl.NumberFormat(
    "id-ID",
    {
      style:
        "currency",

      currency:
        "IDR",

      maximumFractionDigits:
        0
    }
  ).format(
    Number(
      angka || 0
    )
  );
}


/* =====================================================
   FORMAT TANGGAL
===================================================== */

function formatTanggalIndonesia(
  tanggal
) {
  if (!tanggal) {
    return "-";
  }

  const date =
    tanggalISOKeLokal(
      tanggal
    );

  if (!date) {
    return "-";
  }

  return new Intl.DateTimeFormat(
    "id-ID",
    {
      day:
        "2-digit",

      month:
        "long",

      year:
        "numeric"
    }
  ).format(
    date
  );
}


/* =====================================================
   ESCAPE HTML
===================================================== */

function aman(
  nilai
) {
  if (
    nilai === null ||
    nilai === undefined
  ) {
    return "";
  }

  return String(
    nilai
  )
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );
}


/* =====================================================
   VALIDASI AWAL DATA
===================================================== */

function validasiElemenUtama() {
  const elemenWajib = [
    "tableBody",
    "emptyState",
    "searchInput",
    "searchTop",
    "filterLokasi",
    "filterKelas",
    "filterStatus",
    "filterPelatih",
    "detailModal",
    "editModal",
    "pindahModal",
    "formEditSiswa",
    "formPindahKelas"
  ];

  const hilang =
    elemenWajib.filter(
      (id) =>
        !$(id)
    );

  if (
    hilang.length
  ) {
    throw new Error(
      "Elemen halaman tidak ditemukan: " +
      hilang.join(
        ", "
      )
    );
  }
}


/* =====================================================
   START APLIKASI
===================================================== */

async function mulaiAplikasi() {
  try {
    validasiElemenUtama();
    await tungguAuthSiap();
    aturTampilanSesuaiRole();

    await loadData();

    console.log(
      "Rekapan Siswa siap.",
      {
        jumlahSiswa:
          semuaSiswa.length,

        jumlahPelatih:
          semuaPelatih.length
      }
    );
  }

  catch (error) {
    console.error(
      "Gagal memulai Rekapan Siswa:",
      error
    );

    alert(
      "Rekapan Siswa gagal dimuat.\n\n" +
      error.message
    );
  }
}


mulaiAplikasi();