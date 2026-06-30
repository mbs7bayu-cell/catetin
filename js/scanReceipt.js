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

btnCamera.onclick=()=>{

    cameraInput.click();

}

btnGallery.onclick=()=>{

    galleryInput.click();

}

cameraInput.onchange = handleFile;

galleryInput.onchange = handleFile;

function ambilAngkaTerbesar(baris){

    const angka =
        baris.match(/\d[\d.,]*/g);

    if(!angka) return 0;

    let terbesar = 0;

    angka.forEach(a=>{

        const nilai =
            normalNominal(a);

        if(nilai > terbesar){

            terbesar = nilai;

        }

    });

    return terbesar;

}

function extractNominal(text){

    const lines = text
        .split("\n")
        .map(x => x.trim())
        .filter(Boolean);

    const regexKeyword = [

        /^grand total\b/i,
        /^jumlah bayar\b/i,
        /^jumlah dibayar\b/i,
        /^total pembayaran\b/i,
        /^total belanja\b/i,

        /^\s*total\s+\d/i, // Total 73,333
        /^\s*total\s*$/i   // Total (angka di baris berikutnya)

    ];

    // Cari berdasarkan keyword
    for(let i=0;i<lines.length;i++){

        const line = lines[i];

        if(regexKeyword.some(r => r.test(line))){

            // angka pada baris yang sama
            let nominal =
                ambilAngkaTerbesar(line);

            // kalau tidak ada, cek 2 baris berikutnya
            if(!nominal){

                for(
                    let j=i+1;
                    j<=i+2 && j<lines.length;
                    j++
                ){

                    nominal =
                        ambilAngkaTerbesar(lines[j]);

                    if(nominal) break;

                }

            }

            if(nominal){

                return nominal;

            }

        }

    }

    // fallback
    const semua =
        text.match(/\d{1,3}(?:[.,]\d{3})+/g);

    if(!semua) return 0;

    return normalNominal(
        semua[semua.length-1]
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

    // 06-30-2026 (MM-dd-yyyy)
    if(/^\d{2}-\d{2}-\d{4}$/.test(tgl)){

        const [b,h,t] = tgl.split("-");

        return `${t}-${b}-${h}`;

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

    const text = await OCR(file);

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

    const {
        data:{text}
    } =
    
    await Tesseract.recognize(
        file,
        "ind+eng"
    );

    return text;

}

function tampilkanPreview(){

    document.getElementById("tanggal").value =
        transaksi.tanggal;

    document.getElementById("jam").value =
        transaksi.jam;

    document.getElementById("nominal").value =
        transaksi.nominal;

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

btnSimpan.onclick = async()=>{

    transaksi.tanggal = tanggal.value;
    transaksi.jam = jam.value;
    transaksi.nominal = Number(nominal.value);
    transaksi.jenis = jenis.value;
    transaksi.kategori = kategori.value;
    transaksi.dompet = dompetSelect.value;
    transaksi.catatan = catatan.value;

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