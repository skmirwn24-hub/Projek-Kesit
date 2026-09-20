console.log("KESIT Management - Auth Guard Role aktif");

const KESIT_ROLES = {
  OWNER: "Owner",
  ADMIN: "Admin",
  PELATIH: "Pelatih"
};

window.KESIT_AUTH = {
  siap: false,
  user: null,
  profile: null,
  role: null,
  nama: null,
  username: null,
  pelatihId: null
};

const KESIT_PAGE_ACCESS = {
  "dashboard.html": ["Owner", "Admin", "Pelatih"],
  "pendaftaran-siswa.html": ["Owner", "Admin"],
  "rekapan-siswa.html": ["Owner", "Admin", "Pelatih"],
  "pelatih.html": ["Owner", "Admin", "Pelatih"],
  "penilaian-pelatih.html": ["Owner", "Admin", "Pelatih"],
  "rekap-pelatih.html": ["Owner", "Admin", "Pelatih"],
  "riwayat.html": ["Owner", "Admin"]
};

const KESIT_PERMISSIONS = {
  Owner: [
    "siswa:create",
    "siswa:read",
    "siswa:update",
    "siswa:move",
    "pembayaran:read",
    "pembayaran:write",
    "pelatih:read",
    "pelatih:write",
    "penilaian:read",
    "penilaian:write",
    "riwayat:read",
    "akun:manage"
  ],
  Admin: [
    "siswa:create",
    "siswa:read",
    "siswa:update",
    "siswa:move",
    "pembayaran:read",
    "pembayaran:write",
    "pelatih:read",
    "penilaian:read",
    "penilaian:write",
    "riwayat:read"
  ],
  Pelatih: [
    "siswa:read",
    "pelatih:read",
    "penilaian:read"
  ]
};

function kesitCurrentPage() {
  const path = window.location.pathname || "";
  return path.split("/").pop() || "index.html";
}

function kesitIsLoginPage() {
  const page = kesitCurrentPage();
  return page === "" || page === "index.html";
}

function kesitRedirectLogin() {
  if (!kesitIsLoginPage()) {
    window.location.replace("index.html");
  }
}

function kesitRole() {
  return window.KESIT_AUTH?.role || sessionStorage.getItem("kesit_role") || null;
}

function kesitIsOwner() {
  return kesitRole() === KESIT_ROLES.OWNER;
}

function kesitIsAdmin() {
  return kesitRole() === KESIT_ROLES.ADMIN;
}

function kesitIsPelatih() {
  return kesitRole() === KESIT_ROLES.PELATIH;
}

function kesitCan(permission) {
  const role = kesitRole();
  return Boolean(role && (KESIT_PERMISSIONS[role] || []).includes(permission));
}

function kesitRequirePermission(permission) {
  if (!kesitCan(permission)) {
    throw new Error("Akses ditolak untuk role ini.");
  }
  return true;
}

async function kesitAmbilProfil(userId) {
  const { data, error } = await window.supabaseClient
    .from("user_profiles")
    .select("id,username,nama_tampilan,role,status_akun,pelatih_id,aktivasi_selesai")
    .eq("id", userId)
    .single();

  if (error) throw error;
  return data;
}

function kesitSimpanSessionUI(profile) {
  sessionStorage.setItem("kesit_role", profile.role || "");
  sessionStorage.setItem("kesit_username", profile.username || "");
  sessionStorage.setItem("kesit_nama", profile.nama_tampilan || "");
  sessionStorage.setItem("kesit_pelatih_id", profile.pelatih_id || "");
}

function kesitBolehBukaHalaman(page, role) {
  const allowed = KESIT_PAGE_ACCESS[page];
  if (!allowed) return true;
  return allowed.includes(role);
}

function kesitTampilkanIdentitasUser() {
  const nama = window.KESIT_AUTH?.nama || "User KESIT";
  const role = window.KESIT_AUTH?.role || "";

  document.querySelectorAll(".admin-box, .user-box, [data-user-card]").forEach((box) => {
    const strong = box.querySelector("strong");
    const small = box.querySelector("small");
    const avatar = box.querySelector(".admin-avatar, .admin-icon, .user-avatar");

    if (strong) strong.textContent = nama;
    if (small) small.textContent = role;
    if (avatar) avatar.textContent = (nama.trim().charAt(0) || "K").toUpperCase();
  });
}

function kesitTerapkanRoleUI() {
  const role = kesitRole();

  document.querySelectorAll("[data-role-only]").forEach((el) => {
    const roles = String(el.dataset.roleOnly || "")
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
    el.style.display = roles.includes(role) ? "" : "none";
  });

  document.querySelectorAll("[data-hide-for-role]").forEach((el) => {
    const roles = String(el.dataset.hideForRole || "")
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
    el.style.display = roles.includes(role) ? "none" : "";
  });

  document.querySelectorAll("[data-permission]").forEach((el) => {
    el.style.display = kesitCan(el.dataset.permission) ? "" : "none";
  });

  if (role === "Pelatih") {
    document.querySelectorAll('a[href="pendaftaran-siswa.html"], a[href="riwayat.html"]').forEach((el) => {
      el.style.display = "none";
    });

    document.querySelectorAll(".menu, .menu-item, .submenu-item").forEach((el) => {
      const teks = (el.textContent || "").replace(/\s+/g, " ").trim().toLowerCase();
      if (
        teks.includes("paket & pembayaran") ||
        teks === "pengaturan" ||
        teks === "riwayat"
      ) {
        el.style.display = "none";
      }
    });
  }
}

async function cekLoginAdmin() {
  if (!window.supabaseClient) {
    console.error("Supabase client belum tersedia.");
    return null;
  }

  try {
    const { data, error } = await window.supabaseClient.auth.getSession();
    if (error) throw error;

    const session = data?.session;
    if (!session?.user) {
      kesitRedirectLogin();
      return null;
    }

    const profile = await kesitAmbilProfil(session.user.id);

    if (
      !profile ||
      profile.status_akun !== "Aktif" ||
      profile.aktivasi_selesai !== true ||
      !Object.values(KESIT_ROLES).includes(profile.role)
    ) {
      await window.supabaseClient.auth.signOut();
      sessionStorage.clear();
      kesitRedirectLogin();
      return null;
    }

    window.KESIT_AUTH = {
      siap: true,
      user: session.user,
      profile,
      role: profile.role,
      nama: profile.nama_tampilan,
      username: profile.username,
      pelatihId: profile.pelatih_id
    };

    kesitSimpanSessionUI(profile);

    const page = kesitCurrentPage();
    if (!kesitBolehBukaHalaman(page, profile.role)) {
      window.location.replace("dashboard.html");
      return null;
    }

    kesitTampilkanIdentitasUser();
    kesitTerapkanRoleUI();

    window.dispatchEvent(new CustomEvent("kesit-auth-ready", {
      detail: window.KESIT_AUTH
    }));

    console.log("KESIT AUTH OK:", {
      email: session.user.email,
      username: profile.username,
      nama: profile.nama_tampilan,
      role: profile.role,
      status: profile.status_akun
    });

    return window.KESIT_AUTH;
  } catch (error) {
    console.error("KESIT Auth Guard gagal:", error);
    if (!kesitIsLoginPage()) {
      alert("Sesi atau profil akun tidak dapat diverifikasi.");
      kesitRedirectLogin();
    }
    return null;
  }
}

async function logout() {
  try {
    await window.supabaseClient.auth.signOut();
  } finally {
    sessionStorage.removeItem("kesit_role");
    sessionStorage.removeItem("kesit_username");
    sessionStorage.removeItem("kesit_nama");
    sessionStorage.removeItem("kesit_pelatih_id");
    window.location.replace("index.html");
  }
}

window.KESIT_ROLES = KESIT_ROLES;
window.kesitRole = kesitRole;
window.kesitIsOwner = kesitIsOwner;
window.kesitIsAdmin = kesitIsAdmin;
window.kesitIsPelatih = kesitIsPelatih;
window.kesitCan = kesitCan;
window.kesitRequirePermission = kesitRequirePermission;
window.kesitTerapkanRoleUI = kesitTerapkanRoleUI;
window.cekLoginAdmin = cekLoginAdmin;
window.logout = logout;

if (!kesitIsLoginPage()) {
  window.KESIT_AUTH_READY = cekLoginAdmin();
}
