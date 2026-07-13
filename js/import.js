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

const btnPilihFile =
document.getElementById("btnPilihFile");

const fileInput =
document.getElementById("fileInput");

const infoFile =
document.getElementById("infoFile");

const previewCard =
document.getElementById("previewCard");

const previewList =
document.getElementById("previewList");

const btnImport =
document.getElementById("btnImport");

let dataImport = [];

document.addEventListener("DOMContentLoaded", async () => {
      setBottomNavActive("dashboard");

});

// ===================== pilih file =====================

btnPilihFile.onclick = () => {

    fileInput.click();

};

// ===================== file dipilih =====================

fileInput.onchange = async function(){

    const file = this.files[0];

    if(!file) return;

    showLoading();

    try {
        infoFile.innerHTML =
        "📄 " + file.name;

    previewCard.style.display = "none";
    btnImport.style.display = "none";
    previewList.innerHTML = "";
    document.getElementById("summaryCard").style.display = "none";

    if(file.name.toLowerCase().endsWith(".csv")){

        dataImport =
        await parseCSV(file);

    }else if(file.name.toLowerCase().endsWith(".pdf")){

        await loadProfil();

        dataImport =
        await parsePDF(file);

    }else{

        alert("Format file tidak didukung");
        return;

    }

    if(dataImport.length){

        tampilkanRingkasan(
            dataImport,
            dataImport[0].provider,
            file.name
        );

        await loadDompet(dataImport[0].provider);

        const dompetSelect =
        document.getElementById("dompetSelect");

        // isi dompet sumber ke semua transaksi
        dataImport.forEach(trx=>{
            trx.dompet = dompetSelect.value;
        });

        // jika user mengganti dompet sumber
        dompetSelect.onchange = ()=>{

            dataImport.forEach(trx=>{
                trx.dompet = dompetSelect.value;
            });

            document
                .querySelectorAll(".dompetTujuan")
                .forEach((select, i)=>{
                    isiDompetTujuan(select, dataImport[i]);
                });

        };

        await loadKategori();


        tampilkanPreview(dataImport);

    }

    tampilkanPreview(dataImport);

    } finally {
        hideLoading();
    }

    

};

// ===================== preview =====================

function tampilkanPreview(data){

    previewList.innerHTML = "";

    if(data.length === 0){

        previewList.innerHTML =
            "<p>Tidak ada transaksi ditemukan.</p>";

        return;

    }

    data.forEach((trx,index)=>{

        const div = document.createElement("div");

        div.className = "previewItem";

        div.dataset.index = index;

        const warna =
        trx.jenis === "keluar"
            ? "previewKeluar"
            : trx.jenis === "transfer"
                ? "previewTransfer"
                : "previewMasuk";

        div.innerHTML = `

        <div class="previewHeader">

            <label class="previewCheck">

                <input
                    type="checkbox"
                    class="cekImport"
                    ${trx.dipilih ? "checked" : ""}>

                <span>Import</span>

            </label>

            <div class="previewTanggal">
                ${trx.tanggal} ${trx.jam}
            </div>

        </div>

        <div class="previewBody">

            <div class="previewJudul">
                ${trx.keterangan}
            </div>

            <div class="previewNominal ${warna}">
                ${trx.jenis=="keluar" ? "-" : "+"}
                Rp ${trx.nominal.toLocaleString("id-ID")}
            </div>

        </div>

        <div class="previewForm">

            <select class="jenis">

                <option value="masuk"
                    ${trx.jenis=="masuk"?"selected":""}>
                    Pemasukan
                </option>

                <option value="keluar"
                    ${trx.jenis=="keluar"?"selected":""}>
                    Pengeluaran
                </option>

                <option value="transfer"
                    ${trx.jenis=="transfer"?"selected":""}>
                    Transfer
                </option>

            </select>

            <select class="kategori"></select>

            <select class="dompetTujuan hidden"></select>

            <button
                type="button"
                class="btnCatatan">

                + Tambahkan catatan

            </button>

            <textarea
                class="catatan hidden"
                placeholder="Catatan (opsional)"
            >${trx.catatan}</textarea>

        </div>

        `;

        previewList.appendChild(div);

        const cekImport = div.querySelector(".cekImport");
        const jenis = div.querySelector(".jenis");
        const kategori = div.querySelector(".kategori");
        const dompetTujuan = div.querySelector(".dompetTujuan");
        const textarea = div.querySelector(".catatan");

        isiKategori(kategori, trx);

        isiDompetTujuan(dompetTujuan, trx);

        if(trx.jenis == "transfer"){

            kategori.classList.add("hidden");
            dompetTujuan.classList.remove("hidden");

        }
        
        cekImport.onchange = () => {

            dataImport[index].dipilih = cekImport.checked;

            tampilkanRingkasan(
                dataImport,
                dataImport[0].provider
            );

            const cekSemua =
            document.getElementById("cekSemua");

            cekSemua.checked =
                dataImport.every(x => x.dipilih);

        };

        jenis.onchange = () => {

            dataImport[index].jenis = jenis.value;

            if (jenis.value == "transfer") {

                kategori.classList.add("hidden");
                dompetTujuan.classList.remove("hidden");

                dataImport[index].kategori = "transfer";

            } else {

                kategori.classList.remove("hidden");
                dompetTujuan.classList.add("hidden");

                dataImport[index].dompetTujuan = "";
                dataImport[index].kategori = "";

                isiKategori(kategori, dataImport[index]);

            }

            tampilkanRingkasan(
                dataImport,
                dataImport[0].provider
            );

        };

        kategori.onchange = () => {

            dataImport[index].kategori = kategori.value;

        };

        dompetTujuan.onchange = ()=>{

            dataImport[index].dompetTujuan =
                dompetTujuan.value;

        };

        

        textarea.oninput = () => {

            dataImport[index].catatan = textarea.value;

        };

        const btnCatatan =
            div.querySelector(".btnCatatan");

        btnCatatan.onclick = ()=>{

            textarea.classList.toggle("hidden");

            btnCatatan.textContent =
                textarea.classList.contains("hidden")
                ? "+ Tambahkan catatan"
                : "− Sembunyikan catatan";

        };

    });

    previewCard.style.display = "block";

    const cekSemua =
    document.getElementById("cekSemua");

    cekSemua.checked =
        dataImport.every(x => x.dipilih);

    cekSemua.onchange = () => {

        const pilih = cekSemua.checked;

        dataImport.forEach(trx=>{
            trx.dipilih = pilih;
        });

        tampilkanPreview(dataImport);

        tampilkanRingkasan(
            dataImport,
            dataImport[0].provider
        );

    };

    btnImport.style.display = "block";

}



// ===================== import =====================

btnImport.onclick = async () => {

    const idDompet =
    document.getElementById("dompetSelect").value;

    if(!idDompet){

        alert("Pilih dompet terlebih dahulu.");

        return;

    }

    dataImport.forEach(trx=>{

        trx.dompet = idDompet;

    });
    
    const transaksi = dataImport.filter(x => x.dipilih);

    if(transaksi.length === 0){
        alert("Belum ada transaksi yang dipilih.");
        return;
    }

    
    const transferBelumLengkap = transaksi.find(trx =>
        trx.jenis === "transfer" &&
        !trx.dompetTujuan
    );

    if(transferBelumLengkap){

        alert("Masih ada transaksi transfer yang belum dipilih dompet tujuannya.");

        return;

    }

    btnImport.disabled = true;
    btnImport.textContent = "Mengimport...";

    try{

        console.log(JSON.stringify(transaksi, null, 2));
        const res = await fetch(API,{
            method:"POST",
            body:JSON.stringify({

                action:"importTransaksi",

                id_user:user.userId,

                transaksi:transaksi

            })
        });

        const hasil = await res.json();

        setTimeout(() => {

            // Hapus cache agar dashboard mengambil data terbaru
            sessionStorage.removeItem("dompet");
            sessionStorage.removeItem("laporan");
            localStorage.removeItem("dashboard");

            const pesan = 
        `✅ Berhasil import ${hasil.jumlah} transaksi, cek pada laporan sesuai tanggal transaksi dibuat.`;
            
            sessionStorage.setItem(
            "toastMessage",
            pesan
            );

        window.location.href =
          "dashboard.html";
            

        }, 1200);

    }catch(err){

        console.error(err);

        alert("Import gagal.");

    }

    btnImport.disabled = false;
    btnImport.textContent = "Import Transaksi";

};

// ===================== parser CSV =====================

async function parseCSV(file){

    const text =
    await file.text();

    console.log(text);

    // sementara dummy

    return [

        {
            tanggal:"26 Jun 2026",
            keterangan:"Gaji",
            nominal:5000000,
            jenis:"masuk"
        },

        {
            tanggal:"26 Jun 2026",
            keterangan:"Indomaret",
            nominal:35000,
            jenis:"keluar"
        }

    ];

}

// ===================== parser PDF =====================

async function parsePDF(file){

    const arrayBuffer = await file.arrayBuffer();

    const pdf = await pdfjsLib.getDocument({
        data: arrayBuffer
    }).promise;

    const pages = [];

    // Baca semua halaman
    for(let i = 1; i <= pdf.numPages; i++){

        const page = await pdf.getPage(i);

        const textContent =
            await page.getTextContent();

        const text = textContent.items
            .map(item => item.str)
            .join(" ");

        pages.push(text);

    }

    // Gabungkan semua halaman
    const semuaText = pages.join(" ");

    // Deteksi provider
    const provider = detectProvider(semuaText);

    console.log(provider);

    // Pecah transaksi
    const transaksi = pecahTransaksi(semuaText);

    let hasil = [];

    switch(provider){

        case "gopay":

            hasil =
                parseGoPay(
                    pecahTransaksi(semuaText)
                );

            break;

        case "bsi":

            hasil =
                parseBSI(
                    pecahTransaksiBSI(semuaText)
                );

            break;

        default:

            alert("Provider belum didukung");

            return [];

    }

    return autoProcess(
        hasil,
        provider
    );
    
}

function pecahTransaksi(text){

    return text
        .split(/(?=\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2})/)
        .map(x => x.trim())
        .filter(x => x);

}

function tampilkanRingkasan(data, provider){

    const summary =
        document.getElementById("summaryCard");

    const content =
        document.getElementById("summaryContent");

    const siap =
        data.filter(x=>x.dipilih).length;

    const masuk =
        data.filter(x=>x.jenis==="masuk").length;

    const keluar =
        data.filter(x=>x.jenis==="keluar").length;

    const transfer =
        data.filter(x=>x.jenis==="transfer").length;

    content.innerHTML = `

        <div class="summaryGrid">

            <div class="summaryBox">
                <small>Provider</small>
                <b>${provider.toUpperCase()}</b>
            </div>

            <div class="summaryBox">
                <small>Total</small>
                <b>${data.length}</b>
            </div>

            <div class="summaryBox">
                <small>Siap Import</small>
                <b>${siap}</b>
            </div>

            <div class="summaryBox">
                <small>Masuk</small>
                <b>${masuk}</b>
            </div>

            <div class="summaryBox">
                <small>Keluar</small>
                <b>${keluar}</b>
            </div>

            <div class="summaryBox">
                <small>Transfer</small>
                <b>${transfer}</b>
            </div>

        </div>

    `;

    summary.style.display = "block";

}

// ====================== PARSE GOPAY ================================

function parseGoPay(data){

    const hasil = [];

    data.forEach(text=>{

        // hanya transaksi
        if(!text.match(/^\d{2}\/\d{2}\/\d{4}/)){
            return;
        }

        // buang header halaman jika ada
        text = text.split("E-statement")[0].trim();

        const tanggal =
            text.match(/\d{2}\/\d{2}\/\d{4}/)?.[0];

        const jam =
            text.match(/\d{2}:\d{2}/)?.[0];

        const nominalText =
            text.match(/-?Rp[\d.]+/)?.[0];

        if(!nominalText) return;

        const nominal =
            Number(
                nominalText
                    .replace("-", "")
                    .replace("Rp", "")
                    .replace(/\./g, "")
            );

        const jenis =
            nominalText.startsWith("-")
            ? "keluar"
            : "masuk";

        const arr = text.split(/\s+/);

        const indexId = arr.findIndex(item =>
            /^0[A-Za-z0-9]{10,}$/.test(item)
        );

        const keterangan =
        indexId > 2
        ? arr.slice(2,indexId).join(" ")
        : "-";

        console.log({
            tanggal,
            jam,
            keterangan,
            nominal,
            jenis
        });

        hasil.push({

            tanggal,
            jam,
            keterangan,
            nominal,
            jenis

        });

    });

    return hasil;

}

// =============== PARSE BSI ====================

function parseBSI(data){

    const hasil = [];

    data.forEach(text=>{

        // buang header halaman jika terselip
        text = text.split("SALDO BULAN LALU")[0].trim();

        const tanggal =
            text.match(/\d{2}\s+[A-Za-z]{3}\s+\d{4}/)?.[0];

        const jam =
            text.match(/\d{2}:\d{2}/)?.[0];

        if(!tanggal || !jam) return;

        // ===========================
        // Ambil No Reff
        // ===========================

        const id =
            text.match(/FT[A-Z0-9\\]+/)?.[0];

        // ===========================
        // Ambil keterangan
        // ===========================

        let keterangan = "-";

        if(id){

            const index =
                text.indexOf(id);

            keterangan =
                text.substring(
                    text.indexOf(jam)+5,
                    index
                ).trim();

        }

        // ===========================
        // Ambil angka
        // ===========================

        const angka = text.match(/\b\d{1,3}(?:\.\d{3})*\s*,00\b/g);

        if(!angka) return;

        // Debit
        const debit =
            Number(
                angka[0]
                    .replace(/\./g,"")
                    .replace(/,/g,".")
                    .replace(/\s/g,"")
            );

        // Kredit
        const kredit =
            Number(
                angka[1]
                    .replace(/\./g,"")
                    .replace(/,/g,".")
                    .replace(/\s/g,"")
            );

        const jenis =
            debit > 0
            ? "keluar"
            : "masuk";

        const nominal =
            debit > 0
            ? debit
            : kredit;

        hasil.push({

            tanggal,
            jam,
            keterangan,
            nominal,
            jenis

        });

    });

    return hasil;

}

function pecahTransaksiBSI(text){

    return text
        .split(/(?=\d{2}\s+[A-Za-z]{3}\s+\d{4}\s+\d{2}:\d{2})/)
        .map(x=>x.trim())
        .filter(x=>x);

}

// =================== DETEKSI FILE BANK ===================
function detectProvider(text){

    let skorGoPay = 0;

    if(text.includes("E-statement")) skorGoPay++;
    if(text.includes("GoPay Saldo")) skorGoPay++;
    if(text.includes("GoPay Coins")) skorGoPay++;

    if(skorGoPay >= 2)
        return "gopay";

    let skorBSI = 0;

    if(text.includes("BYOND")) skorBSI++;
    if(text.includes("Dana Masuk")) skorBSI++;
    if(text.includes("Debit")) skorBSI++;
    if(text.includes("Kredit")) skorBSI++;

    if(skorBSI >= 2)
        return "bsi";

    return "unknown";
}