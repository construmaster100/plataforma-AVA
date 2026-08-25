/* ══════════════════════════════════════════
   SGMA-ADSO — Sesiones de formación programadas

   Una sesión es lo que el instructor arma con antelación
   (fecha, hora, ambiente, RA, competencia, lista de chequeo)
   y luego «inicia» el día de la clase. Solo puede haber una
   sesión «En curso» por ficha a la vez.

   Depende de:
     · ficha.js → leerAlmacen, guardarAlmacen
══════════════════════════════════════════ */

const CLAVE_SESIONES = 'sgma_sesiones';

function getSesiones(fichaId) {
  const todas = leerAlmacen(CLAVE_SESIONES, {});
  return Array.isArray(todas[fichaId]) ? todas[fichaId] : [];
}

function guardarSesiones(fichaId, lista) {
  const todas = leerAlmacen(CLAVE_SESIONES, {});
  todas[fichaId] = lista;
  return guardarAlmacen(CLAVE_SESIONES, todas);
}

function buscarSesion(fichaId, idSesion) {
  return getSesiones(fichaId).find(s => s.id === idSesion) || null;
}

function programarSesion(fichaId, datos) {
  const lista = getSesiones(fichaId);
  const nueva = {
    id: 'ses-' + Date.now().toString(36),
    fecha: (datos.fecha || '').trim(),
    hora: (datos.hora || '').trim(),
    ambiente: (datos.ambiente || '').trim(),
    ra: (datos.ra || '').trim(),
    competencia: (datos.competencia || '').trim(),
    checklist: Array.isArray(datos.checklist)
      ? datos.checklist.map(item => ({ id: item.id || ('chk-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)), texto: item.texto || '', hecho: false }))
      : [],
    guiaId: (datos.guiaId || '').trim(),
    equipos: (datos.equipos || '').trim(),
    juicioDefecto: datos.juicioDefecto || 'Pendiente',
    estado: 'Programada',
    iniciada: null,
    aula: '',
    conexion: ''
  };
  lista.push(nueva);
  guardarSesiones(fichaId, lista);
  return nueva;
}

function sesionActiva(fichaId) {
  return getSesiones(fichaId).find(s => s.estado === 'En curso') || null;
}

function iniciarSesion(fichaId, idSesion, datosInicio) {
  const lista = getSesiones(fichaId);
  const sesion = lista.find(s => s.id === idSesion);
  if (!sesion) return null;

  sesion.estado = 'En curso';
  sesion.iniciada = new Date().toISOString();
  sesion.aula = (datosInicio && datosInicio.aula) || sesion.ambiente;
  sesion.conexion = (datosInicio && datosInicio.conexion) || '';

  guardarSesiones(fichaId, lista);
  return sesion;
}

function cerrarSesion(fichaId, idSesion) {
  const lista = getSesiones(fichaId);
  const sesion = lista.find(s => s.id === idSesion);
  if (!sesion) return null;

  sesion.estado = 'Cerrada';
  guardarSesiones(fichaId, lista);
  return sesion;
}

function asignarGuiaSesion(fichaId, idSesion, guiaId) {
  const lista = getSesiones(fichaId);
  const sesion = lista.find(s => s.id === idSesion);
  if (!sesion) return false;
  sesion.guiaId = guiaId || '';
  guardarSesiones(fichaId, lista);
  return true;
}

/* ── Solicitud de ingreso del aprendiz y aceptación del instructor ──
   La sesión «En curso» de la ficha es de toda la clase; aquí, por
   encima, cada aprendiz pide entrar y el instructor acepta. Una vez
   aceptada, la ventana dura exactamente 5 horas — mientras esté
   vigente, autentica la asistencia y da acceso al contenido de esa
   sesión (guía en curso, material de aprendizaje). */
const DURACION_SESION_MS = 5 * 60 * 60 * 1000;

function solicitarIngreso(fichaId, idSesion, aprendizClave, nombre) {
  const lista = getSesiones(fichaId);
  const sesion = lista.find(s => s.id === idSesion);
  if (!sesion) return null;

  if (!Array.isArray(sesion.solicitudes)) sesion.solicitudes = [];
  let solicitud = sesion.solicitudes.find(s => s.clave === aprendizClave);
  if (solicitud && (solicitud.estado === 'Pendiente' || solicitud.estado === 'Aceptada')) return solicitud;

  solicitud = { clave: aprendizClave, nombre: nombre || '', estado: 'Pendiente', solicitada: new Date().toISOString(), horaInicio: null, horaExpira: null };
  sesion.solicitudes = sesion.solicitudes.filter(s => s.clave !== aprendizClave);
  sesion.solicitudes.push(solicitud);
  guardarSesiones(fichaId, lista);
  return solicitud;
}

function aceptarSolicitud(fichaId, idSesion, aprendizClave) {
  const lista = getSesiones(fichaId);
  const sesion = lista.find(s => s.id === idSesion);
  if (!sesion || !Array.isArray(sesion.solicitudes)) return null;

  const solicitud = sesion.solicitudes.find(s => s.clave === aprendizClave);
  if (!solicitud) return null;

  const ahora = Date.now();
  solicitud.estado = 'Aceptada';
  solicitud.horaInicio = new Date(ahora).toISOString();
  solicitud.horaExpira = new Date(ahora + DURACION_SESION_MS).toISOString();
  guardarSesiones(fichaId, lista);

  if (typeof registrarAsistencia === 'function') {
    registrarAsistencia(aprendizClave, solicitud.nombre, 'ingreso', '');
  }
  return solicitud;
}

function solicitudDeAprendiz(fichaId, idSesion, aprendizClave) {
  const sesion = buscarSesion(fichaId, idSesion);
  if (!sesion || !Array.isArray(sesion.solicitudes)) return null;
  return sesion.solicitudes.find(s => s.clave === aprendizClave) || null;
}

function solicitudVigente(fichaId, idSesion, aprendizClave) {
  const solicitud = solicitudDeAprendiz(fichaId, idSesion, aprendizClave);
  if (!solicitud || solicitud.estado !== 'Aceptada' || !solicitud.horaExpira) return false;
  return Date.now() < new Date(solicitud.horaExpira).getTime();
}

function sesionesConSolicitudesPendientes(fichaId) {
  return getSesiones(fichaId)
    .filter(s => Array.isArray(s.solicitudes) && s.solicitudes.some(x => x.estado === 'Pendiente'))
    .map(s => ({ sesion: s, pendientes: s.solicitudes.filter(x => x.estado === 'Pendiente') }));
}

function alternarChecklistSesion(fichaId, idSesion, idItem) {
  const sesion = buscarSesion(fichaId, idSesion);
  if (!sesion) return false;
  const item = sesion.checklist.find(c => c.id === idItem);
  if (!item) return false;
  item.hecho = !item.hecho;
  guardarSesiones(fichaId, getSesiones(fichaId).map(s => s.id === idSesion ? sesion : s));
  return item.hecho;
}
