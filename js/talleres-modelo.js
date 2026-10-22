// Catálogo estable: los IDs coinciden con los registros existentes en Firestore.
export const WORKSHOPS = [
    { id: "taller_madurez", aula: "CPB11", edificio: "C", nivel: "Planta baja", nombre: "El radar de la madurez tecnológica", en: "The Technology Readiness Radar", esPage: "taller-madurez-tecnologica.html", enPage: "workshop-technology-readiness.html", horario: "26 de octubre · 17:00–18:30", slots: ["2026-10-26T17:00"] },
    { id: "taller_fraccional", aula: "CPB15", edificio: "C", nivel: "Planta baja", nombre: "Robótica y cálculo fraccional", en: "Robotics and Fractional Calculus", esPage: "taller-robotica-calculo-fraccional.html", enPage: "workshop-robotics-fractional-calculus.html", horario: "26 de octubre · 17:00–18:30", slots: ["2026-10-26T17:00"] },
    { id: "taller_imu", aula: "LPB03-4", edificio: "L", nivel: "Planta baja", nombre: "Captura de Movimiento con IMUs: Integración de Python y Unity para Avatares Virtuales", en: "Motion Capture with IMUs: Integrating Python and Unity for Virtual Avatars", esPage: "taller-captura-movimiento-imus.html", enPage: "workshop-motion-capture-imus.html", horario: "27 de octubre · 16:00–17:30", slots: ["2026-10-27T16:00"] },
    { id: "taller_matlab", aula: "LPB03-5", edificio: "L", nivel: "Planta baja", nombre: "Modelado y simulación de robots quirúrgicos en MATLAB", en: "Modeling and Simulation of Surgical Robots in MATLAB", esPage: "taller-robots-quirurgicos-matlab.html", enPage: "workshop-surgical-robots-matlab.html", horario: "26 de octubre · 17:00–18:30 y 27 de octubre · 16:00–17:30", slots: ["2026-10-26T17:00", "2026-10-27T16:00"] },
    { id: "taller_ortega", aula: "LPB03-4", edificio: "L", nivel: "Planta baja", nombre: "Nuevos resultados sobre control no lineal de sistemas mecánicos", en: "New Results on Nonlinear Control of Mechanical Systems", esPage: "taller-especial-control-no-lineal.html", enPage: "special-workshop-nonlinear-control.html", horario: "29 y 30 de octubre · 11:00–12:30 y 16:00–17:30", slots: ["2026-10-29", "2026-10-30"] }
];

export const ASSIGNMENT_LABELS = { aceptado: "Aceptado", espera: "Lista de espera", pendiente: "Pendiente de validación", rechazado: "Rechazado" };

export function workshopIds(record) {
    return [...new Set([...(record.talleres || []), ...(record.talleresDetalle || []).map(item => item.id)].filter(id => WORKSHOPS.some(w => w.id === id)))];
}

export function defaultConfig(total = 0) {
    return { version: 1, inicializado: true, cupo: 0, extras: 0, bloqueoAutomatico: false, bloqueadoManual: false, bloqueadoAutomatico: false, totalRegistros: total, ultimoRegistroId: "" };
}

export function automaticClosure(config) {
    return Boolean(config?.bloqueoAutomatico && config.cupo > 0 && config.totalRegistros >= config.cupo + config.extras);
}

export function registrationClosed(config) {
    return !config?.inicializado || Boolean(config.bloqueadoManual) || automaticClosure(config);
}

export function validateConfig(config) {
    if (![config.cupo, config.extras].every(n => Number.isInteger(n) && n >= 0 && n <= 100000)) throw new Error("Cupo y lugares extra deben ser enteros entre 0 y 100000.");
    if (config.bloqueoAutomatico && config.cupo === 0) throw new Error("Configura un cupo mayor que cero para activar el cierre automático.");
    return { ...config, bloqueadoAutomatico: automaticClosure(config) };
}

export function workshopSelectionIsValid(ids) {
    if (!ids.length || new Set(ids).size !== ids.length) return false;
    const slots = new Set();
    for (const id of ids) {
        const workshop = WORKSHOPS.find(w => w.id === id);
        if (!workshop) return false;
        for (const slot of workshop.slots) {
            if (slots.has(slot)) return false;
            slots.add(slot);
        }
    }
    return true;
}

export function timestampParts(value) {
    if (value && Number.isFinite(value.seconds)) return [value.seconds, value.nanoseconds || 0];
    const millis = value?.toMillis?.() ?? (typeof value === "string" ? Date.parse(value) : NaN);
    return Number.isFinite(millis) ? [Math.floor(millis / 1000), (millis % 1000) * 1000000] : [Infinity, 0];
}

export function chronological(a, b) {
    const aa = timestampParts(a.creadoEn), bb = timestampParts(b.creadoEn);
    if (aa[0] !== bb[0]) return aa[0] < bb[0] ? -1 : 1;
    if (aa[1] !== bb[1]) return aa[1] - bb[1];
    return String(a.id).localeCompare(String(b.id));
}

export function buildRoster(records, workshopId, config = defaultConfig()) {
    const sorted = records.filter(r => r.tipo === "taller" && workshopIds(r).includes(workshopId)).sort(chronological);
    let eligible = 0, waiting = 0;
    const emails = new Map();
    sorted.forEach(r => { const email = String(r.participante?.email || "").toLowerCase(); if (email) emails.set(email, (emails.get(email) || 0) + 1); });
    const rows = sorted.map((record, index) => {
        const rejection = record.rechazosTalleres?.[workshopId];
        let assignment = "pendiente", waitingPosition = null;
        if (rejection) assignment = "rechazado";
        else if (record.estado === "validado") {
            eligible += 1;
            assignment = config.cupo === 0 || eligible <= config.cupo ? "aceptado" : "espera";
            if (assignment === "espera") waitingPosition = ++waiting;
        }
        return { record, order: index + 1, assignment, waitingPosition, rejection, duplicate: (emails.get(String(record.participante?.email || "").toLowerCase()) || 0) > 1 };
    });
    const counts = { total: rows.length, pendientes: 0, validados: 0, aceptados: 0, espera: 0, rechazados: 0 };
    rows.forEach(row => {
        if (row.assignment === "rechazado") counts.rechazados++;
        else if (row.assignment === "pendiente") counts.pendientes++;
        else { counts.validados++; if (row.assignment === "aceptado") counts.aceptados++; else counts.espera++; }
    });
    return { rows, counts };
}

export function excelSafe(value) {
    const text = String(value ?? "");
    return /^[\s]*[=+@-]/.test(text) ? "'" + text : text;
}
