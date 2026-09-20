console.log(
  "KESIT Management - Login Email / Username aktif"
);


/* =========================================================
   ELEMENT
========================================================= */

const loginForm =
  document.getElementById("loginForm");

const identifierInput =
  document.getElementById("email");

const passwordInput =
  document.getElementById("password");

const pesanLogin =
  document.getElementById("pesanLogin");


/* =========================================================
   UBAH FIELD EMAIL MENJADI EMAIL / USERNAME
========================================================= */

if (identifierInput) {

  identifierInput.type = "text";

  identifierInput.placeholder =
    "Email atau username";

  identifierInput.setAttribute(
    "autocomplete",
    "username"
  );

}


/* =========================================================
   PESAN LOGIN
========================================================= */

function tampilkanPesan(
  pesan,
  tipe = "error"
) {

  if (!pesanLogin) {
    return;
  }

  pesanLogin.textContent =
    pesan || "";

  pesanLogin.className =
    "login-message";

  if (tipe === "success") {

    pesanLogin.classList.add(
      "success"
    );

  }

  else if (tipe === "error") {

    pesanLogin.classList.add(
      "error"
    );

  }

}


/* =========================================================
   CEK APAKAH IDENTIFIER EMAIL
========================================================= */

function adalahEmail(value) {

  return value.includes("@");

}


/* =========================================================
   CARI EMAIL DARI USERNAME
========================================================= */

async function cariEmailDariUsername(
  username
) {

  const {
    data,
    error
  } = await supabaseClient.rpc(
    "kesit_email_dari_username",
    {
      p_username: username
    }
  );


  if (error) {

    console.error(
      "Gagal mencari username:",
      error
    );

    throw new Error(
      "Tidak dapat memeriksa username."
    );

  }


  return data || null;

}


/* =========================================================
   AMBIL PROFIL USER
========================================================= */

async function ambilProfilUser(
  userId
) {

  const {
    data,
    error
  } = await supabaseClient
    .from("user_profiles")
    .select(`
      id,
      username,
      nama_tampilan,
      role,
      status_akun,
      pelatih_id,
      aktivasi_selesai
    `)
    .eq(
      "id",
      userId
    )
    .maybeSingle();


  if (error) {

    console.error(
      "Gagal mengambil profil user:",
      error
    );

    throw new Error(
      "Profil akun tidak dapat diperiksa."
    );

  }


  return data;

}


/* =========================================================
   LOGOUT JIKA AKUN TIDAK VALID
========================================================= */

async function batalkanLogin(
  pesan
) {

  await supabaseClient.auth.signOut();

  tampilkanPesan(
    pesan,
    "error"
  );

}


/* =========================================================
   PROSES LOGIN
========================================================= */

loginForm.addEventListener(
  "submit",

  async function (event) {

    event.preventDefault();


    tampilkanPesan("");


    const identifier =
      identifierInput.value
        .trim();

    const password =
      passwordInput.value;


    if (
      !identifier ||
      !password
    ) {

      tampilkanPesan(
        "Email/username dan password wajib diisi."
      );

      return;

    }


    try {

      /* -----------------------------------------
         TENTUKAN EMAIL LOGIN
      ----------------------------------------- */

      let emailLogin = identifier;


      if (
        !adalahEmail(
          identifier
        )
      ) {

        emailLogin =
          await cariEmailDariUsername(
            identifier
          );


        if (!emailLogin) {

          tampilkanPesan(
            "Username atau password tidak sesuai."
          );

          return;

        }

      }


      /* -----------------------------------------
         LOGIN SUPABASE AUTH
      ----------------------------------------- */

      const {
        data,
        error
      } =
        await supabaseClient
          .auth
          .signInWithPassword({

            email:
              emailLogin,

            password:
              password

          });


      if (error) {

        console.error(
          "Login gagal:",
          error
        );

        tampilkanPesan(
          "Email/username atau password tidak sesuai."
        );

        return;

      }


      const user =
        data?.user;


      if (!user) {

        tampilkanPesan(
          "Login gagal. Data pengguna tidak ditemukan."
        );

        return;

      }


      /* -----------------------------------------
         AMBIL PROFIL & ROLE
      ----------------------------------------- */

      const profil =
        await ambilProfilUser(
          user.id
        );


      if (!profil) {

        await batalkanLogin(
          "Akun belum terdaftar sebagai pengguna KESIT Management."
        );

        return;

      }


      /* -----------------------------------------
         CEK STATUS AKUN
      ----------------------------------------- */

      if (
        profil.status_akun !==
        "Aktif"
      ) {

        await batalkanLogin(
          "Akun sedang tidak aktif. Hubungi Owner/Admin KESIT."
        );

        return;

      }


      /* -----------------------------------------
         CEK AKTIVASI
      ----------------------------------------- */

      if (
        profil.aktivasi_selesai !==
        true
      ) {

        await batalkanLogin(
          "Aktivasi akun belum selesai."
        );

        return;

      }


      /* -----------------------------------------
         SIMPAN INFORMASI SESI UI
      ----------------------------------------- */

      sessionStorage.setItem(
        "kesit_role",
        profil.role || ""
      );

      sessionStorage.setItem(
        "kesit_username",
        profil.username || ""
      );

      sessionStorage.setItem(
        "kesit_nama",
        profil.nama_tampilan || ""
      );

      sessionStorage.setItem(
        "kesit_pelatih_id",
        profil.pelatih_id || ""
      );


      console.log(
        "LOGIN KESIT BERHASIL",
        {
          username:
            profil.username,

          role:
            profil.role,

          nama:
            profil.nama_tampilan
        }
      );


      tampilkanPesan(
        "Login berhasil. Membuka KESIT Management...",
        "success"
      );


      /* -----------------------------------------
         REDIRECT
      ----------------------------------------- */

      setTimeout(
        function () {

          window.location.href =
            "dashboard.html";

        },
        350
      );

    }

    catch (error) {

      console.error(
        "ERROR LOGIN:",
        error
      );


      tampilkanPesan(
        error?.message ||
        "Terjadi kesalahan saat login."
      );

    }

  }
);