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
        d => d.id == transaksi.dompet
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

    const { data, error } = await db.rpc(
        "import_transaksi",
        {
            p_user: user.userId,
            p_transaksi: [transaksi]
        }
    );

    if(error) throw error;

    if(!data.success){
        throw new Error(data.message);
    }

    sessionStorage.removeItem("dompet");
    sessionStorage.removeItem("laporan");
    localStorage.removeItem("dashboard");

    sessionStorage.setItem(
        "toastMessage",
        "✅ Transaksi berhasil disimpan."
    );

    location.href = "dashboard.html";

    }catch(err){

        console.error(err);
        alert(err.message);

    }finally{

        btnSimpan.disabled = false;
        btnSimpan.textContent = "Simpan Transaksi";

    }

}

formatInputRupiah("nominal");
