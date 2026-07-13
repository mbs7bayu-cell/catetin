let activeBulan = null;
let activeCard = null;

let limitTanggal = 5;
let totalTanggal = 0;
let dataBulanAktif = [];

const limitTransaksiMap = {};

const user = JSON.parse(
  sessionStorage.getItem("user") ||
  localStorage.getItem("user") ||
  localStorage.getItem("activeUser")
);

if(!user){

  location.href = "login.html";
}

// ================= FORMAT =================

function formatRupiah(angka){

  return "Rp " +

    Number(angka)
    .toLocaleString("id-ID");
}


// ================ jam ====================
function formatJam(trx){

  return parseTanggal(trx)
    .toLocaleTimeString(
      "id-ID",
      {

        timeZone: "Asia/Jakarta",

        hour: "2-digit",

        minute: "2-digit"
      }
    );
}

// ================= format tanggal indonesia ==================

function formatTanggalIndonesia(tanggal){

  const date =
    new Date(tanggal);

  return date.toLocaleDateString(
    "id-ID",
    {
      day: "numeric",
      month: "long",
      year: "numeric",

      timeZone: "Asia/Jakarta"
    }
  );
}

// ================= NAMA BULAN =================

function namaBulan(key){

  const bulan = [

    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember"
  ];

  const pecah =
    key.split("-");

  return (
    bulan[
      Number(pecah[1]) - 1
    ] +

    " " +

    pecah[0]
  );
}

// ========== parse tanggal ================

function parseTanggal(trx){

  // ================= timestamp baru =================

  if(trx.timestamp){

    return new Date(
      Number(trx.timestamp)
    );
  }

  // ================= fallback data lama =================

  return new Date(trx.tanggal);
}

// ================= LOAD =================

async function loadLaporan(){

    setBottomNavActive("laporan");


  const saldoEl = document.getElementById("sisaSaldo");
  const masukEl = document.getElementById("totalMasuk");
  const keluarEl = document.getElementById("totalKeluar");
  const listBulanEl = document.getElementById("listBulan");

  saldoEl.classList.add("skeleton-text");
  masukEl.classList.add("skeleton-text");
  keluarEl.classList.add("skeleton-text");
  listBulanEl.classList.add("skeleton-card");

  const cache = sessionStorage.getItem("laporan");

  if(cache){

    renderLaporan(
      JSON.parse(cache)
    );

    return;
  }

  try{

    const res = await fetch(
      API + "?mode=laporan&userId=" + user.userId
    );

    const hasil = await res.json();

    sessionStorage.setItem(
      "laporan",
      JSON.stringify(hasil)
    );

    renderLaporan(hasil);

  }catch(err){

    console.error(err);
    showToast("Gagal load laporan");

  }

}

// ================= RENDER KATEGORI =================
function renderKategori(data){

  const list =
    document.getElementById(
      "listKategori"
    );

  list.innerHTML = "";

  const kategoriMap = {};

  data.forEach(trx => {

    const kategoriAsli =
      trx.kategori || "Lainnya";

    const kategoriKey =
      kategoriAsli
        .trim()
        .toLowerCase();

    if(!kategoriMap[kategoriKey]){

      kategoriMap[kategoriKey] = {

        nama:
          kategoriAsli
            .toLowerCase()
            .split(" ")
            .map(kata =>
              kata.charAt(0)
                .toUpperCase() +
              kata.slice(1)
            )
            .join(" "),

        jenis: trx.jenis,

        total: 0,

        transaksi: []
      };
    }

    kategoriMap[kategoriKey].total +=
      Number(trx.nominal);

    kategoriMap[kategoriKey]
      .transaksi
      .push(trx);

  });

  Object.keys(kategoriMap)

    .sort((a,b) =>

      kategoriMap[b].total -
      kategoriMap[a].total

    )

  .forEach(key => {

    const kategori =
      kategoriMap[key];

    let warna = "#222";
    let icon = "⚪";

    if(kategori.jenis === "masuk"){

      warna = "#22c55e";
      icon = "⬆️";

    }else if(kategori.jenis === "keluar"){

      warna = "#ef4444";
      icon = "⬇️";

    }else if(kategori.jenis === "transfer"){

      warna = "#3b82f6";
      icon = "↔️";

    }

    const card =
      document.createElement("div");

    card.className = "card";

    card.innerHTML = `

      <strong>
        ${icon}
        ${kategori.nama}
      </strong>

      <div
        style="
          color:${warna};
          font-weight:bold;
        "
      >

        ${formatRupiah(
          kategori.total
        )}

      </div>

    `;

    list.appendChild(card);

  });

}

// ================ grup by tanggal ===================

function groupByTanggal(data){

  const hasil = {};

  data.forEach(trx => {

    const date =
      parseTanggal(trx);

    const key =
      date.getFullYear() + "-" +
      String(date.getMonth() + 1)
        .padStart(2, "0") + "-" +
      String(date.getDate())
        .padStart(2, "0");

    if(!hasil[key]){

      hasil[key] = [];
    }

    hasil[key].push(trx);

  });

  return hasil;
}

// =================== render tanggal =====================
function renderTanggal(data){

  dataBulanAktif = data;

  const oldBtn =
    document.getElementById(
      "btnLoadMoreTanggal"
    );

  if(oldBtn){
    oldBtn.remove();
  }

  const list =
    document.getElementById("listTanggal");

  const oldTanggal =
    list.querySelectorAll(".tanggalCard");

  oldTanggal.forEach(el => el.remove());

  const grup =
    groupByTanggal(data);

  const daftarTanggal = Object.keys(grup)
  .sort((a,b) => new Date(b) - new Date(a));

  totalTanggal = daftarTanggal.length;

  daftarTanggal.slice(0, limitTanggal)

    .forEach(tanggal => {

      const card =
        document.createElement("div");

      card.className = "card";

      card.classList.add("tanggalCard");

      card.style.cursor = "pointer";

      card.style.marginBottom = "10px";

      card.innerHTML = `

        <strong>
          ${formatTanggalIndonesia(tanggal)}
        </strong>

        <div id="transaksi-${tanggal}"
          style="margin-top:10px;">
        </div>

      `;

      card.onclick = () => {

        renderTransaksi(
          grup[tanggal],
          tanggal
        );

      };

      list.appendChild(card);
    });

    updateButtonLoadMoreTanggal();
}

// ================= RENDER TRANSAKSI =================

function renderTransaksi(data, tanggal, forceRender = false){

  if(!limitTransaksiMap[tanggal]){
    limitTransaksiMap[tanggal] = 5;
  }

  const container =
    document.getElementById(
      "transaksi-" + tanggal
    );

  // ================= TOGGLE =================

  if(
    !forceRender &&
    container.innerHTML.trim() !== ""
  ){
    container.innerHTML = "";
    return;
  }

  container.innerHTML = "";

  const tampil = [...data]
    .sort((a,b)=>
      parseTanggal(b)-parseTanggal(a)
    )
    .slice(
      0,
      limitTransaksiMap[tanggal]
    );


  tampil.forEach(trx => {

    let warna = "var(--text)";

    if(trx.jenis === "masuk"){
      warna = "#22c55e";
    }

    if(trx.jenis === "keluar"){
      warna = "#ef4444";
    }

    const item =
      document.createElement("div");

    item.className =
      "transaksiItem";

    item.innerHTML = `

      <div class="transaksiHeader"
        style="
          border-bottom:1px solid #eee;
          padding-bottom:10px;
          margin-bottom:10px;
        ">

        <div>
          <strong>${trx.kategori}</strong> ${formatJam(trx)}

          <div class="jenis"><br>

          catatan : ${trx.catatan || "-"}

            <br><br>

            ${
              trx.jenis === "masuk"
              ? `Masuk ke ${trx.sumber_tujuan_nama}`

              : trx.jenis === "keluar"
              ? `Keluar dari ${trx.sumber_asal_nama}`

              : `${trx.sumber_asal_nama} → ${trx.sumber_tujuan_nama}`
            }

          </div>
        </div>

        <div style="text-align:right;">

          <div class="nominal"
            style="color:${warna}">

            ${formatRupiah(trx.nominal)}

          </div>

        </div>

      </div>
    `;

    container.appendChild(item);

  });

  updateButtonLoadMore(
    data,
    tanggal
  );

}

// ================ BUTTON LOAD MORE/LESS ==================

function loadMoreTanggal(){

  limitTanggal += 5;

  renderTanggal(dataBulanAktif);
}

function loadLessTanggal(){

  limitTanggal = 5;

  renderTanggal(dataBulanAktif);
}

// ================= SHOW TAB ==================
function showTab(tab){

  const rincian =
    document.getElementById(
      "tabRincian"
    );

  const kategori =
    document.getElementById(
      "tabKategori"
    );

  const menuRincian =
    document.getElementById(
      "menuRincian"
    );

  const menuKategori =
    document.getElementById(
      "menuKategori"
    );

  if(tab === "rincian"){

    rincian.style.display =
      "block";

    kategori.style.display =
      "none";

    menuRincian.classList.add(
      "menuAktif"
    );

    menuKategori.classList.remove(
      "menuAktif"
    );

  }else{

    rincian.style.display =
      "none";

    kategori.style.display =
      "block";

    menuKategori.classList.add(
      "menuAktif"
    );

    menuRincian.classList.remove(
      "menuAktif"
    );

  }
}

// ===================== BUTTON VISIBILITY ========================

function updateButtonLoadMore(
  data,
  tanggal
){

  const list =
    document.getElementById(
      "transaksi-" + tanggal
    );

  const btnId =
    "btnLoadMore-" + tanggal;

  let btn =
    document.getElementById(btnId);

  if(!btn){

    btn = document.createElement("button");

    btn.id = btnId;

    btn.style.width = "100%";
    btn.style.padding = "12px";
    btn.style.marginTop = "10px";
    btn.style.border = "none";
    btn.style.borderRadius = "12px";
    btn.style.background = "#2d89ef";
    btn.style.color = "white";
    btn.style.fontWeight = "bold";

    btn.onclick = (e) => {

      e.stopPropagation();

      if(
        limitTransaksiMap[tanggal]
        >=
        data.length
      ){

        limitTransaksiMap[tanggal] = 5;

      }else{

        limitTransaksiMap[tanggal] += 5;

      }

      renderTransaksi(
        data,
        tanggal,
        true
      );
    };

    list.appendChild(btn);
  }

  btn.innerText =
  limitTransaksiMap[tanggal] >= data.length
  ? "Tampilkan Sedikit"
  : "Tampilkan Lebih Banyak";

  btn.style.display =
    data.length <= 5
      ? "none"
      : "block";
}

// ===================== update load more tanggal ========================
function updateButtonLoadMoreTanggal(){

  const list =
    document.getElementById(
      "listTanggal"
    );

  let btn =
    document.getElementById("btnLoadMoreTanggal");

  if(!btn){

    btn = document.createElement("button");

    btn.id = "btnLoadMoreTanggal";

    btn.onclick = (e) => {

      e.stopPropagation();

      if(limitTanggal >= totalTanggal){
        loadLessTanggal();
      }else{
        loadMoreTanggal();
      }
    };

    list.appendChild(btn); 
  }

  btn.innerText =
    limitTanggal >= totalTanggal
      ? "Tampilkan Sedikit"
      : "Tampilkan Lebih Banyak";

  btn.style.display =
    totalTanggal <= 5
      ? "none"
      : "block";
}

function renderLaporan(hasil){

  const saldoEl = document.getElementById("sisaSaldo");
  const masukEl = document.getElementById("totalMasuk");
  const keluarEl = document.getElementById("totalKeluar");
  const listBulanEl = document.getElementById("listBulan");

   // ================= SUMMARY =================

    document.getElementById("totalMasuk")
      .innerText =
      formatRupiah(
        hasil.summary.masuk || 0
      );

    document.getElementById("totalKeluar")
      .innerText =
      formatRupiah(
        hasil.summary.keluar || 0
      );

    document.getElementById("sisaSaldo")
      .innerText =
      formatRupiah(
        hasil.summary.saldo || 0
      );

    saldoEl.classList.remove("skeleton-text");
    masukEl.classList.remove("skeleton-text");
    keluarEl.classList.remove("skeleton-text");
    

    // ================= LIST BULAN =================

    const listBulan =
      document.getElementById("listBulan");

    listBulan.innerHTML = "";

    let activeBulan = null;
    let activeCard = null;

    const bulanKeys =
      Object.keys(hasil.bulan || {});

    listBulanEl.classList.remove("skeleton-card");

    if (bulanKeys.length === 0) {

      listBulan.innerHTML = `
        
          <p>Belum ada transaksi</p>
        
      `;

      return;
    }

    bulanKeys
      .reverse()
      .forEach(key => {

      const card =
        document.createElement("div");

      card.className =
        "card";

      card.style.cursor =
        "pointer";

      card.style.marginBottom =
        "10px";

      card.innerHTML = `

        <strong>
          ${namaBulan(key)}
        </strong>

      `;

    

      card.onclick = () => {

        limitTanggal = 5;
        limitTransaksi = 5;

        const cardListTanggal =
          document.getElementById("cardListTanggal");

        // hapus warna bulan sebelumnya
        if(activeCard && activeCard !== card){

          activeCard.classList.remove(
            "cardBulanAktif"
          );
        }

        // ================= TOGGLE =================

        if(activeBulan === key){

          activeBulan = null;

          card.classList.remove(
            "cardBulanAktif"
          );

          activeCard = null;

          document.getElementById("listTanggal")
            .innerHTML = "";

          cardListTanggal.style.display = "none";

          document.getElementById(
            "menuLaporan"
          ).style.display = "none";

          return;
        }

        activeBulan = key;

        card.classList.add(
          "cardBulanAktif"
        );

        activeCard = card;

        cardListTanggal.style.display = "block";

        document.getElementById(
          "menuLaporan"
        ).style.display = "flex";

        // ================= HITUNG SUMMARY =================

        let totalMasuk = 0;
        let totalKeluar = 0;

        hasil.bulan[key].forEach(trx => {

          if(trx.jenis === "masuk"){

            totalMasuk +=
              Number(trx.nominal);
          }

          if(trx.jenis === "keluar"){

            totalKeluar +=
              Number(trx.nominal);
          }

        });

        // ================= RENDER =================

        document.getElementById("listTanggal")
          .innerHTML = `
          
          <div class="summaryBulanan">

            <div class="summaryCard masuk">

              <div>Pemasukan</div>

              <strong>
                + ${formatRupiah(totalMasuk)}
              </strong>

            </div>

            <div class="summaryCard keluar">

              <div>Pengeluaran</div>

              <strong>
               - ${formatRupiah(totalKeluar)}
              </strong>

            </div>

          </div>

          <div class="btnDownloadPdf">
            <button
              class="btnPdf"
              onclick="downloadLaporanPDF('${key}')"
            >
              📄 Download PDF
            </button>
          </div>

        `;

        renderTanggal(
          hasil.bulan[key]
        );

        renderKategori(
          hasil.bulan[key]
        );
      };

      listBulan.appendChild(card);

    });
}

document.addEventListener("DOMContentLoaded", () => {

  loadTheme();


});

// ================= LOAD =================

loadLaporan();