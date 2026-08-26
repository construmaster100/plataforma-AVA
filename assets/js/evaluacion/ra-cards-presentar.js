/* ══════════════════════════════════════════
   Presentar Evaluación — cards por RA — pages/aprendiz.html
   Un card por cada RA con contenido real y desbloqueado. Dentro, cada
   AA es su propia card (no una pestaña) — AA1, AA2, AA3, AA4… cada una
   con sus botones M1-M4 y su propio iframe para contestar. Mismo
   catálogo y misma cuenta de aprobado/pendiente que
   assets/js/evaluacion/progreso-ra.js y footer-progreso.js
   (proporcional al contenido ya cargado, no fijo a 72). El RA queda
   "Aprobado" cuando todas sus AA (con contenido) quedan aprobadas.
══════════════════════════════════════════ */

const API_BASE_RA_CARDS = '/api';
const PORCENTAJE_APROBACION_RA_CARDS = 70;

let catalogoRaCards = null;
let datosRaCards = null;
let seleccionMPorAA = {}; // { "raId-aaId": mIndex }
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

/* Una card por AA (no una pestaña): trae sus botones M1-M4 y su propio
   iframe, que solo carga cuando el aprendiz elige un módulo — así no
   se cargan 4-5 iframes a la vez por cada RA visible. */
function pintarAACard(raId, aaId, materiales, ultimos, params) {
  const clave = raId + '-' + aaId;
  const mSel = seleccionMPorAA[clave];

  const estados = materiales.map(m => estadoMCard(ultimos, m.cuestionarioId));
  const aprobados = estados.filter(e => e.aprobado).length;
  const aprobada = materiales.length > 0 && aprobados === materiales.length;

  const aaCard = document.createElement('div');
  aaCard.className = 'card content-card aa-card';
  aaCard.style.cssText = 'padding:14px;width:100%;'; /* .content-card trae width:200px fijo, aquí necesita llenar su celda del grid */

  const encabezado = document.createElement('div');
  encabezado.className = 'd-flex align-items-center gap-2 mb-2';
  encabezado.innerHTML = `
    <h4 style="margin:0;">AA${aaId}</h4>
    <span class="badge ${aprobada ? 'bg-success' : 'bg-warning text-dark'}">${aprobada ? 'Aprobada' : 'En progreso'}</span>
    <span class="small text-muted">${aprobados}/4</span>`;
  aaCard.appendChild(encabezado);

  const tabsM = document.createElement('div');
  tabsM.className = 'btn-group flex-wrap mb-2';
  tabsM.setAttribute('role', 'group');

  const frame = document.createElement('iframe');
  frame.className = 'ra-card-frame';
  frame.title = 'RA-' + raId + ' AA' + aaId;
  frame.style.cssText = 'width:100%;height:60vh;border:0;border-radius:10px;display:none;';

  const placeholder = document.createElement('p');
  placeholder.className = 'text-muted small mb-0';
  placeholder.textContent = 'Elige un módulo (M1-M4) para contestar.';

  let hayContenido = false;
  [1, 2, 3, 4].forEach(m => {
    const material = materiales.find(x => x.materialIndex === m);
    const boton = document.createElement('button');
    boton.type = 'button';
    boton.className = 'btn btn-sm aa-tab-btn';

    if (!material) {
      boton.classList.add('btn-outline-secondary');
      boton.textContent = `M${m} — sin contenido`;
      boton.disabled = true;
      tabsM.appendChild(boton);
      return;
    }

    hayContenido = true;
    const { texto, clase } = estadoMCard(ultimos, material.cuestionarioId);
    boton.classList.add((mSel === m ? clase.replace('btn-outline-', 'btn-') : clase) || 'btn-outline-secondary');
    if (mSel === m) boton.classList.add('active');
    boton.textContent = `M${m} · ${texto}`;
    boton.addEventListener('click', () => {
      seleccionMPorAA[clave] = m;
      tabsM.querySelectorAll('.aa-tab-btn').forEach(b => b.classList.remove('active'));
      boton.classList.add('active');
      placeholder.hidden = true;
      frame.style.display = 'block';
      cargarFrameRaCards(frame, material, params);
    });
    tabsM.appendChild(boton);
  });
  aaCard.appendChild(tabsM);

  if (!hayContenido) {
    placeholder.textContent = 'Esta AA todavía no tiene contenido cargado.';
  } else if (mSel) {
    const material = materiales.find(x => x.materialIndex === mSel);
    if (material) {
      placeholder.hidden = true;
      frame.style.display = 'block';
      cargarFrameRaCards(frame, material, params);
    }
  }

  aaCard.appendChild(placeholder);
  aaCard.appendChild(frame);
  return aaCard;
}

function pintarCardRA(raId, porAA, ultimos, params) {
  const aaIds = [...porAA.keys()].sort((a, b) => a - b);

  let aaAprobadas = 0;
  aaIds.forEach(aaId => {
    const materiales = porAA.get(aaId);
    const estados = materiales.map(m => estadoMCard(ultimos, m.cuestionarioId));
    if (estados.every(e => e.aprobado)) aaAprobadas += 1;
  });
  const raAprobado = aaAprobadas === aaIds.length;

  const card = document.createElement('div');
  card.className = 'card content-card ra-card';
  card.style.cssText = 'margin-bottom:18px;padding:16px;width:100%;'; /* .content-card trae width:200px fijo */

  const encabezado = document.createElement('div');
  encabezado.className = 'd-flex flex-wrap align-items-center gap-2';
  encabezado.style.marginBottom = '12px';
  encabezado.innerHTML = `
    <h3 style="margin:0;">RA-${String(raId).padStart(2, '0')}</h3>
    <span class="badge ${raAprobado ? 'bg-success' : 'bg-warning text-dark'}">${raAprobado ? 'APROBADO' : 'EN PROGRESO'}</span>
    <span class="small text-muted">${aaAprobadas} de ${aaIds.length} AA aprobadas</span>`;
  card.appendChild(encabezado);

  const grid = document.createElement('div');
  grid.className = 'ra-aa-grid';
  grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:14px;';
  aaIds.forEach(aaId => {
    grid.appendChild(pintarAACard(raId, aaId, porAA.get(aaId), ultimos, params));
  });
  card.appendChild(grid);

  const refrescar = document.createElement('button');
  refrescar.type = 'button';
  refrescar.className = 'btn btn-sm btn-outline-secondary mt-3';
  refrescar.textContent = '🔄 Actualizar estado';
  refrescar.addEventListener('click', () => cargarDatosRaCards(true));
  card.appendChild(refrescar);

  return card;
}

const TOTAL_RA_POR_FICHA_CARDS = { adso: 72, english: 5 };

/* Sistema de navegación entre RA: se listan las 72 pastillas (5 para
   English), no solo las que ya tienen contenido. Las que el aprendiz
   no tiene desbloqueadas quedan visibles pero deshabilitadas (🔒) —
   así se ve el alcance completo del programa, no solo lo habilitado
   hoy. Una sola card completa visible a la vez. */
function pintarSelectorRA(totalRA, raConContenido, desbloqueados, aprobadasPorRA) {
  const selector = document.getElementById('ra-cards-selector');
  selector.replaceChildren();
  const conContenido = new Set(raConContenido);

  for (let raId = 1; raId <= totalRA; raId++) {
    const disponible = conContenido.has(raId);
    const boton = document.createElement('button');
    boton.type = 'button';
    boton.className = 'btn btn-sm ' + (!disponible
      ? 'btn-outline-secondary'
      : raId === raActivaCards ? 'btn-primary' : (aprobadasPorRA.get(raId) ? 'btn-outline-success' : 'btn-outline-warning'));

    if (!disponible) {
      boton.disabled = true;
      boton.title = desbloqueados.has(raId) ? 'Desbloqueado, sin contenido cargado todavía' : 'Bloqueado — tu instructor aún no lo habilita';
      boton.textContent = 'RA-' + String(raId).padStart(2, '0') + ' 🔒';
    } else {
      boton.textContent = 'RA-' + String(raId).padStart(2, '0') + (aprobadasPorRA.get(raId) ? ' ✓' : '');
      boton.addEventListener('click', () => {
        raActivaCards = raId;
        pintarContenedorRaCards();
      });
    }
    selector.appendChild(boton);
  }
}

function pintarContenedorRaCards() {
  const contenedor = document.getElementById('ra-cards-contenedor');
  const estado = document.getElementById('ra-cards-estado');
  if (!contenedor || !catalogoRaCards || !datosRaCards) return;

  const params = new URLSearchParams(window.location.search);
  const cedula = params.get('doc');
  const fichas = typeof fichasDeAprendiz === 'function' ? fichasDeAprendiz(cedula) : ['adso'];
  const ficha = typeof getCursoActivo === 'function' ? getCursoActivo() : 'adso';
  const totalRA = TOTAL_RA_POR_FICHA_CARDS[ficha] || 72;
  const desbloqueados = new Set((datosRaCards.acceso.unlocked || []));
  const ultimos = ultimosPorCuestionarioCards(datosRaCards.resultados.historial);

  const porRA = agruparPorRaYAa(catalogoRaCards, fichas);
  const raConContenido = [...porRA.keys()].filter(raId => desbloqueados.has(raId) && raId <= totalRA).sort((a, b) => a - b);

  contenedor.replaceChildren();

  const aprobadasPorRA = new Map();
  raConContenido.forEach(raId => {
    const porAA = porRA.get(raId);
    const todasAA = [...porAA.values()].every(materiales =>
      materiales.every(m => estadoMCard(ultimos, m.cuestionarioId).aprobado));
    aprobadasPorRA.set(raId, todasAA);
  });

  pintarSelectorRA(totalRA, raConContenido, desbloqueados, aprobadasPorRA);

  if (!raConContenido.length) {
    estado.textContent = `${desbloqueados.size} de ${totalRA} RA desbloqueados, pero ninguno tiene contenido cargado todavía.`;
    return;
  }

  if (!raActivaCards || !raConContenido.includes(raActivaCards)) raActivaCards = raConContenido[0];

  estado.textContent = `${raConContenido.length} de ${totalRA} RA disponibles para presentar (${desbloqueados.size} desbloqueados en total).`;
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
