/* ══════════════════════════════════════════
   SGMA-ADSO — Vista de requisitos para la formación

   Pinta la casilla real de sec-requisitos (1.5) a partir del
   catálogo estático de requisitos.js.

   Depende de:
     · embebidos-catalogo.js → identidadActual()
     · requisitos.js         → REQUISITOS_CATALOGO, getRequisitosMarcados,
                                marcarRequisito, desmarcarRequisito
══════════════════════════════════════════ */

function claveDeRequisitos() {
  return typeof identidadActual === 'function' ? identidadActual().clave : 'anonimo';
}

function pintarRequisitos() {
  const lista = document.getElementById('req-lista');
  if (!lista) return;

  const clave = claveDeRequisitos();
  const marcados = getRequisitosMarcados(clave);

  lista.replaceChildren();
  REQUISITOS_CATALOGO.forEach(req => {
    const item = document.createElement('li');
    item.className = 'form-check mb-2';

    const casilla = document.createElement('input');
    casilla.type = 'checkbox';
    casilla.className = 'form-check-input';
    casilla.id = 'req-' + req.id;
    casilla.checked = marcados.indexOf(req.id) !== -1;

    const etiqueta = document.createElement('label');
    etiqueta.className = 'form-check-label';
    etiqueta.setAttribute('for', casilla.id);
    etiqueta.textContent = req.texto;

    casilla.addEventListener('change', () => {
      if (casilla.checked) marcarRequisito(clave, req.id);
      else desmarcarRequisito(clave, req.id);
    });

    item.append(casilla, etiqueta);
    lista.appendChild(item);
  });
}

/* ── Solicitar lo que necesito para la sesión ── */

function fichaReqAprendiz() {
  return typeof fichaDeQuienJuega === 'function' ? fichaDeQuienJuega() : FICHA_EN_CURSO;
}

function pintarSolicitudesReqAprendiz() {
  const cuerpo = document.getElementById('req-sol-tbody');
  if (!cuerpo || typeof getSolicitudesRequisitos !== 'function') return;

  const clave = claveDeRequisitos();
  const lista = getSolicitudesRequisitos(fichaReqAprendiz()).filter(s => s.clave === clave);
  cuerpo.replaceChildren();

  lista.slice().reverse().forEach(s => {
    const fila = document.createElement('tr');
    [s.hora || '—', s.lugar || '—', s.materiales || '—', s.equipos || '—'].forEach(valor => {
      const celda = document.createElement('td');
      celda.textContent = valor;
      fila.appendChild(celda);
    });
    const celdaEstado = document.createElement('td');
    const sello = document.createElement('span');
    sello.className = 'badge status-badge ' +
      (s.estado === 'Atendida' ? 'status-active' : s.estado === 'Rechazada' ? 'status-inactive' : 'status-closed');
    sello.textContent = s.estado;
    celdaEstado.appendChild(sello);
    fila.appendChild(celdaEstado);
    cuerpo.appendChild(fila);
  });
}

function pintarSolicitudesSennovaAprendiz() {
  const cuerpo = document.getElementById('sennova-sol-tbody');
  if (!cuerpo || typeof getSolicitudesSennova !== 'function') return;

  const clave = claveDeRequisitos();
  const lista = getSolicitudesSennova().filter(s => s.clave === clave);
  cuerpo.replaceChildren();

  lista.slice().reverse().forEach(s => {
    const fila = document.createElement('tr');
    [s.ambiente || '—', s.equipo || '—', s.fecha || '—'].forEach(valor => {
      const celda = document.createElement('td');
      celda.textContent = valor;
      fila.appendChild(celda);
    });
    const celdaEstado = document.createElement('td');
    const sello = document.createElement('span');
    sello.className = 'badge status-badge ' +
      (s.estado === 'Atendida' ? 'status-active' : s.estado === 'Rechazada' ? 'status-inactive' : 'status-closed');
    sello.textContent = s.estado;
    celdaEstado.appendChild(sello);
    fila.appendChild(celdaEstado);
    cuerpo.appendChild(fila);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  if (typeof REQUISITOS_CATALOGO !== 'undefined') pintarRequisitos();

  const clave = claveDeRequisitos();
  const nombre = typeof identidadActual === 'function' ? identidadActual().nombre : '';

  const formReq = document.getElementById('req-solicitud-form');
  if (formReq && typeof crearSolicitudRequisitos === 'function') {
    pintarSolicitudesReqAprendiz();
    formReq.addEventListener('submit', evento => {
      evento.preventDefault();
      crearSolicitudRequisitos(fichaReqAprendiz(), clave, nombre, {
        hora: document.getElementById('req-sol-hora').value,
        lugar: document.getElementById('req-sol-lugar').value,
        materiales: document.getElementById('req-sol-materiales').value,
        equipos: document.getElementById('req-sol-equipos').value
      });
      formReq.reset();
      pintarSolicitudesReqAprendiz();
    });
  }

  const formSennova = document.getElementById('sennova-solicitud-form');
  if (formSennova && typeof solicitarEquipoSennova === 'function') {
    pintarSolicitudesSennovaAprendiz();
    formSennova.addEventListener('submit', evento => {
      evento.preventDefault();
      solicitarEquipoSennova(clave, nombre, {
        ambiente: document.getElementById('sennova-ambiente').value,
        equipo: document.getElementById('sennova-equipo').value,
        fecha: document.getElementById('sennova-fecha').value,
        motivo: document.getElementById('sennova-motivo').value
      });
      formSennova.reset();
      pintarSolicitudesSennovaAprendiz();
    });
  }
});
