/* ══════════════════════════════════════════
   SGMA-ADSO — Correo y chat entre roles

   Dos piezas que comparten el mismo almacén:

     · Bandeja de correo — sección dentro del main, con los
       correos cruzados entre aprendices, instructora y
       administrador, uno por barra.

     · Chat flotante — abajo a la derecha, siempre a mano.
       Cada mensaje ajeno entra además como notificación
       («Mensaje de Aprendiz 1», «Mensaje de la instructora»).

   Sobre el «tiempo real»: ya no depende solo del navegador. Lo que
   escribes se guarda primero en localStorage (por eso entre pestañas
   del mismo navegador sigue siendo instantáneo, vía el evento
   «storage»), y en paralelo se manda a POST /api/mensajes
   (server/routes/mensajes.js), que sí persiste entre equipos
   distintos. Si el correo real del destinatario se conoce (hoy solo
   para aprendices, vía DIRECTORIO — ver assets/js/estado/aprendices.js,
   cargado solo en instructor.html), el servidor además dispara una
   notificación por email real. Es best-effort: si el servidor no
   responde, el mensaje ya quedó guardado en localStorage igual.

   Depende de:
     · ficha.js → leerAlmacen, guardarAlmacen
     · aprendices.js → DIRECTORIO (opcional, solo en instructor.html)
══════════════════════════════════════════ */

const CLAVE_CORREOS = 'sgma_correos';
const CLAVE_CHAT = 'sgma_chat';

const ROLES_MENSAJERIA = ['Aprendiz', 'Instructora', 'Administrador'];

/* Quién tiene esta página abierta. El rol lo declara el
   <body data-rol="…">; el nombre del aprendiz viaja en la URL. */
function yoSoy() {
  const rol = (document.body && document.body.dataset.rol) || 'Usuario';

  if (rol === 'Aprendiz') {
    const datos = new URLSearchParams(window.location.search);
    return { rol: rol, nombre: datos.get('u') || 'Aprendiz' };
  }
  if (rol === 'Instructora') return { rol: rol, nombre: 'Zulma Salas' };
  if (rol === 'Administrador') return { rol: rol, nombre: 'Administrador' };
  return { rol: rol, nombre: rol };
}

/* El correo real de un aprendiz por su nombre, si el directorio está
   cargado (solo instructor.html — ver el aviso de datos personales en
   aprendices.js). Sin eso, no hay forma de saber a quién notificarle. */
function correoDeAprendizPorNombre(nombreCompleto) {
  if (typeof DIRECTORIO === 'undefined' || !nombreCompleto) return '';
  const encontrado = DIRECTORIO.aprendices.find(a =>
    (a.nombres + ' ' + a.apellidos) === nombreCompleto ||
    (a.apellidos + ', ' + a.nombres) === nombreCompleto
  );
  return encontrado ? (encontrado.correoInstitucional || encontrado.correoPersonal || '') : '';
}

/* Sincroniza con el servidor en paralelo a localStorage — nunca
   bloquea ni revienta la bandeja si el backend no responde. */
function sincronizarMensajeConServidor(mensaje, correoDestino) {
  fetch('/api/mensajes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      de: mensaje.de, deRol: mensaje.deRol,
      para: mensaje.para, paraRol: mensaje.paraRol,
      asunto: mensaje.asunto, cuerpo: mensaje.cuerpo,
      correoDestino: correoDestino || undefined
    })
  }).catch(() => {});
}

/* ── Correos ── */

const CORREOS_INICIALES = [
  { id: 'c1', de: 'Zulma Salas', deRol: 'Instructora',
    para: 'Ficha 3293836', paraRol: 'Aprendiz',
    asunto: 'Guía de aprendizaje 1 disponible',
    cuerpo: 'Ya pueden descargar la guía del módulo de Python. La revisamos en la sesión del jueves.',
    fecha: '2026-08-10T09:15:00.000Z', leido: false },
  { id: 'c2', de: 'Administrador', deRol: 'Administrador',
    para: 'Zulma Salas', paraRol: 'Instructora',
    asunto: 'Matrícula de la ficha 2 actualizada',
    cuerpo: 'Se habilitaron los treinta y cinco cupos de la ficha 2 para práctica libre.',
    fecha: '2026-08-11T14:02:00.000Z', leido: false },
  { id: 'c3', de: 'Aprendiz 1', deRol: 'Aprendiz',
    para: 'Zulma Salas', paraRol: 'Instructora',
    asunto: 'Duda con el ejercicio 2',
    cuerpo: 'No me queda claro cómo recorrer la lista con el ciclo for. ¿Puede revisarlo en clase?',
    fecha: '2026-08-12T18:40:00.000Z', leido: false }
];

function getCorreos() {
  const guardados = leerAlmacen(CLAVE_CORREOS, null);
  return Array.isArray(guardados) ? guardados : CORREOS_INICIALES.slice();
}

function setCorreos(lista) {
  return guardarAlmacen(CLAVE_CORREOS, lista);
}

function enviarCorreo(paraRol, para, asunto, cuerpo) {
  const yo = yoSoy();
  const lista = getCorreos();

  const nuevo = {
    id: 'c' + Date.now(),
    de: yo.nombre, deRol: yo.rol,
    para: para || paraRol, paraRol: paraRol,
    asunto: asunto, cuerpo: cuerpo,
    fecha: new Date().toISOString(), leido: false
  };

  lista.push(nuevo);
  setCorreos(lista);

  const correoDestino = paraRol === 'Aprendiz' ? correoDeAprendizPorNombre(para) : '';
  sincronizarMensajeConServidor(nuevo, correoDestino);

  return nuevo;
}

function marcarCorreoLeido(id) {
  const lista = getCorreos();
  const correo = lista.find(c => c.id === id);
  if (!correo) return false;
  correo.leido = true;
  return setCorreos(lista);
}

/* Los que me tocan: los que van a mi rol o los que envié */
function correosDeMiRol() {
  const yo = yoSoy();
  return getCorreos().filter(c => c.paraRol === yo.rol || c.deRol === yo.rol);
}

/* ── Chat ── */

function getChat() {
  const guardado = leerAlmacen(CLAVE_CHAT, null);
  return Array.isArray(guardado) ? guardado : [];
}

/* Mensajes con notificación: cortos a propósito, no reemplazan el correo */
const LIMITE_MENSAJE_CHAT = 50;

function limiteAlcanzado(texto) {
  return String(texto || '').length >= LIMITE_MENSAJE_CHAT;
}

function enviarMensajeChat(texto) {
  const limpio = String(texto || '').trim();
  if (!limpio) return null;

  const yo = yoSoy();
  const lista = getChat();

  lista.push({
    id: 'm' + Date.now() + Math.random().toString(36).slice(2, 6),
    de: yo.nombre, deRol: yo.rol,
    texto: limpio.slice(0, LIMITE_MENSAJE_CHAT),
    fecha: new Date().toISOString()
  });

  guardarAlmacen(CLAVE_CHAT, lista.slice(-80));   // el hilo no crece sin fin
  return lista[lista.length - 1];
}

/* ── Utilidades ── */

function horaCorta(iso) {
  const momento = new Date(iso);
  if (isNaN(momento)) return '';
  return momento.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
}

function fechaCorreo(iso) {
  const momento = new Date(iso);
  if (isNaN(momento)) return '';
  const hoy = new Date();
  const mismoDia = momento.toDateString() === hoy.toDateString();
  return mismoDia
    ? horaCorta(iso)
    : momento.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
}

function inicialesDe(nombre) {
  return String(nombre || '?')
    .split(/\s+/)
    .slice(0, 2)
    .map(p => p.charAt(0).toUpperCase())
    .join('');
}

function claseDeRol(rol) {
  if (rol === 'Instructora') return 'es-instructora';
  if (rol === 'Administrador') return 'es-administrador';
  return 'es-aprendiz';
}
