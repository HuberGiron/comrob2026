// Configuración del proyecto Firebase de COMRob 2026.
// Reemplaza los valores siguientes con los de Firebase Console >
// Configuración del proyecto > General > Tus apps > Aplicación web.
//
// La configuración web de Firebase NO es una contraseña.
// La seguridad real la proporcionan Authentication y las reglas de Firestore.

export const firebaseConfig = {
    apiKey: "AIzaSyB9knQ5zDxMEdualqBTAPv1R1TI_j6B4yM",
    authDomain: "comrob-2026.firebaseapp.com",
    projectId: "comrob-2026",
    storageBucket: "comrob-2026.firebasestorage.app",
    messagingSenderId: "4738001049",
    appId: "1:4738001049:web:274a8d762a360142177008"
};

export const firebaseConfigured = !Object.values(firebaseConfig).some(
    (value) => String(value).startsWith("REEMPLAZAR_")
);
