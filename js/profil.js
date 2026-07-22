// ================= SIMPAN DATA =================

const btnSimpan =
    document.getElementById("btnSimpan");

const status =
    document.getElementById("status");

const namaUser =
    document.getElementById("namaUser");

const user =
    JSON.parse(
        sessionStorage.getItem("user") ||
        localStorage.getItem("user") ||
        localStorage.getItem("activeUser")
    );

if(!user){

    location.href = "login.html";

    throw new Error(
        "Belum login"
    );

}


btnSimpan.addEventListener(
    "click",
    async function () {

        const nama =
            document
                .getElementById("nama")
                .value
                .trim()
                .toUpperCase();

        const gmail =
            document
                .getElementById("gmail")
                .value
                .trim()
                .toLowerCase();

        const error =
            validasi();


        if(!nama){

            showToast(
                "Nama wajib diisi"
            );

            return;

        }


        if(!gmail){

            showToast(
                "Gmail wajib diisi"
            );

            return;

        }


        if(!gmail.includes("@")){

            showToast(
                "Format Gmail tidak valid"
            );

            return;

        }


        if(error){

            showToast(error);

            return;

        }


        btnSimpan.disabled = true;

        btnSimpan.innerText =
            "Menyimpan...";

        status.innerText =
            "Proses...";


        try {

            // ==========================
            // UPDATE PROFIL SUPABASE
            // ==========================

            const {
                data,
                error
            } = await db
                .from("users")
                .update({
                    nama: nama,
                    gmail: gmail
                })
                .eq(
                    "id_user",
                    user.userId
                )
                .select()
                .single();


            if(error){

                console.error(
                    "Gagal simpan profil:",
                    error
                );

                showToast(
                    "Gagal menyimpan profil"
                );

                status.innerText =
                    "❌ Gagal menyimpan";

                return;

            }


            console.log(
                "Profil berhasil disimpan:",
                data
            );


            // ==========================
            // HAPUS CACHE PROFIL
            // ==========================

            sessionStorage.removeItem(
                "profil"
            );


            // ==========================
            // SELESAI
            // ==========================

            showToast(
                "Profil berhasil disimpan"
            );

            setTimeout(() => {

                location.replace(
                    "dashboard.html"
                );

            }, 1000);


        } catch(err){

            console.error(
                "Error simpan profil:",
                err
            );

            showToast(
                "Gagal menyimpan profil"
            );

            status.innerText =
                "❌ Gagal menyimpan";


        } finally {

            btnSimpan.disabled =
                false;

            btnSimpan.innerText =
                "Simpan";

        }

    }
);


// ================= VALIDASI =================

function validasi(){

    if(
        !document
            .getElementById("nama")
            .value
            .trim()
    ){

        return "Nama wajib diisi";

    }


    if(
        !document
            .getElementById("gmail")
            .value
            .trim()
    ){

        return "Gmail wajib diisi";

    }


    return null;

}


// ================= RESET FORM =================

function resetForm(){

    document
        .getElementById("nama")
        .value = "";

    document
        .getElementById("gmail")
        .value = "";

}


// ================= LOAD =================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        setBottomNavActive(
            "user-profil"
        );

        loadTheme();

    }
);