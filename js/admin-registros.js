import {
    collection,
    deleteDoc,
    doc,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    updateDoc
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

import {
    db
} from "./firebase-core.js";

import {
    logoutAdministrator,
    requireAdministrator
} from "./admin-core.js";

let administrator = null;
let allRecords = [];
let visibleRecords = [];

const tableBody = document.getElementById("recordsBody");
const typeFilter = document.getElementById("filterType");
const statusFilter = document.getElementById("filterStatus");
const searchInput = document.getElementById("filterSearch");
const countLabel = document.getElementById("recordCount");
const logoutButton = document.getElementById("logoutButton");
const exportAllButton = document.getElementById("exportAll");
const exportViewButton = document.getElementById("exportView");

const detailModalElement = document.getElementById("detailModal");
const detailModal = new bootstrap.Modal(detailModalElement);
const detailContent = document.getElementById("detailContent");

function safe(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function formatDate(value) {
    if (!value) {
        return "—";
    }

    try {
        return value.toDate().toLocaleString("es-MX");
    } catch {
        return "—";
    }
}

function typeLabel(type) {
    return {
        poster: "Poster",
        taller: "Taller",
        futbot: "FutBot"
    }[type] || type;
}

function participantTypeLabel(type) {
    return {
        ponente_estudiante: "Ponente estudiante",
        ponente_profesional: "Ponente investigador/profesional",
        estudiante_asistente: "Estudiante asistente",
        profesional_asistente: "Investigador/profesional asistente",
        otro: "Otro"
    }[type] || type || "—";
}

function statusBadge(status) {
    if (status === "validado") {
        return '<span class="badge bg-success">Validado</span>';
    }

    return '<span class="badge bg-warning text-dark">Pendiente</span>';
}

function searchableText(record) {
    const p = record.participante || {};
    const team = record.equipo || {};

    return [
        record.codigoRegistro,
        record.tipo,
        record.estado,
        p.nombre,
        p.email,
        p.institucion,
        p.programa,
        p.articuloId,
        team.nombre,
        ...(record.talleresDetalle || []).map((item) => item.nombre)
    ]
        .join(" ")
        .toLowerCase();
}

function applyFilters() {
    const type = typeFilter.value;
    const status = statusFilter.value;
    const search = searchInput.value.trim().toLowerCase();

    visibleRecords = allRecords.filter((record) => {
        const typeOk = !type || record.tipo === type;
        const statusOk = !status || record.estado === status;
        const searchOk = !search ||
            searchableText(record).includes(search);

        return typeOk && statusOk && searchOk;
    });

    renderTable();
}

function renderTable() {
    countLabel.textContent =
        `${visibleRecords.length} registro(s) mostrado(s)`;

    if (!visibleRecords.length) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-5 text-muted">
                    No hay registros con los filtros seleccionados.
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = visibleRecords.map((record) => {
        const p = record.participante || {};
        const extra = record.tipo === "futbot"
            ? record.equipo?.nombre || "—"
            : record.tipo === "poster"
                ? record.poster?.nombreProyecto || "—"
                : (record.talleresDetalle || [])
                    .map((item) => item.nombre)
                    .join(", ") || "—";

        const priority = record.tipo === "taller"
            ? record.prioridad === 1
                ? '<span class="badge bg-danger">Ponente</span>'
                : '<span class="badge bg-secondary">General</span>'
            : "—";

        return `
            <tr>
                <td><code>${safe(record.codigoRegistro)}</code></td>
                <td>${safe(typeLabel(record.tipo))}</td>
                <td>
                    <div class="fw-semibold">${safe(p.nombre)}</div>
                    <div class="small text-muted">${safe(p.email)}</div>
                </td>
                <td>${safe(p.institucion)}</td>
                <td>${priority}</td>
                <td class="small">${safe(extra)}</td>
                <td>${statusBadge(record.estado)}</td>
                <td class="text-nowrap">
                    <button
                        class="btn btn-sm btn-outline-secondary"
                        data-action="view"
                        data-id="${record.id}"
                    >
                        Ver
                    </button>
                    <button
                        class="btn btn-sm ${
                            record.estado === "validado"
                                ? "btn-outline-warning"
                                : "btn-outline-success"
                        }"
                        data-action="${
                            record.estado === "validado"
                                ? "pending"
                                : "validate"
                        }"
                        data-id="${record.id}"
                    >
                        ${
                            record.estado === "validado"
                                ? "Reabrir"
                                : "Validar"
                        }
                    </button>
                    <button
                        class="btn btn-sm btn-outline-danger"
                        data-action="delete"
                        data-id="${record.id}"
                    >
                        Eliminar
                    </button>
                </td>
            </tr>
        `;
    }).join("");
}

function detailRows(record) {
    const p = record.participante || {};
    const rows = [
        ["Código", record.codigoRegistro],
        ["Tipo", typeLabel(record.tipo)],
        ["Estado", record.estado],
        ["Nombre", p.nombre],
        ["Correo", p.email],
        ["Institución", p.institucion],
        ["Programa / área", p.programa],
        ["Tipo de participante", participantTypeLabel(p.tipoParticipante)],
        ["ID de artículo", p.articuloId || "—"],
        ["Registrado", formatDate(record.creadoEn)],
        ["Validado", formatDate(record.validadoEn)]
    ];

    if (record.tipo === "poster") {
        rows.push(
            ["Proyecto", record.poster?.nombreProyecto || "—"],
            ["Autores adicionales", record.poster?.autoresAdicionales || "—"]
        );
    }

    if (record.tipo === "taller") {
        rows.push(
            [
                "Prioridad",
                record.prioridad === 1
                    ? "Ponente / prioridad 1"
                    : "General / prioridad 2"
            ],
            [
                "Talleres",
                (record.talleresDetalle || [])
                    .map((item) => `${item.nombre} (${item.horario})`)
                    .join(" | ") || "—"
            ]
        );
    }

    if (record.tipo === "futbot") {
        rows.push(
            ["Equipo", record.equipo?.nombre || "—"],
            ["Modalidad", record.equipo?.modalidad || "—"]
        );
    }

    return rows;
}

function renderDetail(record) {
    const rows = detailRows(record);

    let html = `
        <div class="table-responsive">
            <table class="table table-sm table-bordered align-middle">
                <tbody>
                    ${rows.map(([label, value]) => `
                        <tr>
                            <th class="bg-light" style="width: 30%">
                                ${safe(label)}
                            </th>
                            <td>${safe(value)}</td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
        </div>
    `;

    if (record.tipo === "futbot") {
        html += `
            <h3 class="h6 mt-4">Integrantes</h3>
            <div class="table-responsive">
                <table class="table table-sm table-bordered">
                    <thead class="table-light">
                        <tr>
                            <th>#</th>
                            <th>Nombre</th>
                            <th>Correo</th>
                            <th>Institución</th>
                            <th>Programa</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${(record.equipo?.integrantes || []).map((member) => `
                            <tr>
                                <td>${safe(member.numero)}</td>
                                <td>${safe(member.nombre)}</td>
                                <td>${safe(member.email)}</td>
                                <td>${safe(member.institucion)}</td>
                                <td>${safe(member.programa)}</td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            </div>
        `;

        const advisor = record.equipo?.asesor;

        if (advisor) {
            html += `
                <h3 class="h6 mt-4">Asesor</h3>
                <p class="mb-0">
                    <strong>${safe(advisor.nombre)}</strong><br>
                    ${safe(advisor.email)}<br>
                    ${safe(advisor.institucion)}
                </p>
            `;
        }
    }

    html += `
        <hr>
        <div class="small text-muted">
            <div><strong>Documento Firestore:</strong> ${safe(record.id)}</div>
            <div>
                <strong>Correo de validación enviado:</strong>
                ${record.correoValidacionEnviado ? "Sí" : "No"}
            </div>
        </div>
    `;

    detailContent.innerHTML = html;
}

async function validateRecord(record, state) {
    const update = {
        estado: state
    };

    if (state === "validado") {
        update.validadoEn = serverTimestamp();
        update.validadoPor = administrator.uid;
        update.correoValidacionEnviado = false;
    } else {
        update.validadoEn = null;
        update.validadoPor = null;
        update.correoValidacionEnviado = false;
    }

    await updateDoc(
        doc(db, "registros", record.id),
        update
    );
}

async function removeRecord(record) {
    const accepted = window.confirm(
        `¿Eliminar definitivamente ${record.codigoRegistro}? Esta acción no se puede deshacer.`
    );

    if (!accepted) {
        return;
    }

    await deleteDoc(
        doc(db, "registros", record.id)
    );
}

tableBody.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-action]");

    if (!button) {
        return;
    }

    const record = allRecords.find(
        (item) => item.id === button.dataset.id
    );

    if (!record) {
        return;
    }

    button.disabled = true;

    try {
        switch (button.dataset.action) {
            case "view":
                renderDetail(record);
                detailModal.show();
                break;

            case "validate":
                await validateRecord(record, "validado");
                break;

            case "pending":
                await validateRecord(record, "pendiente");
                break;

            case "delete":
                await removeRecord(record);
                break;
        }
    } catch (error) {
        console.error(error);
        alert(
            "No fue posible completar la operación. Revisa los permisos de Firestore."
        );
    } finally {
        button.disabled = false;
    }
});

function timestampForFile() {
    const date = new Date();

    return [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0"),
        "_",
        String(date.getHours()).padStart(2, "0"),
        String(date.getMinutes()).padStart(2, "0")
    ].join("");
}

function baseExport(record) {
    const p = record.participante || {};

    return {
        Codigo: record.codigoRegistro,
        Estado: record.estado,
        Nombre: p.nombre,
        Correo: p.email,
        Institucion: p.institucion,
        Programa: p.programa,
        TipoParticipante: participantTypeLabel(p.tipoParticipante),
        ArticuloID: p.articuloId || "",
        FechaRegistro: formatDate(record.creadoEn),
        FechaValidacion: formatDate(record.validadoEn),
        CorreoValidacionEnviado:
            record.correoValidacionEnviado ? "Sí" : "No"
    };
}

function flattenPoster(record) {
    return {
        ...baseExport(record),
        Proyecto: record.poster?.nombreProyecto || "",
        AutoresAdicionales:
            record.poster?.autoresAdicionales || ""
    };
}

function flattenWorkshop(record) {
    return {
        ...baseExport(record),
        Prioridad: record.prioridad || "",
        EsPonente: record.esPonente ? "Sí" : "No",
        Talleres: (record.talleresDetalle || [])
            .map((item) => item.nombre)
            .join(" | "),
        Horarios: (record.talleresDetalle || [])
            .map((item) => item.horario)
            .join(" | ")
    };
}

function flattenFutbot(record) {
    const team = record.equipo || {};
    const members = team.integrantes || [];

    const row = {
        ...baseExport(record),
        Equipo: team.nombre || "",
        Modalidad: team.modalidad || "",
        NumeroIntegrantes: members.length,
        AsesorNombre: team.asesor?.nombre || "",
        AsesorCorreo: team.asesor?.email || "",
        AsesorInstitucion: team.asesor?.institucion || ""
    };

    for (let index = 0; index < 5; index += 1) {
        const member = members[index];

        row[`Integrante${index + 1}Nombre`] = member?.nombre || "";
        row[`Integrante${index + 1}Correo`] = member?.email || "";
        row[`Integrante${index + 1}Institucion`] = member?.institucion || "";
        row[`Integrante${index + 1}Programa`] = member?.programa || "";
    }

    return row;
}

function exportWorkbook(records, mode) {
    if (!window.XLSX) {
        alert("No se pudo cargar la librería para generar Excel.");
        return;
    }

    if (!records.length) {
        alert("No hay registros para exportar.");
        return;
    }

    const workbook = XLSX.utils.book_new();

    if (mode === "all") {
        const groups = {
            Posters: records
                .filter((item) => item.tipo === "poster")
                .map(flattenPoster),
            Talleres: records
                .filter((item) => item.tipo === "taller")
                .map(flattenWorkshop),
            FutBot: records
                .filter((item) => item.tipo === "futbot")
                .map(flattenFutbot)
        };

        for (const [name, rows] of Object.entries(groups)) {
            const sheet = XLSX.utils.json_to_sheet(
                rows.length ? rows : [{ SinRegistros: "" }]
            );

            XLSX.utils.book_append_sheet(
                workbook,
                sheet,
                name
            );
        }
    } else {
        const rows = records.map((record) => {
            if (record.tipo === "poster") {
                return {
                    Tipo: "Poster",
                    ...flattenPoster(record)
                };
            }

            if (record.tipo === "taller") {
                return {
                    Tipo: "Taller",
                    ...flattenWorkshop(record)
                };
            }

            return {
                Tipo: "FutBot",
                ...flattenFutbot(record)
            };
        });

        XLSX.utils.book_append_sheet(
            workbook,
            XLSX.utils.json_to_sheet(rows),
            "Vista"
        );
    }

    XLSX.writeFile(
        workbook,
        `COMRob_Registros_2026_${timestampForFile()}.xlsx`
    );
}

typeFilter.addEventListener("change", applyFilters);
statusFilter.addEventListener("change", applyFilters);
searchInput.addEventListener("input", applyFilters);
logoutButton.addEventListener("click", logoutAdministrator);

exportAllButton.addEventListener("click", () => {
    exportWorkbook(allRecords, "all");
});

exportViewButton.addEventListener("click", () => {
    exportWorkbook(visibleRecords, "view");
});

async function start() {
    administrator = await requireAdministrator();

    document.getElementById("adminEmail").textContent =
        administrator.email || administrator.uid;

    const recordsQuery = query(
        collection(db, "registros"),
        orderBy("creadoEn", "desc")
    );

    onSnapshot(
        recordsQuery,
        (snapshot) => {
            allRecords = snapshot.docs.map((item) => ({
                id: item.id,
                ...item.data()
            }));

            applyFilters();
        },
        (error) => {
            console.error(error);
            tableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center py-5 text-danger">
                        No fue posible leer los registros. Verifica que el usuario sea administrador y que las reglas de Firestore estén publicadas.
                    </td>
                </tr>
            `;
        }
    );
}

start();
