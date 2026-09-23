import {
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
    signOut
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

import {
    auth
} from "./firebase-core.js";

import {
    isAdministrator
} from "./admin-core.js";

const form = document.getElementById("adminLoginForm");
const errorBox = document.getElementById("loginError");
const resetButton = document.getElementById("resetPassword");

function showMessage(message, type = "danger") {
    errorBox.className = `alert alert-${type}`;
    errorBox.textContent = message;
    errorBox.classList.remove("d-none");
}

form.addEventListener("submit", async (event) => {
    event.preventDefault();
    errorBox.classList.add("d-none");

    const email = form.email.value.trim();
    const password = form.password.value;

    try {
        if (auth.currentUser?.isAnonymous) {
            await signOut(auth);
        }

        const credential = await signInWithEmailAndPassword(
            auth,
            email,
            password
        );

        if (!(await isAdministrator(credential.user))) {
            await signOut(auth);
            showMessage(
                "La cuenta existe, pero todavía no está autorizada como administrador."
            );
            return;
        }

        window.location.href = "admin-registros.html";
    } catch (error) {
        console.error(error);
        showMessage(
            "No fue posible iniciar sesión. Verifica el correo y la contraseña."
        );
    }
});

resetButton.addEventListener("click", async () => {
    const email = form.email.value.trim();

    if (!email) {
        showMessage(
            "Escribe primero el correo administrativo para enviar el enlace de recuperación."
        );
        return;
    }

    try {
        await sendPasswordResetEmail(auth, email);
        showMessage(
            "Se solicitó el correo de recuperación. Revisa la bandeja de entrada.",
            "success"
        );
    } catch (error) {
        console.error(error);
        showMessage(
            "No fue posible solicitar la recuperación de contraseña."
        );
    }
});
