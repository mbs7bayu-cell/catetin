document.addEventListener("DOMContentLoaded", () => {

  loadDompet();

  formatInputRupiah("nominal");
  formatInputRupiah("biayaAdmin");

});

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

          const res = await fetch(
            `${API}?mode=dompet&userId=${user.userId}`
          );

          data = await res.json();

          sessionStorage.setItem(
            "dompet",
            JSON.stringify(data)
          );

    }

          const asal =
            document.getElementById("sumberAsal");

          const tujuan =
            document.getElementById("sumberTujuan");

          asal.innerHTML = `
            <option value="">
              -- pilih dompet --
            </option>
          `;

          tujuan.innerHTML = `
            <option value="">
              -- pilih dompet --
            </option>
          `;

        data.forEach(d => {

          const text =
            `${d.nama} - Rp ${Number(d.saldo).toLocaleString("id-ID")}`;

          const opt1 =
            document.createElement("option");

          opt1.value = d.id_sumber;
          opt1.textContent = text;

          asal.appendChild(opt1);

          const opt2 =
            document.createElement("option");

          opt2.value = d.id_sumber;
          opt2.textContent = text;

          tujuan.appendChild(opt2);

        });

  }catch(err){

        console.error(err);

  }
}

async function simpanTransfer(){

  const btn =
    document.getElementById("btnSimpan");

  const user = JSON.parse(
    sessionStorage.getItem("user") ||
    localStorage.getItem("user") ||
    localStorage.getItem("activeUser")
  );

  const sumberAsal =
    document.getElementById("sumberAsal").value;

  const sumberTujuan =
    document.getElementById("sumberTujuan").value;

  const nominal =
    getNumber(
      document.getElementById("nominal").value
    );

  const biayaAdmin =
    getNumber(
      document.getElementById("biayaAdmin").value
    );

  const catatan =
    document.getElementById("catatan").value.trim();

  const status = document.getElementById("status");

  // ================= VALIDASI =================

  if(!sumberAsal){
    showToast("Pilih dompet asal");
    return;
  }

  if(!sumberTujuan){
    showToast("Pilih dompet tujuan");
    return;
  }

  if(sumberAsal === sumberTujuan){
    showToast("Dompet tidak boleh sama");
    return;
  }

  if(nominal <= 0){
    showToast("Nominal tidak valid");
    return;
  }

  showLoading("Mohon tunggu...");

  btn.disabled = true;
  btn.innerText = "Memproses...";

  try{

      const { data, error } = await db.rpc("simpan_transfer", {
          p_id_user: user.userId,
          p_sumber_asal: sumberAsal,
          p_sumber_tujuan: sumberTujuan,
          p_nominal: nominal,
          p_biaya_admin: biayaAdmin,
          p_kategori: "Transfer",
          p_catatan: catatan,
          p_tanggal: new Date()
      });

      if(error) throw error;

      if(data.success){

          const pesan =
              `✅ Transfer sebesar <b>Rp ${new Intl.NumberFormat("id-ID").format(nominal)}</b> berhasil disimpan.`;

          localStorage.removeItem("dompetCache");
          sessionStorage.removeItem("dompet");
          sessionStorage.removeItem("laporan");
          localStorage.removeItem("dashboard");

          btn.innerText = "Berhasil ✔";

          status.innerHTML = pesan;

          showToast("Transfer berhasil");

          setTimeout(() => {

              resetForm();

              btn.disabled = false;
              btn.innerText = "Transfer";

              sessionStorage.setItem("toastMessage", pesan);

              location.href = "dashboard.html";

          }, 800);

      }else{

          showToast(data.message || "Transfer gagal");

          btn.disabled = false;
          btn.innerText = "Transfer";

      }

  }catch(err){

      console.error(err);

      showToast(err.message || "Error server");

      btn.disabled = false;
      btn.innerText = "Transfer";

  }finally{

      hideLoading();

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

document.addEventListener("DOMContentLoaded", () => {

  loadTheme();


});

// ================= RESET FORM =================
function resetForm(){
  document.getElementById("sumberAsal").value = "";
  document.getElementById("sumberTujuan").value = "";
  document.getElementById("nominal").value = "";
  document.getElementById("biayaAdmin").value = "";
  document.getElementById("catatan").value = "";
}