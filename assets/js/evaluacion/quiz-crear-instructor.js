/* ══════════════════════════════════════════
   Módulo 4 · 4.1 Crear Quiz/Evaluación — pages/instructor.html
   Formulario de autoría real para el banco de preguntas nuevo (Mongo,
   server/routes/quizzes.js): por cada RAA, hasta 4 módulos, cada uno un
   Quiz (10 preguntas) o una Evaluación (30), con preguntas Verdadero/Falso
   o de 4 opciones con una correcta. Reutiliza fichasDeInstructor()
   (assets/js/estado/ficha.js) igual que tabla-score-ra.js.
══════════════════════════════════════════ */

const API_BASE_QC = '/api';
const PREGUNTAS_REQUERIDAS_QC = { quiz: 10, evaluacion: 30 };
const LETRAS_QC = ['A', 'B', 'C', 'D'];

function avisoQC(texto, esError) {
  const aviso = document.getElementById('qc-aviso');
  aviso.hidden = false;
  aviso.textContent = texto;
  aviso.style.color = esError ? '#c0392b' : '#278238';
}

function opcionesHtmlQC(idx, tipo, opciones, correcta) {
  if (tipo === 'vf') {
    return `<div class="row g-2">` + ['Verdadero', 'Falso'].map((etiqueta, j) => `
      <div class="col-6 form-check">
        <input type="radio" name="qc-correcta-${idx}" class="form-check-input qc-correcta" value="${j}" ${correcta === j ? 'checked' : ''}>
        <label class="form-check-label">${etiqueta}</label>
      </div>`).join('') + `</div>`;
  }
  return `<div class="row g-2">` + [0, 1, 2, 3].map(j => `
    <div class="col-6 d-flex align-items-center gap-2">
      <input type="radio" name="qc-correcta-${idx}" class="qc-correcta" value="${j}" ${correcta === j ? 'checked' : ''}>
      <input type="text" class="form-control qc-opcion-texto" data-opt="${j}" value="${(opciones && opciones[j]) || ''}" placeholder="Opción ${LETRAS_QC[j]}">
    </div>`).join('') + `</div>`;
}

function previewTextoQC(texto) {
  const limpio = (texto || '').trim();
  if (!limpio) return 'Sin texto todavía';
  return limpio.length > 70 ? limpio.slice(0, 70) + '…' : limpio;
}

/* Acordeón: cada pregunta arranca colapsada (solo el encabezado, con vista
   previa del texto/tipo/puntos) — con hasta 30 preguntas por evaluación,
   mostrar todo expandido a la vez hacía la pantalla interminable. Se
   expande con un clic en el encabezado; el cuerpo (texto, tipo, puntos,
   opciones) solo se pinta cuando hace falta editar esa pregunta puntual. */
function filaPreguntaHtmlQC(idx, preset) {
  const texto = preset ? preset.texto : '';
  const tipo = preset ? preset.tipo : 'opciones';
  const opciones = preset ? preset.opciones : [];
  const correcta = preset ? preset.respuestaCorrecta : null;
  const puntos = preset && preset.puntos ? preset.puntos : 1;
  return `
    <div class="card qc-pregunta w-100 p-0 overflow-hidden" data-idx="${idx}">
      <button type="button" class="qc-pregunta-header" style="all:unset;box-sizing:border-box;cursor:pointer;display:flex;align-items:center;gap:10px;padding:10px 12px;width:100%;background:#fafafa;">
        <span class="qc-pregunta-punto rounded-circle flex-shrink-0" style="width:9px;height:9px;background:${texto.trim() ? '#39A900' : '#ccc'};"></span>
        <strong class="flex-shrink-0">P${idx + 1}</strong>
        <span class="qc-pregunta-preview text-muted flex-grow-1 text-truncate text-start" style="min-width:0;">${previewTextoQC(texto)}</span>
        <span class="badge bg-secondary qc-pregunta-badge-tipo">${tipo === 'vf' ? 'V/F' : '4 op.'}</span>
        <span class="badge bg-secondary qc-pregunta-badge-puntos">${puntos} pt${puntos === 1 ? '' : 's'}</span>
        <span class="qc-pregunta-chevron flex-shrink-0 d-inline-block" style="transition:transform .15s;">▸</span>
      </button>
      <div class="qc-pregunta-cuerpo d-none p-3 border-top">
        <div class="form-group"><label>Pregunta ${idx + 1}</label>
          <input type="text" class="form-control qc-texto" value="${texto.replace(/"/g, '&quot;')}" placeholder="Texto de la pregunta">
        </div>
        <div class="d-flex flex-wrap gap-2 mb-2">
          <div class="form-group mb-0" style="flex:2;min-width:150px;"><label>Tipo</label>
            <select class="form-select qc-tipo-pregunta">
              <option value="opciones" ${tipo === 'opciones' ? 'selected' : ''}>4 opciones</option>
              <option value="vf" ${tipo === 'vf' ? 'selected' : ''}>Verdadero/Falso</option>
            </select>
          </div>
          <div class="form-group mb-0" style="flex:1;min-width:80px;"><label>Puntos</label>
            <input type="number" class="form-control qc-puntos" min="1" value="${puntos}">
          </div>
        </div>
        <div class="qc-opciones">${opcionesHtmlQC(idx, tipo, opciones, correcta)}</div>
      </div>
    </div>`;
}

function alternarPreguntaQC(fila, expandir) {
  const cuerpo = fila.querySelector('.qc-pregunta-cuerpo');
  const chevron = fila.querySelector('.qc-pregunta-chevron');
  const abrir = expandir !== undefined ? expandir : cuerpo.classList.contains('d-none');
  cuerpo.classList.toggle('d-none', !abrir);
  chevron.style.transform = abrir ? 'rotate(90deg)' : 'rotate(0deg)';
}

function refrescarEncabezadoQC(fila) {
  const idx = Number(fila.dataset.idx);
  const texto = fila.querySelector('.qc-texto').value;
  const tipo = fila.querySelector('.qc-tipo-pregunta').value;
  const puntos = Number(fila.querySelector('.qc-puntos').value) || 1;
  fila.querySelector('.qc-pregunta-punto').style.background = texto.trim() ? '#39A900' : '#ccc';
  fila.querySelector('.qc-pregunta-preview').textContent = previewTextoQC(texto);
  fila.querySelector('.qc-pregunta-badge-tipo').textContent = tipo === 'vf' ? 'V/F' : '4 op.';
  fila.querySelector('.qc-pregunta-badge-puntos').textContent = `${puntos} pt${puntos === 1 ? '' : 's'}`;
  void idx;
}

function generarFilasPreguntas(n, presets) {
  const contenedor = document.getElementById('qc-preguntas-contenedor');
  let html = '';
  for (let i = 0; i < n; i++) html += filaPreguntaHtmlQC(i, presets && presets[i]);
  contenedor.innerHTML = html;
  // Preguntas nuevas (sin preset): se abre la primera para empezar a
  // escribir de una vez. Preguntas cargadas desde un módulo existente:
  // todas colapsadas, para ver el conjunto completo de un vistazo.
  if ((!presets || !presets.length) && contenedor.firstElementChild) {
    alternarPreguntaQC(contenedor.firstElementChild, true);
  }
}

function poblarSelectorFichaQC() {
  const doc = new URLSearchParams(window.location.search).get('doc');
  const fichas = typeof fichasDeInstructor === 'function' ? fichasDeInstructor(doc) : ['adso'];
  const nombres = { adso: 'Análisis y Desarrollo de Software', english: 'English Coding' };
  ['qc-ficha-selector', 'qcr-ficha-selector'].forEach(id => {
    const selector = document.getElementById(id);
    if (!selector || selector.options.length) return;
    fichas.forEach(f => {
      const opt = document.createElement('option');
      opt.value = f;
      opt.textContent = nombres[f] || f;
      selector.appendChild(opt);
    });
  });
}

/* ── Agregar RA rápido: crea los 4 módulos de un RA nuevo de una vez, con
   preguntas de ejemplo (a editar después una por una arriba) — mismo
   patrón que seed-ejemplo-modulo4.js, pero desde el propio panel. ── */
function preguntasEjemploQC(modulo, n, puntosTotal) {
  const base = Math.floor(puntosTotal / n);
  const resto = puntosTotal - base * n;
  return Array.from({ length: n }, (_, i) => ({
    texto: `[Ejemplo] Pregunta ${i + 1} del Módulo ${modulo} — reemplázala con contenido real`,
    tipo: 'opciones',
    opciones: ['Opción A (ejemplo)', 'Opción B (ejemplo)', 'Opción C (ejemplo)', 'Opción D (ejemplo)'],
    respuestaCorrecta: 0,
    puntos: base + (i === n - 1 ? resto : 0),
  }));
}

async function proximoRaIdQC(ficha) {
  const lista = await (await fetch(API_BASE_QC + '/quizzes')).json();
  const idsFicha = lista.filter(q => q.ficha === ficha).map(q => q.raId);
  return idsFicha.length ? Math.max(...idsFicha) + 1 : 1;
}

async function agregarRARapidoQC() {
  const aviso = document.getElementById('qcr-aviso');
  aviso.hidden = false;
  aviso.textContent = 'Creando…';
  aviso.style.color = '#278238';

  const ficha = document.getElementById('qcr-ficha-selector').value || 'adso';
  const intentosPermitidos = Number(document.getElementById('qcr-intentos').value) || 0;
  const planes = [1, 2, 3, 4].map(m => ({
    modulo: m,
    n: Number(document.getElementById(`qcr-m${m}-n`).value),
    puntos: Number(document.getElementById(`qcr-m${m}-pts`).value),
  }));

  if (planes.some(p => !Number.isInteger(p.n) || p.n < 1 || !Number.isInteger(p.puntos) || p.puntos < 1)) {
    aviso.textContent = 'Cada módulo necesita un número de preguntas y unos puntos totales válidos (enteros ≥ 1).';
    aviso.style.color = '#c0392b';
    return;
  }
  if (intentosPermitidos < 0) {
    aviso.textContent = 'Los intentos permitidos no pueden ser negativos (0 = ilimitados).';
    aviso.style.color = '#c0392b';
    return;
  }

  try {
    const raId = await proximoRaIdQC(ficha);
    const doc = new URLSearchParams(window.location.search).get('doc');
    for (const plan of planes) {
      const resp = await fetch(API_BASE_QC + '/quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ficha, raId, aa: 1, modulo: plan.modulo, tipo: 'evaluacion',
          preguntas: preguntasEjemploQC(plan.modulo, plan.n, plan.puntos),
          limiteTiempoMinutos: 0, intentosPermitidos,
          creadoPor: doc || 'instructor',
        }),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(`Módulo ${plan.modulo}: ${err.error || 'no se pudo crear'}`);
      }
    }
    aviso.textContent = `RA-${String(raId).padStart(2, '0')} creado con sus 4 módulos (con preguntas de ejemplo — edítalas abajo).`;
    aviso.style.color = '#278238';
    cargarListaQC();
  } catch (e) {
    aviso.textContent = 'No se pudo crear el RA: ' + e.message;
    aviso.style.color = '#c0392b';
  }
}

async function cargarObjetivoFichaQC() {
  const ficha = document.getElementById('qc-ficha-selector').value || 'adso';
  try {
    const config = await (await fetch(`${API_BASE_QC}/quizzes/config/${ficha}`)).json();
    document.getElementById('qc-objetivo-ficha').value = config.puntajeObjetivo;
  } catch (e) { /* deja el valor que ya estaba en el input */ }
}

async function guardarObjetivoFichaQC() {
  const ficha = document.getElementById('qc-ficha-selector').value || 'adso';
  const puntajeObjetivo = Number(document.getElementById('qc-objetivo-ficha').value);
  const aviso = document.getElementById('qc-objetivo-aviso');
  aviso.hidden = false;
  if (!Number.isFinite(puntajeObjetivo) || puntajeObjetivo < 1) {
    aviso.textContent = 'El puntaje objetivo debe ser un número mayor a 0.';
    aviso.style.color = '#c0392b';
    return;
  }
  try {
    const resp = await fetch(`${API_BASE_QC}/quizzes/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ficha, puntajeObjetivo }),
    });
    if (!resp.ok) throw new Error();
    aviso.textContent = `Puntaje objetivo de ${ficha} guardado.`;
    aviso.style.color = '#278238';
  } catch (e) {
    aviso.textContent = 'No se pudo guardar el puntaje objetivo.';
    aviso.style.color = '#c0392b';
  }
}

function leerFormularioQC() {
  return {
    ficha: document.getElementById('qc-ficha-selector').value || 'adso',
    raId: Number(document.getElementById('qc-ra').value),
    aa: Number(document.getElementById('qc-aa').value),
    modulo: Number(document.getElementById('qc-modulo').value),
    tipo: document.getElementById('qc-tipo').value,
    limiteTiempoMinutos: Number(document.getElementById('qc-tiempo').value) || 0,
    intentosPermitidos: Number(document.getElementById('qc-intentos').value) || 0,
  };
}

async function cargarExistenteQC() {
  const { ficha, raId, aa, modulo } = leerFormularioQC();
  try {
    const resp = await fetch(`${API_BASE_QC}/quizzes/${ficha}/${raId}/${aa}/${modulo}`);
    if (resp.status === 404) {
      avisoQC('No existe todavía este módulo — se generó un formulario vacío.', false);
      generarFilasPreguntas(PREGUNTAS_REQUERIDAS_QC[document.getElementById('qc-tipo').value], []);
      return;
    }
    const quiz = await resp.json();
    document.getElementById('qc-tipo').value = quiz.tipo;
    document.getElementById('qc-tiempo').value = quiz.limiteTiempoMinutos || 0;
    document.getElementById('qc-intentos').value = quiz.intentosPermitidos || 0;
    generarFilasPreguntas(quiz.preguntas.length, quiz.preguntas);
    avisoQC('Módulo cargado para editar.', false);
  } catch (e) {
    avisoQC('No se pudo cargar el módulo.', true);
  }
}

function leerPreguntasFormularioQC() {
  const filas = document.querySelectorAll('#qc-preguntas-contenedor .qc-pregunta');
  const preguntas = [];
  for (const fila of filas) {
    const texto = fila.querySelector('.qc-texto').value.trim();
    const tipo = fila.querySelector('.qc-tipo-pregunta').value;
    const radioMarcado = fila.querySelector('.qc-correcta:checked');
    const puntos = Number(fila.querySelector('.qc-puntos').value);
    if (!texto || !radioMarcado || !Number.isInteger(puntos) || puntos < 1) return null;
    let opciones;
    if (tipo === 'vf') {
      opciones = ['Verdadero', 'Falso'];
    } else {
      opciones = [...fila.querySelectorAll('.qc-opcion-texto')].map(i => i.value.trim());
      if (opciones.some(o => !o)) return null;
    }
    preguntas.push({ texto, tipo, opciones, respuestaCorrecta: Number(radioMarcado.value), puntos });
  }
  return preguntas;
}

async function guardarQuizQC() {
  const { ficha, raId, aa, modulo, tipo, limiteTiempoMinutos, intentosPermitidos } = leerFormularioQC();
  const preguntas = leerPreguntasFormularioQC();
  if (!preguntas || preguntas.length !== PREGUNTAS_REQUERIDAS_QC[tipo]) {
    avisoQC(`Completa las ${PREGUNTAS_REQUERIDAS_QC[tipo]} preguntas (texto, opciones, puntos y la correcta marcada) antes de guardar.`, true);
    return;
  }
  const doc = new URLSearchParams(window.location.search).get('doc');
  try {
    const resp = await fetch(API_BASE_QC + '/quizzes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ficha, raId, aa, modulo, tipo, preguntas, limiteTiempoMinutos, intentosPermitidos,
        creadoPor: doc || 'instructor',
      }),
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      avisoQC(err.error || 'No se pudo guardar el quiz.', true);
      return;
    }
    avisoQC('Quiz guardado correctamente.', false);
    cargarListaQC();
  } catch (e) {
    avisoQC('No se pudo conectar con el servidor.', true);
  }
}

async function eliminarModuloQC() {
  const { ficha, raId, aa, modulo } = leerFormularioQC();
  if (!confirm(`¿Eliminar el módulo ${modulo} de RA-${raId} AA${aa} (${ficha})?`)) return;
  try {
    await fetch(`${API_BASE_QC}/quizzes/${ficha}/${raId}/${aa}/${modulo}`, { method: 'DELETE' });
    avisoQC('Módulo eliminado.', false);
    generarFilasPreguntas(PREGUNTAS_REQUERIDAS_QC[document.getElementById('qc-tipo').value], []);
    cargarListaQC();
  } catch (e) {
    avisoQC('No se pudo eliminar.', true);
  }
}

async function cargarListaQC() {
  const estado = document.getElementById('qc-lista-estado');
  const tbody = document.getElementById('qc-lista-tbody');
  if (!tbody) return;
  estado.textContent = 'Cargando…';
  let lista;
  try {
    lista = await (await fetch(API_BASE_QC + '/quizzes')).json();
  } catch (e) {
    estado.textContent = 'No se pudo conectar con el servidor.';
    return;
  }
  lista.sort((a, b) => a.ficha.localeCompare(b.ficha) || a.raId - b.raId || a.aa - b.aa || a.modulo - b.modulo);
  estado.textContent = `${lista.length} módulo(s) creado(s).`;
  tbody.innerHTML = lista.map(q => `
    <tr>
      <td>${q.ficha}</td>
      <td>RA-${String(q.raId).padStart(2, '0')} · AA${q.aa}</td>
      <td>${q.modulo}</td>
      <td>${q.tipo === 'quiz' ? 'Quiz (10)' : 'Evaluación (30)'}</td>
      <td>${q.nPreguntas}</td>
      <td>${q.maxPuntaje}</td>
      <td>${q.limiteTiempoMinutos ? q.limiteTiempoMinutos + ' min' : 'Sin límite'}</td>
      <td>${q.intentosPermitidos ? q.intentosPermitidos : 'Ilimitados'}</td>
      <td>${new Date(q.updatedAt).toLocaleString()}</td>
      <td>
        <button type="button" class="btn btn-sm btn-outline-primary qc-btn-editar"
          data-ficha="${q.ficha}" data-ra="${q.raId}" data-aa="${q.aa}" data-modulo="${q.modulo}">Editar</button>
      </td>
    </tr>`).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('qc-form')) return;

  document.querySelectorAll('[data-view="sec-crear-quiz"]').forEach(a => a.addEventListener('click', () => {
    poblarSelectorFichaQC();
    cargarObjetivoFichaQC();
    cargarListaQC();
  }));

  document.getElementById('qc-ficha-selector').addEventListener('change', cargarObjetivoFichaQC);
  document.getElementById('qc-btn-guardar-objetivo').addEventListener('click', guardarObjetivoFichaQC);
  const qcrBtnCrear = document.getElementById('qcr-btn-crear');
  if (qcrBtnCrear) qcrBtnCrear.addEventListener('click', agregarRARapidoQC);

  document.getElementById('qc-btn-cargar').addEventListener('click', cargarExistenteQC);
  document.getElementById('qc-btn-guardar').addEventListener('click', guardarQuizQC);
  document.getElementById('qc-btn-eliminar').addEventListener('click', eliminarModuloQC);

  document.getElementById('qc-tipo').addEventListener('change', () => {
    if (document.querySelectorAll('#qc-preguntas-contenedor .qc-pregunta').length
      && !confirm('Cambiar el tipo descarta las preguntas del formulario actual. ¿Continuar?')) {
      return;
    }
    generarFilasPreguntas(PREGUNTAS_REQUERIDAS_QC[document.getElementById('qc-tipo').value], []);
  });

  const contenedorPreguntas = document.getElementById('qc-preguntas-contenedor');

  contenedorPreguntas.addEventListener('click', e => {
    const header = e.target.closest('.qc-pregunta-header');
    if (header) alternarPreguntaQC(header.closest('.qc-pregunta'));
  });

  contenedorPreguntas.addEventListener('change', e => {
    if (e.target.classList.contains('qc-tipo-pregunta')) {
      const fila = e.target.closest('.qc-pregunta');
      const idx = Number(fila.dataset.idx);
      fila.querySelector('.qc-opciones').innerHTML = opcionesHtmlQC(idx, e.target.value, [], null);
    }
    if (e.target.matches('.qc-tipo-pregunta, .qc-puntos')) {
      refrescarEncabezadoQC(e.target.closest('.qc-pregunta'));
    }
  });

  contenedorPreguntas.addEventListener('input', e => {
    if (e.target.classList.contains('qc-texto')) {
      refrescarEncabezadoQC(e.target.closest('.qc-pregunta'));
    }
  });

  document.getElementById('qc-btn-expandir-todas').addEventListener('click', () => {
    contenedorPreguntas.querySelectorAll('.qc-pregunta').forEach(fila => alternarPreguntaQC(fila, true));
  });
  document.getElementById('qc-btn-colapsar-todas').addEventListener('click', () => {
    contenedorPreguntas.querySelectorAll('.qc-pregunta').forEach(fila => alternarPreguntaQC(fila, false));
  });

  document.getElementById('qc-lista-tbody').addEventListener('click', e => {
    const btn = e.target.closest('.qc-btn-editar');
    if (!btn) return;
    document.getElementById('qc-ficha-selector').value = btn.dataset.ficha;
    document.getElementById('qc-ra').value = btn.dataset.ra;
    document.getElementById('qc-aa').value = btn.dataset.aa;
    document.getElementById('qc-modulo').value = btn.dataset.modulo;
    cargarExistenteQC();
    document.getElementById('qc-form').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  generarFilasPreguntas(PREGUNTAS_REQUERIDAS_QC.quiz, []);
});
