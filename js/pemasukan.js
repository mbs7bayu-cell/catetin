async function loadDompet(){

  const user = JSON.parse(
    sessionStorage.getItem("user") ||
    localStorage.getItem("user") ||
    localStorage.getItem("activeUser")
  );

  if(!user){

    location.href = "login.html";
  }

  try{

    const res = await fetch(
      `${API}?mode=dompet&userId=${user.userId}`
    );

    const data = await res.json();

    const select =
      document.getElementById("sumberDana");

    select.innerHTML = `
      <option value="">
        -- pilih dompet --
      </option>
    `;

    data.forEach(d => {

      const opt =
        document.createElement("option");

      opt.value = d.id_sumber;

      opt.textContent =
        `${d.nama} (${d.tipe}) - Rp ${Number(d.saldo).toLocaleString("id-ID")}`;

      select.appendChild(opt);

    });

  }catch(err){

    console.error(err);
    showToast("Gagal load dompet");
  }
}

async function simpanPemasukan(){

  const btn = document.getElementById("btnSimpan");

  const user =
  JSON.parse(
    sessionStorage.getItem("user") ||
    localStorage.getItem("user") ||
    localStorage.getItem("activeUser")
  );

  const sumberDana =
    document.getElementById("sumberDana").value;

  const kategori =
    document.getElementById("kategori").value.trim();

  const nominal =
    document.getElementById("nominal").value;

  const catatan =
    document.getElementById("catatan").value.trim();

  const status = document.getElementById("status");

  // ================= VALIDASI =================

  if(!sumberDana){
    showToast("Pilih sumber dana");
    return;
  }

  if(!kategori){
    showToast("Kategori wajib diisi");
    return;
  }

  if(!nominal || Number(nominal) <= 0){
    showToast("Nominal tidak valid");
    return;
  }

  // ================= DATA =================

  const data = {

    mode: "tambah_pemasukan",

    id_user: user.userId,

    jenis: "masuk",

    sumber_asal: null,

    sumber_tujuan: sumberDana,

    kategori: kategori.toLowerCase(),

    nominal: getNumber(nominal),

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

    const pesan =
      "✅ Pemasukan dari <b>" +
      kategori +
      "</b> sebesar <b>Rp " +
      new Intl.NumberFormat("id-ID").format(
        getNumber(nominal)
      ) +
      "</b> berhasil disimpan.";

    if(hasil.ok){

      btn.innerText = "Berhasil ✔";

      showToast("Pemasukan berhasil");

      status.innerHTML = "✅ Pemasukan dari <b>" + kategori + "</b> sebesar <b>Rp " + new Intl.NumberFormat("id-ID").format(getNumber(nominal)) + "</b> berhasil disimpan.";


      setTimeout(() => {

        resetForm();
        btn.innerText = "Simpan";
        btn.disabled = false;
        sessionStorage.setItem(
          "toastMessage",
          pesan
        );
        window.location.href =
          "dashboard.html";

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
  }
}

// ================== format rupiah ==================
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

formatInputRupiah("nominal");

// ================= RESET FORM =================
function resetForm(){
  document.getElementById("sumberDana").value = "";
  document.getElementById("kategori").value = "";
  document.getElementById("nominal").value = "";
  document.getElementById("catatan").value = "";
}

// ================== load kategori ==========================

let semuaKategori = [];

async function loadKategori(jenis){

  const user = JSON.parse(
    sessionStorage.getItem("user") ||
    localStorage.getItem("user") ||
    localStorage.getItem("activeUser")
  );

  try{

    const url =
      API +
      "?mode=get_kategori&userId=" +
      user.userId +
      "&jenis=" +
      jenis;

    const res = await fetch(url);
    const data = await res.json();

    if(!Array.isArray(data)){
      console.error("Response bukan array:", data);
      return;
    }

    semuaKategori = data.filter(k => k);

  }catch(err){
    console.error("loadKategori error:", err);
  }
}

// ================== click diluar kategori =================

document.addEventListener("click", (e) => {

  const wrapper =
    document.querySelector(".inputWrapper");

  const dropdown =
    document.getElementById(
      "kategoriDropdown"
    );

  if(!wrapper.contains(e.target)){

    dropdown.style.display =
      "none";

  }

});

// ================== show kategori dropdown ==================

function showKategori(){

  const input =
    document.getElementById("kategori");

  const dropdown =
    document.getElementById(
      "kategoriDropdown"
    );

  const keyword =
    input.value.toLowerCase().trim();

  if(!keyword){

    dropdown.innerHTML = "";
    dropdown.style.display = "none";

    return;
  }

  dropdown.innerHTML = "";

  if(!keyword){
    dropdown.style.display = "none";
    return;
  }

  const hasil = semuaKategori
    .filter(k =>
      k.toLowerCase().includes(keyword)
    )
    .slice(0, 5);

  if(hasil.length === 0){
    dropdown.style.display = "none";
    return;
  }

  hasil.forEach(kategori => {

    const item =
      document.createElement("div");

    item.className =
      "kategori-item";

    item.textContent =
      kategori;

    item.onclick = () => {

      input.value =
        kategori;

      dropdown.innerHTML =
        "";

      dropdown.style.display =
        "none";
    };

    dropdown.appendChild(item);

  });

  dropdown.style.display =
    "block";
}

document.addEventListener("DOMContentLoaded", () => {
  loadTheme();
  loadDompet();
  loadKategori("masuk");
});



