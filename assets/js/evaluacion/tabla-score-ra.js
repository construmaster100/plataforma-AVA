/* ══════════════════════════════════════════
   Asignar score por RA — pages/instructor.html
   Tabla editable: filas = las 4 actividades del RA elegido, columnas =
   aprendices de la ficha (reusa rosterRegistrado() de reportes-quiz.js).
   Guardar en cualquier celda llama al mismo POST /api/resultados que ya
   usan los quices — sin tope de puntaje ("créditos ilimitados").
══════════════════════════════════════════ */

const API_BASE_SCORE = 'http://localhost:3000/api';
const TOTAL_RA_SCORE = 72;

let catalogoCompleto = null;

function estadoActualTexto(resultado, tipo) {
  if (!resultado) return 'Sin presentar';
  if (tipo === 'quiz') return `${resultado.puntaje}/${resultado.totalPreguntas}`;
  return resultado.puntaje >= resultado.totalPreguntas ? 'Aprobado' : 'No aprobado';
}

function celdaEditor(actividad, aprendiz, resultado) {
  const actual = estadoActualTexto(resultado, actividad.tipo);
  const controles = actividad.tipo === 'quiz'
    ? `<input type="number" min="0" max="30" class="form-control form-control-sm score-input" placeholder="n/30">`
    : `<select class="form-select form-select-sm score-select">
         <option value="">Elegir…</option>
         <option value="aprobado">Aprobado</option>
         <option value="no-aprobado">No aprobado</option>
       </select>`;
  return `
    <td class="score-celda" data-cedula="${aprendiz.cedula}" data-nombre="${aprendiz.nombre}"
        data-cuestionario="${actividad.cuestionarioId}" data-tipo="${actividad.tipo}">
      <div class="score-actual small text-muted">${actual}</div>
      <div class="input-group input-group-sm">
        ${controles}
        <button type="button" class="btn btn-sm btn-outline-success score-guardar">Guardar</button>
      </div>
    </td>`;
}

async function cargarCatalogoUnaVez() {
  if (catalogoCompleto) return catalogoCompleto;
  catalogoCompleto = await (await fetch(API_BASE_SCORE + '/actividades')).json();
  return catalogoCompleto;
}

function poblarSelectorRA() {
  const selector = document.getElementById('score-ra-selector');
  if (selector.options.length) return;
  for (let ra = 1; ra <= TOTAL_RA_SCORE; ra++) {
    const opt = document.createElement('option');
    opt.value = ra;
    opt.textContent = 'RA-' + String(ra).padStart(2, '0');
    selector.appendChild(opt);
  }
}

const NOMBRE_FICHA = { adso: 'Análisis y Desarrollo de Software', english: 'English Coding' };

// Qué ficha(s) puede tocar este instructor (assets/js/estado/ficha.js) —
// Zulma solo ADSO, Alejandra solo English Coding, quien no esté en la
// lista ve ADSO por defecto.
function poblarSelectorFicha() {
  const doc = new URLSearchParams(window.location.search).get('doc');
  const fichas = typeof fichasDeInstructor === 'function' ? fichasDeInstructor(doc) : ['adso'];
  const grupo = document.getElementById('score-ficha-grupo');
  const selector = document.getElementById('score-ficha-selector');
  if (selector.options.length) return fichas;

  fichas.forEach(f => {
    const opt = document.createElement('option');
    opt.value = f;
    opt.textContent = NOMBRE_FICHA[f] || f;
    selector.appendChild(opt);
  });
  grupo.hidden = fichas.length <= 1;
  return fichas;
}

function fichaActual() {
  const selector = document.getElementById('score-ficha-selector');
  return selector.value || 'adso';
}

async function renderTablaRA(raId) {
  const estado = document.getElementById('score-ra-estado');
  const encabezado = document.getElementById('score-ra-encabezado');
  const tbody = document.getElementById('score-ra-tbody');
  estado.textContent = 'Cargando…';

  let catalogo, roster;
  try {
    catalogo = await cargarCatalogoUnaVez();
    roster = typeof rosterRegistrado === 'function' ? rosterRegistrado() : [];
  } catch (e) {
    estado.textContent = 'No se pudo conectar con el servidor de reportes (npm run start:adso).';
    return;
  }

  const ficha = fichaActual();
  const actividades = catalogo
    .filter(a => a.raId === Number(raId) && a.ficha === ficha)
    .sort((a, b) => a.actividadIndex - b.actividadIndex);

  const historiales = await Promise.all(roster.map(a =>
    fetch(API_BASE_SCORE + '/resultados/' + encodeURIComponent(a.cedula)).then(r => r.json()).catch(() => null)
  ));
  const historialPorCedula = new Map(roster.map((a, i) => [a.cedula, historiales[i]]));

  function ultimoResultado(cedula, cuestionarioId) {
    const datos = historialPorCedula.get(cedula);
    if (!datos || !datos.historial) return null;
    return datos.historial
      .filter(h => h.cuestionario === cuestionarioId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0] || null;
  }

  encabezado.innerHTML = '<th>Actividad</th>' + roster.map(a => `
    <th>
      ${a.nombre}<br>
      <button type="button" class="btn btn-sm btn-outline-primary mt-1 acceso-habilitar" data-cedula="${a.cedula}">🔓 Habilitar este RA</button>
    </th>`).join('');

  if (!actividades.length) {
    tbody.innerHTML = `<tr><td colspan="${roster.length + 1}" class="text-muted">
      RA-${String(raId).padStart(2, '0')} de ${NOMBRE_FICHA[ficha] || ficha} todavía no tiene actividades
      con contenido enlazado (pages/Fichas Tecnicos y tecnologos/.../RA${raId}/AA.../M4/). Puedes igual
      habilitar el acceso arriba mientras se agrega el contenido.</td></tr>`;
  } else {
    tbody.innerHTML = actividades.map(actividad => {
      const celdas = roster.map(aprendiz =>
        celdaEditor(actividad, aprendiz, ultimoResultado(aprendiz.cedula, actividad.cuestionarioId))
      ).join('');
      return `<tr><td><strong>${actividad.titulo}</strong></td>${celdas}</tr>`;
    }).join('');
  }

  estado.textContent = `${NOMBRE_FICHA[ficha] || ficha} · RA-${String(raId).padStart(2, '0')} · ${actividades.length} actividad(es) con contenido · ${roster.length} aprendices.`;
}

async function habilitarAcceso(cedula, raId) {
  await fetch(API_BASE_SCORE + '/acceso', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cedula, raId: Number(raId) }),
  });
}

async function guardarCelda(celda) {
  const cedula = celda.dataset.cedula;
  const nombre = celda.dataset.nombre;
  const cuestionario = celda.dataset.cuestionario;
  const tipo = celda.dataset.tipo;

  let puntaje, totalPreguntas;
  if (tipo === 'quiz') {
    const input = celda.querySelector('.score-input');
    const valor = Number(input.value);
    if (!input.value || Number.isNaN(valor) || valor < 0 || valor > 30) return;
    puntaje = valor;
    totalPreguntas = 30;
  } else {
    const select = celda.querySelector('.score-select');
    if (!select.value) return;
    puntaje = select.value === 'aprobado' ? 1 : 0;
    totalPreguntas = 1;
  }

  await fetch(API_BASE_SCORE + '/resultados', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cedula, nombre, modulo: 'SENAEnglish', cuestionario, puntaje, totalPreguntas }),
  });

  celda.querySelector('.score-actual').textContent = tipo === 'quiz'
    ? `${puntaje}/${totalPreguntas}`
    : (puntaje ? 'Aprobado' : 'No aprobado');
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-view="sec-tabla-score-ra"]').forEach(a => a.addEventListener('click', () => {
    poblarSelectorFicha();
    poblarSelectorRA();
    const selector = document.getElementById('score-ra-selector');
    renderTablaRA(selector.value || 1);
  }));

  document.getElementById('score-ra-selector').addEventListener('change', e => renderTablaRA(e.target.value));
  document.getElementById('score-ficha-selector').addEventListener('change', () => {
    renderTablaRA(document.getElementById('score-ra-selector').value || 1);
  });

  document.getElementById('score-ra-tbody').addEventListener('click', e => {
    const btn = e.target.closest('.score-guardar');
    if (!btn) return;
    guardarCelda(btn.closest('.score-celda'));
  });

  document.getElementById('score-ra-encabezado').addEventListener('click', async e => {
    const btn = e.target.closest('.acceso-habilitar');
    if (!btn) return;
    const raId = document.getElementById('score-ra-selector').value;
    btn.disabled = true;
    await habilitarAcceso(btn.dataset.cedula, raId);
    btn.textContent = '✅ Habilitado';
  });
});
