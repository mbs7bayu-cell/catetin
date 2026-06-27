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

// ===================== pilih file =====================

btnPilihFile.onclick = () => {

    fileInput.click();

};

// ===================== file dipilih =====================

fileInput.onchange = async function(){

    const file = this.files[0];

    if(!file) return;

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

        tampilkanPreview(dataImport);

    }

    tampilkanPreview(dataImport);

};

// ===================== preview =====================

function tampilkanPreview(data){

    previewList.innerHTML = "";

    if(data.length === 0){

        previewList.innerHTML =
            "<p>Tidak ada transaksi ditemukan.</p>";

        return;

    }

    data.forEach(trx=>{

        const div = document.createElement("div");

        div.className = "previewItem";

        const warna =
            trx.jenis === "keluar"
            ? "previewKeluar"
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

            <select class="kategori">

                <option value="">Pilih kategori</option>

                <option value="Belanja"
                    ${trx.kategori=="Belanja"?"selected":""}>
                    Belanja
                </option>

                <option value="QRIS"
                    ${trx.kategori=="QRIS"?"selected":""}>
                    QRIS
                </option>

                <option value="Transfer"
                    ${trx.kategori=="Transfer"?"selected":""}>
                    Transfer
                </option>

            </select>

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

        const btnCatatan =
            div.querySelector(".btnCatatan");

        const textarea =
            div.querySelector(".catatan");

        btnCatatan.onclick = ()=>{

            textarea.classList.toggle("hidden");

            btnCatatan.textContent =
                textarea.classList.contains("hidden")
                ? "+ Tambahkan catatan"
                : "− Sembunyikan catatan";

        };

    });

    previewCard.style.display = "block";
    btnImport.style.display = "block";

}

// ===================== import =====================

btnImport.onclick = async ()=>{

    if(dataImport.length === 0){

        alert("Belum ada data.");

        return;

    }

    console.log(dataImport);

    alert(
        "Tahap berikutnya:\nKirim ke Apps Script."
    );

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

    content.innerHTML = `
        <p><b>Provider</b> : ${provider.toUpperCase()}</p>
        <p><b>Transaksi</b> : ${data.length}</p>
        <p><b>Siap diimport</b> : ${siap}</p>
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

        const angka =
            text.match(/\d[\d. ]*,00/g);

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

function autoProcess(data, provider){

    return data.map(trx=>{

        trx.provider = provider;

        trx.dompet = provider;

        trx.kategori = "";

        trx.catatan = "";

        trx.dipilih = true;

        autoJenis(trx);
        autoKategori(trx);

        return trx;

    });

}

function autoKategori(trx){

    const ket =
        trx.keterangan.toLowerCase();

    if(ket.includes("qris")){

        trx.kategori = "QRIS";

    }

    else if(ket.includes("shopee")){

        trx.kategori = "Belanja";

    }

    else if(ket.includes("flip")){

        trx.kategori = "Transfer";

    }

    else if(ket.includes("gotagihan")){

        trx.kategori = "Tagihan";

    }

}

function autoJenis(trx){

    if(!trx.jenis){

        trx.jenis = "keluar";

    }

}