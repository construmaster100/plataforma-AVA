/* ══════════════════════════════════════════
   SGMA-ADSO — Vista de semáforo de evidencias (instructor)

   Pinta sec-semaforo: toda la evidencia adjuntada en la ficha
   activa del instructor, con los 3 botones de color y un motivo
   opcional. Se pinta con la misma ficha que usa el resto del panel
   (getFichaInstructor).

   Depende de:
     · ficha.js               → getFichaInstructor
     · evidencias.js          → getEvidencias, fijarSemaforo
══════════════════════════════════════════ */

function fichaDeEvidencias() {
  return typeof getFichaInstructor === 'function' ? getFichaInstructor() : FICHA_EN_CURSO;
}

function pintarSemaforoEvidencias() {
  const cuerpo = document.getElementById('semaforo-tbody');
  if (!cuerpo || typeof getEvidencias !== 'function') return;

  const fichaId = fichaDeEvidencias();
  const lista = getEvidencias(fichaId);
  cuerpo.replaceChildren();

  if (!lista.length) {
    const fila = document.createElement('tr');
    const celda = document.createElement('td');
    celda.colSpan = 6;
    celda.style.color = '#999';
    celda.textContent = 'Nadie ha adjuntado evidencia en esta ficha todavía.';
    fila.appendChild(celda);
    cuerpo.appendChild(fila);
    return;
  }

  const ETIQUETA = { rojo: '🔴 Rechazada', amarillo: '🟡 En revisión', verde: '🟢 Aprobada' };

  lista.slice().reverse().forEach(evidencia => {
    const fila = document.createElement('tr');

    [evidencia.nombre, evidencia.descripcion || '—',
      new Date(evidencia.fecha).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })].forEach(valor => {
      const celda = document.createElement('td');
      celda.textContent = valor;
      fila.appendChild(celda);
    });

    const celdaSemaforo = document.createElement('td');
    const sello = document.createElement('span');
    sello.className = 'badge status-badge ' +
      (evidencia.semaforo === 'verde' ? 'status-active' : evidencia.semaforo === 'rojo' ? 'status-inactive' : 'status-closed');
    sello.textContent = ETIQUETA[evidencia.semaforo] || evidencia.semaforo;
    celdaSemaforo.appendChild(sello);
    fila.appendChild(celdaSemaforo);

    const celdaMotivo = document.createElement('td');
    celdaMotivo.textContent = evidencia.motivo || '—';
    fila.appendChild(celdaMotivo);

    const celdaAccion = document.createElement('td');
    [['🔴', 'rojo'], ['🟡', 'amarillo'], ['🟢', 'verde']].forEach(([icono, color]) => {
      const boton = document.createElement('button');
      boton.type = 'button';
      boton.className = 'btn btn-sm btn-table';
      boton.textContent = icono;
      boton.title = ETIQUETA[color];
      boton.addEventListener('click', () => {
        const motivo = color === 'rojo' ? (prompt('Motivo del rechazo (opcional):') || '') : evidencia.motivo;
        fijarSemaforo(fichaId, evidencia.id, color, motivo);
        pintarSemaforoEvidencias();
      });
      celdaAccion.appendChild(boton);
    });
    fila.appendChild(celdaAccion);

    cuerpo.appendChild(fila);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('semaforo-tbody')) pintarSemaforoEvidencias();
});
