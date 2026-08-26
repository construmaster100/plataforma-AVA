/* ══════════════════════════════════════════
   Presentar Evaluación — cards por RA — pages/aprendiz.html
   Un card por cada RA con contenido real y desbloqueado. Cada card trae
   sus pestañas de AA (AA1, AA2…) y, dentro de la AA elegida, sus M1-M4
   sobre un solo iframe para contestar — mismo catálogo y misma cuenta
   de aprobado/pendiente que assets/js/evaluacion/progreso-ra.js y
   footer-progreso.js (proporcional al contenido ya cargado, no fijo a
   72). El RA queda "Aprobado" cuando todas sus AA (con contenido)
   quedan aprobadas.
══════════════════════════════════════════ */

const API_BASE_RA_CARDS = '/api';
const PORCENTAJE_APROBACION_RA_CARDS = 70;

let catalogoRaCards = null;
let datosRaCards = null;
let seleccionRaCards = {}; // { [raId]: { aa: n, m: n } }
let raActivaCards = null;

function ultimosPorCuestionarioCards(historial) {
  const ultimos = new Map();
  (historial || []).forEach(h => {
    const previo = ultimos.get(h.cuestionario);
    if (!previo || new Date(h.createdAt) > new Date(previo.createdAt)) ultimos.set(h.cuestionario, h);
  });
  return ultimos;
}

function estadoMCard(ultimos, cuestionarioId) {
  const r = ultimos.get(cuestionarioId);
  if (!r || !r.totalPreguntas) return { texto: 'Sin presentar', clase: 'btn-outline-secondary', aprobado: false };
  const porcentaje = (r.puntaje / r.totalPreguntas) * 100;
  return porcentaje >= PORCENTAJE_APROBACION_RA_CARDS
    ? { texto: 'Aprobado', clase: 'btn-outline-success', aprobado: true }
    : { texto: 'No aprobado', clase: 'btn-outline-warning', aprobado: false };
}

function agruparPorRaYAa(catalogo, fichas) {
  const porRA = new Map();
  catalogo.filter(a => fichas.includes(a.ficha)).forEach(a => {
    if (!porRA.has(a.raId)) porRA.set(a.raId, new Map());
    const porAA = porRA.get(a.raId);
    if (!porAA.has(a.actividadIndex)) porAA.set(a.actividadIndex, []);
    porAA.get(a.actividadIndex).push(a);
  });
  return porRA;
}

function cargarFrameRaCards(frame, material, params) {
  frame.src = material.embebidoUrl + '?doc=' + encodeURIComponent(params.get('doc') || '')
    + '&u=' + encodeURIComponent(params.get('u') || '')
    + '&ra=' + material.raId + '&aa=' + material.actividadIndex + '&m=' + material.materialIndex
    + '&ficha=' + material.ficha;
}

function pintarCardRA(raId, porAA, ultimos, params) {
  const aaIds = [...porAA.keys()].sort((a, b) => a - b);
  const sel = seleccionRaCards[raId] || (seleccionRaCards[raId] = { aa: aaIds[0], m: null });
  if (!aaIds.includes(sel.aa)) sel.aa = aaIds[0];

  let aaAprobadas = 0;
  aaIds.forEach(aaId => {
    const materiales = porAA.get(aaId);
    const estados = materiales.map(m => estadoMCard(ultimos, m.cuestionarioId));
    if (estados.every(e => e.aprobado)) aaAprobadas += 1;
  });
  const raAprobado = aaAprobadas === aaIds.length;

  const card = document.createElement('div');
  card.className = 'card content-card ra-card';
  card.style.marginBottom = '18px';
  card.style.padding = '16px';

  const encabezado = document.createElement('div');
  encabezado.className = 'd-flex flex-wrap align-items-center gap-2';
  encabezado.style.marginBottom = '10px';
  encabezado.innerHTML = `
    <h3 style="margin:0;">RA-${String(raId).padStart(2, '0')}</h3>
    <span class="badge ${raAprobado ? 'bg-success' : 'bg-warning text-dark'}">${raAprobado ? 'APROBADO' : 'EN PROGRESO'}</span>
    <span class="small text-muted">${aaAprobadas} de ${aaIds.length} AA aprobadas</span>`;
  card.appendChild(encabezado);

  const tabsAA = document.createElement('div');
  tabsAA.className = 'btn-group flex-wrap mb-2';
  tabsAA.setAttribute('role', 'group');
  aaIds.forEach(aaId => {
    const materiales = porAA.get(aaId);
    const estados = materiales.map(m => estadoMCard(ultimos, m.cuestionarioId));
    const todasAprobadas = estados.every(e => e.aprobado);
    const boton = document.createElement('button');
    boton.type = 'button';
    boton.className = 'btn btn-sm ' + (aaId === sel.aa ? 'btn-primary' : (todasAprobadas ? 'btn-outline-success' : 'btn-outline-secondary'));
    boton.textContent = 'AA' + aaId + (todasAprobadas ? ' ✓' : '');
    boton.addEventListener('click', () => {
      sel.aa = aaId;
      sel.m = null;
      pintarContenedorRaCards();
    });
    tabsAA.appendChild(boton);
  });
  card.appendChild(tabsAA);

  const materialesAA = porAA.get(sel.aa) || [];
  const estadoTexto = document.createElement('p');
  estadoTexto.className = 'aa-tabs-estado small text-muted';
  const aprobadosAA = materialesAA.filter(m => estadoMCard(ultimos, m.cuestionarioId).aprobado).length;
  estadoTexto.textContent = `RA-${String(raId).padStart(2, '0')} · AA${sel.aa} · ${aprobadosAA} de ${materialesAA.length} módulos aprobados.`;
  card.appendChild(estadoTexto);

  const tabsM = document.createElement('div');
  tabsM.className = 'btn-group flex-wrap mb-3';
  tabsM.setAttribute('role', 'group');

  const frame = document.createElement('iframe');
  frame.className = 'ra-card-frame';
  frame.title = 'RA-' + raId + ' AA' + sel.aa;
  frame.style.cssText = 'width:100%;height:70vh;border:0;border-radius:12px;';

  let primero = null;
  [1, 2, 3, 4].forEach(m => {
    const material = materialesAA.find(x => x.materialIndex === m);
    const boton = document.createElement('button');
    boton.type = 'button';
    boton.className = 'btn btn-sm aa-tab-btn';

    if (!material) {
      boton.classList.add('btn-outline-secondary');
      boton.textContent = `M${m} — sin contenido aún`;
      boton.disabled = true;
      tabsM.appendChild(boton);
      return;
    }

    const { texto, clase } = estadoMCard(ultimos, material.cuestionarioId);
    boton.classList.add((sel.m === m ? clase.replace('btn-outline-', 'btn-') : clase) || 'btn-outline-secondary');
    boton.textContent = `M${m} · ${texto}`;
    boton.addEventListener('click', () => {
      sel.m = m;
      tabsM.querySelectorAll('.aa-tab-btn').forEach(b => b.classList.remove('active'));
      boton.classList.add('active');
      cargarFrameRaCards(frame, material, params);
    });
    tabsM.appendChild(boton);
    if (!primero) primero = { boton, material };
    if (sel.m === m) primero = { boton, material };
  });
  card.appendChild(tabsM);

  if (primero) {
    if (!sel.m) sel.m = primero.material.materialIndex;
    primero.boton.classList.add('active');
    cargarFrameRaCards(frame, primero.material, params);
    card.appendChild(frame);
  } else {
    const vacio = document.createElement('p');
    vacio.className = 'text-muted small';
    vacio.textContent = 'Esta AA todavía no tiene contenido cargado.';
    card.appendChild(vacio);
  }

  const refrescar = document.createElement('button');
  refrescar.type = 'button';
  refrescar.className = 'btn btn-sm btn-outline-secondary mt-2';
  refrescar.textContent = '🔄 Actualizar estado';
  refrescar.addEventListener('click', () => cargarDatosRaCards(true));
  card.appendChild(refrescar);

  return card;
}

/* Sistema de navegación entre RA: un selector de pastillas arriba, una
   sola card visible a la vez (con 5 RA desbloqueadas por defecto, apilar
   las 5 cards completas —cada una con sus AA y su iframe— haría la
   vista larguísima). Marca con ✓ el RA ya aprobado. */
function pintarSelectorRA(raConContenido, aprobadasPorRA) {
  const selector = document.getElementById('ra-cards-selector');
  selector.replaceChildren();
  raConContenido.forEach(raId => {
    const boton = document.createElement('button');
    boton.type = 'button';
    boton.className = 'btn btn-sm ' + (raId === raActivaCards
      ? 'btn-primary'
      : (aprobadasPorRA.get(raId) ? 'btn-outline-success' : 'btn-outline-secondary'));
    boton.textContent = 'RA-' + String(raId).padStart(2, '0') + (aprobadasPorRA.get(raId) ? ' ✓' : '');
    boton.addEventListener('click', () => {
      raActivaCards = raId;
      pintarContenedorRaCards();
    });
    selector.appendChild(boton);
  });
}

function pintarContenedorRaCards() {
  const contenedor = document.getElementById('ra-cards-contenedor');
  const estado = document.getElementById('ra-cards-estado');
  if (!contenedor || !catalogoRaCards || !datosRaCards) return;

  const params = new URLSearchParams(window.location.search);
  const cedula = params.get('doc');
  const fichas = typeof fichasDeAprendiz === 'function' ? fichasDeAprendiz(cedula) : ['adso'];
  const desbloqueados = new Set((datosRaCards.acceso.unlocked || []));
  const ultimos = ultimosPorCuestionarioCards(datosRaCards.resultados.historial);

  const porRA = agruparPorRaYAa(catalogoRaCards, fichas);
  const raConContenido = [...porRA.keys()].filter(raId => desbloqueados.has(raId)).sort((a, b) => a - b);

  contenedor.replaceChildren();
  if (!raConContenido.length) {
    estado.textContent = 'Todavía no hay ningún RA con contenido cargado y desbloqueado para tu ficha.';
    document.getElementById('ra-cards-selector').replaceChildren();
    return;
  }

  if (!raActivaCards || !raConContenido.includes(raActivaCards)) raActivaCards = raConContenido[0];

  const aprobadasPorRA = new Map();
  raConContenido.forEach(raId => {
    const porAA = porRA.get(raId);
    const todasAA = [...porAA.values()].every(materiales =>
      materiales.every(m => estadoMCard(ultimos, m.cuestionarioId).aprobado));
    aprobadasPorRA.set(raId, todasAA);
  });

  estado.textContent = raConContenido.length + ' resultado(s) de aprendizaje disponible(s) para presentar.';
  pintarSelectorRA(raConContenido, aprobadasPorRA);
  contenedor.appendChild(pintarCardRA(raActivaCards, porRA.get(raActivaCards), ultimos, params));
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
