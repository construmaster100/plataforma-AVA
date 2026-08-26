/* ══════════════════════════════════════════
   Asignar score por RA — pages/instructor.html
   Tabla editable: filas = las 4 actividades del RA elegido, columnas =
   aprendices de la ficha (reusa rosterRegistrado() de reportes-quiz.js).
   Guardar en cualquier celda llama al mismo POST /api/resultados que ya
   usan los quices — sin tope de puntaje ("créditos ilimitados").
══════════════════════════════════════════ */

const API_BASE_SCORE = '/api';
// ADSO tiene 72 RA; English Coding solo tiene 5 (pages/Fichas Tecnicos y
// tecnologos/English coding/RA1..RA5) — el selector de RA se ajusta según
// la ficha activa (ver poblarSelectorRA()).
const TOTAL_RA_POR_FICHA_SCORE = { adso: 72, english: 5 };

let catalogoCompleto = null;
let raSeleccionadaScore = 1;

function estadoActualTexto(resultado) {
  if (!resultado) return 'Sin presentar';
  return `${resultado.puntaje}/${resultado.totalPreguntas}`;
}

function celdaEditor(actividad, aprendiz, resultado) {
  const max = actividad.maxPuntaje || 30;
  const actual = estadoActualTexto(resultado);
  const controles = `<input type="number" min="0" max="${max}" class="form-control form-control-sm score-input" placeholder="n/${max}">`;
  return `
    <td class="score-celda" data-cedula="${aprendiz.cedula}" data-nombre="${aprendiz.nombre}"
        data-cuestionario="${actividad.cuestionarioId}" data-tipo="${actividad.tipo}" data-max="${max}">
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

/* Las 72 RA (5 en English) como cards clicables — no un <select> — para
   que el instructor vea de un vistazo cuáles ya tienen contenido
   cargado (resaltadas) y cuáles todavía no (la tabla de abajo avisa
   igual si elige una vacía; puede habilitar el acceso de todos modos). */
async function pintarCardsRA(ficha) {
  const contenedor = document.getElementById('score-ra-cards');
  const total = TOTAL_RA_POR_FICHA_SCORE[ficha] || 72;
  if (!raSeleccionadaScore || raSeleccionadaScore > total) raSeleccionadaScore = 1;

  let conContenido = new Set();
  try {
    const catalogo = await cargarCatalogoUnaVez();
    conContenido = new Set(catalogo.filter(a => a.ficha === ficha).map(a => a.raId));
  } catch (e) { /* se resalta igual con lo que haya en memoria */ }

  contenedor.replaceChildren();
  for (let ra = 1; ra <= total; ra++) {
    const boton = document.createElement('button');
    boton.type = 'button';
    const activa = ra === raSeleccionadaScore;
    boton.className = 'btn btn-sm ' + (activa ? 'btn-primary' : conContenido.has(ra) ? 'btn-outline-success' : 'btn-outline-secondary');
    boton.textContent = 'RA-' + String(ra).padStart(2, '0');
    boton.addEventListener('click', () => {
      raSeleccionadaScore = ra;
      pintarCardsRA(ficha);
      renderTablaRA(ra);
    });
    contenedor.appendChild(boton);
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
    .sort((a, b) => a.actividadIndex - b.actividadIndex || a.materialIndex - b.materialIndex);

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
      con contenido enlazado (pages/Fichas Tecnicos y tecnologos/.../RA${raId}/AA.../M1..M4/). Puedes igual
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
  const totalPreguntas = Number(celda.dataset.max) || 30;

  const input = celda.querySelector('.score-input');
  const puntaje = Number(input.value);
  if (!input.value || Number.isNaN(puntaje) || puntaje < 0 || puntaje > totalPreguntas) return;

  await fetch(API_BASE_SCORE + '/resultados', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cedula, nombre, modulo: 'SENAEnglish', cuestionario, puntaje, totalPreguntas }),
  });

  celda.querySelector('.score-actual').textContent = `${puntaje}/${totalPreguntas}`;
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-view="sec-tabla-score-ra"]').forEach(a => a.addEventListener('click', () => {
    poblarSelectorFicha();
    pintarCardsRA(fichaActual());
    renderTablaRA(raSeleccionadaScore);
  }));

  document.getElementById('score-ficha-selector').addEventListener('change', () => {
    pintarCardsRA(fichaActual());
    renderTablaRA(raSeleccionadaScore);
  });

  document.getElementById('score-ra-tbody').addEventListener('click', e => {
    const btn = e.target.closest('.score-guardar');
    if (!btn) return;
    guardarCelda(btn.closest('.score-celda'));
  });

  document.getElementById('score-ra-encabezado').addEventListener('click', async e => {
    const btn = e.target.closest('.acceso-habilitar');
    if (!btn) return;
    btn.disabled = true;
    await habilitarAcceso(btn.dataset.cedula, raSeleccionadaScore);
    btn.textContent = '✅ Habilitado';
  });
});
