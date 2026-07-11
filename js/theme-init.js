const isDark = localStorage.getItem("theme") === "dark";

if (isDark) {
    document.documentElement.classList.add("dark");
}

const meta = document.querySelector('meta[name="theme-color"]');

if (meta) {
    meta.setAttribute(
        "content",
        isDark ? "#0b0b0b" : "#f2f2ef"
    );
}

//document.documentElement.style.colorScheme =
 //   isDark ? "dark" : "light";