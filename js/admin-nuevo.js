import {
    createUserWithEmailAndPassword,
    signOut
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

import {
    doc,
    serverTimestamp,
    setDoc
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

import {
    auth,
    db
} from "./firebase-core.js";

const form = document.getElementById("newAdminForm");
const messageBox = document.getElementById("adminRequestMessage");

function showMessage(text, type = "danger") {
    messageBox.className = `alert alert-${type}`;
    messageBox.textContent = text;
    messageBox.classList.remove("d-none");
}

form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const nombre = form.nombre.value.trim();
    const email = form.email.value.trim().toLowerCase();
    const password = form.password.value;
    const confirmPassword = form.confirmPassword.value;

    if (password !== confirmPassword) {
        showMessage("Las contraseñas no coinciden.");
        return;
    }

    if (password.length < 8) {
        showMessage("Utiliza una contraseña de por lo menos 8 caracteres.");
        return;
    }

    try {
        if (auth.currentUser) {
            await signOut(auth);
        }

        const credential = await createUserWithEmailAndPassword(
            auth,
            email,
            password
        );

        await setDoc(
            doc(db, "solicitudesAdmin", credential.user.uid),
            {
                nombre,
                email,
                estado: "pendiente",
                creadoEn: serverTimestamp()
            }
        );

        await signOut(auth);

        form.classList.add("d-none");
        showMessage(
            "Cuenta creada. Falta que el superusuario autorice tu UID en la colección administradores de Firestore.",
            "success"
        );
    } catch (error) {
        console.error(error);

        if (error.code === "auth/email-already-in-use") {
            showMessage(
                "Ese correo ya tiene una cuenta. Si ya fue autorizado, utiliza la página de acceso."
            );
            return;
        }

        showMessage(
            "No fue posible crear la cuenta administrativa."
        );
    }
});
