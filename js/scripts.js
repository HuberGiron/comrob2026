/*!
 * Start Bootstrap - Modern Business v5.0.7
 * https://startbootstrap.com/template-overviews/modern-business
 * Copyright 2013-2023 Start Bootstrap
 * Licensed under MIT
 */

// Funcionalidad original: agregar acceso a la competencia en el menú Programa.
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

/* COMRob 2026: patrocinadores, ponencia de Qin Lin y programa de sesiones.
 * Se aplica a las versiones ES/EN sin reemplazar el HTML de las demás secciones.
 * Los títulos y asignaciones de los 91 artículos proceden del Excel depurado.
 */
(function () {
    "use strict";

    const thisScript = document.currentScript;
    const scriptsUrl = thisScript && thisScript.src ? thisScript.src : "js/scripts.js";
    const isEnglish = document.documentElement.lang.toLowerCase().startsWith("en") ||
        window.location.pathname.includes("/en/");
    const T = isEnglish ? {
        building: "Building", room: "Room", location: "Location",
        topic: "Topic", topics: "Topics", papers: "papers",
        article: "Paper", information: "View papers", close: "Close",
        session: "Technical session", schedule: "Scheduled technical sessions",
        exactTime: "Times refer to the session block; individual paper times have not been assigned.",
        missing: "Can't find your paper in the program? Email",
        email: "comrob26@ibero.mx", show: "See room and papers",
        generalIniAt: "general INIAT location; exact room to be confirmed",
        posterior: "Poster Session", posterLocation: "Lobby of the Fernando Bustos Barrena Auditorium",
        kelly: "Rafael Kelly Award Session (parallel to Technical Sessions, Block 2)",
        select: "Select a room to see its topic, location, paper numbers and titles.",
        level1: "Level 1", level2: "Level 2", basement: "Basement", ground: "Ground floor",
        mixed: "Mixed-topic session"
    } : {
        building: "Edificio", room: "Sala", location: "Ubicación",
        topic: "Temática", topics: "Temáticas", papers: "ponencias",
        article: "Artículo", information: "Ver artículos", close: "Cerrar",
        session: "Sesión técnica", schedule: "Sesiones técnicas programadas",
        exactTime: "El horario corresponde al bloque; no se ha asignado una hora individual a cada artículo.",
        missing: "¿No encuentras tu artículo en el programa? Escríbenos a",
        email: "comrob26@ibero.mx", show: "Ver sala y artículos",
        generalIniAt: "ubicación general de INIAT; aula específica por confirmar",
        posterior: "Sesión de pósteres", posterLocation: "Vestíbulo del Auditorio Fernando Bustos Barrena",
        kelly: "Sesión del Premio Rafael Kelly (en paralelo a las sesiones técnicas, bloque 2)",
        select: "Selecciona una sala para consultar temática, ubicación, números y títulos de artículos.",
        level1: "Nivel 1", level2: "Nivel 2", basement: "Sótano", ground: "Planta baja",
        mixed: "Sesión de temática mixta"
    };
    const newTitle = "Foundations of Disturbance Reconstructability, Learning, and Control for Safe Robotic Autonomy";
    const oldTitles = [
        "De la ficción a la función: control robótico seguro y confiable bajo las tres leyes",
        "From Fiction to Function: Safe and Reliable Robotic Control under the Three Laws"
    ];

    function escapeHtml(value) {
        return String(value).replace(/[&<>"']/g, function (character) {
            return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character];
        });
    }

    function translatedLevel(level) {
        if (!isEnglish) {
            return level;
        }
        if (/sótano/i.test(level)) return T.basement;
        if (/planta baja/i.test(level)) return T.ground;
        if (/nivel 1/i.test(level)) return T.level1;
        if (/nivel 2/i.test(level)) return T.level2;
        return level;
    }

    function roomLocation(session) {
        if (session.room === "INIAT") {
            return T.building + " M · " + T.level1;
        }
        return T.building + " " + session.building + " · " + translatedLevel(session.level);
    }

    const englishTopics = {
        T01: "Control and Modeling of Robotic Systems",
        T02: "Mobile, Autonomous and Field Robotics",
        T03: "Robot Platforms and Design",
        T04: "Applied Robotics",
        T05: "Perception, Intelligence and Human-Robot Interaction",
        T06: "Active Disturbance Rejection Control (ADRC)"
    };
    function paperTopic(paper) {
        return isEnglish ? (englishTopics[paper.topicId] || paper.topic) : paper.topic;
    }
    function sessionTopics(session) {
        return Array.from(new Set(session.papers.map(paperTopic)));
    }

    function addStyles() {
        if (document.getElementById("comrob-program-styles")) return;
        const style = document.createElement("style");
        style.id = "comrob-program-styles";
        style.textContent = "\n" +
            ".comrob-sponsor-logo{width:100%;max-width:225px;max-height:104px;object-fit:contain;}\n" +
            ".comrob-room-btn{height:100%;min-height:105px;transition:background-color .15s ease,border-color .15s ease;text-align:left;white-space:normal;}\n" +
            ".comrob-room-btn:hover,.comrob-room-btn:focus-visible{background-color:#fff2f3;border-color:#b02a37;}\n" +
            ".comrob-room-btn .comrob-room-name{font-size:.98rem;font-weight:700;line-height:1.2;}\n" +
            ".comrob-room-btn .comrob-room-topic{font-size:.82rem;line-height:1.3;}\n" +
            ".comrob-paper-list{counter-reset:none;padding-left:0;list-style:none;}\n" +
            ".comrob-paper-list>li{border-bottom:1px solid #e9ecef;padding:.7rem 0;display:flex;align-items:flex-start;gap:.8rem;}\n" +
            ".comrob-paper-list>li:last-child{border-bottom:0;}\n" +
            ".comrob-paper-number{flex:0 0 3rem;font-size:.84rem;margin-top:.12rem;}\n" +
            ".comrob-paper-title{overflow-wrap:anywhere;line-height:1.45;}\n" +
            ".comrob-location-line{font-size:.84rem;color:#495057;}\n";
        document.head.appendChild(style);
    }

    function updateSponsors() {
        const header = document.getElementById("sponsors");
        if (!header) return;
        const row = header.nextElementSibling;
        if (!row || !row.classList.contains("row") || row.dataset.comrobSponsorsUpdated === "true") return;
        // Conserva los siete patrocinadores ya publicados. En inglés corrige las rutas
        // relativas y los <div> anidados incorrectamente en la versión preexistente.
        const prefix = isEnglish ? "../assets/" : "assets/";
        const sponsors = [
            ["logotipo-IBERO-cdmx.png", "IBERO"],
            ["IEEE.jpg", "IEEE"],
            ["abb.svg", "ABB"],
            ["festo.svg", "Festo"],
            ["map.svg", "MAP"],
            ["booster.png", "Booster"],
            ["skykof.png", "Skykof"],
            ["multion.svg", "MultiON"]
        ];
        row.innerHTML = sponsors.map(function (entry) {
            return '<div class="col-6 col-md-3 d-flex justify-content-center align-items-center">' +
                '<img class="img-fluid comrob-sponsor-logo" loading="lazy" alt="' + escapeHtml(entry[1]) +
                '" src="' + prefix + encodeURIComponent(entry[0]) + '"></div>';
        }).join("\n");
        row.dataset.comrobSponsorsUpdated = "true";
    }

    function updateQinLinTalk() {
        // Solo los elementos con el título anterior: no altera semblanzas ni resúmenes.
        document.querySelectorAll(".fw-semibold.text-danger").forEach(function (element) {
            const original = element.textContent.trim();
            if (oldTitles.includes(original)) element.textContent = newTitle;
        });
    }

    function technicalRows(root) {
        return Array.from(root.querySelectorAll("table tbody tr")).filter(function (row) {
            const cells = row.querySelectorAll("td");
            if (cells.length !== 2) return false;
            return /^(SESIONES TÉCNICAS, Bloque|Technical Sessions, Block)\s*[123]/i.test(cells[1].textContent.trim());
        });
    }

    function updateScheduleText(root) {
        Array.from(root.querySelectorAll("table tbody tr")).forEach(function (row) {
            const cells = row.querySelectorAll("td");
            if (cells.length !== 2) return;
            const activity = cells[1];
            const label = activity.textContent.trim();
            if (label === "Sesión de posters" || label === "Poster Session") {
                activity.innerHTML = '<div class="fw-semibold">' + escapeHtml(T.posterior) + '</div>' +
                    '<div class="small text-muted mt-1"><i class="bi bi-geo-alt me-1" aria-hidden="true"></i>' +
                    escapeHtml(T.posterLocation) + ' · ' + escapeHtml(T.building + ' S · ' + T.level2) + '</div>';
            }
            if (/^(SESIONES TÉCNICAS, Bloque 2|Technical Sessions, Block 2)$/i.test(label)) {
                // Se conserva el bloque 2 y se aclara que la sesión del premio es simultánea.
                activity.innerHTML = '<div class="fw-semibold">' +
                    escapeHtml(isEnglish ? 'Technical Sessions, Block 2' : 'SESIONES TÉCNICAS, Bloque 2') +
                    '</div><div class="small fw-semibold mt-1 text-danger">' + escapeHtml(T.kelly) + '</div>';
            }
            if (/^(SESIONES TÉCNICAS, Bloque 3|Technical Sessions, Block 3)/i.test(label)) {
                activity.textContent = isEnglish ? 'Technical Sessions, Block 3 – ADRC' : 'SESIONES TÉCNICAS, Bloque 3 – ADRC';
            }
        });
    }

    function createSessionModal(session) {
        const modalId = "comrob-session-" + session.id;
        const modal = document.createElement("div");
        const topics = sessionTopics(session);
        const topicLabel = topics.length > 1 ? T.topics : T.topic;
        const itemsHtml = session.papers.map(function (p) {
            const n = String(p.id).padStart(2, "0");
            const subtopic = topics.length > 1 ? '<div class="small text-muted mt-1">' + escapeHtml(paperTopic(p)) + '</div>' : '';
            return '<li><span class="badge bg-danger comrob-paper-number">#' + escapeHtml(n) +
                '</span><div class="comrob-paper-title"><div>' + escapeHtml(p.title) +
                '</div>' + subtopic + '</div></li>';
        }).join("\n");
        modal.className = "modal fade";
        modal.id = modalId;
        modal.tabIndex = -1;
        modal.setAttribute("aria-labelledby", modalId + "-title");
        modal.setAttribute("aria-hidden", "true");
        modal.innerHTML = '<div class="modal-dialog modal-lg modal-dialog-scrollable"><div class="modal-content">' +
            '<div class="modal-header bg-danger text-white"><div>' +
            '<div class="small text-white-50">' + escapeHtml(T.session + ' · ' + session.date + ' · ' + session.start + '–' + session.end) + '</div>' +
            '<h2 class="modal-title h5 mb-0" id="' + modalId + '-title">' + escapeHtml(session.room) + '</h2>' +
            '</div><button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="' + escapeHtml(T.close) + '"></button></div>' +
            '<div class="modal-body px-4 py-3"><div class="small text-muted mb-2"><strong>' + escapeHtml(T.location) + ':</strong> ' + escapeHtml(roomLocation(session)) + '</div>' +
            '<div class="mb-3"><strong>' + escapeHtml(topicLabel) + ':</strong> ' + escapeHtml(topics.join(' / ')) + '</div>' +
            '<h3 class="h6 fw-bold">' + escapeHtml(session.papers.length + ' ' + T.papers) + '</h3>' +
            '<ol class="comrob-paper-list">' + itemsHtml + '</ol>' +
            '<p class="small text-muted mb-0">' + escapeHtml(T.exactTime) + '</p></div>' +
            '<div class="modal-footer"><button type="button" class="btn btn-secondary" data-bs-dismiss="modal">' + escapeHtml(T.close) + '</button></div>' +
            '</div></div>';
        document.body.appendChild(modal);
        return modalId;
    }

    function renderTechnicalSessions(root, sessions) {
        if (!Array.isArray(sessions) || sessions.length !== 15) {
            console.error("COMRob: se esperaban 15 sesiones en el archivo de programación.");
            return;
        }
        const rows = technicalRows(root);
        if (rows.length !== 3) {
            console.error("COMRob: se esperaban 3 bloques en el cronograma.");
            return;
        }
        rows.forEach(function (row, index) {
            const activity = row.querySelectorAll("td")[1];
            if (activity.querySelector(".comrob-session-grid")) return;
            const day = index + 1;
            const daySessions = sessions.filter(s => s.day === day);
            if (daySessions.length !== 5) {
                console.error("COMRob: se esperaban 5 sesiones en el día", day);
                return;
            }
            
            const grid = document.createElement("div");
            grid.className = "row row-cols-1 row-cols-sm-2 g-2 mt-1 comrob-session-grid";
            daySessions.forEach(function (session) {
                const modalId = createSessionModal(session);
                const col = document.createElement("div");
                col.className = "col";
                const btn = document.createElement("button");
                btn.type = "button";
                btn.className = "btn btn-light border w-100 p-3 comrob-room-btn";
                btn.setAttribute("data-bs-toggle", "modal");
                btn.setAttribute("data-bs-target", "#" + modalId);
                btn.setAttribute("aria-label", T.show + ": " + session.room);
                btn.innerHTML = '<span class="d-block comrob-room-name mb-1">' + escapeHtml(session.room) + '</span>' +
                    '<span class="d-block text-muted comrob-room-topic mb-1">' + escapeHtml(sessionTopics(session).join(' / ')) + '</span>' +
                    '<span class="d-block comrob-location-line mb-1"><i class="bi bi-geo-alt" aria-hidden="true"></i> ' + escapeHtml(roomLocation(session)) + '</span>' +
                    '<span class="d-block small fw-semibold text-danger">' + session.papers.length + ' ' + escapeHtml(T.papers) + ' · ' + escapeHtml(T.information) + ' <i class="bi bi-chevron-right" aria-hidden="true"></i></span>';
                col.appendChild(btn);
                grid.appendChild(col);
            });
            activity.appendChild(grid);
        });
        if (!document.getElementById("comrob-missing-paper-note")) {
            const note = document.createElement("div");
            note.id = "comrob-missing-paper-note";
            note.className = "alert alert-light border-start border-4 border-danger shadow-sm mt-2 mb-4";
            note.setAttribute("role", "note");
            const subj = isEnglish ? "COMRob 2026 - Paper not found in program" : "COMRob 2026 - Artículo no localizado en el programa";
            note.innerHTML = '<i class="bi bi-envelope text-danger me-1" aria-hidden="true"></i>' +
                escapeHtml(T.missing) + ' <a class="fw-semibold link-danger" href="mailto:' +
                T.email + '?subject=' + encodeURIComponent(subj) + '">' + T.email + '</a>.';
            // Se coloca tras la última tabla y antes del taller especial.
            const lastCard = rows[2].closest(".card");
            if (lastCard && lastCard.parentElement) lastCard.insertAdjacentElement("afterend", note);
        }
    }

    document.addEventListener("DOMContentLoaded", function () {
        updateQinLinTalk();
        if (document.getElementById("sponsors")) {
            addStyles();
            updateSponsors();
        }
        const scheduleRoot = document.getElementById("general-schedule");
        if (!scheduleRoot) return;
        addStyles();
        updateScheduleText(scheduleRoot);
        const programScript = document.createElement("script");
        programScript.src = new URL("comrob2026-ponencias.js?v=20261013", scriptsUrl).href;
        programScript.async = true;
        programScript.onload = function () {
            const sessions = window.COMROB2026_PONENCIAS;
            renderTechnicalSessions(scheduleRoot, sessions);
        };
        programScript.onerror = function () {
            console.error("COMRob: no se pudo cargar el archivo de ponencias.");
        };
        document.head.appendChild(programScript);
    });
}());
