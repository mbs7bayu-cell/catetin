let kreditList = [];
let daftarDompet = [];

async function loadData() {

  const user = JSON.parse(
    sessionStorage.getItem("user") ||
    localStorage.getItem("user") ||
    localStorage.getItem("activeUser")
  );

  if(!user){

    location.href = "login.html";
  }

  const kreditListEl =
    document.getElementById("kreditList");
  
  
  const cache =
    localStorage.getItem("kreditList");

  if(cache){

    render(
      JSON.parse(cache)
    );

    kreditListEl.classList.remove("skeleton-card");

  }else{

    kreditListEl.classList.add("skeleton-card");

  }

  try {


  const res = await fetch(`${API}?mode=kredit&userId=${user.userId}`);

  kreditList = await res.json();

  localStorage.setItem(
      "kreditList",
      JSON.stringify(kreditList)
    );

  console.log(kreditList);

  render(kreditList);
}catch(err){

    console.error(err);

    showToast(
      "Gagal load kredit"
    );

  }finally{

    kreditListEl.classList.remove("skeleton-card");

  }

}

function render(hasil) {

  const user = JSON.parse(
    sessionStorage.getItem("user") ||
    localStorage.getItem("user") ||
    localStorage.getItem("activeUser")
  );

  if(!user){

    location.href = "login.html";
  }

  const kreditListEl =
    document.getElementById("kreditList");

  kreditListEl.innerHTML = "";

  if(hasil.length === 0){

    kreditListEl.innerHTML =
      "<p class='kosong'>Tidak ada kredit.</p>";

    return;
  }

  hasil.forEach(d => {

    const total = Number(d.nominal_kredit);
    const sisa = Number(d.sisa_kredit);

    let tombol = "";

    // belum pernah dibayar
    if(sisa === total){

      tombol = `
        <button
          onclick="event.stopPropagation(); openBayarKredit('${d.id_kredit}')"
          class="btnBayarKredit"
        >
          Bayar
        </button>

        <button
          onclick="event.stopPropagation(); hapusKredit('${d.id_kredit}')"
          class="btnHapusKredit"
        >
          Hapus
        </button>
      `;

    }
    // sudah dibayar sebagian
    else if(sisa > 0){

      tombol = `
        <button
          onclick="event.stopPropagation(); openBayarKredit('${d.id_kredit}')"
          class="btnBayarKredit"
        >
          Bayar
        </button>
      `;

    }
    // lunas
    else{

      tombol = `
        <button
          onclick="event.stopPropagation(); hapusKredit('${d.id_kredit}')"
          class="btnHapusKredit"
        >
          Hapus
        </button>
      `;

    }

    const totalPersen = Number(d.nominal_kredit);
    const sisaPersen = Number(d.sisa_kredit);

    const persen =
    Math.round(
      ((totalPersen - sisaPersen) / totalPersen) * 100
    );

    const card =
      document.createElement("div");

    card.className = "kreditCard";

    card.onclick = () => {
      bukaDetailKredit(d.id_kredit);
    };

    card.innerHTML = `
  
      <div class="kreditInfo">
        <h4>${d.nama_kredit}</h4>
        <small>${d.catatan}</small>
      </div>

      <div class="kreditNominal">
        <div class="totalWrap">

          <div>
            <span>Total</span>
            <b>
              Rp ${Number(d.nominal_kredit).toLocaleString("id-ID")}
            </b>
          </div>

          <button
            onclick="event.stopPropagation(); openEditKredit('${d.id_kredit}')"
            class="btnEditKredit"
          >
            ✏️
          </button>

        </div>
      </div>

      <div class="kreditNominal">
        <div>
          <span>Sisa</span>
          <b class="sisaKredit">
            Rp ${Number(d.sisa_kredit).toLocaleString("id-ID")}
          </b>
        </div>
      </div>

      <div class="kreditNominal">
        <div>
          <span>Status</span>
          <b>${d.status}</b>
        </div>
      </div>

      <div class="progressWrap">
        <div
          class="progressBar"
          style="width:${persen}%"
        ></div>
      </div>

      <small>${persen}% Lunas</small>

      <div class="kreditAction">
        ${tombol}
      </div>

    `;

    kreditListEl.appendChild(card);

  });
}

document.addEventListener("DOMContentLoaded", async () => {

    setBottomNavActive("dashboard");


  loadTheme();

  await loadDompet();

  formatInputRupiah("nominalKredit");
  formatInputRupiah("nominalPinjaman");
  formatInputRupiah("nominalBayar");
  formatInputRupiah("editNominalKredit");
  

  const btnKredit =
    document.getElementById("btnKredit");

  btnKredit.addEventListener("click", () => {

        document.getElementById("modalKredit")
            .style.display = "flex";
        }

  );

  loadData();
});

window.addEventListener("pageshow", (e) => {
  if(e.persisted){
    loadData();
  }
});


// ================ tambah kredit ==================

function closeModal(){

  document.getElementById("modalKredit")
    .style.display = "none";
}

// ================ pilihan jenis barang ====================

document
.getElementById("jenisKredit")
.addEventListener("change", function(){

  if(this.value === "Barang"){

    document.getElementById(
      "nominalPinjaman"
    ).value = "";

    document.getElementById(
      "sumberTujuan"
    ).value = "";

  }

});

async function simpanKredit(){

  const btn = document.getElementById("btnSimpanKredit");

  const user =
  JSON.parse(
    sessionStorage.getItem("user") ||
    localStorage.getItem("user") ||
    localStorage.getItem("activeUser")
  );

  const namaKredit =
    document.getElementById("namaKredit").value.trim();

  const jenisKredit =
    document.getElementById("jenisKredit").value.trim();

  const nominalKredit =
    document.getElementById("nominalKredit").value;

  const nominalPinjaman =
    document.getElementById("nominalPinjaman").value;

  const sumberTujuan =
    document.getElementById("sumberTujuan").value;

  const catatan =
    document.getElementById("catatan").value.trim();

  const status = document.getElementById("status");

  // ================= VALIDASI =================

  if(!namaKredit){
    showToast("Nama Kredit harus diisi");
    return;
  }

  if(!jenisKredit){
    showToast("jenis kredit wajib diisi");
    return;
  }

  if(!nominalKredit || Number(nominalKredit) <= 0){
    showToast("Nominal tidak valid");
    return;
  }

  if(nominalPinjaman > nominalKredit) {
    showToast("Nominal Pinjaman lebih besar dari Nominal Kredit");
    return;
  }

  // ================ validasi pinjaman =================
  if(jenisKredit === "Pinjaman"){

    if(!nominalPinjaman ||
      Number(nominalPinjaman) <= 0){
      showToast("Nominal pinjaman tidak valid");
      return;
    }

    if(!sumberTujuan){
      showToast("Pilih dompet tujuan");
      return;
    }
  }

  // ================= DATA =================

  const data = {

    mode: "buat_kredit",

    id_user: user.userId,

    nama_kredit: namaKredit,

    jenis_kredit: jenisKredit,

    nominal_kredit: getNumber(nominalKredit),

    nominal_pinjaman:
      jenisKredit === "Pinjaman"
        ? getNumber(nominalPinjaman)
        : 0,

    sumber_tujuan:
      jenisKredit === "Pinjaman"
        ? sumberTujuan
        : "",

    catatan: catatan

  };

  // ================= LOADING =================

  btn.disabled = true;
  btn.innerText = "Menyimpan...";

  try{

    const res = await fetch(API, {

      method: "POST",

      body: JSON.stringify(data)

    });

    const hasil = await res.json();

    if(hasil.ok){

      //update dashboard dan laporan
      localStorage.removeItem("dompetCache");

      sessionStorage.removeItem("dompet");
      sessionStorage.removeItem("laporan");
      localStorage.removeItem("dashboard");
      localStorage.removeItem("kreditList");

      btn.innerText = "Berhasil ✔";

      showToast("Simpan kredit berhasil");

      status.innerHTML = "✅ Kredit berhasil disimpan.";


      setTimeout(() => {

        resetForm();
        btn.innerText = "Simpan";
        btn.disabled = false;

        window.location.href = "kredit.html";

      }, 800);

    }else{

      showToast(hasil.msg || "Gagal");

      btn.disabled = false;
      btn.innerText = "Simpan";
    }

  }catch(err){

    console.error(err);

    showToast("Error server");

    btn.disabled = false;
    btn.innerText = "Simpan";
  }finally{

  // selalu aktifkan kembali tombol
  btn.disabled = false;

  if(btn.innerText === "Menyimpan..."){
    btn.innerText = "Simpan";
  }
  }
}

// ============================= hidden nominal pinjaman ===================
const jenisKredit =
document.getElementById("jenisKredit");

const pinjamanGroup =
document.getElementById("pinjamanGroup");

function cekJenisKredit(){

  if(jenisKredit.value === "Pinjaman"){
    pinjamanGroup.classList.remove("hidden");
  }else{
    pinjamanGroup.classList.add("hidden");
  }

}

jenisKredit.addEventListener(
  "change",
  cekJenisKredit
);

// jalankan saat halaman dibuka
cekJenisKredit();

// ========================= load dompet =========================

async function loadDompet(){

  try {
    
    const cache =
      sessionStorage.getItem("dompet");

    if(cache){

      daftarDompet = JSON.parse(cache);

    }else{

      const user = JSON.parse(
          sessionStorage.getItem("user") ||
          localStorage.getItem("user") ||
          localStorage.getItem("activeUser")
        );

        if(!user){

          location.href = "login.html";
        }

          const res = await fetch(
            `${API}?mode=dompet&userId=${user.userId}`
          );

          daftarDompet = await res.json();

          sessionStorage.setItem(
            "dompet",
            JSON.stringify(daftarDompet)
          );
    
    }

          const tujuan =
            document.getElementById("sumberTujuan");

          tujuan.innerHTML = `
            <option value="">
              -- pilih dompet --
            </option>
          `;

          daftarDompet.forEach(d => {

            const text =
              `${d.nama} - Rp ${Number(d.saldo).toLocaleString("id-ID")}`;

            const opt = document.createElement("option");

            opt.value = d.id_sumber;
            opt.textContent = text;

            tujuan.appendChild(opt);

          });

  }catch(err){

            console.error(err);
            showToast("Gagal load dompet");
            
  }
}

// ================= FORMAT RUPIAH =================

function formatInputRupiah(id){

  const input = document.getElementById(id);

  input.addEventListener("input", function(){

    let angka =
      this.value.replace(/\D/g,"");

    if(!angka){
      this.value = "";
      return;
    }

    this.value =
      "Rp " +
      new Intl.NumberFormat("id-ID")
      .format(angka);

  });
}

// =================== hapus kredit =====================
async function hapusKredit(idKredit){

const user = JSON.parse(
    sessionStorage.getItem("user") ||
    localStorage.getItem("user") ||
    localStorage.getItem("activeUser")
  );

if(!user){
    location.href = "login.html";
}

if(!confirm("Yakin ingin menghapus kredit ini?")){
return;
}

try{

const res = await fetch(API, {
  method: "POST",
  body: JSON.stringify({
    mode: "hapusKredit",
    id_kredit: idKredit,
    userId: user.userId
  })
});

const hasil = await res.json();

if(hasil.ok){

  localStorage.removeItem("dompetCache");

      sessionStorage.removeItem("dompet");
      sessionStorage.removeItem("laporan");
      localStorage.removeItem("dashboard");
      localStorage.removeItem("kreditList");

  showToast("Kredit berhasil dihapus");

  loadData();

}else{

  showToast(
    hasil.msg || "Gagal menghapus kredit"
  );

}


}catch(err){

console.error(err);

showToast("Error server");


}

}

// ======================= bayar kredit =======================
async function bayarKredit(idKredit, idDompet, nominal) {

  const user = JSON.parse(
    sessionStorage.getItem("user") ||
    localStorage.getItem("user") ||
    localStorage.getItem("activeUser")
  );

  const btn = document.getElementById("bayarKredit");

  btn.disabled = true;
  btn.innerText = "Menyimpan...";

  try {

  const res = await fetch(API, {
    method: "POST",
    body: JSON.stringify({
      mode: "bayarKredit",
      id_kredit: idKredit,
      id_dompet: idDompet,
      userId: user.userId,
      nominal: nominal
    })
  });

  const hasil = await res.json();

  if (hasil.ok) {
    localStorage.removeItem("dompetCache");

      sessionStorage.removeItem("dompet");
      sessionStorage.removeItem("laporan");
      localStorage.removeItem("dashboard");
      localStorage.removeItem("kreditList");
    showToast("Pembayaran berhasil");
    closeBayarKredit();
    loadData();
    btn.innerText = "Berhasil ✔";

    setTimeout(() => {

        resetForm();
        btn.innerText = "Simpan";
        btn.disabled = false;

        window.location.href = "kredit.html";

      }, 800);
  } else {
    showToast(hasil.msg || "Gagal bayar");
    btn.disabled = false;
    btn.innerText = "Simpan";
  }
  } catch(err){

    console.error(err);

    showToast(
      "Error: " + err.message
    );

    btn.disabled = false;
    btn.innerText = "Simpan";
  }
      
}

// ========================= modal bayar kredit ===================
let selectedKreditId = null;

function openBayarKredit(idKredit) {

  selectedKreditId = idKredit;

  const select =
  document.getElementById("dompetBayar");

  select.innerHTML = `
      <option value="">
        -- pilih dompet --
      </option>
  `;

  daftarDompet.forEach(dompet => {

    select.innerHTML += `
      <option value="${dompet.id_sumber}">
        ${dompet.nama} - Rp ${Number(dompet.saldo).toLocaleString("id-ID")}
      </option>
    `;

  });

  document
    .getElementById("modalBayar")
    .classList.remove("hidden");

}

function closeBayarKredit() {
  document.getElementById("modalBayar").classList.add("hidden");
  document.getElementById("nominalBayar").value = "";
  selectedKreditId = null;
}

//============================= submit bayar kredit ==================
async function submitBayarKredit() {

  const nominal =
    getNumber(document.getElementById("nominalBayar").value)
  ;

  const idDompet =
    document.getElementById("dompetBayar").value;

  if (!nominal || nominal <= 0) {
    showToast("Nominal tidak valid");
    return;
  }

  await bayarKredit(
    selectedKreditId,
    idDompet,
    nominal
  );

}


// ================= RESET FORM =================
function resetForm(){
  document.getElementById("namaKredit").value = "";
  document.getElementById("sumberTujuan").value = "";
  document.getElementById("nominalKredit").value = "";
  document.getElementById("catatan").value = "";
  document.getElementById("nominalPinjaman").value = "";

}

// ====================== buka kredit ==================
async function bukaDetailKredit(idKredit){

  const modal =
    document.getElementById("modalDetailKredit");

  const body =
    document.getElementById("detailKreditBody");

  body.innerHTML = "Memuat riwayat...";

  // tampilkan modal dulu
  modal.style.display = "flex";

  try{

    const user = JSON.parse(
      sessionStorage.getItem("user") ||
      localStorage.getItem("user") ||
      localStorage.getItem("activeUser")
    );

    const res = await fetch(
      `${API}?mode=detailKredit&idKredit=${idKredit}&userId=${user.userId}`
    );

    const data = await res.json();

    if(data.length === 0){
      body.innerHTML =
        "<p>Belum ada pembayaran.</p>";
      return;
    }

    body.innerHTML = data.map(item => `
      <div class="riwayatItem">
        <b>
          Rp ${Number(item.nominal).toLocaleString("id-ID")}
        </b>
        <br>
        <small>${formatTanggal(item.tanggal)}</small>
        <br>
        <small>Metode: ${item.nama_dompet}</small>
      </div>
    `).join("");

  }catch(err){

    body.innerHTML =
      "<p>Gagal memuat data.</p>";

    console.error(err);
  }
}

function tutupModalDetail(){
  document
    .getElementById("modalDetailKredit")
    .style.display = "none";
}

// ================= edit kredit ==========================
let selectedKreditEditId = null;
  
function formatInputRupiah(id){

  const input = document.getElementById(id);

  input.addEventListener("input", function () {

    let angka = this.value.replace(/\D/g, "");

    if(!angka){
      this.value = "";
      return;
    }

    this.value = "Rp " + new Intl.NumberFormat("id-ID").format(angka);

  });

}

function openEditKredit(idKredit){

  selectedKreditEditId = idKredit;

  const kredit =
    kreditList.find(
      x => String(x.id_kredit) === String(idKredit)
    );

  if(!kredit){
    alert("Data kredit tidak ditemukan");
    return;
  }

  document.getElementById(
    "editNominalKredit"
  ).value =
    "Rp " +
    Number(kredit.nominal_kredit)
      .toLocaleString("id-ID");

  document.getElementById("modalEditKredit")
    .style.display = "flex";
}

function closeEditKredit(){

  document.getElementById(
    "modalEditKredit"
  ).style.display = "none";

}


async function simpanEditKredit(){

  const user = JSON.parse(
    sessionStorage.getItem("user") ||
    localStorage.getItem("user") ||
    localStorage.getItem("activeUser")
  );

  const nominal = getNumber(
    document.getElementById(
      "editNominalKredit"
    ).value
  );

  const btn = document.getElementById("btnSimpanEdit");

  btn.disabled = true;
  btn.innerText = "Menyimpan...";

  const res = await fetch(API,{
    method:"POST",
    body:JSON.stringify({
      mode:"editKredit",
      id_kredit:selectedKreditEditId,
      userId:user.userId,
      nominal_kredit:nominal
    })
  });

  const hasil = await res.json();

  if(hasil.ok){
    btn.innerText = "Berhasil ✔";

    showToast("Simpan Edit kredit berhasil");

      setTimeout(() => {

        resetForm();
        btn.innerText = "Simpan";
        btn.disabled = false;

        window.location.href = "kredit.html";

      }, 800);

    return;
  } else {
    showToast(hasil.msg || "Gagal");

      btn.disabled = false;
      btn.innerText = "Simpan";
  }

  closeEditKredit();

  loadData();
}


