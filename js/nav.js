function lihatDompet(){
  window.location.href = "dompet.html";
}

function lihatLaporan(){
  window.location.href = "laporan.html";
}

function lihatDashboard(){
  window.location.href = "dashboard.html";
}

function lihatProfil(){
  window.location.href = "user-profil.html";
}

function setBottomNavActive(menu){

    document.querySelectorAll(".bottomNav button")
        .forEach(btn => btn.classList.remove("active"));

    document.querySelector(`.bottomNav button[data-menu="${menu}"]`)
        ?.classList.add("active");
}