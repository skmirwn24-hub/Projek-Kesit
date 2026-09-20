let dataSiswa = [
  {
    id: "SIS000001",
    namaLengkap: "Aditya Contoh",
    namaPanggilan: "Adit",
    jenisKelamin: "Laki-laki",
    tempatLahir: "Blitar",
    tanggalLahir: "2012-03-15",
    namaWali: "Wali Contoh 1",
    noHpWali: "081234567890",
    kelas: "Private Pemula",
    pelatihPemilik: "Budi",
    pelatihDiminta: "",
    status: "Aktif"
  },

  {
    id: "SIS000002",
    namaLengkap: "Bima Contoh",
    namaPanggilan: "Bima",
    jenisKelamin: "Laki-laki",
    tempatLahir: "Kediri",
    tanggalLahir: "2013-07-21",
    namaWali: "Wali Contoh 2",
    noHpWali: "081234567891",
    kelas: "Reguler Pemula",
    pelatihPemilik: "Andi",
    pelatihDiminta: "",
    status: "Aktif"
  },

  {
    id: "SIS000003",
    namaLengkap: "Citra Contoh",
    namaPanggilan: "Citra",
    jenisKelamin: "Perempuan",
    tempatLahir: "Malang",
    tanggalLahir: "2014-01-10",
    namaWali: "Wali Contoh 3",
    noHpWali: "081234567892",
    kelas: "Reguler Pra Prestasi",
    pelatihPemilik: "Sari",
    pelatihDiminta: "",
    status: "Aktif"
  }
];


const tabelSiswa =
  document.getElementById("tabelSiswa");

const cariSiswa =
  document.getElementById("cariSiswa");

const modalSiswa =
  document.getElementById("modalSiswa");

const modalDetail =
  document.getElementById("modalDetail");

const formSiswa =
  document.getElementById("formSiswa");


function renderSiswa(data) {

  tabelSiswa.innerHTML = "";

  data.forEach((siswa, index) => {

    const row =
      document.createElement("tr");

    row.innerHTML = `
      <td>${siswa.id}</td>

      <td>
        ${siswa.namaLengkap}
      </td>

      <td>
        ${siswa.namaPanggilan}
      </td>

      <td>
        ${siswa.jenisKelamin}
      </td>

      <td>
        ${siswa.kelas}
      </td>

      <td>
        ${siswa.pelatihPemilik || "-"}
      </td>

      <td>
        ${siswa.status}
      </td>

      <td>

        <button
          class="action-btn detail-btn"
          onclick="lihatDetail(${index})"
        >
          Detail
        </button>

        <button
          class="action-btn edit-btn"
          onclick="editSiswa(${index})"
        >
          Edit
        </button>

        <button
          class="action-btn delete-btn"
          onclick="hapusSiswa(${index})"
        >
          Hapus
        </button>

      </td>
    `;

    tabelSiswa.appendChild(row);

  });

}


renderSiswa(dataSiswa);


cariSiswa.addEventListener(
  "input",
  function() {

    const keyword =
      this.value
        .toLowerCase()
        .trim();

    const hasil =
      dataSiswa.filter(siswa => {

        return (
          siswa.id
            .toLowerCase()
            .includes(keyword) ||

          siswa.namaLengkap
            .toLowerCase()
            .includes(keyword) ||

          siswa.namaPanggilan
            .toLowerCase()
            .includes(keyword)
        );

      });

    renderSiswa(hasil);

  }
);


function bukaFormTambah() {

  document.getElementById("judulForm")
    .innerText = "Tambah Siswa";

  document.getElementById("editIndex")
    .value = "";

  formSiswa.reset();

  modalSiswa.classList.add("show");

}


function tutupForm() {

  modalSiswa.classList.remove("show");

}


formSiswa.addEventListener(
  "submit",
  function(event) {

    event.preventDefault();

    const editIndex =
      document.getElementById("editIndex")
        .value;

    const siswaBaru = {

      id:
        editIndex === ""
        ? buatIdSiswa()
        : dataSiswa[editIndex].id,

      namaLengkap:
        document.getElementById(
          "namaLengkap"
        ).value,

      namaPanggilan:
        document.getElementById(
          "namaPanggilan"
        ).value,

      jenisKelamin:
        document.getElementById(
          "jenisKelamin"
        ).value,

      tempatLahir:
        document.getElementById(
          "tempatLahir"
        ).value,

      tanggalLahir:
        document.getElementById(
          "tanggalLahir"
        ).value,

      namaWali:
        document.getElementById(
          "namaWali"
        ).value,

      noHpWali:
        document.getElementById(
          "noHpWali"
        ).value,

      kelas:
        document.getElementById(
          "kelas"
        ).value,

      pelatihPemilik:
        document.getElementById(
          "pelatihPemilik"
        ).value,

      pelatihDiminta:
        document.getElementById(
          "pelatihDiminta"
        ).value,

      status:
        document.getElementById(
          "status"
        ).value

    };


    if (editIndex === "") {

      dataSiswa.push(siswaBaru);

    } else {

      dataSiswa[editIndex] =
        siswaBaru;

    }


    renderSiswa(dataSiswa);

    tutupForm();

  }
);


function buatIdSiswa() {

  const nomor =
    dataSiswa.length + 1;

  return (
    "SIS" +
    String(nomor)
      .padStart(6, "0")
  );

}


function editSiswa(index) {

  const siswa =
    dataSiswa[index];

  document.getElementById("judulForm")
    .innerText = "Edit Siswa";

  document.getElementById("editIndex")
    .value = index;

  document.getElementById("namaLengkap")
    .value = siswa.namaLengkap;

  document.getElementById("namaPanggilan")
    .value = siswa.namaPanggilan;

  document.getElementById("jenisKelamin")
    .value = siswa.jenisKelamin;

  document.getElementById("tempatLahir")
    .value = siswa.tempatLahir;

  document.getElementById("tanggalLahir")
    .value = siswa.tanggalLahir;

  document.getElementById("namaWali")
    .value = siswa.namaWali;

  document.getElementById("noHpWali")
    .value = siswa.noHpWali;

  document.getElementById("kelas")
    .value = siswa.kelas;

  document.getElementById("pelatihPemilik")
    .value = siswa.pelatihPemilik;

  document.getElementById("pelatihDiminta")
    .value = siswa.pelatihDiminta;

  document.getElementById("status")
    .value = siswa.status;

  modalSiswa.classList.add("show");

}


function hapusSiswa(index) {

  const siswa =
    dataSiswa[index];

  const yakin =
    confirm(
      `Hapus data ${siswa.namaLengkap}?`
    );

  if (!yakin) {
    return;
  }

  dataSiswa.splice(index, 1);

  renderSiswa(dataSiswa);

}


function lihatDetail(index) {

  const siswa =
    dataSiswa[index];

  const isi =
    document.getElementById("isiDetail");

  isi.innerHTML = `

    <div class="detail-row">
      <span>ID Siswa</span>
      <strong>${siswa.id}</strong>
    </div>

    <div class="detail-row">
      <span>Nama Lengkap</span>
      <strong>${siswa.namaLengkap}</strong>
    </div>

    <div class="detail-row">
      <span>Nama Panggilan</span>
      <strong>${siswa.namaPanggilan}</strong>
    </div>

    <div class="detail-row">
      <span>Jenis Kelamin</span>
      <strong>${siswa.jenisKelamin}</strong>
    </div>

    <div class="detail-row">
      <span>Tempat Lahir</span>
      <strong>${siswa.tempatLahir || "-"}</strong>
    </div>

    <div class="detail-row">
      <span>Tanggal Lahir</span>
      <strong>${siswa.tanggalLahir || "-"}</strong>
    </div>

    <div class="detail-row">
      <span>Nama Wali</span>
      <strong>${siswa.namaWali || "-"}</strong>
    </div>

    <div class="detail-row">
      <span>No. HP Wali</span>
      <strong>${siswa.noHpWali || "-"}</strong>
    </div>

    <div class="detail-row">
      <span>Kelas</span>
      <strong>${siswa.kelas}</strong>
    </div>

    <div class="detail-row">
      <span>Pelatih Pemilik</span>
      <strong>${siswa.pelatihPemilik || "-"}</strong>
    </div>

    <div class="detail-row">
      <span>Pelatih Diminta</span>
      <strong>${siswa.pelatihDiminta || "-"}</strong>
    </div>

    <div class="detail-row">
      <span>Status</span>
      <strong>${siswa.status}</strong>
    </div>

  `;

  modalDetail.classList.add("show");

}


function tutupDetail() {

  modalDetail.classList.remove("show");

}


function logout() {

  const yakin =
    confirm(
      "Apakah Anda yakin ingin keluar?"
    );

  if (yakin) {

    window.location.href =
      "index.html";

  }

}