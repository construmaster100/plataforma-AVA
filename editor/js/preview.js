/* ══════════════════════════════════════════
   AVA Code Lab — motor de vista en vivo (Módulo 5)

   Reconstruye el documento del iframe aislado (sandbox="allow-scripts",
   sin allow-same-origin) cada vez que cambia cualquiera de los 3
   editores, con un pequeño debounce para no recalcular en cada tecla.
   El HTML del usuario nunca se ejecuta en el origen real del sitio,
   solo dentro de ese iframe con origen opaco.
══════════════════════════════════════════ */

const ACL_DEBOUNCE_MS = 150;
let aclDebounceId = null;

function aclConstruirDocumento(html, css, js) {
  return '<!DOCTYPE html><html><head><meta charset="UTF-8">' +
    '<style>' + css + '</style></head><body>' + html +
    '<script>' + js + '<\/script></body></html>';
}

function aclActualizarPreview() {
  const frame = document.getElementById('acl-preview');
  if (!frame || !window.aclEditores || !window.aclEditores.html) return;
  const html = window.aclEditores.html.getValue();
  const css = window.aclEditores.css.getValue();
  const js = window.aclEditores.js.getValue();
  frame.srcdoc = aclConstruirDocumento(html, css, js);
}

function aclProgramarActualizacion() {
  if (aclDebounceId) clearTimeout(aclDebounceId);
  aclDebounceId = setTimeout(aclActualizarPreview, ACL_DEBOUNCE_MS);
}
