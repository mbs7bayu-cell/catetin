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

document.addEventListener("DOMContentLoaded", () => {

  loadTheme();

});

// ================= get  profil =================
async function getProfil(){

    setBottomNavActive("user-profil");

    try {

        const {
            data,
            error
        } = await db
            .from("users")
            .select(`
                id_user,
                no_hp,
                nama,
                gmail,
                role
            `)
            .eq("id_user", user.userId)
            .single();

        if(error){

            console.error(
                "Gagal mengambil profil:",
                error
            );

            return;
        }

        console.log("Data profil:", data);

        // ==========================
        // Tampilkan nama
        // ==========================

        namaUser.innerHTML =
            data.nama || "-";


        // ==========================
        // Tampilkan Gmail
        // ==========================

        gmailUser.innerHTML =
            data.gmail || "-";


    } catch(err){

        console.error(
            "Error getProfil:",
            err
        );

    }
}

function aturProfil(){
  window.location.href = "profil.html";
}

function backProfil(){
  window.location.href = "dashboard.html";
}

window.addEventListener("DOMContentLoaded", () => {
  getProfil();
});