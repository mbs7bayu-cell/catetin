
async function simpan() {

  const btn = document.getElementById("btnSimpan");

  const user = JSON.parse(
    sessionStorage.getItem("user") ||
    localStorage.getItem("user") ||
    localStorage.getItem("activeUser")
  );

  btn.disabled = true;
  btn.innerText = "Menyimpan...";

  const hasil = await tambahDompet({
    id_user: user.userId,
    nama: document.getElementById("nama").value.trim(),
    tipe: document.getElementById("tipe").value
  });

  if (hasil.ok) {

    localStorage.removeItem("dompetCache");
    sessionStorage.removeItem("dompet");
    sessionStorage.removeItem("laporan");
    localStorage.removeItem("dashboard");

    btn.innerText = "Berhasil ✔";

    setTimeout(() => {
      window.location.href = "dompet.html";
    }, 800);

  } else {

    showToast(hasil.error);
    btn.disabled = false;
    btn.innerText = "Simpan";

  }
}

document.addEventListener("DOMContentLoaded", () => {

      setBottomNavActive("dompet");


  loadTheme();


});