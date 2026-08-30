/* ══════════════════════════════════════════
   Módulo 4 · 4.2 Resultados de evaluación (instructor) — pages/instructor.html
   Tabla consolidada del puntaje ponderado (100% = el puntaje objetivo que el
   instructor asignó a la ficha, server/models/FichaConfig.js) de cada
   aprendiz de la nómina, calculado por GET /api/quizzes/puntaje/:cedula
   (server/routes/quizzes.js) — única fuente de este puntaje. Reutiliza
   rosterRegistrado() de assets/js/evaluacion/reportes-quiz.js.
══════════════════════════════════════════ */

const API_BASE_REI = '/api';
let puntajesPorCedulaREI = new Map();

async function cargarResultadosEvalInstructor() {
  const estado = document.getElementById('rei-estado');
  const tbody = document.getElementById('rei-tbody');
  if (!tbody) return;

  const roster = typeof rosterRegistrado === 'function' ? rosterRegistrado() : [];
  estado.textContent = 'Cargando…';

  const datos = await Promise.all(roster.map(a =>
    fetch(API_BASE_REI + '/quizzes/puntaje/' + encodeURIComponent(a.cedula)).then(r => r.json()).catch(() => null)
  ));
  puntajesPorCedulaREI = new Map(roster.map((a, i) => [a.cedula, datos[i]]));

  estado.textContent = `${roster.length} aprendiz(es) en la nómina.`;
  tbody.innerHTML = roster.map(a => {
    const d = puntajesPorCedulaREI.get(a.cedula);
    const puntaje = d ? d.puntajeTotal : 0;
    const escala = d ? d.escalaTotal : 0;
    const pct = escala ? Math.round((puntaje / escala) * 10000) / 100 : 0;
    const score = d ? (d.scoreSimple || 0) : 0;
    return `<tr>
      <td>${a.nombre}</td>
      <td>${a.cedula}</td>
      <td>${puntaje.toFixed(2)} / ${escala}</td>
      <td>${pct}%</td>
      <td>🏆 ${score}</td>
      <td><button type="button" class="btn btn-sm btn-outline-success rei-btn-detalle" data-cedula="${a.cedula}">Ver detalle</button></td>
    </tr>`;
  }).join('');
}

function mostrarDetalleREI(cedula) {
  const detalle = document.getElementById('rei-detalle');
  const d = puntajesPorCedulaREI.get(cedula);
  if (!detalle) return;
  detalle.hidden = false;
  if (!d || !d.porRAA.length) {
    detalle.innerHTML = '<p class="mb-0">Este aprendiz todavía no tiene módulos presentados con contenido creado.</p>';
    return;
  }
  detalle.innerHTML = '<ul class="mb-0">' + d.porRAA.map(r => `
    <li>RA-${String(r.raId).padStart(2, '0')} · AA${r.aa} (${r.ficha}): ${r.puntosGanados.toFixed(2)} / ${r.pesoMaximo.toFixed(2)} pts
      — ${r.modulos.map(m => `M${m.modulo} ${m.aciertos}/${m.maxPuntaje}`).join(', ')}</li>`).join('') + '</ul>';
}

document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('rei-tbody')) return;

  document.querySelectorAll('[data-view="sec-resultados-eval-inst"]').forEach(a => a.addEventListener('click', cargarResultadosEvalInstructor));

  document.getElementById('rei-tbody').addEventListener('click', e => {
    const btn = e.target.closest('.rei-btn-detalle');
    if (btn) mostrarDetalleREI(btn.dataset.cedula);
  });
});
