if (localStorage.getItem("theme") === "dark") {
    document.documentElement.classList.add("dark");
}

document
    .querySelector('meta[name="theme-color"]')
    .setAttribute(
        "content",
        localStorage.getItem("theme") === "dark"
            ? "#121212"
            : "#f5f7fb"
    );