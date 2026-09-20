console.log("KESIT Management - Riwayat aktif");


/* =====================================================
   STATE
===================================================== */

let semuaRiwayat = [];
let dataTampil = [];

let mapSiswa = new Map();
let mapPelatih = new Map();

let halamanSaatIni = 1;
let jumlahPerHalaman = 10;


/* =====================================================
   ELEMEN
===================================================== */

const $ = (id) =>
  document.getElementById(id);


const tableBody =
  $("tableBody");

const emptyState =
  $("emptyState");

const searchInput =
  $("searchInput");

const searchTop =
  $("searchTop");

const filterJenis =
  $("filterJenis");

const filterBulan =
  $("filterBulan");

const filterTahun =
  $("filterTahun");

const btnReset =
  $("btnReset");

const btnCari =
  $("btnCari");

const rowsPerPage =
  $("rowsPerPage");

const tableInfo =
  $("tableInfo");

const pagination =
  $("pagination");

const detailModal =
  $("detailModal");

const btnCloseModal =
  $("btnCloseModal");


/* =====================================================
   LOAD DATA
===================================================== */

async function loadData() {

  const {
    data: sessionData,
    error: sessionError
  } =
    await window.supabaseClient
      .auth
      .getSession();


  if (
    sessionError ||
    !sessionData.session
  ) {

    window.location.href =
      "index.html";

    return;

  }


  try {

    await Promise.all([
      loadMasterSiswa(),
      loadMasterPelatih()
    ]);


    await loadRiwayat();


    isiFilterTahun();

    updateStatistik();

    dataTampil =
      [...semuaRiwayat];


    renderTable();

  }

  catch (error) {

    console.error(
      "Gagal memuat Riwayat:",
      error
    );


    alert(
      "Riwayat gagal dimuat.\n\n" +
      error.message
    );

  }

}


/* =====================================================
   MASTER SISWA
===================================================== */

async function loadMasterSiswa() {

  const {
    data,
    error
  } =
    await window.supabaseClient
      .from("siswa")
      .select(
        "id,id_siswa,nama_lengkap"
      );


  if (error) {

    throw new Error(
      "Master siswa gagal dimuat: " +
      error.message
    );

  }


  mapSiswa =
    new Map(
      (data || []).map(
        (siswa) => [
          siswa.id,
          siswa
        ]
      )
    );

}


/* =====================================================
   MASTER PELATIH
===================================================== */

async function loadMasterPelatih() {

  const {
    data,
    error
  } =
    await window.supabaseClient
      .from("pelatih")
      .select(
        "id,nama"
      );


  if (error) {

    throw new Error(
      "Master pelatih gagal dimuat: " +
      error.message
    );

  }


  mapPelatih =
    new Map(
      (data || []).map(
        (pelatih) => [
          pelatih.id,
          pelatih.nama
        ]
      )
    );

}


/* =====================================================
   LOAD RIWAYAT
===================================================== */

async function loadRiwayat() {

  const {
    data,
    error
  } =
    await window.supabaseClient
      .from(
        "riwayat_perubahan_siswa"
      )
      .select("*")
      .order(
        "created_at",
        {
          ascending: false
        }
      );


  if (error) {

    throw new Error(
      "Data riwayat gagal dimuat: " +
      error.message
    );

  }


  semuaRiwayat =
    (data || []).map(
      normalisasiRiwayat
    );

}


/* =====================================================
   NORMALISASI
===================================================== */

function normalisasiRiwayat(
  row
) {

  const siswa =
    mapSiswa.get(
      row.siswa_id
    );


  return {

    id:
      row.id,

    siswaId:
      row.siswa_id,

    idSiswa:
      siswa?.id_siswa ||
      "-",

    namaSiswa:
      siswa?.nama_lengkap ||
      "Siswa tidak ditemukan",

    jenisPerubahan:
      row.jenis_perubahan ||
      "-",

    lokasiLama:
      row.lokasi_lama ||
      "-",

    kelasLama:
      row.kelas_lama ||
      "-",

    paketLama:
      row.paket_lama ||
      "-",

    pelatihLamaId:
      row.pelatih_pemilik_lama,

    pelatihLama:
      mapPelatih.get(
        row.pelatih_pemilik_lama
      ) ||
      "-",

    lokasiBaru:
      row.lokasi_baru ||
      "-",

    kelasBaru:
      row.kelas_baru ||
      "-",

    paketBaru:
      row.paket_baru ||
      "-",

    pelatihBaruId:
      row.pelatih_pemilik_baru,

    pelatihBaru:
      mapPelatih.get(
        row.pelatih_pemilik_baru
      ) ||
      "-",

    tanggalPerubahan:
      row.tanggal_perubahan,

    alasan:
      row.alasan ||
      "-",

    diubahOleh:
      row.diubah_oleh ||
      "-",

    createdAt:
      row.created_at

  };

}


/* =====================================================
   STATISTIK
===================================================== */

function updateStatistik() {

  $("statTotal").innerText =
    semuaRiwayat.length;


  const sekarang =
    new Date();

  const bulanSekarang =
    sekarang.getMonth();

  const tahunSekarang =
    sekarang.getFullYear();


  const jumlahBulanIni =
    semuaRiwayat.filter(
      (item) => {

        const tanggal =
          tanggalDariISO(
            item.tanggalPerubahan
          );


        if (!tanggal) {
          return false;
        }


        return (
          tanggal.getMonth() ===
            bulanSekarang &&
          tanggal.getFullYear() ===
            tahunSekarang
        );

      }
    ).length;


  $("statBulanIni").innerText =
    jumlahBulanIni;


  const siswaUnik =
    new Set(
      semuaRiwayat
        .map(
          (item) =>
            item.siswaId
        )
        .filter(Boolean)
    );


  $("statSiswa").innerText =
    siswaUnik.size;

}


/* =====================================================
   FILTER TAHUN
===================================================== */

function isiFilterTahun() {

  const nilaiSekarang =
    filterTahun.value;


  const daftarTahun =
    [
      ...new Set(
        semuaRiwayat
          .map(
            (item) => {

              if (
                !item.tanggalPerubahan
              ) {
                return null;
              }


              return String(
                item.tanggalPerubahan
              ).slice(
                0,
                4
              );

            }
          )
          .filter(Boolean)
      )
    ]
      .sort(
        (a, b) =>
          Number(b) -
          Number(a)
      );


  filterTahun.innerHTML =
    `
      <option value="">
        Semua Tahun
      </option>
    `;


  daftarTahun.forEach(
    (tahun) => {

      const option =
        document.createElement(
          "option"
        );


      option.value =
        tahun;


      option.textContent =
        tahun;


      filterTahun.appendChild(
        option
      );

    }
  );


  if (
    daftarTahun.includes(
      nilaiSekarang
    )
  ) {

    filterTahun.value =
      nilaiSekarang;

  }

}


/* =====================================================
   FILTER
===================================================== */

function jalankanFilter() {

  const keyword =
    searchInput
      .value
      .trim()
      .toLowerCase();


  const jenis =
    filterJenis.value;


  const bulan =
    filterBulan.value;


  const tahun =
    filterTahun.value;


  dataTampil =
    semuaRiwayat.filter(
      (item) => {

        const gabungan =
          [
            item.idSiswa,
            item.namaSiswa,
            item.jenisPerubahan,

            item.lokasiLama,
            item.lokasiBaru,

            item.kelasLama,
            item.kelasBaru,

            item.paketLama,
            item.paketBaru,

            item.pelatihLama,
            item.pelatihBaru,

            item.alasan,
            item.diubahOleh
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();


        const cocokCari =
          !keyword ||
          gabungan.includes(
            keyword
          );


        const cocokJenis =
          !jenis ||
          item.jenisPerubahan ===
          jenis;


        let cocokBulan =
          true;


        let cocokTahun =
          true;


        if (
          item.tanggalPerubahan
        ) {

          const teksTanggal =
            String(
              item.tanggalPerubahan
            );


          const tahunData =
            teksTanggal.slice(
              0,
              4
            );


          const bulanData =
            teksTanggal.slice(
              5,
              7
            );


          if (bulan) {

            cocokBulan =
              bulanData ===
              bulan;

          }


          if (tahun) {

            cocokTahun =
              tahunData ===
              tahun;

          }

        }

        else {

          if (bulan) {
            cocokBulan =
              false;
          }


          if (tahun) {
            cocokTahun =
              false;
          }

        }


        return (
          cocokCari &&
          cocokJenis &&
          cocokBulan &&
          cocokTahun
        );

      }
    );


  halamanSaatIni =
    1;


  renderTable();

}


/* =====================================================
   RESET FILTER
===================================================== */

function resetFilter() {

  searchInput.value =
    "";

  searchTop.value =
    "";

  filterJenis.value =
    "";

  filterBulan.value =
    "";

  filterTahun.value =
    "";


  dataTampil =
    [...semuaRiwayat];


  halamanSaatIni =
    1;


  renderTable();

}


/* =====================================================
   RENDER TABLE
===================================================== */

function renderTable() {

  tableBody.innerHTML =
    "";


  if (
    dataTampil.length ===
    0
  ) {

    emptyState
      .classList
      .remove(
        "hidden"
      );


    tableInfo.innerText =
      "Menampilkan 0 riwayat";


    pagination.innerHTML =
      "";


    return;

  }


  emptyState
    .classList
    .add(
      "hidden"
    );


  const totalHalaman =
    Math.ceil(
      dataTampil.length /
      jumlahPerHalaman
    );


  if (
    halamanSaatIni >
    totalHalaman
  ) {

    halamanSaatIni =
      totalHalaman;

  }


  const indexAwal =
    (
      halamanSaatIni -
      1
    ) *
    jumlahPerHalaman;


  const indexAkhir =
    indexAwal +
    jumlahPerHalaman;


  const daftar =
    dataTampil.slice(
      indexAwal,
      indexAkhir
    );


  daftar.forEach(
    (
      item,
      index
    ) => {

      const row =
        document.createElement(
          "tr"
        );


      row.innerHTML = `

        <td>
          ${indexAwal + index + 1}
        </td>


        <td>
          ${aman(
            formatTanggalIndonesia(
              item.tanggalPerubahan
            )
          )}
        </td>


        <td>

          <div class="student-name">
            ${aman(
              item.namaSiswa
            )}
          </div>

          <div class="student-id">
            ${aman(
              item.idSiswa
            )}
          </div>

        </td>


        <td>

          <span class="history-type">
            ${aman(
              item.jenisPerubahan
            )}
          </span>

        </td>


        <td>

          ${buatAlurPerubahan(
            item.lokasiLama,
            item.lokasiBaru
          )}

        </td>


        <td>

          ${buatAlurPerubahan(
            item.kelasLama,
            item.kelasBaru
          )}

        </td>


        <td>

          ${buatAlurPerubahan(
            item.paketLama,
            item.paketBaru
          )}

        </td>


        <td>

          ${buatAlurPerubahan(
            item.pelatihLama,
            item.pelatihBaru
          )}

        </td>


        <td>
          ${aman(
            item.diubahOleh
          )}
        </td>


        <td>

          <div class="action-buttons">

            <button
              type="button"
              class="detail-button"
              data-id="${aman(
                item.id
              )}"
            >
              Detail
            </button>

          </div>

        </td>

      `;


      tableBody.appendChild(
        row
      );

    }
  );


  pasangEventDetail();


  const nomorAwal =
    indexAwal +
    1;


  const nomorAkhir =
    Math.min(
      indexAkhir,
      dataTampil.length
    );


  tableInfo.innerText =
    `Menampilkan ${nomorAwal} - ${nomorAkhir} dari ${dataTampil.length} riwayat`;


  renderPagination(
    totalHalaman
  );

}


/* =====================================================
   ALUR LAMA -> BARU
===================================================== */

function buatAlurPerubahan(
  lama,
  baru
) {

  return `

    <div class="change-flow">

      <span
        class="change-old"
        title="${aman(
          lama || "-"
        )}"
      >
        ${aman(
          lama || "-"
        )}
      </span>


      <span class="change-arrow">
        →
      </span>


      <span
        class="change-new"
        title="${aman(
          baru || "-"
        )}"
      >
        ${aman(
          baru || "-"
        )}
      </span>

    </div>

  `;

}


/* =====================================================
   EVENT DETAIL
===================================================== */

function pasangEventDetail() {

  tableBody
    .querySelectorAll(
      ".detail-button"
    )
    .forEach(
      (button) => {

        button.addEventListener(
          "click",
          function () {

            const data =
              semuaRiwayat.find(
                (item) =>
                  item.id ===
                  this.dataset.id
              );


            if (!data) {
              return;
            }


            bukaDetail(
              data
            );

          }
        );

      }
    );

}


/* =====================================================
   BUKA DETAIL
===================================================== */

function bukaDetail(
  item
) {

  $("detailNamaSiswa")
    .innerText =
    item.namaSiswa ||
    "-";


  $("detailIdSiswa")
    .innerText =
    item.idSiswa ||
    "-";


  $("dTanggal")
    .innerText =
    formatTanggalIndonesia(
      item.tanggalPerubahan
    );


  $("dJenis")
    .innerText =
    item.jenisPerubahan ||
    "-";


  $("dDiubahOleh")
    .innerText =
    item.diubahOleh ||
    "-";


  $("dAlasan")
    .innerText =
    item.alasan ||
    "-";


  $("dLokasiLama")
    .innerText =
    item.lokasiLama ||
    "-";


  $("dKelasLama")
    .innerText =
    item.kelasLama ||
    "-";


  $("dPaketLama")
    .innerText =
    item.paketLama ||
    "-";


  $("dPelatihLama")
    .innerText =
    item.pelatihLama ||
    "-";


  $("dLokasiBaru")
    .innerText =
    item.lokasiBaru ||
    "-";


  $("dKelasBaru")
    .innerText =
    item.kelasBaru ||
    "-";


  $("dPaketBaru")
    .innerText =
    item.paketBaru ||
    "-";


  $("dPelatihBaru")
    .innerText =
    item.pelatihBaru ||
    "-";


  bukaModal();

}


/* =====================================================
   MODAL
===================================================== */

function bukaModal() {

  detailModal
    .classList
    .remove(
      "hidden"
    );


  document.body
    .classList
    .add(
      "modal-open"
    );

}


function tutupModal() {

  detailModal
    .classList
    .add(
      "hidden"
    );


  document.body
    .classList
    .remove(
      "modal-open"
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
    totalHalaman <=
    1
  ) {

    return;

  }


  const prev =
    buatTombolHalaman(
      "‹",
      halamanSaatIni - 1
    );


  prev.disabled =
    halamanSaatIni ===
    1;


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
      i ===
      halamanSaatIni
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


/* =====================================================
   TOMBOL PAGINATION
===================================================== */

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
    function () {

      halamanSaatIni =
        halaman;


      renderTable();

    }
  );


  return tombol;

}


/* =====================================================
   EVENT SEARCH
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
  function (
    event
  ) {

    if (
      event.key ===
      "Enter"
    ) {

      event.preventDefault();


      jalankanFilter();

    }

  }
);


/* =====================================================
   EVENT FILTER
===================================================== */

btnCari.addEventListener(
  "click",
  jalankanFilter
);


btnReset.addEventListener(
  "click",
  resetFilter
);


filterJenis.addEventListener(
  "change",
  jalankanFilter
);


filterBulan.addEventListener(
  "change",
  jalankanFilter
);


filterTahun.addEventListener(
  "change",
  jalankanFilter
);


/* =====================================================
   ROWS PER PAGE
===================================================== */

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
   TUTUP MODAL
===================================================== */

btnCloseModal.addEventListener(
  "click",
  tutupModal
);


document
  .querySelectorAll(
    "[data-close-detail='true']"
  )
  .forEach(
    (element) => {

      element.addEventListener(
        "click",
        tutupModal
      );

    }
  );


document.addEventListener(
  "keydown",
  function (
    event
  ) {

    if (
      event.key ===
        "Escape" &&
      !detailModal
        .classList
        .contains(
          "hidden"
        )
    ) {

      tutupModal();

    }

  }
);


/* =====================================================
   TANGGAL ISO -> DATE LOKAL
===================================================== */

function tanggalDariISO(
  nilai
) {

  if (!nilai) {
    return null;
  }


  const tanggalString =
    String(
      nilai
    ).slice(
      0,
      10
    );


  const bagian =
    tanggalString
      .split("-")
      .map(Number);


  if (
    bagian.length !==
      3 ||
    bagian.some(
      (angka) =>
        !Number.isFinite(
          angka
        )
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


/* =====================================================
   FORMAT TANGGAL
===================================================== */

function formatTanggalIndonesia(
  nilai
) {

  const tanggal =
    tanggalDariISO(
      nilai
    );


  if (!tanggal) {
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
    tanggal
  );

}


/* =====================================================
   ESCAPE HTML
===================================================== */

function aman(
  nilai
) {

  if (
    nilai ===
      null ||
    nilai ===
      undefined
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
   VALIDASI ELEMEN
===================================================== */

function validasiElemen() {

  const wajib = [
    "tableBody",
    "emptyState",
    "searchInput",
    "searchTop",
    "filterJenis",
    "filterBulan",
    "filterTahun",
    "btnReset",
    "btnCari",
    "rowsPerPage",
    "tableInfo",
    "pagination",
    "detailModal",
    "btnCloseModal"
  ];


  const tidakAda =
    wajib.filter(
      (id) =>
        !$(id)
    );


  if (
    tidakAda.length
  ) {

    throw new Error(
      "Elemen halaman tidak ditemukan: " +
      tidakAda.join(
        ", "
      )
    );

  }

}


/* =====================================================
   START
===================================================== */

async function mulaiAplikasi() {

  try {

    validasiElemen();


    await loadData();


    console.log(
      "Menu Riwayat siap.",
      {
        totalRiwayat:
          semuaRiwayat.length
      }
    );

  }

  catch (error) {

    console.error(
      "Gagal memulai menu Riwayat:",
      error
    );


    alert(
      "Menu Riwayat gagal dimuat.\n\n" +
      error.message
    );

  }

}


mulaiAplikasi();