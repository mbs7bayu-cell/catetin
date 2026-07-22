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

document.getElementById("userInfo")
.innerText ="Login : " + user.noHp;

function formatRupiah(angka){

  return Number(angka)
    .toLocaleString("id-ID");
}

function tambahPemasukan(){
  window.location.href = "pemasukan.html";
}

function tambahPengeluaran(){
  window.location.href = "pengeluaran.html";
}

function lihatDompet(){
  window.location.href = "dompet.html";
}

function lihatLaporan(){
  window.location.href = "laporan.html";
}

function lihatDashboard(){
  window.location.href = "dashboard.html";
}

function transfer(){
  window.location.href = "transfer.html";
}

function kredit(){
  window.location.href = "kredit.html";
}

function importTransaksi(){
    location.href = "import.html";
}

function scanStruk(){
    location.href = "scanReceipt.html";
}

// ================ sembunyikan saldo ========================
  let saldoDisembunyikan =
  localStorage.getItem("hideSaldo") === "true";

  let dashboardData = null;

  // ================== toggle saldo ==========================

  function toggleSaldo(){

  saldoDisembunyikan =
    !saldoDisembunyikan;

  localStorage.setItem(
    "hideSaldo",
    saldoDisembunyikan
  );

  document.getElementById(
    "btnToggleSaldo"
  ).textContent =
  saldoDisembunyikan
    ? "🙈"
    : "👁";

  if(dashboardData){
    renderDashboard(dashboardData);
  }

}

function syncToggleSaldo() {

  saldoDisembunyikan =
    localStorage.getItem("hideSaldo") === "true";

  const btn =
    document.getElementById("btnToggleSaldo");

  if(btn){
    btn.textContent =
      saldoDisembunyikan
        ? "🙈"
        : "👁";
  }

}



// ================== parse tanggal ===============
function parseTanggal(trx){

  // Data Supabase
  if(trx.tanggal){
    return new Date(trx.tanggal);
  }

  // Data lama Apps Script (timestamp)
  if(trx.timestamp){
    return new Date(Number(trx.timestamp));
  }

  return new Date();
}

// ================ always login =====================

const rememberLogin =
  document.getElementById("rememberLogin");

if(rememberLogin){

  rememberLogin.checked =
    localStorage.getItem("rememberLogin") === "true";

  rememberLogin.addEventListener("change", () => {

    localStorage.setItem(
      "rememberLogin",
      rememberLogin.checked
    );

    const user = JSON.parse(
      sessionStorage.getItem("user") ||
      localStorage.getItem("user") ||
      localStorage.getItem("activeUser")
    );

    if(
      user &&
      rememberLogin.checked
    ){
      localStorage.setItem(
        "user",
        JSON.stringify(user)
      );
    }

    showToast(
      rememberLogin.checked
        ? "Tetap login aktif"
        : "Tetap login nonaktif"
    );

  });

}

// ================= LOAD DASHBOARD =================

// ================== render dashboard =================

function renderDashboard(hasil){

saldoDisembunyikan =
    localStorage.getItem("hideSaldo") === "true";

    hideSkeleton();


  dashboardData = hasil;

  // saldo
  document.getElementById("saldo").innerText =
    saldoDisembunyikan
      ? "••••••••"
      : "Rp " + formatRupiah(hasil.saldo || 0);

  document.getElementById("totalMasukBulan").innerText =
    saldoDisembunyikan
      ? "••••••••"
      : "+ Rp " + formatRupiah(hasil.totalMasuk || 0);

  document.getElementById("totalKeluarBulan").innerText =
    saldoDisembunyikan
      ? "••••••••"
      : "- Rp " + formatRupiah(hasil.totalKeluar || 0);
  
  // kredit
  const infoKredit =
    document.getElementById("infoKredit");

  if (hasil.jumlahKredit > 0) {

    infoKredit.innerHTML =
      saldoDisembunyikan
        ? ""
        : `<span class="dot"></span>Kredit aktif ${hasil.jumlahKredit} • Sisa Rp ${formatRupiah(hasil.totalSisaKredit)}`;

  } else {

    infoKredit.innerHTML = "";

  }

  const list =
    document.getElementById("listTransaksi");

  list.innerHTML = "";

  const transaksi =
    hasil.transaksi || [];

  transaksi.sort((a, b) =>
    (b.tanggal || 0) -
    (a.tanggal || 0)
  );

  if(transaksi.length === 0){

    list.innerHTML = `
      <div class="kosong">
        Belum ada transaksi
      </div>
    `;

    return;
  }

  transaksi
    .slice(0, 5)
    .forEach(renderTransaksi);

}

// ========================= render transaksi ===========================
function renderTransaksi(trx){

  const list =
    document.getElementById("listTransaksi");

  const item =
    document.createElement("div");

  item.className =
    "transaksiItem";

  let warna = "#222";

  if(trx.jenis === "masuk"){
    warna = "#22c55e";
  }

  if(trx.jenis === "keluar"){
    warna = "#ef4444";
  }

  if(trx.jenis === "transfer"){
    warna = "#2d89ef";
  }

  const simbol =
  trx.jenis === "masuk"
    ? "+"
    : trx.jenis === "keluar"
    ? "-"
    : "⇆";

  item.innerHTML = `
    <div class="transaksiHeader">

      <div>

        <strong>
          ${trx.kategori.toUpperCase()}
        </strong>

        <div class="jenis">

          ${
            trx.jenis === "masuk"
            ? `Masuk ke ${trx.sumber_tujuan_nama}`

            : trx.jenis === "keluar"
            ? `Keluar dari ${trx.sumber_asal_nama}`

            : `${trx.sumber_asal_nama} → ${trx.sumber_tujuan_nama}`
          }

          <br>

          Catatan:
          ${trx.catatan || "-"}

        </div>

        <div class="tanggal">
          ${formatTanggal(trx)}
        </div>

      </div>

      <div style="text-align:right;">

        <div
          class="nominal"
          style="color:${warna}"
        >
          ${simbol} Rp ${formatRupiah(trx.nominal)}
        </div>

        ${
          trx.biaya_admin > 0
          ? `
            <div
              class="jenis"
              style="
                text-align:right;
                color:#ef4444;
              "
            >
              Admin:
              Rp ${formatRupiah(trx.biaya_admin)}
            </div>
          `
          : ""
        }

        <button
          class="btnHapus"
          onclick="hapusTransaksi('${trx.id}')"
        >
          
        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="var(--textSecondary)"><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"/></svg>        </button>

      </div>

    </div>
  `;

  list.appendChild(item);

}

// =========================== load dashboard ==========================
async function loadDashboard(){

  setBottomNavActive("dashboard");
  
  const cache =
    localStorage.getItem("dashboard");

  if(cache){

    renderDashboard(
      JSON.parse(cache)
    );

    hideSkeleton();

  }else{

    showSkeleton();

  }

  try{

    const hasil = await getDashboard(user.userId);

    localStorage.setItem(
      "dashboard",
      JSON.stringify(hasil)
    );

    console.log(hasil);
console.log(hasil.dompet);

        // simpan daftar dompet
    if (hasil.dompet) {
      sessionStorage.setItem(
        "dompet",
        JSON.stringify(hasil.dompet)
      );
    }

    renderDashboard(hasil);

    // cek dompet dari hasil server
    if (!hasil.dompet || hasil.dompet.length === 0) {

      showToast("Buat minimal 1 dompet terlebih dahulu");

      setTimeout(() => {
        location.href = "dompet.html";
      }, 1000);
    }

  }catch(err){

    console.error(err);

    showToast(
      "Gagal load dashboard"
    );

  }finally{

    hideSkeleton();

  }

}


// =================================== skeleton =================================

function showSkeleton(){

  const list = document.getElementById("listTransaksi");
  const saldo = document.getElementById("saldo");
  const totalMasuk = document.getElementById("totalMasukBulan");
  const totalKeluar = document.getElementById("totalKeluarBulan");

  list.classList.add("skeleton-card");
  saldo.classList.add("skeleton-saldo");
  totalMasuk.classList.add("skeleton-text");
  totalKeluar.classList.add("skeleton-text");

  // kosongkan transaksi lama
  list.innerHTML = "";
  saldo.innerHTML = "";
  totalMasuk.innerHTML = "";
  totalKeluar.innerHTML = "";

}

function hideSkeleton(){

  document
    .getElementById("saldo")
    .classList.remove("skeleton-saldo");

  document
    .getElementById("totalMasukBulan")
    .classList.remove("skeleton-text");

  document
    .getElementById("totalKeluarBulan")
    .classList.remove("skeleton-text");

  document
    .getElementById("listTransaksi")
    .classList.remove("skeleton-card");

}

//format tanggal

function formatTanggal(trx){

  // ================= DATA BARU =================

  if(trx.tanggal){

    return new Date(trx.tanggal)
      .toLocaleString("id-ID", {

        timeZone: "Asia/Jakarta",

        day: "2-digit",

        month: "short",

        year: "numeric",

        hour: "2-digit",

        minute: "2-digit"

      });
  }

  // ================= DATA LAMA =================

  return new Date(trx.tanggal)
    .toLocaleDateString("id-ID", {

      timeZone: "Asia/Jakarta",

      day: "2-digit",

      month: "short",

      year: "numeric"

    });
}

// ======================= hapus transaksi =====================

async function hapusTransaksi(id){

  if(!confirm("Yakin ingin menghapus transaksi ini?")){
    return;
  }

  try{

        const { data, error } = await db.rpc("hapus_transaksi", {
        p_id: id,
        p_user: user.userId
    });

    if (error) throw error;

    if (data.success) {

        sessionStorage.removeItem("dompet");
        sessionStorage.removeItem("laporan");
        localStorage.removeItem("dashboard");

        showToast("Transaksi berhasil dihapus");

        loadDashboard();

    } else {

        showToast(data.message);

    }

  }catch(err){
    console.error(err);
    showToast("Error server / CORS");
  }
}

// ========================= telegram =========================
function hubungkanTelegram(){

const user =
JSON.parse(
  sessionStorage.getItem("user") ||
  localStorage.getItem("user") ||
  localStorage.getItem("activeUser")
);

if(!user){
  alert("User belum login");
  return;
}

const link =
"https://t.me/catetin_bymbs_bot?start="
+
user.userId;

window.open(link, "_blank");

}

// ================ cek profil user ================
async function cekProfilUser(){

    try {

        const {
            data: profil,
            error
        } = await db
            .from("users")
            .select("nama, gmail")
            .eq("id_user", user.userId)
            .single();

        if(error){
            console.error(
                "Gagal mengecek profil:",
                error
            );

            return null;
        }

        if(
            !profil.nama ||
            !profil.gmail
        ){

            showToast(
                "Profil belum lengkap. Silakan isi nama dan Gmail di menu Profil."
            );

        }

        return profil;

    } catch(err){

        console.error(
            "Gagal mengecek profil:",
            err
        );

        return null;
    }

}

// ================= LOAD =================

document.addEventListener("DOMContentLoaded", async () => {

    loadThemeDashboard();

    syncToggleSaldo();

    const pesan =
        sessionStorage.getItem("toastMessage");

    if (pesan) {

        showToast(pesan);

        sessionStorage.removeItem(
            "toastMessage"
        );

    }

    // Ambil profil dari Supabase
    const profil =
        await cekProfilUser();

    // Tampilkan nama user
    const namaTampil =
        profil?.nama ||
        user.noHp;

    document.getElementById(
        "userInfo"
    ).innerHTML =
        `<b>${namaTampil
            .toLowerCase()
            .replace(/\b\w/g, c =>
                c.toUpperCase()
            )}, silakan catat keuanganmu.</b>`;

    const btn =
        document.getElementById(
            "btnToggleSaldo"
        );

    if (btn) {

        btn.textContent =
            saldoDisembunyikan
                ? "🙈"
                : "👁";

    }

    await loadDashboard();

});

window.addEventListener("pageshow", () => {
  loadThemeDashboard();
syncToggleSaldo();
  loadDashboard();
});