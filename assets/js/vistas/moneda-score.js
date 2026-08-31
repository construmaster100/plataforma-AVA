/* ══════════════════════════════════════════
   Moneda de score generalizado — navbar del aprendiz (pages/aprendiz.html)

   Suma los aciertos de los RA de uso general (ficha "general", ver
   assets/js/evaluacion/quiz-crear-general.js) desde el mismo
   GET /api/quizzes/puntaje/:cedula que ya usan 3.2 Resultados y el
   listado del instructor — no es un puntaje nuevo, es un recorte de
   ese mismo dato para mostrarlo de forma vistosa en el navbar.
══════════════════════════════════════════ */

async function actualizarMonedaScoreGeneral() {
  const valorEl = document.getElementById('nav-coin-valor');
  if (!valorEl) return;

  const cedula = new URLSearchParams(window.location.search).get('doc');
  if (!cedula) return;

  try {
    const datos = await (await fetch('/api/quizzes/puntaje/' + encodeURIComponent(cedula))).json();
    const scoreGeneral = (datos.porRAA || [])
      .filter(raa => raa.ficha === 'general')
      .reduce((suma, raa) => suma + raa.modulos.reduce((s, m) => s + m.aciertos, 0), 0);
    valorEl.textContent = Math.round(scoreGeneral);
  } catch (e) { /* deja el valor previo en pantalla */ }
}

document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('nav-coin-valor')) return;
  actualizarMonedaScoreGeneral();
  setInterval(actualizarMonedaScoreGeneral, 60000);
});
