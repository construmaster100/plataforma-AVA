/* ══════════════════════════════════════════
   AVA Code Lab — motor de vista en vivo + consola (Módulo 5)

   Reconstruye el documento del iframe aislado (sandbox="allow-scripts",
   sin allow-same-origin) cada vez que cambia el editor "Tu código", con
   un pequeño debounce. El HTML del usuario nunca se ejecuta en el
   origen real del sitio, solo dentro de ese iframe con origen opaco.

   La consola de texto del panel 3 no lee la consola real del iframe
   (los navegadores no la exponen entre orígenes distintos): en vez de
   eso, se inyecta un script que intercepta console.log/warn/error y
   los errores no capturados dentro del propio iframe, y los reenvía al
   padre por postMessage — el único canal permitido entre ambos.
══════════════════════════════════════════ */

const ACL_DEBOUNCE_MS = 150;
let aclDebounceId = null;

function aclScriptConsola() {
  return `
    (function () {
      function enviar(tipo, args) {
        try {
          var texto = Array.prototype.map.call(args, function (a) {
            try { return typeof a === 'object' ? JSON.stringify(a) : String(a); }
            catch (e) { return String(a); }
          }).join(' ');
          parent.postMessage({ aclConsola: true, tipo: tipo, texto: texto }, '*');
        } catch (e) {}
      }
      ['log', 'warn', 'error', 'info'].forEach(function (metodo) {
        var original = console[metodo];
        console[metodo] = function () {
          enviar(metodo === 'info' ? 'log' : metodo, arguments);
          original.apply(console, arguments);
        };
      });
      window.onerror = function (mensaje, _url, linea) {
        enviar('error', [mensaje + (linea ? ' (línea ' + linea + ')' : '')]);
      };
    })();
  `;
}

function aclConstruirDocumento(html, css, js) {
  return '<!DOCTYPE html><html><head><meta charset="UTF-8">' +
    '<style>' + css + '</style></head><body>' + html +
    '<script>' + aclScriptConsola() + '<\/script>' +
    '<script>' + js + '<\/script></body></html>';
}

function aclLimpiarConsola() {
  const consola = document.getElementById('acl-consola');
  if (!consola) return;
  consola.innerHTML = '<div class="acl-consola-linea acl-consola-info">Ejecutando…</div>';
}

function aclActualizarPreview() {
  const frame = document.getElementById('acl-preview');
  if (!frame || !window.aclEditores || !window.aclEditores.html) return;
  const html = window.aclEditores.html.getValue();
  const css = window.aclEditores.css.getValue();
  const js = window.aclEditores.js.getValue();
  aclLimpiarConsola();
  frame.srcdoc = aclConstruirDocumento(html, css, js);
}

function aclProgramarActualizacion() {
  if (aclDebounceId) clearTimeout(aclDebounceId);
  aclDebounceId = setTimeout(aclActualizarPreview, ACL_DEBOUNCE_MS);
}

window.addEventListener('message', e => {
  if (!e.data || !e.data.aclConsola) return;
  const consola = document.getElementById('acl-consola');
  if (!consola) return;
  const linea = document.createElement('div');
  linea.className = 'acl-consola-linea acl-consola-' + e.data.tipo;
  linea.textContent = e.data.texto;
  consola.appendChild(linea);
  consola.scrollTop = consola.scrollHeight;
});
