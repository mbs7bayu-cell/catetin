(function(){

    if(
      localStorage.getItem("activeUser")
    ){
      location.href = "dashboard.html";
    }

})();

const loginBtn = document.getElementById("loginBtn");
const registerBtn = document.getElementById("registerBtn");

function togglePass(){

  const p =
    document.getElementById("password");

  p.type =
    p.type === "password"
    ? "text"
    : "password";
}



function validasi(){

  const password =
    document.getElementById("password")
    .value
    .trim();

  const noHpRaw = document.getElementById("noHp").value.trim();

  const noHp = formatNomorHP(noHpRaw);

  if(!password){

    return "Password wajib diisi";
  }



  if(!noHp){

    return "No HP wajib diisi";
  }



  if (!noHpRaw) {
    return "No HP wajib diisi";
  }

  

  if (noHp.length < 10) {
    return "Nomor HP tidak valid";
  }

  return null;

}



async function login(){

  const error = validasi();
  if(error){
    status(error);
    return;
  }

  const loginBtn = document.getElementById("loginBtn");

  const noHpRaw = document.getElementById("noHp").value.trim();
  const noHp = formatNomorHP(noHpRaw);
  const password = document.getElementById("password").value.trim();

  status("Sedang login...");

  // 🔥 disable tombol
  loginBtn.disabled = true;
  registerBtn.disabled = true;

  loginBtn.innerText = "Memproses...";

  try{

    const passHash =
      await hashPassword(password);

    const { data, error } =
      await db.rpc("login_user", {
        p_no_hp: noHp,
        p_pass_hash: passHash
      });

    if (error) {
      console.error(error);
      status("Terjadi kesalahan saat login");

      loginBtn.disabled = false;
      registerBtn.disabled = false;
      loginBtn.innerText = "Login";

      return;
    }

    const hasil = data;

    const activeUserId =
      localStorage.getItem("activeUserId");

    if (
      activeUserId &&
      activeUserId !== hasil.user.userId
    ) {

      status(
        "Masih ada akun lain yang aktif di browser ini. Logout terlebih dahulu <b>dengan menonaktifkan Always Login</b> di akun yang lain."
      );

      loginBtn.disabled = false;
      registerBtn.disabled = false;
      loginBtn.innerText = "Login";

      return;
    }

    if(!hasil.ok){

      status(hasil.message || "Login gagal");

      // 🔥 aktifkan lagi
      loginBtn.disabled = false;
      registerBtn.disabled = false;

      loginBtn.innerText = "Login";

      return;
    }

    const currentUser = JSON.parse(
      sessionStorage.getItem("user") ||
      localStorage.getItem("user")
    );

    if (
      currentUser &&
      currentUser.userId !== hasil.user.userId
    ) {

      status(
        "Masih ada akun lain yang aktif di browser ini. Logout terlebih dahulu <b>dengan menonaktifkan Always Login</b> di akun yang lain."
      );

      loginBtn.disabled = false;
      registerBtn.disabled = false;
      loginBtn.innerText = "Login";

      return;
    }

    const keepLogin =
      localStorage.getItem("rememberLogin") === "true";

    if(keepLogin){

      localStorage.setItem(
        "user",
        JSON.stringify(hasil.user)
      );

    }else{

      sessionStorage.setItem(
        "user",
        JSON.stringify(hasil.user)
      );

    }

    localStorage.setItem(
      "activeUserId",
      hasil.user.userId
    );

    localStorage.setItem(
      "activeUser",
      JSON.stringify(hasil.user)
    );

    localStorage.setItem(
      "lastActivity",
      Date.now()
    );

    status("Login berhasil");

    setTimeout(() => {
      location.href = "dashboard.html";
    }, 500);

  }catch(err){

    status("Tidak dapat terhubung ke server");

    console.error(err);

    // 🔥 aktifkan lagi kalau error
    loginBtn.disabled = false;
    registerBtn.disabled = false;
    loginBtn.innerText = "Login";
  }
}





function bukaRegister() {
  registerBtn.classList.remove("hidden");
  loginBtn.classList.add("hidden");
  document.getElementById("bukaRegister").classList.add("hidden");
    document.getElementById("bukaLogin").classList.remove("hidden");

}

function bukaLogin() {
  registerBtn.classList.add("hidden");
  loginBtn.classList.remove("hidden");
  document.getElementById("bukaLogin").classList.add("hidden");
  document.getElementById("bukaRegister").classList.remove("hidden");
}



async function register(){


    const error = validasi();

    if(error){
        status(error);
        return;
    }

    const registerBtn =
        document.getElementById("registerBtn");

    const loginBtn =
        document.getElementById("loginBtn");

    const noHpRaw =
        document.getElementById("noHp")
        .value
        .trim();

    const noHp =
        formatNomorHP(noHpRaw);

    const password =
        document.getElementById("password")
        .value
        .trim();

    status("Sedang register...");

    // Disable tombol
    registerBtn.disabled = true;
    loginBtn.disabled = true;

    registerBtn.innerText = "Memproses...";

    try{

        // =========================
        // Hash password
        // =========================

        const passHash =
            hashPassword(password);


        // =========================
        // Register ke Supabase
        // =========================

        const { data, error } =
            await db.rpc(
                "register_user",
                {
                    p_no_hp: noHp,
                    p_pass_hash: passHash
                }
            );


        // =========================
        // Error Supabase
        // =========================

        if(error){

            console.error(error);

            status(
                error.message ||
                "Terjadi kesalahan saat register"
            );

            return;
        }


        // =========================
        // Register gagal
        // =========================

        if(!data || !data.ok){

            status(
                data?.message ||
                "Register gagal"
            );

            return;
        }


        // =========================
        // Register berhasil
        // =========================

        status(
            data.message ||
            "Register berhasil, silakan login."
        );

        // Bersihkan input
        document.getElementById("password")
            .value = "";

        document.getElementById("noHp")
            .value = "";
        
        bukaLogin();


    }catch(err){

        console.error(err);

        status(
            "Tidak dapat terhubung ke server"
        );

    }finally{

        // =========================
        // Aktifkan tombol kembali
        // =========================

        registerBtn.disabled = false;
        loginBtn.disabled = false;

        registerBtn.innerText = "Register";

    }


}



function status(teks){

  document.getElementById("status")
    .innerHTML = teks;
}

// =============================== LUPA PASS ===================================
function bukaModalLupaPassword(){

  document.getElementById(
    "modalLupaPassword"
  ).style.display = "block";

}

function tutupModalLupaPassword(){

  document.getElementById(
    "modalLupaPassword"
  ).style.display = "none";

  document.getElementById(
    "stepOtp"
  ).style.display = "none";

  document.getElementById(
    "stepPassword"
  ).style.display = "none";

  document.getElementById(
    "gmailReset"
  ).value = "";

  document.getElementById(
    "otpReset"
  ).value = "";

  document.getElementById(
    "passwordBaru"
  ).value = "";

}

// ============================ kirim otp reset ========================

async function kirimOtpReset(){

    let gmail =
        document.getElementById(
            "gmailReset"
        ).value;

    gmail = String(gmail)
        .trim()
        .toLowerCase();


    if(!gmail){

        alert("Masukkan Gmail");

        return;

    }


    try {

        // ==========================
        // CEK GMAIL DI SUPABASE
        // ==========================

        const {
            data: user,
            error
        } = await db
            .from("users")
            .select("id_user, gmail")
            .eq("gmail", gmail)
            .maybeSingle();


        if(error){

            console.error(error);

            alert(
                "Terjadi kesalahan saat mencari akun"
            );

            return;

        }


        if(!user){

            alert(
                "Gmail tidak ditemukan"
            );

            return;

        }


        // ==========================
        // SIMPAN DATA RESET SEMENTARA
        // ==========================

        sessionStorage.setItem(
            "resetUserId",
            user.id_user
        );

        sessionStorage.setItem(
            "resetGmail",
            gmail
        );


        // ==========================
        // KIRIM OTP VIA APPS SCRIPT
        // ==========================

        const res =
            await fetch(API, {

                method: "POST",

                body: JSON.stringify({

                    mode: "kirimOtpReset",

                    gmail: gmail

                })

            });


        const data =
            await res.json();


        alert(
            data.message
        );


        if(data.success){

            document.getElementById(
                "stepOtp"
            ).style.display =
                "block";

        }


    } catch(err){

        console.error(err);

        alert(
            "Tidak dapat terhubung ke server"
        );

    }

}

// =========================== verifikasi otp reset =========================

async function verifikasiOtpReset(){

    const gmail =
        sessionStorage.getItem(
            "resetGmail"
        );

    const otp =
        document.getElementById(
            "otpReset"
        ).value
        .trim();


    if(!otp){

        alert(
            "Masukkan kode OTP"
        );

        return;

    }


    try {

        const res =
            await fetch(API, {

                method: "POST",

                body: JSON.stringify({

                    mode: "verifikasiOtpReset",

                    gmail: gmail,

                    otp: otp

                })

            });


        const data =
            await res.json();


        if(data.ok){

            // Tandai OTP sudah berhasil
            sessionStorage.setItem(
                "resetOtpVerified",
                "true"
            );


            document.getElementById(
                "stepPassword"
            ).style.display =
                "block";


        }else{

            alert(
                data.msg ||
                "OTP tidak valid"
            );

        }


    } catch(err){

        console.error(err);

        alert(
            "Gagal memverifikasi OTP"
        );

    }

}

// =================== simpan pass ==========================

async function simpanPasswordBaru(){

    const userId =
        sessionStorage.getItem(
            "resetUserId"
        );

    const otpVerified =
        sessionStorage.getItem(
            "resetOtpVerified"
        );


    if(
        !userId ||
        otpVerified !== "true"
    ){

        alert(
            "Silakan verifikasi OTP terlebih dahulu"
        );

        return;

    }


    const password =
        document.getElementById(
            "passwordBaru"
        ).value
        .trim();


    if(password.length < 6){

        alert(
            "Password minimal 6 karakter"
        );

        return;

    }


    try {

        // ==========================
        // HASH PASSWORD BARU
        // ==========================

        const passHash =
            hashPassword(password);


        // ==========================
        // UPDATE SUPABASE
        // ==========================

        const {
            error
        } = await db
            .from("users")
            .update({
                pass_hash: passHash
            })
            .eq(
                "id_user",
                userId
            );


        if(error){

            console.error(error);

            alert(
                "Gagal mengubah password"
            );

            return;

        }


        alert(
            "Password berhasil diubah"
        );


        // ==========================
        // BERSIHKAN SESSION RESET
        // ==========================

        sessionStorage.removeItem(
            "resetUserId"
        );

        sessionStorage.removeItem(
            "resetGmail"
        );

        sessionStorage.removeItem(
            "resetOtpVerified"
        );


        tutupModalLupaPassword();


    } catch(err){

        console.error(err);

        alert(
            "Terjadi kesalahan saat mengubah password"
        );

    }

}

// ================ toggle pass baru ====================
function togglePasswordBaru(){

  const p =
    document.getElementById(
      "passwordBaru"
    );

  const btn =
    document.getElementById(
      "togglePasswordBaru"
    );

  if(p.type === "password"){

    p.type = "text";
    btn.innerText =
      "🙈 Sembunyikan Password";

  }else{

    p.type = "password";
    btn.innerText =
      "👁 Lihat Password";

  }

}

// ======================= format no hp sudah diawali 62 =======================

function formatNomorHP(input) {
  let nomor = input.trim();
  nomor = nomor.replace(/\D/g, '');

  if (nomor.startsWith('0')) {
    nomor = '62' + nomor.slice(1);
  } else if (!nomor.startsWith('62')) {
    nomor = '62' + nomor;
  }

  return nomor;
}

// =========================== pass hash 256 ======================
function hashPassword(password) {
    return sha256(password);
}