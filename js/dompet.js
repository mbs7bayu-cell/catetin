let dompetList = [];

async function loadData() {

    setBottomNavActive("dompet");


  const cache =
    localStorage.getItem("dompetCache");

  if(cache){

    dompetList =
      JSON.parse(cache);

    render();

  }else{

    const list =
    document.getElementById("dompetList");

    list.innerHTML = "";

    list.classList.add("skeleton-card");

  }

  try{

    const user = JSON.parse(
      sessionStorage.getItem("user") ||
      localStorage.getItem("user") ||
      localStorage.getItem("activeUser")
    );

    const res = await fetch(
      `${API}?mode=dompet&userId=${user.userId}`
    );

    dompetList = await res.json();

    localStorage.setItem(
      "dompetCache",
      JSON.stringify(dompetList)
    );

    render();

  }catch(err){

    console.error(err);

    showToast(
      "Gagal memuat dompet"
    );

  }

}

function render() {

  const dompetListEl =
    document.getElementById("dompetList");

  dompetListEl.innerHTML = "";

  if(dompetList.length === 0){

    dompetListEl.innerHTML =
      "<p class='kosong'>Belum ada dompet</p>";

    dompetListEl.classList.remove("skeleton-card");

    return;
  }

  dompetList.forEach(d => {

    const card =
      document.createElement("div");

    card.innerHTML = `
      <div class="dompetCard">

        <div>
          <h4>${d.nama}</h4>
          <small>${d.tipe}</small>
        </div>

        <div class="dompetSaldo">
          <b>Rp ${Number(d.saldo).toLocaleString("id-ID")}</b>

          <button
            onclick="editDompet('${d.id_sumber}')"
            class="btnEdit"
          >
            Edit
          </button>
        </div>

      </div>
    `;

    dompetListEl.appendChild(card);

  });

  dompetListEl.classList.remove("skeleton-card");
}

document.addEventListener("DOMContentLoaded", () => {

  loadTheme();

  const btnTambah =
    document.getElementById("btnTambah");

  btnTambah.addEventListener("click", () => {

    window.location.href =
      "tambah-dompet.html";

  });

  loadData();
});


// ================ edit dompet ==================

let editId = null;

window.editDompet = function(id){

  const dompet =
    dompetList.find(d =>
      String(d.id_sumber) === String(id)
    );

  if(!dompet) return;

  editId = id;

  document.getElementById("editNama")
    .value = dompet.nama;

  document.getElementById("editTipe")
    .value = dompet.tipe;

  document.getElementById("modalEdit")
    .style.display = "flex";
}

function closeModal(){

  document.getElementById("modalEdit")
    .style.display = "none";
}

async function simpanEditDompet(){

  const nama =
    document.getElementById("editNama")
    .value.trim();

  const tipe =
    document.getElementById("editTipe")
    .value;

  if(!nama){

    showToast("Nama wajib diisi");
    return;
  }

  document.getElementById("btnSimpanEdit").disabled = true;
  document.getElementById("btnSimpanEdit").innerText = "menyimpan...";



  const res = await fetch(API, {

    method: "POST",

    body: JSON.stringify({

      mode: "edit_dompet",

      id_sumber: editId,

      nama: nama,

      tipe: tipe

    })
  });

  const hasil =
    await res.json();

  if(hasil.ok){

    localStorage.removeItem("dompetCache");

    showToast("Dompet berhasil diupdate");

    closeModal();

    loadData();

    document.getElementById("btnSimpanEdit").disabled = false;
    document.getElementById("btnSimpanEdit").innerText = "Simpan";


  }else{

    showToast("Gagal update");

    document.getElementById("btnSimpanEdit").disabled = false;
    document.getElementById("btnSimpanEdit").innerText = "Simpan";

  }
}