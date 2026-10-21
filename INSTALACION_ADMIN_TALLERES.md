# Administración de talleres COMRob 2026

Esta actualización agrega `admin-talleres.html`, accesible desde el botón «Cupos y reportes de talleres» de `admin-registros.html`. Conserva los registros existentes y el acceso administrativo actual mediante `solicitudesAdmin/{UID}.autorizado == true`.

## Activación

1. Copia los archivos del ZIP en la raíz del repositorio, conservando carpetas y aceptando los reemplazos.
2. En Firebase Console, abre Firestore Database → Reglas. Publica el contenido completo de `firebase/firestore.rules`. Subir ese archivo al sitio o a GitHub no publica las reglas en Firebase.
3. Abre `admin-registros.html`, entra con tu cuenta autorizada y pulsa «Cupos y reportes de talleres».
4. Pulsa una vez «Inicializar talleres». El sistema contará las solicitudes ya existentes. No las duplica ni las modifica. Si interrumpes el proceso, puedes volver a pulsarlo: conserva los talleres ya inicializados.
5. En cada taller, configura su cupo y, si deseas cierre automático, el número extra de solicitudes y la casilla correspondiente. Guarda la configuración.

Hasta publicar las reglas e inicializar los talleres, los nuevos formularios muestran que las inscripciones no están disponibles. Los registros existentes siguen conservados. Los talleres se inicializan sin límite de cupo (0) y con cierre automático desactivado, para no inventar un límite para tus talleres.

## Asignación y lista de espera

- Tentativas: solicitudes pendientes de validación, sin confirmación de lugar.
- Validados: solicitudes activas cuya validación administrativa está completa. Este número incluye aceptados y lista de espera.
- Aceptados: los primeros registros validados por fecha y hora de inscripción, hasta el cupo configurado. Con cupo 0, todos los validados activos tienen lugar.
- Lista de espera: validados activos que exceden el cupo; se numeran en el mismo orden.
- Rechazados: solicitudes que la administración rechaza específicamente en ese taller. Rechazar en un taller no rechaza las demás selecciones de la persona.

La fecha de inscripción original define el orden, no la fecha de validación ni el tipo de participante. Si dos fechas coinciden exactamente, el ID del registro resuelve el empate de forma estable. Los registros sin fecha se muestran al final.

Si rechazas a una persona aceptada, reabres su validación o aumentas el cupo, el sistema recalcula la lista y promueve al siguiente validado en espera. Reintegrar un rechazo o validar una solicitud antigua también recalcula el orden, y puede desplazar a una solicitud posterior a la espera. La asignación se calcula con el estado actual; no se envían correos ni notificaciones automáticamente.

Validar o reabrir un registro afecta todos los talleres seleccionados en ese registro. El rechazo sí es individual por taller. Los correos repetidos se señalan, pero no se eliminan ni fusionan automáticamente.

## Bloqueo de inscripciones

El botón «Bloquear inscripciones» aplica un bloqueo manual. «Quitar bloqueo manual» lo retira, aunque un cierre automático vigente sigue cerrando las inscripciones.

El cierre automático se calcula con todas las solicitudes existentes, incluidas pendientes, espera y rechazadas. Con cupo 25 y extra 5, se aceptan como máximo 30 solicitudes; al guardarse la número 30, el taller se cierra. El extra permite recibir solicitudes adicionales, pero no aumenta los 25 lugares del taller. Si los 30 registros están pendientes, aún no hay lugares confirmados.

Para reabrir un cierre automático, aumenta cupo o extra, o desmarca el cierre automático y guarda. Rechazar una solicitud no reduce el número de solicitudes recibidas. Eliminar un registro desde el administrador general sí descuenta sus talleres y puede reabrir un cierre automático; el bloqueo manual permanece independiente.

En las páginas individuales y las tarjetas públicas aparece «Cupo lleno» / «Full capacity» cuando el taller está bloqueado. Los enlaces de registro del taller y su casilla del formulario se deshabilitan. La comprobación también se realiza dentro de una transacción y en las reglas de Firestore, para impedir que solicitudes simultáneas rebasen cupo + extra. Un formulario con varios talleres se guarda completo o no se guarda: no deja inscripciones parciales.

Las páginas públicas solo leen cupos y contadores de `talleresConfig`. Los datos personales de `registros` siguen disponibles únicamente para administradores autorizados.

## Reportes

«Exportar este taller» genera un Excel con hojas Resumen, Todos, Aceptados, Lista de espera, Pendientes y Rechazados. Exporta el taller completo, independientemente de los filtros de pantalla, e incluye orden de inscripción, validación, asignación, posición de espera y motivo de rechazo.

«Exportar reporte general» incluye los cinco talleres con las mismas hojas. Su detalle tiene una fila por solicitud y taller: una persona inscrita en dos talleres aparece en ambos. Una hoja vacía indica que no hay registros en esa categoría.

«Revisar contador» recalcula el número de solicitudes de un taller a partir de los registros existentes. Úsalo si alguien modificó o eliminó documentos directamente desde Firebase o con una versión antigua del administrador.

## Comprobación después de instalar

Comprueba los totales de los cinco talleres con tus registros actuales. Configura un límite, abre su página individual en español y en inglés, activa el bloqueo manual y confirma que se muestre «Cupo lleno» y que el formulario impida seleccionarlo. Retira el bloqueo cuando termines. Antes de activar un cierre automático en producción, revisa el cupo y el número extra de solicitudes que deseas permitir.

El ZIP fue validado con pruebas del modelo de asignación, transacciones simuladas y revisión de estructura/enlaces. La publicación de reglas y la comprobación con el proyecto Firebase activo deben realizarse después de instalar; no se modificaron datos de producción durante la preparación de esta entrega.
