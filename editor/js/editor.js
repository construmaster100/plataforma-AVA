/* ══════════════════════════════════════════
   AVA Code Lab — pestañas, editores CodeMirror, reset y descarga
   (Módulo 5)

   Módulo independiente: no lee ni escribe nada del resto de AVAsena /
   plataforma-AVA, y no depende de ningún script global del sitio. Vive
   solo, listo para incrustarse en un <iframe> desde cualquier panel.
══════════════════════════════════════════ */

const ACL_DEFAULT = {
  html: '<h1>Heading 1</h1>\n<h1>Heading 2</h1>',
  css: 'h1 {\n  font-style: italic;\n  color: red;\n}',
  js: ''
};

const ACL_MODOS = { html: 'htmlmixed', css: 'css', js: 'javascript' };

window.aclEditores = {};

function aclCrearEditor(lenguaje) {
  const textarea = document.getElementById('acl-code-' + lenguaje);
  const editor = CodeMirror.fromTextArea(textarea, {
    mode: ACL_MODOS[lenguaje],
    theme: 'dracula',
    lineNumbers: true,
    lineWrapping: true,
    tabSize: 2,
    indentUnit: 2,
    value: ACL_DEFAULT[lenguaje]
  });
  editor.on('change', aclProgramarActualizacion);
  return editor;
}

function aclCambiarPestana(lenguaje) {
  document.querySelectorAll('.acl-tab').forEach(t => {
    const activa = t.dataset.tab === lenguaje;
    t.classList.toggle('is-active', activa);
    t.setAttribute('aria-selected', activa ? 'true' : 'false');
  });
  document.querySelectorAll('.acl-editor-pane').forEach(p => {
    p.classList.toggle('is-active', p.dataset.pane === lenguaje);
  });
  // CodeMirror calcula su tamaño cuando está visible; un pane que estaba
  // oculto con display:none necesita un refresh al mostrarse, si no el
  // editor se ve en blanco o mal recortado.
  const editor = window.aclEditores[lenguaje];
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
}

document.addEventListener('DOMContentLoaded', () => {
  window.aclEditores.html = aclCrearEditor('html');
  window.aclEditores.css = aclCrearEditor('css');
  window.aclEditores.js = aclCrearEditor('js');
  aclActualizarPreview();

  document.querySelectorAll('.acl-tab').forEach(tab => {
    tab.addEventListener('click', () => aclCambiarPestana(tab.dataset.tab));
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
