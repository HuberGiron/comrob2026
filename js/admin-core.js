import {
    getDoc,
    doc
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

import {
    auth,
    db
} from "./firebase-core.js";

export function getAuthenticatedUser() {
    return new Promise((resolve) => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            unsubscribe();
            resolve(user);
        });
    });
}

export async function isAdministrator(user) {
    if (!user || user.isAnonymous) {
        return false;
    }

    const snapshot = await getDoc(
        doc(db, "solicitudesAdmin", user.uid)
    );

    return snapshot.exists() &&
        snapshot.data().autorizado === true;
}

export async function requireAdministrator() {
    const user = await getAuthenticatedUser();

    if (!user || !(await isAdministrator(user))) {
        window.location.href = "admin-login.html";
        throw new Error("Acceso administrativo requerido.");
    }

    return user;
}

export async function logoutAdministrator() {
    await signOut(auth);
    window.location.href = "admin-login.html";
}
