/* ══════════════════════════════════════════
   Presentar Evaluación — cards por RA — pages/aprendiz.html
   Un card por cada RA desbloqueado con contenido, apilados (no uno a la
   vez). Cada card trae sus 4 módulos como tarjetas — Cuestionario, Unir
   palabras, Verdadero o Falso, Evaluación final — con su iframe para
   contestar, y una barra de progreso verde con el avance del RA.
   El módulo que se muestra en cada RA es el de su AA1 (server/routes/
   actividades.js sigue guardando 5 AA por RA en el filesystem para
   organizar el contenido, pero la card solo expone AA1 — un RA, 4
   módulos, según el diseño pedido). Mismo catálogo y misma cuenta de
   aprobado/pendiente que progreso-ra.js y footer-progreso.js.
══════════════════════════════════════════ */

const API_BASE_RA_CARDS = '/api';
const PORCENTAJE_APROBACION_RA_CARDS = 70;
const AA_TARJETA_RA_CARDS = 1; // cada RA card muestra los M1-M4 de esta AA
const TOTAL_RA_POR_FICHA_CARDS = { adso: 72, english: 5 };

const ETIQUETA_M = {
  1: { nombre: 'Módulo 1', tipo: 'Cuestionario', unidad: 'preguntas' },
  2: { nombre: 'Módulo 2', tipo: 'Unir palabras', unidad: 'palabras' },
  3: { nombre: 'Módulo 3', tipo: 'Verdadero o Falso', unidad: 'afirmaciones' },
  4: { nombre: 'Módulo 4', tipo: 'Evaluación final', unidad: 'preguntas' },
};

let catalogoRaCards = null;
let datosRaCards = null;
let seleccionMPorRA = {}; // { [raId]: mIndex }

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
  if (!r || !r.totalPreguntas) return { texto: 'Sin presentar', aprobado: false };
  const porcentaje = (r.puntaje / r.totalPreguntas) * 100;
  return porcentaje >= PORCENTAJE_APROBACION_RA_CARDS
    ? { texto: 'Aprobado', aprobado: true }
    : { texto: 'No aprobado', aprobado: false };
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

function pintarTileM(raId, m, material, ultimos, activo, onClick) {
  const etiqueta = ETIQUETA_M[m];
  const tile = document.createElement('button');
  tile.type = 'button';
  tile.className = 'card ra-m-tile' + (activo ? ' ra-m-tile-activo' : '');
  tile.style.cssText = 'flex:1;min-width:130px;padding:14px 10px;text-align:center;'
    + 'border-radius:14px;border:1px solid ' + (activo ? '#39A900' : '#ddd') + ';'
    + 'background:' + (activo ? '#eef8e8' : '#fff') + ';cursor:' + (material ? 'pointer' : 'not-allowed') + ';';

  if (!material) {
    tile.disabled = true;
    tile.style.opacity = '0.55';
    tile.innerHTML = `<div style="font-weight:700;">${etiqueta.nombre}</div>
      <div class="small text-muted">${etiqueta.tipo}</div>
      <div class="small text-muted">Sin contenido aún</div>`;
    return tile;
  }

  const { texto, aprobado } = estadoMCard(ultimos, material.cuestionarioId);
  const colorEstado = aprobado ? '#278238' : (texto === 'Sin presentar' ? '#777' : '#c9640a');
  tile.innerHTML = `
    <div style="font-weight:700;">${etiqueta.nombre}</div>
    <div class="small text-muted">${etiqueta.tipo.toUpperCase()}</div>
    <div class="small text-muted">${material.maxPuntaje} ${etiqueta.unidad}</div>
    <div class="small text-muted">${material.maxPuntaje} puntos</div>
    <div class="small" style="color:${colorEstado};font-weight:600;margin-top:4px;">${texto}</div>`;
  tile.addEventListener('click', () => onClick(material));
  return tile;
}

/* Un card por RA: título, barra de progreso verde, y los 4 módulos de
   su AA1 como tiles — el que se elige carga su iframe debajo. */
function pintarCardRA(raId, porAA, ultimos, params) {
  const materiales = porAA.get(AA_TARJETA_RA_CARDS) || [];
  const estados = [1, 2, 3, 4].map(m => {
    const material = materiales.find(x => x.materialIndex === m);
    return material ? estadoMCard(ultimos, material.cuestionarioId) : null;
  });
  const conContenido = estados.filter(Boolean);
  const aprobados = conContenido.filter(e => e.aprobado).length;
  const porcentaje = conContenido.length ? Math.round((aprobados / conContenido.length) * 100) : 0;
  const raAprobado = conContenido.length > 0 && aprobados === conContenido.length;

  const card = document.createElement('div');
  card.className = 'card content-card ra-card';
  card.id = 'ra-card-' + raId;
  card.style.cssText = 'margin-bottom:18px;padding:18px;width:100%;background:#f4f4f4;';

  const encabezado = document.createElement('div');
  encabezado.className = 'd-flex flex-wrap align-items-center gap-2';
  encabezado.style.marginBottom = '14px';
  encabezado.innerHTML = `
    <h3 style="margin:0;">RA${raId}-Resultado de Aprendizaje ${raId}</h3>
    <span class="badge ${raAprobado ? 'bg-success' : 'bg-warning text-dark'}">${raAprobado ? 'APROBADO' : 'EN PROGRESO'}</span>`;
  card.appendChild(encabezado);

  const fila = document.createElement('div');
  fila.className = 'd-flex flex-wrap gap-2';

  const frame = document.createElement('iframe');
  frame.className = 'ra-card-frame';
  frame.title = 'RA-' + raId;
  frame.style.cssText = 'width:100%;height:60vh;border:0;border-radius:12px;margin-top:14px;display:none;';

  const mSel = seleccionMPorRA[raId];
  [1, 2, 3, 4].forEach(m => {
    const material = materiales.find(x => x.materialIndex === m);
    const tile = pintarTileM(raId, m, material, ultimos, mSel === m, elegido => {
      seleccionMPorRA[raId] = m;
      frame.style.display = 'block';
      cargarFrameRaCards(frame, elegido, params);
    });
    fila.appendChild(tile);
  });
  card.appendChild(fila);
  card.appendChild(frame);

  if (mSel) {
    const material = materiales.find(x => x.materialIndex === mSel);
    if (material) {
      frame.style.display = 'block';
      cargarFrameRaCards(frame, material, params);
    }
  }

  const barraWrap = document.createElement('div');
  barraWrap.style.cssText = 'margin-top:14px;height:14px;border-radius:8px;background:#e2e2e2;overflow:hidden;';
  const barraFill = document.createElement('div');
  barraFill.style.cssText = `height:100%;width:${porcentaje}%;background:#39A900;transition:width .3s ease;`;
  barraWrap.appendChild(barraFill);
  card.appendChild(barraWrap);

  const piePanel = document.createElement('div');
  piePanel.className = 'd-flex flex-wrap align-items-center gap-2 mt-2';
  const pie = document.createElement('p');
  pie.className = 'small text-muted mb-0';
  pie.textContent = `${aprobados} de ${conContenido.length || 4} módulos aprobados · ${porcentaje}%`;
  const refrescar = document.createElement('button');
  refrescar.type = 'button';
  refrescar.className = 'btn btn-sm btn-outline-secondary';
  refrescar.textContent = '🔄 Actualizar estado';
  refrescar.addEventListener('click', () => cargarDatosRaCards(true));
  piePanel.append(pie, refrescar);
  card.appendChild(piePanel);

  return card;
}

/* Franja superior con las 72 pastillas (5 en English): resalta las
   disponibles (con contenido y desbloqueadas) y muestra con 🔒 las que
   no. Un clic en una disponible baja la vista hasta su card. */
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
      : (aprobadasPorRA.get(raId) ? 'btn-outline-success' : 'btn-outline-warning'));

    if (!disponible) {
      boton.disabled = true;
      boton.title = desbloqueados.has(raId) ? 'Desbloqueado, sin contenido cargado todavía' : 'Bloqueado — tu instructor aún no lo habilita';
      boton.textContent = 'RA-' + String(raId).padStart(2, '0') + ' 🔒';
    } else {
      boton.textContent = 'RA-' + String(raId).padStart(2, '0') + (aprobadasPorRA.get(raId) ? ' ✓' : '');
      boton.addEventListener('click', () => {
        const destino = document.getElementById('ra-card-' + raId);
        if (destino) destino.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
  const raConContenido = [...porRA.keys()]
    .filter(raId => desbloqueados.has(raId) && raId <= totalRA && (porRA.get(raId).get(AA_TARJETA_RA_CARDS) || []).length)
    .sort((a, b) => a - b);

  contenedor.replaceChildren();

  const aprobadasPorRA = new Map();
  raConContenido.forEach(raId => {
    const materiales = porRA.get(raId).get(AA_TARJETA_RA_CARDS) || [];
    const todas = materiales.length > 0 && materiales.every(m => estadoMCard(ultimos, m.cuestionarioId).aprobado);
    aprobadasPorRA.set(raId, todas);
  });

  pintarSelectorRA(totalRA, raConContenido, desbloqueados, aprobadasPorRA);

  if (!raConContenido.length) {
    estado.textContent = `${desbloqueados.size} de ${totalRA} RA desbloqueados, pero ninguno tiene contenido cargado todavía.`;
    return;
  }

  estado.textContent = `${raConContenido.length} de ${totalRA} RA disponibles para presentar (${desbloqueados.size} desbloqueados en total).`;
  raConContenido.forEach(raId => {
    contenedor.appendChild(pintarCardRA(raId, porRA.get(raId), ultimos, params));
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
