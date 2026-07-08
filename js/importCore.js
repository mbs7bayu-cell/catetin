let daftarDompet = [];

let kategoriUser = {
    masuk: [],
    keluar: [],
    transfer: []
};

let namaUserNormal = "";

// ====================== load kategori ====================================
async function loadKategori(){

    for(const jenis of ["masuk","keluar","transfer"]){

        const res = await fetch(API,{
            method:"POST",
            body:JSON.stringify({
                mode:"getKategori",
                userId:user.userId,
                jenis:jenis
            })
        });

        const hasil = await res.json();

        kategoriUser[jenis] = hasil;

    }

}

// =================== load dompet ========================
async function loadDompet(provider){

    const res = await fetch(API,{
        method:"POST",
        body:JSON.stringify({
            mode:"getDompet",
            userId:user.userId
        })
    });

    const data = await res.json();

    daftarDompet = data;

    const select =
        document.getElementById("dompetSelect");

    if (!select) {
        console.error("dompetSelect belum ada");
        return;
    }
    
    select.innerHTML = "";

    data.forEach(dompet=>{

        const option =
            document.createElement("option");

        option.value = dompet.id_sumber;
        option.textContent = `${dompet.nama} - Rp ${dompet.saldo.toLocaleString("id-ID")}`;

        select.appendChild(option);

    });

    // otomatis pilih sesuai provider
    const cocok = data.find(d => {

        const nama = d.nama.toLowerCase();

        return (
            nama.includes(provider.toLowerCase()) ||
            provider.toLowerCase().includes(nama)
        );

    });

    if(cocok){

        select.value = cocok.id_sumber;

    }

}

// ==================== load profil ========================

async function loadProfil(){

    const res = await fetch(
        API + "?mode=getProfil&id_user=" + user.userId
    );

    const r = await res.json();

    namaUserNormal = normal(r.data?.nama || "");

}

// ======================= auto process =============================
function autoProcess(data, provider){

    return data.map(trx=>{

        trx.provider = provider;

        trx.dompet = null;

        trx.dompetTujuan = "";
        
        trx.biayaAdmin = 0;

        trx.kategori = "";

        trx.catatan = "";

        trx.dipilih = true;

        autoJenis(trx);

        autoTransfer(trx);

        return trx;

    });

}

// ========================= auto jenis ============================
function autoJenis(trx){

    if(!trx.jenis){

        trx.jenis = "keluar";

    }

}

// ============================ auto transfer ==========================
function autoTransfer(trx){

    if(!namaUserNormal) return;

    const ket = normal(trx.keterangan);

    const kataTransfer = [
        "transfer",
        "trf",
        "pemindahbukuan",
        "ditransfer"
    ];

    const adaTransfer =
        kataTransfer.some(k => ket.includes(k));

    if(
        adaTransfer &&
        ket.includes(namaUserNormal)
    ){

        trx.jenis = "transfer";
        trx.kategori = "transfer";

    }

}

// ============================ normal ======================
function normal(str){

    return (str || "")
        .toLowerCase()
        .replace(/[^a-z0-9 ]/g,"")
        .replace(/\s+/g," ")
        .trim();

}

// ============================ isi kategori =========================
function isiKategori(select, trx){

    if(trx.jenis == "transfer"){

        select.innerHTML = `
            <option value="transfer">
                Transfer
            </option>
        `;

        select.value = "transfer";
        return;
    }

    const daftar = kategoriUser[trx.jenis] || [];

    let html = '<option value="">Pilih kategori</option>';

    daftar.forEach(k=>{

        html += `
            <option value="${k}">
                ${k}
            </option>
        `;

    });

    // cari kategori yang cocok
    const ket = (trx.keterangan || "").toLowerCase();

    let dipilih = daftar.find(k =>
        ket.includes(k.toLowerCase())
    );

    if(dipilih){

        trx.kategori = dipilih;

    }else{

        trx.kategori = trx.keterangan;

        html += `
            <option value="${trx.keterangan}" selected>
                ${trx.keterangan} (baru)
            </option>
        `;

    }

    select.innerHTML = html;
    select.value = trx.kategori;
}

// ======================== ISI DOMPET TUJUAN ===========================
function isiDompetTujuan(select, trx){

    let html =
        '<option value="">Pilih dompet tujuan</option>';

    daftarDompet.forEach(dompet=>{

        if(dompet.id_sumber == trx.dompet){
            return;
        }

        html += `
            <option value="${dompet.id_sumber}">
                ${dompet.nama}
            </option>
        `;

    });

    select.innerHTML = html;

    if(trx.dompetTujuan){
        select.value = trx.dompetTujuan;
    }

}