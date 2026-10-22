// Fechas y horas del programa en America/Mexico_City, con independencia de la zona del dispositivo.
const mexicoCityFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Mexico_City", calendar: "gregory", numberingSystem: "latn",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23"
});

export function mexicoCityTime(instant = new Date()) {
    const parts = Object.fromEntries(mexicoCityFormatter.formatToParts(instant).map(part => [part.type, part.value]));
    return {
        date: `${parts.year}-${parts.month}-${parts.day}`,
        minutes: Number(parts.hour) * 60 + Number(parts.minute) + Number(parts.second) / 60,
        clock: `${parts.hour}:${parts.minute}:${parts.second}`
    };
}

export function minutesFromTime(value) {
    const match = /^(\d{2}):(\d{2})$/.exec(String(value));
    if (!match || Number(match[1]) > 23 || Number(match[2]) > 59) return NaN;
    return Number(match[1]) * 60 + Number(match[2]);
}

export function rangeIsCurrent(range, localTime) {
    const start = minutesFromTime(range.start), end = minutesFromTime(range.end);
    return range.date === localTime.date && end > start && start <= localTime.minutes && localTime.minutes < end;
}

export function currentEntries(entries, instant = new Date()) {
    const time = mexicoCityTime(instant);
    return entries.filter(entry => entry.ranges.some(range => rangeIsCurrent(range, time)));
}

export function startScheduleClock() {
    const root = document.getElementById("general-schedule");
    const panel = document.querySelector("[data-schedule-clock]");
    if (!root || !panel || root.dataset.clockInitialized === "true") return;
    root.dataset.clockInitialized = "true";
    // El resumen permanece oculto; el acceso flotante está fuera del panel.
    const en = document.documentElement.lang.toLowerCase().startsWith("en");
    const text = en ? { now: "Now", none: "No activities in progress." } :
        { now: "En curso", none: "Sin actividades en curso." };
    const clock = panel.querySelector("[data-cdmx-time]");
    const date = panel.querySelector("[data-cdmx-date]");
    const summary = panel.querySelector("[data-schedule-summary]");
    const shortcut = document.querySelector("[data-current-activity]");
    const dateFormatter = new Intl.DateTimeFormat(en ? "en-US" : "es-MX", {
        timeZone: "America/Mexico_City", weekday: "long", month: "long", day: "numeric"
    });
    const entries = [...root.querySelectorAll("[data-schedule-start], [data-schedule-ranges]")].map((element, index) => {
        let ranges;
        try {
            ranges = element.dataset.scheduleRanges ? JSON.parse(element.dataset.scheduleRanges) : [{
                date: element.dataset.scheduleDate, start: element.dataset.scheduleStart, end: element.dataset.scheduleEnd
            }];
        } catch { ranges = []; }
        const label = document.createElement("span");
        label.className = "comrob-current-label";
        label.textContent = text.now;
        label.hidden = true;
        // La etiqueta se coloca junto a la hora; el texto de las sesiones técnicas se conserva
        // para que su cargador y el buscador puedan reconocer los bloques.
        const host = element.tagName === "TR" ? element.cells[0] : element.querySelector(".card-header h2");
        host?.appendChild(label);
        return { element, ranges, label, index };
    });
    let active = [], activeKey = null, scrollQueued = false;
    let following = !window.location.hash || window.location.hash === "#actividad-en-curso";
    const reducedMotion = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    function describe(entry) {
        const element = entry.element;
        const content = element.tagName === "TR" ? element.cells[1] : element.querySelector(".card-body");
        const title = content?.querySelector(":scope > .fw-semibold.mb-1:not(.small), :scope > h3")?.textContent.trim();
        const name = element.dataset.scheduleLabel || "";
        const locations = [...(content?.querySelectorAll(".bi-geo-alt") || [])].map(icon => {
            const place = icon.parentElement.textContent.trim();
            const room = icon.closest("button.comrob-room-btn")?.querySelector(".comrob-room-name")?.textContent.trim();
            return room ? `${room} · ${place}` : place;
        });
        return {
            name: title && title !== name ? `${name} · ${title}` : name,
            location: element.dataset.scheduleLocation || [...new Set(locations)].join("; ")
        };
    }
    function renderSummary(details) {
        summary.replaceChildren();
        summary.classList.toggle("comrob-live-empty", !details.length);
        if (!details.length) { summary.textContent = text.none; return; }
        details.forEach(detail => {
            const item = document.createElement("div");
            item.className = "comrob-current-item";
            const line = document.createElement("div");
            const prefix = document.createElement("span");
            prefix.className = "fw-semibold";
            prefix.textContent = `${text.now}: `;
            const name = document.createElement("span");
            name.textContent = detail.name;
            line.append(prefix, name);
            item.appendChild(line);
            if (detail.location) {
                const location = document.createElement("div");
                location.className = "comrob-current-location";
                location.textContent = detail.location;
                item.appendChild(location);
            }
            summary.appendChild(item);
        });
    }
    function scrollToCurrent(manual = false) {
        if (!active.length || (!manual && !following) || document.querySelector(".modal.show")) return;
        active[0].element.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth", block: "start" });
    }
    function queueScroll() {
        if (!following || scrollQueued || !active.length) return;
        scrollQueued = true;
        // Esperar el nuevo diseño, incluidas las tarjetas de salas cargadas de forma asíncrona.
        window.requestAnimationFrame(() => window.requestAnimationFrame(() => {
            scrollQueued = false;
            scrollToCurrent();
        }));
    }
    function update() {
        if (document.hidden) return;
        const instant = new Date();
        const local = mexicoCityTime(instant);
        clock.textContent = local.clock.slice(0, 5);
        clock.dateTime = instant.toISOString();
        date.textContent = dateFormatter.format(instant);
        const next = currentEntries(entries, instant);
        // Leer los datos de la actividad ya publicada, también tras cargar las salas.
        const details = next.map(describe);
        const key = JSON.stringify(next.map((entry, index) => [entry.index, details[index]]));
        if (key === activeKey) return;
        activeKey = key;
        active = next;
        entries.forEach(entry => {
            const isCurrent = active.includes(entry);
            entry.element.classList.toggle("comrob-is-current", isCurrent);
            entry.label.hidden = !isCurrent;
            if (isCurrent) entry.element.setAttribute("aria-current", "time");
            else entry.element.removeAttribute("aria-current");
        });
        shortcut.hidden = !active.length;
        renderSummary(details);
        queueScroll();
    }
    function pauseFollowing() { following = false; }
    window.addEventListener("wheel", pauseFollowing, { passive: true });
    window.addEventListener("touchmove", pauseFollowing, { passive: true });
    window.addEventListener("keydown", event => {
        if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].includes(event.key)) pauseFollowing();
    });
    root.addEventListener("click", event => {
        if (event.target.closest("a, button") && !event.target.closest("[data-current-activity]")) pauseFollowing();
    });
    window.addEventListener("hashchange", () => {
        if (window.location.hash && window.location.hash !== "#actividad-en-curso") pauseFollowing();
    });
    shortcut.addEventListener("click", () => { following = true; scrollToCurrent(true); });
    window.addEventListener("focus", update);
    window.addEventListener("pageshow", update);
    document.addEventListener("visibilitychange", update);
    window.addEventListener("load", queueScroll, { once: true });
    if (typeof MutationObserver !== "undefined") {
        const observer = new MutationObserver(mutations => {
            const layoutChanged = mutations.some(mutation =>
                mutation.target.nodeType === 1 && mutation.target.closest("[data-workshop-status]") ||
                [...mutation.addedNodes].some(node => node.nodeType === 1 && node.matches(".comrob-session-grid, .comrob-paper-search-card"))
            );
            if (layoutChanged) queueScroll();
        });
        observer.observe(root, { childList: true, subtree: true });
    }
    update();
    window.setInterval(update, 1000);
}

if (typeof document !== "undefined") {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", startScheduleClock, { once: true });
    else startScheduleClock();
}
