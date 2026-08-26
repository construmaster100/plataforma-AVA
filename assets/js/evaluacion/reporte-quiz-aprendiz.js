/* ══════════════════════════════════════════
   Mis cuestionarios — pages/aprendiz.html (sección "Reporte acumulado")
   Muestra el resultado más reciente de cada cuestionario reportado a la
   API REST de server/ (server/routes/resultados.js) para este aprendiz
   (identificado por la cédula que llega en ?doc= desde el login), con
   un estado APROBADO/SIN APROBAR/SIN PRESENTAR según el porcentaje.

   Los títulos legibles salen del catálogo real (server/routes/
   actividades.js, el mismo que usa Mi progreso — 72 RA), así que
   cualquier M1..M4 de cualquier AA/RA se ve con su nombre real
   ("RA-01 · AA1 · M2") y no con el id crudo. Los dos cuestionarios de
   antes del sistema de 3 niveles (quiz30-ingles, irregular-verbs) ya
   no los reporta nadie, pero se conservan como respaldo por si queda
   historial viejo en la base de datos. */
const API_BASE_APR = '/api';
const PORCENTAJE_APROBACION = 70;

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
  let titulos = {};
  let apiDisponible = true;
  try {
    const [datos, catalogo] = await Promise.all([
      fetch(API_BASE_APR + '/resultados/' + encodeURIComponent(cedula)).then(r => r.json()),
      fetch(API_BASE_APR + '/actividades').then(r => r.json()).catch(() => []),
    ]);
    ultimos = ultimoIntentoPorCuestionario(datos.historial || []);
    catalogo.forEach(a => { titulos[a.cuestionarioId] = a.titulo; });
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
      <td>${titulos[clave] || CUESTIONARIOS_CONOCIDOS[clave] || clave}</td>
      <td>${intento ? intento.puntaje + '/' + intento.totalPreguntas : '—'}</td>
      <td><span class="badge ${clase}">${texto}</span></td>`;
    tbody.appendChild(tr);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-view="sec-reporte-acumulado"]')
    .forEach(a => a.addEventListener('click', cargarReporteQuizAprendiz));
});
