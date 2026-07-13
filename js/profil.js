// ================= SIMPAN DATA =================
const btnSimpan = document.getElementById("btnSimpan");
const status = document.getElementById("status");
const namaUser = document.getElementById("namaUser");

const user =
JSON.parse(
  sessionStorage.getItem("user") ||
  localStorage.getItem("user") ||
  localStorage.getItem("activeUser")
);

if(!user){
  location.href = "login.html";
  throw new Error("Belum login");
}

btnSimpan.addEventListener("click", async function () {

  const nama = document.getElementById("nama").value.toUpperCase();
  const gmail = document.getElementById("gmail").value;

  const error = validasi();

  if(!nama){

    showToast(
      "Nama wajib diisi"
    );

    return;
  }

  if(!gmail) {

    showToast("Gmail wajib diisi");
    return;

  }

    if(!gmail.includes("@")){
    showToast("Format Gmail tidak valid");
    return;
    }

  if(error){
    showToast(error);
    return;
  }

  btnSimpan.disabled = true;
  btnSimpan.innerText = "Menyimpan...";
  status.innerText = "Proses...";

  const data = {
    mode: "simpanProfil",
    id_user: user.userId,
    nama: nama,
    gmail: gmail
  };

  try {

    const res = await fetch(API, {
      method: "POST",
      body: JSON.stringify(data)
    });

    const r = await res.json();

    btnSimpan.disabled = false;
    btnSimpan.innerText = "Simpan";

    if (!r.ok) {
      status.innerText = r.message || "❌ Gagal menyimpan";
      return;
    }

    sessionStorage.removeItem("profil");


    showToast("Profil berhasil disimpan");

    setTimeout(() => {
      location.replace("dashboard.html");
    }, 1000);
    
  } catch (err) {
    console.log(err);
    btnSimpan.disabled = false;
    btnSimpan.innerText = "Simpan";
    status.innerText = "❌ Gagal menyimpan";
  }

});

// ================= VALIDASI =================
function validasi() {
  if (!document.getElementById("nama").value) return "Nama wajib diisi";
  if (!document.getElementById("gmail").value) return "gmail wajib diisi";
  return null;
}

// ================= RESET FORM =================
function resetForm(){
  document.getElementById("nama").value = "";
  document.getElementById("gmail").value = "";
}

document.addEventListener("DOMContentLoaded", () => {

      setBottomNavActive("user-profil");


  loadTheme();

});
