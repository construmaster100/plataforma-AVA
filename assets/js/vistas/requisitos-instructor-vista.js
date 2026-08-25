/* ══════════════════════════════════════════
   SGMA-ADSO — Vista de requisitos del instructor

   Cuenta, por ítem del catálogo de requisitos.js, cuántos
   aprendices de la ficha ya lo marcaron.

   Depende de:
     · ficha.js               → getFichaInstructor
     · requisitos.js          → REQUISITOS_CATALOGO
     · modulos-formativos.js  → rosterConClave(fichaId)
══════════════════════════════════════════ */

function pintarRequisitosAgregado() {
  const cuerpo = document.getElementById('req-ins-tbody');
  if (!cuerpo) return;

  const roster = rosterConClave(typeof getFichaInstructor === 'function' ? getFichaInstructor() : FICHA_EN_CURSO);
  const todosReq = typeof leerAlmacen === 'function' ? leerAlmacen('sgma_requisitos', {}) : {};

  cuerpo.replaceChildren();
  REQUISITOS_CATALOGO.forEach(req => {
    const marcaron = roster.filter(alumno => (todosReq[alumno.clave] || []).indexOf(req.id) !== -1).length;

    const fila = document.createElement('tr');
    const celdaTexto = document.createElement('td');
    celdaTexto.textContent = req.texto;

    const celdaConteo = document.createElement('td');
    const barra = document.createElement('div');
    barra.className = 'progress-bar';
    const relleno = document.createElement('div');
    const pct = roster.length ? Math.round(marcaron * 100 / roster.length) : 0;
    relleno.className = 'progress-fill' + (pct < 50 ? ' low' : pct < 75 ? ' mid' : '');
    relleno.style.width = pct + '%';
    barra.appendChild(relleno);
    const etiqueta = document.createElement('small');
    etiqueta.textContent = marcaron + ' / ' + roster.length;
    celdaConteo.append(barra, etiqueta);

    fila.append(celdaTexto, celdaConteo);
    cuerpo.appendChild(fila);
  });
}

/* ── Solicitudes de requisitos de la sesión ── */

function fichaReqIns() {
  return typeof getFichaInstructor === 'function' ? getFichaInstructor() : FICHA_EN_CURSO;
}

function pintarSolicitudesRequisitos() {
  const cuerpo = document.getElementById('req-solicitudes-tbody');
  if (!cuerpo || typeof getSolicitudesRequisitos !== 'function') return;

  const fichaId = fichaReqIns();
  const lista = getSolicitudesRequisitos(fichaId);
  cuerpo.replaceChildren();

  if (!lista.length) {
    const fila = document.createElement('tr');
    const celda = document.createElement('td');
    celda.colSpan = 7;
    celda.style.color = '#999';
    celda.textContent = 'Nadie ha solicitado requisitos para esta ficha todavía.';
    fila.appendChild(celda);
    cuerpo.appendChild(fila);
    return;
  }

  lista.slice().reverse().forEach(solicitud => {
    const fila = document.createElement('tr');
    [solicitud.nombre, solicitud.hora || '—', solicitud.lugar || '—', solicitud.materiales || '—', solicitud.equipos || '—'].forEach(valor => {
      const celda = document.createElement('td');
      celda.textContent = valor;
      fila.appendChild(celda);
    });

    const celdaEstado = document.createElement('td');
    const sello = document.createElement('span');
    sello.className = 'badge status-badge ' +
      (solicitud.estado === 'Atendida' ? 'status-active' : solicitud.estado === 'Rechazada' ? 'status-inactive' : 'status-closed');
    sello.textContent = solicitud.estado;
    celdaEstado.appendChild(sello);
    fila.appendChild(celdaEstado);

    const celdaAccion = document.createElement('td');
    if (solicitud.estado === 'Pendiente') {
      [['Atender', 'Atendida'], ['Rechazar', 'Rechazada']].forEach(([etiqueta, estado]) => {
        const boton = document.createElement('button');
        boton.type = 'button';
        boton.className = 'btn btn-sm btn-table';
        boton.textContent = etiqueta;
        boton.addEventListener('click', () => {
          atenderSolicitud(fichaId, solicitud.id, estado);
          pintarSolicitudesRequisitos();
        });
        celdaAccion.appendChild(boton);
      });
    } else {
      celdaAccion.textContent = '—';
    }
    fila.appendChild(celdaAccion);

    cuerpo.appendChild(fila);
  });
}

/* ── Solicitudes de equipo SENNOVA ── */

function pintarSolicitudesSennova() {
  const cuerpo = document.getElementById('req-sennova-tbody');
  if (!cuerpo || typeof getSolicitudesSennova !== 'function') return;

  const lista = getSolicitudesSennova();
  cuerpo.replaceChildren();

  if (!lista.length) {
    const fila = document.createElement('tr');
    const celda = document.createElement('td');
    celda.colSpan = 7;
    celda.style.color = '#999';
    celda.textContent = 'No hay solicitudes de equipo SENNOVA todavía.';
    fila.appendChild(celda);
    cuerpo.appendChild(fila);
    return;
  }

  lista.slice().reverse().forEach(solicitud => {
    const fila = document.createElement('tr');
    [solicitud.nombre, solicitud.ambiente || '—', solicitud.equipo || '—', solicitud.motivo || '—', solicitud.fecha || '—'].forEach(valor => {
      const celda = document.createElement('td');
      celda.textContent = valor;
      fila.appendChild(celda);
    });

    const celdaEstado = document.createElement('td');
    const sello = document.createElement('span');
    sello.className = 'badge status-badge ' +
      (solicitud.estado === 'Atendida' ? 'status-active' : solicitud.estado === 'Rechazada' ? 'status-inactive' : 'status-closed');
    sello.textContent = solicitud.estado;
    celdaEstado.appendChild(sello);
    fila.appendChild(celdaEstado);

    const celdaAccion = document.createElement('td');
    if (solicitud.estado === 'Pendiente') {
      [['Atender', 'Atendida'], ['Rechazar', 'Rechazada']].forEach(([etiqueta, estado]) => {
        const boton = document.createElement('button');
        boton.type = 'button';
        boton.className = 'btn btn-sm btn-table';
        boton.textContent = etiqueta;
        boton.addEventListener('click', () => {
          atenderSolicitudSennova(solicitud.id, estado);
          pintarSolicitudesSennova();
        });
        celdaAccion.appendChild(boton);
      });
    } else {
      celdaAccion.textContent = '—';
    }
    fila.appendChild(celdaAccion);

    cuerpo.appendChild(fila);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  if (typeof REQUISITOS_CATALOGO !== 'undefined' && typeof rosterConClave === 'function') {
    pintarRequisitosAgregado();
  }
  pintarSolicitudesRequisitos();
  pintarSolicitudesSennova();
});

window.addEventListener('storage', evento => {
  if (evento.key === 'sgma_requisitos') pintarRequisitosAgregado();
  if (evento.key === 'sgma_solicitudes_requisitos') pintarSolicitudesRequisitos();
  if (evento.key === 'sgma_solicitudes_sennova') pintarSolicitudesSennova();
});
