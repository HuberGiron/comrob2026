import { collection, doc, getDocsFromServer, onSnapshot, query, runTransaction, serverTimestamp, where } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import { db } from "./firebase-core.js";
import { WORKSHOPS, automaticClosure, defaultConfig, registrationClosed, validateConfig, workshopIds, workshopSelectionIsValid } from "./talleres-modelo.js";

export function watchWorkshopConfigs(next, error) {
    return onSnapshot(collection(db, "talleresConfig"), snapshot => next(Object.fromEntries(snapshot.docs.map(d => [d.id, d.data()]))), error);
}

export async function createWorkshopRegistration(reference, payload) {
    const ids = payload.talleres;
    if (!workshopSelectionIsValid(ids)) throw new Error("Selección de talleres inválida.");
    await runTransaction(db, async transaction => {
        const snapshots = await Promise.all(ids.map(id => transaction.get(doc(db, "talleresConfig", id))));
        snapshots.forEach((snapshot, index) => {
            const config = snapshot.exists() ? snapshot.data() : null;
            if (registrationClosed(config)) {
                const error = new Error("El taller no admite más inscripciones.");
                error.code = "talleres/cerrado";
                error.workshopId = ids[index];
                throw error;
            }
        });
        snapshots.forEach(snapshot => {
            const config = snapshot.data();
            const next = { ...config, totalRegistros: config.totalRegistros + 1 };
            transaction.update(snapshot.ref, {
                totalRegistros: next.totalRegistros,
                bloqueadoAutomatico: automaticClosure(next),
                ultimoRegistroId: reference.id,
                actualizadoEn: serverTimestamp()
            });
        });
        transaction.set(reference, payload);
    });
}

export async function saveWorkshopConfig(id, changes, user) {
    const allowed = ["cupo", "extras", "bloqueoAutomatico", "bloqueadoManual"];
    const clean = Object.fromEntries(Object.entries(changes).filter(([key]) => allowed.includes(key)));
    await runTransaction(db, async transaction => {
        const ref = doc(db, "talleresConfig", id);
        const snapshot = await transaction.get(ref);
        if (!snapshot.exists()) throw new Error("Inicializa los talleres antes de configurar cupos.");
        const config = validateConfig({ ...snapshot.data(), ...clean });
        transaction.update(ref, { ...clean, bloqueadoAutomatico: config.bloqueadoAutomatico, actualizadoEn: serverTimestamp(), actualizadoPor: user.uid });
    });
}

export async function initializeWorkshops(user) {
    // Las reglas impiden registros nuevos en talleres aún no inicializados.
    const records = await getDocsFromServer(query(collection(db, "registros"), where("tipo", "==", "taller")));
    const data = records.docs.map(item => ({ ...item.data(), id: item.id }));
    for (const workshop of WORKSHOPS) {
        await runTransaction(db, async transaction => {
            const ref = doc(db, "talleresConfig", workshop.id);
            const snapshot = await transaction.get(ref);
            if (snapshot.exists()) return;
            const total = data.filter(record => workshopIds(record).includes(workshop.id)).length;
            transaction.set(ref, { ...defaultConfig(total), actualizadoEn: serverTimestamp(), actualizadoPor: user.uid });
        });
    }
}

export async function reconcileWorkshop(id, user) {
    await runTransaction(db, async transaction => {
        const ref = doc(db, "talleresConfig", id);
        const snapshot = await transaction.get(ref);
        if (!snapshot.exists()) throw new Error("Inicializa primero los talleres.");
        // Leer el contador antes de consultar registros permite detectar inscripciones concurrentes.
        const records = await getDocsFromServer(query(collection(db, "registros"), where("tipo", "==", "taller")));
        const total = records.docs.filter(d => workshopIds(d.data()).includes(id)).length;
        const next = { ...snapshot.data(), totalRegistros: total };
        transaction.update(ref, { totalRegistros: total, bloqueadoAutomatico: automaticClosure(next), actualizadoEn: serverTimestamp(), actualizadoPor: user.uid });
    });
}

export async function deleteWorkshopRegistration(recordId) {
    await runTransaction(db, async transaction => {
        const ref = doc(db, "registros", recordId);
        const snapshot = await transaction.get(ref);
        if (!snapshot.exists()) return;
        const snapshots = await Promise.all(workshopIds(snapshot.data()).map(id => transaction.get(doc(db, "talleresConfig", id))));
        snapshots.filter(s => s.exists()).forEach(s => {
            const next = { ...s.data(), totalRegistros: Math.max(0, s.data().totalRegistros - 1) };
            transaction.update(s.ref, { totalRegistros: next.totalRegistros, bloqueadoAutomatico: automaticClosure(next), actualizadoEn: serverTimestamp() });
        });
        transaction.delete(ref);
    });
}

export async function setWorkshopRejection(recordId, workshopId, reject, reason, user) {
    await runTransaction(db, async transaction => {
        const ref = doc(db, "registros", recordId);
        const snapshot = await transaction.get(ref);
        if (!snapshot.exists() || !workshopIds(snapshot.data()).includes(workshopId)) throw new Error("El registro ya no pertenece a este taller.");
        const rejections = { ...snapshot.data().rechazosTalleres };
        if (reject) rejections[workshopId] = { motivo: reason || "", por: user.uid, fecha: serverTimestamp() };
        else delete rejections[workshopId];
        transaction.update(ref, { rechazosTalleres: rejections });
    });
}
