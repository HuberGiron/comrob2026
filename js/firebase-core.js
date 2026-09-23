import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import {
    getAuth,
    onAuthStateChanged,
    signInAnonymously
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import {
    getFirestore
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

import {
    firebaseConfig,
    firebaseConfigured
} from "./firebase-config.js";

if (!firebaseConfigured) {
    console.warn(
        "Firebase todavía no está configurado. Edita js/firebase-config.js antes de probar los formularios."
    );
}

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export function waitForAuthState() {
    return new Promise((resolve) => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            unsubscribe();
            resolve(user);
        });
    });
}

export async function ensurePublicUser() {
    let user = await waitForAuthState();

    if (!user) {
        const credential = await signInAnonymously(auth);
        user = credential.user;
    }

    return user;
}
