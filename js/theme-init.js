const isDark = localStorage.getItem("theme") === "dark";

if (isDark) {
    document.documentElement.classList.add("dark");
}

const meta = document.querySelector('meta[name="theme-color"]');

if (meta) {
    meta.setAttribute(
        "content",
        isDark ? "#121212" : "#f5f7fb"
    );
}