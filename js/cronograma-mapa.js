export function mapLocationKey(value) {
    const building = /\b(?:edificio|building)\s+([a-z])\b/i.exec(value);
    if (building) return `building-${building[1].toUpperCase()}`;
    const gate = /\b(?:puerta|gate)\s+(\d+)\b/i.exec(value);
    return gate ? `gate-${gate[1]}` : "";
}

// Comparar sedes completas: dos salas del mismo edificio siguen siendo lugares distintos.
export function sameMapLocation(first, second) {
    const normalize = value => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .toLowerCase().replace(/\b(?:auditorio|auditorium|aula|room)\b/g, "")
        .replace(/[^a-z0-9]+/g, " ").trim();
    return Boolean(first && second) && normalize(first) === normalize(second);
}

export function startMapNavigation() {
    const schedule = document.getElementById("general-schedule");
    const map = document.getElementById("mapa-ibero");
    if (!schedule || !map || map.dataset.navigationInitialized === "true") return;
    map.dataset.navigationInitialized = "true";
    map.tabIndex = -1;
    const en = document.documentElement.lang.toLowerCase().startsWith("en");
    const labels = en ? {
        title: "Map information", selected: "Selected location", now: "Now:",
        open: "View on map", back: "Back to schedule", close: "Close map menu"
    } : {
        title: "Información del mapa", selected: "Ubicación consultada", now: "Ahora:",
        open: "Ver en el mapa", back: "Regresar al cronograma", close: "Cerrar menú del mapa"
    };
    const panel = document.createElement("aside");
    panel.className = "comrob-map-panel";
    panel.dataset.mapNavigation = "";
    panel.hidden = true;
    panel.setAttribute("aria-label", labels.title);
    panel.innerHTML = `<button class="btn-close comrob-map-close" type="button" data-map-close aria-label="${labels.close}" title="${labels.close}"></button>` +
        '<div class="comrob-map-panel-content"><section data-map-now hidden aria-live="polite" aria-atomic="true">' +
        `<div class="comrob-map-caption comrob-map-now-caption">${labels.now}</div>` +
        '<div data-map-now-items class="comrob-map-now-items"></div></section>' +
        `<section data-map-requested hidden><div class="comrob-map-caption">${labels.selected}</div>` +
        '<div class="comrob-map-place" id="comrob-map-place" data-map-place role="status" aria-live="polite"></div>' +
        '<div class="comrob-map-context" data-map-context></div></section></div>' +
        `<button class="btn btn-danger w-100" type="button" data-map-return hidden><i class="bi bi-arrow-left me-1" aria-hidden="true"></i>${labels.back}</button>`;
    document.body.appendChild(panel);
    const place = panel.querySelector("[data-map-place]");
    const context = panel.querySelector("[data-map-context]");
    const back = panel.querySelector("[data-map-return]");
    const close = panel.querySelector("[data-map-close]");
    const now = panel.querySelector("[data-map-now]");
    const nowItems = panel.querySelector("[data-map-now-items]");
    const requested = panel.querySelector("[data-map-requested]");
    const processed = new WeakSet();
    let returnState = null, enhancementQueued = false;
    let activities = [], activitiesKey = null, mapVisible = false, visibilityQueued = false;
    // El cierre dura solo en esta carga de la página; una ubicación explícita lo reabre.
    let dismissed = false;
    const reducedMotion = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const clean = value => String(value || "").replace(/\s+/g, " ").trim();

    function information(icon) {
        const line = icon.closest("[data-map-location], .comrob-location-line, [data-workshop-location]") || icon.parentElement;
        const control = icon.closest("a.comrob-room-btn, button.comrob-room-btn");
        const row = icon.closest("[data-schedule-label]");
        let location = line.dataset.mapLocation || row?.dataset.scheduleLocation || clean(line.textContent);
        if (!line.dataset.mapLocation && control?.tagName === "BUTTON") {
            const room = control.querySelector(".comrob-room-name");
            if (room) location = `${clean(room.textContent)} · ${location}`;
        }
        const paper = icon.closest(".comrob-search-result")?.querySelector(".comrob-search-paper-title");
        const title = control?.querySelector(".comrob-room-topic") || paper ||
            icon.closest("td")?.querySelector(":scope > .fw-semibold.mb-1:not(.small)") ||
            icon.closest("[data-schedule-ranges]")?.querySelector("h3");
        return { location, context: line.dataset.mapContext || clean(title?.textContent || row?.dataset.scheduleLabel) };
    }

    // El enlace al mapa debe ser hermano del enlace/botón del taller o sesión,
    // para conservar ambos destinos sin anidar controles interactivos.
    function separateCardLocation(icon) {
        const control = icon.closest("a.comrob-room-btn, button.comrob-room-btn");
        if (!control) return;
        const line = icon.closest(".comrob-location-line, [data-workshop-location]") || icon.parentElement;
        if (line.parentElement !== control) return;
        const after = [];
        for (let node = line.nextSibling; node; node = node.nextSibling) after.push(node);
        const card = document.createElement("div");
        card.className = `${control.className} position-relative comrob-map-card`;
        control.replaceWith(card);
        card.appendChild(control);
        control.className = "comrob-room-primary stretched-link";
        card.appendChild(line);
        after.forEach(node => card.appendChild(node));
    }
    function enhanceIcons() {
        enhancementQueued = false;
        document.querySelectorAll("#general-schedule .bi-geo-alt, .modal .bi-geo-alt").forEach(icon => {
            if (processed.has(icon)) return;
            processed.add(icon);
            const info = information(icon);
            separateCardLocation(icon);
            if (icon.closest("a, button") || !info.location) return;
            const link = document.createElement("a");
            link.href = "#mapa-ibero";
            link.className = "comrob-map-link";
            link.dataset.comrobMapLink = "";
            link.dataset.mapLocation = info.location;
            link.dataset.mapContext = info.context;
            link.setAttribute("aria-label", `${labels.open}: ${info.location}`);
            link.setAttribute("aria-controls", "mapa-ibero");
            link.title = `${labels.open}: ${info.location}`;
            icon.replaceWith(link);
            link.appendChild(icon);
        });
    }
    function clearSelection() {
        map.querySelectorAll(".comrob-map-selected").forEach(card => {
            card.classList.remove("comrob-map-selected");
            card.removeAttribute("aria-current");
        });
    }
    function markSelection(location) {
        clearSelection();
        const key = mapLocationKey(location);
        const card = [...map.querySelectorAll("article")].find(card =>
            key && mapLocationKey(card.querySelector("h3")?.textContent || "") === key);
        if (card) { card.classList.add("comrob-map-selected"); card.setAttribute("aria-current", "location"); }
    }
    function renderPanel() {
        const hasCurrent = activities.length > 0;
        const hasSelection = Boolean(returnState?.activated);
        const samePlace = hasSelection && activities.some(activity =>
            sameMapLocation(activity.location, place.textContent));
        now.hidden = !hasCurrent;
        requested.hidden = !hasSelection || samePlace;
        back.hidden = !hasSelection;
        // Una visita directa al mapa muestra únicamente la información en curso.
        panel.hidden = dismissed || !(hasSelection || (mapVisible && hasCurrent));
        document.body.classList.toggle("comrob-map-open", !panel.hidden);
        panel.classList.toggle("comrob-map-has-both", !now.hidden && !requested.hidden);
    }
    function updateCurrent(elements = schedule.comrobCurrentEntries || []) {
        const next = [];
        elements.forEach(element => {
            const icons = [...element.querySelectorAll(".bi-geo-alt")];
            if (!icons.length) {
                next.push({ name: element.dataset.scheduleLabel || "", location: element.dataset.scheduleLocation || "" });
                return;
            }
            icons.forEach(icon => {
                const info = information(icon);
                const label = element.dataset.scheduleLabel || "";
                const card = icon.closest(".comrob-map-card, .comrob-room-btn");
                const name = !card && info.context && info.context !== label ? `${label} · ${info.context}` :
                    info.context || label;
                if (!next.some(item => item.name === name && sameMapLocation(item.location, info.location))) {
                    next.push({ name, location: info.location });
                }
            });
        });
        const key = JSON.stringify(next);
        if (key !== activitiesKey) {
            activitiesKey = key;
            activities = next;
            nowItems.replaceChildren();
            activities.forEach(activity => {
                const item = document.createElement("div");
                item.className = "comrob-map-now-item";
                const name = document.createElement("div");
                name.className = "comrob-map-now-name";
                name.textContent = activity.name;
                item.appendChild(name);
                if (activity.location) {
                    const location = document.createElement("div");
                    location.className = "comrob-map-now-location";
                    location.textContent = activity.location;
                    item.appendChild(location);
                }
                nowItems.appendChild(item);
            });
        }
        renderPanel();
    }
    function updateMapVisibility() {
        visibilityQueued = false;
        const bounds = map.getBoundingClientRect();
        mapVisible = bounds.top < window.innerHeight * .85 && bounds.bottom > window.innerHeight * .15;
        renderPanel();
    }
    function queueVisibility() {
        if (visibilityQueued) return;
        visibilityQueued = true;
        window.requestAnimationFrame(updateMapVisibility);
    }
    function modalInstance(modal) {
        return window.bootstrap?.Modal.getInstance(modal) || window.bootstrap?.Modal.getOrCreateInstance(modal);
    }
    function showMap(link) {
        const modal = link.closest(".modal");
        const anchor = modal ? document.querySelector(`[data-bs-target="#${modal.id}"]`) : link;
        const state = {
            origin: link, anchor, anchorTop: anchor?.getBoundingClientRect().top,
            scrollX: window.scrollX, scrollY: window.scrollY, height: window.innerHeight, modal, activated: false,
            modalPositions: modal ? [modal, ...modal.querySelectorAll(".modal-body, .modal-dialog")].map(element =>
                ({ element, top: element.scrollTop, left: element.scrollLeft })) : []
        };
        returnState = state;
        // Suspende el seguimiento de la actividad actual mientras se consulta el mapa.
        window.dispatchEvent(new CustomEvent("comrob:map-open"));
        function activate() {
            if (returnState !== state) return;
            dismissed = false;
            state.activated = true;
            place.textContent = link.dataset.mapLocation;
            context.textContent = link.dataset.mapContext;
            context.hidden = !context.textContent;
            markSelection(link.dataset.mapLocation);
            updateCurrent();
            map.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth", block: "start" });
            back.focus({ preventScroll: true });
        }
        const instance = modal && modalInstance(modal);
        if (modal && instance) {
            // Si el modal todavía está entrando, cerrarlo al terminar su transición.
            const hide = () => instance.hide();
            modal.addEventListener("shown.bs.modal", hide, { once: true });
            modal.addEventListener("hidden.bs.modal", () => {
                modal.removeEventListener("shown.bs.modal", hide);
                window.requestAnimationFrame(activate);
            }, { once: true });
            instance.hide();
        } else activate();
    }
    function returnToSchedule() {
        if (!returnState) return;
        const state = returnState;
        returnState = null;
        clearSelection();
        let top = state.scrollY;
        if (state.anchor?.isConnected) {
            const offset = state.height === window.innerHeight ? state.anchorTop :
                Math.min(Math.max(state.anchorTop, 16), Math.max(16, window.innerHeight - 80));
            top = state.anchor.getBoundingClientRect().top + window.scrollY - offset;
        }
        // El sitio usa desplazamiento suave global; restaurar la lectura de inmediato.
        const root = document.documentElement;
        const previousBehavior = root.style.scrollBehavior;
        root.style.scrollBehavior = "auto";
        window.scrollTo({ left: state.scrollX, top: Math.max(0, top), behavior: "auto" });
        root.style.scrollBehavior = previousBehavior;
        updateMapVisibility();
        function restoreFocus() {
            state.modalPositions.forEach(({ element, top, left }) => { element.scrollTop = top; element.scrollLeft = left; });
            const origin = state.origin.isConnected ? state.origin : state.anchor;
            origin?.focus({ preventScroll: true });
        }
        const instance = state.modal?.isConnected && modalInstance(state.modal);
        if (instance) {
            state.modal.addEventListener("shown.bs.modal", restoreFocus, { once: true });
            instance.show();
        } else restoreFocus();
    }
    document.addEventListener("click", event => {
        const link = event.target.closest("a[data-comrob-map-link]");
        if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button > 0) return;
        if (!link) {
            const direct = event.target.closest("a[href]");
            if (direct && direct.hash === "#mapa-ibero" && direct.origin === window.location.origin &&
                direct.pathname === window.location.pathname) {
                returnState = null;
                clearSelection();
                window.dispatchEvent(new CustomEvent("comrob:map-open"));
                queueVisibility();
            }
            return;
        }
        event.preventDefault();
        showMap(link);
    });
    back.addEventListener("click", returnToSchedule);
    close.addEventListener("click", () => {
        dismissed = true;
        returnState = null;
        renderPanel();
        map.focus({ preventScroll: true });
    });
    window.addEventListener("keydown", event => {
        if (event.key === "Escape" && returnState && !panel.hidden) { event.preventDefault(); returnToSchedule(); }
    });
    window.addEventListener("comrob:schedule-current", event => updateCurrent(event.detail));
    window.addEventListener("scroll", queueVisibility, { passive: true });
    window.addEventListener("resize", queueVisibility, { passive: true });
    window.addEventListener("hashchange", queueVisibility);
    window.addEventListener("load", queueVisibility, { once: true });
    window.addEventListener("pageshow", queueVisibility);
    enhanceIcons();
    updateCurrent();
    updateMapVisibility();
    const observer = new MutationObserver(mutations => {
        if (enhancementQueued) return;
        if (mutations.some(mutation => [...mutation.addedNodes].some(node =>
            node.nodeType === 1 && (node.matches(".bi-geo-alt") || node.querySelector(".bi-geo-alt"))))) {
            enhancementQueued = true;
            window.requestAnimationFrame(enhanceIcons);
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });
}

if (typeof document !== "undefined") {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", startMapNavigation, { once: true });
    else startMapNavigation();
}
