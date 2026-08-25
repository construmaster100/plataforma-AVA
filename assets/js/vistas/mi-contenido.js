/* ══════════════════════════════════════════
   SGMA-ADSO — Contenido asignado al aprendiz

   Pinta, dentro de «Reportar evidencia de aprendizaje»
   (Módulo 3 — Evalúa), lo que el instructor asignó a la
   ficha. Cada renglón lleva al material donde está la
   actividad; si su módulo sigue bloqueado, no deja entrar.

   Los enlaces apuntan a ../assets/embebidos/…, así que
   visor.js los abre dentro de la plataforma y el puntaje
   vuelve por postMessage sin salir de la página.

   Depende de:
     · ficha.js              → FICHA_EN_CURSO, FICHA_NUEVA_ID
     · embebidos-catalogo.js → misPuntajes(), identidadActual()
     · plan-formativo.js     → contenidoAsignado(), puntosAcumulados()
══════════════════════════════════════════ */

function celdaContenido(texto, clase) {
  const td = document.createElement('td');
  td.textContent = texto;
  if (clase) td.className = clase;
  return td;
}

function pintarResumenContenido(lista, marcas) {
  const caja = document.getElementById('mc-resumen');
  if (!caja) return;
  caja.replaceChildren();

  const hechas     = lista.filter(a => a.hecha).length;
  const abiertas   = lista.filter(a => a.accesible && !a.hecha).length;
  const porPuntos  = lista.filter(a => a.abierto && !a.alcanzado).length;
  const porModulo  = lista.filter(a => !a.abierto).length;

  const tarjetas = [
    ['⭐', puntosAcumulados(marcas), 'Puntos acumulados'],
    ['📌', lista.length, 'Niveles asignados'],
    ['✅', hechas,       'Ya presentados'],
    ['🔓', abiertas,     'Disponibles ahora'],
    ['🎯', porPuntos,    'Te faltan puntos'],
    ['🔒', porModulo,    'Módulo sin abrir']
  ];

  tarjetas.forEach(datos => {
    const tarjeta = document.createElement('div');
    tarjeta.className = 'metric-card';

    const icono = document.createElement('div');
    icono.className = 'metric-icon chip-verde';
    icono.textContent = datos[0];

    const valor = document.createElement('div');
    valor.className = 'metric-value';
    valor.textContent = String(datos[1]);

    const rotulo = document.createElement('div');
    rotulo.className = 'metric-label';
    rotulo.textContent = datos[2];

    tarjeta.append(icono, valor, rotulo);
    caja.appendChild(tarjeta);
  });
}

function pintarListaContenido(lista) {
  const cuerpo = document.getElementById('mc-lista');
  if (!cuerpo) return;
  cuerpo.replaceChildren();

  lista.forEach(actividad => {
    const fila = document.createElement('tr');

    /* Se dice cuál de las dos llaves falta, no un «bloqueado» a secas */
    const estado = document.createElement('td');
    const sello = document.createElement('span');
    sello.className = 'badge status-badge ';
    if (!actividad.abierto) {
      sello.className += 'status-closed';
      sello.textContent = 'Módulo sin abrir';
    } else if (!actividad.alcanzado) {
      sello.className += 'status-closed';
      sello.textContent = 'Faltan ' + actividad.faltan + ' pts';
    } else if (actividad.hecha) {
      sello.className += 'status-active';
      sello.textContent = 'Presentado';
    } else {
      sello.className += 'status-inactive';
      sello.textContent = 'Disponible';
    }
    estado.appendChild(sello);

    const puntos = actividad.puntua
      ? (actividad.hecha ? actividad.puntos + ' / ' + actividad.maximo : '— / ' + actividad.maximo)
      : 'Sin puntaje';

    /* El renglón dirige al área donde vive la actividad */
    const ir = document.createElement('td');
    if (actividad.accesible) {
      const enlace = document.createElement('a');
      enlace.className = 'btn btn-sm btn-table btn-primary';
      enlace.href = actividad.ruta;
      enlace.textContent = actividad.hecha ? 'Repetir' : actividad.accion;
      ir.appendChild(enlace);
    } else {
      const cerrado = document.createElement('span');
      cerrado.className = 'bloque-nota';
      cerrado.textContent = actividad.abierto
        ? 'Suma ' + actividad.faltan + ' puntos más'
        : 'Espera a que el instructor lo abra';
      ir.appendChild(cerrado);
    }

    fila.append(
      celdaContenido(actividad.modulo + ' · nivel ' + actividad.nivel),
      celdaContenido(actividad.titulo),
      celdaContenido(actividad.tipo),
      celdaContenido(actividad.umbral ? actividad.umbral + ' pts' : 'Libre'),
      estado,
      celdaContenido(String(actividad.intentos)),
      celdaContenido(puntos),
      ir
    );

    cuerpo.appendChild(fila);
  });

  const vacio = document.getElementById('mc-vacio');
  if (vacio) vacio.hidden = lista.length > 0;

  const conteo = document.getElementById('mc-conteo');
  if (conteo) {
    conteo.textContent = lista.length
      ? lista.filter(a => a.hecha).length + ' de ' + lista.length + ' presentadas'
      : 'Sin contenido asignado';
  }
}

/* ── Árbol de niveles desbloqueables ── */

/* Una rama por módulo; dentro, un nodo por nivel. El estado
   del nodo dice cuál de las dos llaves le falta. */
function pintarArbolContenido(lista, marcas) {
  const caja = document.getElementById('mc-arbol');
  if (!caja) return;
  caja.replaceChildren();

  const ganados = puntosAcumulados(marcas);

  const titular = document.getElementById('mc-arbol-puntos');
  if (titular) {
    const proximo = lista
      .filter(a => a.abierto && !a.alcanzado)
      .reduce((mejor, a) => (!mejor || a.faltan < mejor.faltan ? a : mejor), null);
    titular.textContent = proximo
      ? ganados + ' puntos · faltan ' + proximo.faltan + ' para el siguiente nivel'
      : ganados + ' puntos acumulados';
  }

  if (!lista.length) return;

  const modulos = [];
  lista.forEach(a => { if (modulos.indexOf(a.modulo) === -1) modulos.push(a.modulo); });

  modulos.forEach(modulo => {
    const niveles = lista.filter(a => a.modulo === modulo);
    const abiertos = niveles.filter(a => a.accesible).length;

    const rama = document.createElement('div');
    rama.className = 'arbol-rama' + (niveles[0].abierto ? '' : ' arbol-rama-cerrada');

    const cabecera = document.createElement('div');
    cabecera.className = 'arbol-cabecera';

    const nombre = document.createElement('span');
    nombre.className = 'arbol-modulo';
    nombre.textContent = modulo;

    const estado = document.createElement('span');
    estado.className = 'arbol-estado';
    estado.textContent = niveles[0].abierto
      ? abiertos + ' de ' + niveles.length + ' niveles abiertos'
      : 'Módulo cerrado por el instructor';

    cabecera.append(nombre, estado);
    rama.appendChild(cabecera);

    const cadena = document.createElement('ol');
    cadena.className = 'arbol-niveles';

    niveles.forEach(actividad => {
      const nodo = document.createElement('li');
      nodo.className = 'arbol-nivel';

      let marca;
      if (!actividad.abierto)      { nodo.classList.add('es-cerrado');   marca = '🔒'; }
      else if (!actividad.alcanzado) { nodo.classList.add('es-esperando'); marca = '🎯'; }
      else if (actividad.hecha)    { nodo.classList.add('es-hecho');     marca = '✓'; }
      else                         { nodo.classList.add('es-abierto');   marca = String(actividad.nivel); }

      const sello = document.createElement('span');
      sello.className = 'arbol-marca';
      sello.textContent = marca;

      const texto = document.createElement('span');
      texto.className = 'arbol-texto';

      const titulo = document.createElement('span');
      titulo.className = 'arbol-titulo';
      titulo.textContent = 'Nivel ' + actividad.nivel + ' · ' + actividad.titulo;

      const pie = document.createElement('span');
      pie.className = 'arbol-meta';
      if (!actividad.abierto) {
        pie.textContent = 'El instructor no ha abierto el módulo';
      } else if (!actividad.alcanzado) {
        pie.textContent = 'Se abre con ' + actividad.umbral + ' pts · te faltan ' + actividad.faltan;
      } else if (actividad.hecha) {
        pie.textContent = 'Presentado · ' + actividad.puntos + ' de ' + actividad.maximo + ' pts';
      } else {
        pie.textContent = actividad.accion + (actividad.puntua ? ' · hasta ' + actividad.maximo + ' pts' : '');
      }

      texto.append(titulo, pie);
      nodo.append(sello, texto);

      if (actividad.accesible) {
        const enlace = document.createElement('a');
        enlace.className = 'arbol-ir';
        enlace.href = actividad.ruta;
        enlace.textContent = actividad.hecha ? 'Repetir' : 'Entrar';
        nodo.appendChild(enlace);
      }

      cadena.appendChild(nodo);
    });

    rama.appendChild(cadena);
    caja.appendChild(rama);
  });
}

/* ── Registro de notificaciones ── */

function tarjetaAviso(titulo, texto, alerta) {
  const tarjeta = document.createElement('div');
  tarjeta.className = 'card notif-card' + (alerta ? ' alert' : '');

  const rotulo = document.createElement('h3');
  rotulo.textContent = titulo;

  const cuerpo = document.createElement('p');
  cuerpo.textContent = texto;

  tarjeta.append(rotulo, cuerpo);
  return tarjeta;
}

function pieAviso(tarjeta, texto) {
  const meta = document.createElement('p');
  meta.className = 'notif-meta';
  meta.textContent = texto;
  tarjeta.appendChild(meta);
}

/* Un aviso por módulo: primero lo que ya se puede hacer,
   después lo que espera al instructor. */
function pintarAvisosContenido(lista) {
  const caja = document.getElementById('mc-avisos');
  if (!caja) return;
  caja.replaceChildren();

  if (!lista.length) {
    caja.appendChild(tarjetaAviso(
      'Sin contenido asignado',
      'Tu instructor todavía no ha asignado actividades a la ficha. Cuando lo haga, aparecerán aquí y en la lista de arriba.',
      false
    ));
    return;
  }

  const modulos = [];
  lista.forEach(a => { if (modulos.indexOf(a.modulo) === -1) modulos.push(a.modulo); });

  modulos.forEach(modulo => {
    const delModulo = lista.filter(a => a.modulo === modulo);

    /* Módulo que el instructor todavía no abre: primera llave */
    if (!delModulo[0].abierto) {
      const tarjeta = tarjetaAviso(
        'Módulo ' + modulo + ' — sin abrir',
        delModulo.length === 1
          ? 'Hay 1 nivel asignado, pero el instructor todavía no abre el módulo.'
          : 'Hay ' + delModulo.length + ' niveles asignados, pero el instructor todavía no abre el módulo.',
        true
      );
      pieAviso(tarjeta, '🔒 Ni los puntos lo abren: hace falta que el instructor lo habilite');
      caja.appendChild(tarjeta);
      return;
    }

    const listos    = delModulo.filter(a => a.accesible && !a.hecha);
    const esperando = delModulo.filter(a => !a.alcanzado);

    if (listos.length) {
      const tarjeta = tarjetaAviso(
        'Módulo ' + modulo + ' — disponible',
        listos.length === 1
          ? 'Tienes 1 nivel abierto por presentar:'
          : 'Tienes ' + listos.length + ' niveles abiertos por presentar:',
        false
      );

      const enlaces = document.createElement('p');
      listos.forEach((actividad, puesto) => {
        if (puesto) enlaces.appendChild(document.createTextNode(' · '));
        const enlace = document.createElement('a');
        enlace.href = actividad.ruta;
        enlace.textContent = 'Nivel ' + actividad.nivel + ' — ' + actividad.titulo;
        enlaces.appendChild(enlace);
      });
      tarjeta.appendChild(enlaces);

      const puntos = listos.reduce((total, a) => total + (a.puntua ? a.maximo : 0), 0);
      pieAviso(tarjeta, puntos ? '⭐ Hay ' + puntos + ' puntos en juego aquí' : 'Material de consulta, sin puntaje');
      caja.appendChild(tarjeta);
    }

    /* Niveles del módulo que esperan puntaje: segunda llave */
    if (esperando.length) {
      const proximo = esperando.reduce((mejor, a) => (a.faltan < mejor.faltan ? a : mejor), esperando[0]);
      const tarjeta = tarjetaAviso(
        'Módulo ' + modulo + ' — ' + esperando.length + (esperando.length === 1 ? ' nivel por puntos' : ' niveles por puntos'),
        'El siguiente es el nivel ' + proximo.nivel + ', «' + proximo.titulo + '». Te faltan ' +
        proximo.faltan + ' puntos para abrirlo.',
        false
      );
      pieAviso(tarjeta, '🎯 Se abre al llegar a ' + proximo.umbral + ' puntos acumulados');
      caja.appendChild(tarjeta);
    }
  });

  /* Cierre: qué lleva hecho */
  const hechas = lista.filter(a => a.hecha);
  if (hechas.length) {
    const ganados = hechas.reduce((total, a) => total + a.puntos, 0);
    const tarjeta = tarjetaAviso(
      'Ya presentaste ' + hechas.length + ' de ' + lista.length,
      'Sumas ' + ganados + ' puntos en las actividades asignadas. Puedes repetir cualquiera para mejorar tu mejor puntaje.',
      false
    );
    pieAviso(tarjeta, '✅ ' + hechas.map(a => a.titulo).join(' · '));
    caja.appendChild(tarjeta);
  }
}

function pintarMiContenido() {
  if (!document.getElementById('mc-lista')) return;

  const marcas = misPuntajes();
  const lista  = contenidoAsignado(fichaDeQuienJuega(), marcas);

  /* Ojo: la lista NO se reordena. Viene en orden de árbol
     (módulo, luego nivel 1, 2, 3…) y tanto el árbol como la
     tabla de detalle dependen de que ese orden se respete. */

  pintarResumenContenido(lista, marcas);
  pintarArbolContenido(lista, marcas);
  pintarListaContenido(lista);
  pintarAvisosContenido(lista);

  const quien = document.getElementById('mc-quien');
  if (quien) {
    const identidad = identidadActual();
    const ficha = fichaDeQuienJuega();
    const datos = fichasParaSelector().find(f => String(f.id) === String(ficha));
    quien.textContent = identidad.nombre + ' · ' +
      (datos ? datos.nombre + ' (' + datos.nivel + ')' : 'ficha ' + ficha);
  }
}

document.addEventListener('DOMContentLoaded', pintarMiContenido);

/* Al terminar una actividad en el visor, la lista se pone al día */
window.addEventListener('message', evento => {
  const dato = evento.data;
  if (dato && dato.tipo === 'sgma-puntaje') pintarMiContenido();
});

/* Y si el instructor cambia el plan en otra pestaña del mismo navegador */
window.addEventListener('storage', evento => {
  if (evento.key === CLAVE_PLAN || evento.key === CLAVE_PUNTAJES) pintarMiContenido();
});
