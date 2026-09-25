const OWNER_KESIT = "Sukma Irawan & Ari Setiawan";
const KKM_PELATIH = 4.0;

let currentProfile = null;
let daftarPelatih = [];
let riwayatPenilaian = [];
let filteredRiwayat = [];
let inputBy = "-";

const el = (id) => document.getElementById(id);

const formPenilaian = el("formPenilaian");
const formPanel = el("formPanel");
const pelatihId = el("pelatihId");
const tanggalPenilaian = el("tanggalPenilaian");
const kedisiplinan = el("kedisiplinan");
const kehadiran = el("kehadiran");
const kualitasMengajar = el("kualitasMengajar");
const komunikasi = el("komunikasi");
const administrasiLaporan = el("administrasiLaporan");
const catatan = el("catatan");
const kategoriPelanggaran = el("kategoriPelanggaran");
const jenisSanksi = el("jenisSanksi");
const detailPelanggaran = el("detailPelanggaran");
const tanggalMulaiSanksi = el("tanggalMulaiSanksi");
const tanggalBerakhirSanksi = el("tanggalBerakhirSanksi");
const persentaseDenda = el("persentaseDenda");
const sesiTanpaHonor = el("sesiTanpaHonor");
const nominalDendaPreview = el("nominalDendaPreview");
const catatanSanksi = el("catatanSanksi");
const adminInputInfo = el("adminInputInfo");

const statTotalPelatih = el("statTotalPelatih");
const statMemenuhiKKM = el("statMemenuhiKKM");
const statBelumKKM = el("statBelumKKM");
const statSanksiAktif = el("statSanksiAktif");

const searchRiwayat = el("searchRiwayat");
const filterSanksi = el("filterSanksi");
const riwayatTableBody = el("riwayatTableBody");

const detailModal = el("detailModal");
const closeModalBtn = el("closeModalBtn");
const closeModalFooterBtn = el("closeModalFooterBtn");

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

    if (canManageAssessments()) {
      setTanggalHariIni();
      await loadPelatih();
    }

    await loadRiwayat();
  } catch (error) {
    console.error("Gagal membuka Penilaian Pelatih:", error);
    alert("Gagal memuat halaman Penilaian Pelatih.");
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

function canManageAssessments() {
  return isOwner() || isAdmin();
}

function applyRoleUI() {
  const name = currentProfile?.nama_tampilan || currentProfile?.username || currentProfile?.email || "-";
  const role = currentProfile?.role || "-";

  el("accountName").textContent = name;
  el("accountRole").textContent = role;
  inputBy = name;
  adminInputInfo.textContent = name;

  document.querySelectorAll(".owner-admin-only").forEach((node) => {
    node.hidden = !(isOwner() || isAdmin());
  });

  document.querySelectorAll(".owner-only").forEach((node) => {
    node.hidden = !isOwner();
  });

  if (isPelatih()) {
    formPanel.hidden = true;
    el("pelatihReadonlyNote").hidden = false;
    el("historyFilters").hidden = true;
    el("statLabelTotal").textContent = "Riwayat Penilaian Saya";
    el("historyTitle").textContent = "Penilaian Saya";
    el("historyDescription").textContent =
      "Hanya hasil penilaian yang terkait dengan akun pelatih Anda yang ditampilkan.";
    el("pageSubtitle").textContent =
      "Hasil penilaian, KKM, pelanggaran dan sanksi milik akun pelatih Anda.";
  } else {
    formPanel.hidden = false;
    el("pelatihReadonlyNote").hidden = true;
    el("historyFilters").hidden = false;
  }
}

function bindEvents() {
  el("logoutBtn").addEventListener("click", logout);

  if (canManageAssessments()) {
    formPenilaian.addEventListener("submit", simpanPenilaian);
    pelatihId.addEventListener("change", updateSanksiPreview);
    jenisSanksi.addEventListener("change", updateSanksiPreview);
    tanggalMulaiSanksi.addEventListener("change", updateSanksiPreview);

    formPenilaian.addEventListener("reset", () => {
      setTimeout(() => {
        setTanggalHariIni();
        resetSanksiPreview();
      }, 0);
    });
  }

  searchRiwayat.addEventListener("input", applyFilters);
  filterSanksi.addEventListener("change", applyFilters);

  closeModalBtn.addEventListener("click", tutupModal);
  closeModalFooterBtn.addEventListener("click", tutupModal);

  detailModal.addEventListener("click", (event) => {
    if (event.target === detailModal) tutupModal();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") tutupModal();
  });
}

async function logout() {
  await window.supabaseClient.auth.signOut();
  sessionStorage.clear();
  window.location.href = "index.html";
}

function setTanggalHariIni() {
  const value = formatTanggalInput(new Date());
  tanggalPenilaian.value = value;
  if (!tanggalMulaiSanksi.value) tanggalMulaiSanksi.value = value;
}

async function loadPelatih() {
  try {
    const { data, error } = await window.supabaseClient
      .from("pelatih")
      .select("id, nama, status")
      .order("nama", { ascending: true });

    if (error) throw error;

    daftarPelatih = (data || []).filter((item) => {
      const nama = String(item.nama || "").trim();
      const status = String(item.status || "").trim().toLowerCase();

      const bukanOwner = nama !== OWNER_KESIT;
      const aktif =
        status !== "tidak aktif" &&
        status !== "non aktif" &&
        status !== "nonaktif";

      return bukanOwner && aktif;
    });

    pelatihId.innerHTML = `
      <option value="">Pilih pelatih...</option>
      ${daftarPelatih
        .map(
          (item) =>
            `<option value="${escapeHtml(item.id)}">${escapeHtml(item.nama)}</option>`
        )
        .join("")}
    `;
  } catch (error) {
    console.error("Gagal memuat data pelatih:", error);
    alert("Gagal memuat data pelatih.");
  }
}

async function loadRiwayat() {
  showLoading();

  try {
    let query = window.supabaseClient
      .from("v_penilaian_pelatih")
      .select("*")
      .neq("nama_pelatih", OWNER_KESIT)
      .order("tanggal_penilaian", { ascending: false })
      .order("created_at", { ascending: false });

    /*
      RLS + security_invoker pada view tetap menjadi pengaman utama.
      Filter ini hanya memperjelas intent UI untuk akun Pelatih.
    */
    if (isPelatih() && currentProfile?.pelatih_id) {
      query = query.eq("pelatih_id", currentProfile.pelatih_id);
    }

    const { data, error } = await query;
    if (error) throw error;

    riwayatPenilaian = (data || []).map(mapRiwayat);
    filteredRiwayat = [...riwayatPenilaian];

    updateStats();
    renderRiwayat();
  } catch (error) {
    console.error("Gagal memuat riwayat:", error);
    riwayatTableBody.innerHTML = `
      <tr>
        <td colspan="12" class="empty-cell">
          Gagal memuat riwayat penilaian.
        </td>
      </tr>
    `;
  }
}

function mapRiwayat(item) {
  return {
    id: item.id,
    pelatihId: item.pelatih_id,
    namaPelatih: item.nama_pelatih || "-",
    tanggalPenilaian: item.tanggal_penilaian,
    rataRata: Number(item.nilai_rata_rata || 0),
    kkm: Number(item.kkm || KKM_PELATIH),
    statusKKM: item.status_kkm || "-",
    kategoriPelanggaran: item.kategori_pelanggaran || "Tidak Ada",
    detailPelanggaran: item.detail_pelanggaran || "-",
    jenisSanksi: item.jenis_sanksi || "Tidak Ada",
    tanggalMulaiSanksi: item.tanggal_mulai_sanksi,
    tanggalBerakhirSanksi: item.tanggal_berakhir_sanksi,
    statusSanksi: item.status_sanksi || "Tidak Ada",
    persentaseDenda: Number(item.persentase_denda || 0),
    nominalDenda: Number(item.nominal_denda || 0),
    sesiTanpaHonor: Number(item.sesi_tanpa_honor || 0),
    catatan: item.catatan || "-",
    catatanSanksi: item.catatan_sanksi || "-",
    diinputOleh: item.diinput_oleh || "-"
  };
}

function updateStats() {
  if (isPelatih()) {
    statTotalPelatih.textContent = riwayatPenilaian.length;
    statMemenuhiKKM.textContent = riwayatPenilaian.filter(
      (item) => item.statusKKM === "Memenuhi KKM"
    ).length;
    statBelumKKM.textContent = riwayatPenilaian.filter(
      (item) => item.statusKKM === "Belum Memenuhi KKM"
    ).length;
    statSanksiAktif.textContent = riwayatPenilaian.filter(
      (item) => item.statusSanksi === "Aktif"
    ).length;
    return;
  }

  const latestPerPelatih = new Map();
  riwayatPenilaian.forEach((item) => {
    if (!latestPerPelatih.has(item.pelatihId)) {
      latestPerPelatih.set(item.pelatihId, item);
    }
  });

  const latestList = [...latestPerPelatih.values()];

  statTotalPelatih.textContent = latestList.length;
  statMemenuhiKKM.textContent = latestList.filter(
    (item) => item.statusKKM === "Memenuhi KKM"
  ).length;
  statBelumKKM.textContent = latestList.filter(
    (item) => item.statusKKM === "Belum Memenuhi KKM"
  ).length;
  statSanksiAktif.textContent = latestList.filter(
    (item) =>
      item.statusSanksi === "Aktif" ||
      item.statusSanksi === "Nonaktif" ||
      item.statusSanksi === "Pemutusan Kerja Sama"
  ).length;
}

async function updateSanksiPreview() {
  if (!canManageAssessments()) return;

  const selectedPelatihId = pelatihId.value;
  const sanksi = jenisSanksi.value;
  const mulai = tanggalMulaiSanksi.value;

  let persenDenda = 0;
  let sesi = 0;
  let berakhir = "";
  let nominal = 0;

  if (sanksi === "Teguran") {
    if (mulai) berakhir = tambahHari(mulai, 30);
  } else if (sanksi === "SP-1") {
    persenDenda = 20;
    if (mulai) berakhir = tambahBulan(mulai, 3);
  } else if (sanksi === "SP-2") {
    persenDenda = 50;
    if (mulai) berakhir = tambahBulan(mulai, 6);
  } else if (sanksi === "SP-3") {
    persenDenda = 100;
    berakhir = "Tidak ada tanggal berakhir";
  } else if (sanksi === "Pemutusan Kerja Sama") {
    persenDenda = 100;
    berakhir = "Permanen";
  }

  if (selectedPelatihId && sanksi !== "Tidak Ada") {
    const kondisi = await hitungKondisiPelatih(
      selectedPelatihId,
      persenDenda,
      sanksi
    );
    nominal = kondisi.nominalDenda;
    sesi = kondisi.sesiTanpaHonor;
  }

  persentaseDenda.value = `${persenDenda}%`;
  sesiTanpaHonor.value = `${sesi} sesi`;
  tanggalBerakhirSanksi.value = berakhir;

  if (persenDenda === 0) {
    nominalDendaPreview.value = "Tidak ada denda";
  } else if (nominal > 0) {
    nominalDendaPreview.value = formatRupiah(nominal);
  } else if (sesi > 0) {
    nominalDendaPreview.value = `Tidak ada denda uang • ${sesi} sesi tanpa honor`;
  } else {
    nominalDendaPreview.value = "Belum ada dasar perhitungan SPP";
  }
}

async function hitungKondisiPelatih(selectedPelatihId, persenDenda, sanksi) {
  let nominalDenda = 0;
  let sesi = 0;

  /*
    Hanya Owner/Admin yang memanggil fungsi ini.
    v_rekapan_siswa mengandung data pembayaran sehingga memang tidak digunakan
    pada mode Pelatih.
  */
  try {
    const { data, error } = await window.supabaseClient
      .from("v_rekapan_siswa")
      .select("id, pelatih_pemilik_id, total_tagihan")
      .eq("pelatih_pemilik_id", selectedPelatihId);

    if (error) throw error;

    const siswaMilik = data || [];

    if (siswaMilik.length > 0) {
      const totalHakDasar = siswaMilik.reduce(
        (total, siswa) => total + Number(siswa.total_tagihan || 0),
        0
      );
      nominalDenda = Math.round(totalHakDasar * (persenDenda / 100));
    } else {
      if (sanksi === "SP-1") sesi = 5;
      if (sanksi === "SP-2") sesi = 10;
    }
  } catch (error) {
    console.warn("Dasar nominal denda tidak tersedia:", error);
    if (sanksi === "SP-1") sesi = 5;
    if (sanksi === "SP-2") sesi = 10;
  }

  return { nominalDenda, sesiTanpaHonor: sesi };
}

async function simpanPenilaian(event) {
  event.preventDefault();

  if (!canManageAssessments()) {
    alert("Akun Pelatih tidak memiliki izin menginput penilaian.");
    return;
  }

  const selectedPelatih = pelatihId.value;
  const tanggal = tanggalPenilaian.value;

  const nilaiKedisiplinan = Number(kedisiplinan.value);
  const nilaiKehadiran = Number(kehadiran.value);
  const nilaiKualitas = Number(kualitasMengajar.value);
  const nilaiKomunikasi = Number(komunikasi.value);
  const nilaiAdministrasi = Number(administrasiLaporan.value);

  if (
    !selectedPelatih ||
    !tanggal ||
    !nilaiKedisiplinan ||
    !nilaiKehadiran ||
    !nilaiKualitas ||
    !nilaiKomunikasi ||
    !nilaiAdministrasi
  ) {
    alert("Lengkapi seluruh bagian penilaian.");
    return;
  }

  const selectedKategori = kategoriPelanggaran.value;
  const selectedSanksi = jenisSanksi.value;

  if (
    selectedKategori !== "Tidak Ada" &&
    !detailPelanggaran.value.trim()
  ) {
    alert("Detail pelanggaran wajib diisi.");
    return;
  }

  if (
    selectedSanksi !== "Tidak Ada" &&
    !tanggalMulaiSanksi.value
  ) {
    alert("Tanggal mulai sanksi wajib diisi.");
    return;
  }

  const persenDenda =
    Number(persentaseDenda.value.replace("%", "")) || 0;

  const kondisi = await hitungKondisiPelatih(
    selectedPelatih,
    persenDenda,
    selectedSanksi
  );

  const submitButton = formPenilaian.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  submitButton.textContent = "Menyimpan...";

  try {
    const payload = {
      pelatih_id: selectedPelatih,
      tanggal_penilaian: tanggal,
      kedisiplinan: nilaiKedisiplinan,
      kehadiran: nilaiKehadiran,
      kualitas_mengajar: nilaiKualitas,
      komunikasi: nilaiKomunikasi,
      administrasi_laporan: nilaiAdministrasi,
      catatan: catatan.value.trim() || null,
      dinilai_oleh: OWNER_KESIT,
      diinput_oleh: inputBy,
      kategori_pelanggaran: selectedKategori,
      detail_pelanggaran: detailPelanggaran.value.trim() || null,
      jenis_sanksi: selectedSanksi,
      tanggal_mulai_sanksi:
        selectedSanksi === "Tidak Ada" ? null : tanggalMulaiSanksi.value,
      persentase_denda: persenDenda,
      nominal_denda: kondisi.nominalDenda,
      sesi_tanpa_honor: kondisi.sesiTanpaHonor,
      catatan_sanksi: catatanSanksi.value.trim() || null,
      diputuskan_oleh:
        selectedSanksi === "Tidak Ada" ? null : OWNER_KESIT
    };

    const { error } = await window.supabaseClient
      .from("penilaian_pelatih")
      .insert(payload);

    if (error) throw error;

    alert("Penilaian pelatih berhasil disimpan.");
    formPenilaian.reset();
    setTanggalHariIni();
    resetSanksiPreview();
    await loadRiwayat();
  } catch (error) {
    console.error("Gagal menyimpan penilaian:", error);
    alert(`Gagal menyimpan penilaian: ${error.message}`);
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Simpan Penilaian";
  }
}

function applyFilters() {
  if (isPelatih()) {
    filteredRiwayat = [...riwayatPenilaian];
    renderRiwayat();
    return;
  }

  const keyword = searchRiwayat.value.trim().toLowerCase();
  const selectedSanksi = filterSanksi.value;

  filteredRiwayat = riwayatPenilaian.filter((item) => {
    const cocokNama = item.namaPelatih.toLowerCase().includes(keyword);
    const cocokSanksi =
      !selectedSanksi || item.jenisSanksi === selectedSanksi;
    return cocokNama && cocokSanksi;
  });

  renderRiwayat();
}

function renderRiwayat() {
  if (!filteredRiwayat.length) {
    riwayatTableBody.innerHTML = `
      <tr>
        <td colspan="12" class="empty-cell">
          ${isPelatih()
            ? "Belum ada penilaian untuk akun pelatih ini."
            : "Belum ada riwayat penilaian."}
        </td>
      </tr>
    `;
    return;
  }

  riwayatTableBody.innerHTML = filteredRiwayat
    .map((item, index) => {
      const kkmClass =
        item.statusKKM === "Memenuhi KKM" ? "kkm-pass" : "kkm-fail";
      const sanksiClass = getStatusSanksiClass(item.statusSanksi);

      return `
        <tr>
          <td>${index + 1}</td>
          <td>${formatTanggal(item.tanggalPenilaian)}</td>
          <td>${escapeHtml(item.namaPelatih)}</td>
          <td><span class="score-badge">${item.rataRata.toFixed(2)}</span></td>
          <td>${item.kkm.toFixed(2)}</td>
          <td><span class="kkm-badge ${kkmClass}">${escapeHtml(item.statusKKM)}</span></td>
          <td>${escapeHtml(item.kategoriPelanggaran)}</td>
          <td>${escapeHtml(item.jenisSanksi)}</td>
          <td><span class="sanksi-badge ${sanksiClass}">${escapeHtml(item.statusSanksi)}</span></td>
          <td>${item.tanggalBerakhirSanksi ? formatTanggal(item.tanggalBerakhirSanksi) : "-"}</td>
          <td>${escapeHtml(item.diinputOleh)}</td>
          <td>
            <button type="button" class="detail-btn" data-detail-id="${escapeHtml(item.id)}">
              Detail
            </button>
          </td>
        </tr>
      `;
    })
    .join("");

  riwayatTableBody.querySelectorAll("[data-detail-id]").forEach((button) => {
    button.addEventListener("click", () => bukaDetail(button.dataset.detailId));
  });
}

function bukaDetail(id) {
  const item = riwayatPenilaian.find((row) => String(row.id) === String(id));
  if (!item) return;

  el("detailNamaPelatih").textContent = item.namaPelatih;
  el("detailTanggal").textContent = formatTanggal(item.tanggalPenilaian);
  el("detailRataRata").textContent = item.rataRata.toFixed(2);
  el("detailKKM").textContent = item.kkm.toFixed(2);
  el("detailStatusKKM").textContent = item.statusKKM;
  el("detailKategori").textContent = item.kategoriPelanggaran;
  el("detailSanksi").textContent = item.jenisSanksi;
  el("detailStatusSanksi").textContent = item.statusSanksi;
  el("detailBerakhir").textContent = item.tanggalBerakhirSanksi
    ? formatTanggal(item.tanggalBerakhirSanksi)
    : "-";

  el("detailDenda").textContent =
    item.persentaseDenda > 0
      ? `${item.persentaseDenda}% • ${formatRupiah(item.nominalDenda)}`
      : "Tidak Ada";

  el("detailSesiHonor").textContent = `${item.sesiTanpaHonor} sesi`;
  el("detailDiinputOleh").textContent = item.diinputOleh;
  el("detailPelanggaranText").textContent = item.detailPelanggaran;
  el("detailCatatan").textContent = item.catatan;
  el("detailCatatanSanksi").textContent = item.catatanSanksi;

  detailModal.classList.add("show");
}

function tutupModal() {
  detailModal.classList.remove("show");
}

function resetSanksiPreview() {
  persentaseDenda.value = "0%";
  sesiTanpaHonor.value = "0 sesi";
  tanggalBerakhirSanksi.value = "";
  nominalDendaPreview.value =
    "Dihitung otomatis berdasarkan hak SPP pelatih";
}

function getStatusSanksiClass(status) {
  if (status === "Aktif") return "sanksi-active";
  if (status === "Berakhir") return "sanksi-ended";
  if (
    status === "Nonaktif" ||
    status === "Pemutusan Kerja Sama"
  ) {
    return "sanksi-danger";
  }
  return "sanksi-none";
}

function tambahHari(dateString, jumlahHari) {
  const date = parseDateLocal(dateString);
  date.setDate(date.getDate() + jumlahHari);
  return formatTanggalInput(date);
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
  const [year, month, day] = value.split("-").map(Number);
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

function formatRupiah(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}

function showLoading() {
  riwayatTableBody.innerHTML = `
    <tr>
      <td colspan="12" class="loading-cell">Memuat riwayat penilaian...</td>
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
