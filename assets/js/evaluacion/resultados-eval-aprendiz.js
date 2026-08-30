/* ══════════════════════════════════════════
   Módulo 4 · 4.2 Resultados de evaluación — pages/aprendiz.html
   Puntaje ponderado calculado por GET /api/quizzes/puntaje/:cedula
   (server/routes/quizzes.js) sobre el puntaje objetivo que el instructor
   asignó a cada ficha (server/models/FichaConfig.js) — no hay un total de
   RA fijo: la tabla solo muestra los RAA que el instructor ya creó
   (porRAA), que van creciendo progresivamente.
══════════════════════════════════════════ */

const API_BASE_REA = '/api';

function filaRAAResultadoEval(raa) {
  const pct = raa.pesoMaximo ? Math.round((raa.puntosGanados / raa.pesoMaximo) * 100) : 0;
  return `<tr>
    <td>RA-${String(raa.raId).padStart(2, '0')} · AA${raa.aa} · ${raa.ficha}</td>
    <td>${raa.pesoMaximo.toFixed(2)}</td>
    <td>${raa.puntosGanados.toFixed(2)}</td>
    <td>${pct}%</td>
  </tr>`;
}

async function cargarResultadosEvalAprendiz() {
  const resumen = document.getElementById('rea-resumen');
  const barraFill = document.getElementById('rea-barra-fill');
  const scoreSimpleEl = document.getElementById('rea-score-simple');
  const tbody = document.getElementById('rea-tbody');
  if (!resumen || !tbody) return;

  const params = new URLSearchParams(window.location.search);
  const cedula = params.get('doc');
  if (!cedula) { resumen.textContent = 'No se pudo identificar tu documento.'; return; }

  resumen.textContent = 'Cargando…';
  let datos;
  try {
    datos = await (await fetch(API_BASE_REA + '/quizzes/puntaje/' + encodeURIComponent(cedula))).json();
  } catch (e) {
    resumen.textContent = 'No se pudo conectar con el servidor de reportes.';
    return;
  }

  const porcentajeGlobal = datos.escalaTotal ? Math.round((datos.puntajeTotal / datos.escalaTotal) * 10000) / 100 : 0;
  resumen.textContent = datos.escalaTotal
    ? `${datos.puntajeTotal.toFixed(2)} / ${datos.escalaTotal} puntos (${porcentajeGlobal}%)`
    : 'Tu instructor todavía no ha creado módulos de evaluación.';
  if (barraFill) barraFill.style.width = `${Math.min(porcentajeGlobal, 100)}%`;

  if (scoreSimpleEl) {
    scoreSimpleEl.hidden = false;
    scoreSimpleEl.textContent = `🏆 Score: ${datos.scoreSimple || 0} puntos (acumulado: suma cada reporte, sin ponderar ni quedarse solo con el mejor intento)`;
  }

  tbody.innerHTML = (datos.porRAA || []).map(filaRAAResultadoEval).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('rea-tbody')) return;
  document.querySelectorAll('[data-view="sec-resultados-eval"]').forEach(a => a.addEventListener('click', cargarResultadosEvalAprendiz));
});
