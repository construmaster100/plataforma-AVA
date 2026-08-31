/* ══════════════════════════════════════════
   Moneda de score generalizado — navbar del aprendiz (pages/aprendiz.html)

   Muestra scoreSimple: el mismo "🏆 Score" (acumulado directo, suma cada
   reporte sin ponderar) que ya se ve en 3.2 Resultados, tanto en el
   propio panel del aprendiz (resultados-eval-aprendiz.js) como en el
   listado del instructor (resultados-eval-instructor.js) — mismo
   GET /api/quizzes/puntaje/:cedula, sin recorte por ficha: debe
   coincidir siempre con lo que 3.2 muestra para ese aprendiz.
══════════════════════════════════════════ */

async function actualizarMonedaScoreGeneral() {
  const valorEl = document.getElementById('nav-coin-valor');
  if (!valorEl) return;

  const cedula = new URLSearchParams(window.location.search).get('doc');
  if (!cedula) return;

  try {
    const datos = await (await fetch('/api/quizzes/puntaje/' + encodeURIComponent(cedula))).json();
    valorEl.textContent = Math.round(datos.scoreSimple || 0);
  } catch (e) { /* deja el valor previo en pantalla */ }
}

document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('nav-coin-valor')) return;
  actualizarMonedaScoreGeneral();
  setInterval(actualizarMonedaScoreGeneral, 60000);
});
