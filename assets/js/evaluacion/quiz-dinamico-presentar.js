/* ══════════════════════════════════════════
   Módulo 4 · 4.1 Presentar Quiz/Evaluación — pages/aprendiz.html
   Lista los RAA desbloqueados (mismo tope de 5 que ra-cards-presentar.js)
   con sus hasta 4 módulos del banco de preguntas nuevo (server/routes/
   quizzes.js) — independiente del viejo esquema M1-M4 basado en archivos.
   Reutiliza ultimosPorCuestionarioCards()/estadoMCard() de
   assets/js/evaluacion/ra-cards-render.js (genéricas, por string de
   cuestionario, sin importar el formato "-m-" o "-mod-").
══════════════════════════════════════════ */

const API_BASE_QD = '/api';
const TOPE_RAA_APRENDIZ_QD = 5;
const AA_FIJA_QD = 1;
const ETIQUETA_TIPO_QD = { quiz: 'Quiz · 10 preguntas', evaluacion: 'Evaluación · 30 preguntas' };

let seleccionModuloQD = {}; // { [raId]: modulo }

function cuestionarioIdQD(ficha, raId, aa, modulo) {
  return `${ficha}-ra-${String(raId).padStart(2, '0')}-aa-${aa}-mod-${modulo}`;
}

function pintarTileModuloQD(modulo, quizEntry, ultimos, activo, onClick) {
  const tile = document.createElement('button');
  tile.type = 'button';
  tile.className = 'card';
  tile.style.cssText = 'flex:1;min-width:150px;padding:14px 10px;text-align:center;'
    + 'border-radius:14px;border:1px solid ' + (activo ? '#39A900' : '#ddd') + ';'
    + 'background:' + (activo ? '#eef8e8' : '#fff') + ';cursor:' + (quizEntry ? 'pointer' : 'not-allowed') + ';';

  if (!quizEntry) {
    tile.disabled = true;
    tile.style.opacity = '0.55';
    tile.innerHTML = `<div style="font-weight:700;">Módulo ${modulo}</div><div class="small text-muted">Sin crear</div>`;
    return tile;
  }

  const cId = cuestionarioIdQD(quizEntry.ficha, quizEntry.raId, quizEntry.aa, quizEntry.modulo);
  const { texto, aprobado } = estadoMCard(ultimos, cId);
  const colorEstado = aprobado ? '#278238' : (texto === 'Sin presentar' ? '#777' : '#c9640a');
  tile.innerHTML = `
    <div style="font-weight:700;">Módulo ${modulo}</div>
    <div class="small text-muted">${ETIQUETA_TIPO_QD[quizEntry.tipo]}</div>
    <div class="small" style="color:${colorEstado};font-weight:600;margin-top:4px;">${texto}</div>`;
  tile.addEventListener('click', () => onClick(quizEntry));
  return tile;
}

function pintarCardRAAQD(raId, aa, quizzesRAA, ultimos, params) {
  const estados = [1, 2, 3, 4].map(m => {
    const q = quizzesRAA.find(x => x.modulo === m);
    return q ? estadoMCard(ultimos, cuestionarioIdQD(q.ficha, q.raId, q.aa, q.modulo)) : null;
  });
  const conContenido = estados.filter(Boolean);
  const aprobados = conContenido.filter(e => e.aprobado).length;

  const card = document.createElement('div');
  card.className = 'card content-card';
  card.style.cssText = 'margin-bottom:18px;padding:18px;width:100%;background:#f4f4f4;';

  const encabezado = document.createElement('div');
  encabezado.className = 'd-flex flex-wrap align-items-center gap-2';
  encabezado.style.marginBottom = '14px';
  encabezado.innerHTML = `<h3 style="margin:0;">RA-${String(raId).padStart(2, '0')} · AA${aa}</h3>`;
  card.appendChild(encabezado);

  const fila = document.createElement('div');
  fila.className = 'd-flex flex-wrap gap-2';

  const frame = document.createElement('iframe');
  frame.className = 'qd-card-frame';
  frame.title = `RA-${raId} módulo`;
  frame.style.cssText = 'width:100%;height:60vh;border:0;border-radius:12px;margin-top:14px;display:none;';

  const mSel = seleccionModuloQD[raId];
  [1, 2, 3, 4].forEach(m => {
    const quizEntry = quizzesRAA.find(x => x.modulo === m);
    const tile = pintarTileModuloQD(m, quizEntry, ultimos, mSel === m, elegido => {
      document.querySelectorAll('.qd-card-frame').forEach(otro => {
        if (otro !== frame) otro.style.display = 'none';
      });
      Object.keys(seleccionModuloQD).forEach(k => { if (Number(k) !== raId) delete seleccionModuloQD[k]; });
      seleccionModuloQD[raId] = m;
      frame.style.display = 'block';
      frame.src = `/pages/quiz-dinamico.html?doc=${encodeURIComponent(params.get('doc') || '')}`
        + `&u=${encodeURIComponent(params.get('u') || '')}&ficha=${elegido.ficha}&ra=${elegido.raId}&aa=${elegido.aa}&modulo=${elegido.modulo}`;
      frame.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    fila.appendChild(tile);
  });
  card.appendChild(fila);
  card.appendChild(frame);

  const pie = document.createElement('p');
  pie.className = 'small text-muted mb-0 mt-2';
  pie.textContent = conContenido.length
    ? `${aprobados} de ${conContenido.length} módulo(s) creado(s) aprobado(s)`
    : 'El instructor todavía no ha creado módulos para este RAA.';
  card.appendChild(pie);

  return card;
}

async function cargarQuizDinamicoPresentar() {
  const contenedor = document.getElementById('qd-presentar-contenedor');
  const estado = document.getElementById('qd-presentar-estado');
  if (!contenedor || !estado) return;

  const params = new URLSearchParams(window.location.search);
  const cedula = params.get('doc');
  if (!cedula) { estado.textContent = 'No se pudo identificar tu documento.'; return; }

  estado.textContent = 'Cargando…';
  let quizzes, resultados, acceso;
  try {
    [quizzes, resultados, acceso] = await Promise.all([
      fetch(API_BASE_QD + '/quizzes').then(r => r.json()),
      fetch(API_BASE_QD + '/resultados/' + encodeURIComponent(cedula)).then(r => r.json()).catch(() => ({ historial: [] })),
      fetch(API_BASE_QD + '/acceso/' + encodeURIComponent(cedula)).then(r => r.json()).catch(() => ({ unlocked: [] })),
    ]);
  } catch (e) {
    estado.textContent = 'No se pudo conectar con el servidor de reportes.';
    return;
  }

  const ultimos = ultimosPorCuestionarioCards(resultados.historial);
  const desbloqueados = new Set(acceso.unlocked || []);
  const fichas = typeof fichasDeAprendiz === 'function' ? fichasDeAprendiz(cedula) : ['adso'];

  contenedor.replaceChildren();
  let raaListados = 0;
  fichas.forEach(ficha => {
    // Los RA se crean progresivamente (RA1, RA2, RA3...) — no hay un total
    // fijo: solo se listan los que el instructor ya creó con contenido,
    // limitados a los que este aprendiz tiene desbloqueados.
    const raasCreados = [...new Set(
      quizzes.filter(q => q.ficha === ficha && q.aa === AA_FIJA_QD).map(q => q.raId)
    )].sort((a, b) => a - b);
    raasCreados
      .filter(raId => desbloqueados.has(raId))
      .slice(0, TOPE_RAA_APRENDIZ_QD)
      .forEach(raId => {
        const quizzesRAA = quizzes.filter(q => q.ficha === ficha && q.raId === raId && q.aa === AA_FIJA_QD);
        contenedor.appendChild(pintarCardRAAQD(raId, AA_FIJA_QD, quizzesRAA, ultimos, params));
        raaListados += 1;
      });
  });

  estado.textContent = raaListados
    ? `${raaListados} RAA desbloqueado(s) disponibles para presentar.`
    : 'Todavía no hay RAA con módulos creados y desbloqueados para ti.';
}

document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('qd-presentar-contenedor')) return;
  document.querySelectorAll('[data-view="sec-quiz-dinamico"]').forEach(a => a.addEventListener('click', cargarQuizDinamicoPresentar));
});
