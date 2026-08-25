/* ══════════════════════════════════════════
   SGMA-ADSO — Vista de guías del instructor

   Pinta sobre la misma tabla estática de sec-guias-gaa (1.4/2.3,
   misma hoja para ambas entradas del sidebar), pero a diferencia
   de guias-vista.js del aprendiz, el estado que muestra es
   AGREGADO sobre todo el roster de la ficha — no personal.

   También expone tituloDeGuia()/hrefDeGuia(), lectura pura sobre
   el DOM de la tabla, reutilizadas por sesiones-vista.js (2.4).

   Depende de:
     · ficha.js               → getFichaInstructor
     · guias-aprendizaje.js   → estadoDeGuia (vía leerAlmacen directo abajo)
     · modulos-formativos.js  → rosterConClave(fichaId)
══════════════════════════════════════════ */

function filaDeGuiaIns(codigo) {
  return document.querySelector('#gaa-tbody tr[data-gaa="' + codigo + '"]');
}

function tituloDeGuia(codigo) {
  const fila = filaDeGuiaIns(codigo);
  const enlace = fila && fila.querySelector('.gaa-nombre');
  return enlace ? enlace.textContent.trim() : 'Guía ' + codigo;
}

function hrefDeGuia(codigo) {
  const fila = filaDeGuiaIns(codigo);
  const enlace = fila && fila.querySelector('.gaa-nombre');
  return enlace ? enlace.getAttribute('href') : '';
}

function pintarEstadoGuiasAgregado() {
  const filas = document.querySelectorAll('#gaa-tbody tr[data-gaa]');
  if (!filas.length) return;

  const roster = rosterConClave(typeof getFichaInstructor === 'function' ? getFichaInstructor() : FICHA_EN_CURSO);
  const todosGuias = typeof leerAlmacen === 'function' ? leerAlmacen('sgma_guias_gaa', {}) : {};

  filas.forEach(fila => {
    const codigo = fila.getAttribute('data-gaa');
    const celda = fila.querySelector('.gaa-estado');
    if (!celda) return;

    let desarrolladas = 0, enCurso = 0, pendientes = 0;
    roster.forEach(alumno => {
      const registro = todosGuias[alumno.clave] || { abiertas: [], entregadas: [] };
      if (registro.entregadas.indexOf(codigo) !== -1) desarrolladas++;
      else if (registro.abiertas.indexOf(codigo) !== -1) enCurso++;
      else pendientes++;
    });

    celda.replaceChildren();
    const resumen = document.createElement('span');
    resumen.className = 'repo-conteo';
    resumen.textContent = desarrolladas + ' desarrolladas · ' + enCurso + ' en curso · ' + pendientes + ' pendientes';
    celda.appendChild(resumen);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  if (typeof rosterConClave !== 'function') return;
  pintarEstadoGuiasAgregado();
});

/* Otro instructor marcando asistencia/actividad en otra pestaña
   del mismo navegador también mueve este agregado. */
window.addEventListener('storage', evento => {
  if (evento.key === 'sgma_guias_gaa') pintarEstadoGuiasAgregado();
});
