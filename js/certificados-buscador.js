(function () {
    "use strict";
    const form = document.querySelector("[data-certificate-search]");
    if (!form) return;
    const input = form.querySelector("input");
    const status = document.querySelector("[data-certificate-status]");
    const results = document.querySelector("[data-certificate-results]");
    const en = document.documentElement.lang.toLowerCase().startsWith("en");
    const labels = en ? {
        hint: "Enter your paper ID, its title or an author's name.",
        empty: "No papers found. Check the ID or try a few words from the title.",
        count: "matching papers", single: "matching paper", open: "Open certificate (PDF)",
        tab: "Opens in a new tab", pending: "Certificate not yet published.",
        checking: "Checking certificate availability…", authors: "Authors", alternate: "Title on the certificate",
        error: "The search could not be loaded. Reload the page and try again."
    } : {
        hint: "Escribe el ID de tu artículo, su título o el nombre de uno de sus autores.",
        empty: "No se encontraron artículos. Revisa el ID o prueba con algunas palabras del título.",
        count: "artículos encontrados", single: "artículo encontrado", open: "Abrir reconocimiento (PDF)",
        tab: "Se abre en una pestaña nueva", pending: "Reconocimiento pendiente de publicación.",
        checking: "Consultando disponibilidad del reconocimiento…", authors: "Autores", alternate: "Título en el reconocimiento",
        error: "No se pudo cargar el buscador. Recarga la página e inténtalo de nuevo."
    };
    const api = window.COMROB_CERTIFICADOS;
    const sessions = window.COMROB2026_PONENCIAS;
    if (!api || !Array.isArray(sessions)) { status.textContent = labels.error; return; }
    let version = 0;

    function link(certificate, paper, className) {
        const anchor = document.createElement("a");
        anchor.href = certificate.url;
        anchor.target = "_blank";
        anchor.rel = "noopener noreferrer";
        anchor.className = className;
        anchor.textContent = className ? labels.open : paper.title;
        anchor.setAttribute("aria-label", className ? `${labels.open}: #${paper.id}. ${labels.tab}` : `${paper.title}. ${labels.tab}`);
        return anchor;
    }
    function showCertificate(host, paper, certificate) {
        host.replaceChildren();
        if (certificate) {
            host.appendChild(link(certificate, paper, "btn btn-danger btn-sm"));
            const hint = document.createElement("span");
            hint.className = "d-block small text-muted mt-2";
            hint.textContent = labels.tab;
            host.appendChild(hint);
        } else {
            const note = document.createElement("span");
            note.className = "small text-muted";
            note.textContent = labels.pending;
            host.appendChild(note);
        }
    }
    function render() {
        const currentVersion = ++version;
        results.replaceChildren();
        const query = input.value.trim();
        if (!query) { status.textContent = labels.hint; return []; }
        const matches = api.search(sessions, query);
        status.textContent = matches.length ? `${matches.length} ${matches.length === 1 ? labels.single : labels.count}` : labels.empty;
        matches.forEach(({ paper }) => {
            const certificate = api.get(paper.id);
            const card = document.createElement("article");
            card.className = "comrob-cert-result";
            const badge = document.createElement("span");
            badge.className = "badge bg-danger mb-2";
            badge.textContent = `#${String(paper.id).padStart(2, "0")}`;
            card.appendChild(badge);
            const heading = document.createElement("h2");
            if (certificate) heading.appendChild(link(certificate, paper, ""));
            else heading.textContent = paper.title;
            card.appendChild(heading);
            if (certificate?.authors) {
                const authors = document.createElement("p");
                authors.textContent = `${labels.authors}: ${certificate.authors}`;
                card.appendChild(authors);
            }
            if (certificate?.title && api.normalize(certificate.title) !== api.normalize(paper.title)) {
                const alternate = document.createElement("p");
                alternate.textContent = `${labels.alternate}: ${certificate.title}`;
                card.appendChild(alternate);
            }
            const action = document.createElement("div");
            card.appendChild(action);
            results.appendChild(card);
            showCertificate(action, paper, certificate);
            if (!certificate) {
                action.textContent = labels.checking;
                api.check(paper.id).then(available => {
                    if (version === currentVersion) showCertificate(action, paper, available);
                });
            }
        });
        return matches;
    }
    input.addEventListener("input", render);
    form.addEventListener("submit", event => {
        event.preventDefault();
        const matches = render();
        if (matches.length === 1) {
            const certificate = api.get(matches[0].paper.id);
            if (certificate) window.open(certificate.url, "_blank", "noopener,noreferrer");
        }
    });
    render();
}());
