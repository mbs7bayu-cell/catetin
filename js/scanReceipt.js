const user =
JSON.parse(
    sessionStorage.getItem("user") ||
    localStorage.getItem("user") ||
    localStorage.getItem("activeUser")
);

if(!user){
    location.href="login.html";
    throw new Error("Belum login");
}

const btnCamera =
document.getElementById("btnCamera");

const btnGallery =
document.getElementById("btnGallery");

const cameraInput =
document.getElementById("cameraInput");

const galleryInput =
document.getElementById("galleryInput");

const infoFile =
document.getElementById("infoFile");

const previewCard =
document.getElementById("previewCard");

const btnSimpan =
document.getElementById("btnSimpan");

let transaksi = {};

let worker = null;

document.addEventListener("DOMContentLoaded", async () => {

      setBottomNavActive("dashboard");

    
});

async function resizeImage(file){

    const img =
        await createImageBitmap(file);

    const maxWidth = 1400;

    const scale =
        Math.min(
            1,
            maxWidth / img.width
        );

    const canvas =
        document.createElement("canvas");

    canvas.width =
        img.width * scale;

    canvas.height =
        img.height * scale;

    canvas
        .getContext("2d")
        .drawImage(
            img,
            0,
            0,
            canvas.width,
            canvas.height
        );

    return new Promise(resolve=>{

        canvas.toBlob(

            resolve,

            "image/jpeg",

            0.9

        );

    });

}

async function getWorker(){

    if(worker)
        return worker;

    worker = await Tesseract.createWorker("ind");

    await worker.setParameters({

        tessedit_char_whitelist:
        "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz.,:/- "

    });

    return worker;

}

window.addEventListener(

    "load",

    ()=>{

        getWorker();

    }

);

window.addEventListener(

    "beforeunload",

    async()=>{

        if(worker){

            await worker.terminate();

        }

    }

);

btnCamera.onclick=()=>{

    cameraInput.click();

}

btnGallery.onclick=()=>{

    galleryInput.click();

}

cameraInput.onchange = handleFile;

galleryInput.onchange = handleFile;

function normalOCR(text){

    return text
        .replace(/\bbelania\b/gi,"belanja")
        .replace(/\blotal\b/gi,"total")
        .replace(/\biotal\b/gi,"total")
        .replace(/\btotal\b/gi,"total")
        .replace(/\bt0tal\b/gi,"total")
        .replace(/\btofal\b/gi,"total");

}

function ambilNominalBaris(line){

    const angka =
        line.match(/\d[\d.,]*/g);

    if(!angka) return 0;

    return normalNominal(
        angka[angka.length - 1]
    );

}

function skorBaris(line){

    const low = line.toLowerCase();

    let skor = 0;

    // ================= Positif =================

    if(low.includes("grand total")) skor += 120;

    if(low.includes("total belanja")) skor += 110;

    if(low.includes("jumlah bayar")) skor += 105;

    if(low.includes("jumlah dibayar")) skor += 105;

    if(low.includes("total pembayaran")) skor += 105;

    // OCR kadang membaca Total menjadi Lotal/Iotal/T0tal
    if(
        /^total\b/.test(low) ||
        /^[a-z]otal\b/.test(low) ||
        /^t.tal\b/.test(low)
    ){
        skor += 90;
    }

    // ================= Negatif =================

    if(low.includes("subtotal")) skor -= 120;

    if(low.includes("item")) skor -= 100;

    if(low.includes("disc")) skor -= 100;

    if(low.includes("diskon")) skor -= 100;

    if(low.includes("ppn")) skor -= 100;

    if(low.includes("dpp")) skor -= 100;

    if(low.includes("pajak")) skor -= 90;

    if(low.includes("service")) skor -= 90;

    if(low.includes("tunai")) skor -= 80;

    if(low.includes("kembalian")) skor -= 80;

    if(low.includes("a-poin")) skor -= 70;

    if(low.includes("voucher")) skor -= 70;

    if(low.includes("cashback")) skor -= 70;

    if(low.includes("biaya")) skor -= 60;

    return skor;

}

function extractNominal(text){

    text = normalOCR(text);

    const lines = text
        .split("\n")
        .map(x => x.trim())
        .filter(Boolean);

    let skorTerbaik = -999;
    let nominal = 0;

    for(let i = 0; i < lines.length; i++){

        const line = lines[i];

        let skor = skorBaris(line);

        if(skor <= 0)
            continue;

        const low = line.toLowerCase();

        if(
            low.includes("ppn") ||
            low.includes("dpp") ||
            low.includes("subtotal") ||
            low.includes("diskon") ||
            low.includes("disc")
        ){
            continue;
        }

        // ================= BONUS POSISI =================

        const posisi = i / lines.length;

        // semakin bawah semakin tinggi
        skor += posisi * 20;

        // ================= AMBIL NOMINAL =================

        const angka = ambilNominalBaris(line);

        if(!angka)
            continue;

        if(
            skor > skorTerbaik ||
            (skor === skorTerbaik && angka > nominal)
        ){

            skorTerbaik = skor;
            nominal = angka;

        }

    }

    if(nominal)
        return nominal;

    // fallback
    const semua =
        text.match(/\d{1,3}(?:[.,]\d{3})+/g);

    if(!semua)
        return 0;

    return normalNominal(
        semua[semua.length - 1]
    );

}

function normalNominal(str){

    return Number(
        str
            .replace(/[^\d]/g,"")
    );

}

function extractTanggal(text){

    const pola=[

        /\d{2}\/\d{2}\/\d{4}/,

        /\d{2}-\d{2}-\d{4}/,

        /\d{4}-\d{2}-\d{2}/,

        /\d{2}\s+[A-Za-z]{3,9}\s+\d{4}/

    ];

    for(const p of pola){

        const m=text.match(p);

        if(m){

            return formatTanggal(m[0]);

        }

    }

    return "";

}

function formatTanggal(tgl){

    tgl = tgl.trim();

    // 30/06/2026
    if(/^\d{2}\/\d{2}\/\d{4}$/.test(tgl)){

        const [h,b,t] = tgl.split("/");

        return `${t}-${b}-${h}`;

    }

    // xx-xx-xxxx
    if(/^\d{2}-\d{2}-\d{4}$/.test(tgl)){

        const [a,b,t] = tgl.split("-");

        // Jika angka pertama > 12 berarti dd-MM-yyyy
        if(Number(a) > 12){

            return `${t}-${b}-${a}`;

        }

        // Jika angka kedua > 12 berarti MM-dd-yyyy
        if(Number(b) > 12){

            return `${t}-${a}-${b}`;

        }

        // Jika keduanya <=12, default Indonesia (dd-MM-yyyy)
        return `${t}-${b}-${a}`;

    }

    // 2026-06-30
    if(/^\d{4}-\d{2}-\d{2}$/.test(tgl)){

        return tgl;

    }

    // 19 JUN 2026 / 19 Jun 2026 / 19 Juni 2026
    const bulan = {

        jan:"01",
        januari:"01",

        feb:"02",
        februari:"02",

        mar:"03",
        maret:"03",

        apr:"04",
        april:"04",

        mei:"05",

        jun:"06",
        juni:"06",

        jul:"07",
        juli:"07",

        agu:"08",
        agustus:"08",
        aug:"08",
        august:"08",

        sep:"09",
        september:"09",

        okt:"10",
        oktober:"10",
        oct:"10",
        october:"10",

        nov:"11",
        november:"11",

        des:"12",
        desember:"12",
        dec:"12",
        december:"12"

    };

    const m =
        tgl.match(
            /(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/
        );

    if(m){

        const hari = m[1].padStart(2,"0");
        const bln = bulan[m[2].toLowerCase()];
        const tahun = m[3];

        if(bln){

            return `${tahun}-${bln}-${hari}`;

        }

    }

    return "";

}

function extractJam(text){

    if(!jam){

        const now = new Date();

        jam =
            now.toTimeString()
            .substring(0,5);

    }

    const m =
        text.match(/\d{2}:\d{2}(?::\d{2})?/);

    return m ? m[0] : "";

}

function extractMerchant(text){

    const lines = text
        .split("\n")
        .map(x=>x.trim())
        .filter(Boolean);

    const blacklist = [
        "delivered",
        "status",
        "subtotal",
        "total",
        "diskon",
        "ppn",
        "kritik",
        "saran",
        "email",
        "lunas",
        "ref.",
        "tgl",
        "biaya",
        "bayar"
    ];

    for(const line of lines){

        const low = line.toLowerCase();

        if(
            line.length < 3 ||
            blacklist.some(x=>low.includes(x))
        ){
            continue;
        }

        return line;

    }

    return "";

}

async function handleFile(){

    const file=this.files[0];

    if(!file)return;

    infoFile.textContent=file.name;

    showLoading("Membaca bukti transaksi...");

    try{

        await loadKategori();

        await loadProfil();

        transaksi = await parseReceipt(file);

        isiKategori(
            document.getElementById("kategori"),
            transaksi
        );

        await loadDompet(transaksi.provider);

        document.getElementById("dompetSelect").value =
            transaksi.dompet;
        
        tampilkanPreview();


    }finally{

        hideLoading();

    }

}

async function parseReceipt(file){

    const resized =
    await resizeImage(file);

    const text =
    await OCR(resized);

    console.log(text);

    return parseReceiptText(text);

}

function parseReceiptText(text){

    return{

        provider:"manual",

        tanggal:extractTanggal(text),

        jam:extractJam(text),

        nominal:extractNominal(text),

        jenis:"keluar",

        kategori:"",

        dompet:"",

        dompetTujuan:"",

        keterangan:"Belanja",

        catatan:extractMerchant(text),

        dipilih:true

    };

}

async function OCR(file){

    const worker = await getWorker();

    const {

        data:{text}

    } = await worker.recognize(file);

    return text;

}

function tampilkanPreview(){

    document.getElementById("tanggal").value =
        transaksi.tanggal;

    document.getElementById("jam").value =
        transaksi.jam;

    document.getElementById("nominal").value =
    "Rp " + transaksi.nominal.toLocaleString("id-ID");

    document.getElementById("jenis").value =
        transaksi.jenis;

    document.getElementById("catatan").value =
        transaksi.catatan;

    // isi kategori
    isiKategori(
        document.getElementById("kategori"),
        transaksi
    );

    previewCard.style.display = "block";

    btnSimpan.style.display = "block";

}

function validasiTransaksi(){

    if(!transaksi.tanggal){
        alert("Tanggal belum diisi.");
        tanggal.focus();
        return false;
    }

    if(transaksi.nominal <= 0){
        alert("Nominal harus lebih dari Rp 0.");
        nominal.focus();
        return false;
    }

    if(!transaksi.kategori){
        alert("Silakan pilih kategori.");
        kategori.focus();
        return false;
    }

    if(!transaksi.dompet){
        alert("Silakan pilih dompet.");
        dompetSelect.focus();
        return false;
    }
    
    const dompet = daftarDompet.find(
        d => d.id_sumber == transaksi.dompet
    );

    if(
        transaksi.jenis === "keluar" &&
        dompet &&
        transaksi.nominal > Number(dompet.saldo)
    ){

        alert(
            `Saldo ${dompet.nama} tidak mencukupi.`
        );

        return false;
    }

    return true;

}

btnSimpan.onclick = async()=>{

    transaksi.tanggal = tanggal.value;
    transaksi.jam = jam.value;
    transaksi.nominal = getNumber(nominal.value);
    transaksi.jenis = jenis.value;
    transaksi.kategori = kategori.value;
    transaksi.dompet = dompetSelect.value;
    transaksi.catatan = catatan.value;

    if(!validasiTransaksi()){
        return;
    }

    btnSimpan.disabled = true;
    btnSimpan.textContent = "Menyimpan...";

    try{

        const res = await fetch(API,{
            method:"POST",
            body:JSON.stringify({

                action:"importTransaksi",

                id_user:user.userId,

                transaksi:[transaksi]

            })
        });

        const hasil = await res.json();

        if(hasil.success){

            // Hapus cache agar dashboard mengambil data terbaru
            sessionStorage.removeItem("dompet");
            sessionStorage.removeItem("laporan");
            localStorage.removeItem("dashboard");

            sessionStorage.setItem(
                "toastMessage",
                "✅ Transaksi berhasil disimpan."
            );

            location.href = "dashboard.html";

        }else{

            alert(hasil.message || "Gagal menyimpan.");

        }

    }catch(err){

        console.error(err);
        alert("Terjadi kesalahan.");

    }finally{

        btnSimpan.disabled = false;
        btnSimpan.textContent = "Simpan Transaksi";

    }

}

formatInputRupiah("nominal");
