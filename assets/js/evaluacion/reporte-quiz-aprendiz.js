/* ══════════════════════════════════════════
   Mis cuestionarios — pages/aprendiz.html (sección "Reporte acumulado")
   Muestra el resultado más reciente de cada cuestionario reportado a la
   API REST de server/ (server/routes/resultados.js) para este aprendiz
   (identificado por la cédula que llega en ?doc= desde el login), con
   un estado APROBADO/SIN APROBAR/SIN PRESENTAR según el porcentaje.
══════════════════════════════════════════ */

const API_BASE_APR = 'http://localhost:3000/api';
const PORCENTAJE_APROBACION = 70;

/* Cuestionarios que el aprendiz puede presentar hoy: si no aparecen en
   su historial, igual se listan como "Sin presentar". Cualquier otro
   cuestionario que llegue a la API (aunque no esté aquí) también se
   muestra, para no depender de mantener esta lista al día. */
const CUESTIONARIOS_CONOCIDOS = {
  'quiz30-ingles': 'Quiz 30 preguntas (Inglés)',
  'irregular-verbs': 'Quiz Irregular Verbs (Inglés)',
};

function estadoDeResultado(historialItem) {
  if (!historialItem) return { texto: 'SIN PRESENTAR', clase: 'bg-danger' };
  const porcentaje = historialItem.totalPreguntas
    ? (historialItem.puntaje / historialItem.totalPreguntas) * 100
    : 0;
  return porcentaje >= PORCENTAJE_APROBACION
    ? { texto: 'APROBADO', clase: 'bg-success' }
    : { texto: 'SIN APROBAR', clase: 'bg-warning text-dark' };
}

/* Último intento (por fecha) de cada cuestionario del historial. */
function ultimoIntentoPorCuestionario(historial) {
  const ultimos = new Map();
  historial.forEach(h => {
    const previo = ultimos.get(h.cuestionario);
    if (!previo || new Date(h.createdAt) > new Date(previo.createdAt)) ultimos.set(h.cuestionario, h);
  });
  return ultimos;
}

async function cargarReporteQuizAprendiz() {
  const tbody = document.getElementById('reporte-quiz-tbody');
  const estado = document.getElementById('reporte-quiz-estado');
  if (!tbody || !estado) return;

  const params = new URLSearchParams(window.location.search);
  const cedula = params.get('doc');
  const nombre = params.get('u') || 'Aprendiz';
  if (!cedula) {
    estado.textContent = 'No se pudo identificar tu documento para consultar tus cuestionarios.';
    return;
  }

  estado.textContent = 'Cargando…';
  let ultimos = new Map();
  let apiDisponible = true;
  try {
    const datos = await (await fetch(API_BASE_APR + '/resultados/' + encodeURIComponent(cedula))).json();
    ultimos = ultimoIntentoPorCuestionario(datos.historial || []);
  } catch (e) {
    apiDisponible = false;
  }

  const claves = new Set([...Object.keys(CUESTIONARIOS_CONOCIDOS), ...ultimos.keys()]);
  estado.textContent = apiDisponible
    ? ''
    : 'No se pudo conectar con el servidor de reportes (npm run start:adso) — se muestran tus cuestionarios como sin presentar.';

  tbody.innerHTML = '';
  claves.forEach(clave => {
    const intento = ultimos.get(clave);
    const { texto, clase } = estadoDeResultado(intento);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${nombre}</td>
      <td>${CUESTIONARIOS_CONOCIDOS[clave] || clave}</td>
      <td>${intento ? intento.puntaje + '/' + intento.totalPreguntas : '—'}</td>
      <td><span class="badge ${clase}">${texto}</span></td>`;
    tbody.appendChild(tr);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-view="sec-reporte-acumulado"]')
    .forEach(a => a.addEventListener('click', cargarReporteQuizAprendiz));
});
