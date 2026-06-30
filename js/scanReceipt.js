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

function cariNominal(text){

    const pola = [

        /^Grand Total\s+([\d.,]+)/im,

        /^Jumlah Bayar\s+([\d.,]+)/im,

        /^Total Belanja\s+([\d.,]+)/im,

        /^Total\s+([\d.,]+)/im

    ];

    for(const regex of pola){

        const hasil = text.match(regex);

        if(hasil){

            return Number(
                hasil[1]
                    .replace(/\./g,"")
                    .replace(/,/g,"")
            );

        }

    }

    return 0;

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

    const trx = {
        provider: "receipt",
        tanggal: "",
        jam: "",
        nominal: 0,
        jenis: "keluar",
        kategori: "",
        dompet: "",
        dompetTujuan: "",
        keterangan:"Belanja",
        catatan: "",
        dipilih: true
    };

    // ================= Total =================

    const total =
        text.match(/Total\s+([\d.,]+)/i);

    if(total){

        trx.nominal =
            cariNominal(text);

    }

    // ================= Tanggal =================

    const tgl =
        text.match(/Tgl\.\s*(\d{2}-\d{2}-\d{4})/i);

    if(tgl){

        const [bulan,hari,tahun] = tgl[1].split("-");

        trx.tanggal =
            `${tahun}-${bulan}-${hari}`;

    }

    // ================= Jam =================

    const jam =
        text.match(/(\d{2}:\d{2}:\d{2})/);

    if(jam){

        trx.jam = jam[1];

    }

    // ================= Nama toko =================

    const toko =
        text.match(/Alfamart/i);

    if(toko){

        trx.catatan = toko[0];

    }

    return trx;

}

async function OCR(file){

    const {
        data:{text}
    } =
    await Tesseract.recognize(
        file,
        "ind"
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