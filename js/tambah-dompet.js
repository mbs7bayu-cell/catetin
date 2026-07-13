
function simpan() {

  const btn = document.getElementById("btnSimpan");

  const user = JSON.parse(
    sessionStorage.getItem("user") ||
    localStorage.getItem("user") ||
    localStorage.getItem("activeUser")
  );

  const data = {
    mode: "create_dompet",
    id_user: user.userId,
    nama: document.getElementById("nama").value,
    tipe: document.getElementById("tipe").value
  };

  // 🔥 tampilkan loading
  btn.disabled = true;
  btn.innerText = "Menyimpan...";

  fetch(API, {
    method: "POST",
    body: JSON.stringify(data)
  })
  .then(res => res.json())
  .then(res => {

    if(res.ok){

      localStorage.removeItem("dompetCache");
      sessionStorage.removeItem("dompet");
      sessionStorage.removeItem("laporan");
      localStorage.removeItem("dashboard");
      
      btn.innerText = "Berhasil ✔";
      
      setTimeout(() => {
        window.location.href = "dompet.html";
      }, 800);

    } else {
      showToast("Gagal: " + res.msg);
      btn.disabled = false;
      btn.innerText = "Simpan";
    }

  })
  .catch(() => {
    showToast("Error server");
    btn.disabled = false;
    btn.innerText = "Simpan";
  });
}

document.addEventListener("DOMContentLoaded", () => {

      setBottomNavActive("dompet");


  loadTheme();


});