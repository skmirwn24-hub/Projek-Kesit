function logout() {

  const keluar =
    confirm(
      "Apakah Anda yakin ingin keluar?"
    );

  if (keluar) {

    window.location.href =
      "index.html";

  }

}