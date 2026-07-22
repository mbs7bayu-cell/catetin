// Apps Script
function post(data){
  return fetch(API, {
    method: "POST",
    body: JSON.stringify(data)
  }).then(res => res.json());
}

// ===== DOMPET =====

async function getDompet(userId){
    try {

        const { data, error } = await db
            .from("wallets")
            .select("*")
            .eq("id_user", userId);

        console.log(data);
        console.log(error);

        if(error) throw error;

        return data ?? [];

    } catch(err) {
        console.error("ERROR GET DOMPET:", err);
        return [];
    }
}


async function tambahDompet(dompet) {

  const { data, error } = await db
    .from("wallets")
    .insert(dompet)
    .select()
    .single();

  if (error) {
    return {
      ok: false,
      error: error.message
    };
  }

  return {
    ok: true,
    data
  };
}

async function updateDompet(data){

    const { error } = await db
        .from("wallets")
        .update({
            nama: data.nama,
            tipe: data.tipe
        })
        .eq("id", data.id);

    return {
        ok: !error
    };
}

//================= dashboard =================

async function getDashboard(userId){

    try{

        const { data, error } = await db.rpc(
            "get_dashboard",
            {
                p_user: userId
            }
        );

        if(error) throw error;

        return data;

    }catch(err){

        console.error("ERROR GET DASHBOARD:", err);

        return {
            saldo: 0,
            totalMasuk: 0,
            totalKeluar: 0,
            jumlahKredit: 0,
            totalSisaKredit: 0,
            dompet: [],
            transaksi: []
        };

    }

}

// ===================== simpan pemasukan =======================

async function simpanPemasukan() {

    const data = {
    p_id_user: id_user,
    p_sumber_tujuan: sumber_tujuan,
    p_kategori: kategori,
    p_nominal: nominal,
    p_catatan: catatan
};

const { data: hasil, error } =
    await db.rpc("simpan_pemasukan", data);

}

// ===================== simpan pengeluaran =======================

async function simpanPengeluaran() {

    const data = {
    p_id_user: id_user,
    p_sumber_asal: sumber_asal,
    p_kategori: kategori,
    p_nominal: nominal,
    p_catatan: catatan
};

const { data: hasil, error } =
    await db.rpc("simpan_pengeluaran", data);

}

// ================ get laporan ================================
async function getLaporan(userId){

    try{

        const { data, error } = await db.rpc(
            "get_laporan",
            {
                p_user: userId
            }
        );

        if(error) throw error;

        return data;

    }catch(err){

        console.error(err);

        return {
            summary:{
                saldo:0,
                masuk:0,
                keluar:0
            },
            bulan:{}
        };

    }

}

// ===================== immport transaksi =====================
async function importTransaksi(userId, transaksi){

    const { data, error } = await db.rpc(
        "import_transaksi",
        {
            p_user: userId,
            p_transaksi: transaksi
        }
    );

    if(error) throw error;

    return data;
}