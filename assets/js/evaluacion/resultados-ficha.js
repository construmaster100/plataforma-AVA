/* ══════════════════════════════════════════
   SGMA-ADSO — Resultados de las actividades embebidas

   Los aprendices puntúan dentro de los materiales embebidos;
   cada material avisa su puntaje y embebidos-catalogo.js lo
   guarda bajo la clave de quien jugó. Aquí se reúne todo eso
   en una sola vista para que el instructor y el administrador
   lo consulten por ficha.

   Depende de, en este orden:
     · ficha.js              → FICHA_EN_CURSO, getAsignaciones()
     · embebidos-catalogo.js → EMBEBIDOS, leerPuntajes()

   Los puntajes viven en localStorage, así que la consulta
   alcanza lo jugado en ESTE navegador. Es una maqueta: sin
   servidor no hay forma de reunir lo de otros equipos.
══════════════════════════════════════════ */

/* Clave de quien juega → persona, según la arma identidadActual()
   en embebidos-catalogo.js: 'aprendiz-<i>' o 'anonimo'. */
function personaDeClavePuntaje(clave, nombreGuardado) {
  if (clave.indexOf('aprendiz-') === 0) {
    return {
      nombre: nombreGuardado || 'Aprendiz ' + clave.slice(9),
      rol: 'Aprendiz',
      ficha: typeof FICHA_EN_CURSO === 'string' ? FICHA_EN_CURSO : '3293836',
      cupo: '—',
      instructor: instructorTitularDeFicha(FICHA_EN_CURSO)
    };
  }

  return {
    nombre: nombreGuardado || 'Sin identificar',
    rol: 'Sin identificar',
    ficha: '—',
    cupo: '—',
    instructor: '—'
  };
}

function instructorTitularDeFicha(fichaId) {
  if (typeof getAsignaciones !== 'function') return '—';
  const asignada = getAsignaciones().find(a => a.fichaId === fichaId);
  return asignada ? asignada.nombre : '—';
}

/* ── Consolidado ── */

/* Una fila por participante, con lo que lleva hecho. */
function consolidarResultadosEmbebidos() {
  const todos      = leerPuntajes();
  const puntuables = EMBEBIDOS.filter(a => a.puntua);

  return Object.keys(todos).map(clave => {
    const marcas = todos[clave] || {};
    const ids    = Object.keys(marcas);

    // El nombre viaja dentro de cada marca; sirve el de cualquiera
    const nombreGuardado = ids.length ? marcas[ids[0]].nombre : '';
    const persona = personaDeClavePuntaje(clave, nombreGuardado);

    const hechas   = puntuables.filter(a => marcas[a.id]);
    const suma     = hechas.reduce((total, a) => total + (marcas[a.id].mejor || 0), 0);
    const intentos = ids.reduce((total, id) => total + (marcas[id].intentos || 0), 0);
    const fechas   = ids.map(id => marcas[id].fecha).filter(Boolean).sort();

    return {
      clave: clave,
      nombre: persona.nombre,
      rol: persona.rol,
      ficha: persona.ficha,
      cupo: persona.cupo,
      instructor: persona.instructor,
      presentadas: hechas.length,
      disponibles: puntuables.length,
      promedio: hechas.length ? Math.round(suma / hechas.length) : 0,
      intentos: intentos,
      ultima: fechas.length ? fechas[fechas.length - 1] : '',
      marcas: marcas
    };
  }).sort((a, b) => b.promedio - a.promedio || a.nombre.localeCompare(b.nombre));
}

function fechaLegible(iso) {
  if (!iso) return '—';
  const momento = new Date(iso);
  if (isNaN(momento)) return '—';
  return momento.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }) +
         ' · ' + momento.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
}

/* ── Pintado ── */

let claveEnDetalle = '';

function celdaTexto(texto, clase) {
  const td = document.createElement('td');
  td.textContent = texto;
  if (clase) td.className = clase;
  return td;
}

function pintarResumenResultados(filas) {
  const caja = document.getElementById('rf-resumen');
  if (!caja) return;
  caja.replaceChildren();

  const conPuntaje = filas.filter(f => f.presentadas > 0);
  const promedio = conPuntaje.length
    ? Math.round(conPuntaje.reduce((t, f) => t + f.promedio, 0) / conPuntaje.length)
    : 0;

  const tarjetas = [
    ['👥', filas.length, 'Participantes con registro'],
    ['🎓', filas.filter(f => f.rol === 'Aprendiz').length, 'Aprendices de la ficha'],
    ['📊', promedio, 'Promedio general (0 a 100)']
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

function pintarConsolidadoResultados(filas) {
  const cuerpo = document.getElementById('rf-tbody');
  if (!cuerpo) return;
  cuerpo.replaceChildren();

  filas.forEach(datos => {
    const fila = document.createElement('tr');
    if (datos.clave === claveEnDetalle) fila.classList.add('table-active');

    const insignia = document.createElement('td');
    const marca = document.createElement('span');
    marca.className = 'badge status-badge ' +
      (datos.rol === 'Aprendiz' ? 'status-active' : 'status-inactive');
    marca.textContent = datos.rol;
    insignia.appendChild(marca);

    fila.append(
      celdaTexto(datos.nombre),
      insignia,
      celdaTexto(datos.ficha),
      celdaTexto(datos.cupo),
      celdaTexto(datos.presentadas + ' / ' + datos.disponibles),
      celdaTexto(datos.presentadas ? String(datos.promedio) : '—'),
      celdaTexto(String(datos.intentos)),
      celdaTexto(fechaLegible(datos.ultima))
    );

    fila.addEventListener('click', () => {
      claveEnDetalle = claveEnDetalle === datos.clave ? '' : datos.clave;
      pintarResultadosEmbebidos();
    });

    cuerpo.appendChild(fila);
  });

  const conteo = document.getElementById('rf-conteo');
  if (conteo) {
    conteo.textContent = filas.length === 1
      ? '1 participante'
      : filas.length + ' participantes';
  }

  const vacio = document.getElementById('rf-vacio');
  if (vacio) vacio.hidden = filas.length > 0;
}

function pintarDetalleResultados(filas) {
  const cuerpo = document.getElementById('rf-detalle');
  if (!cuerpo) return;
  cuerpo.replaceChildren();

  const elegidas = claveEnDetalle
    ? filas.filter(f => f.clave === claveEnDetalle)
    : filas;

  let renglones = 0;

  elegidas.forEach(datos => {
    EMBEBIDOS.forEach(actividad => {
      const marca = datos.marcas[actividad.id];
      if (!marca) return;

      const fila = document.createElement('tr');
      fila.append(
        celdaTexto(datos.nombre),
        celdaTexto(actividad.titulo),
        celdaTexto(actividad.modulo),
        celdaTexto(actividad.puntua ? marca.mejor + ' / ' + actividad.maximo : 'Sin puntaje'),
        celdaTexto(actividad.puntua ? String(marca.puntaje) : '—'),
        celdaTexto(String(marca.intentos)),
        celdaTexto(fechaLegible(marca.fecha))
      );
      cuerpo.appendChild(fila);
      renglones += 1;
    });
  });

  const rotulo = document.getElementById('rf-detalle-quien');
  if (rotulo) {
    rotulo.textContent = !renglones
      ? 'Sin actividades presentadas'
      : (claveEnDetalle
          ? elegidas[0].nombre + ' · ' + renglones + ' actividades'
          : renglones + ' actividades de todos los participantes');
  }
}

/* ── Vista completa ── */

function pintarResultadosEmbebidos() {
  if (!document.getElementById('rf-tbody')) return;

  const porFicha    = document.getElementById('rf-ficha');
  const porRol      = document.getElementById('rf-rol');
  const porAprendiz = document.getElementById('rf-aprendiz');
  const ficha    = porFicha ? porFicha.value : '';
  const rol      = porRol ? porRol.value : '';
  const aprendiz = porAprendiz ? porAprendiz.value : '';

  const filas = consolidarResultadosEmbebidos()
    .filter(f => !ficha || f.ficha === ficha)
    .filter(f => !rol || f.rol === rol)
    .filter(f => !aprendiz || f.nombre === aprendiz);

  // Si el filtro dejó fuera al que estaba en detalle, se suelta
  if (claveEnDetalle && !filas.some(f => f.clave === claveEnDetalle)) claveEnDetalle = '';

  pintarResumenResultados(filas);
  pintarConsolidadoResultados(filas);
  pintarDetalleResultados(filas);
}

function llenarFichasResultados() {
  const selector = document.getElementById('rf-ficha');
  if (!selector) return;

  const fichas = [['', 'Todas las fichas']];
  if (typeof FICHA_EN_CURSO === 'string') {
    fichas.push([FICHA_EN_CURSO, 'Ficha ' + FICHA_EN_CURSO + ' — ADSO']);
  }

  selector.replaceChildren();
  fichas.forEach(par => {
    const opcion = document.createElement('option');
    opcion.value = par[0];
    opcion.textContent = par[1];
    selector.appendChild(opcion);
  });
}

function llenarAprendicesResultados() {
  const selector = document.getElementById('rf-aprendiz');
  const porFicha = document.getElementById('rf-ficha');
  if (!selector) return;

  const fichaId = porFicha && porFicha.value ? porFicha.value : (typeof FICHA_EN_CURSO === 'string' ? FICHA_EN_CURSO : '');
  const seleccionPrevia = selector.value;
  const lista = typeof getMatricula === 'function' ? getMatricula(fichaId) : [];

  selector.replaceChildren();
  const todos = document.createElement('option');
  todos.value = '';
  todos.textContent = 'Todos los aprendices';
  selector.appendChild(todos);

  lista.forEach(nombre => {
    const opcion = document.createElement('option');
    opcion.value = nombre;
    opcion.textContent = nombre;
    selector.appendChild(opcion);
  });

  if (lista.indexOf(seleccionPrevia) !== -1) selector.value = seleccionPrevia;
}

document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('rf-tbody')) return;

  llenarFichasResultados();
  llenarAprendicesResultados();
  ['rf-ficha', 'rf-rol', 'rf-aprendiz'].forEach(id => {
    const campo = document.getElementById(id);
    if (campo) campo.addEventListener('change', pintarResultadosEmbebidos);
  });
  const selFicha = document.getElementById('rf-ficha');
  if (selFicha) selFicha.addEventListener('change', llenarAprendicesResultados);

  const boton = document.getElementById('rf-refrescar');
  if (boton) boton.addEventListener('click', pintarResultadosEmbebidos);

  pintarResultadosEmbebidos();
});

/* Si el aprendiz juega en otra pestaña del mismo navegador,
   el panel se entera sin recargar. */
window.addEventListener('storage', evento => {
  if (evento.key === CLAVE_PUNTAJES) {
    pintarResultadosEmbebidos();
  }
});
