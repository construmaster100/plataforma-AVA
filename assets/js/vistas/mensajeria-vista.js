/* ══════════════════════════════════════════
   SGMA-ADSO — Pintado del correo y del chat

   · La bandeja va en el main: una barra por correo.
   · El chat va flotante abajo a la derecha.
   · Cada mensaje ajeno asoma como notificación sobre el chat.

   Depende de:
     · ficha.js      → leerAlmacen, guardarAlmacen
     · mensajeria.js → getCorreos(), getChat(), yoSoy()…
══════════════════════════════════════════ */

/* ── Bandeja de correo ── */

function pintarBandejaCorreo() {
  const caja = document.getElementById('correo-lista');
  if (!caja) return;

  const yo = yoSoy();
  const filtro = document.getElementById('correo-filtro');
  const rolPedido = filtro ? filtro.value : '';

  const correos = correosDeMiRol()
    .filter(c => !rolPedido || c.deRol === rolPedido || c.paraRol === rolPedido)
    .sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)));

  caja.replaceChildren();

  if (!correos.length) {
    const vacio = document.createElement('p');
    vacio.className = 'bloque-nota';
    vacio.textContent = 'No hay correos para tu rol todavía.';
    caja.appendChild(vacio);
  }

  correos.forEach(correo => {
    const mio = correo.deRol === yo.rol;

    const barra = document.createElement('article');
    barra.className = 'correo-barra' + (correo.leido ? '' : ' es-nuevo');

    const avatar = document.createElement('span');
    avatar.className = 'correo-avatar ' + claseDeRol(correo.deRol);
    avatar.textContent = inicialesDe(correo.de);

    const cuerpo = document.createElement('span');
    cuerpo.className = 'correo-cuerpo';

    const cabecera = document.createElement('span');
    cabecera.className = 'correo-cabecera';

    const quien = document.createElement('span');
    quien.className = 'correo-quien';
    quien.textContent = mio ? 'Tú → ' + correo.para : correo.de;

    const sello = document.createElement('span');
    sello.className = 'correo-rol ' + claseDeRol(correo.deRol);
    sello.textContent = mio ? correo.paraRol : correo.deRol;

    cabecera.append(quien, sello);

    const asunto = document.createElement('span');
    asunto.className = 'correo-asunto';
    asunto.textContent = correo.asunto;

    const extracto = document.createElement('span');
    extracto.className = 'correo-extracto';
    extracto.textContent = correo.cuerpo;

    cuerpo.append(cabecera, asunto, extracto);

    const fecha = document.createElement('span');
    fecha.className = 'correo-fecha';
    fecha.textContent = fechaCorreo(correo.fecha);

    barra.append(avatar, cuerpo, fecha);

    barra.addEventListener('click', () => {
      barra.classList.toggle('es-abierto');
      if (!correo.leido) {
        marcarCorreoLeido(correo.id);
        barra.classList.remove('es-nuevo');
        pintarConteoCorreo();
      }
    });

    caja.appendChild(barra);
  });

  pintarConteoCorreo();
}

function pintarConteoCorreo() {
  const yo = yoSoy();
  const sinLeer = correosDeMiRol().filter(c => !c.leido && c.deRol !== yo.rol).length;

  const conteo = document.getElementById('correo-conteo');
  if (conteo) {
    conteo.textContent = sinLeer
      ? sinLeer + (sinLeer === 1 ? ' sin leer' : ' sin leer')
      : 'Todo leído';
  }

  document.querySelectorAll('[data-correo-badge]').forEach(sello => {
    sello.textContent = String(sinLeer);
    sello.hidden = sinLeer === 0;
  });
}

function montarFormularioCorreo() {
  const form = document.getElementById('correo-form');
  if (!form) return;

  const selRol  = document.getElementById('correo-para');
  const campoAs = document.getElementById('correo-asunto');
  const campoTx = document.getElementById('correo-texto');
  const aviso   = document.getElementById('correo-aviso');

  if (selRol) {
    selRol.replaceChildren();
    ROLES_MENSAJERIA.forEach(rol => {
      const opcion = document.createElement('option');
      opcion.value = rol;
      opcion.textContent = rol;
      selRol.appendChild(opcion);
    });
  }

  form.addEventListener('submit', evento => {
    evento.preventDefault();

    const asunto = campoAs ? campoAs.value.trim() : '';
    const texto  = campoTx ? campoTx.value.trim() : '';

    if (asunto.length < 3) {
      if (aviso) aviso.textContent = 'Escribe un asunto de al menos 3 letras.';
      if (campoAs) campoAs.focus();
      return;
    }
    if (!texto) {
      if (aviso) aviso.textContent = 'El correo no puede ir vacío.';
      if (campoTx) campoTx.focus();
      return;
    }

    const destino = selRol ? selRol.value : 'Instructora';
    enviarCorreo(destino, destino, asunto, texto);

    if (campoAs) campoAs.value = '';
    if (campoTx) campoTx.value = '';
    if (aviso) aviso.textContent = 'Correo enviado a ' + destino + '.';

    pintarBandejaCorreo();
  });
}

/* ── Chat flotante ── */

let chatVistoHasta = 0;

function pintarHiloChat() {
  const hilo = document.getElementById('chat-flotante-hilo');
  if (!hilo) return;

  const yo = yoSoy();
  const mensajes = getChat();
  hilo.replaceChildren();

  if (!mensajes.length) {
    const vacio = document.createElement('p');
    vacio.className = 'chatf-vacio';
    vacio.textContent = 'Todavía no hay mensajes. Escribe el primero.';
    hilo.appendChild(vacio);
  }

  mensajes.forEach(mensaje => {
    const mio = mensaje.de === yo.nombre && mensaje.deRol === yo.rol;

    const burbuja = document.createElement('div');
    burbuja.className = 'chatf-burbuja ' + (mio ? 'es-mio' : 'es-ajeno');

    if (!mio) {
      const quien = document.createElement('span');
      quien.className = 'chatf-quien ' + claseDeRol(mensaje.deRol);
      quien.textContent = mensaje.de;
      burbuja.appendChild(quien);
    }

    const texto = document.createElement('p');
    texto.textContent = mensaje.texto;

    const hora = document.createElement('span');
    hora.className = 'chatf-hora';
    hora.textContent = horaCorta(mensaje.fecha);

    burbuja.append(texto, hora);
    hilo.appendChild(burbuja);
  });

  hilo.scrollTop = hilo.scrollHeight;
  chatVistoHasta = mensajes.length;
  pintarConteoChat(0);
}

function pintarConteoChat(cuantos) {
  const sello = document.getElementById('chat-flotante-sello');
  if (!sello) return;
  sello.textContent = String(cuantos);
  sello.hidden = !cuantos;
}

/* Aviso sobre el chat: «Mensaje de Aprendiz 1» */
function asomarNotificacion(mensaje) {
  const pila = document.getElementById('chat-flotante-avisos');
  if (!pila) return;

  const aviso = document.createElement('button');
  aviso.type = 'button';
  aviso.className = 'chatf-aviso ' + claseDeRol(mensaje.deRol);

  const titulo = document.createElement('span');
  titulo.className = 'chatf-aviso-titulo';
  titulo.textContent = 'Mensaje de ' + mensaje.de;

  const extracto = document.createElement('span');
  extracto.className = 'chatf-aviso-texto';
  extracto.textContent = mensaje.texto;

  aviso.append(titulo, extracto);
  aviso.addEventListener('click', () => {
    abrirChat(true);
    aviso.remove();
  });

  pila.appendChild(aviso);
  setTimeout(() => aviso.remove(), 6000);
}

function abrirChat(abierto) {
  const panel = document.getElementById('chat-flotante');
  if (!panel) return;
  panel.classList.toggle('es-abierto', abierto);
  if (abierto) {
    pintarHiloChat();
    const campo = document.getElementById('chat-flotante-texto');
    if (campo) campo.focus();
  }
}

function montarChatFlotante() {
  const panel = document.getElementById('chat-flotante');
  if (!panel) return;

  const boton = document.getElementById('chat-flotante-boton');
  if (boton) {
    boton.addEventListener('click', () => {
      abrirChat(!panel.classList.contains('es-abierto'));
    });
  }

  const cerrar = document.getElementById('chat-flotante-cerrar');
  if (cerrar) cerrar.addEventListener('click', () => abrirChat(false));

  const form = document.getElementById('chat-flotante-form');
  if (form) {
    form.addEventListener('submit', evento => {
      evento.preventDefault();
      const campo = document.getElementById('chat-flotante-texto');
      if (!campo || !enviarMensajeChat(campo.value)) return;
      campo.value = '';
      pintarHiloChat();
    });
  }

  const quien = document.getElementById('chat-flotante-yo');
  if (quien) {
    const yo = yoSoy();
    quien.textContent = yo.nombre + ' · ' + yo.rol;
  }

  chatVistoHasta = getChat().length;
}

/* ── Arranque y sincronización entre pestañas ── */

document.addEventListener('DOMContentLoaded', () => {
  montarFormularioCorreo();
  pintarBandejaCorreo();
  montarChatFlotante();

  const filtro = document.getElementById('correo-filtro');
  if (filtro) filtro.addEventListener('change', pintarBandejaCorreo);
});

/* Lo que escriban en otra pestaña del mismo navegador entra aquí */
window.addEventListener('storage', evento => {
  if (evento.key === CLAVE_CORREOS) {
    pintarBandejaCorreo();
    return;
  }
  if (evento.key !== CLAVE_CHAT) return;

  const yo = yoSoy();
  const mensajes = getChat();
  const nuevos = mensajes.slice(chatVistoHasta).filter(m => m.deRol !== yo.rol || m.de !== yo.nombre);

  const panel = document.getElementById('chat-flotante');
  const abierto = panel && panel.classList.contains('es-abierto');

  if (abierto) {
    pintarHiloChat();
  } else {
    chatVistoHasta = mensajes.length;
    if (nuevos.length) pintarConteoChat(nuevos.length);
  }

  nuevos.forEach(asomarNotificacion);
});
