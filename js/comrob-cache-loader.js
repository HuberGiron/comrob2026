/* COMRob 2026 – loader estable para evitar JavaScript obsoleto en caché.
 * Mantener esta URL estable en el HTML. No necesita actualizaciones por versión.
 * Se ejecuta desde una etiqueta <script> al final del HTML.
 */
(function () {
    "use strict";
    const tag = document.currentScript;
    if (!tag || !tag.src) return;
    const url = new URL("scripts.js", tag.src);
    url.searchParams.set("actualizacion", String(Date.now()));
    // document.write mantiene la carga sincrónica, antes de DOMContentLoaded.
    // Se usa únicamente durante la lectura del HTML, antes de cerrar </body>.
    if (document.readyState === "loading") {
        document.write('<script src="' + url.href.replace(/&/g, "&amp;") + '"><\/script>');
    } else {
        // Respaldo para inyección tardía: ejecútese tras el DOM listo.
        const script = document.createElement("script");
        script.src = url.href;
        document.head.appendChild(script);
    }
}());
