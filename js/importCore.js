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

        const { data, error } = await db
            .from("categories")
            .select("nama_kategori")
            .eq("id_user", user.userId)
            .eq("jenis", jenis)
            .order("nama_kategori");

        if(error){
            console.error(error);
            kategoriUser[jenis] = [];
            continue;
        }

        kategoriUser[jenis] = data.map(item => item.nama_kategori);

    }

    console.log(kategoriUser);

}

// =================== load dompet ========================
async function loadDompet(provider){

    daftarDompet = await getDompet(user.userId);

    const select = document.getElementById("dompetSelect");

    if(!select) return;

    select.innerHTML = "";

    daftarDompet.forEach(dompet => {

        const option = document.createElement("option");

        option.value = dompet.id;
        option.textContent =
            `${dompet.nama} - Rp ${dompet.saldo.toLocaleString("id-ID")}`;

        select.appendChild(option);

    });

    const cocok = daftarDompet.find(d => {

        const nama = d.nama.toLowerCase();

        return (
            nama.includes(provider.toLowerCase()) ||
            provider.toLowerCase().includes(nama)
        );

    });

    if(cocok){
        select.value = cocok.id;
    }

    console.log("Daftar dompet:", daftarDompet);
    console.log("Value select:", select.value);
}

// ==================== load profil ========================

async function loadProfil(){

    const { data } = await db
        .from("users")
        .select("nama")
        .eq("id_user", user.userId)
        .single();

    namaUserNormal = normal(data?.nama ?? "");

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

        if(dompet.id == trx.dompet){
            return;
        }

        html += `
            <option value="${dompet.id}">
                ${dompet.nama}
            </option>
        `;

    });

    select.innerHTML = html;

    if(trx.dompetTujuan){
        select.value = trx.dompetTujuan;
    }

}