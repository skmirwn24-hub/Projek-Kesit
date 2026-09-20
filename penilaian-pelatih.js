const OWNER_KESIT = "Sukma Irawan & Ari Setiawan";
const KKM_PELATIH = 4.0;

let daftarPelatih = [];
let riwayatPenilaian = [];
let filteredRiwayat = [];
let adminLogin = "-";

const formPenilaian = document.getElementById("formPenilaian");

const pelatihId = document.getElementById("pelatihId");
const tanggalPenilaian = document.getElementById("tanggalPenilaian");

const kedisiplinan = document.getElementById("kedisiplinan");
const kehadiran = document.getElementById("kehadiran");
const kualitasMengajar = document.getElementById("kualitasMengajar");
const komunikasi = document.getElementById("komunikasi");
const administrasiLaporan = document.getElementById("administrasiLaporan");
const catatan = document.getElementById("catatan");

const kategoriPelanggaran =
  document.getElementById("kategoriPelanggaran");

const jenisSanksi =
  document.getElementById("jenisSanksi");

const detailPelanggaran =
  document.getElementById("detailPelanggaran");

const tanggalMulaiSanksi =
  document.getElementById("tanggalMulaiSanksi");

const tanggalBerakhirSanksi =
  document.getElementById("tanggalBerakhirSanksi");

const persentaseDenda =
  document.getElementById("persentaseDenda");

const sesiTanpaHonor =
  document.getElementById("sesiTanpaHonor");

const nominalDendaPreview =
  document.getElementById("nominalDendaPreview");

const catatanSanksi =
  document.getElementById("catatanSanksi");

const adminInputInfo =
  document.getElementById("adminInputInfo");

const statTotalPelatih =
  document.getElementById("statTotalPelatih");

const statMemenuhiKKM =
  document.getElementById("statMemenuhiKKM");

const statBelumKKM =
  document.getElementById("statBelumKKM");

const statSanksiAktif =
  document.getElementById("statSanksiAktif");

const searchRiwayat =
  document.getElementById("searchRiwayat");

const filterSanksi =
  document.getElementById("filterSanksi");

const riwayatTableBody =
  document.getElementById("riwayatTableBody");

const detailModal =
  document.getElementById("detailModal");

const closeModalBtn =
  document.getElementById("closeModalBtn");

const closeModalFooterBtn =
  document.getElementById("closeModalFooterBtn");

const detailNamaPelatih =
  document.getElementById("detailNamaPelatih");

const detailTanggal =
  document.getElementById("detailTanggal");

const detailRataRata =
  document.getElementById("detailRataRata");

const detailKKM =
  document.getElementById("detailKKM");

const detailStatusKKM =
  document.getElementById("detailStatusKKM");

const detailKategori =
  document.getElementById("detailKategori");

const detailSanksi =
  document.getElementById("detailSanksi");

const detailStatusSanksi =
  document.getElementById("detailStatusSanksi");

const detailBerakhir =
  document.getElementById("detailBerakhir");

const detailDenda =
  document.getElementById("detailDenda");

const detailSesiHonor =
  document.getElementById("detailSesiHonor");

const detailDiinputOleh =
  document.getElementById("detailDiinputOleh");

const detailPelanggaranText =
  document.getElementById("detailPelanggaranText");

const detailCatatan =
  document.getElementById("detailCatatan");

const detailCatatanSanksi =
  document.getElementById("detailCatatanSanksi");


document.addEventListener("DOMContentLoaded", async () => {
  setTanggalHariIni();

  await loadAdminLogin();
  await loadPelatih();
  await loadRiwayat();

  formPenilaian.addEventListener(
    "submit",
    simpanPenilaian
  );

  pelatihId.addEventListener(
    "change",
    updateSanksiPreview
  );

  jenisSanksi.addEventListener(
    "change",
    updateSanksiPreview
  );

  tanggalMulaiSanksi.addEventListener(
    "change",
    updateSanksiPreview
  );

  searchRiwayat.addEventListener(
    "input",
    applyFilters
  );

  filterSanksi.addEventListener(
    "change",
    applyFilters
  );

  formPenilaian.addEventListener("reset", () => {
    setTimeout(() => {
      setTanggalHariIni();
      resetSanksiPreview();
    }, 0);
  });

  closeModalBtn.addEventListener(
    "click",
    tutupModal
  );

  closeModalFooterBtn.addEventListener(
    "click",
    tutupModal
  );

  detailModal.addEventListener(
    "click",
    (event) => {
      if (event.target === detailModal) {
        tutupModal();
      }
    }
  );
});


async function loadAdminLogin() {
  try {
    const {
      data: { user }
    } = await window.supabaseClient.auth.getUser();

    if (user) {
      adminLogin =
        user.email ||
        user.user_metadata?.name ||
        user.id;
    }

    adminInputInfo.textContent =
      adminLogin || "-";
  } catch (error) {
    console.error(
      "Gagal membaca akun admin:",
      error
    );

    adminInputInfo.textContent = "-";
  }
}


function setTanggalHariIni() {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(
    today.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    today.getDate()
  ).padStart(2, "0");

  const value =
    `${year}-${month}-${day}`;

  tanggalPenilaian.value = value;

  if (!tanggalMulaiSanksi.value) {
    tanggalMulaiSanksi.value = value;
  }
}


async function loadPelatih() {
  try {
    const { data, error } =
      await window.supabaseClient
        .from("pelatih")
        .select("id, nama, status")
        .order("nama", {
          ascending: true
        });

    if (error) {
      throw error;
    }

    daftarPelatih = (data || []).filter(
      (item) => {
        const nama =
          String(item.nama || "").trim();

        const status =
          String(item.status || "")
            .trim()
            .toLowerCase();

        const bukanOwner =
          nama !== OWNER_KESIT;

        const aktif =
          status !== "tidak aktif" &&
          status !== "non aktif" &&
          status !== "nonaktif";

        return bukanOwner && aktif;
      }
    );

    pelatihId.innerHTML = `
      <option value="">
        Pilih pelatih...
      </option>

      ${daftarPelatih
        .map(
          (item) => `
            <option value="${item.id}">
              ${escapeHtml(item.nama)}
            </option>
          `
        )
        .join("")}
    `;
  } catch (error) {
    console.error(
      "Gagal memuat data pelatih:",
      error
    );

    alert(
      "Gagal memuat data pelatih."
    );
  }
}


async function loadRiwayat() {
  try {
    showLoading();

    const { data, error } =
      await window.supabaseClient
        .from("v_penilaian_pelatih")
        .select("*")
        .neq(
          "nama_pelatih",
          OWNER_KESIT
        )
        .order(
          "tanggal_penilaian",
          { ascending: false }
        )
        .order(
          "created_at",
          { ascending: false }
        );

    if (error) {
      throw error;
    }

    riwayatPenilaian =
      (data || []).map((item) => ({
        id: item.id,

        pelatihId:
          item.pelatih_id,

        namaPelatih:
          item.nama_pelatih || "-",

        tanggalPenilaian:
          item.tanggal_penilaian,

        rataRata:
          Number(
            item.nilai_rata_rata || 0
          ),

        kkm:
          Number(
            item.kkm ||
            KKM_PELATIH
          ),

        statusKKM:
          item.status_kkm || "-",

        kategoriPelanggaran:
          item.kategori_pelanggaran ||
          "Tidak Ada",

        detailPelanggaran:
          item.detail_pelanggaran ||
          "-",

        jenisSanksi:
          item.jenis_sanksi ||
          "Tidak Ada",

        tanggalMulaiSanksi:
          item.tanggal_mulai_sanksi,

        tanggalBerakhirSanksi:
          item.tanggal_berakhir_sanksi,

        statusSanksi:
          item.status_sanksi ||
          "Tidak Ada",

        persentaseDenda:
          Number(
            item.persentase_denda || 0
          ),

        nominalDenda:
          Number(
            item.nominal_denda || 0
          ),

        sesiTanpaHonor:
          Number(
            item.sesi_tanpa_honor || 0
          ),

        catatan:
          item.catatan || "-",

        catatanSanksi:
          item.catatan_sanksi ||
          "-",

        diinputOleh:
          item.diinput_oleh || "-"
      }));

    filteredRiwayat =
      [...riwayatPenilaian];

    updateStats();
    renderRiwayat();
  } catch (error) {
    console.error(
      "Gagal memuat riwayat:",
      error
    );

    riwayatTableBody.innerHTML = `
      <tr>
        <td
          colspan="12"
          class="empty-cell"
        >
          Gagal memuat riwayat penilaian.
        </td>
      </tr>
    `;
  }
}


function updateStats() {
  const latestPerPelatih =
    new Map();

  riwayatPenilaian.forEach(
    (item) => {
      if (
        !latestPerPelatih.has(
          item.pelatihId
        )
      ) {
        latestPerPelatih.set(
          item.pelatihId,
          item
        );
      }
    }
  );

  const latestList =
    [...latestPerPelatih.values()];

  const memenuhi =
    latestList.filter(
      (item) =>
        item.statusKKM ===
        "Memenuhi KKM"
    ).length;

  const belum =
    latestList.filter(
      (item) =>
        item.statusKKM ===
        "Belum Memenuhi KKM"
    ).length;

  const sanksiAktif =
    latestList.filter((item) => {
      return (
        item.statusSanksi ===
          "Aktif" ||
        item.statusSanksi ===
          "Nonaktif" ||
        item.statusSanksi ===
          "Pemutusan Kerja Sama"
      );
    }).length;

  statTotalPelatih.textContent =
    latestList.length;

  statMemenuhiKKM.textContent =
    memenuhi;

  statBelumKKM.textContent =
    belum;

  statSanksiAktif.textContent =
    sanksiAktif;
}


async function updateSanksiPreview() {
  const selectedPelatihId =
    pelatihId.value;

  const sanksi =
    jenisSanksi.value;

  const mulai =
    tanggalMulaiSanksi.value;

  let persenDenda = 0;
  let sesi = 0;
  let berakhir = "";
  let nominal = 0;

  if (sanksi === "Teguran") {
    persenDenda = 0;

    if (mulai) {
      berakhir =
        tambahHari(mulai, 30);
    }
  }

  if (sanksi === "SP-1") {
    persenDenda = 20;

    if (mulai) {
      berakhir =
        tambahBulan(mulai, 3);
    }
  }

  if (sanksi === "SP-2") {
    persenDenda = 50;

    if (mulai) {
      berakhir =
        tambahBulan(mulai, 6);
    }
  }

  if (sanksi === "SP-3") {
    persenDenda = 100;
    berakhir =
      "Tidak ada tanggal berakhir";
  }

  if (
    sanksi ===
    "Pemutusan Kerja Sama"
  ) {
    persenDenda = 100;
    berakhir = "Permanen";
  }

  if (
    sanksi === "Tidak Ada"
  ) {
    persenDenda = 0;
    sesi = 0;
    berakhir = "";
    nominal = 0;
  }

  if (
    selectedPelatihId &&
    sanksi !== "Tidak Ada"
  ) {
    const kondisi =
      await hitungKondisiPelatih(
        selectedPelatihId,
        persenDenda,
        sanksi
      );

    nominal = kondisi.nominalDenda;
    sesi = kondisi.sesiTanpaHonor;
  }

  persentaseDenda.value =
    `${persenDenda}%`;

  sesiTanpaHonor.value =
    `${sesi} sesi`;

  tanggalBerakhirSanksi.value =
    berakhir;

  if (
    persenDenda === 0
  ) {
    nominalDendaPreview.value =
      "Tidak ada denda";
  } else if (
    nominal > 0
  ) {
    nominalDendaPreview.value =
      formatRupiah(nominal);
  } else if (
    sesi > 0
  ) {
    nominalDendaPreview.value =
      `Tidak ada denda uang • ${sesi} sesi tanpa honor`;
  } else {
    nominalDendaPreview.value =
      "Belum ada dasar perhitungan SPP";
  }
}


async function hitungKondisiPelatih(
  selectedPelatihId,
  persenDenda,
  sanksi
) {
  let nominalDenda = 0;
  let sesi = 0;

  try {
    const { data: siswaData, error } =
      await window.supabaseClient
        .from("v_rekapan_siswa")
        .select(`
          id,
          pelatih_pemilik,
          total_tagihan
        `)
        .eq(
          "pelatih_pemilik_id",
          selectedPelatihId
        );

    if (error) {
      console.warn(
        "Fallback hitung siswa pelatih:",
        error
      );
    }

    const siswaMilik =
      siswaData || [];

    if (siswaMilik.length > 0) {
      const totalHakDasar =
        siswaMilik.reduce(
          (total, siswa) =>
            total +
            Number(
              siswa.total_tagihan || 0
            ),
          0
        );

      nominalDenda =
        Math.round(
          totalHakDasar *
          (persenDenda / 100)
        );

      sesi = 0;
    } else {
      nominalDenda = 0;

      if (sanksi === "SP-1") {
        sesi = 5;
      }

      if (sanksi === "SP-2") {
        sesi = 10;
      }

      if (
        sanksi === "SP-3" ||
        sanksi ===
          "Pemutusan Kerja Sama"
      ) {
        sesi = 0;
      }
    }
  } catch (error) {
    console.error(
      "Gagal menghitung kondisi pelatih:",
      error
    );

    if (sanksi === "SP-1") {
      sesi = 5;
    }

    if (sanksi === "SP-2") {
      sesi = 10;
    }
  }

  return {
    nominalDenda,
    sesiTanpaHonor: sesi
  };
}


async function simpanPenilaian(
  event
) {
  event.preventDefault();

  const selectedPelatih =
    pelatihId.value;

  const tanggal =
    tanggalPenilaian.value;

  const nilaiKedisiplinan =
    Number(kedisiplinan.value);

  const nilaiKehadiran =
    Number(kehadiran.value);

  const nilaiKualitas =
    Number(kualitasMengajar.value);

  const nilaiKomunikasi =
    Number(komunikasi.value);

  const nilaiAdministrasi =
    Number(
      administrasiLaporan.value
    );

  if (
    !selectedPelatih ||
    !tanggal ||
    !nilaiKedisiplinan ||
    !nilaiKehadiran ||
    !nilaiKualitas ||
    !nilaiKomunikasi ||
    !nilaiAdministrasi
  ) {
    alert(
      "Lengkapi seluruh bagian penilaian."
    );

    return;
  }

  const selectedKategori =
    kategoriPelanggaran.value;

  const selectedSanksi =
    jenisSanksi.value;

  if (
    selectedKategori !==
      "Tidak Ada" &&
    !detailPelanggaran.value.trim()
  ) {
    alert(
      "Detail pelanggaran wajib diisi."
    );

    return;
  }

  if (
    selectedSanksi !==
      "Tidak Ada" &&
    !tanggalMulaiSanksi.value
  ) {
    alert(
      "Tanggal mulai sanksi wajib diisi."
    );

    return;
  }

  const persenDenda =
    Number(
      persentaseDenda.value
        .replace("%", "")
    ) || 0;

  const kondisi =
    await hitungKondisiPelatih(
      selectedPelatih,
      persenDenda,
      selectedSanksi
    );

  const submitButton =
    formPenilaian.querySelector(
      'button[type="submit"]'
    );

  submitButton.disabled = true;

  submitButton.textContent =
    "Menyimpan...";

  try {
    const payload = {
      pelatih_id:
        selectedPelatih,

      tanggal_penilaian:
        tanggal,

      kedisiplinan:
        nilaiKedisiplinan,

      kehadiran:
        nilaiKehadiran,

      kualitas_mengajar:
        nilaiKualitas,

      komunikasi:
        nilaiKomunikasi,

      administrasi_laporan:
        nilaiAdministrasi,

      catatan:
        catatan.value.trim() ||
        null,

      dinilai_oleh:
        OWNER_KESIT,

      diinput_oleh:
        adminLogin,

      kategori_pelanggaran:
        selectedKategori,

      detail_pelanggaran:
        detailPelanggaran.value
          .trim() || null,

      jenis_sanksi:
        selectedSanksi,

      tanggal_mulai_sanksi:
        selectedSanksi ===
        "Tidak Ada"
          ? null
          : tanggalMulaiSanksi.value,

      persentase_denda:
        persenDenda,

      nominal_denda:
        kondisi.nominalDenda,

      sesi_tanpa_honor:
        kondisi.sesiTanpaHonor,

      catatan_sanksi:
        catatanSanksi.value
          .trim() || null,

      diputuskan_oleh:
        selectedSanksi ===
        "Tidak Ada"
          ? null
          : OWNER_KESIT
    };

    const { error } =
      await window.supabaseClient
        .from(
          "penilaian_pelatih"
        )
        .insert(payload);

    if (error) {
      throw error;
    }

    alert(
      "Penilaian pelatih berhasil disimpan."
    );

    formPenilaian.reset();

    setTanggalHariIni();
    resetSanksiPreview();

    await loadRiwayat();
  } catch (error) {
    console.error(
      "Gagal menyimpan penilaian:",
      error
    );

    alert(
      `Gagal menyimpan penilaian: ${error.message}`
    );
  } finally {
    submitButton.disabled = false;

    submitButton.textContent =
      "Simpan Penilaian";
  }
}


function applyFilters() {
  const keyword =
    searchRiwayat.value
      .trim()
      .toLowerCase();

  const selectedSanksi =
    filterSanksi.value;

  filteredRiwayat =
    riwayatPenilaian.filter(
      (item) => {
        const cocokNama =
          item.namaPelatih
            .toLowerCase()
            .includes(keyword);

        const cocokSanksi =
          !selectedSanksi ||
          item.jenisSanksi ===
            selectedSanksi;

        return (
          cocokNama &&
          cocokSanksi
        );
      }
    );

  renderRiwayat();
}


function renderRiwayat() {
  if (!filteredRiwayat.length) {
    riwayatTableBody.innerHTML = `
      <tr>
        <td
          colspan="12"
          class="empty-cell"
        >
          Belum ada riwayat penilaian.
        </td>
      </tr>
    `;

    return;
  }

  riwayatTableBody.innerHTML =
    filteredRiwayat
      .map(
        (item, index) => {
          const kkmClass =
            item.statusKKM ===
            "Memenuhi KKM"
              ? "kkm-pass"
              : "kkm-fail";

          const sanksiClass =
            getStatusSanksiClass(
              item.statusSanksi
            );

          return `
            <tr>

              <td>
                ${index + 1}
              </td>

              <td>
                ${formatTanggal(
                  item.tanggalPenilaian
                )}
              </td>

              <td>
                ${escapeHtml(
                  item.namaPelatih
                )}
              </td>

              <td>
                <span
                  class="score-badge"
                >
                  ${item.rataRata.toFixed(2)}
                </span>
              </td>

              <td>
                ${item.kkm.toFixed(2)}
              </td>

              <td>
                <span
                  class="kkm-badge ${kkmClass}"
                >
                  ${escapeHtml(
                    item.statusKKM
                  )}
                </span>
              </td>

              <td>
                ${escapeHtml(
                  item.kategoriPelanggaran
                )}
              </td>

              <td>
                ${escapeHtml(
                  item.jenisSanksi
                )}
              </td>

              <td>
                <span
                  class="sanksi-badge ${sanksiClass}"
                >
                  ${escapeHtml(
                    item.statusSanksi
                  )}
                </span>
              </td>

              <td>
                ${
                  item.tanggalBerakhirSanksi
                    ? formatTanggal(
                        item.tanggalBerakhirSanksi
                      )
                    : "-"
                }
              </td>

              <td>
                ${escapeHtml(
                  item.diinputOleh
                )}
              </td>

              <td>
                <button
                  type="button"
                  class="detail-btn"
                  onclick="bukaDetail('${item.id}')"
                >
                  Detail
                </button>
              </td>

            </tr>
          `;
        }
      )
      .join("");
}


function bukaDetail(id) {
  const item =
    riwayatPenilaian.find(
      (row) => row.id === id
    );

  if (!item) {
    return;
  }

  detailNamaPelatih.textContent =
    item.namaPelatih;

  detailTanggal.textContent =
    formatTanggal(
      item.tanggalPenilaian
    );

  detailRataRata.textContent =
    item.rataRata.toFixed(2);

  detailKKM.textContent =
    item.kkm.toFixed(2);

  detailStatusKKM.textContent =
    item.statusKKM;

  detailKategori.textContent =
    item.kategoriPelanggaran;

  detailSanksi.textContent =
    item.jenisSanksi;

  detailStatusSanksi.textContent =
    item.statusSanksi;

  detailBerakhir.textContent =
    item.tanggalBerakhirSanksi
      ? formatTanggal(
          item.tanggalBerakhirSanksi
        )
      : "-";

  if (
    item.persentaseDenda > 0
  ) {
    detailDenda.textContent =
      `${item.persentaseDenda}% • ${formatRupiah(
        item.nominalDenda
      )}`;
  } else {
    detailDenda.textContent =
      "Tidak Ada";
  }

  detailSesiHonor.textContent =
    `${item.sesiTanpaHonor} sesi`;

  detailDiinputOleh.textContent =
    item.diinputOleh;

  detailPelanggaranText.textContent =
    item.detailPelanggaran;

  detailCatatan.textContent =
    item.catatan;

  detailCatatanSanksi.textContent =
    item.catatanSanksi;

  detailModal.classList.add(
    "show"
  );
}


function tutupModal() {
  detailModal.classList.remove(
    "show"
  );
}


function resetSanksiPreview() {
  persentaseDenda.value =
    "0%";

  sesiTanpaHonor.value =
    "0 sesi";

  tanggalBerakhirSanksi.value =
    "";

  nominalDendaPreview.value =
    "Dihitung otomatis berdasarkan hak SPP pelatih";
}


function getStatusSanksiClass(
  status
) {
  if (status === "Aktif") {
    return "sanksi-active";
  }

  if (status === "Berakhir") {
    return "sanksi-ended";
  }

  if (
    status === "Nonaktif" ||
    status ===
      "Pemutusan Kerja Sama"
  ) {
    return "sanksi-danger";
  }

  return "sanksi-none";
}


function tambahHari(
  dateString,
  jumlahHari
) {
  const date =
    parseDateLocal(dateString);

  date.setDate(
    date.getDate() +
    jumlahHari
  );

  return formatTanggalInput(date);
}


function tambahBulan(
  dateString,
  jumlahBulan
) {
  const sourceDate =
    parseDateLocal(dateString);

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


function parseDateLocal(value) {
  const [
    year,
    month,
    day
  ] = value
    .split("-")
    .map(Number);

  return new Date(
    year,
    month - 1,
    day
  );
}


function formatTanggalInput(date) {
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


function formatTanggal(value) {
  if (!value) {
    return "-";
  }

  const parts =
    String(value).split("-");

  if (parts.length !== 3) {
    return value;
  }

  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}


function formatRupiah(value) {
  return new Intl.NumberFormat(
    "id-ID",
    {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }
  ).format(
    Number(value || 0)
  );
}


function showLoading() {
  riwayatTableBody.innerHTML = `
    <tr>
      <td
        colspan="12"
        class="loading-cell"
      >
        Memuat riwayat penilaian...
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
    .replaceAll(
      "'",
      "&#039;"
    );
}


window.bukaDetail =
  bukaDetail;