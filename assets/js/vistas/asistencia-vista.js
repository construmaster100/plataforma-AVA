/* ══════════════════════════════════════════
   SGMA-ADSO — Vista de asistencia del aprendiz

   Pinta tres hojas que comparten el mismo estado (asistencia.js):
     · sec-asistencia         (1.2) — historial completo
     · sec-reportar-ingreso   (2.1) — los tres botones de autorreporte
     · sec-reporte-acumulado  (3.1) — resumen en chips

   Depende de:
     · embebidos-catalogo.js → identidadActual()
     · asistencia.js         → registrarAsistencia, getAsistencias, resumenAsistencia
══════════════════════════════════════════ */

function claveDeAsistencia() {
  return typeof identidadActual === 'function' ? identidadActual().clave : 'anonimo';
}

const ROTULO_TIPO = { ingreso: 'Ingreso', demora: 'Demora', inasistencia: 'Inasistencia' };

/* ── 1.2 Historial ── */

function pintarHistorialAsistencia() {
  const cuerpo = document.getElementById('asis-tbody');
  const resumen = document.getElementById('asis-resumen');
  if (!cuerpo) return;

  const mias = getAsistencias(claveDeAsistencia());
  if (resumen) resumen.textContent = mias.length + (mias.length === 1 ? ' día reportado' : ' días reportados');

  cuerpo.replaceChildren();
  if (!mias.length) {
    const fila = document.createElement('tr');
    const celda = document.createElement('td');
    celda.colSpan = 4;
    celda.style.color = '#999';
    celda.textContent = 'Todavía no has reportado tu asistencia. Hazlo desde «Reportar ingreso».';
    fila.appendChild(celda);
    cuerpo.appendChild(fila);
    return;
  }

  mias.forEach(registro => {
    const fila = document.createElement('tr');

    const celdaFecha = document.createElement('td');
    celdaFecha.textContent = registro.fecha;

    const celdaTipo = document.createElement('td');
    celdaTipo.textContent = ROTULO_TIPO[registro.tipo] || registro.tipo;

    const celdaEstado = document.createElement('td');
    const sello = document.createElement('span');
    sello.className = 'badge status-badge ' +
      (registro.estado === 'Asiste' ? 'status-active'
        : registro.estado === 'No asiste' ? 'status-inactive'
        : 'status-closed');
    sello.textContent = registro.estado;
    celdaEstado.appendChild(sello);

    const celdaMotivo = document.createElement('td');
    celdaMotivo.textContent = registro.motivo || '—';

    fila.append(celdaFecha, celdaTipo, celdaEstado, celdaMotivo);
    cuerpo.appendChild(fila);
  });
}

/* ── 2.1 Reportar ingreso ──
   «Solicitar ingreso» ya no marca asistencia directo: pide entrar a
   la sesión en curso de la ficha, el instructor acepta, y desde ahí
   corren 5 horas de acceso (sesiones.js). Demora e inasistencia
   siguen siendo autorreporte directo. */

function fichaDeAsistenciaAprendiz() {
  return typeof fichaDeQuienJuega === 'function' ? fichaDeQuienJuega() : FICHA_EN_CURSO;
}

function pintarEstadoHoy() {
  const parrafo = document.getElementById('ingreso-estado-hoy');
  if (!parrafo) return;

  const hoy = new Date().toISOString().slice(0, 10);
  const registro = getAsistencias(claveDeAsistencia()).find(r => r.fecha === hoy);

  parrafo.textContent = registro
    ? 'Hoy reportaste: ' + (ROTULO_TIPO[registro.tipo] || registro.tipo) + ' — estado ' + registro.estado + '.'
    : 'Todavía no has reportado nada hoy.';
}

function pintarEstadoSolicitudIngreso() {
  const caja = document.getElementById('ingreso-solicitud-estado');
  const btnIngreso = document.getElementById('btn-ingreso');
  if (!caja || typeof sesionActiva !== 'function') return;

  const fichaId = fichaDeAsistenciaAprendiz();
  const activa = sesionActiva(fichaId);
  const clave = claveDeAsistencia();

  if (!activa) {
    caja.textContent = 'No hay ninguna sesión en curso todavía. Espera a que el instructor la inicie.';
    if (btnIngreso) btnIngreso.disabled = true;
    return;
  }

  const solicitud = typeof solicitudDeAprendiz === 'function' ? solicitudDeAprendiz(fichaId, activa.id, clave) : null;
  if (btnIngreso) btnIngreso.disabled = Boolean(solicitud && (solicitud.estado === 'Pendiente' || solicitudVigente(fichaId, activa.id, clave)));

  if (!solicitud) {
    caja.textContent = 'Hay una sesión en curso — puedes solicitar el ingreso.';
    return;
  }
  if (solicitud.estado === 'Pendiente') {
    caja.textContent = 'Solicitud enviada — esperando que el instructor la acepte.';
    return;
  }
  if (solicitudVigente(fichaId, activa.id, clave)) {
    const vence = new Date(solicitud.horaExpira);
    caja.textContent = 'Ingreso aceptado — vigente hasta las ' + vence.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) + '.';
    return;
  }
  caja.textContent = 'Tu ventana de ingreso ya expiró (duraba 5 horas). Solicita de nuevo si sigue la sesión.';
}

function iniciarReporteAsistencia() {
  const btnIngreso = document.getElementById('btn-ingreso');
  const btnDemora = document.getElementById('btn-demora');
  const btnInasistencia = document.getElementById('btn-inasistencia');
  const btnConfirmar = document.getElementById('btn-confirmar-inasistencia');
  const cajaMotivo = document.getElementById('ingreso-motivo-caja');
  const campoMotivo = document.getElementById('ingreso-motivo');
  if (!btnIngreso) return;

  const reportarYActualizar = (tipo, motivo) => {
    const identidad = typeof identidadActual === 'function' ? identidadActual() : { clave: 'anonimo', nombre: '' };
    registrarAsistencia(identidad.clave, identidad.nombre, tipo, motivo);
    pintarEstadoHoy();
    pintarHistorialAsistencia();
    pintarResumenAsistenciaAcumulado();
    if (typeof pintarAvanceAprendiz === 'function') pintarAvanceAprendiz();
  };

  btnIngreso.addEventListener('click', () => {
    const identidad = typeof identidadActual === 'function' ? identidadActual() : { clave: 'anonimo', nombre: '' };
    const fichaId = fichaDeAsistenciaAprendiz();
    const activa = typeof sesionActiva === 'function' ? sesionActiva(fichaId) : null;
    if (!activa || typeof solicitarIngreso !== 'function') return;
    solicitarIngreso(fichaId, activa.id, identidad.clave, identidad.nombre);
    pintarEstadoSolicitudIngreso();
  });

  btnDemora.addEventListener('click', () => {
    cajaMotivo.hidden = true;
    reportarYActualizar('demora', '');
  });

  btnInasistencia.addEventListener('click', () => {
    cajaMotivo.hidden = false;
    campoMotivo.focus();
  });

  btnConfirmar.addEventListener('click', () => {
    reportarYActualizar('inasistencia', campoMotivo.value);
    campoMotivo.value = '';
    cajaMotivo.hidden = true;
  });
}

/* ── 3.1 Resumen en chips ── */

function pintarResumenAsistenciaAcumulado() {
  const lista = document.getElementById('reporte-asistencia-chips');
  const pie = document.getElementById('reporte-asistencia-pie');
  if (!lista) return;

  const resumen = resumenAsistencia(claveDeAsistencia());
  const chips = [
    { rotulo: 'Asiste', valor: resumen.asiste },
    { rotulo: 'No asiste', valor: resumen.noAsiste },
    { rotulo: 'Tardanza', valor: resumen.tardanza },
    { rotulo: 'Asiste con excusa', valor: resumen.excusa }
  ];

  if (pie) {
    pie.textContent = resumen.total
      ? resumen.total + (resumen.total === 1 ? ' día reportado.' : ' días reportados.')
      : 'Todavía no hay reportes de asistencia.';
  }

  lista.replaceChildren();
  chips.forEach(chip => {
    const item = document.createElement('li');
    item.className = 'avance-parte';

    const cabecera = document.createElement('div');
    cabecera.className = 'avance-parte-cabecera';

    const nombre = document.createElement('span');
    nombre.className = 'avance-parte-rotulo';
    nombre.textContent = chip.rotulo;

    const cifra = document.createElement('span');
    cifra.className = 'avance-parte-cifra';
    cifra.textContent = String(chip.valor);

    cabecera.append(nombre, cifra);
    item.appendChild(cabecera);
    lista.appendChild(item);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  if (typeof registrarAsistencia !== 'function') return;

  pintarHistorialAsistencia();
  pintarEstadoHoy();
  iniciarReporteAsistencia();
  pintarResumenAsistenciaAcumulado();
  pintarEstadoSolicitudIngreso();
});

window.addEventListener('storage', evento => {
  if (evento.key === 'sgma_sesiones') pintarEstadoSolicitudIngreso();
});
