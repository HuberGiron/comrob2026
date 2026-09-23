import {
    collection,
    doc,
    serverTimestamp,
    setDoc
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

import {
    db,
    ensurePublicUser
} from "./firebase-core.js";

const form = document.querySelector("[data-registration-form]");

if (!form) {
    throw new Error("No se encontró el formulario de registro.");
}

const language = document.documentElement.lang.toLowerCase().startsWith("en")
    ? "en"
    : "es";

const messages = {
    es: {
        saving: "Guardando registro...",
        submit: "Enviar registro",
        firebaseError:
            "No fue posible guardar el registro. Verifica la configuración de Firebase o intenta nuevamente.",
        articleRequired:
            "Los ponentes/presentadores deben indicar el ID de su artículo.",
        workshopRequired:
            "Selecciona por lo menos un taller.",
        workshopConflict:
            "Seleccionaste talleres que se imparten al mismo tiempo. Ajusta tu selección antes de continuar.",
        futbotMembers:
            "FutBot requiere por lo menos 2 integrantes y permite un máximo de 5.",
        partialMember:
            "Si agregas un integrante opcional, completa al menos nombre, correo e institución.",
        successTitle: "Registro recibido correctamente",
        successBody:
            "La información de registro y pago será revisada por el Comité Organizador. Recibirás un correo electrónico cuando tu participación haya sido validada.",
        codeLabel: "Código de registro"
    },
    en: {
        saving: "Saving registration...",
        submit: "Submit registration",
        firebaseError:
            "The registration could not be saved. Check the Firebase configuration or try again.",
        articleRequired:
            "Presenters must provide their paper ID.",
        workshopRequired:
            "Select at least one workshop.",
        workshopConflict:
            "You selected workshops that take place at the same time. Adjust your selection before continuing.",
        futbotMembers:
            "FutBot requires at least 2 team members and allows a maximum of 5.",
        partialMember:
            "If you add an optional team member, complete at least name, email, and institution.",
        successTitle: "Registration received",
        successBody:
            "Your registration and payment information will be reviewed by the Organizing Committee. You will receive an email once your participation has been validated.",
        codeLabel: "Registration code"
    }
}[language];

const articleWrapper = document.querySelector("[data-article-wrapper]");
const participantType = form.querySelector('[name="tipoParticipante"]');
const articleInput = form.querySelector('[name="articuloId"]');
const successBox = document.querySelector("[data-success]");
const errorBox = document.querySelector("[data-error]");
const submitButton = form.querySelector('[type="submit"]');

function isPresenter(value) {
    return value === "ponente_estudiante" ||
        value === "ponente_profesional";
}

function refreshArticleField() {
    if (!articleWrapper || !participantType || !articleInput) {
        return;
    }

    const required = isPresenter(participantType.value);

    articleWrapper.classList.toggle("d-none", !required);
    articleInput.required = required;

    if (!required) {
        articleInput.value = "";
    }
}

participantType?.addEventListener("change", refreshArticleField);
refreshArticleField();

function field(name) {
    const input = form.querySelector(`[name="${name}"]`);
    return input ? input.value.trim() : "";
}

function participantData() {
    return {
        nombre: field("nombre"),
        email: field("email").toLowerCase(),
        institucion: field("institucion"),
        programa: field("programa"),
        tipoParticipante: field("tipoParticipante"),
        articuloId: field("articuloId")
    };
}

function makeRegistrationCode(type, documentId) {
    const prefix = {
        poster: "POST",
        taller: "TALL",
        futbot: "FUT"
    }[type];

    const clean = documentId
        .replace(/[^a-zA-Z0-9]/g, "")
        .slice(0, 7)
        .toUpperCase();

    return `${prefix}-${clean}`;
}

function readWorkshops() {
    return Array.from(
        form.querySelectorAll('input[name="talleres"]:checked')
    ).map((input) => ({
        id: input.value,
        nombre: input.dataset.name,
        horario: input.dataset.schedule,
        slots: (input.dataset.slots || "")
            .split("|")
            .filter(Boolean)
    }));
}

function workshopsHaveConflict(workshops) {
    const usedSlots = new Set();

    for (const workshop of workshops) {
        for (const slot of workshop.slots) {
            if (usedSlots.has(slot)) {
                return true;
            }
            usedSlots.add(slot);
        }
    }

    return false;
}

function readMembers() {
    const rows = Array.from(form.querySelectorAll("[data-member-row]"));
    const members = [];

    for (const row of rows) {
        const index = Number(row.dataset.memberRow);
        const nombre = row.querySelector('[name$="[nombre]"]')?.value.trim() || "";
        const email = row.querySelector('[name$="[email]"]')?.value.trim().toLowerCase() || "";
        const institucion = row.querySelector('[name$="[institucion]"]')?.value.trim() || "";
        const programa = row.querySelector('[name$="[programa]"]')?.value.trim() || "";

        const hasAnyValue = Boolean(nombre || email || institucion || programa);
        const required = index <= 2;

        if (required || hasAnyValue) {
            if (!nombre || !email || !institucion) {
                throw new Error(
                    required
                        ? messages.futbotMembers
                        : messages.partialMember
                );
            }

            members.push({
                numero: index,
                nombre,
                email,
                institucion,
                programa
            });
        }
    }

    if (members.length < 2 || members.length > 5) {
        throw new Error(messages.futbotMembers);
    }

    return members;
}

function readAdvisor() {
    const wrapper = form.querySelector("[data-advisor]");

    if (!wrapper) {
        return null;
    }

    const nombre = wrapper.querySelector('[name="asesorNombre"]')?.value.trim() || "";
    const email = wrapper.querySelector('[name="asesorEmail"]')?.value.trim().toLowerCase() || "";
    const institucion = wrapper.querySelector('[name="asesorInstitucion"]')?.value.trim() || "";

    if (!nombre && !email && !institucion) {
        return null;
    }

    return {
        nombre,
        email,
        institucion
    };
}

function showError(message) {
    if (!errorBox) {
        return;
    }

    errorBox.textContent = message;
    errorBox.classList.remove("d-none");
    errorBox.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
}

function clearError() {
    if (!errorBox) {
        return;
    }

    errorBox.textContent = "";
    errorBox.classList.add("d-none");
}

function showSuccess(code) {
    form.classList.add("d-none");

    if (!successBox) {
        return;
    }

    successBox.innerHTML = `
        <div class="alert alert-success shadow-sm mb-0" role="alert">
            <h2 class="h4 alert-heading">${messages.successTitle}</h2>
            <p>${messages.successBody}</p>
            <hr>
            <p class="mb-0">
                <strong>${messages.codeLabel}:</strong>
                <code class="fs-6">${code}</code>
            </p>
        </div>
    `;

    successBox.classList.remove("d-none");
    successBox.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearError();

    if (!form.reportValidity()) {
        return;
    }

    const type = form.dataset.registrationType;
    const participant = participantData();

    if (
        isPresenter(participant.tipoParticipante) &&
        !participant.articuloId
    ) {
        showError(messages.articleRequired);
        return;
    }

    let specificData = {};
    const presenter = isPresenter(participant.tipoParticipante);

    try {
        if (type === "poster") {
            specificData = {
                poster: {
                    nombreProyecto: field("nombreProyecto"),
                    autoresAdicionales: field("autoresAdicionales")
                }
            };
        }

        if (type === "taller") {
            const workshops = readWorkshops();

            if (!workshops.length) {
                throw new Error(messages.workshopRequired);
            }

            if (workshopsHaveConflict(workshops)) {
                throw new Error(messages.workshopConflict);
            }

            specificData = {
                talleres: workshops.map((item) => item.id),
                talleresDetalle: workshops.map((item) => ({
                    id: item.id,
                    nombre: item.nombre,
                    horario: item.horario
                })),
                esPonente: presenter,
                prioridad: presenter ? 1 : 2
            };
        }

        if (type === "futbot") {
            specificData = {
                equipo: {
                    nombre: field("nombreEquipo"),
                    modalidad: field("modalidad"),
                    integrantes: readMembers(),
                    asesor: readAdvisor()
                }
            };
        }

        submitButton.disabled = true;
        submitButton.dataset.originalText = submitButton.textContent;
        submitButton.textContent = messages.saving;

        const user = await ensurePublicUser();
        const documentReference = doc(collection(db, "registros"));
        const code = makeRegistrationCode(type, documentReference.id);

        const payload = {
            versionEsquema: 1,
            codigoRegistro: code,
            tipo: type,
            estado: "pendiente",
            participante: participant,
            creadoPor: user.uid,
            creadoEn: serverTimestamp(),
            idioma: language,
            origenPagina: window.location.pathname,
            validadoEn: null,
            validadoPor: null,
            correoValidacionEnviado: false,
            ...specificData
        };

        await setDoc(documentReference, payload);
        showSuccess(code);
    } catch (error) {
        console.error(error);
        showError(error.message || messages.firebaseError);
    } finally {
        submitButton.disabled = false;
        submitButton.textContent =
            submitButton.dataset.originalText || messages.submit;
    }
});
