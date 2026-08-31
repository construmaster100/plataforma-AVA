/* ══════════════════════════════════════════
   3.7 · RA general nuevo — pages/instructor.html (sec-ejercicios)

   Mismo modelo que 2.1 · RA nuevo (quiz-crear-instructor.js): un RA con
   sus 4 VAA y preguntas de ejemplo, guardado en el mismo banco de
   preguntas (server/routes/quizzes.js). La única diferencia es que aquí
   no hay selector de ficha — la ficha se fija a FICHA_GENERAL_QCG, así
   que el RA queda de uso generalizado (cualquier aprendiz de cualquier
   ficha lo presenta y suma a su score): GET /api/quizzes/puntaje/:cedula
   ya recorre TODOS los quizzes sin filtrar por la ficha real del
   aprendiz, así que un RA con ficha "general" aporta a todos por igual.

   proximoRaIdQC y preguntasEjemploQC son de quiz-crear-instructor.js
   (cargado antes que este archivo) — se reutilizan tal cual.
══════════════════════════════════════════ */

const FICHA_GENERAL_QCG = 'general';

async function agregarRAGeneralQCG() {
  const aviso = document.getElementById('qcg-aviso');
  aviso.hidden = false;
  aviso.textContent = 'Creando…';
  aviso.style.color = '#278238';

  const intentosPermitidos = Number(document.getElementById('qcg-intentos').value) || 0;
  const planes = [1, 2, 3, 4].map(m => ({
    modulo: m,
    n: Number(document.getElementById(`qcg-m${m}-n`).value),
    puntos: Number(document.getElementById(`qcg-m${m}-pts`).value),
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
    const raId = await proximoRaIdQC(FICHA_GENERAL_QCG);
    const doc = new URLSearchParams(window.location.search).get('doc');
    for (const plan of planes) {
      const resp = await fetch(API_BASE_QC + '/quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ficha: FICHA_GENERAL_QCG, raId, aa: 1, modulo: plan.modulo, tipo: 'evaluacion',
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
    aviso.textContent = `RA general-${String(raId).padStart(2, '0')} creado con sus 4 VAA (con preguntas de ejemplo).`;
    aviso.style.color = '#278238';
  } catch (e) {
    aviso.textContent = 'No se pudo crear el RA: ' + e.message;
    aviso.style.color = '#c0392b';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const boton = document.getElementById('qcg-btn-crear');
  if (boton) boton.addEventListener('click', agregarRAGeneralQCG);
});
