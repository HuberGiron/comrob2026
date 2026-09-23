/*!
 * Start Bootstrap - Modern Business v5.0.7
 * https://startbootstrap.com/template-overviews/modern-business
 * Copyright 2013-2023 Start Bootstrap
 * Licensed under MIT
 */

document.addEventListener("DOMContentLoaded", function () {
    const programToggle = document.getElementById("navbarDropdownPrograma");

    if (!programToggle) {
        return;
    }

    const programMenu = programToggle.nextElementSibling;

    if (!programMenu || !programMenu.classList.contains("dropdown-menu")) {
        return;
    }

    const isEnglish =
        document.documentElement.lang.toLowerCase().startsWith("en") ||
        window.location.pathname.includes("/en/");

    const competitionHref = "competencia-robotica.html";
    const competitionLabel = isEnglish
        ? "Robotics Competition"
        : "Competencia Robótica";

    const linkAlreadyExists = Array.from(
        programMenu.querySelectorAll("a.dropdown-item")
    ).some(function (link) {
        return link.getAttribute("href") === competitionHref;
    });

    if (linkAlreadyExists) {
        return;
    }

    const item = document.createElement("li");
    const link = document.createElement("a");

    link.className = "dropdown-item fs-5";
    link.href = competitionHref;
    link.textContent = competitionLabel;

    item.appendChild(link);
    programMenu.appendChild(item);
});
