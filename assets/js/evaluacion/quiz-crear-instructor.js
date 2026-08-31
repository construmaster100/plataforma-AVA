/* ══════════════════════════════════════════
   2.1 Crear Quiz/Evaluación — pages/instructor.html
   Única forma de crear un RA en el banco de preguntas (Mongo,
   server/routes/quizzes.js): la tarjeta "RA nuevo" crea de una vez sus
   4 VAA con preguntas de ejemplo (ver preguntasEjemploQC) — no hay
   formulario aparte para editar pregunta por pregunta ni tabla de
   consulta; ese fue el alcance que se dejó a propósito en esta pantalla.
   Reutiliza fichasDeInstructor() (assets/js/estado/ficha.js) igual que
   tabla-score-ra.js.
══════════════════════════════════════════ */

const API_BASE_QC = '/api';

function poblarSelectorFichaQC() {
  const doc = new URLSearchParams(window.location.search).get('doc');
  const fichas = typeof fichasDeInstructor === 'function' ? fichasDeInstructor(doc) : ['adso'];
  const nombres = { adso: 'Análisis y Desarrollo de Software', english: 'English Coding' };
  const selector = document.getElementById('qcr-ficha-selector');
  if (!selector || selector.options.length) return;
  fichas.forEach(f => {
    const opt = document.createElement('option');
    opt.value = f;
    opt.textContent = nombres[f] || f;
    selector.appendChild(opt);
  });
}

/* ── Agregar RA rápido: crea los 4 VAA de un RA nuevo de una vez, con
   preguntas de ejemplo — mismo patrón que seed-ejemplo-modulo4.js, pero
   desde el propio panel. ── */
function preguntasEjemploQC(modulo, n, puntosTotal) {
  const base = Math.floor(puntosTotal / n);
  const resto = puntosTotal - base * n;
  return Array.from({ length: n }, (_, i) => ({
    texto: `[Ejemplo] Pregunta ${i + 1} de VAA${modulo} — reemplázala con contenido real`,
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
    aviso.textContent = 'Cada VAA necesita un número de preguntas y unos puntos totales válidos (enteros ≥ 1).';
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
        throw new Error(`VAA${plan.modulo}: ${err.error || 'no se pudo crear'}`);
      }
    }
    aviso.textContent = `RA-${String(raId).padStart(2, '0')} creado con sus 4 VAA (con preguntas de ejemplo).`;
    aviso.style.color = '#278238';
  } catch (e) {
    aviso.textContent = 'No se pudo crear el RA: ' + e.message;
    aviso.style.color = '#c0392b';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const qcrBtnCrear = document.getElementById('qcr-btn-crear');
  if (!qcrBtnCrear) return;

  document.querySelectorAll('[data-view="sec-crear-quiz"]').forEach(a =>
    a.addEventListener('click', poblarSelectorFichaQC));

  qcrBtnCrear.addEventListener('click', agregarRARapidoQC);
});
