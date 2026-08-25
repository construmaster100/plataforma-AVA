/* ══════════════════════════════════════════
   Mi progreso (72 RA) — pages/aprendiz.html
   Cruza cuatro cosas: (1) qué fichas puede ver este aprendiz
   (assets/js/estado/ficha.js — ADSO para todos, + English Coding para
   quien el instructor haya marcado ahí), (2) qué RA tiene desbloqueados
   dentro de esas fichas (server/routes/acceso.js — los 5 primeros por
   defecto, el resto lo habilita el instructor), (3) el catálogo real de
   actividades leído del filesystem por ficha (server/routes/actividades.js,
   pages/Fichas Tecnicos y tecnologos/{ficha}/RA{n}/AA{m}/M4/*.html), y
   (4) el historial de resultados del aprendiz (server/routes/resultados.js)
   — para pintar el estado de cada casilla y la barra de progreso general.
══════════════════════════════════════════ */

const API_BASE_RA = 'http://localhost:3000/api';
const PORCENTAJE_APROBACION_RA = 70;
// ADSO tiene 72 RA; English Coding solo tiene 5 (pages/Fichas Tecnicos y
// tecnologos/English coding/RA1..RA5) — el tope se ajusta por ficha.
const TOTAL_RA_POR_FICHA = { adso: 72, english: 5 };
const NOMBRE_FICHA_RA = { adso: 'Análisis y Desarrollo de Software', english: 'English Coding' };

/* Las únicas actividades con secciones propias hoy, dentro de la ficha
   ADSO: RA-01/AA1/M4 (SENAEnglish) y RA-02/AA1/M4 (Irregular Verbs). Lo
   mismo en otra ficha/RA/AA/M abre en pestaña aparte. */
const NAVEGACION_QUIZ = {
  'adso-ra-01-aa-1-m-4': 'sec-quiz-senaenglish',
  'adso-ra-02-aa-1-m-4': 'sec-quiz-irregular-verbs',
};

function estadoActividad(resultado) {
  if (!resultado) return { texto: 'Sin presentar', clase: 'bg-danger' };
  const porcentaje = resultado.totalPreguntas ? (resultado.puntaje / resultado.totalPreguntas) * 100 : 0;
  return porcentaje >= PORCENTAJE_APROBACION_RA
    ? { texto: 'Aprobado', clase: 'bg-success' }
    : { texto: 'No aprobado', clase: 'bg-warning text-dark' };
}

function ultimoIntentoPorCuestionarioRA(historial) {
  const ultimos = new Map();
  historial.forEach(h => {
    const previo = ultimos.get(h.cuestionario);
    if (!previo || new Date(h.createdAt) > new Date(previo.createdAt)) ultimos.set(h.cuestionario, h);
  });
  return ultimos;
}

function miniBadgeM(material, ultimos) {
  const { texto, clase } = estadoActividad(ultimos.get(material.cuestionarioId));
  const etiqueta = `M${material.materialIndex}`;
  const badge = `<span class="badge ${clase}" title="${material.titulo}: ${texto}">${etiqueta}</span>`;
  const destino = NAVEGACION_QUIZ[material.cuestionarioId];
  if (destino) {
    return `<button type="button" class="btn btn-link p-0 me-1" onclick="showSection('${destino}')">${badge}</button>`;
  }
  const params = new URLSearchParams(window.location.search);
  const url = material.embebidoUrl + '?doc=' + encodeURIComponent(params.get('doc') || '')
    + '&u=' + encodeURIComponent(params.get('u') || '')
    + '&ra=' + material.raId + '&aa=' + material.actividadIndex + '&m=' + material.materialIndex + '&ficha=' + material.ficha;
  return `<a href="${url}" target="_blank" rel="noopener" class="me-1">${badge}</a>`;
}

function celdaActividad(materiales, ultimos) {
  return [1, 2, 3, 4].map(m => {
    const material = materiales.find(x => x.materialIndex === m);
    return material
      ? miniBadgeM(material, ultimos)
      : `<span class="badge bg-secondary me-1" title="M${m}: sin contenido aún">M${m}</span>`;
  }).join('');
}

function celdaSinContenido() {
  return `<span class="text-muted small">Sin contenido aún</span>`;
}

async function cargarProgresoRA() {
  const resumen = document.getElementById('progreso-ra-resumen');
  const barra = document.getElementById('progreso-ra-barra');
  const tbody = document.getElementById('progreso-ra-tbody');
  if (!resumen || !barra || !tbody) return;

  const cedula = new URLSearchParams(window.location.search).get('doc');
  if (!cedula) {
    resumen.textContent = 'No se pudo identificar tu documento para consultar tu progreso.';
    return;
  }

  resumen.textContent = 'Cargando…';
  let catalogo, datos, acceso;
  try {
    [catalogo, datos, acceso] = await Promise.all([
      fetch(API_BASE_RA + '/actividades').then(r => r.json()),
      fetch(API_BASE_RA + '/resultados/' + encodeURIComponent(cedula)).then(r => r.json()),
      fetch(API_BASE_RA + '/acceso/' + encodeURIComponent(cedula)).then(r => r.json()),
    ]);
  } catch (e) {
    resumen.textContent = 'No se pudo conectar con el servidor de reportes (npm run start:adso).';
    return;
  }

  const fichas = typeof fichasDeAprendiz === 'function' ? fichasDeAprendiz(cedula) : ['adso'];
  const ultimos = ultimoIntentoPorCuestionarioRA(datos.historial || []);
  const desbloqueados = (acceso.unlocked || []).slice().sort((a, b) => a - b);

  // Agrupado por ficha+RA+AA: cada AA trae la lista de sus M (hasta 4).
  const porFichaYRA = new Map();
  catalogo.forEach(a => {
    if (!fichas.includes(a.ficha)) return;
    const clave = a.ficha + '-' + a.raId;
    if (!porFichaYRA.has(clave)) porFichaYRA.set(clave, new Map());
    const porAA = porFichaYRA.get(clave);
    if (!porAA.has(a.actividadIndex)) porAA.set(a.actividadIndex, []);
    porAA.get(a.actividadIndex).push(a);
  });

  let raAprobadas = 0;
  let totalCasillasRA = 0;
  const resumenPorFicha = [];
  tbody.innerHTML = '';

  fichas.forEach(ficha => {
    const totalRA = TOTAL_RA_POR_FICHA[ficha] || 72;
    const desbloqueadosDeEstaFicha = desbloqueados.filter(ra => ra <= totalRA);
    let aprobadasEnFicha = 0;

    const encabezado = document.createElement('tr');
    encabezado.innerHTML = `<td colspan="5"><strong>${NOMBRE_FICHA_RA[ficha] || ficha}</strong> (${totalRA} RA)</td>`;
    tbody.appendChild(encabezado);

    desbloqueadosDeEstaFicha.forEach(raId => {
      totalCasillasRA += 1;
      const porAA = porFichaYRA.get(ficha + '-' + raId) || new Map();
      const todosLosMateriales = [...porAA.values()].flat();
      if (todosLosMateriales.length) {
        const estados = todosLosMateriales.map(m => estadoActividad(ultimos.get(m.cuestionarioId)));
        if (estados.every(e => e.texto === 'Aprobado')) { raAprobadas += 1; aprobadasEnFicha += 1; }
      }

      const celdas = [1, 2, 3, 4].map(idx => {
        const materiales = porAA.get(idx);
        return `<td>${materiales ? celdaActividad(materiales, ultimos) : celdaSinContenido()}</td>`;
      }).join('');

      const tr = document.createElement('tr');
      tr.innerHTML = `<td>RA-${String(raId).padStart(2, '0')}</td>${celdas}`;
      tbody.appendChild(tr);
    });

    const bloqueadosFicha = totalRA - desbloqueadosDeEstaFicha.length;
    resumenPorFicha.push(`${NOMBRE_FICHA_RA[ficha] || ficha}: ${aprobadasEnFicha}/${totalRA}`
      + (bloqueadosFicha > 0 ? ` (${bloqueadosFicha} sin habilitar)` : ''));
  });

  const porcentaje = totalCasillasRA ? Math.round((raAprobadas / totalCasillasRA) * 100) : 0;
  barra.style.width = porcentaje + '%';
  resumen.textContent = `${raAprobadas} de ${totalCasillasRA} resultados de aprendizaje completos (${porcentaje}%). ${resumenPorFicha.join(' · ')}`;
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-view="sec-progreso-ra"]')
    .forEach(a => a.addEventListener('click', cargarProgresoRA));
});
