/* ══════════════════════════════════════════
   SGMA-ADSO — Vista de sesiones del instructor

   Pinta tres hojas sobre el mismo estado (sesiones.js):
     · sec-programar-sesion (1.7) — crear sesiones
     · sec-iniciar-sesion   (2.1) — iniciar la próxima o ver la activa
     · sec-guia-sesion      (2.4) — la guía designada para la sesión activa

   La ficha es la que el instructor tiene elegida en el selector
   numérico de la cabecera (getFichaInstructor), no el curso
   ADSO/English — las sesiones son por ficha, no por curso.

   Depende de:
     · ficha.js                    → getFichaInstructor, getResultados
     · sesiones.js                 → todo el estado
     · guias-instructor-vista.js   → tituloDeGuia, hrefDeGuia (buscan en #gaa-tbody;
       NO se reutiliza guias-vista.js del aprendiz aquí a propósito: ese archivo pinta
       estado personal bajo identidadActual(), que en la página del instructor no
       identifica a ningún aprendiz real — escribiría en sgma_guias_gaa bajo una clave
       falsa si se cargara tal cual)
══════════════════════════════════════════ */

function fichaDeLaSesion() {
  return typeof getFichaInstructor === 'function' ? getFichaInstructor() : FICHA_EN_CURSO;
}

/* ── 1.7 Programar sesión ── */

function llenarSelectorRASesion() {
  const select = document.getElementById('ses-ra');
  if (!select) return;
  const resultados = typeof getResultados === 'function' ? getResultados(fichaDeLaSesion()) : [];
  select.replaceChildren();
  resultados.forEach(r => {
    const opcion = document.createElement('option');
    opcion.value = r.codigo;
    opcion.textContent = r.codigo + ' — ' + r.descripcion.slice(0, 50);
    select.appendChild(opcion);
  });
}

function pintarSesionesProgramadas() {
  const cuerpo = document.getElementById('ses-tbody');
  if (!cuerpo) return;

  const fichaId = fichaDeLaSesion();
  const lista = getSesiones(fichaId);
  cuerpo.replaceChildren();

  if (!lista.length) {
    const fila = document.createElement('tr');
    const celda = document.createElement('td');
    celda.colSpan = 5;
    celda.style.color = '#999';
    celda.textContent = 'Todavía no hay sesiones programadas para esta ficha.';
    fila.appendChild(celda);
    cuerpo.appendChild(fila);
    return;
  }

  lista.slice().reverse().forEach(sesion => {
    const fila = document.createElement('tr');

    [sesion.fecha, sesion.hora, sesion.ambiente || '—', sesion.ra || '—'].forEach(valor => {
      const celda = document.createElement('td');
      celda.textContent = valor;
      fila.appendChild(celda);
    });

    const celdaEstado = document.createElement('td');
    const sello = document.createElement('span');
    sello.className = 'badge status-badge ' +
      (sesion.estado === 'En curso' ? 'status-active' : sesion.estado === 'Cerrada' ? 'status-closed' : 'status-inactive');
    sello.textContent = sesion.estado;
    celdaEstado.appendChild(sello);

    if (sesion.estado === 'Programada') {
      const boton = document.createElement('button');
      boton.type = 'button';
      boton.className = 'btn btn-sm btn-table btn-primary';
      boton.style.marginLeft = '8px';
      boton.textContent = 'Iniciar';
      boton.addEventListener('click', () => {
        iniciarSesion(fichaId, sesion.id, {
          aula: sesion.ambiente,
          conexion: navigator.onLine ? 'En línea' : 'Sin conexión'
        });
        pintarSesionesProgramadas();
        pintarIniciarSesion();
      });
      celdaEstado.appendChild(boton);
    }

    fila.appendChild(celdaEstado);
    cuerpo.appendChild(fila);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('ses-form');
  if (!form) return;

  llenarSelectorRASesion();
  pintarSesionesProgramadas();

  form.addEventListener('submit', evento => {
    evento.preventDefault();
    const checklistTexto = document.getElementById('ses-checklist').value;
    const checklist = checklistTexto.split('\n').map(l => l.trim()).filter(Boolean)
      .map(texto => ({ texto: texto }));

    programarSesion(fichaDeLaSesion(), {
      fecha: document.getElementById('ses-fecha').value,
      hora: document.getElementById('ses-hora').value,
      ambiente: document.getElementById('ses-ambiente').value,
      ra: document.getElementById('ses-ra').value,
      competencia: document.getElementById('ses-competencia').value,
      checklist: checklist
    });

    form.reset();
    pintarSesionesProgramadas();
  });
});

/* ── 2.1 Iniciar sesión ── */

function pintarIniciarSesion() {
  const caja = document.getElementById('iniciar-sesion-caja');
  if (!caja) return;

  const fichaId = fichaDeLaSesion();
  const activa = sesionActiva(fichaId);
  caja.replaceChildren();

  if (!activa) {
    const programadas = getSesiones(fichaId).filter(s => s.estado === 'Programada');
    const aviso = document.createElement('p');
    aviso.className = 'bloque-nota';
    aviso.textContent = programadas.length
      ? 'No hay ninguna sesión en curso. Inícia una desde la tabla de «Programar sesión» (1.7).'
      : 'No hay sesiones programadas todavía. Prográmala primero en 1.7.';
    caja.appendChild(aviso);
    return;
  }

  const tarjeta = document.createElement('div');
  tarjeta.className = 'card notif-card';

  const titulo = document.createElement('h3');
  titulo.textContent = 'Sesión en curso — ' + activa.fecha + ' ' + activa.hora;
  tarjeta.appendChild(titulo);

  [
    ['Ambiente', activa.ambiente || '—'],
    ['Aula', activa.aula || '—'],
    ['Conexión', activa.conexion || '—'],
    ['Resultado de aprendizaje', activa.ra || '—'],
    ['Competencia relacionada', activa.competencia || '—'],
    ['Equipos', activa.equipos || '—'],
    ['Juicio evaluativo por defecto', activa.juicioDefecto]
  ].forEach(([rotulo, valor]) => {
    const fila = document.createElement('p');
    fila.className = 'dato-fila';
    const clave = document.createElement('span');
    clave.className = 'dato-clave';
    clave.textContent = rotulo;
    const dato = document.createElement('span');
    dato.textContent = valor;
    fila.append(clave, dato);
    tarjeta.appendChild(fila);
  });

  if (activa.checklist.length) {
    const listaChk = document.createElement('ul');
    listaChk.className = 'list-unstyled';
    activa.checklist.forEach(item => {
      const li = document.createElement('li');
      li.className = 'form-check mb-1';
      const casilla = document.createElement('input');
      casilla.type = 'checkbox';
      casilla.className = 'form-check-input';
      casilla.id = 'ses-chk-' + item.id;
      casilla.checked = item.hecho;
      casilla.addEventListener('change', () => alternarChecklistSesion(fichaId, activa.id, item.id));
      const etiqueta = document.createElement('label');
      etiqueta.className = 'form-check-label';
      etiqueta.setAttribute('for', casilla.id);
      etiqueta.textContent = item.texto;
      li.append(casilla, etiqueta);
      listaChk.appendChild(li);
    });
    tarjeta.appendChild(listaChk);
  }

  const cerrar = document.createElement('button');
  cerrar.type = 'button';
  cerrar.className = 'btn btn-action btn-secondary mt-2';
  cerrar.textContent = 'Cerrar sesión';
  cerrar.addEventListener('click', () => {
    cerrarSesion(fichaId, activa.id);
    pintarIniciarSesion();
    pintarSesionesProgramadas();
    pintarGuiaSesion();
  });
  tarjeta.appendChild(cerrar);

  caja.appendChild(tarjeta);
}

/* ── Solicitudes de ingreso (aceptación → ventana de 5 horas) ── */

function pintarSolicitudesSesion() {
  const cuerpo = document.getElementById('ses-solicitudes-tbody');
  if (!cuerpo || typeof sesionesConSolicitudesPendientes !== 'function') return;

  const fichaId = fichaDeLaSesion();
  cuerpo.replaceChildren();

  const todasLasSesiones = getSesiones(fichaId);
  const filas = [];
  todasLasSesiones.forEach(sesion => {
    (sesion.solicitudes || []).forEach(solicitud => filas.push({ sesion, solicitud }));
  });

  if (!filas.length) {
    const fila = document.createElement('tr');
    const celda = document.createElement('td');
    celda.colSpan = 5;
    celda.style.color = '#999';
    celda.textContent = 'Nadie ha solicitado ingreso todavía.';
    fila.appendChild(celda);
    cuerpo.appendChild(fila);
    return;
  }

  filas.slice().reverse().forEach(({ sesion, solicitud }) => {
    const fila = document.createElement('tr');

    const celdaNombre = document.createElement('td');
    celdaNombre.textContent = solicitud.nombre;
    fila.appendChild(celdaNombre);

    const celdaSolicitada = document.createElement('td');
    celdaSolicitada.textContent = new Date(solicitud.solicitada).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' });
    fila.appendChild(celdaSolicitada);

    const celdaEstado = document.createElement('td');
    const vigente = typeof solicitudVigente === 'function' && solicitudVigente(fichaId, sesion.id, solicitud.clave);
    const sello = document.createElement('span');
    sello.className = 'badge status-badge ' +
      (solicitud.estado === 'Pendiente' ? 'status-inactive' : vigente ? 'status-active' : 'status-closed');
    sello.textContent = solicitud.estado === 'Pendiente' ? 'Pendiente' : vigente ? 'Aceptada — vigente' : 'Expirada';
    celdaEstado.appendChild(sello);
    fila.appendChild(celdaEstado);

    const celdaVence = document.createElement('td');
    celdaVence.textContent = solicitud.horaExpira
      ? new Date(solicitud.horaExpira).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })
      : '—';
    fila.appendChild(celdaVence);

    const celdaAccion = document.createElement('td');
    if (solicitud.estado === 'Pendiente') {
      const aceptar = document.createElement('button');
      aceptar.type = 'button';
      aceptar.className = 'btn btn-sm btn-table btn-primary';
      aceptar.textContent = 'Aceptar';
      aceptar.addEventListener('click', () => {
        aceptarSolicitud(fichaId, sesion.id, solicitud.clave);
        pintarSolicitudesSesion();
      });
      celdaAccion.appendChild(aceptar);
    } else {
      celdaAccion.textContent = '—';
    }
    fila.appendChild(celdaAccion);

    cuerpo.appendChild(fila);
  });
}

/* ── 2.4 Guía en curso de la sesión activa ── */

function pintarGuiaSesion() {
  const caja = document.getElementById('guia-sesion-caja');
  if (!caja) return;

  const fichaId = fichaDeLaSesion();
  const activa = sesionActiva(fichaId);
  caja.replaceChildren();

  if (!activa) {
    const vacio = document.createElement('p');
    vacio.className = 'bloque-nota';
    vacio.textContent = 'No hay ninguna sesión en curso.';
    caja.appendChild(vacio);
    return;
  }

  const selector = document.createElement('select');
  selector.className = 'form-select mb-3';
  selector.style.maxWidth = '360px';
  const filas = document.querySelectorAll('#gaa-tbody tr[data-gaa]');

  const vacia = document.createElement('option');
  vacia.value = '';
  vacia.textContent = 'Elegir guía para la sesión…';
  selector.appendChild(vacia);

  filas.forEach(fila => {
    const codigo = fila.getAttribute('data-gaa');
    const opcion = document.createElement('option');
    opcion.value = codigo;
    opcion.textContent = 'GAA ' + codigo + ' — ' + (typeof tituloDeGuia === 'function' ? tituloDeGuia(codigo) : codigo);
    opcion.selected = codigo === activa.guiaId;
    selector.appendChild(opcion);
  });

  selector.addEventListener('change', () => {
    asignarGuiaSesion(fichaId, activa.id, selector.value);
    pintarGuiaSesion();
  });
  caja.appendChild(selector);

  if (!activa.guiaId) {
    const vacio = document.createElement('p');
    vacio.className = 'bloque-nota';
    vacio.textContent = 'Todavía no se designó una guía para esta sesión.';
    caja.appendChild(vacio);
    return;
  }

  const tarjeta = document.createElement('div');
  tarjeta.className = 'card notif-card';
  const titulo = document.createElement('h3');
  titulo.textContent = typeof tituloDeGuia === 'function' ? tituloDeGuia(activa.guiaId) : activa.guiaId;
  tarjeta.appendChild(titulo);

  const href = typeof hrefDeGuia === 'function' ? hrefDeGuia(activa.guiaId) : '';
  if (href) {
    const abrir = document.createElement('a');
    abrir.href = href;
    abrir.target = '_blank';
    abrir.rel = 'noopener';
    abrir.className = 'btn btn-action btn-primary';
    abrir.textContent = 'Abrir guía (PDF)';
    tarjeta.appendChild(abrir);
  }
  caja.appendChild(tarjeta);
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('sec-iniciar-sesion')) pintarIniciarSesion();
  if (document.getElementById('sec-guia-sesion')) pintarGuiaSesion();
  if (document.getElementById('ses-solicitudes-tbody')) pintarSolicitudesSesion();
});
