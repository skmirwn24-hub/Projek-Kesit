console.log(
  "KESIT Management - Pendaftaran Supabase versi terbaru aktif"
);


/* =====================================================
   KONFIGURASI
===================================================== */

const OWNER_KESIT =
  "Sukma Irawan & Ari Setiawan";

const PATH_LOGO =
  "assets/logo-kesit.png";

const PATH_STEMPEL =
  "assets/stempel-kesit.png";


/* =====================================================
   DATA LOKASI
===================================================== */

const dataLokasi = {

  "Kolam Renang Danau Biru AlBanawi": [
    "Reguler",
    "Private",
    "Prestasi"
  ],

  "Cafe Fameliza": [
    "Reguler"
  ],

  "Agrowisata Onokabe": [
    "Reguler"
  ]

};


/* =====================================================
   DATA PAKET
===================================================== */

const dataPaket = {

  Reguler: [

    {
      nama: "Reguler Pemula",
      harga: 100000,
      kuota: 6
    },

    {
      nama: "Reguler Pra Prestasi",
      harga: 120000,
      kuota: 6
    }

  ],


  Private: [

    {
      nama: "Private Pemula",
      harga: 250000,
      kuota: 10
    },

    {
      nama: "Private Pra Prestasi",
      harga: 300000,
      kuota: 10
    }

  ],


  Prestasi: [

    {
      nama: "Prestasi 4x / Minggu",
      harga: 200000,
      kuota: 16
    },

    {
      nama: "Prestasi 6x / Minggu",
      harga: 250000,
      kuota: 24
    },

    {
      nama: "Prestasi 8x / Minggu",
      harga: 300000,
      kuota: 32
    }

  ]

};


/* =====================================================
   MASTER PELATIH
===================================================== */

let semuaPelatih = [];

let mapPelatihId =
  new Map();


/* =====================================================
   ELEMEN
===================================================== */

const formPendaftaran =
  document.getElementById(
    "formPendaftaran"
  );

const lokasi =
  document.getElementById(
    "lokasi"
  );

const kelas =
  document.getElementById(
    "kelas"
  );

const pelatihPemilik =
  document.getElementById(
    "pelatihPemilik"
  );

const pelatihDiminta =
  document.getElementById(
    "pelatihDiminta"
  );

const bagianPelatihDiminta =
  document.getElementById(
    "bagianPelatihDiminta"
  );

const paket =
  document.getElementById(
    "paket"
  );

const hargaPaket =
  document.getElementById(
    "hargaPaket"
  );

const kuotaPertemuan =
  document.getElementById(
    "kuotaPertemuan"
  );

const biayaRequestPelatih =
  document.getElementById(
    "biayaRequestPelatih"
  );

const diskon =
  document.getElementById(
    "diskon"
  );

const totalTagihan =
  document.getElementById(
    "totalTagihan"
  );

const totalPembayaran =
  document.getElementById(
    "totalPembayaran"
  );

const nominalDibayar =
  document.getElementById(
    "nominalDibayar"
  );

const sisaTagihan =
  document.getElementById(
    "sisaTagihan"
  );

const statusPembayaran =
  document.getElementById(
    "statusPembayaran"
  );

const metodePembayaran =
  document.getElementById(
    "metodePembayaran"
  );

const nomorKuitansi =
  document.getElementById(
    "nomorKuitansi"
  );

const namaAdmin =
  document.getElementById(
    "namaAdmin"
  );

const ringkasanPaket =
  document.getElementById(
    "ringkasanPaket"
  );

const bagianSetelahDaftar =
  document.getElementById(
    "bagianSetelahDaftar"
  );

const btnUnduhUlang =
  document.getElementById(
    "btnUnduhUlang"
  );

const btnWhatsApp =
  document.getElementById(
    "btnWhatsApp"
  );


let transaksiTerakhir =
  null;

let logoDataURL =
  null;

let stempelDataURL =
  null;


/* =====================================================
   LOAD PELATIH DARI SUPABASE
===================================================== */

async function loadPelatih() {

  const {
    data,
    error
  } =
    await supabaseClient
      .from("pelatih")
      .select(
        "id, nama, status, tanggal_mulai_training, tanggal_berakhir_training"
      )
      .order(
        "nama",
        {
          ascending: true
        }
      );


  if (error) {

    console.error(
      "Gagal mengambil data pelatih:",
      error
    );

    alert(
      "Data pelatih gagal dimuat dari database.\n\n" +
      error.message
    );

    semuaPelatih = [];

    return false;

  }


  /*
    Aturan ketersediaan pelatih:
    - Aktif: tersedia.
    - Training: tersedia selama belum melewati tanggal berakhir training.
    - Training yang sudah lewat 3 bulan: tidak tersedia di dropdown operasional.
    - Tidak Aktif: tidak tersedia.
    - Owner tetap dipertahankan agar kelas Prestasi selalu bisa memilih owner.
  */

  semuaPelatih =
    (data || []).filter(
      function (pelatih) {

        if (
          pelatih.nama ===
          OWNER_KESIT
        ) {
          return true;
        }

        return pelatihTersediaOperasional(
          pelatih
        );

      }
    );


  mapPelatihId =
    new Map();


  semuaPelatih.forEach(
    function (pelatih) {

      mapPelatihId.set(
        pelatih.nama,
        pelatih.id
      );

    }
  );


  console.log(
    "Jumlah pelatih aktif/tersedia:",
    semuaPelatih.length
  );


  console.table(
    semuaPelatih
  );


  isiDropdownAdmin();


  return true;

}


/* =====================================================
   ATURAN STATUS PELATIH
===================================================== */

function normalisasiStatusPelatih(
  status
) {

  const nilai =
    String(
      status || ""
    )
    .trim()
    .toLowerCase();

  if (
    nilai === "training"
  ) {
    return "Training";
  }

  if (
    nilai === "tidak aktif" ||
    nilai === "non aktif" ||
    nilai === "nonaktif"
  ) {
    return "Tidak Aktif";
  }

  return "Aktif";

}


function tanggalLokalDariISO(
  nilai
) {

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
      function (angka) {
        return !Number.isFinite(
          angka
        );
      }
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


function trainingSudahBerakhir(
  pelatih
) {

  if (
    normalisasiStatusPelatih(
      pelatih.status
    ) !== "Training"
  ) {
    return false;
  }

  const tanggalBerakhir =
    tanggalLokalDariISO(
      pelatih.tanggal_berakhir_training
    );

  /*
    Bila data Training lama belum memiliki tanggal berakhir,
    jangan langsung menghilangkannya dari dropdown.
    Admin dapat melengkapi tanggalnya dari menu Daftar Pelatih.
  */
  if (!tanggalBerakhir) {
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

  tanggalBerakhir.setHours(
    0,
    0,
    0,
    0
  );

  /*
    Pada tanggal berakhir, pelatih masih dianggap tersedia.
    Mulai hari berikutnya pelatih tidak tampil.
  */
  return (
    hariIni >
    tanggalBerakhir
  );

}


function pelatihTersediaOperasional(
  pelatih
) {

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


function labelPelatihDropdown(
  pelatih
) {

  const status =
    normalisasiStatusPelatih(
      pelatih.status
    );

  if (
    status === "Training"
  ) {
    return (
      pelatih.nama +
      " — Training"
    );
  }

  return pelatih.nama;

}


/* =====================================================
   DROPDOWN ADMIN
===================================================== */

function isiDropdownAdmin() {

  namaAdmin.innerHTML = `
    <option value="">
      Pilih admin / penerima pembayaran
    </option>
  `;


  semuaPelatih.forEach(
    function (pelatih) {

      const option =
        document.createElement(
          "option"
        );


      option.value =
        pelatih.nama;


      option.textContent =
        labelPelatihDropdown(
          pelatih
        );


      namaAdmin.appendChild(
        option
      );

    }
  );

}


/* =====================================================
   LOGO & STEMPEL
===================================================== */

async function fileGambarKeDataURL(
  path
) {

  const response =
    await fetch(
      path,
      {
        cache: "no-store"
      }
    );


  if (!response.ok) {

    throw new Error(
      "File tidak ditemukan: " +
      path
    );

  }


  const blob =
    await response.blob();


  return new Promise(
    function (
      resolve,
      reject
    ) {

      const reader =
        new FileReader();


      reader.onload =
        function () {

          resolve(
            reader.result
          );

        };


      reader.onerror =
        reject;


      reader.readAsDataURL(
        blob
      );

    }
  );

}


async function muatAsetKuitansi() {

  try {

    const hasil =
      await Promise.all([

        fileGambarKeDataURL(
          PATH_LOGO
        ),

        fileGambarKeDataURL(
          PATH_STEMPEL
        )

      ]);


    logoDataURL =
      hasil[0];


    stempelDataURL =
      hasil[1];


    console.log(
      "Logo & stempel siap."
    );

  }

  catch (error) {

    console.error(
      "Aset kuitansi gagal:",
      error
    );


    logoDataURL = null;

    stempelDataURL = null;

  }

}


/* =====================================================
   TANGGAL DAFTAR
===================================================== */

function setTanggalDaftarHariIni() {

  const input =
    document.getElementById(
      "tanggalDaftar"
    );


  if (
    input &&
    !input.value
  ) {

    input.value =
      formatTanggalInput(
        new Date()
      );

  }

}


/* =====================================================
   LOKASI
===================================================== */

lokasi.addEventListener(
  "change",
  function () {

    resetKelas();

    resetPelatih();

    resetPaket();

    resetRequestPelatih();


    const lokasiDipilih =
      lokasi.value;


    if (
      !lokasiDipilih ||
      !dataLokasi[
        lokasiDipilih
      ]
    ) {

      return;

    }


    dataLokasi[
      lokasiDipilih
    ].forEach(
      function (namaKelas) {

        const option =
          document.createElement(
            "option"
          );


        option.value =
          namaKelas;


        option.textContent =
          namaKelas;


        kelas.appendChild(
          option
        );

      }
    );

  }
);


/* =====================================================
   KELAS
===================================================== */

kelas.addEventListener(
  "change",
  function () {

    resetPelatih();

    resetPaket();

    resetRequestPelatih();


    const kelasDipilih =
      kelas.value;


    if (!kelasDipilih) {
      return;
    }


    isiPelatihPemilik(
      kelasDipilih
    );


    isiPaket(
      kelasDipilih
    );


    aturPelatihDiminta(
      kelasDipilih
    );

  }
);


/* =====================================================
   PELATIH PEMILIK
===================================================== */

function isiPelatihPemilik(
  kelasDipilih
) {

  pelatihPemilik.innerHTML = `
    <option value="">
      Pilih pelatih
    </option>
  `;


  if (
    semuaPelatih.length === 0
  ) {

    const option =
      document.createElement(
        "option"
      );


    option.value = "";

    option.textContent =
      "Data pelatih belum tersedia";


    pelatihPemilik.appendChild(
      option
    );


    return;

  }


  let daftarPelatih =
    [...semuaPelatih];


  /*
    Prestasi hanya OWNER.
  */

  if (
    kelasDipilih ===
    "Prestasi"
  ) {

    daftarPelatih =
      semuaPelatih.filter(
        function (pelatih) {

          return (
            pelatih.nama ===
            OWNER_KESIT
          );

        }
      );

  }


  daftarPelatih.forEach(
    function (pelatih) {

      const option =
        document.createElement(
          "option"
        );


      option.value =
        pelatih.nama;


      option.textContent =
        labelPelatihDropdown(
          pelatih
        );


      pelatihPemilik.appendChild(
        option
      );

    }
  );


  /*
    Untuk Prestasi otomatis OWNER.
  */

  if (
    kelasDipilih ===
    "Prestasi"
  ) {

    pelatihPemilik.value =
      OWNER_KESIT;


    updateRingkasanPelatih();

  }

}


/* =====================================================
   PELATIH DIMINTA - PRIVATE
===================================================== */

function aturPelatihDiminta(
  kelasDipilih
) {

  if (
    kelasDipilih !==
    "Private"
  ) {

    resetRequestPelatih();

    return;

  }


  bagianPelatihDiminta.style.display =
    "flex";


  pelatihDiminta.innerHTML = `
    <option value="">
      Tidak Request Pelatih
    </option>
  `;


  semuaPelatih.forEach(
    function (pelatih) {

      const option =
        document.createElement(
          "option"
        );


      option.value =
        pelatih.nama;


      option.textContent =
        labelPelatihDropdown(
          pelatih
        );


      pelatihDiminta.appendChild(
        option
      );

    }
  );

}


/* =====================================================
   EVENT PELATIH
===================================================== */

pelatihPemilik.addEventListener(
  "change",
  updateRingkasanPelatih
);


pelatihDiminta.addEventListener(
  "change",
  function () {

    hitungBiayaRequest();

    hitungTotal();

    updateRingkasanPelatih();

  }
);


/* =====================================================
   BIAYA REQUEST
===================================================== */

function hitungBiayaRequest() {

  const nama =
    pelatihDiminta.value;


  let biaya = 0;


  if (!nama) {

    biaya = 0;

  }

  else if (
    nama ===
    OWNER_KESIT
  ) {

    biaya = 100000;

  }

  else {

    biaya = 50000;

  }


  biayaRequestPelatih.dataset.nilai =
    biaya;


  biayaRequestPelatih.value =
    formatRupiah(
      biaya
    );

}


/* =====================================================
   PAKET
===================================================== */

function isiPaket(
  kelasDipilih
) {

  paket.innerHTML = `
    <option value="">
      Pilih paket
    </option>
  `;


  const daftar =
    dataPaket[
      kelasDipilih
    ] || [];


  daftar.forEach(
    function (item) {

      const option =
        document.createElement(
          "option"
        );


      option.value =
        item.nama;


      option.textContent =
        item.nama;


      paket.appendChild(
        option
      );

    }
  );

}


paket.addEventListener(
  "change",
  function () {

    const kelasDipilih =
      kelas.value;


    const paketDipilih =
      paket.value;


    if (
      !kelasDipilih ||
      !paketDipilih
    ) {

      bersihkanInfoPaket();

      return;

    }


    const data =
      dataPaket[
        kelasDipilih
      ].find(
        function (item) {

          return (
            item.nama ===
            paketDipilih
          );

        }
      );


    if (!data) {
      return;
    }


    hargaPaket.dataset.nilai =
      data.harga;


    hargaPaket.value =
      formatRupiah(
        data.harga
      );


    kuotaPertemuan.dataset.nilai =
      data.kuota;


    kuotaPertemuan.value =
      data.kuota +
      " pertemuan";


    hitungTotal();


    tampilkanRingkasan(
      data
    );

  }
);


/* =====================================================
   DISKON
===================================================== */

diskon.addEventListener(
  "input",
  hitungTotal
);


/* =====================================================
   HITUNG TOTAL
===================================================== */
function hitungTotal() {

  const harga =
    Number(
      hargaPaket.dataset.nilai ||
      0
    );


  const request =
    Number(
      biayaRequestPelatih.dataset.nilai ||
      0
    );


  let nilaiDiskon =
    Number(
      diskon.value ||
      0
    );


  const subtotal =
    harga +
    request;


  if (
    nilaiDiskon < 0
  ) {

    nilaiDiskon = 0;

    diskon.value = 0;

  }


  if (
    nilaiDiskon >
    subtotal
  ) {

    nilaiDiskon =
      subtotal;


    diskon.value =
      subtotal;

  }


  const total =
    Math.max(
      subtotal -
      nilaiDiskon,
      0
    );


  totalTagihan.dataset.nilai =
    total;


  totalTagihan.value =
    total > 0
      ? formatRupiah(total)
      : "";


  totalPembayaran.value =
    total > 0
      ? formatRupiah(total)
      : "";


  hitungPembayaran();

  updateRingkasanKeuangan();

}


/* =====================================================
   PEMBAYARAN
===================================================== */

nominalDibayar.addEventListener(
  "input",
  hitungPembayaran
);


function hitungPembayaran() {

  const total =
    Number(
      totalTagihan.dataset.nilai ||
      0
    );


  let dibayar =
    Number(
      nominalDibayar.value ||
      0
    );


  if (
    dibayar < 0
  ) {

    dibayar = 0;

    nominalDibayar.value = 0;

  }


  if (
    total > 0 &&
    dibayar > total
  ) {

    dibayar =
      total;


    nominalDibayar.value =
      total;

  }


  const sisa =
    Math.max(
      total -
      dibayar,
      0
    );


  sisaTagihan.dataset.nilai =
    sisa;


  sisaTagihan.value =
    formatRupiah(
      sisa
    );


  if (
    dibayar <= 0
  ) {

    statusPembayaran.value =
      "Belum Dibayar";

  }

  else if (
    dibayar < total
  ) {

    statusPembayaran.value =
      "Dibayar Sebagian";

  }

  else {

    statusPembayaran.value =
      "Lunas";

  }

}


/* =====================================================
   RINGKASAN
===================================================== */

function tampilkanRingkasan(
  data
) {

  ringkasanPaket.classList.remove(
    "hidden"
  );


  document.getElementById(
    "ringkasanLokasi"
  ).innerText =
    lokasi.value;


  document.getElementById(
    "ringkasanKelas"
  ).innerText =
    kelas.value;


  document.getElementById(
    "ringkasanNamaPaket"
  ).innerText =
    data.nama;


  document.getElementById(
    "ringkasanHarga"
  ).innerText =
    formatRupiah(
      data.harga
    );


  document.getElementById(
    "ringkasanKuota"
  ).innerText =
    data.kuota +
    " pertemuan";


  updateRingkasanPelatih();

  updateRingkasanKeuangan();

}


function updateRingkasanPelatih() {

  document.getElementById(
    "ringkasanPelatihPemilik"
  ).innerText =
    pelatihPemilik.value ||
    "-";


  document.getElementById(
    "ringkasanPelatihDiminta"
  ).innerText =
    pelatihDiminta.value ||
    "Tidak Request";

}


function updateRingkasanKeuangan() {

  const request =
    Number(
      biayaRequestPelatih.dataset.nilai ||
      0
    );


  const nilaiDiskon =
    Number(
      diskon.value ||
      0
    );


  const total =
    Number(
      totalTagihan.dataset.nilai ||
      0
    );


  document.getElementById(
    "ringkasanBiayaRequest"
  ).innerText =
    formatRupiah(
      request
    );


  document.getElementById(
    "ringkasanDiskon"
  ).innerText =
    formatRupiah(
      nilaiDiskon
    );


  document.getElementById(
    "ringkasanTotalTagihan"
  ).innerText =
    total > 0
      ? formatRupiah(total)
      : "-";

}


/* =====================================================
   SUBMIT KE SUPABASE
===================================================== */

formPendaftaran.addEventListener(
  "submit",
  async function (event) {

    event.preventDefault();


    const total =
      Number(
        totalTagihan.dataset.nilai ||
        0
      );


    const dibayar =
      Number(
        nominalDibayar.value ||
        0
      );


    const sisa =
      Number(
        sisaTagihan.dataset.nilai ||
        0
      );


    if (
      !lokasi.value
    ) {

      alert(
        "Pilih lokasi latihan."
      );

      return;

    }


    if (
      !kelas.value
    ) {

      alert(
        "Pilih kelas."
      );

      return;

    }


    if (
      !pelatihPemilik.value
    ) {

      alert(
        "Pilih Pelatih Pemilik."
      );

      return;

    }


    if (
      !paket.value
    ) {

      alert(
        "Pilih paket."
      );

      return;

    }


    if (
      total <= 0
    ) {

      alert(
        "Total tagihan belum tersedia."
      );

      return;

    }


    if (
      dibayar <= 0
    ) {

      alert(
        "Masukkan nominal pembayaran."
      );

      nominalDibayar.focus();

      return;

    }


    if (
      !metodePembayaran.value
    ) {

      alert(
        "Pilih metode pembayaran."
      );

      return;

    }


    if (
      !namaAdmin.value
    ) {

      alert(
        "Pilih admin / penerima pembayaran."
      );

      return;

    }


    const pelatihPemilikId =
      mapPelatihId.get(
        pelatihPemilik.value
      );


    const pelatihDimintaId =
      pelatihDiminta.value
        ? mapPelatihId.get(
            pelatihDiminta.value
          )
        : null;


    if (
      !pelatihPemilikId
    ) {

      alert(
        "Pelatih Pemilik tidak ditemukan di database.\n\nSilakan refresh halaman."
      );

      return;

    }


    if (
      pelatihDiminta.value &&
      !pelatihDimintaId
    ) {

      alert(
        "Pelatih Diminta tidak ditemukan di database."
      );

      return;

    }


    const tombolSubmit =
      formPendaftaran.querySelector(
        'button[type="submit"]'
      );


    const teksAsli =
      tombolSubmit.innerText;


    tombolSubmit.disabled =
      true;


    tombolSubmit.innerText =
      "Menyimpan ke database...";


    try {

      const {
        data: sessionData,
        error: sessionError
      } =
        await supabaseClient.auth
          .getSession();


      if (
        sessionError ||
        !sessionData.session
      ) {

        alert(
          "Session login sudah berakhir. Silakan login kembali."
        );


        window.location.href =
          "index.html";


        return;

      }


      const tanggalLahir =
        document.getElementById(
          "tanggalLahir"
        ).value || null;


      const tanggalDaftar =
        document.getElementById(
          "tanggalDaftar"
        ).value;


      const {
        data,
        error
      } =
        await supabaseClient.rpc(
          "daftar_siswa_awal",
          {

            p_nama_lengkap:
              document
                .getElementById(
                  "namaLengkap"
                )
                .value
                .trim(),

            p_nama_panggilan:
              document
                .getElementById(
                  "namaPanggilan"
                )
                .value
                .trim(),

            p_jenis_kelamin:
              document.getElementById(
                "jenisKelamin"
              ).value,

            p_tempat_lahir:
              document
                .getElementById(
                  "tempatLahir"
                )
                .value
                .trim(),

            p_tanggal_lahir:
              tanggalLahir,

            p_nama_wali:
              document
                .getElementById(
                  "namaWali"
                )
                .value
                .trim(),

            p_no_hp_wali:
              document
                .getElementById(
                  "noHpWali"
                )
                .value
                .trim(),

            p_alamat:
              document
                .getElementById(
                  "alamat"
                )
                .value
                .trim(),

            p_pelatih_pemilik_id:
              pelatihPemilikId,

            p_pelatih_diminta_id:
              pelatihDimintaId,

            p_status_siswa:
              document.getElementById(
                "status"
              ).value,

            p_tanggal_daftar:
              tanggalDaftar,

            p_lokasi:
              lokasi.value,

            p_kelas:
              kelas.value,

            p_nama_paket:
              paket.value,

            p_harga_paket:
              Number(
                hargaPaket.dataset.nilai ||
                0
              ),

            p_biaya_request_pelatih:
              Number(
                biayaRequestPelatih.dataset.nilai ||
                0
              ),

            p_diskon:
              Number(
                diskon.value ||
                0
              ),

            p_total_tagihan:
              total,

            p_kuota_total:
              Number(
                kuotaPertemuan.dataset.nilai ||
                0
              ),

            p_nominal_dibayar:
              dibayar,

            p_sisa_tagihan:
              sisa,

            p_status_pembayaran:
              statusPembayaran.value,

            p_metode_pembayaran:
              metodePembayaran.value,

            p_admin_penerima:
              namaAdmin.value

          }
        );


      if (error) {

        console.error(
          "Pendaftaran gagal:",
          error
        );


        alert(
          "Pendaftaran gagal disimpan ke database.\n\n" +
          error.message
        );


        return;

      }


      if (
        !data ||
        data.length === 0
      ) {

        throw new Error(
          "Database tidak mengembalikan hasil pendaftaran."
        );

      }


      const hasil =
        data[0];


      const dataTransaksi = {

        idSiswa:
          hasil.id_siswa_baru,

        nomorKuitansi:
          hasil.nomor_kuitansi_baru,

        tanggalTransaksi:
          formatTanggalInput(
            new Date()
          ),

        namaLengkap:
          document
            .getElementById(
              "namaLengkap"
            )
            .value
            .trim(),

        namaPanggilan:
          document
            .getElementById(
              "namaPanggilan"
            )
            .value
            .trim(),

        jenisKelamin:
          document.getElementById(
            "jenisKelamin"
          ).value,

        tempatLahir:
          document
            .getElementById(
              "tempatLahir"
            )
            .value
            .trim(),

        tanggalLahir:
          tanggalLahir,

        tanggalDaftar:
          tanggalDaftar,

        namaWali:
          document
            .getElementById(
              "namaWali"
            )
            .value
            .trim(),

        noHpWali:
          document
            .getElementById(
              "noHpWali"
            )
            .value
            .trim(),

        alamat:
          document
            .getElementById(
              "alamat"
            )
            .value
            .trim(),

        lokasi:
          lokasi.value,

        kelas:
          kelas.value,

        pelatihPemilik:
          pelatihPemilik.value,

        pelatihDiminta:
          pelatihDiminta.value ||
          null,

        paket:
          paket.value,

        hargaPaket:
          Number(
            hargaPaket.dataset.nilai ||
            0
          ),

        biayaRequestPelatih:
          Number(
            biayaRequestPelatih.dataset.nilai ||
            0
          ),

        diskon:
          Number(
            diskon.value ||
            0
          ),

        totalTagihan:
          total,

        nominalDibayar:
          dibayar,

        sisaTagihan:
          sisa,

        statusPembayaran:
          statusPembayaran.value,

        metodePembayaran:
          metodePembayaran.value,

        kuota:
          Number(
            kuotaPertemuan.dataset.nilai ||
            0
          ),

        statusSiswa:
          document.getElementById(
            "status"
          ).value,

        namaAdmin:
          namaAdmin.value

      };


      nomorKuitansi.value =
        dataTransaksi.nomorKuitansi;


      transaksiTerakhir =
        dataTransaksi;


      if (
        !logoDataURL ||
        !stempelDataURL
      ) {

        await muatAsetKuitansi();

      }


      if (
        logoDataURL &&
        stempelDataURL
      ) {

        buatKuitansiPDF(
          dataTransaksi,
          true
        );

      }

      else {

        alert(
          "Data sudah tersimpan, tetapi logo atau stempel PDF belum berhasil dimuat."
        );

      }


      tampilkanHasil(
        dataTransaksi
      );


      alert(
        "Pendaftaran berhasil.\n\n" +
        "ID Siswa: " +
        dataTransaksi.idSiswa +
        "\n" +
        "Nomor Kuitansi: " +
        dataTransaksi.nomorKuitansi
      );

    }

    catch (error) {

      console.error(
        error
      );


      alert(
        "Terjadi kesalahan.\n\n" +
        error.message
      );

    }

    finally {

      tombolSubmit.disabled =
        false;


      tombolSubmit.innerText =
        teksAsli;

    }

  }
);


/* =====================================================
   HASIL
===================================================== */

function tampilkanHasil(
  data
) {

  bagianSetelahDaftar.classList.remove(
    "hidden"
  );


  isiHasil(
    "hasilIdSiswa",
    data.idSiswa
  );


  isiHasil(
    "hasilNomorKuitansi",
    data.nomorKuitansi
  );


  isiHasil(
    "hasilNamaSiswa",
    data.namaLengkap
  );


  isiHasil(
    "hasilStatusPembayaran",
    data.statusPembayaran
  );


  isiHasil(
    "hasilDibayar",
    formatRupiah(
      data.nominalDibayar
    )
  );


  isiHasil(
    "hasilSisaTagihan",
    formatRupiah(
      data.sisaTagihan
    )
  );


  isiHasil(
    "hasilNamaAdmin",
    data.namaAdmin
  );


  btnUnduhUlang.disabled =
    false;


  btnWhatsApp.disabled =
    false;

}


function isiHasil(
  id,
  isi
) {

  const element =
    document.getElementById(
      id
    );


  if (element) {

    element.innerText =
      isi || "-";

  }

}


/* =====================================================
   PDF
===================================================== */

function buatKuitansiPDF(
  data,
  otomatisSimpan = true
) {

  const {
    jsPDF
  } =
    window.jspdf;


  const doc =
    new jsPDF({

      orientation:
        "landscape",

      unit:
        "mm",

      format:
        [120, 210]

    });


  const W =
    doc.internal.pageSize.getWidth();


  doc.setTextColor(
    0,
    0,
    0
  );


  doc.setDrawColor(
    0,
    0,
    0
  );


  doc.addImage(
    logoDataURL,
    "PNG",
    7,
    5,
    35,
    19
  );


  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.setFontSize(
    16
  );

  doc.text(
    "KESIT MANAGEMENT",
    47,
    12
  );


  doc.setFont(
    "helvetica",
    "bolditalic"
  );

  doc.setFontSize(
    9
  );

  doc.text(
    "Lahir untuk Prestasi",
    47,
    19
  );


  doc.setLineWidth(
    0.35
  );

  doc.line(
    143,
    5,
    143,
    25
  );


  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.setFontSize(
    11
  );

  doc.text(
    "KUITANSI PEMBAYARAN",
    148,
    9
  );


  doc.setFont(
    "helvetica",
    "normal"
  );

  doc.setFontSize(
    7.3
  );


  tulisHeaderPDF(
    doc,
    "No. Kuitansi",
    data.nomorKuitansi,
    148,
    14
  );


  tulisHeaderPDF(
    doc,
    "Tanggal",
    formatTanggalIndonesia(
      data.tanggalTransaksi
    ),
    148,
    18.5
  );


  tulisHeaderPDF(
    doc,
    "ID Siswa",
    data.idSiswa,
    148,
    23
  );


  doc.setLineWidth(
    0.5
  );

  doc.line(
    5,
    28,
    205,
    28
  );


  gambarKotakPDF(
    doc,
    5,
    31,
    98,
    20,
    "DATA SISWA"
  );


  tulisDataPDF(
    doc,
    "Nama Siswa",
    data.namaLengkap,
    8,
    39,
    34,
    64
  );


  tulisDataPDF(
    doc,
    "ID Siswa",
    data.idSiswa,
    8,
    43.5,
    34,
    64
  );


  tulisDataPDF(
    doc,
    "Tempat Latihan",
    data.lokasi,
    8,
    48,
    34,
    64
  );


  gambarKotakPDF(
    doc,
    5,
    54,
    98,
    23,
    "DATA WALI"
  );


  tulisDataPDF(
    doc,
    "Nama Wali",
    data.namaWali,
    8,
    62,
    34,
    64
  );


  tulisDataPDF(
    doc,
    "No. WhatsApp",
    data.noHpWali,
    8,
    66.5,
    34,
    64
  );


  tulisDataPDF(
    doc,
    "Alamat",
    data.alamat || "-",
    8,
    71,
    34,
    64
  );


  gambarKotakPDF(
    doc,
    5,
    80,
    98,
    28,
    "PROGRAM LATIHAN"
  );


  tulisDataPDF(
    doc,
    "Kelas",
    data.kelas,
    8,
    88,
    34,
    64
  );


  tulisDataPDF(
    doc,
    "Paket",
    data.paket,
    8,
    92.5,
    34,
    64
  );


  tulisDataPDF(
    doc,
    "Pelatih Pemilik",
    data.pelatihPemilik,
    8,
    97,
    34,
    64
  );


  tulisDataPDF(
    doc,
    "Pelatih Diminta",
    data.pelatihDiminta ||
    "Tidak Request",
    8,
    101.5,
    34,
    64
  );


  gambarKotakPDF(
    doc,
    106,
    31,
    99,
    60,
    "RINCIAN PEMBAYARAN"
  );


  tulisDataPDF(
    doc,
    "Harga Paket",
    formatRupiah(
      data.hargaPaket
    ),
    110,
    40,
    153,
    45
  );


  tulisDataPDF(
    doc,
    "Request Pelatih",
    formatRupiah(
      data.biayaRequestPelatih
    ),
    110,
    45,
    153,
    45
  );


  tulisDataPDF(
    doc,
    "Diskon",
    formatRupiah(
      data.diskon
    ),
    110,
    50,
    153,
    45
  );


  doc.line(
    110,
    54,
    201,
    54
  );


  doc.setFont(
    "helvetica",
    "bold"
  );


  tulisDataPDF(
    doc,
    "Total Tagihan",
    formatRupiah(
      data.totalTagihan
    ),
    110,
    60,
    153,
    45
  );


  doc.setFont(
    "helvetica",
    "normal"
  );


  tulisDataPDF(
    doc,
    "Nominal Dibayar",
    formatRupiah(
      data.nominalDibayar
    ),
    110,
    65,
    153,
    45
  );


  tulisDataPDF(
    doc,
    "Sisa Tagihan",
    formatRupiah(
      data.sisaTagihan
    ),
    110,
    70,
    153,
    45
  );


  doc.line(
    110,
    74,
    201,
    74
  );


  tulisDataPDF(
    doc,
    "Metode Pembayaran",
    data.metodePembayaran,
    110,
    80,
    153,
    45
  );


  doc.setFont(
    "helvetica",
    "bold"
  );


  tulisDataPDF(
    doc,
    "Status Pembayaran",
    data.statusPembayaran.toUpperCase(),
    110,
    85,
    153,
    45
  );
    doc.setLineWidth(
    0.25
  );


  doc.rect(
    106,
    94,
    48,
    18
  );


  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.setFontSize(
    7
  );

  doc.text(
    "CATATAN",
    109,
    99
  );


  doc.setFont(
    "helvetica",
    "normal"
  );

  doc.setFontSize(
    5.8
  );


  const catatan =
    doc.splitTextToSize(
      "Kuitansi ini merupakan bukti pembayaran yang sah. Terima kasih atas kepercayaan Anda kepada KESIT Management.",
      41
    );


  doc.text(
    catatan,
    109,
    103
  );


  doc.rect(
    157,
    94,
    20,
    18
  );


  doc.setFont(
    "helvetica",
    "bold"
  );


  const statusBesar =
    data.statusPembayaran ===
    "Lunas"
      ? "LUNAS"
      : "SEBAGIAN";


  doc.setFontSize(
    data.statusPembayaran ===
    "Lunas"
      ? 10
      : 6
  );


  doc.text(
    statusBesar,
    167,
    104,
    {
      align:
        "center"
    }
  );


  doc.rect(
    180,
    94,
    25,
    18
  );


  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.setFontSize(
    6
  );

  doc.text(
    "Diterima Oleh:",
    182,
    98.5
  );


  const adminLines =
    doc.splitTextToSize(
      data.namaAdmin,
      14
    );


  doc.text(
    adminLines,
    182,
    103
  );


  doc.setFont(
    "helvetica",
    "normal"
  );

  doc.setFontSize(
    4.6
  );

  doc.text(
    "Admin / Penerima",
    182,
    109
  );


  doc.addImage(
    stempelDataURL,
    "PNG",
    191,
    96,
    12,
    12
  );


  doc.setLineWidth(
    0.4
  );


  doc.line(
    5,
    115,
    205,
    115
  );


  doc.setFont(
    "helvetica",
    "bolditalic"
  );

  doc.setFontSize(
    7
  );


  doc.text(
    "Maju tanpa aling-aling",
    W / 2,
    118,
    {
      align:
        "center"
    }
  );


  const namaFile =
    buatNamaFilePDF(
      data
    );


  if (
    otomatisSimpan
  ) {

    doc.save(
      namaFile
    );

  }


  return doc;

}


/* =====================================================
   PDF HELPERS
===================================================== */

function tulisHeaderPDF(
  doc,
  label,
  nilai,
  x,
  y
) {

  doc.text(
    label,
    x,
    y
  );


  doc.text(
    ":",
    x + 20,
    y
  );


  doc.text(
    String(
      nilai || "-"
    ),
    x + 24,
    y
  );

}


function gambarKotakPDF(
  doc,
  x,
  y,
  lebar,
  tinggi,
  judul
) {

  doc.setLineWidth(
    0.25
  );


  doc.rect(
    x,
    y,
    lebar,
    tinggi
  );


  doc.setFillColor(
    243,
    243,
    243
  );


  doc.rect(
    x,
    y,
    lebar,
    6,
    "F"
  );


  doc.rect(
    x,
    y,
    lebar,
    6
  );


  doc.setFont(
    "helvetica",
    "bold"
  );


  doc.setFontSize(
    7
  );


  doc.text(
    judul,
    x + 3,
    y + 4
  );


  doc.setFont(
    "helvetica",
    "normal"
  );

}


function tulisDataPDF(
  doc,
  label,
  nilai,
  labelX,
  y,
  valueX,
  maxWidth
) {

  doc.setFontSize(
    6.4
  );


  doc.text(
    String(label),
    labelX,
    y
  );


  doc.text(
    ":",
    valueX - 3,
    y
  );


  const isi =
    doc.splitTextToSize(
      String(
        nilai || "-"
      ),
      maxWidth
    );


  doc.text(
    isi,
    valueX,
    y
  );

}


function buatNamaFilePDF(
  data
) {

  const nama =
    data.namaLengkap
      .replace(
        /[^a-zA-Z0-9]+/g,
        "-"
      )
      .replace(
        /^-|-$/g,
        ""
      );


  return (
    "Kuitansi-KESIT-" +
    data.idSiswa +
    "-" +
    nama +
    ".pdf"
  );

}


/* =====================================================
   UNDUH ULANG
===================================================== */

btnUnduhUlang.addEventListener(
  "click",
  async function () {

    if (
      !transaksiTerakhir
    ) {

      return;

    }


    if (
      !logoDataURL ||
      !stempelDataURL
    ) {

      await muatAsetKuitansi();

    }


    buatKuitansiPDF(
      transaksiTerakhir,
      true
    );

  }
);


/* =====================================================
   WHATSAPP
===================================================== */

btnWhatsApp.addEventListener(
  "click",
  function () {

    if (
      !transaksiTerakhir
    ) {

      return;

    }


    const data =
      transaksiTerakhir;


    const nomor =
      normalisasiNomorWhatsApp(
        data.noHpWali
      );


    if (!nomor) {

      alert(
        "Nomor WhatsApp wali tidak valid."
      );

      return;

    }


    const pesan =
`KESIT Management

Halo ${data.namaWali},

Pendaftaran dan pembayaran atas nama:
${data.namaLengkap}

No. Kuitansi:
${data.nomorKuitansi}

Kelas:
${data.kelas}

Paket:
${data.paket}

Total Tagihan:
${formatRupiah(data.totalTagihan)}

Dibayar:
${formatRupiah(data.nominalDibayar)}

Sisa Tagihan:
${formatRupiah(data.sisaTagihan)}

Status:
${data.statusPembayaran}

Diterima Oleh:
${data.namaAdmin}

Kuitansi tersedia dalam bentuk PDF.

Terima kasih.

KESIT Management
Lahir untuk Prestasi
Maju tanpa aling-aling`;


    const url =
      "https://wa.me/" +
      nomor +
      "?text=" +
      encodeURIComponent(
        pesan
      );


    window.open(
      url,
      "_blank"
    );

  }
);


function normalisasiNomorWhatsApp(
  nomor
) {

  let hasil =
    String(
      nomor || ""
    ).replace(
      /\D/g,
      ""
    );


  if (
    hasil.startsWith(
      "0"
    )
  ) {

    hasil =
      "62" +
      hasil.substring(
        1
      );

  }

  else if (
    hasil.startsWith(
      "8"
    )
  ) {

    hasil =
      "62" +
      hasil;

  }


  if (
    !hasil.startsWith(
      "62"
    )
  ) {

    return null;

  }


  return hasil;

}


/* =====================================================
   RESET
===================================================== */

formPendaftaran.addEventListener(
  "reset",
  function () {

    setTimeout(
      function () {

        resetKelas();

        resetPelatih();

        resetPaket();

        resetRequestPelatih();


        nominalDibayar.value =
          "";


        sisaTagihan.value =
          "";


        nomorKuitansi.value =
          "";


        statusPembayaran.value =
          "Belum Dibayar";


        namaAdmin.value =
          "";


        bagianSetelahDaftar.classList.add(
          "hidden"
        );


        transaksiTerakhir =
          null;


        btnUnduhUlang.disabled =
          true;


        btnWhatsApp.disabled =
          true;


        setTanggalDaftarHariIni();

      },

      0
    );

  }
);


/* =====================================================
   RESET BAGIAN
===================================================== */

function resetKelas() {

  kelas.innerHTML = `
    <option value="">
      Pilih lokasi terlebih dahulu
    </option>
  `;

}


function resetPelatih() {

  pelatihPemilik.innerHTML = `
    <option value="">
      Pilih kelas terlebih dahulu
    </option>
  `;

}


function resetRequestPelatih() {

  bagianPelatihDiminta.style.display =
    "none";


  pelatihDiminta.innerHTML = `
    <option value="">
      Tidak Request Pelatih
    </option>
  `;


  biayaRequestPelatih.dataset.nilai =
    0;


  biayaRequestPelatih.value =
    formatRupiah(
      0
    );


  updateRingkasanPelatih();

}


function resetPaket() {

  paket.innerHTML = `
    <option value="">
      Pilih paket
    </option>
  `;


  bersihkanInfoPaket();

}


function bersihkanInfoPaket() {

  hargaPaket.value =
    "";

  hargaPaket.dataset.nilai =
    0;


  kuotaPertemuan.value =
    "";

  kuotaPertemuan.dataset.nilai =
    0;


  totalTagihan.value =
    "";

  totalTagihan.dataset.nilai =
    0;


  totalPembayaran.value =
    "";


  nominalDibayar.value =
    "";


  sisaTagihan.value =
    "";


  statusPembayaran.value =
    "Belum Dibayar";


  ringkasanPaket.classList.add(
    "hidden"
  );

}


/* =====================================================
   FORMAT
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


function formatTanggalInput(
  tanggal
) {

  const tahun =
    tanggal.getFullYear();


  const bulan =
    String(
      tanggal.getMonth() + 1
    ).padStart(
      2,
      "0"
    );


  const hari =
    String(
      tanggal.getDate()
    ).padStart(
      2,
      "0"
    );


  return (
    tahun +
    "-" +
    bulan +
    "-" +
    hari
  );

}


function formatTanggalIndonesia(
  tanggal
) {

  if (!tanggal) {
    return "-";
  }


  const bagian =
    tanggal.split(
      "-"
    );


  const date =
    new Date(

      Number(
        bagian[0]
      ),

      Number(
        bagian[1]
      ) - 1,

      Number(
        bagian[2]
      )

    );


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
   START
===================================================== */

async function mulaiAplikasi() {

  setTanggalDaftarHariIni();

  resetKelas();

  resetPelatih();

  resetPaket();

  resetRequestPelatih();

  hitungPembayaran();


  const hasilPelatih =
    await loadPelatih();


  await muatAsetKuitansi();


  if (
    hasilPelatih
  ) {

    console.log(
      "Pendaftaran siap. Pelatih:",
      semuaPelatih.length
    );

  }

}


mulaiAplikasi();