/* ══════════════════════════════════════════
   Progreso por RA (cards) — pages/instructor.html
   El mismo sistema de cards que ve el aprendiz en "Presentar
   Evaluación" (assets/js/evaluacion/ra-cards-render.js), pero aquí
   el instructor (y el administrador, mismo panel con ?admin=1) elige
   ficha y aprendiz para ver el progreso de cualquiera — no el suyo.
══════════════════════════════════════════ */

const API_BASE_RAC_INS = '/api';
const NOMBRE_FICHA_RAC = { adso: 'Análisis y Desarrollo de Software', english: 'English Coding' };

let catalogoRacIns = null;
let seleccionMPorRA_ins = {};

function poblarFichaRacIns() {
  const doc = new URLSearchParams(window.location.search).get('doc');
  const fichas = typeof fichasDeInstructor === 'function' ? fichasDeInstructor(doc) : ['adso'];
  const grupo = document.getElementById('rac-ficha-grupo');
  const selector = document.getElementById('rac-ficha-selector');
  if (!selector.options.length) {
    fichas.forEach(f => {
      const opt = document.createElement('option');
      opt.value = f;
      opt.textContent = NOMBRE_FICHA_RAC[f] || f;
      selector.appendChild(opt);
    });
  }
  grupo.hidden = fichas.length <= 1;
  return fichas;
}

function fichaRacActual() {
  return document.getElementById('rac-ficha-selector').value || 'adso';
}

function poblarAprendizRacIns() {
  const selector = document.getElementById('rac-aprendiz-selector');
  const ficha = fichaRacActual();
  const roster = (typeof rosterRegistrado === 'function' ? rosterRegistrado() : [])
    .filter(a => a.fichaId === '3293836' || ficha === 'adso'); // hoy solo la ficha 3293836 tiene identidades reales

  const anterior = selector.value;
  selector.replaceChildren();
  roster.forEach(a => {
    const opt = document.createElement('option');
    opt.value = a.cedula;
    opt.textContent = a.nombre;
    selector.appendChild(opt);
  });
  if (anterior && roster.some(a => a.cedula === anterior)) selector.value = anterior;
  return roster;
}

async function cargarCatalogoRacInsUnaVez() {
  if (catalogoRacIns) return catalogoRacIns;
  catalogoRacIns = await (await fetch(API_BASE_RAC_INS + '/actividades')).json();
  return catalogoRacIns;
}

async function pintarCardsInstructor() {
  const contenedor = document.getElementById('rac-contenedor');
  const estado = document.getElementById('rac-estado');
  const cedula = document.getElementById('rac-aprendiz-selector').value;
  if (!contenedor) return;

  if (!cedula) {
    contenedor.replaceChildren();
    document.getElementById('rac-selector').replaceChildren();
    estado.textContent = 'No hay aprendices registrados en esta ficha todavía.';
    return;
  }

  estado.textContent = 'Cargando…';
  const ficha = fichaRacActual();
  const totalRA = TOTAL_RA_POR_FICHA_CARDS[ficha] || 72;

  let catalogo, datos, acceso;
  try {
    [catalogo, datos, acceso] = await Promise.all([
      cargarCatalogoRacInsUnaVez(),
      fetch(API_BASE_RAC_INS + '/resultados/' + encodeURIComponent(cedula)).then(r => r.json()),
      fetch(API_BASE_RAC_INS + '/acceso/' + encodeURIComponent(cedula)).then(r => r.json()),
    ]);
  } catch (e) {
    estado.textContent = 'No se pudo conectar con el servidor de reportes.';
    return;
  }

  const params = new URLSearchParams();
  const nombre = document.getElementById('rac-aprendiz-selector').selectedOptions[0]?.textContent || '';
  params.set('doc', cedula);
  params.set('u', nombre);

  const desbloqueados = new Set(acceso.unlocked || []);
  const ultimos = ultimosPorCuestionarioCards((datos && datos.historial) || []);
  const porRA = agruparPorRaYAa(catalogo, [ficha]);
  const raConContenido = [...porRA.keys()]
    .filter(raId => desbloqueados.has(raId) && raId <= totalRA && (porRA.get(raId).get(AA_TARJETA_RA_CARDS) || []).length)
    .sort((a, b) => a - b);

  const aprobadasPorRA = new Map();
  raConContenido.forEach(raId => {
    const materiales = porRA.get(raId).get(AA_TARJETA_RA_CARDS) || [];
    aprobadasPorRA.set(raId, materiales.length > 0 && materiales.every(m => estadoMCard(ultimos, m.cuestionarioId).aprobado));
  });

  pintarSelectorRA(document.getElementById('rac-selector'), totalRA, raConContenido, desbloqueados, aprobadasPorRA, 'rac-card-');

  contenedor.replaceChildren();
  if (!raConContenido.length) {
    estado.textContent = `${nombre} · ${desbloqueados.size} de ${totalRA} RA desbloqueados, ninguno con contenido cargado todavía.`;
    return;
  }

  estado.textContent = `${nombre} · ${raConContenido.length} de ${totalRA} RA disponibles (${desbloqueados.size} desbloqueados en total).`;
  raConContenido.forEach(raId => {
    contenedor.appendChild(pintarCardRA(
      raId, porRA.get(raId), ultimos, params, seleccionMPorRA_ins,
      () => pintarCardsInstructor(), 'rac-card-'
    ));
  });
}

document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('rac-contenedor')) return;

  document.querySelectorAll('[data-view="sec-ra-cards-instructor"]').forEach(a => a.addEventListener('click', () => {
    poblarFichaRacIns();
    poblarAprendizRacIns();
    pintarCardsInstructor();
  }));

  document.getElementById('rac-ficha-selector').addEventListener('change', () => {
    poblarAprendizRacIns();
    pintarCardsInstructor();
  });
  document.getElementById('rac-aprendiz-selector').addEventListener('change', pintarCardsInstructor);
});
