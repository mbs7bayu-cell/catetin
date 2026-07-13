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

    const cache =
      sessionStorage.getItem("profil");

    let r = [];

    if(cache){

      r = JSON.parse(cache);

    }else{

        const res = await fetch(
          API + "?mode=getProfil&id_user=" + user.userId
        );

        r = await res.json();

        sessionStorage.setItem(
        "profil",
        JSON.stringify(r)
        );
        
    }

        console.log(r);

        if(!r.ok){
          listProfil.innerText = "Gagal memuat";
          return;
        }

        const n = r.data;

        namaUser.innerHTML = `
          ${n.nama}
        `;

        gmailUser.innerHTML = `
          ${n.gmail}
        `;

  } catch(err){
    console.log(err);
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