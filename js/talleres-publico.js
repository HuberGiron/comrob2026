import { WORKSHOPS, registrationClosed, automaticClosure } from "./talleres-modelo.js";
import { watchWorkshopConfigs } from "./talleres-datos.js";

const en = document.documentElement.lang.toLowerCase().startsWith("en");
const labels = en ? {
    loading: "Checking availability…", unavailable: "Availability could not be confirmed. Please try again later.",
    unconfigured: "Registration is temporarily unavailable.", full: "Full capacity", closed: "Registration closed.",
    open: "Registration open", pending: "Places are assigned after validation, in registration order.",
    waiting: "Additional applications are being received. A place is subject to validation and availability."
} : {
    loading: "Consultando disponibilidad…", unavailable: "No fue posible confirmar la disponibilidad. Intenta nuevamente más tarde.",
    unconfigured: "Las inscripciones están temporalmente no disponibles.", full: "Cupo lleno", closed: "Inscripciones cerradas.",
    open: "Inscripciones abiertas", pending: "Los lugares se asignan después de la validación, por orden de inscripción.",
    waiting: "Se siguen recibiendo solicitudes. El lugar está sujeto a validación y disponibilidad."
};
const form = document.querySelector('[data-registration-type="taller"]');
const controls = [...document.querySelectorAll("[data-workshop-register]")];
controls.forEach(link => { link.dataset.openHref = link.getAttribute("href") || ""; link.dataset.openText = link.textContent; });

function update(configs, failed = false) {
    for (const workshop of WORKSHOPS) {
        const config = configs[workshop.id];
        const initialized = Boolean(config?.inicializado);
        const closed = failed || registrationClosed(config);
        const full = initialized && (config.bloqueadoManual || automaticClosure(config));
        const label = failed ? labels.unavailable : !initialized ? labels.unconfigured : full ? labels.full : labels.open;
        document.querySelectorAll(`[data-workshop-status="${workshop.id}"]`).forEach(node => {
            node.textContent = label;
            node.classList.toggle("text-danger", closed);
            node.classList.toggle("text-success", !closed);
        });
        document.querySelectorAll(`[data-workshop-banner="${workshop.id}"]`).forEach(node => {
            node.replaceChildren();
            const strong = document.createElement("strong");
            strong.textContent = label;
            node.appendChild(strong);
            const detail = document.createElement("div");
            detail.className = "small mt-1";
            detail.textContent = full ? labels.closed : closed ? "" : config.cupo > 0 && config.totalRegistros >= config.cupo ? labels.waiting : labels.pending;
            node.appendChild(detail);
            node.classList.toggle("alert-warning", closed);
            node.classList.toggle("alert-light", !closed);
        });
        controls.filter(link => link.dataset.workshopRegister === workshop.id).forEach(link => {
            link.classList.toggle("disabled", closed);
            link.setAttribute("aria-disabled", String(closed));
            link.textContent = full ? labels.full : link.dataset.openText;
            if (closed) { link.removeAttribute("href"); link.tabIndex = -1; }
            else { link.setAttribute("href", link.dataset.openHref); link.removeAttribute("tabindex"); }
        });
        if (form) {
            const input = form.querySelector(`input[name="talleres"][value="${workshop.id}"]`);
            if (input) {
                input.disabled = closed;
                if (closed) input.checked = false;
            }
        }
    }
    if (form) {
        const anyOpen = WORKSHOPS.some(w => !failed && !registrationClosed(configs[w.id]));
        form.dataset.workshopAvailability = anyOpen ? "ready" : "closed";
        const button = form.querySelector('[type="submit"]');
        if (button && form.dataset.saving !== "true") button.disabled = !anyOpen;
        const notice = document.querySelector("[data-workshop-form-status]");
        if (notice) {
            notice.textContent = failed ? labels.unavailable : anyOpen ? labels.pending : labels.closed;
            notice.classList.toggle("text-danger", !anyOpen);
        }
    }
}

watchWorkshopConfigs(configs => update(configs), error => {
    console.error("No se pudo consultar la disponibilidad de talleres.", error);
    update({}, true);
});
