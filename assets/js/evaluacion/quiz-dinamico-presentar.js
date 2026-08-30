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

  const mSel = seleccionModuloQD[raId];
  [1, 2, 3, 4].forEach(m => {
    const quizEntry = quizzesRAA.find(x => x.modulo === m);
    const tile = pintarTileModuloQD(m, quizEntry, ultimos, mSel === m, elegido => {
      abrirFormularioQD(elegido, params);
    });
    fila.appendChild(tile);
  });
  card.appendChild(fila);

  const pie = document.createElement('p');
  pie.className = 'small text-muted mb-0 mt-2';
  pie.textContent = conContenido.length
    ? `${aprobados} de ${conContenido.length} módulo(s) creado(s) aprobado(s)`
    : 'El instructor todavía no ha creado módulos para este RAA.';
  card.appendChild(pie);

  return card;
}

/* ── Responder un módulo: pantalla completa dentro del panel (no un
   iframe), con las preguntas en un formulario Bootstrap (form-check),
   igual al resto del sitio. Reemplaza el motor de pages/quiz-dinamico.html
   para esta interacción; ese archivo sigue existiendo por compatibilidad
   pero ya no se usa desde aquí. ── */

let temporizadorQDR = null;

function irAListaQD() {
  if (temporizadorQDR) { clearInterval(temporizadorQDR); temporizadorQDR = null; }
  document.querySelectorAll('.view-section').forEach(s => { s.style.display = 'none'; });
  const lista = document.getElementById('sec-quiz-dinamico');
  if (lista) lista.style.display = 'block';
}

async function abrirFormularioQD(quizEntry, params) {
  const cedula = params.get('doc') || '';
  const nombre = params.get('u') || 'Aprendiz';
  const cId = cuestionarioIdQD(quizEntry.ficha, quizEntry.raId, quizEntry.aa, quizEntry.modulo);

  let quiz;
  try {
    const resp = await fetch(`${API_BASE_QD}/quizzes/${quizEntry.ficha}/${quizEntry.raId}/${quizEntry.aa}/${quizEntry.modulo}`);
    if (!resp.ok) throw new Error('no encontrado');
    quiz = await resp.json();
  } catch (e) {
    alert('No se pudo cargar el módulo.');
    return;
  }

  if (quiz.intentosPermitidos > 0 && cedula) {
    let intentosUsados = 0;
    try {
      const historial = await (await fetch(`${API_BASE_QD}/resultados/${encodeURIComponent(cedula)}`)).json();
      intentosUsados = (historial.historial || []).filter(r => r.cuestionario === cId).length;
    } catch (e) { /* si no se puede consultar, se deja presentar (best-effort) */ }
    if (intentosUsados >= quiz.intentosPermitidos) {
      alert(`Ya usaste tus ${quiz.intentosPermitidos} intento(s) permitido(s) para este módulo.`);
      return;
    }
  }

  const puntajeMaximo = quiz.preguntas.reduce((suma, p) => suma + p.puntos, 0);
  document.getElementById('qdr-titulo').textContent =
    `RA-${String(quizEntry.raId).padStart(2, '0')} · AA${quizEntry.aa} · Módulo ${quizEntry.modulo}`;
  document.getElementById('qdr-subtitulo').textContent =
    `${quiz.preguntas.length} preguntas · máximo ${puntajeMaximo} puntos`;
  document.getElementById('qdr-msg').textContent = '';
  document.getElementById('qdr-msg').className = 'login-msg';

  const contenedor = document.getElementById('qdr-preguntas');
  contenedor.innerHTML = quiz.preguntas.map((p, i) => {
    const opciones = p.tipo === 'vf' ? ['Verdadero', 'Falso'] : p.opciones;
    return '<div class="quiz-question">' +
      '<p>' + (i + 1) + '. ' + p.texto + '</p>' +
      opciones.map((op, j) =>
        '<div class="form-check">' +
          '<input class="form-check-input" type="radio" name="qdr-q' + i + '" id="qdr-q' + i + '-o' + j + '" value="' + j + '" required>' +
          '<label class="form-check-label" for="qdr-q' + i + '-o' + j + '">' + op + '</label>' +
        '</div>'
      ).join('') +
      '</div>';
  }).join('');

  const form = document.getElementById('qdr-form');
  form.dataset.contexto = JSON.stringify({ cId, cedula, nombre, puntajeMaximo, total: quiz.preguntas.length, preguntas: quiz.preguntas });
  actualizarProgresoQD();

  const zonaTiempo = document.getElementById('qdr-tiempo');
  if (temporizadorQDR) { clearInterval(temporizadorQDR); temporizadorQDR = null; }
  if (quiz.limiteTiempoMinutos > 0) {
    let segundos = quiz.limiteTiempoMinutos * 60;
    zonaTiempo.hidden = false;
    const actualizarTiempo = () => {
      const m = Math.floor(segundos / 60), s = segundos % 60;
      zonaTiempo.textContent = 'Tiempo restante: ' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
    };
    actualizarTiempo();
    temporizadorQDR = setInterval(() => {
      segundos -= 1;
      actualizarTiempo();
      if (segundos <= 0) {
        clearInterval(temporizadorQDR);
        temporizadorQDR = null;
        enviarFormularioQD(true);
      }
    }, 1000);
  } else {
    zonaTiempo.hidden = true;
  }

  document.querySelectorAll('.view-section').forEach(s => { s.style.display = 'none'; });
  document.getElementById('sec-quiz-dinamico-responder').style.display = 'block';
  window.scrollTo({ top: 0 });
}

/* Puntaje EN VIVO: como la respuesta correcta ya viaja en el propio
   quiz (igual que hacía pages/quiz-dinamico.html), cada radio marcado
   se califica al instante y la barra avanza según puntos, no según
   preguntas contestadas — un acierto de 5 pts pesa más que uno de 1 pt. */
function actualizarProgresoQD() {
  const form = document.getElementById('qdr-form');
  if (!form || !form.dataset.contexto) return;
  const { puntajeMaximo, total, preguntas } = JSON.parse(form.dataset.contexto);

  let puntajeObtenido = 0;
  let respondidas = 0;
  for (let i = 0; i < total; i++) {
    const marcada = form.querySelector(`input[name="qdr-q${i}"]:checked`);
    if (!marcada) continue;
    respondidas += 1;
    if (Number(marcada.value) === preguntas[i].respuestaCorrecta) puntajeObtenido += preguntas[i].puntos;
  }

  const porcentaje = puntajeMaximo ? Math.round((puntajeObtenido / puntajeMaximo) * 100) : 0;
  document.getElementById('qdr-progreso-texto').textContent =
    `Puntaje: ${puntajeObtenido} / ${puntajeMaximo} · ${respondidas} / ${total} respondidas`;
  const barra = document.getElementById('qdr-progreso-bar');
  barra.style.width = porcentaje + '%';
  barra.setAttribute('aria-valuenow', String(porcentaje));
  return puntajeObtenido;
}

async function enviarFormularioQD(porTiempoAgotado) {
  const form = document.getElementById('qdr-form');
  const msg = document.getElementById('qdr-msg');
  const contexto = JSON.parse(form.dataset.contexto || '{}');
  const { cId, cedula, nombre, puntajeMaximo, total } = contexto;

  if (!porTiempoAgotado) {
    for (let i = 0; i < total; i++) {
      if (!form.querySelector(`input[name="qdr-q${i}"]:checked`)) {
        msg.textContent = 'Falta responder la pregunta ' + (i + 1) + '.';
        msg.className = 'login-msg error';
        return;
      }
    }
  }
  if (temporizadorQDR) { clearInterval(temporizadorQDR); temporizadorQDR = null; }

  const puntosGanados = actualizarProgresoQD() || 0;

  if (cedula) {
    try {
      await fetch(API_BASE_QD + '/resultados', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cedula, nombre, modulo: 'SENAEnglish', cuestionario: cId, puntaje: puntosGanados, totalPreguntas: puntajeMaximo }),
      });
    } catch (e) { /* best-effort */ }
  }

  const porcentaje = puntajeMaximo ? Math.round((puntosGanados / puntajeMaximo) * 10000) / 100 : 0;
  const aprobado = porcentaje >= 70;
  msg.className = 'login-msg ' + (aprobado ? 'exito' : 'error');
  msg.textContent = (aprobado ? 'APROBADO ✅ · ' : 'SIN APROBAR ⚠️ · ') +
    'Puntaje: ' + puntosGanados + ' / ' + puntajeMaximo + ' (' + porcentaje.toFixed(2) + '%)';
  form.querySelectorAll('input, button').forEach(el => { el.disabled = true; });

  setTimeout(() => {
    irAListaQD();
    cargarQuizDinamicoPresentar();
  }, 2000);
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

  const formQDR = document.getElementById('qdr-form');
  if (formQDR) {
    formQDR.addEventListener('submit', e => {
      e.preventDefault();
      enviarFormularioQD(false);
    });
    formQDR.querySelectorAll('[data-view="sec-quiz-dinamico"]').forEach(btn => {
      btn.addEventListener('click', () => { if (temporizadorQDR) { clearInterval(temporizadorQDR); temporizadorQDR = null; } });
    });
  }
  const preguntasQDR = document.getElementById('qdr-preguntas');
  if (preguntasQDR) preguntasQDR.addEventListener('change', actualizarProgresoQD);
});
