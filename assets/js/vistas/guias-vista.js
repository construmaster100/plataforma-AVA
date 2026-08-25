/* ══════════════════════════════════════════
   SGMA-ADSO — Vista de guías de aprendizaje del aprendiz

   Pinta el estado dinámico sobre la tabla estática de
   sec-guias-gaa (1.3/2.2, misma sección para ambas hojas del
   sidebar) y la hoja «Guía en curso» (2.3), que se apoya en la
   misma tabla para sacar título y enlace de la guía vigente —
   no hay catálogo de guías duplicado en JS.

   Depende de:
     · embebidos-catalogo.js  → identidadActual()
     · guias-aprendizaje.js   → marcarGuiaAbierta, marcarGuiaEntregada,
                                 desmarcarGuiaEntregada, estadoDeGuia, guiaActual
     · sesiones.js            → sesionActiva, solicitudVigente (bloquea la guía
                                 en curso si no hay una sesión aceptada vigente)
     · plan-formativo.js      → fichaDeQuienJuega
══════════════════════════════════════════ */

function claveDeGuias() {
  return typeof identidadActual === 'function' ? identidadActual().clave : 'anonimo';
}

function filaDeGuia(codigo) {
  return document.querySelector('#gaa-tbody tr[data-gaa="' + codigo + '"]');
}

function tituloDeGuia(codigo) {
  const fila = filaDeGuia(codigo);
  const enlace = fila && fila.querySelector('.gaa-nombre');
  return enlace ? enlace.textContent.trim() : 'Guía ' + codigo;
}

function hrefDeGuia(codigo) {
  const fila = filaDeGuia(codigo);
  const enlace = fila && fila.querySelector('.gaa-nombre');
  return enlace ? enlace.getAttribute('href') : '';
}

/* ── 1.3 / 2.2 Tabla de guías con estado ── */

function pintarEstadoGuias() {
  const filas = document.querySelectorAll('#gaa-tbody tr[data-gaa]');
  if (!filas.length) return;

  const clave = claveDeGuias();

  filas.forEach(fila => {
    const codigo = fila.getAttribute('data-gaa');
    const celda = fila.querySelector('.gaa-estado');
    if (!celda) return;

    const estado = estadoDeGuia(clave, codigo);

    celda.replaceChildren();

    const sello = document.createElement('span');
    sello.className = 'badge status-badge ' +
      (estado === 'Desarrollada' ? 'status-done' : estado === 'En curso' ? 'status-active' : 'status-closed');
    sello.textContent = estado;
    celda.appendChild(sello);

    const boton = document.createElement('button');
    boton.type = 'button';
    boton.className = 'btn btn-sm btn-table';
    boton.textContent = estado === 'Desarrollada' ? 'Desmarcar' : 'Marcar entregada';
    boton.addEventListener('click', () => {
      if (estado === 'Desarrollada') desmarcarGuiaEntregada(clave, codigo);
      else marcarGuiaEntregada(clave, codigo);
      pintarEstadoGuias();
      pintarGuiaEnCurso();
    });
    celda.appendChild(boton);
  });
}

function iniciarAperturaDeGuias() {
  document.querySelectorAll('#gaa-tbody .gaa-nombre').forEach(enlace => {
    enlace.addEventListener('click', () => {
      const fila = enlace.closest('tr[data-gaa]');
      const codigo = fila && fila.getAttribute('data-gaa');
      if (!codigo) return;
      marcarGuiaAbierta(claveDeGuias(), codigo);
      pintarEstadoGuias();
      pintarGuiaEnCurso();
    });
  });
}

/* ── 2.3 Guía en curso ── */

function sesionVigenteAprendiz() {
  if (typeof sesionActiva !== 'function' || typeof solicitudVigente !== 'function') return true; // sin sesiones.js no hay nada que bloquear
  const fichaId = typeof fichaDeQuienJuega === 'function' ? fichaDeQuienJuega() : FICHA_EN_CURSO;
  const activa = sesionActiva(fichaId);
  if (!activa) return false;
  const clave = typeof identidadActual === 'function' ? identidadActual().clave : '';
  return solicitudVigente(fichaId, activa.id, clave);
}

function pintarAvisoMaterialSinSesion() {
  const aviso = document.getElementById('material-gate-aviso');
  if (!aviso) return;
  aviso.hidden = sesionVigenteAprendiz();
}

function pintarGuiaEnCurso() {
  const caja = document.getElementById('guia-actual-caja');
  if (!caja) return;

  caja.replaceChildren();
  if (!sesionVigenteAprendiz()) {
    const sinSesion = document.createElement('p');
    sinSesion.className = 'bloque-nota';
    sinSesion.textContent = 'Necesitas una sesión activa aceptada por el instructor para ver la guía en curso (2.1 Reportar ingreso).';
    caja.appendChild(sinSesion);
    return;
  }

  const codigo = guiaActual(claveDeGuias());

  if (!codigo) {
    const vacio = document.createElement('p');
    vacio.className = 'bloque-nota';
    vacio.textContent = 'Todavía no tienes ninguna guía en curso. Ábrela desde «Guías de aprendizaje».';
    caja.appendChild(vacio);
    return;
  }

  const tarjeta = document.createElement('div');
  tarjeta.className = 'card notif-card';

  const titulo = document.createElement('h3');
  titulo.textContent = tituloDeGuia(codigo);

  const meta = document.createElement('p');
  meta.className = 'notif-meta';
  meta.textContent = 'Código ' + codigo + ' · en curso';

  const acciones = document.createElement('div');
  acciones.className = 'sec-actions';

  const href = hrefDeGuia(codigo);
  if (href) {
    const abrir = document.createElement('a');
    abrir.href = href;
    abrir.target = '_blank';
    abrir.rel = 'noopener';
    abrir.className = 'btn btn-action btn-primary';
    abrir.textContent = 'Abrir guía (PDF)';
    abrir.addEventListener('click', () => {
      marcarGuiaAbierta(claveDeGuias(), codigo);
    });
    acciones.appendChild(abrir);
  }

  const entregar = document.createElement('button');
  entregar.type = 'button';
  entregar.className = 'btn btn-action btn-secondary';
  entregar.textContent = 'Marcar como entregada';
  entregar.addEventListener('click', () => {
    marcarGuiaEntregada(claveDeGuias(), codigo);
    pintarEstadoGuias();
    pintarGuiaEnCurso();
  });
  acciones.appendChild(entregar);

  tarjeta.append(titulo, meta, acciones);
  caja.appendChild(tarjeta);
}

document.addEventListener('DOMContentLoaded', () => {
  if (typeof estadoDeGuia !== 'function') return;

  pintarEstadoGuias();
  iniciarAperturaDeGuias();
  pintarGuiaEnCurso();
  pintarAvisoMaterialSinSesion();
});

/* La aceptación de la solicitud la hace el instructor en otra pestaña/
   panel — sgma_sesiones cambia allá y esto se refresca aquí. */
window.addEventListener('storage', evento => {
  if (evento.key === 'sgma_sesiones') {
    pintarGuiaEnCurso();
    pintarAvisoMaterialSinSesion();
  }
});
