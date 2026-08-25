/* ══════════════════════════════════════════
   SGMA-ADSO — Requisitos para la formación

   Catálogo estático de lo que un aprendiz necesita tener listo
   para tomar la formación, con una casilla real por aprendiz
   (no es una lista de solo lectura).

   Depende de:
     · ficha.js → leerAlmacen, guardarAlmacen
══════════════════════════════════════════ */

const CLAVE_REQUISITOS = 'sgma_requisitos';

const REQUISITOS_CATALOGO = [
  { id: 'equipo',      texto: 'Equipo de cómputo con cámara y micrófono funcionando' },
  { id: 'conexion',    texto: 'Conexión a internet estable durante la sesión' },
  { id: 'sofia',       texto: 'Cuenta activa en Sofia Plus' },
  { id: 'correo',      texto: 'Correo institucional habilitado' },
  { id: 'carne',       texto: 'Carné de aprendiz vigente' },
  { id: 'navegador',   texto: 'Navegador actualizado (Chrome, Edge o Firefox)' },
  { id: 'uniforme',    texto: 'Uniforme o distintivo institucional para prácticas presenciales' }
];

function getRequisitosMarcados(clave) {
  const todos = leerAlmacen(CLAVE_REQUISITOS, {});
  return Array.isArray(todos[clave]) ? todos[clave] : [];
}

function marcarRequisito(clave, id) {
  const todos = leerAlmacen(CLAVE_REQUISITOS, {});
  const mios = Array.isArray(todos[clave]) ? todos[clave] : [];
  if (mios.indexOf(id) === -1) mios.push(id);
  todos[clave] = mios;
  return guardarAlmacen(CLAVE_REQUISITOS, todos);
}

function desmarcarRequisito(clave, id) {
  const todos = leerAlmacen(CLAVE_REQUISITOS, {});
  const mios = Array.isArray(todos[clave]) ? todos[clave] : [];
  const puesto = mios.indexOf(id);
  if (puesto === -1) return false;
  mios.splice(puesto, 1);
  todos[clave] = mios;
  return guardarAlmacen(CLAVE_REQUISITOS, todos);
}

/* ── Solicitud de requisitos de la sesión ──
   Distinto del checklist de arriba: aquí el aprendiz pide, para la
   sesión, hora/lugar/materiales/equipos concretos, y el instructor
   la atiende. Guía en curso se enlaza por el id de sesión. */
const CLAVE_SOLICITUDES_REQ = 'sgma_solicitudes_requisitos';

function getSolicitudesRequisitos(fichaId) {
  const todas = leerAlmacen(CLAVE_SOLICITUDES_REQ, {});
  return Array.isArray(todas[fichaId]) ? todas[fichaId] : [];
}

function crearSolicitudRequisitos(fichaId, clave, nombre, datos) {
  const todas = leerAlmacen(CLAVE_SOLICITUDES_REQ, {});
  const lista = Array.isArray(todas[fichaId]) ? todas[fichaId] : [];
  const solicitud = {
    id: 'req-' + Date.now().toString(36),
    clave, nombre,
    hora: (datos && datos.hora || '').trim(),
    lugar: (datos && datos.lugar || '').trim(),
    materiales: (datos && datos.materiales || '').trim(),
    equipos: (datos && datos.equipos || '').trim(),
    guiaId: (datos && datos.guiaId || '').trim(),
    estado: 'Pendiente',
    creada: new Date().toISOString()
  };
  lista.push(solicitud);
  todas[fichaId] = lista;
  guardarAlmacen(CLAVE_SOLICITUDES_REQ, todas);
  return solicitud;
}

function atenderSolicitud(fichaId, id, estado) {
  const todas = leerAlmacen(CLAVE_SOLICITUDES_REQ, {});
  const lista = Array.isArray(todas[fichaId]) ? todas[fichaId] : [];
  const solicitud = lista.find(s => s.id === id);
  if (!solicitud) return null;
  solicitud.estado = estado === 'Atendida' || estado === 'Rechazada' ? estado : 'Pendiente';
  todas[fichaId] = lista;
  guardarAlmacen(CLAVE_SOLICITUDES_REQ, todas);
  return solicitud;
}

/* ── Solicitud de equipos SENNOVA ──
   Liga con la vitrina de pages/Sennova/sennova.html (banners,
   ambientes especializados) — hoy sin ninguna función; esto es lo
   que le da un uso real. */
const CLAVE_SOLICITUDES_SENNOVA = 'sgma_solicitudes_sennova';

function getSolicitudesSennova() {
  return leerAlmacen(CLAVE_SOLICITUDES_SENNOVA, []);
}

function solicitarEquipoSennova(clave, nombre, datos) {
  const lista = leerAlmacen(CLAVE_SOLICITUDES_SENNOVA, []);
  const solicitud = {
    id: 'sen-' + Date.now().toString(36),
    clave, nombre,
    ambiente: (datos && datos.ambiente || '').trim(),
    equipo: (datos && datos.equipo || '').trim(),
    motivo: (datos && datos.motivo || '').trim(),
    fecha: (datos && datos.fecha || '').trim(),
    estado: 'Pendiente',
    creada: new Date().toISOString()
  };
  lista.push(solicitud);
  guardarAlmacen(CLAVE_SOLICITUDES_SENNOVA, lista);
  return solicitud;
}

function atenderSolicitudSennova(id, estado) {
  const lista = leerAlmacen(CLAVE_SOLICITUDES_SENNOVA, []);
  const solicitud = lista.find(s => s.id === id);
  if (!solicitud) return null;
  solicitud.estado = estado === 'Atendida' || estado === 'Rechazada' ? estado : 'Pendiente';
  guardarAlmacen(CLAVE_SOLICITUDES_SENNOVA, lista);
  return solicitud;
}
