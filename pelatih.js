const OWNER_KESIT = "Sukma Irawan & Ari Setiawan";

let currentProfile = null;
let allPelatih = [];
let filteredPelatih = [];
let currentDetailId = null;

const el = (id) => document.getElementById(id);

const tableHead = el("pelatihTableHead");
const tableBody = el("pelatihTableBody");
const searchPelatih = el("searchPelatih");
const filterStatus = el("filterStatus");

const statTotalPelatih = el("statTotalPelatih");
const statPelatihAktif = el("statPelatihAktif");
const statPelatihTraining = el("statPelatihTraining");
const statPelatihNonAktif = el("statPelatihNonAktif");

const btnTambahPelatih = el("btnTambahPelatih");

const formModal = el("formModal");
const formModalTitle = el("formModalTitle");
const formModalSubtitle = el("formModalSubtitle");
const closeFormModalBtn = el("closeFormModalBtn");
const cancelFormBtn = el("cancelFormBtn");
const formPelatih = el("formPelatih");
const editPelatihId = el("editPelatihId");
const namaPelatih = el("namaPelatih");
const noHpPelatih = el("noHpPelatih");
const emailPelatih = el("emailPelatih");
const alamatPelatih = el("alamatPelatih");
const tanggalLahirPelatih = el("tanggalLahirPelatih");
const pendidikanPelatih = el("pendidikanPelatih");
const sertifikatPelatih = el("sertifikatPelatih");
const statusPelatih = el("statusPelatih");
const tanggalMulaiTraining = el("tanggalMulaiTraining");
const trainingDateGroup = el("trainingDateGroup");
const trainingInfo = el("trainingInfo");
const trainingInfoText = el("trainingInfoText");
const savePelatihBtn = el("savePelatihBtn");

const detailModal = el("detailModal");
const closeDetailModalBtn = el("closeDetailModalBtn");
const closeDetailFooterBtn = el("closeDetailFooterBtn");
const editFromDetailBtn = el("editFromDetailBtn");
const detailNamaPelatih = el("detailNamaPelatih");
const detailNama = el("detailNama");
const detailStatus = el("detailStatus");
const detailNoHp = el("detailNoHp");
const detailEmail = el("detailEmail");
const detailTanggalLahir = el("detailTanggalLahir");
const detailPendidikan = el("detailPendidikan");
const detailMulaiTraining = el("detailMulaiTraining");
const detailBerakhirTraining = el("detailBerakhirTraining");
const detailJumlahSiswa = el("detailJumlahSiswa");
const detailAlamat = el("detailAlamat");
const detailSertifikat = el("detailSertifikat");
const detailSiswaList = el("detailSiswaList");

document.addEventListener("DOMContentLoaded", init);

async function init() {
  try {
    currentProfile = await getCurrentProfile();

    if (!currentProfile) {
      window.location.href = "index.html";
      return;
    }

    applyRoleUI();
    bindEvents();
    await loadPelatih();
  } catch (error) {
    console.error("Gagal membuka halaman Pelatih:", error);
    alert("Gagal memuat halaman Pelatih.");
  }
}

async function getCurrentProfile() {
  const {
    data: { user },
    error: userError
  } = await window.supabaseClient.auth.getUser();

  if (userError || !user) return null;

  const { data, error } = await window.supabaseClient
    .from("user_profiles")
    .select("id, username, nama_tampilan, role, status_akun, pelatih_id, aktivasi_selesai")
    .eq("id", user.id)
    .single();

  if (error) throw error;

  if (
    String(data.status_akun || "").toLowerCase() !== "aktif" ||
    data.aktivasi_selesai !== true
  ) {
    await window.supabaseClient.auth.signOut();
    return null;
  }

  return {
    ...data,
    email: user.email || "-"
  };
}

function normalizeRole(value) {
  return String(value || "").trim().toLowerCase();
}

function isOwner() {
  return normalizeRole(currentProfile?.role) === "owner";
}

function isAdmin() {
  return normalizeRole(currentProfile?.role) === "admin";
}

function isPelatih() {
  return normalizeRole(currentProfile?.role) === "pelatih";
}

function canManagePelatih() {
  /*
    Sesuai hak akses yang sudah disepakati:
    Owner dapat mengubah master pelatih.
    Admin dan Pelatih hanya membaca.
  */
  return isOwner();
}

function applyRoleUI() {
  const displayName =
    currentProfile?.nama_tampilan ||
    currentProfile?.username ||
    currentProfile?.email ||
    "-";

  el("accountName").textContent = displayName;
  el("accountRole").textContent = currentProfile?.role || "-";

  document.querySelectorAll(".owner-admin-only").forEach((node) => {
    node.hidden = !(isOwner() || isAdmin());
  });

  document.querySelectorAll(".owner-only").forEach((node) => {
    node.hidden = !isOwner();
  });

  btnTambahPelatih.hidden = !canManagePelatih();

  if (isPelatih()) {
    el("pelatihReadonlyNote").hidden = false;
    el("pageSubtitle").textContent =
      "Daftar pelatih dan status operasional KESIT Management.";
    el("panelDescription").textContent =
      "Mode hanya lihat. Data pribadi pelatih lain dan daftar siswa tidak ditampilkan.";
  } else if (isAdmin()) {
    el("pageSubtitle").textContent =
      "Daftar data, status, dan masa training pelatih KESIT Management.";
    el("panelDescription").textContent =
      "Admin dapat melihat data pelatih. Perubahan master pelatih dilakukan oleh Owner.";
  } else {
    el("pelatihReadonlyNote").hidden = true;
  }

  renderTableHeader();
}

function bindEvents() {
  el("logoutBtn").addEventListener("click", logout);

  searchPelatih.addEventListener("input", applyFilters);
  filterStatus.addEventListener("change", applyFilters);

  if (canManagePelatih()) {
    btnTambahPelatih.addEventListener("click", bukaTambahPelatih);
    statusPelatih.addEventListener("change", updateTrainingForm);
    tanggalMulaiTraining.addEventListener("change", updateTrainingPreview);
    formPelatih.addEventListener("submit", simpanPelatih);
  }

  closeFormModalBtn.addEventListener("click", tutupFormModal);
  cancelFormBtn.addEventListener("click", tutupFormModal);
  closeDetailModalBtn.addEventListener("click", tutupDetailModal);
  closeDetailFooterBtn.addEventListener("click", tutupDetailModal);

  editFromDetailBtn.addEventListener("click", () => {
    if (!canManagePelatih() || !currentDetailId) return;
    tutupDetailModal();
    bukaEditPelatih(currentDetailId);
  });

  formModal.addEventListener("click", (event) => {
    if (event.target === formModal) tutupFormModal();
  });

  detailModal.addEventListener("click", (event) => {
    if (event.target === detailModal) tutupDetailModal();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      tutupFormModal();
      tutupDetailModal();
    }
  });
}

async function logout() {
  await window.supabaseClient.auth.signOut();
  sessionStorage.clear();
  window.location.href = "index.html";
}

async function loadPelatih() {
  try {
    showLoading();

    /*
      Pelatih tidak perlu mengambil data siswa seluruh klub.
      Owner/Admin boleh karena RLS masing-masing sudah menjadi pengaman DB.
    */
    const pelatihQuery = window.supabaseClient
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
      .order("nama", { ascending: true });

    let pelatihResult;
    let siswaResult = { data: [], error: null };

    if (isPelatih()) {
      pelatihResult = await pelatihQuery;
    } else {
      [pelatihResult, siswaResult] = await Promise.all([
        pelatihQuery,
        window.supabaseClient
          .from("siswa")
          .select("id, id_siswa, nama_lengkap, status_siswa, pelatih_pemilik_id")
      ]);
    }

    if (pelatihResult.error) throw pelatihResult.error;
    if (siswaResult.error) throw siswaResult.error;

    const siswaData = siswaResult.data || [];

    allPelatih = (pelatihResult.data || []).map((pelatih) => {
      const siswaMilik = isPelatih()
        ? []
        : siswaData.filter(
            (siswa) => siswa.pelatih_pemilik_id === pelatih.id
          );

      return {
        id: pelatih.id,
        nama: pelatih.nama || "-",
        noHp: pelatih.no_hp || "",
        email: pelatih.email || "",
        status: normalizeStatus(pelatih.status),
        alamat: pelatih.alamat || "",
        tanggalLahir: pelatih.tanggal_lahir || "",
        pendidikan: pelatih.pendidikan || "",
        sertifikat: pelatih.sertifikat || "",
        tanggalMulaiTraining: pelatih.tanggal_mulai_training || "",
        tanggalBerakhirTraining: pelatih.tanggal_berakhir_training || "",
        createdAt: pelatih.created_at,
        siswaMilik
      };
    });

    filteredPelatih = [...allPelatih];
    updateStats();
    renderTable();
  } catch (error) {
    console.error("Gagal memuat data pelatih:", error);

    tableBody.innerHTML = `
      <tr>
        <td colspan="${getColumnCount()}" class="empty-cell">
          Gagal memuat data pelatih.
        </td>
      </tr>
    `;
  }
}

function normalizeStatus(status) {
  const value = String(status || "").trim().toLowerCase();

  if (value === "training") return "Training";

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
  if (status === "Training") return "status-training";
  if (status === "Tidak Aktif") return "status-inactive";
  return "status-active";
}

function updateStats() {
  statTotalPelatih.textContent = allPelatih.length;
  statPelatihAktif.textContent =
    allPelatih.filter((item) => item.status === "Aktif").length;
  statPelatihTraining.textContent =
    allPelatih.filter((item) => item.status === "Training").length;
  statPelatihNonAktif.textContent =
    allPelatih.filter((item) => item.status === "Tidak Aktif").length;
}

function applyFilters() {
  const keyword = searchPelatih.value.trim().toLowerCase();
  const selectedStatus = filterStatus.value;

  filteredPelatih = allPelatih.filter((pelatih) => {
    const cocokNama = pelatih.nama.toLowerCase().includes(keyword);
    const cocokStatus =
      !selectedStatus || pelatih.status === selectedStatus;

    return cocokNama && cocokStatus;
  });

  renderTable();
}

function renderTableHeader() {
  if (isPelatih()) {
    tableHead.innerHTML = `
      <tr>
        <th>No</th>
        <th>Nama Pelatih</th>
        <th>Status</th>
        <th>Masa Training</th>
        <th>Aksi</th>
      </tr>
    `;
    return;
  }

  tableHead.innerHTML = `
    <tr>
      <th>No</th>
      <th>Nama Pelatih</th>
      <th>Kontak</th>
      <th>Status</th>
      <th>Masa Training</th>
      <th>Siswa Milik</th>
      <th>Aksi</th>
    </tr>
  `;
}

function getColumnCount() {
  return isPelatih() ? 5 : 7;
}

function renderTable() {
  if (!filteredPelatih.length) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="${getColumnCount()}" class="empty-cell">
          Data pelatih tidak ditemukan.
        </td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = filteredPelatih
    .map((pelatih, index) => {
      const statusClass = getStatusClass(pelatih.status);

      if (isPelatih()) {
        return `
          <tr>
            <td>${index + 1}</td>
            <td><div class="coach-name">${escapeHtml(pelatih.nama)}</div></td>
            <td>
              <span class="status-badge ${statusClass}">
                ${escapeHtml(pelatih.status)}
              </span>
            </td>
            <td>${renderTrainingInfo(pelatih)}</td>
            <td>
              <button
                type="button"
                class="action-btn"
                data-detail-id="${escapeHtml(pelatih.id)}"
              >
                Detail
              </button>
            </td>
          </tr>
        `;
      }

      const editButton = canManagePelatih()
        ? `
          <button
            type="button"
            class="action-btn"
            data-edit-id="${escapeHtml(pelatih.id)}"
          >
            Edit
          </button>
        `
        : "";

      return `
        <tr>
          <td>${index + 1}</td>
          <td><div class="coach-name">${escapeHtml(pelatih.nama)}</div></td>
          <td>
            <div class="contact-text">
              <span>${pelatih.noHp ? escapeHtml(pelatih.noHp) : "-"}</span>
              <span>${pelatih.email ? escapeHtml(pelatih.email) : "-"}</span>
            </div>
          </td>
          <td>
            <span class="status-badge ${statusClass}">
              ${escapeHtml(pelatih.status)}
            </span>
          </td>
          <td>${renderTrainingInfo(pelatih)}</td>
          <td><span class="student-count">${pelatih.siswaMilik.length}</span></td>
          <td>
            <div class="action-group">
              <button
                type="button"
                class="action-btn"
                data-detail-id="${escapeHtml(pelatih.id)}"
              >
                Detail
              </button>
              ${editButton}
            </div>
          </td>
        </tr>
      `;
    })
    .join("");

  tableBody.querySelectorAll("[data-detail-id]").forEach((button) => {
    button.addEventListener("click", () =>
      bukaDetailPelatih(button.dataset.detailId)
    );
  });

  tableBody.querySelectorAll("[data-edit-id]").forEach((button) => {
    button.addEventListener("click", () =>
      bukaEditPelatih(button.dataset.editId)
    );
  });
}

function renderTrainingInfo(pelatih) {
  if (pelatih.status !== "Training") return "-";

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

  const expired = isTrainingExpired(pelatih.tanggalBerakhirTraining);

  return `
    <div class="training-text">
      <strong>
        ${formatTanggal(pelatih.tanggalMulaiTraining)}
        -
        ${formatTanggal(pelatih.tanggalBerakhirTraining)}
      </strong>
      <span class="${expired ? "training-expired" : ""}">
        ${
          expired
            ? "Training Berakhir – Menunggu Keputusan Owner"
            : getSisaTrainingText(pelatih.tanggalBerakhirTraining)
        }
      </span>
    </div>
  `;
}

function isTrainingExpired(tanggalBerakhir) {
  if (!tanggalBerakhir) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const endDate = parseDateLocal(tanggalBerakhir);
  endDate.setHours(0, 0, 0, 0);

  return today > endDate;
}

function getSisaTrainingText(tanggalBerakhir) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const endDate = parseDateLocal(tanggalBerakhir);
  endDate.setHours(0, 0, 0, 0);

  const diff = endDate.getTime() - today.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

  if (days <= 0) return "Berakhir hari ini";
  return `${days} hari tersisa`;
}

function bukaTambahPelatih() {
  if (!canManagePelatih()) return;

  formPelatih.reset();
  editPelatihId.value = "";
  formModalTitle.textContent = "Tambah Pelatih";
  formModalSubtitle.textContent =
    "Masukkan data pelatih baru KESIT Management.";
  savePelatihBtn.textContent = "Simpan Pelatih";
  statusPelatih.value = "Aktif";
  tanggalMulaiTraining.value = "";
  updateTrainingForm();
  formModal.classList.add("show");
}

function bukaEditPelatih(id) {
  if (!canManagePelatih()) {
    alert("Perubahan data pelatih hanya dapat dilakukan oleh Owner.");
    return;
  }

  const pelatih = allPelatih.find((item) => item.id === id);
  if (!pelatih) return;

  editPelatihId.value = pelatih.id;
  namaPelatih.value = pelatih.nama || "";
  noHpPelatih.value = pelatih.noHp || "";
  emailPelatih.value = pelatih.email || "";
  alamatPelatih.value = pelatih.alamat || "";
  tanggalLahirPelatih.value = pelatih.tanggalLahir || "";
  pendidikanPelatih.value = pelatih.pendidikan || "";
  sertifikatPelatih.value = pelatih.sertifikat || "";
  statusPelatih.value = pelatih.status;
  tanggalMulaiTraining.value = pelatih.tanggalMulaiTraining || "";

  formModalTitle.textContent = "Edit Data Pelatih";
  formModalSubtitle.textContent =
    "Perbarui data tanpa mengubah ID pelatih.";
  savePelatihBtn.textContent = "Simpan Perubahan";

  updateTrainingForm();
  formModal.classList.add("show");
}

function updateTrainingForm() {
  if (!canManagePelatih()) return;

  const isTraining = statusPelatih.value === "Training";

  if (isTraining) {
    trainingDateGroup.style.display = "flex";
    trainingInfo.style.display = "block";

    if (!tanggalMulaiTraining.value) {
      tanggalMulaiTraining.value = getTodayInput();
    }

    updateTrainingPreview();
  } else {
    trainingDateGroup.style.display = "none";
    trainingInfo.style.display = "none";
    tanggalMulaiTraining.value = "";
  }
}

function updateTrainingPreview() {
  if (!canManagePelatih()) return;
  if (statusPelatih.value !== "Training") return;

  const mulai = tanggalMulaiTraining.value;

  if (!mulai) {
    trainingInfoText.textContent =
      "Training berlaku selama 3 bulan.";
    return;
  }

  const berakhir = tambahBulan(mulai, 3);

  trainingInfoText.textContent =
    `Training berlaku dari ${formatTanggal(mulai)} sampai ${formatTanggal(berakhir)}.`;
}

async function simpanPelatih(event) {
  event.preventDefault();

  if (!canManagePelatih()) {
    alert("Perubahan data pelatih hanya dapat dilakukan oleh Owner.");
    return;
  }

  const id = editPelatihId.value;
  const nama = namaPelatih.value.trim();
  const status = statusPelatih.value;

  if (!nama) {
    alert("Nama pelatih wajib diisi.");
    return;
  }

  if (status === "Training" && !tanggalMulaiTraining.value) {
    alert("Tanggal mulai training wajib diisi.");
    return;
  }

  const payload = {
    nama,
    no_hp: noHpPelatih.value.trim() || null,
    email: emailPelatih.value.trim() || null,
    alamat: alamatPelatih.value.trim() || null,
    tanggal_lahir: tanggalLahirPelatih.value || null,
    pendidikan: pendidikanPelatih.value.trim() || null,
    sertifikat: sertifikatPelatih.value.trim() || null,
    status,
    tanggal_mulai_training:
      status === "Training" ? tanggalMulaiTraining.value : null
  };

  savePelatihBtn.disabled = true;
  savePelatihBtn.textContent = "Menyimpan...";

  try {
    if (id) {
      const { error } = await window.supabaseClient
        .from("pelatih")
        .update(payload)
        .eq("id", id);

      if (error) throw error;
      alert("Data pelatih berhasil diperbarui.");
    } else {
      const { error } = await window.supabaseClient
        .from("pelatih")
        .insert(payload);

      if (error) throw error;
      alert("Pelatih baru berhasil ditambahkan.");
    }

    tutupFormModal();
    await loadPelatih();
  } catch (error) {
    console.error("Gagal menyimpan pelatih:", error);

    if (
      String(error.message || "").toLowerCase().includes("duplicate")
    ) {
      alert("Nama pelatih sudah terdaftar.");
    } else {
      alert(`Gagal menyimpan pelatih: ${error.message}`);
    }
  } finally {
    savePelatihBtn.disabled = false;
    savePelatihBtn.textContent = id
      ? "Simpan Perubahan"
      : "Simpan Pelatih";
  }
}

function bukaDetailPelatih(id) {
  const pelatih = allPelatih.find((item) => item.id === id);
  if (!pelatih) return;

  currentDetailId = pelatih.id;

  detailNamaPelatih.textContent = pelatih.nama;
  detailNama.textContent = pelatih.nama;
  detailStatus.textContent = pelatih.status;
  detailMulaiTraining.textContent = pelatih.tanggalMulaiTraining
    ? formatTanggal(pelatih.tanggalMulaiTraining)
    : "-";
  detailBerakhirTraining.textContent = pelatih.tanggalBerakhirTraining
    ? formatTanggal(pelatih.tanggalBerakhirTraining)
    : "-";

  /*
    Untuk Pelatih, detail pribadi pelatih lain tidak ditampilkan.
    Ini pembatas UI; RLS tetap pengaman utama pada database.
  */
  const bolehLihatDetailPribadi = !isPelatih();

  document.querySelectorAll(".private-detail").forEach((node) => {
    node.hidden = !bolehLihatDetailPribadi;
  });

  document.querySelectorAll(".owner-admin-detail").forEach((node) => {
    node.hidden = isPelatih();
  });

  if (bolehLihatDetailPribadi) {
    detailNoHp.textContent = pelatih.noHp || "-";
    detailEmail.textContent = pelatih.email || "-";
    detailTanggalLahir.textContent = pelatih.tanggalLahir
      ? formatTanggal(pelatih.tanggalLahir)
      : "-";
    detailPendidikan.textContent = pelatih.pendidikan || "-";
    detailAlamat.textContent = pelatih.alamat || "-";
    detailSertifikat.textContent = pelatih.sertifikat || "-";

    detailJumlahSiswa.textContent = pelatih.siswaMilik.length;
    renderDetailSiswa(pelatih.siswaMilik);
  }

  editFromDetailBtn.hidden = !canManagePelatih();
  detailModal.classList.add("show");
}

function renderDetailSiswa(siswaList) {
  if (!siswaList.length) {
    detailSiswaList.innerHTML = `
      <p style="color:#91969e;">
        Belum ada siswa milik pelatih ini.
      </p>
    `;
    return;
  }

  detailSiswaList.innerHTML = siswaList
    .map(
      (siswa) => `
        <div class="student-item">
          <div>
            <strong>${escapeHtml(siswa.nama_lengkap || "-")}</strong>
            <span>${escapeHtml(siswa.id_siswa || "-")}</span>
          </div>
          <span>${escapeHtml(siswa.status_siswa || "-")}</span>
        </div>
      `
    )
    .join("");
}

function tutupFormModal() {
  formModal.classList.remove("show");
}

function tutupDetailModal() {
  detailModal.classList.remove("show");
  currentDetailId = null;
}

function tambahBulan(dateString, jumlahBulan) {
  const sourceDate = parseDateLocal(dateString);
  const originalDay = sourceDate.getDate();

  const target = new Date(
    sourceDate.getFullYear(),
    sourceDate.getMonth() + jumlahBulan,
    1
  );

  const lastDay = new Date(
    target.getFullYear(),
    target.getMonth() + 1,
    0
  ).getDate();

  target.setDate(Math.min(originalDay, lastDay));
  return formatTanggalInput(target);
}

function parseDateLocal(value) {
  const [year, month, day] = String(value).split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatTanggalInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatTanggal(value) {
  if (!value) return "-";

  const parts = String(value).split("-");
  if (parts.length !== 3) return value;

  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function getTodayInput() {
  return formatTanggalInput(new Date());
}

function showLoading() {
  tableBody.innerHTML = `
    <tr>
      <td colspan="${getColumnCount()}" class="loading-cell">
        Memuat data pelatih...
      </td>
    </tr>
  `;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
