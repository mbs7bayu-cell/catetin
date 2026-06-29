if (localStorage.getItem("theme") === "dark") {
    document.documentElement.classList.add("dark");
    document
        .querySelector('meta[name="theme-color"]')
        .setAttribute("content", "#121212"); // warna dark
} else {
    document
        .querySelector('meta[name="theme-color"]')
        .setAttribute("content", "#3B82C4"); // warna light
}