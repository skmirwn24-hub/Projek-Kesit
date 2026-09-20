const OWNER_KESIT = "Sukma Irawan & Ari Setiawan";

let allPelatih = [];
let filteredPelatih = [];
let currentDetailId = null;

/* =========================================================
   ELEMENT
========================================================= */

const tableBody =
  document.getElementById("pelatihTableBody");

const searchPelatih =
  document.getElementById("searchPelatih");

const filterStatus =
  document.getElementById("filterStatus");

const statTotalPelatih =
  document.getElementById("statTotalPelatih");

const statPelatihAktif =
  document.getElementById("statPelatihAktif");

const statPelatihTraining =
  document.getElementById("statPelatihTraining");

const statPelatihNonAktif =
  document.getElementById("statPelatihNonAktif");


/* TOMBOL TAMBAH */

const btnTambahPelatih =
  document.getElementById("btnTambahPelatih");


/* MODAL FORM */

const formModal =
  document.getElementById("formModal");

const formModalTitle =
  document.getElementById("formModalTitle");

const formModalSubtitle =
  document.getElementById("formModalSubtitle");

const closeFormModalBtn =
  document.getElementById("closeFormModalBtn");

const cancelFormBtn =
  document.getElementById("cancelFormBtn");

const formPelatih =
  document.getElementById("formPelatih");

const editPelatihId =
  document.getElementById("editPelatihId");

const namaPelatih =
  document.getElementById("namaPelatih");

const noHpPelatih =
  document.getElementById("noHpPelatih");

const emailPelatih =
  document.getElementById("emailPelatih");

const alamatPelatih =
  document.getElementById("alamatPelatih");

const tanggalLahirPelatih =
  document.getElementById("tanggalLahirPelatih");

const pendidikanPelatih =
  document.getElementById("pendidikanPelatih");

const sertifikatPelatih =
  document.getElementById("sertifikatPelatih");

const statusPelatih =
  document.getElementById("statusPelatih");

const tanggalMulaiTraining =
  document.getElementById("tanggalMulaiTraining");

const trainingDateGroup =
  document.getElementById("trainingDateGroup");

const trainingInfo =
  document.getElementById("trainingInfo");

const trainingInfoText =
  document.getElementById("trainingInfoText");

const savePelatihBtn =
  document.getElementById("savePelatihBtn");


/* MODAL DETAIL */

const detailModal =
  document.getElementById("detailModal");

const closeDetailModalBtn =
  document.getElementById("closeDetailModalBtn");

const closeDetailFooterBtn =
  document.getElementById("closeDetailFooterBtn");

const editFromDetailBtn =
  document.getElementById("editFromDetailBtn");

const detailNamaPelatih =
  document.getElementById("detailNamaPelatih");

const detailNama =
  document.getElementById("detailNama");

const detailStatus =
  document.getElementById("detailStatus");

const detailNoHp =
  document.getElementById("detailNoHp");

const detailEmail =
  document.getElementById("detailEmail");

const detailTanggalLahir =
  document.getElementById("detailTanggalLahir");

const detailPendidikan =
  document.getElementById("detailPendidikan");

const detailMulaiTraining =
  document.getElementById("detailMulaiTraining");

const detailBerakhirTraining =
  document.getElementById("detailBerakhirTraining");

const detailJumlahSiswa =
  document.getElementById("detailJumlahSiswa");

const detailAlamat =
  document.getElementById("detailAlamat");

const detailSertifikat =
  document.getElementById("detailSertifikat");

const detailSiswaList =
  document.getElementById("detailSiswaList");


/* =========================================================
   START
========================================================= */

document.addEventListener("DOMContentLoaded", async () => {

  await loadPelatih();

  searchPelatih.addEventListener(
    "input",
    applyFilters
  );

  filterStatus.addEventListener(
    "change",
    applyFilters
  );

  btnTambahPelatih.addEventListener(
    "click",
    bukaTambahPelatih
  );

  statusPelatih.addEventListener(
    "change",
    updateTrainingForm
  );

  tanggalMulaiTraining.addEventListener(
    "change",
    updateTrainingPreview
  );

  formPelatih.addEventListener(
    "submit",
    simpanPelatih
  );

  closeFormModalBtn.addEventListener(
    "click",
    tutupFormModal
  );

  cancelFormBtn.addEventListener(
    "click",
    tutupFormModal
  );

  closeDetailModalBtn.addEventListener(
    "click",
    tutupDetailModal
  );

  closeDetailFooterBtn.addEventListener(
    "click",
    tutupDetailModal
  );

  editFromDetailBtn.addEventListener(
    "click",
    () => {

      if (!currentDetailId) {
        return;
      }

      tutupDetailModal();

      bukaEditPelatih(
        currentDetailId
      );
    }
  );

  formModal.addEventListener(
    "click",
    (event) => {

      if (event.target === formModal) {
        tutupFormModal();
      }
    }
  );

  detailModal.addEventListener(
    "click",
    (event) => {

      if (event.target === detailModal) {
        tutupDetailModal();
      }
    }
  );

});


/* =========================================================
   LOAD DATA
========================================================= */

async function loadPelatih() {

  try {

    showLoading();

    const [
      pelatihResult,
      siswaResult
    ] = await Promise.all([

      window.supabaseClient
        .from("pelatih")
        .select(`
          id,
          nama,
          no_hp,
          email,
          status,
          alamat,
          tanggal_lahir,
          pendidikan,
          sertifikat,
          tanggal_mulai_training,
          tanggal_berakhir_training,
          created_at
        `)
        .order(
          "nama",
          { ascending: true }
        ),

      window.supabaseClient
        .from("siswa")
        .select(`
          id,
          id_siswa,
          nama_lengkap,
          status_siswa,
          pelatih_pemilik_id
        `)

    ]);

    if (pelatihResult.error) {
      throw pelatihResult.error;
    }

    if (siswaResult.error) {
      throw siswaResult.error;
    }

    const siswaData =
      siswaResult.data || [];

    allPelatih =
      (pelatihResult.data || [])
        .map((pelatih) => {

          const siswaMilik =
            siswaData.filter(
              (siswa) =>
                siswa.pelatih_pemilik_id ===
                pelatih.id
            );

          return {

            id:
              pelatih.id,

            nama:
              pelatih.nama || "-",

            noHp:
              pelatih.no_hp || "",

            email:
              pelatih.email || "",

            status:
              normalizeStatus(
                pelatih.status
              ),

            alamat:
              pelatih.alamat || "",

            tanggalLahir:
              pelatih.tanggal_lahir || "",

            pendidikan:
              pelatih.pendidikan || "",

            sertifikat:
              pelatih.sertifikat || "",

            tanggalMulaiTraining:
              pelatih.tanggal_mulai_training ||
              "",

            tanggalBerakhirTraining:
              pelatih.tanggal_berakhir_training ||
              "",

            createdAt:
              pelatih.created_at,

            siswaMilik

          };

        });

    filteredPelatih =
      [...allPelatih];

    updateStats();

    renderTable();

  } catch (error) {

    console.error(
      "Gagal memuat data pelatih:",
      error
    );

    tableBody.innerHTML = `
      <tr>
        <td
          colspan="7"
          class="empty-cell"
        >
          Gagal memuat data pelatih.
        </td>
      </tr>
    `;

  }

}


/* =========================================================
   STATUS
========================================================= */

function normalizeStatus(status) {

  const value =
    String(status || "")
      .trim()
      .toLowerCase();

  if (value === "training") {
    return "Training";
  }

  if (
    value === "tidak aktif" ||
    value === "non aktif" ||
    value === "nonaktif"
  ) {
    return "Tidak Aktif";
  }

  return "Aktif";

}


function getStatusClass(status) {

  if (status === "Training") {
    return "status-training";
  }

  if (status === "Tidak Aktif") {
    return "status-inactive";
  }

  return "status-active";

}


/* =========================================================
   STATISTIK
========================================================= */

function updateStats() {

  const total =
    allPelatih.length;

  const aktif =
    allPelatih.filter(
      (item) =>
        item.status === "Aktif"
    ).length;

  const training =
    allPelatih.filter(
      (item) =>
        item.status === "Training"
    ).length;

  const tidakAktif =
    allPelatih.filter(
      (item) =>
        item.status === "Tidak Aktif"
    ).length;

  statTotalPelatih.textContent =
    total;

  statPelatihAktif.textContent =
    aktif;

  statPelatihTraining.textContent =
    training;

  statPelatihNonAktif.textContent =
    tidakAktif;

}


/* =========================================================
   FILTER
========================================================= */

function applyFilters() {

  const keyword =
    searchPelatih.value
      .trim()
      .toLowerCase();

  const selectedStatus =
    filterStatus.value;

  filteredPelatih =
    allPelatih.filter(
      (pelatih) => {

        const cocokNama =
          pelatih.nama
            .toLowerCase()
            .includes(keyword);

        const cocokStatus =
          !selectedStatus ||
          pelatih.status ===
            selectedStatus;

        return (
          cocokNama &&
          cocokStatus
        );

      }
    );

  renderTable();

}


/* =========================================================
   TABLE
========================================================= */

function renderTable() {

  if (!filteredPelatih.length) {

    tableBody.innerHTML = `
      <tr>
        <td
          colspan="7"
          class="empty-cell"
        >
          Data pelatih tidak ditemukan.
        </td>
      </tr>
    `;

    return;
  }

  tableBody.innerHTML =
    filteredPelatih
      .map(
        (pelatih, index) => {

          const statusClass =
            getStatusClass(
              pelatih.status
            );

          return `
            <tr>

              <td>
                ${index + 1}
              </td>

              <td>

                <div class="coach-name">
                  ${escapeHtml(
                    pelatih.nama
                  )}
                </div>

              </td>

              <td>

                <div class="contact-text">

                  <span>
                    ${
                      pelatih.noHp
                        ? escapeHtml(
                            pelatih.noHp
                          )
                        : "-"
                    }
                  </span>

                  <span>
                    ${
                      pelatih.email
                        ? escapeHtml(
                            pelatih.email
                          )
                        : "-"
                    }
                  </span>

                </div>

              </td>

              <td>

                <span
                  class="status-badge ${statusClass}"
                >
                  ${pelatih.status}
                </span>

              </td>

              <td>
                ${renderTrainingInfo(
                  pelatih
                )}
              </td>

              <td>

                <span class="student-count">
                  ${pelatih.siswaMilik.length}
                </span>

              </td>

              <td>

                <div class="action-group">

                  <button
                    type="button"
                    class="action-btn"
                    onclick="bukaDetailPelatih('${pelatih.id}')"
                  >
                    Detail
                  </button>

                  <button
                    type="button"
                    class="action-btn"
                    onclick="bukaEditPelatih('${pelatih.id}')"
                  >
                    Edit
                  </button>

                </div>

              </td>

            </tr>
          `;

        }
      )
      .join("");

}


/* =========================================================
   TRAINING TABLE
========================================================= */

function renderTrainingInfo(
  pelatih
) {

  if (
    pelatih.status !== "Training"
  ) {
    return "-";
  }

  if (
    !pelatih.tanggalMulaiTraining ||
    !pelatih.tanggalBerakhirTraining
  ) {

    return `
      <div class="training-text">
        <strong>Training</strong>
        <span>Tanggal belum tersedia</span>
      </div>
    `;
  }

  const expired =
    isTrainingExpired(
      pelatih.tanggalBerakhirTraining
    );

  return `
    <div class="training-text">

      <strong>
        ${formatTanggal(
          pelatih.tanggalMulaiTraining
        )}
        -
        ${formatTanggal(
          pelatih.tanggalBerakhirTraining
        )}
      </strong>

      <span
        class="${
          expired
            ? "training-expired"
            : ""
        }"
      >
        ${
          expired
            ? "Masa training telah berakhir"
            : getSisaTrainingText(
                pelatih.tanggalBerakhirTraining
              )
        }
      </span>

    </div>
  `;

}


function isTrainingExpired(
  tanggalBerakhir
) {

  if (!tanggalBerakhir) {
    return false;
  }

  const today =
    new Date();

  today.setHours(
    0,
    0,
    0,
    0
  );

  const endDate =
    parseDateLocal(
      tanggalBerakhir
    );

  endDate.setHours(
    0,
    0,
    0,
    0
  );

  return today > endDate;

}


function getSisaTrainingText(
  tanggalBerakhir
) {

  const today =
    new Date();

  today.setHours(
    0,
    0,
    0,
    0
  );

  const endDate =
    parseDateLocal(
      tanggalBerakhir
    );

  endDate.setHours(
    0,
    0,
    0,
    0
  );

  const diff =
    endDate.getTime() -
    today.getTime();

  const days =
    Math.ceil(
      diff /
      (1000 * 60 * 60 * 24)
    );

  if (days <= 0) {
    return "Berakhir hari ini";
  }

  return `${days} hari tersisa`;

}


/* =========================================================
   TAMBAH PELATIH
========================================================= */

function bukaTambahPelatih() {

  formPelatih.reset();

  editPelatihId.value = "";

  formModalTitle.textContent =
    "Tambah Pelatih";

  formModalSubtitle.textContent =
    "Masukkan data pelatih baru KESIT Management.";

  savePelatihBtn.textContent =
    "Simpan Pelatih";

  statusPelatih.value =
    "Aktif";

  tanggalMulaiTraining.value =
    "";

  updateTrainingForm();

  formModal.classList.add(
    "show"
  );

}


/* =========================================================
   EDIT PELATIH
========================================================= */

function bukaEditPelatih(id) {

  const pelatih =
    allPelatih.find(
      (item) =>
        item.id === id
    );

  if (!pelatih) {
    return;
  }

  editPelatihId.value =
    pelatih.id;

  namaPelatih.value =
    pelatih.nama || "";

  noHpPelatih.value =
    pelatih.noHp || "";

  emailPelatih.value =
    pelatih.email || "";

  alamatPelatih.value =
    pelatih.alamat || "";

  tanggalLahirPelatih.value =
    pelatih.tanggalLahir || "";

  pendidikanPelatih.value =
    pelatih.pendidikan || "";

  sertifikatPelatih.value =
    pelatih.sertifikat || "";

  statusPelatih.value =
    pelatih.status;

  tanggalMulaiTraining.value =
    pelatih.tanggalMulaiTraining ||
    "";

  formModalTitle.textContent =
    "Edit Data Pelatih";

  formModalSubtitle.textContent =
    "Perbarui data tanpa mengubah ID pelatih.";

  savePelatihBtn.textContent =
    "Simpan Perubahan";

  updateTrainingForm();

  formModal.classList.add(
    "show"
  );

}


/* =========================================================
   TRAINING FORM
========================================================= */

function updateTrainingForm() {

  const isTraining =
    statusPelatih.value ===
    "Training";

  if (isTraining) {

    trainingDateGroup.style.display =
      "flex";

    trainingInfo.style.display =
      "block";

    if (
      !tanggalMulaiTraining.value
    ) {

      tanggalMulaiTraining.value =
        getTodayInput();
    }

    updateTrainingPreview();

  } else {

    trainingDateGroup.style.display =
      "none";

    trainingInfo.style.display =
      "none";

    tanggalMulaiTraining.value =
      "";

  }

}


function updateTrainingPreview() {

  if (
    statusPelatih.value !==
    "Training"
  ) {
    return;
  }

  const mulai =
    tanggalMulaiTraining.value;

  if (!mulai) {

    trainingInfoText.textContent =
      "Training berlaku selama 3 bulan.";

    return;
  }

  const berakhir =
    tambahBulan(
      mulai,
      3
    );

  trainingInfoText.textContent =
    `Training berlaku dari ${formatTanggal(
      mulai
    )} sampai ${formatTanggal(
      berakhir
    )}.`;

}


/* =========================================================
   SIMPAN TAMBAH / EDIT
========================================================= */

async function simpanPelatih(
  event
) {

  event.preventDefault();

  const id =
    editPelatihId.value;

  const nama =
    namaPelatih.value.trim();

  const status =
    statusPelatih.value;

  if (!nama) {

    alert(
      "Nama pelatih wajib diisi."
    );

    return;
  }

  if (
    status === "Training" &&
    !tanggalMulaiTraining.value
  ) {

    alert(
      "Tanggal mulai training wajib diisi."
    );

    return;
  }

  const payload = {

    nama,

    no_hp:
      noHpPelatih.value
        .trim() || null,

    email:
      emailPelatih.value
        .trim() || null,

    alamat:
      alamatPelatih.value
        .trim() || null,

    tanggal_lahir:
      tanggalLahirPelatih.value ||
      null,

    pendidikan:
      pendidikanPelatih.value
        .trim() || null,

    sertifikat:
      sertifikatPelatih.value
        .trim() || null,

    status,

    tanggal_mulai_training:
      status === "Training"
        ? tanggalMulaiTraining.value
        : null

  };

  savePelatihBtn.disabled =
    true;

  savePelatihBtn.textContent =
    "Menyimpan...";

  try {

    if (id) {

      const { error } =
        await window.supabaseClient
          .from("pelatih")
          .update(payload)
          .eq(
            "id",
            id
          );

      if (error) {
        throw error;
      }

      alert(
        "Data pelatih berhasil diperbarui."
      );

    } else {

      const { error } =
        await window.supabaseClient
          .from("pelatih")
          .insert(payload);

      if (error) {
        throw error;
      }

      alert(
        "Pelatih baru berhasil ditambahkan."
      );

    }

    tutupFormModal();

    await loadPelatih();

  } catch (error) {

    console.error(
      "Gagal menyimpan pelatih:",
      error
    );

    if (
      String(error.message || "")
        .toLowerCase()
        .includes("duplicate")
    ) {

      alert(
        "Nama pelatih sudah terdaftar."
      );

    } else {

      alert(
        `Gagal menyimpan pelatih: ${error.message}`
      );

    }

  } finally {

    savePelatihBtn.disabled =
      false;

    savePelatihBtn.textContent =
      id
        ? "Simpan Perubahan"
        : "Simpan Pelatih";

  }

}


/* =========================================================
   DETAIL
========================================================= */

function bukaDetailPelatih(
  id
) {

  const pelatih =
    allPelatih.find(
      (item) =>
        item.id === id
    );

  if (!pelatih) {
    return;
  }

  currentDetailId =
    pelatih.id;

  detailNamaPelatih.textContent =
    pelatih.nama;

  detailNama.textContent =
    pelatih.nama;

  detailStatus.textContent =
    pelatih.status;

  detailNoHp.textContent =
    pelatih.noHp || "-";

  detailEmail.textContent =
    pelatih.email || "-";

  detailTanggalLahir.textContent =
    pelatih.tanggalLahir
      ? formatTanggal(
          pelatih.tanggalLahir
        )
      : "-";

  detailPendidikan.textContent =
    pelatih.pendidikan || "-";

  detailMulaiTraining.textContent =
    pelatih.tanggalMulaiTraining
      ? formatTanggal(
          pelatih.tanggalMulaiTraining
        )
      : "-";

  detailBerakhirTraining.textContent =
    pelatih.tanggalBerakhirTraining
      ? formatTanggal(
          pelatih.tanggalBerakhirTraining
        )
      : "-";

  detailJumlahSiswa.textContent =
    pelatih.siswaMilik.length;

  detailAlamat.textContent =
    pelatih.alamat || "-";

  detailSertifikat.textContent =
    pelatih.sertifikat || "-";

  renderDetailSiswa(
    pelatih.siswaMilik
  );

  detailModal.classList.add(
    "show"
  );

}


function renderDetailSiswa(
  siswaList
) {

  if (!siswaList.length) {

    detailSiswaList.innerHTML = `
      <p style="color:#91969e;">
        Belum ada siswa milik pelatih ini.
      </p>
    `;

    return;
  }

  detailSiswaList.innerHTML =
    siswaList
      .map(
        (siswa) => `
          <div class="student-item">

            <div>

              <strong>
                ${escapeHtml(
                  siswa.nama_lengkap ||
                  "-"
                )}
              </strong>

              <span>
                ${escapeHtml(
                  siswa.id_siswa ||
                  "-"
                )}
              </span>

            </div>

            <span>
              ${escapeHtml(
                siswa.status_siswa ||
                "-"
              )}
            </span>

          </div>
        `
      )
      .join("");

}


/* =========================================================
   MODAL
========================================================= */

function tutupFormModal() {

  formModal.classList.remove(
    "show"
  );

  formPelatih.reset();

  editPelatihId.value = "";

}


function tutupDetailModal() {

  detailModal.classList.remove(
    "show"
  );

  currentDetailId = null;

}


/* =========================================================
   DATE
========================================================= */

function tambahBulan(
  dateString,
  jumlahBulan
) {

  const sourceDate =
    parseDateLocal(
      dateString
    );

  const originalDay =
    sourceDate.getDate();

  const target =
    new Date(
      sourceDate.getFullYear(),
      sourceDate.getMonth() +
        jumlahBulan,
      1
    );

  const lastDay =
    new Date(
      target.getFullYear(),
      target.getMonth() + 1,
      0
    ).getDate();

  target.setDate(
    Math.min(
      originalDay,
      lastDay
    )
  );

  return formatTanggalInput(
    target
  );

}


function parseDateLocal(
  value
) {

  const [
    year,
    month,
    day
  ] =
    value
      .split("-")
      .map(Number);

  return new Date(
    year,
    month - 1,
    day
  );

}


function formatTanggalInput(
  date
) {

  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(2, "0");

  const day =
    String(
      date.getDate()
    ).padStart(2, "0");

  return `${year}-${month}-${day}`;

}


function formatTanggal(
  value
) {

  if (!value) {
    return "-";
  }

  const parts =
    String(value)
      .split("-");

  if (parts.length !== 3) {
    return value;
  }

  return (
    `${parts[2]}/` +
    `${parts[1]}/` +
    `${parts[0]}`
  );

}


function getTodayInput() {

  const today =
    new Date();

  return formatTanggalInput(
    today
  );

}


/* =========================================================
   UTIL
========================================================= */

function showLoading() {

  tableBody.innerHTML = `
    <tr>
      <td
        colspan="7"
        class="loading-cell"
      >
        Memuat data pelatih...
      </td>
    </tr>
  `;

}


function escapeHtml(
  value
) {

  return String(value ?? "")
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#039;"
    );

}


/* =========================================================
   GLOBAL FUNCTION
========================================================= */

window.bukaDetailPelatih =
  bukaDetailPelatih;

window.bukaEditPelatih =
  bukaEditPelatih;