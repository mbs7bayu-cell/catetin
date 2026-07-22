// ================= LOAD DOMPET =================

async function loadDompet(){

  try{

    const cache =
      sessionStorage.getItem("dompet");

    let data = [];

    if(cache){

      data = JSON.parse(cache);

    }else{

      const user = JSON.parse(
        sessionStorage.getItem("user") ||
        localStorage.getItem("user") ||
        localStorage.getItem("activeUser")
      );

      if(!user){

        location.href = "login.html";
      }

      data = await getDompet(user.userId);

      sessionStorage.setItem(
        "dompet",
        JSON.stringify(data)
      );
    
    }

      const select =
        document.getElementById("sumberDana");

      select.innerHTML = `
        
      `;

      data.forEach(d => {

        const opt =
          document.createElement("option");

        opt.value = d.id;

        opt.textContent =
          `${d.nama} (${d.tipe}) - Rp ${Number(d.saldo).toLocaleString("id-ID")}`;

        select.appendChild(opt);

      });

  }catch(err){

      console.error(err);

      showToast("Gagal load dompet");
  }
  
}

// ================= SIMPAN =================

async function simpanPengeluaran(){

  const btn =
    document.getElementById("btnSimpan");

  const user = JSON.parse(
    sessionStorage.getItem("user") ||
    localStorage.getItem("user") ||
    localStorage.getItem("activeUser")
  );

  const sumberDana =
    document.getElementById("sumberDana").value;

  const kategori =
    document.getElementById("kategori").value.trim();

  const inputNominal = document.getElementById("nominal");


  const catatan =
    document.getElementById("catatan").value.trim();
  
  const status = 
    document.getElementById("status");

  // ================= VALIDASI =================

  if(!sumberDana){

    showToast("Pilih dompet");
    return;
  }

  if(!kategori){

    showToast("Kategori wajib diisi");
    return;
  }

  if(inputNominal.dataset.expression){

      if(validasiEkspresi(inputNominal.dataset.expression)){

          const hasil =
              hitungEkspresi(inputNominal.dataset.expression);

          inputNominal.value =
              "Rp " +
              hasil.toLocaleString("id-ID");

      }

  }

  const nominal = inputNominal.value;
  const nominalAngka = getNumber(nominal);

  if(nominalAngka <= 0){
      showToast("Nominal tidak valid");
      return;
  }

  // ================= DATA =================

  const data = {
    p_id_user: user.userId,
    p_sumber_asal: sumberDana,
    p_kategori: kategori.toLowerCase(),
    p_nominal: nominalAngka,
    p_catatan: catatan
};

  // ================= LOADING =================

  
  showLoading("mohon tunggu...");

  btn.disabled = true;

  btn.innerText = "Menyimpan...";

  toolbar.classList.remove("show");
  preview.classList.add("hidden");

  try{

    const { error } =
        await db.rpc("simpan_pengeluaran", data);

    if(error) throw error;

    

      //update dashboard dan laporan
          localStorage.removeItem("dompetCache");

      sessionStorage.removeItem("dompet");
      sessionStorage.removeItem("laporan");
      localStorage.removeItem("dashboard");

      btn.innerText = "Berhasil ✔";

      showToast(
        "Pengeluaran berhasil"
      );

      status.innerHTML = "✅ Pengeluaran berhasil.";


      setTimeout(() => {

        resetForm();
        btn.innerText = "Simpan";
        btn.disabled = false;

        window.location.href =
          "dashboard.html";

      }, 800);

  }catch(err){

    console.error(err);

    showToast(err.message);


    btn.disabled = false;

    btn.innerText = "Simpan";
  } finally {

    hideLoading();
  }
}

// ================= FORMAT RUPIAH =================

function formatInputRupiah(id){

  const input =
    document.getElementById(id);

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

//formatInputRupiah("nominal");

// ================= RESET FORM =================
function resetForm(){

    document.getElementById("sumberDana").value = "";
    document.getElementById("kategori").value = "";

    const nominal =
        document.getElementById("nominal");

    nominal.value = "";
    nominal.dataset.expression = "";

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

    const { data, error } = await db
        .from("categories")
        .select("nama_kategori")
        .eq("id_user", user.userId)
        .eq("jenis", jenis)
        .order("nama_kategori");

         console.log(data);
    console.log(error);

    if(error){
        console.error(error);
        return;
    }

    semuaKategori = data.map(x => x.nama_kategori);
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

// ================== input kalkulator ==================
const nominal = document.getElementById("nominal");
const btnFx = document.getElementById("btnFx");
const toolbar = document.getElementById("calcToolbar");
const btnDone = document.getElementById("btnDone");
const preview =
    document.getElementById("calcPreview");

function formatEkspresiRealtime(input){

    const oldPos = input.selectionStart;

    const beforeCaret =
        input.value.substring(0, oldPos);

    let exp = input.value
        .replace(/Rp\s?/g,"")
        .replace(/\./g,"");

    input.dataset.expression = exp;

    let formatted;

    // hanya angka
    if(/^\d+$/.test(exp)){

        formatted =
            "Rp " +
            Number(exp).toLocaleString("id-ID");

    }else{

        formatted =
            formatEkspresi(exp);

    }

    input.value = formatted;

    // hitung berapa karakter "asli"
    // sebelum caret
    const rawBeforeCaret =
        beforeCaret.replace(/\./g,"");

    // cari posisi caret baru
    let rawCount = 0;
    let newPos = formatted.length;

    for(let i=0;i<formatted.length;i++){

        if(/\d/.test(formatted[i])){

            rawCount++;

        }

        if(rawCount >= rawBeforeCaret.length){

            newPos = i + 1;
            break;

        }

    }

    input.setSelectionRange(newPos,newPos);

}

function updatePreview(){

    const exp =
        nominal.dataset.expression;

    if(!/[+\-*/()]/.test(exp)){
        preview.classList.add("hidden");
        return;
    }

    if(!exp){

        preview.classList.add("hidden");
        return;

    }

    try{

        if(!validasiEkspresi(exp)){
            preview.classList.remove("hidden");
            preview.textContent =
                "Perhitungan belum lengkap";
            return;
        }

        const hasil =
            hitungEkspresi(exp);

        preview.classList.remove("hidden");

        preview.textContent =
            "= Rp " +
            hasil.toLocaleString("id-ID");

    }catch{

        preview.classList.remove("hidden");

        preview.textContent =
            "Perhitungan belum lengkap";

    }

}

btnFx.addEventListener("click", (e) => {

    e.preventDefault();

    toolbar.classList.toggle("show");

    nominal.focus();

});

toolbar.addEventListener("click", (e) => {

    const op = e.target.dataset.op;

    if (!op) return;

    if (op === "backspace") {

        const start = nominal.selectionStart;
        const end = nominal.selectionEnd;

        if (start === end && start > 0) {
            nominal.value =
                nominal.value.slice(0, start - 1) +
                nominal.value.slice(end);
            
            nominal.dataset.expression = nominal.value;
            updatePreview();

            nominal.setSelectionRange(start - 1, start - 1);
        }

        return;
    }

    if(op === "clear"){

        nominal.value = "";
        nominal.dataset.expression = "";

        updatePreview();

        nominal.focus();

        return;
    }

    insertAtCursor(op);

});

document.addEventListener("click", (e) => {

    const wrapper = document.querySelector(".nominalWrapper");

    if(
        !wrapper.contains(e.target) &&
        !toolbar.contains(e.target)
    ){
        toolbar.classList.remove("show");
        preview.classList.add("hidden");
    }

});

function insertAtCursor(text){

    const start = nominal.selectionStart;
    const end = nominal.selectionEnd;

    nominal.value =
        nominal.value.substring(0,start) +
        text +
        nominal.value.substring(end);

    nominal.dataset.expression = nominal.value;

    const pos = start + text.length;

    nominal.focus();
    nominal.setSelectionRange(pos,pos);

    updatePreview();

}

nominal.addEventListener("input", () => {

    formatEkspresiRealtime(nominal);

    updatePreview();

});

nominal.addEventListener("blur", () => {

    if (!nominal.dataset.expression) return;

    try{

        if(!validasiEkspresi(nominal.dataset.expression)){
            showToast("Perhitungan tidak valid");
            return;
        }

        const hasil =
            hitungEkspresi(nominal.dataset.expression);

        nominal.value =
            "Rp " +
            hasil.toLocaleString("id-ID");

        preview.classList.add("hidden");


    }catch(e){

        showToast("Perhitungan tidak valid");

    }

});

nominal.addEventListener("focus", () => {

    const exp = nominal.dataset.expression;

    if(!exp) return;

    if(/^\d+$/.test(exp)){

        nominal.value =
            "Rp " +
            Number(exp).toLocaleString("id-ID");

    }else{

        nominal.value =
            formatEkspresi(exp);

    }

    updatePreview();

});

// ================== hitung ekspresi ==================
function hitungEkspresi(exp){

    exp = exp.replace(/\./g, "");   // hilangkan pemisah ribuan
    exp = exp.replace(/×/g,"*");
    exp = exp.replace(/÷/g,"/");

    return Function("return " + exp)();

}

function validasiEkspresi(exp){

    exp = exp.trim();

    // kosong
    if(exp === "") return false;

    // hanya angka, operator, titik dan kurung
    if(!/^[0-9+\-*/().\s]+$/.test(exp)){
        return false;
    }

    // tidak boleh diawali * atau /
    if(/^[*/]/.test(exp)){
        return false;
    }

    // tidak boleh diakhiri operator
    if(/[+\-*/.]$/.test(exp)){
        return false;
    }

    // operator ganda
    if(/[+\-*/]{2,}/.test(exp)){
        return false;
    }

    // kurung harus seimbang
    let jumlah = 0;

    for(const c of exp){

        if(c==="(") jumlah++;

        if(c===")"){

            jumlah--;

            if(jumlah < 0){
                return false;
            }

        }

    }

    if(jumlah !== 0){
        return false;
    }

    return true;

}

function formatEkspresi(exp){

    let hasil = "";
    let angka = "";

    for(const c of exp){

        if(/\d/.test(c)){

            angka += c;

        }else{

            if(angka){

                hasil += Number(angka)
                    .toLocaleString("id-ID");

                angka = "";

            }

            hasil += c;

        }

    }

    if(angka){

        hasil += Number(angka)
            .toLocaleString("id-ID");

    }

    return hasil;

}

document.querySelectorAll("#calcToolbar button").forEach(btn=>{
    btn.addEventListener("mousedown", e=>{
        e.preventDefault();
    });
});


document.addEventListener("DOMContentLoaded", () => {
  loadTheme();
  loadDompet();
  loadKategori("keluar");
});