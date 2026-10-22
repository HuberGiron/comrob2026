// Horarios de CDMX para el congreso de 2026. El desplazamiento explícito evita
// que el contador dependa de la zona horaria del equipo del visitante.
export const REGISTRATION_START = Date.parse("2026-10-26T08:00:00-06:00");
export const WELCOME_END = Date.parse("2026-10-27T00:00:00-06:00");

export function congressState(instant = Date.now()) {
    const now = Number(instant);
    if (!Number.isFinite(now)) throw new RangeError("Invalid date");
    if (now >= WELCOME_END) return { phase: "hidden" };
    if (now >= REGISTRATION_START) return { phase: "welcome" };
    const remaining = Math.ceil((REGISTRATION_START - now) / 1000);
    return {
        phase: "countdown",
        days: Math.floor(remaining / 86400),
        hours: Math.floor(remaining / 3600) % 24,
        minutes: Math.floor(remaining / 60) % 60,
        seconds: remaining % 60
    };
}

export function startCongressClock() {
    const root = document.querySelector("[data-congress-clock]");
    if (!root || root.dataset.countdownInitialized === "true") return;
    root.dataset.countdownInitialized = "true";
    const counter = root.querySelector("[data-countdown-values]");
    const welcome = root.querySelector("[data-congress-welcome]");
    const digits = Object.fromEntries(["days", "hours", "minutes", "seconds"].map(unit =>
        [unit, document.getElementById(`cd-${unit}`)]));
    let simulation = null, phase = null;

    function currentTime() {
        return simulation ? simulation.instant + window.performance.now() - simulation.started : Date.now();
    }
    function update() {
        if (document.hidden) return;
        const state = congressState(currentTime());
        if (state.phase !== phase) {
            phase = state.phase;
            root.dataset.phase = phase;
            root.hidden = phase === "hidden";
            counter.hidden = phase !== "countdown";
            welcome.hidden = phase !== "welcome";
        }
        if (phase === "countdown") {
            Object.entries(digits).forEach(([unit, element]) => {
                element.textContent = unit === "days" ? String(state[unit]) : String(state[unit]).padStart(2, "0");
            });
        }
    }

    // Pruebas desde la consola: solo afectan este bloque y se restablecen al recargar.
    window.COMRobInicio = Object.freeze({
        simular(isoDate) {
            const instant = Date.parse(isoDate);
            if (typeof isoDate !== "string" || !/(Z|[+-]\d{2}:\d{2})$/.test(isoDate) || !Number.isFinite(instant)) {
                throw new RangeError("Usa una fecha ISO con zona horaria, por ejemplo: 2026-10-26T08:00:00-06:00");
            }
            simulation = { instant, started: window.performance.now() };
            update();
            return congressState(instant).phase;
        },
        restaurar() {
            simulation = null;
            update();
            return congressState().phase;
        }
    });
    window.addEventListener("focus", update);
    window.addEventListener("pageshow", update);
    document.addEventListener("visibilitychange", update);
    update();
    window.setInterval(update, 1000);
}

if (typeof document !== "undefined") {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", startCongressClock, { once: true });
    else startCongressClock();
}
