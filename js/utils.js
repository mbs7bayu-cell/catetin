function showToast(msg) {

  const div = document.createElement("div");
  div.innerHTML = msg;

  div.style.position = "fixed";
  div.style.bottom = "20px";
  div.style.left = "50%";
  div.style.transform = "translateX(-50%)";
  div.style.background = "#333";
  div.style.color = "#fff";
  div.style.padding = "10px 20px";
  div.style.borderRadius = "8px";
  div.style.zIndex = "9999";

  document.body.appendChild(div);

  setTimeout(() => {
    div.remove();
  }, 2000);
}

// button back
document.addEventListener("click", function (e) {
  if (e.target.classList.contains("btnBack")) {
    goBack();
  }
});

function goBack() {
  if (document.referrer && document.referrer !== window.location.href) {
    window.history.back();
  } else {
    window.location.href = "dashboard.html"; // fallback kalau tidak ada history
  }
}

// =============== bersihkan rupiah ==================
function getNumber(value){
  return Number(value.replace(/\D/g, ""));
}

// ================== format rupiah ==================
function formatInputRupiah(id){

  const input = document.getElementById(id);

  input.addEventListener("input", function () {

    let angka = this.value.replace(/\D/g, "");

    if(!angka){
      this.value = "";
      return;
    }

    this.value = "Rp " + new Intl.NumberFormat("id-ID").format(angka);

  });

}

// ================ format tanggal ===================
function formatTanggal(t){

  const date = new Date(t);

  const hari = String(date.getDate()).padStart(2,"0");
  const bulan = date.toLocaleString("id-ID", { month: "short" });
  const jam = String(date.getHours()).padStart(2,"0");
  const menit = String(date.getMinutes()).padStart(2,"0");

  return `${hari} ${bulan} ${jam}:${menit}`;
}

// ===========toggle menu ==================
function toggleMenu() {
  const menu = document.getElementById("menuList");
  menu.classList.toggle("hidden");
}

// ============== theme ==================
function toggleTheme() {
  document.documentElement.classList.toggle("dark");

  const isDark =
    document.documentElement.classList.contains("dark");

  localStorage.setItem(
    "theme",
    isDark ? "dark" : "light"
  );

  const btn = document.querySelector(".themeBtn");
  if (btn) {
    btn.textContent = isDark ? "☀️" : "🌙";
  }

 updateThemeColor();

//document.documentElement.style.colorScheme =
   // isDark ? "dark" : "light";


}

function loadTheme() {

  const theme = localStorage.getItem("theme");

  if(theme === "dark"){
    document.documentElement.classList.add("dark");
  }else{
    document.documentElement.classList.remove("dark");
  }

  updateThemeColor();

}

  function loadThemeDashboard() {

  const theme = localStorage.getItem("theme");
  const btn = document.querySelector(".themeBtn");

  if (theme === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }

  if (btn) {
    btn.textContent = theme === "dark" ? "☀️" : "🌙";
  }

  updateThemeColor();
}


function updateThemeColor() {
  const meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) return;

  const color = document.documentElement.classList.contains("dark")
    ? "#0b0b0b"
    : "#f2f2ef";

  setTimeout(() => {
    meta.setAttribute("content", color);
  }, 30);
}

// ============== loading ==================
// ============================== loading =====================
function showLoading(text = "Memproses file..."){

    document.querySelector("#loadingImport h3").textContent = text;

    document
        .getElementById("loadingImport")
        .classList.remove("hidden");

}

function hideLoading(){

    document
        .getElementById("loadingImport")
        .classList.add("hidden");

}



