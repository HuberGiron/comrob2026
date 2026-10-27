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

/* COMRob 2026: patrocinadores y programa de sesiones.
 * Se aplica a las versiones ES/EN sin reemplazar el HTML de las demás secciones.
 * Los títulos y asignaciones reflejan el Excel depurado y las actualizaciones del comité.
 */
(function () {
    "use strict";

    const thisScript = document.currentScript;
    const scriptsUrl = thisScript && thisScript.src ? thisScript.src : "js/scripts.js";
    const isEnglish = document.documentElement.lang.toLowerCase().startsWith("en") ||
        window.location.pathname.includes("/en/");
    const T = isEnglish ? {
        building: "Building", room: "Room", auditorium: "Auditorium", location: "Location",
        topic: "Topic", topics: "Topics", papers: "papers",
        article: "Paper", information: "View papers", close: "Close",
        session: "Technical session", schedule: "Scheduled technical sessions",
        exactTime: "Times refer to the session block; individual paper times have not been assigned.",
        missing: "If your paper was accepted but you cannot find it in the program, email",
        email: "comrob26@ibero.mx", show: "See room and papers",
        generalIniAt: "general INIAT location; exact room to be confirmed",
        posterior: "Poster Session", posterLocation: "Lobby of the Fernando Bustos Barrena Auditorium",
        kelly: "Rafael Kelly Award Session (parallel to Technical Sessions)",
        kellyTag: "Rafael Kelly Award Session",
        kellyCandidates: "Rafael Kelly Award Candidates",
        controlNote: "Given the high number of submissions on control, these papers are distributed across the three days and presented alongside other thematic tracks to accommodate all accepted contributions.",
        select: "Select a room to see its topic, location, paper numbers and titles.",
        level1: "Level 1", level2: "Level 2", basement: "Basement", ground: "Ground floor",
        mixed: "Mixed-topic session",
        findPaper: "Find a paper", searchHint: "Search by paper number or title to find its schedule and auditorium.",
        searchInput: "Paper number or title", searchPlaceholder: "E.g. #57 or robot control",
        searchInstructions: "Enter a paper number or words from its title.",
        noResults: "No papers found. Try a different number or title.",
        blockTime: "Session time", results: "matches", moreResults: "More results are available; refine your search.",
        dayNames: ["Monday, October 26, 2026", "Tuesday, October 27, 2026", "Wednesday, October 28, 2026"]
    } : {
        building: "Edificio", room: "Sala", auditorium: "Auditorio", location: "Ubicación",
        topic: "Temática", topics: "Temáticas", papers: "ponencias",
        article: "Artículo", information: "Ver artículos", close: "Cerrar",
        session: "Sesión técnica", schedule: "Sesiones técnicas programadas",
        exactTime: "El horario corresponde al bloque; no se ha asignado una hora individual a cada artículo.",
        missing: "Si tu artículo fue aceptado y no lo encuentras en el programa, escríbenos a",
        email: "comrob26@ibero.mx", show: "Ver sala y artículos",
        generalIniAt: "ubicación general de INIAT; aula específica por confirmar",
        posterior: "Sesión de pósteres", posterLocation: "Vestíbulo del Auditorio Fernando Bustos Barrena",
        kelly: "Sesión del Premio Rafael Kelly (en paralelo a las sesiones técnicas)",
        kellyTag: "Sesión del Premio Rafael Kelly",
        kellyCandidates: "Candidatos al Premio Rafael Kelly",
        controlNote: "Debido al elevado número de artículos recibidos en el área de control, su presentación se distribuye durante los tres días del congreso y se integra con los tracks de otras líneas temáticas, a fin de dar cabida a todas las contribuciones aceptadas.",
        select: "Selecciona una sala para consultar temática, ubicación, números y títulos de artículos.",
        level1: "Nivel 1", level2: "Nivel 2", basement: "Sótano", ground: "Planta baja",
        mixed: "Sesión de temática mixta",
        findPaper: "Buscar artículo", searchHint: "Consulta el día, horario y auditorio buscando por número o título.",
        searchInput: "Número o título del artículo", searchPlaceholder: "Ej. #57 o control de robots",
        searchInstructions: "Escribe el número del artículo o palabras de su título.",
        noResults: "No se encontraron artículos. Prueba con otro número o título.",
        blockTime: "Horario del bloque", results: "resultados", moreResults: "Hay más resultados; especifica mejor tu búsqueda.",
        dayNames: ["Lunes 26 de octubre de 2026", "Martes 27 de octubre de 2026", "Miércoles 28 de octubre de 2026"]
    };
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

    function auditoriumName(session) {
        return session.room === "INIAT" ? "INIAT" : T.auditorium + " " + session.room;
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
        if (isRafaelKellySession(session)) return [T.kellyCandidates];
        return Array.from(new Set(session.papers.map(paperTopic)));
    }

    // Únicamente en el bloque 2 del martes; el lunes también usa este auditorio.
    function isRafaelKellySession(session) {
        return session.id === "D2-S02" && session.day === 2 &&
            session.room === "Ernesto Meneses Morales";
    }

    function addStyles() {
        if (document.getElementById("comrob-program-styles")) return;
        const style = document.createElement("style");
        style.id = "comrob-program-styles";
        style.textContent = "\n" +
            ".comrob-sponsor-logo{width:100%;max-width:225px;max-height:104px;object-fit:contain;}\n" +
            ".comrob-room-btn{height:100%;min-height:105px;transition:background-color .15s ease,border-color .15s ease;text-align:left;white-space:normal;}\n" +
            ".comrob-room-btn:hover,.comrob-room-btn:focus-visible{background-color:#fff2f3;border-color:#b02a37;}\n" +
            ".comrob-room-btn .comrob-room-topic{font-size:.98rem;font-weight:700;line-height:1.25;color:#212529;}\n" +
            ".comrob-room-btn .comrob-room-name{font-size:.82rem;font-weight:400;line-height:1.3;color:#6c757d;}\n" +
            ".comrob-control-note{font-size:.8rem;line-height:1.5;color:#737980;margin-top:1rem;}\n" +
            ".comrob-paper-list{counter-reset:none;padding-left:0;list-style:none;}\n" +
            ".comrob-paper-list>li{border-bottom:1px solid #e9ecef;padding:.7rem 0;display:flex;align-items:flex-start;gap:.8rem;}\n" +
            ".comrob-paper-list>li:last-child{border-bottom:0;}\n" +
            ".comrob-paper-number{flex:0 0 3rem;font-size:.84rem;margin-top:.12rem;}\n" +
            ".comrob-paper-title{overflow-wrap:anywhere;line-height:1.45;}\n" +
            ".comrob-location-line{font-size:.84rem;color:#495057;}\n" +
            ".comrob-paper-search-card{border-left:4px solid #b02a37!important;}\n" +
            ".comrob-search-result{border-bottom:1px solid #e9ecef;padding:1rem .25rem;}\n" +
            ".comrob-search-result:last-child{border-bottom:0;}\n" +
            ".comrob-search-result .comrob-search-paper-title{overflow-wrap:anywhere;line-height:1.4;}\n" +
            ".comrob-search-result .comrob-search-details{font-size:.9rem;}\n" +
            /* Diseño adaptable del cronograma: escritorio intacto; móviles en formato de actividades. */
            "@media(max-width:767.98px){\n" +
            "#general-schedule{padding-top:1.25rem!important;padding-bottom:1.5rem!important;}\n" +
            "#general-schedule>.container{padding-left:.75rem!important;padding-right:.75rem!important;}\n" +
            "#general-schedule>.container>.row{--bs-gutter-x:0;}\n" +
            "#general-schedule .card-header{padding:.85rem 1rem;}\n" +
            "#general-schedule .card-header h2{font-size:1.12rem;}\n" +
            "#general-schedule .table-responsive{overflow-x:visible!important;}\n" +
            "#general-schedule .table{display:block;width:100%!important;margin-bottom:0;}\n" +
            "#general-schedule .table thead{display:none!important;}\n" +
            "#general-schedule .table tbody{display:block;width:100%;}\n" +
            "#general-schedule .table tbody>tr{display:flex!important;flex-direction:column;align-items:stretch;gap:.48rem;width:100%;padding:.86rem .9rem;border-bottom:1px solid #e5e7eb;}\n" +
            "#general-schedule .table tbody>tr:last-child{border-bottom:0;}\n" +
            "#general-schedule .table tbody>tr>td{display:block;box-sizing:border-box;width:100%!important;min-width:0;max-width:100%;padding:0!important;border:0!important;white-space:normal!important;overflow-wrap:anywhere;}\n" +
            "#general-schedule .table tbody>tr>td:first-child{display:inline-flex;align-self:flex-start;width:auto!important;max-width:100%;padding:.26rem .6rem!important;background:#fce8eb;border-radius:.45rem;color:#a61c32!important;font-size:.85rem;font-weight:700;letter-spacing:.01em;white-space:nowrap!important;}\n" +
            "#general-schedule .table tbody>tr>td:nth-child(2){font-size:.97rem;line-height:1.5;}\n" +
            "#general-schedule .table tbody>tr>td:nth-child(2) .fw-semibold{overflow-wrap:anywhere;}\n" +
            "#general-schedule .comrob-session-grid{margin:.65rem 0 0!important;--bs-gutter-x:0;--bs-gutter-y:.58rem;}\n" +
            "#general-schedule .comrob-session-grid>[class*=col]{flex:0 0 100%!important;width:100%!important;max-width:100%!important;padding:0!important;}\n" +
            "#general-schedule .comrob-room-btn{height:auto!important;min-height:0!important;padding:.9rem 1rem!important;}\n" +
            "#general-schedule .comrob-room-btn .comrob-room-topic{font-size:1.04rem!important;line-height:1.38!important;}\n" +
            "#general-schedule .comrob-room-btn .comrob-room-name{font-size:.89rem!important;}\n" +
            "#general-schedule .comrob-paper-search-card .card-body{padding:1rem!important;}\n" +
            "#general-schedule .comrob-paper-search-card .btn{white-space:normal;}\n" +
            "#comrob-paper-search-modal .modal-dialog,.modal[id^=comrob-session-] .modal-dialog{margin:.55rem!important;max-width:calc(100% - 1.1rem)!important;}\n" +
            "#comrob-paper-search-modal .modal-content,.modal[id^=comrob-session-] .modal-content{max-height:calc(100dvh - 1.1rem);overflow:hidden;}\n" +
            "#comrob-paper-search-modal .modal-header,.modal[id^=comrob-session-] .modal-header{padding:.85rem 1rem;}\n" +
            "#comrob-paper-search-modal .modal-body,.modal[id^=comrob-session-] .modal-body{padding:1rem!important;}\n" +
            "#comrob-paper-search-modal .modal-footer,.modal[id^=comrob-session-] .modal-footer{padding:.7rem 1rem;}\n" +
            ".comrob-paper-list>li{gap:.55rem;}\n" +
            ".comrob-paper-number{flex-basis:2.65rem;}\n" +
            "}\n";

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
                    '</div><div class="small fw-semibold mt-1 text-danger">' +
                    escapeHtml(T.kelly + ' · ' + T.auditorium + ' Ernesto Meneses Morales') + '</div>';
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
            '<h2 class="modal-title h5 mb-0" id="' + modalId + '-title">' + escapeHtml(auditoriumName(session)) + '</h2>' +
            '</div><button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="' + escapeHtml(T.close) + '"></button></div>' +
            '<div class="modal-body px-4 py-3"><div class="small text-muted mb-2" data-map-location="' + escapeHtml(auditoriumName(session) + ' · ' + roomLocation(session)) + '" data-map-context="' + escapeHtml(topics.join(' / ')) + '"><i class="bi bi-geo-alt me-1" aria-hidden="true"></i><strong>' + escapeHtml(T.location) + ':</strong> ' + escapeHtml(roomLocation(session)) + '</div>' +
            '<div class="mb-3"><strong>' + escapeHtml(topicLabel) + ':</strong> ' + escapeHtml(topics.join(' / ')) + '</div>' +
            (isRafaelKellySession(session) ? '<div class="small fw-semibold text-danger border-start border-3 border-danger ps-2 mb-3"><i class="bi bi-award me-1" aria-hidden="true"></i>' + escapeHtml(T.kellyTag) + '</div>' : '') +
            '<h3 class="h6 fw-bold">' + escapeHtml(session.papers.length + ' ' + T.papers) + '</h3>' +
            '<ol class="comrob-paper-list">' + itemsHtml + '</ol>' +
            '<p class="small text-muted mb-0">' + escapeHtml(T.exactTime) + '</p>' +
            (session.papers.some(p => p.topicId === "T01" || p.topicId === "T06") ?
                '<p class="comrob-control-note mb-0" role="note">' + escapeHtml(T.controlNote) + '</p>' : '') + '</div>' +
            '<div class="modal-footer"><button type="button" class="btn btn-secondary" data-bs-dismiss="modal">' + escapeHtml(T.close) + '</button></div>' +
            '</div></div>';
        document.body.appendChild(modal);
        return modalId;
    }

    // Consulta transversal del programa: tres días, quince sesiones.
    // La hora mostrada corresponde al bloque técnico, no a una ponencia individual.
    function createPaperSearch(root, sessions) {
        if (document.getElementById("comrob-paper-search-modal")) return;
        const host = root.querySelector(".container > .row > div");
        if (!host) return;
        const modalId = "comrob-paper-search-modal";
        const inputId = "comrob-paper-search-input";
        const statusId = "comrob-paper-search-status";
        const resultsId = "comrob-paper-search-results";

        // El acceso queda antes de las tablas del lunes, martes y miércoles.
        const banner = document.createElement("div");
        banner.className = "card shadow-sm border-0 rounded-3 mb-4 comrob-paper-search-card";
        banner.innerHTML = '<div class="card-body p-3 p-md-4 d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3">' +
            '<div><h2 class="h5 fw-bold mb-1"><i class="bi bi-search text-danger me-2" aria-hidden="true"></i>' +
            escapeHtml(T.findPaper) + '</h2><p class="text-muted small mb-0">' + escapeHtml(T.searchHint) + '</p></div>' +
            '<button type="button" class="btn btn-danger flex-shrink-0" data-bs-toggle="modal" data-bs-target="#' + modalId + '">' +
            '<i class="bi bi-search me-1" aria-hidden="true"></i>' + escapeHtml(T.findPaper) + '</button></div>';
        host.insertBefore(banner, host.firstChild);

        const modal = document.createElement("div");
        modal.className = "modal fade";
        modal.id = modalId;
        modal.tabIndex = -1;
        modal.setAttribute("aria-hidden", "true");
        modal.setAttribute("aria-labelledby", "comrob-paper-search-title");
        modal.innerHTML = '<div class="modal-dialog modal-lg modal-dialog-scrollable"><div class="modal-content">' +
            '<div class="modal-header bg-danger text-white"><h2 class="modal-title h5 mb-0" id="comrob-paper-search-title">' +
            escapeHtml(T.findPaper) + '</h2><button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="' +
            escapeHtml(T.close) + '"></button></div><div class="modal-body p-4">' +
            '<label class="form-label fw-semibold" for="' + inputId + '">' + escapeHtml(T.searchInput) + '</label>' +
            '<div class="input-group mb-3"><span class="input-group-text"><i class="bi bi-search" aria-hidden="true"></i></span>' +
            '<input class="form-control" type="search" id="' + inputId + '" autocomplete="off"' +
            ' aria-controls="' + resultsId + '" aria-describedby="' + statusId + '" placeholder="' +
            escapeHtml(T.searchPlaceholder) + '"></div>' +
            '<p class="small text-muted" id="' + statusId + '" role="status" aria-live="polite"></p>' +
            '<div id="' + resultsId + '"></div>' +
            '<div class="alert alert-light border-start border-4 border-danger small mt-3 mb-0" role="note">' +
            '<i class="bi bi-envelope text-danger me-1" aria-hidden="true"></i>' + escapeHtml(T.missing) + ' ' +
            '<a class="fw-semibold link-danger" href="mailto:' + escapeHtml(T.email) +
            '?subject=' + encodeURIComponent('COMRob 2026 - ' + (isEnglish ? 'Accepted paper not found' : 'Artículo aceptado no localizado')) +
            '">' + escapeHtml(T.email) + '</a>.</div></div>' +
            '<div class="modal-footer"><button type="button" class="btn btn-secondary" data-bs-dismiss="modal">' +
            escapeHtml(T.close) + '</button></div></div></div>';
        document.body.appendChild(modal);

        const input = modal.querySelector("#" + inputId);
        const status = modal.querySelector("#" + statusId);
        const resultList = modal.querySelector("#" + resultsId);
        const papers = sessions.flatMap(function (session) {
            return session.papers.map(function (paper) { return {paper: paper, session: session}; });
        }).sort(function (a, b) { return Number(a.paper.id) - Number(b.paper.id); });

        function normalize(value) {
            return String(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                .toLowerCase().replace(/[-–—:;,._/\\]+/g, " ").trim();
        }
        function updateResults() {
            const query = normalize(input.value);
            if (!query) {
                status.textContent = T.searchInstructions;
                resultList.replaceChildren();
                return;
            }
            // #7, 007, "artículo 7" y "paper 7" buscan el número exacto.
            const numberMatch = /^(?:(?:articulo|paper|numero|no)\s*)?#?\s*0*(\d+)$/.exec(query);
            const words = query.split(/\s+/).filter(Boolean);
            const matches = papers.filter(function (entry) {
                if (numberMatch) return Number(entry.paper.id) === Number(numberMatch[1]);
                const title = normalize(entry.paper.title);
                return words.every(function (word) { return title.includes(word); });
            });
            const visible = matches.slice(0, 25);
            status.textContent = matches.length ? matches.length + " " + T.results +
                (matches.length > visible.length ? ". " + T.moreResults : "") : T.noResults;
            resultList.innerHTML = visible.map(function (entry) {
                const p = entry.paper;
                const session = entry.session;
                const day = T.dayNames[session.day - 1] || session.date;
                return '<article class="comrob-search-result">' +
                    '<div class="d-flex align-items-start gap-2 mb-2"><span class="badge bg-danger flex-shrink-0">#' +
                    escapeHtml(p.id) + '</span><span class="fw-semibold comrob-search-paper-title">' +
                    escapeHtml(p.title) + '</span></div>' +
                    '<div class="comrob-search-details ms-1">' +
                    '<div class="mb-1"><i class="bi bi-calendar-event text-danger me-2" aria-hidden="true"></i>' +
                    escapeHtml(day) + '</div>' +
                    '<div class="mb-1"><i class="bi bi-clock text-danger me-2" aria-hidden="true"></i><strong>' +
                    escapeHtml(T.blockTime) + ':</strong> ' + escapeHtml(session.start + '–' + session.end) + '</div>' +
                    '<div class="mb-1"><i class="bi bi-door-open text-danger me-2" aria-hidden="true"></i><strong>' +
                    escapeHtml(T.room) + ':</strong> ' + escapeHtml(auditoriumName(session)) + '</div>' +
                    '<div class="text-muted" data-map-location="' + escapeHtml(auditoriumName(session) + ' · ' + roomLocation(session)) + '" data-map-context="' + escapeHtml(p.title) + '"><i class="bi bi-geo-alt me-2" aria-hidden="true"></i>' +
                    escapeHtml(roomLocation(session)) + '</div></div></article>';
            }).join("");
        }
        input.addEventListener("input", updateResults);
        modal.addEventListener("shown.bs.modal", function () { input.focus(); input.select(); });
        updateResults();
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
                const topicNames = sessionTopics(session).join(' / ');
                btn.setAttribute("aria-label", T.show + ": " + topicNames + " · " + auditoriumName(session));
                btn.innerHTML = '<span class="d-block comrob-room-topic mb-1">' + escapeHtml(topicNames) + '</span>' +
                    '<span class="d-block text-muted comrob-room-name mb-1">' + escapeHtml(auditoriumName(session)) + '</span>' +
                    (isRafaelKellySession(session) ? '<span class="d-block small fw-semibold text-danger mb-1"><i class="bi bi-award me-1" aria-hidden="true"></i>' + escapeHtml(T.kellyTag) + '</span>' : '') +
                    '<span class="d-block comrob-location-line mb-1" data-map-location="' + escapeHtml(auditoriumName(session) + ' · ' + roomLocation(session)) + '" data-map-context="' + escapeHtml(topicNames) + '"><i class="bi bi-geo-alt" aria-hidden="true"></i> ' + escapeHtml(roomLocation(session)) + '</span>' +
                    '<span class="d-block small fw-semibold text-danger">' + session.papers.length + ' ' + escapeHtml(T.papers) + ' · ' + escapeHtml(T.information) + ' <i class="bi bi-chevron-right" aria-hidden="true"></i></span>';
                col.appendChild(btn);
                grid.appendChild(col);
            });
            activity.appendChild(grid);
        });
        createPaperSearch(root, sessions);
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

    // Revisa actualizaciones del servidor sin que las personas deban forzar la recarga.
    // Nginx entrega no-cache y ETag; las peticiones HEAD comparan versiones sin descargar HTML/JS.
    function enableLiveUpdates() {
        if (!window.fetch || !window.URL || !window.setInterval) return;
        const isSchedule = Boolean(document.getElementById("general-schedule"));
        const isHomepage = Boolean(document.getElementById("sponsors"));
        // No recargar formularios de registro ni otras páginas con información escrita por el usuario.
        if (!isSchedule && !isHomepage) return;
        const scriptResource = new URL(scriptsUrl, document.baseURI);
        const resources = [new URL(window.location.pathname, window.location.origin), scriptResource];
        if (isSchedule) resources.push(new URL("comrob2026-ponencias.js", scriptResource));
        if (isHomepage) resources.push(new URL("../assets/multion.svg", scriptResource));
        resources.forEach(function (url) { url.search = ""; url.hash = ""; });

        const knownVersions = new Map();
        let checking = false;
        let refreshing = false;
        let lastCheck = 0;
        async function checkForUpdates() {
            if (checking || refreshing || document.hidden || Date.now() - lastCheck < 15000) return;
            checking = true;
            lastCheck = Date.now();
            try {
                for (const url of resources) {
                    const response = await fetch(url.href, {
                        method: "HEAD", cache: "no-store", credentials: "same-origin"
                    });
                    if (!response.ok) continue;
                    const version = response.headers.get("ETag") ||
                        [response.headers.get("Last-Modified"), response.headers.get("Content-Length")].join("|");
                    if (!version || version === "|") continue;
                    const previous = knownVersions.get(url.href);
                    if (previous && previous !== version) {
                        // No interrumpir al lector en mitad del buscador ni de un modal.
                        if (document.querySelector(".modal.show") || document.querySelector("[data-map-navigation]:not([hidden])")) return;
                        refreshing = true;
                        window.location.reload();
                        return;
                    }
                    knownVersions.set(url.href, version);
                }
            } catch (error) {
                // El sitio sigue funcionando si el usuario está temporalmente sin conexión.
            } finally {
                checking = false;
            }
        }
        checkForUpdates();
        window.setInterval(checkForUpdates, 120000);
        window.addEventListener("focus", checkForUpdates);
        document.addEventListener("visibilitychange", function () {
            if (!document.hidden) checkForUpdates();
        });
        window.addEventListener("pageshow", function (event) {
            if (event.persisted) checkForUpdates();
        });
    }

    document.addEventListener("DOMContentLoaded", function () {
        enableLiveUpdates();
        if (document.getElementById("sponsors")) {
            addStyles();
            updateSponsors();
        }
        const scheduleRoot = document.getElementById("general-schedule");
        if (!scheduleRoot) return;
        addStyles();
        updateScheduleText(scheduleRoot);
        const programScript = document.createElement("script");
        programScript.src = new URL("comrob2026-ponencias.js?actualizacion=" + Date.now(), scriptsUrl).href;
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
