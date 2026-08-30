/* ══════════════════════════════════════════
   AVA Code Lab — pestañas, editores CodeMirror, reset y descarga
   (Módulo 5)

   Módulo independiente: no lee ni escribe nada del resto de AVAsena /
   plataforma-AVA, y no depende de ningún script global del sitio. Vive
   solo, listo para incrustarse en un <iframe> desde cualquier panel.

   Dos juegos de editores comparten el mismo contenido inicial
   (ACL_DEFAULT): "codigo" es editable (lo que ve la vista en vivo),
   "ejemplo" es de solo lectura y nunca cambia — sirve de referencia
   fija mientras el aprendiz modifica el suyo.
══════════════════════════════════════════ */

const ACL_DEFAULT = {
  html: '<h1>Heading 1</h1>\n<h1>Heading 2</h1>',
  css: 'h1 {\n  font-style: italic;\n  color: red;\n}',
  js: ''
};

const ACL_MODOS = { html: 'htmlmixed', css: 'css', js: 'javascript' };

window.aclEditores = {};
window.aclEjemplos = {};

function aclCrearEditor(lenguaje, idTextarea, soloLectura) {
  const textarea = document.getElementById(idTextarea);
  return CodeMirror.fromTextArea(textarea, {
    mode: ACL_MODOS[lenguaje],
    theme: 'dracula',
    lineNumbers: true,
    lineWrapping: true,
    tabSize: 2,
    indentUnit: 2,
    readOnly: soloLectura ? 'nocursor' : false,
    value: ACL_DEFAULT[lenguaje]
  });
}

function aclCambiarPestana(panel, lenguaje) {
  document.querySelectorAll('.acl-tab[data-panel="' + panel + '"]').forEach(t => {
    const activa = t.dataset.tab === lenguaje;
    t.classList.toggle('is-active', activa);
    t.setAttribute('aria-selected', activa ? 'true' : 'false');
  });
  document.querySelectorAll('[data-pane^="' + panel + '-"]').forEach(p => {
    p.classList.toggle('is-active', p.dataset.pane === panel + '-' + lenguaje);
  });
  // CodeMirror calcula su tamaño cuando está visible; un pane que estaba
  // oculto con display:none necesita un refresh al mostrarse, si no el
  // editor se ve en blanco o mal recortado.
  const editor = (panel === 'codigo' ? window.aclEditores : window.aclEjemplos)[lenguaje];
  if (editor) setTimeout(() => editor.refresh(), 0);
}

function aclReset() {
  if (!confirm('¿Restaurar el ejemplo inicial? Se pierde lo que hayas escrito.')) return;
  Object.keys(ACL_DEFAULT).forEach(lenguaje => {
    window.aclEditores[lenguaje].setValue(ACL_DEFAULT[lenguaje]);
  });
  aclActualizarPreview();
}

async function aclDescargar() {
  const html = window.aclEditores.html.getValue();
  const css = window.aclEditores.css.getValue();
  const js = window.aclEditores.js.getValue();

  const indexHtml = html +
    '\n<link rel="stylesheet" href="style.css">\n<script src="script.js"><\/script>\n';

  const zip = new JSZip();
  zip.file('index.html', indexHtml);
  zip.file('style.css', css);
  zip.file('script.js', js);

  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = 'ava-code-project.zip';
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);
  URL.revokeObjectURL(url);
}

function aclRefrescarTodos() {
  Object.values(window.aclEditores).forEach(editor => editor && editor.refresh());
  Object.values(window.aclEjemplos).forEach(editor => editor && editor.refresh());
}

document.addEventListener('DOMContentLoaded', () => {
  window.aclEditores.html = aclCrearEditor('html', 'acl-code-html', false);
  window.aclEditores.css = aclCrearEditor('css', 'acl-code-css', false);
  window.aclEditores.js = aclCrearEditor('js', 'acl-code-js', false);

  window.aclEjemplos.html = aclCrearEditor('html', 'acl-ejemplo-html', true);
  window.aclEjemplos.css = aclCrearEditor('css', 'acl-ejemplo-css', true);
  window.aclEjemplos.js = aclCrearEditor('js', 'acl-ejemplo-js', true);

  aclActualizarPreview();

  Object.values(window.aclEditores).forEach(editor => editor.on('change', aclProgramarActualizacion));

  document.querySelectorAll('.acl-tab').forEach(tab => {
    tab.addEventListener('click', () => aclCambiarPestana(tab.dataset.panel, tab.dataset.tab));
  });

  document.getElementById('acl-btn-reset').addEventListener('click', aclReset);
  document.getElementById('acl-btn-download').addEventListener('click', aclDescargar);

  // Si este documento se cargó dentro de un iframe que todavía no tenía
  // su tamaño final asignado (ej: la sección padre pasando de display:none
  // a block justo en este instante), CodeMirror calculó su alto/ancho
  // sobre un contenedor de 0x0. Un par de refrescos, ya con el layout
  // asentado, corrige eso sin depender de que el padre avise nada.
  window.addEventListener('load', aclRefrescarTodos);
  setTimeout(aclRefrescarTodos, 300);
  window.addEventListener('resize', aclRefrescarTodos);
});
