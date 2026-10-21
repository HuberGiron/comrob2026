import { collection, doc, onSnapshot, query, serverTimestamp, updateDoc, where } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import { db } from "./firebase-core.js";
import { logoutAdministrator, requireAdministrator } from "./admin-core.js";
import { WORKSHOPS, ASSIGNMENT_LABELS, automaticClosure, buildRoster, defaultConfig, excelSafe, registrationClosed } from "./talleres-modelo.js";
import { initializeWorkshops, reconcileWorkshop, saveWorkshopConfig, setWorkshopRejection, watchWorkshopConfigs } from "./talleres-datos.js";

const $ = id => document.getElementById(id);
const safe = value => String(value ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
let user, records = [], configs = {}, recordsReady = false, configsReady = false, configDirty = false;
let selectedId = WORKSHOPS.some(w => w.id === location.hash.slice(1)) ? location.hash.slice(1) : WORKSHOPS[0].id;
const selected = () => WORKSHOPS.find(w => w.id === selectedId);
const configFor = id => configs[id] || defaultConfig();
const rosterFor = id => buildRoster(records, id, configFor(id));

function notice(message, danger = false) {
    $("adminNotice").className = "alert " + (danger ? "alert-danger" : "alert-success");
    $("adminNotice").textContent = message;
}
function date(value) {
    try { return value?.toDate().toLocaleString("es-MX", { timeZone:"America/Mexico_City" }) || "Sin fecha"; }
    catch { return "Sin fecha"; }
}
function state(id) {
    const c = configs[id];
    if (!c) return '<span class="badge bg-secondary">Pendiente de inicializar</span>';
    if (c.bloqueadoManual) return '<span class="badge bg-danger">Cierre manual</span>';
    if (automaticClosure(c)) return '<span class="badge bg-danger">Cierre automático: cupo + extra alcanzado</span>';
    return '<span class="badge bg-success">Inscripciones abiertas</span>';
}
function stat(label, value) { return `<div class="col-6 col-sm-4"><div class="small text-muted">${label}</div><div class="h5 mb-0">${value}</div></div>`; }
function render() {
    if (!recordsReady || !configsReady) return;
    $("initializeWorkshops").disabled = false;
    $("initializeWorkshops").hidden = WORKSHOPS.every(w => configs[w.id]?.inicializado);
    $("exportGeneral").disabled = false;
    $("workshopCards").innerHTML = WORKSHOPS.map(w => {
        const {counts:c} = rosterFor(w.id), config = configFor(w.id);
        return `<div class="col-12 col-md-6 col-xl-4"><article class="card h-100 shadow-sm ${w.id === selectedId ? "border-danger" : "border-0"}"><div class="card-body p-3 d-flex flex-column"><h2 class="h6 fw-bold mb-2">${safe(w.nombre)}</h2><div class="mb-3">${state(w.id)}</div><div class="row g-3 mb-3">${stat("Solicitudes",c.total)}${stat("Tentativas",c.pendientes)}${stat("Validados",c.validados)}${stat("Aceptados",c.aceptados)}${stat("En espera",c.espera)}${stat("Rechazados",c.rechazados)}</div><p class="small text-muted">Cupo: ${config.cupo || "sin límite"} · Extra: ${config.extras}</p><div class="d-flex flex-wrap gap-2 mt-auto"><button class="btn btn-sm btn-outline-danger" data-select="${w.id}">Ver inscritos y configurar</button><button class="btn btn-sm btn-outline-success" data-export="${w.id}">Exportar Excel</button></div></div></article></div>`;
    }).join("");
    $("workshopDetail").hidden = false;
    $("workshopTitle").textContent = selected().nombre;
    $("workshopSchedule").textContent = selected().horario;
    $("workshopState").innerHTML = state(selectedId);
    const configured = Boolean(configs[selectedId]?.inicializado);
    $("configFields").disabled = !configured;
    $("toggleManual").disabled = !configured;
    $("reconcileCount").disabled = !configured;
    $("exportWorkshop").disabled = false;
    $("toggleManual").textContent = configFor(selectedId).bloqueadoManual ? "Quitar bloqueo manual" : "Bloquear inscripciones";
    if (!configDirty) fillConfig();
    const roster = rosterFor(selectedId);
    $("counterStatus").textContent = configured && configs[selectedId].totalRegistros !== roster.counts.total
        ? "El contador y los registros no coinciden. Si el aviso persiste, usa «Revisar contador»."
        : "";
    renderRoster();
}
function fillConfig() {
    const c = configFor(selectedId);
    $("workshopCapacity").value = c.cupo;
    $("workshopExtras").value = c.extras;
    $("workshopAutoClose").checked = c.bloqueoAutomatico;
    $("configDirty").textContent = "";
    updateThreshold();
}
function updateThreshold() {
    const capacity = Number($("workshopCapacity").value), extras = Number($("workshopExtras").value);
    $("closureThreshold").textContent = $("workshopAutoClose").checked
        ? `Cierre al recibir ${capacity + extras} solicitudes. Recibidas: ${configFor(selectedId).totalRegistros}.`
        : "Cierre automático desactivado; la lista de espera puede seguir recibiendo solicitudes.";
}
function renderRoster() {
    const { rows } = rosterFor(selectedId);
    const filter = $("assignmentFilter").value;
    const search = $("workshopSearch").value.trim().toLocaleLowerCase("es-MX");
    const visible = rows.filter(row => (!filter || row.assignment === filter) && (!search || [row.record.codigoRegistro, ...Object.values(row.record.participante || {})].join(" ").toLocaleLowerCase("es-MX").includes(search)));
    $("workshopListCount").textContent = `${visible.length} de ${rows.length} solicitudes · Orden cronológico de inscripción`;
    const colors = { aceptado:"success", espera:"warning text-dark", pendiente:"secondary", rechazado:"danger" };
    $("workshopRoster").innerHTML = visible.length ? visible.map(row => {
        const r = row.record, p = r.participante || {};
        return `<tr><td class="fw-semibold">${row.order}</td><td class="small">${safe(date(r.creadoEn))}<br><code>${safe(r.codigoRegistro)}</code></td><td><div class="fw-semibold">${safe(p.nombre)}</div><div class="small">${safe(p.email)}</div>${row.duplicate ? '<span class="badge bg-warning text-dark">Correo repetido</span>' : ""}</td><td class="small">${safe(p.institucion)}</td><td><span class="badge ${r.estado === "validado" ? "bg-success" : "bg-secondary"}">${r.estado === "validado" ? "Validado" : "Pendiente"}</span></td><td><span class="badge bg-${colors[row.assignment]}">${safe(ASSIGNMENT_LABELS[row.assignment])}${row.waitingPosition ? " #" + row.waitingPosition : ""}</span>${row.rejection?.motivo ? '<div class="small text-muted mt-1">'+safe(row.rejection.motivo)+'</div>' : ""}</td><td><div class="d-flex flex-wrap gap-2"><button class="btn btn-sm btn-outline-${r.estado === "validado" ? "warning" : "success"}" data-action="validate" data-id="${safe(r.id)}">${r.estado === "validado" ? "Reabrir validación" : "Validar"}</button><button class="btn btn-sm btn-outline-${row.assignment === "rechazado" ? "secondary" : "danger"}" data-action="${row.assignment === "rechazado" ? "restore" : "reject"}" data-id="${safe(r.id)}">${row.assignment === "rechazado" ? "Reintegrar" : "Rechazar en este taller"}</button></div></td></tr>`;
    }).join("") : '<tr><td colspan="7" class="text-muted text-center py-4">No hay solicitudes con estos filtros.</td></tr>';
}
async function operation(button, callback, success) {
    button.disabled = true;
    try { await callback(); notice(success); }
    catch(error) { console.error(error); notice(error.code === "permission-denied" ? "No hay permisos para esta operación. Verifica que firebase/firestore.rules esté publicado y que tu cuenta esté autorizada." : error.message || "No fue posible completar la operación.", true); }
    finally { button.disabled = false; }
}

function exportRows(id) {
    return rosterFor(id).rows.map(row => {
        const r = row.record, p = r.participante || {};
        return Object.fromEntries(Object.entries({ Taller:WORKSHOPS.find(w => w.id === id).nombre, TallerID:id, OrdenInscripcion:row.order, Codigo:r.codigoRegistro, Nombre:p.nombre, Correo:p.email, Institucion:p.institucion, Programa:p.programa, TipoParticipante:p.tipoParticipante, ArticuloID:p.articuloId || "", FechaInscripcion:date(r.creadoEn), Validacion:r.estado, FechaValidacion:date(r.validadoEn), Asignacion:ASSIGNMENT_LABELS[row.assignment], PosicionEspera:row.waitingPosition || "", MotivoRechazo:row.rejection?.motivo || "", CorreoRepetido:row.duplicate ? "Sí" : "No" }).map(([key,value]) => [key, typeof value === "number" ? value : excelSafe(value)]));
    });
}
function exportReport(ids) {
    const XLSX = window.XLSX;
    if (!XLSX) { notice("No fue posible cargar la librería Excel. Recarga la página e intenta nuevamente.",true); return; }
    const workbook = XLSX.utils.book_new();
    const add = (name,rows) => { const sheet = XLSX.utils.json_to_sheet(rows.length ? rows : [{SinRegistros:"No hay registros"}]); sheet["!cols"] = Object.keys(rows[0] || {}).map(key => ({wch: /Nombre|Taller|Correo|Institucion|Motivo/.test(key) ? 42 : 22})); XLSX.utils.book_append_sheet(workbook,sheet,name); };
    add("Resumen",ids.map(id => { const c=rosterFor(id).counts, cfg=configFor(id); return { Taller:WORKSHOPS.find(w=>w.id===id).nombre, Cupo:cfg.cupo || "Sin límite", Extra:cfg.extras, Solicitudes:c.total, Tentativas:c.pendientes, Validados:c.validados, Aceptados:c.aceptados, EnEspera:c.espera, Rechazados:c.rechazados, BloqueoManual:cfg.bloqueadoManual?"Sí":"No", CierreAutomatico:cfg.bloqueoAutomatico?"Sí":"No", Inscripciones:configs[id] ? (registrationClosed(cfg)?"Cerradas":"Abiertas") : "Sin inicializar" }; }));
    const rows = ids.flatMap(exportRows);
    add("Todos",rows);
    for (const [key,name] of Object.entries({aceptado:"Aceptados",espera:"Lista de espera",pendiente:"Pendientes",rechazado:"Rechazados"})) add(name,rows.filter(row=>row.Asignacion===ASSIGNMENT_LABELS[key]));
    const stamp=new Date().toISOString().slice(0,19).replace(/[:T]/g,"-");
    XLSX.writeFile(workbook,`COMRob_Talleres_${ids.length===1?ids[0]:"General"}_${stamp}.xlsx`);
}

$("workshopCards").addEventListener("click",event=>{
    const button=event.target.closest("button");if(!button)return;
    if(button.dataset.export) { exportReport([button.dataset.export]); return; }
    if(button.dataset.select) {
        if(configDirty && !window.confirm("Hay cambios de cupo sin guardar. ¿Descartarlos y abrir otro taller?"))return;
        selectedId=button.dataset.select;configDirty=false;location.hash=selectedId;render();$("workshopDetail").scrollIntoView({behavior:"smooth",block:"start"});
    }
});
$("workshopConfig").addEventListener("input",()=>{configDirty=true;$("configDirty").textContent="Cambios sin guardar";updateThreshold();});
$("workshopConfig").addEventListener("submit",event=>{
    event.preventDefault();const id=selectedId;
    operation($("saveConfig"),async()=>{await saveWorkshopConfig(id,{cupo:Number($("workshopCapacity").value),extras:Number($("workshopExtras").value),bloqueoAutomatico:$("workshopAutoClose").checked},user);configDirty=false;$("configDirty").textContent="Configuración guardada";},"Configuración guardada. La disponibilidad pública se actualiza automáticamente.");
});
$("toggleManual").addEventListener("click",()=>{const id=selectedId;operation($("toggleManual"),()=>saveWorkshopConfig(id,{bloqueadoManual:!configFor(id).bloqueadoManual},user),"Bloqueo manual actualizado. Si el cierre automático sigue activo y alcanzó el límite, las inscripciones permanecen cerradas.");});
$("reconcileCount").addEventListener("click",()=>operation($("reconcileCount"),()=>reconcileWorkshop(selectedId,user),"Contador actualizado con los registros existentes."));
$("initializeWorkshops").addEventListener("click",()=>operation($("initializeWorkshops"),()=>initializeWorkshops(user),"Talleres inicializados con sus registros existentes. Configura ahora el cupo de cada uno."));
$("assignmentFilter").addEventListener("change",renderRoster);
$("workshopSearch").addEventListener("input",renderRoster);
$("exportGeneral").addEventListener("click",()=>exportReport(WORKSHOPS.map(w=>w.id)));
$("exportWorkshop").addEventListener("click",()=>exportReport([selectedId]));
$("logoutButton").addEventListener("click",logoutAdministrator);
$("workshopRoster").addEventListener("click",async event=>{
    const button=event.target.closest("button[data-action]");if(!button)return;
    const r=records.find(item=>item.id===button.dataset.id);if(!r)return;
    const id=selectedId;
    if(button.dataset.action==="validate") {
        await operation(button,()=>updateDoc(doc(db,"registros",r.id),{estado:r.estado==="validado"?"pendiente":"validado",validadoEn:r.estado==="validado"?null:serverTimestamp(),validadoPor:r.estado==="validado"?null:user.uid,correoValidacionEnviado:false}),"Validación actualizada; se recalcularon los lugares por orden de inscripción.");
    } else {
        const reject=button.dataset.action==="reject";
        const reason=reject?window.prompt("Motivo del rechazo en este taller (opcional). Cancelar conserva el registro.",""):"";
        if(reason===null)return;
        await operation(button,()=>setWorkshopRejection(r.id,id,reject,reason,user),reject?"Solicitud rechazada solo en este taller. El siguiente validado en espera ocupa el lugar disponible.":"Solicitud reintegrada al orden de inscripción del taller.");
    }
});

async function start() {
    user=await requireAdministrator();$("adminEmail").textContent=user.email || user.uid;
    watchWorkshopConfigs(data=>{configs=data;configsReady=true;render();},error=>{console.error(error);notice("No fue posible leer los cupos. Publica las reglas de Firestore incluidas en esta actualización.",true);});
    onSnapshot(query(collection(db,"registros"),where("tipo","==","taller")),snapshot=>{records=snapshot.docs.map(item=>({...item.data(),id:item.id}));recordsReady=true;render();},error=>{console.error(error);notice("No fue posible leer los registros de talleres. Verifica los permisos de administración.",true);});
}
start().catch(error=>{console.error(error);notice("No fue posible abrir la administración de talleres.",true);});
