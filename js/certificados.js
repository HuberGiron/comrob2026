/* Búsqueda compartida del programa y los reconocimientos publicados. */
(function () {
    "use strict";
    const source = document.currentScript;
    const root = new URL("../", source.src);
    const catalog = window.COMROB2026_CERTIFICADOS || {};
    const checked = new Map();
    const pending = new Map();
    const additional = new Map();

    function normalize(value) {
        return String(value || "").replace(/\\infty|∞/g, " infinity ")
            .normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
            .toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    }
    function get(id) {
        const record = catalog[Number(id)] || additional.get(Number(id));
        return record ? { ...record, url: new URL(record.file, root).href } : null;
    }
    function search(sessions, value) {
        const query = normalize(value);
        if (!query) return [];
        const number = /^(?:(?:articulo|paper|numero|no|id)\s*)?0*(\d+)$/.exec(query);
        const words = query.split(/\s+/);
        return sessions.flatMap(session => session.papers.map(paper => ({ paper, session })))
            .filter(({ paper }) => {
                if (number) return Number(paper.id) === Number(number[1]);
                const certificate = get(paper.id);
                const text = normalize([paper.title, certificate?.title, certificate?.authors].join(" "));
                return words.every(word => text.includes(word));
            }).sort((a, b) => Number(a.paper.id) - Number(b.paper.id));
    }
    function check(id) {
        const number = Number(id);
        if (get(number)) return Promise.resolve(get(number));
        if (!Number.isSafeInteger(number) || number <= 0 || !window.fetch) return Promise.resolve(null);
        if (pending.has(number)) return pending.get(number);
        if (checked.has(number)) return Promise.resolve(null);
        // Permite publicar después un PDF faltante sin volver a generar el catálogo.
        const file = `certificado/${String(number).padStart(2, "0")}.pdf`;
        const request = window.fetch(new URL(file, root).href, { method: "HEAD", cache: "no-store", credentials: "same-origin" })
            .then(response => {
                const type = (response.headers.get("Content-Type") || "").split(";")[0].trim().toLowerCase();
                if (response.ok && ["application/pdf", "application/octet-stream"].includes(type)) {
                    additional.set(number, { file });
                }
                return get(number);
            }).catch(() => null).finally(() => { checked.set(number, true); pending.delete(number); });
        pending.set(number, request);
        return request;
    }
    window.COMROB_CERTIFICADOS = Object.freeze({ normalize, get, search, check });
}());
