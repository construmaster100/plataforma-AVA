/* ══════════════════════════════════════════
   SGMA-ADSO — Panel de módulos formativos

   Instructor y administrador crean módulos de cuatro partes,
   les enganchan actividades del catálogo y validan a mano el
   resultado de aprendizaje de cada aprendiz.

   Depende de:
     · ficha.js                → FICHAS_SISTEMA, getResultados()
     · embebidos-catalogo.js   → EMBEBIDOS, leerPuntajes()
     · fichas-n.js             → fichasParaSelector()
     · modulos-formativos.js   → todo el estado
══════════════════════════════════════════ */

let moduloAbiertoMF = '';

function quienEditaMF() {
  const seccion = document.getElementById('sec-modulos-formativos');
  return seccion ? (seccion.dataset.quien || 'Instructor') : 'Instructor';
}

function avisarMF(texto, malo) {
  const aviso = document.getElementById('mf-aviso');
  if (!aviso) return;
  aviso.textContent = texto || '';
  aviso.hidden = !texto;
  aviso.classList.toggle('es-malo', Boolean(malo));
}

/* ── Alta ── */

function llenarSelectoresMF() {
  const selFicha = document.getElementById('mf-nueva-ficha');
  if (selFicha) {
    selFicha.replaceChildren();
    const fichas = typeof fichasParaSelector === 'function'
      ? fichasParaSelector()
      : [{ id: FICHA_EN_CURSO, nombre: 'Ficha ' + FICHA_EN_CURSO }];
    fichas.forEach(f => {
      const o = document.createElement('option');
      o.value = f.id;
      o.textContent = f.nombre;
      selFicha.appendChild(o);
    });
  }

  const selDocente = document.getElementById('mf-nuevo-instructor');
  if (selDocente) {
    const previo = selDocente.value;
    selDocente.replaceChildren();
    instructoresDisponibles().forEach(i => {
      const o = document.createElement('option');
      o.value = i.nombre;
      o.textContent = i.nombre;
      selDocente.appendChild(o);
    });
    const otro = document.createElement('option');
    otro.value = '__otro__';
    otro.textContent = 'Otro instructor…';
    selDocente.appendChild(otro);
    if (previo) selDocente.value = previo;
  }
}

function llenarResultadosMF() {
  const selRA = document.getElementById('mf-nuevo-ra');
  const selFicha = document.getElementById('mf-nueva-ficha');
  if (!selRA) return;

  const fichaId = selFicha ? selFicha.value : FICHA_EN_CURSO;
  const resultados = typeof getResultados === 'function' ? getResultados(fichaId) : [];

  selRA.replaceChildren();
  if (!resultados.length) {
    const o = document.createElement('option');
    o.value = '';
    o.textContent = 'La ficha no tiene resultados cargados';
    selRA.appendChild(o);
    return;
  }
  resultados.forEach(ra => {
    const o = document.createElement('option');
    o.value = ra.codigo;
    o.textContent = ra.codigo + ' — ' + ra.descripcion.slice(0, 60);
    selRA.appendChild(o);
  });
}

/* ── Lista de módulos ── */

function pintarModulosFormativos() {
  const caja = document.getElementById('mf-lista');
  if (!caja) return;
  caja.replaceChildren();

  const modulos = getModulosFormativos();

  if (!modulos.length) {
    const vacio = document.createElement('p');
    vacio.className = 'bloque-nota';
    vacio.textContent = 'Todavía no hay módulos formativos creados.';
    caja.appendChild(vacio);
    return;
  }

  modulos.forEach(modulo => {
    const tarjeta = document.createElement('article');
    tarjeta.className = 'mf-modulo' + (moduloArmado(modulo) ? ' es-armado' : '');

    /* Cabecera */
    const cabecera = document.createElement('div');
    cabecera.className = 'mf-cabecera';

    const titulo = document.createElement('h3');
    titulo.className = 'mf-titulo';
    titulo.textContent = modulo.nombre;

    const sello = document.createElement('span');
    sello.className = 'badge status-badge ' + (moduloArmado(modulo) ? 'status-active' : 'status-closed');
    sello.textContent = moduloArmado(modulo)
      ? 'Armado'
      : 'Faltan ' + partesVacias(modulo).length + ' de ' + PARTES_MODULO.length + ' partes';

    cabecera.append(titulo, sello);

    const meta = document.createElement('p');
    meta.className = 'mf-meta';
    meta.textContent = 'Ficha ' + modulo.fichaId + ' · ' + modulo.instructor +
      (modulo.ra ? ' · valida ' + modulo.ra : ' · sin RA asignado');

    tarjeta.append(cabecera, meta);

    /* Las cuatro partes */
    const rejilla = document.createElement('div');
    rejilla.className = 'mf-partes';

    PARTES_MODULO.forEach(parte => {
      const bloque = document.createElement('div');
      bloque.className = 'mf-parte' + (modulo.partes[parte].length ? '' : ' es-vacia');

      const rotulo = document.createElement('p');
      rotulo.className = 'mf-parte-titulo';
      rotulo.textContent = (ICONO_PARTE[parte] || '') + ' ' + parte;

      bloque.appendChild(rotulo);

      modulo.partes[parte].forEach(id => {
        const actividad = EMBEBIDOS.find(a => a.id === id);
        const fila = document.createElement('button');
        fila.type = 'button';
        fila.className = 'mf-actividad';
        fila.title = 'Quitar de ' + parte;
        fila.textContent = actividad ? actividad.titulo : id;
        fila.addEventListener('click', () => {
          alternarActividadEnParte(modulo.id, parte, id);
          pintarModulosFormativos();
        });
        bloque.appendChild(fila);
      });

      /* Añadir actividad a esta parte */
      const anadir = document.createElement('select');
      anadir.className = 'mf-anadir';
      anadir.setAttribute('aria-label', 'Añadir actividad a ' + parte);

      const guia = document.createElement('option');
      guia.value = '';
      guia.textContent = '+ añadir actividad';
      anadir.appendChild(guia);

      EMBEBIDOS.forEach(a => {
        if (modulo.partes[parte].indexOf(a.id) !== -1) return;
        const o = document.createElement('option');
        o.value = a.id;
        o.textContent = a.modulo + ' · ' + a.titulo;
        anadir.appendChild(o);
      });

      anadir.addEventListener('change', () => {
        if (!anadir.value) return;
        alternarActividadEnParte(modulo.id, parte, anadir.value);
        pintarModulosFormativos();
      });

      bloque.appendChild(anadir);
      rejilla.appendChild(bloque);
    });

    tarjeta.appendChild(rejilla);

    /* Acciones */
    const pie = document.createElement('div');
    pie.className = 'mf-acciones';

    const validar = document.createElement('button');
    validar.type = 'button';
    validar.className = 'btn btn-sm btn-table btn-primary';
    validar.textContent = moduloAbiertoMF === modulo.id ? 'Ocultar aprendices' : 'Validar aprendices';
    validar.addEventListener('click', () => {
      moduloAbiertoMF = moduloAbiertoMF === modulo.id ? '' : modulo.id;
      pintarModulosFormativos();
    });

    const borrar = document.createElement('button');
    borrar.type = 'button';
    borrar.className = 'btn btn-sm btn-table btn-danger';
    borrar.textContent = 'Eliminar módulo';
    borrar.addEventListener('click', () => {
      eliminarModuloFormativo(modulo.id);
      if (moduloAbiertoMF === modulo.id) moduloAbiertoMF = '';
      avisarMF('Módulo «' + modulo.nombre + '» eliminado.');
      pintarModulosFormativos();
    });

    pie.append(validar, borrar);
    tarjeta.appendChild(pie);

    if (moduloAbiertoMF === modulo.id) {
      tarjeta.appendChild(tablaValidacion(modulo));
    }

    caja.appendChild(tarjeta);
  });
}

/* ── Validación por aprendiz ── */

function tablaValidacion(modulo) {
  const envoltorio = document.createElement('div');
  envoltorio.className = 'mf-validacion';

  const titulo = document.createElement('p');
  titulo.className = 'mf-parte-titulo';
  titulo.textContent = 'Validación de ' + (modulo.ra || 'el resultado') + ' — la aprueba el instructor';
  envoltorio.appendChild(titulo);

  const todos = leerPuntajes();
  const claves = Object.keys(todos);

  if (!claves.length) {
    const vacio = document.createElement('p');
    vacio.className = 'bloque-nota';
    vacio.textContent = 'Ningún aprendiz ha registrado actividad todavía.';
    envoltorio.appendChild(vacio);
    return envoltorio;
  }

  const tabla = document.createElement('table');
  tabla.className = 'table table-hover align-middle data-table';

  const cabeza = document.createElement('thead');
  const filaCab = document.createElement('tr');
  ['Aprendiz', 'Contenido', 'Práctica', 'Evaluación', 'Evidencia', 'Avance', 'Estado', 'Acción']
    .forEach(t => {
      const th = document.createElement('th');
      th.textContent = t;
      filaCab.appendChild(th);
    });
  cabeza.appendChild(filaCab);
  tabla.appendChild(cabeza);

  const cuerpo = document.createElement('tbody');

  claves.forEach(clave => {
    const marcas = todos[clave];
    const ids = Object.keys(marcas);
    const nombre = ids.length ? marcas[ids[0]].nombre : clave;
    const avance = avanceEnModulo(modulo, marcas);
    const validacion = getValidacion(clave, modulo.id);

    const fila = document.createElement('tr');

    const celda = texto => {
      const td = document.createElement('td');
      td.textContent = texto;
      return td;
    };

    const rechazada = validacion && validacion.estado === 'No aprobado';
    const aprobada = validacion && validacion.estado === 'Aprobado';

    const estado = document.createElement('td');
    const sello = document.createElement('span');
    sello.className = 'badge status-badge ' +
      (aprobada ? 'status-active' : rechazada ? 'status-inactive' : 'status-closed');
    sello.textContent = aprobada ? 'Aprobado' : rechazada ? 'No aprobado' : 'Sin validar';
    if (validacion) sello.title = (aprobada ? 'Aprobó ' : 'Rechazó ') + validacion.por + ' el ' +
      new Date(validacion.fecha).toLocaleDateString('es-CO') +
      (rechazada && validacion.nota ? ' — ' + validacion.nota : '');
    estado.appendChild(sello);

    const accion = document.createElement('td');
    accion.className = 'mf-acciones-validacion';

    if (aprobada) {
      const retirar = document.createElement('button');
      retirar.type = 'button';
      retirar.className = 'btn btn-sm btn-table btn-danger';
      retirar.textContent = 'Retirar';
      retirar.addEventListener('click', () => {
        retirarValidacion(clave, modulo.id);
        avisarMF('Se retiró la validación de ' + nombre + '.');
        pintarModulosFormativos();
      });
      accion.appendChild(retirar);
    } else {
      const validar = document.createElement('button');
      validar.type = 'button';
      validar.className = 'btn btn-sm btn-table btn-success';
      validar.textContent = 'Validar RA';
      validar.addEventListener('click', () => {
        validarResultado(clave, modulo.id, quienEditaMF(), '');
        avisarMF((modulo.ra || 'El resultado') + ' aprobado a ' + nombre +
                 ' por ' + quienEditaMF() + '.');
        pintarModulosFormativos();
      });
      accion.appendChild(validar);

      const rechazar = document.createElement('button');
      rechazar.type = 'button';
      rechazar.className = 'btn btn-sm btn-table btn-danger';
      rechazar.textContent = 'Rechazar';
      rechazar.addEventListener('click', () => {
        const motivo = prompt('¿Por qué se rechaza ' + (modulo.ra || 'el resultado') +
          ' de ' + nombre + '? Este motivo lo verá el aprendiz en su plan de mejoramiento.', '');
        if (motivo === null) return;
        rechazarResultado(clave, modulo.id, quienEditaMF(), motivo);
        avisarMF((modulo.ra || 'El resultado') + ' rechazado a ' + nombre +
                 '. Vuelve a su módulo de mejora.');
        pintarModulosFormativos();
      });
      accion.appendChild(rechazar);

      if (rechazada) {
        const retirar = document.createElement('button');
        retirar.type = 'button';
        retirar.className = 'btn btn-sm btn-table';
        retirar.textContent = 'Retirar';
        retirar.addEventListener('click', () => {
          retirarValidacion(clave, modulo.id);
          avisarMF('Se retiró el rechazo de ' + nombre + '.');
          pintarModulosFormativos();
        });
        accion.appendChild(retirar);
      }
    }

    fila.append(
      celda(nombre),
      celda(avance.detalle['Contenido'].hechas + '/' + avance.detalle['Contenido'].de),
      celda(avance.detalle['Práctica'].hechas + '/' + avance.detalle['Práctica'].de),
      celda(avance.detalle['Evaluación'].hechas + '/' + avance.detalle['Evaluación'].de),
      celda(avance.detalle['Evidencia'].hechas + '/' + avance.detalle['Evidencia'].de),
      celda(avance.porcentaje + '%'),
      estado,
      accion
    );

    cuerpo.appendChild(fila);
  });

  tabla.appendChild(cuerpo);
  envoltorio.appendChild(tabla);
  return envoltorio;
}

/* ── Arranque ── */

document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('mf-lista')) return;

  llenarSelectoresMF();
  llenarResultadosMF();
  pintarModulosFormativos();

  const selFicha = document.getElementById('mf-nueva-ficha');
  if (selFicha) selFicha.addEventListener('change', llenarResultadosMF);

  const selDocente = document.getElementById('mf-nuevo-instructor');
  const campoOtro = document.getElementById('mf-otro-instructor');
  if (selDocente && campoOtro) {
    const alternar = () => { campoOtro.hidden = selDocente.value !== '__otro__'; };
    selDocente.addEventListener('change', alternar);
    alternar();
  }

  const form = document.getElementById('mf-form');
  if (form) {
    form.addEventListener('submit', evento => {
      evento.preventDefault();

      const nombre = document.getElementById('mf-nuevo-nombre');
      if (!nombre || nombre.value.trim().length < 3) {
        avisarMF('Ponle un nombre al módulo, de al menos 3 letras.', true);
        if (nombre) nombre.focus();
        return;
      }

      let docente = selDocente ? selDocente.value : '';
      if (docente === '__otro__') {
        docente = campoOtro ? campoOtro.value.trim() : '';
        if (!docente) {
          avisarMF('Escribe el nombre del instructor nuevo.', true);
          if (campoOtro) campoOtro.focus();
          return;
        }
      }

      const selRA = document.getElementById('mf-nuevo-ra');
      const nuevo = crearModuloFormativo({
        nombre: nombre.value,
        fichaId: selFicha ? selFicha.value : FICHA_EN_CURSO,
        instructor: docente,
        ra: selRA ? selRA.value : '',
        creadoPor: quienEditaMF()
      });

      nombre.value = '';
      if (campoOtro) { campoOtro.value = ''; campoOtro.hidden = true; }
      if (selDocente) selDocente.value = nuevo.instructor;

      llenarSelectoresMF();
      avisarMF('Módulo «' + nuevo.nombre + '» creado. Engánchale actividades a sus ' +
               PARTES_MODULO.length + ' partes.');
      pintarModulosFormativos();
    });
  }
});

window.addEventListener('storage', evento => {
  if (evento.key === CLAVE_MODULOS_F ||
      evento.key === CLAVE_VALIDACIONES ||
      evento.key === CLAVE_PUNTAJES) pintarModulosFormativos();
});
