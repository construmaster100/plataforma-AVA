/* ══════════════════════════════════════════
   Reportes de cuestionarios — pages/instructor.html
   Consume la API REST de server/ (server/routes/resultados.js),
   ya construida pero sin consumidor hasta ahora: agrega por aprendiz
   sobre cualquier "cuestionario" reportado (SENAEnglish y cualquier
   otra prueba futura que postee a /api/resultados).
══════════════════════════════════════════ */

const API_BASE_INS = 'http://localhost:3000/api';

async function cargarReportesQuiz() {
  const tbody = document.getElementById('reportes-quiz-tbody');
  const estado = document.getElementById('reportes-quiz-estado');
  if (!tbody || !estado) return;

  estado.textContent = 'Cargando…';
  try {
    const filas = await (await fetch(API_BASE_INS + '/resultados/reporte/instructor')).json();
    estado.textContent = filas.length + ' aprendiz(es) reportados.';
    tbody.innerHTML = filas.map(f => `<tr>
      <td>${f.aprendiz}</td>
      <td>${f.cedula ?? '—'}</td>
      <td>${f.cuestionariosResueltos}</td>
      <td>${f.puntajeAcumulado}</td>
      <td>${f.porcentaje}%</td>
      <td>${new Date(f.ultimaFecha).toLocaleString()}</td>
      <td><button type="button" class="btn btn-sm btn-outline-success" data-cedula="${f.cedula}">Ver</button></td>
    </tr>`).join('');
  } catch (e) {
    estado.textContent = 'No se pudo conectar con el servidor de reportes (npm run start:adso).';
    tbody.innerHTML = '';
  }
}

async function mostrarDetalleAprendiz(cedula) {
  const detalle = document.getElementById('reportes-quiz-detalle');
  if (!detalle || !cedula) return;
  try {
    const datos = await (await fetch(API_BASE_INS + '/resultados/' + encodeURIComponent(cedula))).json();
    detalle.hidden = false;
    detalle.innerHTML = `<h3>${datos.aprendiz.nombre}</h3><ul>` +
      datos.historial.map(h =>
        `<li>${h.modulo} — ${h.cuestionario}: ${h.puntaje}/${h.totalPreguntas} (${new Date(h.createdAt).toLocaleString()})</li>`
      ).join('') +
      '</ul>';
  } catch (e) {
    detalle.hidden = false;
    detalle.textContent = 'No se pudo cargar el detalle de este aprendiz.';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-view="sec-reportes-quiz"]')
    .forEach(a => a.addEventListener('click', cargarReportesQuiz));

  document.addEventListener('click', e => {
    const btn = e.target.closest('#reportes-quiz-tbody [data-cedula]');
    if (btn) mostrarDetalleAprendiz(btn.dataset.cedula);
  });
});
