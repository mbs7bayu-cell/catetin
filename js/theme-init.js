if (localStorage.getItem("theme") === "dark") {
    document.documentElement.classList.add("dark");
}

const meta = document.querySelector('meta[name="theme-color"]');

if (meta) {
    meta.setAttribute(
        "content",
        localStorage.getItem("theme") === "dark"
            ? "#121212"
            : "#f5f7fb"
    );
}