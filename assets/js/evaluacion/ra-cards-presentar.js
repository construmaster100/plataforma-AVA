/* ══════════════════════════════════════════
   Presentar Evaluación — cards por RA — pages/aprendiz.html
   Cableado propio del aprendiz sobre el motor compartido de
   assets/js/evaluacion/ra-cards-render.js: su propia cédula (?doc= en
   la URL), su propio progreso. Un card por cada RA desbloqueado con
   contenido, apilados (no uno a la vez).
══════════════════════════════════════════ */

const API_BASE_RA_CARDS = '/api';

let catalogoRaCards = null;
let datosRaCards = null;
let seleccionMPorRA = {}; // { [raId]: mIndex }

function pintarContenedorRaCards() {
  const contenedor = document.getElementById('ra-cards-contenedor');
  const estado = document.getElementById('ra-cards-estado');
  if (!contenedor || !catalogoRaCards || !datosRaCards) return;

  const params = new URLSearchParams(window.location.search);
  const cedula = params.get('doc');
  const fichas = typeof fichasDeAprendiz === 'function' ? fichasDeAprendiz(cedula) : ['adso'];
  const desbloqueados = new Set((datosRaCards.acceso.unlocked || []));
  const ultimos = ultimosPorCuestionarioCards(datosRaCards.resultados.historial);

  // Los RA se crean progresivamente (RA1, RA2, RA3...) — no hay un total
  // fijo por ficha. Al aprendiz solo le llegan los primeros 5 con
  // contenido para presentar y que se le califique; el instructor sigue
  // viendo todos los que existan.
  const porRA = agruparPorRaYAa(catalogoRaCards, fichas);
  const raIdsConContenido = [...porRA.keys()]
    .filter(raId => (porRA.get(raId).get(AA_TARJETA_RA_CARDS) || []).length)
    .sort((a, b) => a - b);
  const totalRA = raIdsConContenido.length ? Math.max(...raIdsConContenido) : 0;
  const raConContenido = raIdsConContenido.filter(raId => desbloqueados.has(raId)).slice(0, 5);

  contenedor.replaceChildren();

  const aprobadasPorRA = new Map();
  raConContenido.forEach(raId => {
    const materiales = porRA.get(raId).get(AA_TARJETA_RA_CARDS) || [];
    const todas = materiales.length > 0 && materiales.every(m => estadoMCard(ultimos, m.cuestionarioId).aprobado);
    aprobadasPorRA.set(raId, todas);
  });

  pintarSelectorRA(document.getElementById('ra-cards-selector'), totalRA, raConContenido, desbloqueados, aprobadasPorRA);

  if (!raConContenido.length) {
    estado.textContent = `${desbloqueados.size} de ${totalRA} RA desbloqueados, pero ninguno tiene contenido cargado todavía.`;
    return;
  }

  estado.textContent = `${raConContenido.length} de ${totalRA} RA disponibles para presentar (${desbloqueados.size} desbloqueados en total).`;
  raConContenido.forEach(raId => {
    contenedor.appendChild(pintarCardRA(raId, porRA.get(raId), ultimos, params, seleccionMPorRA, () => cargarDatosRaCards(true)));
  });
}

async function cargarDatosRaCards(soloRefrescoSilencioso) {
  const estado = document.getElementById('ra-cards-estado');
  const cedula = new URLSearchParams(window.location.search).get('doc');
  if (!cedula) {
    if (estado) estado.textContent = 'No se pudo identificar tu documento.';
    return;
  }
  if (!soloRefrescoSilencioso && estado) estado.textContent = 'Cargando…';

  try {
    const [catalogo, resultados, acceso] = await Promise.all([
      fetch(API_BASE_RA_CARDS + '/actividades').then(r => r.json()),
      fetch(API_BASE_RA_CARDS + '/resultados/' + encodeURIComponent(cedula)).then(r => r.json()),
      fetch(API_BASE_RA_CARDS + '/acceso/' + encodeURIComponent(cedula)).then(r => r.json()),
    ]);
    catalogoRaCards = catalogo;
    datosRaCards = { resultados, acceso };
    pintarContenedorRaCards();
  } catch (e) {
    if (estado) estado.textContent = 'No se pudo conectar con el servidor de reportes.';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('ra-cards-contenedor')) return;
  document.querySelectorAll('[data-view="sec-presentar"]')
    .forEach(a => a.addEventListener('click', () => cargarDatosRaCards(false)));
});
