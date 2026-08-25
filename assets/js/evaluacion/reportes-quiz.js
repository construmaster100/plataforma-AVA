/* ══════════════════════════════════════════
   Reportes de cuestionarios — pages/instructor.html
   Muestra el listado completo de aprendices registrados (los únicos que
   pueden iniciar sesión y por lo tanto reportar score), agrupados por
   ficha, cruzando la nómina (assets/js/autenticacion/nomina.js +
   registro.js) con el puntaje acumulado que ya haya en la API REST de
   server/ (server/routes/resultados.js) — agregado por cédula sobre
   cualquier "cuestionario" reportado (SENAEnglish y cualquier otra
   prueba futura que postee a /api/resultados).
══════════════════════════════════════════ */

const API_BASE_INS = 'http://localhost:3000/api';

/* Nómina de aprendices registrados, por ficha. Hoy solo REGISTRO_FICHA1
   (3293836) tiene identidades reales capaces de iniciar sesión; se arma
   por ficha para que futuras fichas con nómina propia entren solo. */
function rosterRegistrado() {
  const fichas = [REGISTRO_FICHA1].filter(f => typeof f === 'object');
  return fichas.flatMap(f => f.usuarios.map(u => {
    const persona = NOMINA.find(a => a.i === u.i);
    return {
      fichaId: f.ficha,
      fichaPrograma: f.programa,
      cedula: u.documento,
      nombre: persona ? persona.completo : ('Aprendiz ' + u.i),
    };
  }));
}

async function cargarReportesQuiz() {
  const tbody = document.getElementById('reportes-quiz-tbody');
  const estado = document.getElementById('reportes-quiz-estado');
  if (!tbody || !estado) return;

  estado.textContent = 'Cargando…';
  let reportados = [];
  let apiDisponible = true;
  try {
    reportados = await (await fetch(API_BASE_INS + '/resultados/reporte/instructor')).json();
  } catch (e) {
    apiDisponible = false;
  }
  const porCedula = new Map(reportados.map(r => [String(r.cedula), r]));

  const roster = rosterRegistrado();
  const porFicha = new Map();
  roster.forEach(persona => {
    const reportado = porCedula.get(String(persona.cedula));
    if (!porFicha.has(persona.fichaId)) porFicha.set(persona.fichaId, { programa: persona.fichaPrograma, filas: [] });
    porFicha.get(persona.fichaId).filas.push({
      nombre: persona.nombre,
      cedula: persona.cedula,
      cuestionariosResueltos: reportado ? reportado.cuestionariosResueltos : 0,
      puntajeAcumulado: reportado ? reportado.puntajeAcumulado : 0,
      porcentaje: reportado ? reportado.porcentaje : 0,
      ultimaFecha: reportado ? reportado.ultimaFecha : null,
    });
  });

  estado.textContent = apiDisponible
    ? (roster.length + ' aprendiz(es) registrados en ' + porFicha.size + ' ficha(s).')
    : 'No se pudo conectar con el servidor de reportes (npm run start:adso) — se muestra el listado sin puntajes.';

  tbody.innerHTML = '';
  porFicha.forEach((grupo, fichaId) => {
    const encabezado = document.createElement('tr');
    encabezado.innerHTML = `<td colspan="7"><strong>Ficha ${fichaId}</strong> — ${grupo.programa}</td>`;
    tbody.appendChild(encabezado);

    grupo.filas
      .sort((a, b) => b.puntajeAcumulado - a.puntajeAcumulado)
      .forEach(f => {
        const tr = document.createElement('tr');
        const sinPresentar = f.cuestionariosResueltos === 0;
        tr.innerHTML = `
          <td>${f.nombre}</td>
          <td>${f.cedula}</td>
          <td>${f.cuestionariosResueltos}</td>
          <td>${f.puntajeAcumulado}</td>
          <td>${sinPresentar ? '—' : f.porcentaje + '%'}</td>
          <td>${f.ultimaFecha ? new Date(f.ultimaFecha).toLocaleString() : 'Sin presentar'}</td>
          <td>${sinPresentar ? '' : `<button type="button" class="btn btn-sm btn-outline-success" data-cedula="${f.cedula}">Ver</button>`}</td>`;
        tbody.appendChild(tr);
      });
  });
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
