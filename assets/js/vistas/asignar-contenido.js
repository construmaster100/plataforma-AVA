/* ══════════════════════════════════════════
   SGMA-ADSO — Panel de asignación (instructor y administrador)

   Aquí se arma el plan formativo de la ficha: qué módulos
   quedan abiertos y qué actividades del catálogo se asignan.
   Lo que se guarde aquí es lo que el aprendiz verá en
   «Reportar evidencia de aprendizaje».

   Depende de:
     · ficha.js              → FICHA_EN_CURSO, FICHA_NUEVA_ID, FICHAS_SISTEMA
     · embebidos-catalogo.js → EMBEBIDOS
     · plan-formativo.js     → getPlanFormativo() y compañía
══════════════════════════════════════════ */

let fichaEnPlan = '';
let moduloEnFiltro = '';

function quienAsigna() {
  const seccion = document.getElementById('sec-plan-formativo');
  return seccion ? (seccion.dataset.quien || 'Instructor') : 'Instructor';
}

function avisarPlan(texto) {
  const aviso = document.getElementById('ac-aviso');
  if (!aviso) return;
  aviso.textContent = texto;
  aviso.hidden = !texto;
}

/* Estado de armado de la ficha: cuatro módulos hacen una
   ficha de aprendizaje virtual. */
function pintarEstadoFicha() {
  const caja = document.getElementById('ac-estado-ficha');
  if (!caja) return;
  caja.replaceChildren();

  const ficha = typeof buscarFichaN === 'function' ? buscarFichaN(fichaEnPlan) : null;
  const estatica = typeof fichaEsEstatica === 'function' && fichaEsEstatica(fichaEnPlan);
  const curriculo = getCurriculo(fichaEnPlan);
  const faltan = faltanModulosFicha(fichaEnPlan);

  const sello = document.createElement('span');
  sello.className = 'badge status-badge ';

  if (estatica) {
    sello.className += 'status-active';
    sello.textContent = 'Ficha real · estática';
  } else if (faltan > 0) {
    sello.className += 'status-closed';
    sello.textContent = 'Incompleta · faltan ' + faltan + ' de ' + MODULOS_POR_FICHA + ' módulos';
  } else {
    sello.className += 'status-active';
    sello.textContent = 'Ficha armada · ' + MODULOS_POR_FICHA + ' módulos';
  }
  caja.appendChild(sello);

  const detalle = document.createElement('span');
  detalle.className = 'repo-conteo';
  if (estatica) {
    detalle.textContent = 'Tecnólogo · Zulma Salas · material en docs/ADSO ' + FICHA_EN_CURSO +
                          ' · currículo sin tope';
  } else if (ficha) {
    detalle.textContent = ficha.nivel + ' · ' + ficha.instructor + ' · hasta ' +
                          CUPOS_POR_FICHA + ' cupos (Aprendiz 1 … Aprendiz ' + CUPOS_POR_FICHA + ')';
  }
  caja.appendChild(detalle);

  if (curriculo.length) {
    const lista = document.createElement('span');
    lista.className = 'repo-conteo';
    lista.textContent = 'Módulos: ' + curriculo.join(' · ');
    caja.appendChild(lista);
  }
}

function celdaPlan(texto, clase) {
  const td = document.createElement('td');
  td.textContent = texto;
  if (clase) td.className = clase;
  return td;
}

function botonPlan(texto, clase, alPulsar) {
  const boton = document.createElement('button');
  boton.type = 'button';
  boton.className = 'btn btn-sm btn-table ' + (clase || '');
  boton.textContent = texto;
  boton.addEventListener('click', alPulsar);
  return boton;
}

/* ── Módulos: la llave de acceso ── */

function pintarModulosPlan() {
  const cuerpo = document.getElementById('ac-modulos');
  if (!cuerpo) return;
  cuerpo.replaceChildren();

  const plan = getPlanFormativo(fichaEnPlan);
  const libre = cupoDeModulosLibre(fichaEnPlan);

  modulosDelCatalogo().forEach(modulo => {
    const delModulo = EMBEBIDOS.filter(a => a.modulo === modulo);
    const asignadas = delModulo.filter(a => plan.actividades.some(x => x.id === a.id)).length;
    const enFicha   = plan.curriculo.indexOf(modulo) !== -1;
    const abierto   = plan.modulos.indexOf(modulo) !== -1;

    const fila = document.createElement('tr');
    if (enFicha) fila.classList.add('table-active');

    /* Pertenencia al currículo: los cuatro módulos de la ficha */
    const curriculoCelda = document.createElement('td');
    const casilla = document.createElement('input');
    casilla.type = 'checkbox';
    casilla.className = 'form-check-input';
    casilla.checked = enFicha;
    casilla.disabled = !enFicha && libre === 0;
    casilla.setAttribute('aria-label', 'Incluir ' + modulo + ' en la ficha');
    casilla.title = casilla.disabled
      ? 'La ficha ya tiene sus ' + MODULOS_POR_FICHA + ' módulos'
      : 'Incluir este módulo en la ficha';
    casilla.addEventListener('change', () => {
      alternarModuloCurriculo(fichaEnPlan, modulo);
      pintarPlanFormativo();
    });
    curriculoCelda.appendChild(casilla);

    const estado = document.createElement('td');
    const marca = document.createElement('span');
    if (!enFicha) {
      marca.className = 'badge status-badge status-inactive';
      marca.textContent = 'Fuera de la ficha';
    } else {
      marca.className = 'badge status-badge ' + (abierto ? 'status-active' : 'status-closed');
      marca.textContent = abierto ? 'Abierto' : 'Bloqueado';
    }
    estado.appendChild(marca);

    const acciones = document.createElement('td');

    if (enFicha) {
      acciones.appendChild(
        botonPlan(abierto ? 'Bloquear' : 'Desbloquear', abierto ? 'btn-danger' : 'btn-success', () => {
          alternarModulo(fichaEnPlan, modulo);
          pintarPlanFormativo();
        })
      );
    }

    acciones.appendChild(botonPlan('Cargar módulo', '', () => {
      const hecho = asignarModuloCompleto(fichaEnPlan, modulo, quienAsigna());
      if (hecho === 'sin-cupo') {
        avisarPlan('La ficha ' + fichaEnPlan + ' ya tiene sus ' + MODULOS_POR_FICHA +
                   ' módulos. Saca uno antes de cargar «' + modulo + '».');
        return;
      }
      pintarPlanFormativo();
    }));

    if (asignadas) {
      acciones.appendChild(botonPlan('Quitar todo', 'btn-danger', () => {
        quitarModuloCompleto(fichaEnPlan, modulo);
        pintarPlanFormativo();
      }));
    }

    fila.append(
      celdaPlan(modulo),
      celdaPlan(String(delModulo.length)),
      celdaPlan(asignadas + ' / ' + delModulo.length),
      curriculoCelda,
      estado,
      acciones
    );

    cuerpo.appendChild(fila);
  });
}

/* ── Catálogo: qué se asigna ── */

function pintarCatalogoPlan() {
  const cuerpo = document.getElementById('ac-catalogo');
  if (!cuerpo) return;
  cuerpo.replaceChildren();

  const plan = getPlanFormativo(fichaEnPlan);
  const automaticos = umbralesAutomaticos(fichaEnPlan);
  const lista = EMBEBIDOS.filter(a => !moduloEnFiltro || a.modulo === moduloEnFiltro);

  lista.forEach(actividad => {
    const asignada = plan.actividades.some(a => a.id === actividad.id);
    const fila = document.createElement('tr');
    if (asignada) fila.classList.add('table-active');

    const marcaCelda = document.createElement('td');
    const casilla = document.createElement('input');
    casilla.type = 'checkbox';
    casilla.className = 'form-check-input';
    casilla.checked = asignada;
    casilla.setAttribute('aria-label', 'Asignar ' + actividad.titulo);
    casilla.addEventListener('change', () => {
      const hecho = alternarActividad(fichaEnPlan, actividad.id, quienAsigna());
      if (hecho === 'sin-cupo') {
        casilla.checked = false;
        avisarPlan('«' + actividad.titulo + '» pertenece al módulo ' + actividad.modulo +
                   ', que no está en la ficha, y la ficha ya tiene sus ' + MODULOS_POR_FICHA +
                   ' módulos. Saca uno primero.');
        return;
      }
      avisarPlan('');
      pintarPlanFormativo();
    });
    marcaCelda.appendChild(casilla);

    const abierto = plan.modulos.indexOf(actividad.modulo) !== -1;
    const acceso = document.createElement('td');
    const sello = document.createElement('span');
    sello.className = 'badge status-badge ' + (abierto ? 'status-active' : 'status-closed');
    sello.textContent = abierto ? 'Accesible' : 'Módulo bloqueado';
    acceso.appendChild(sello);

    /* Umbral del nivel: vacío significa «el automático» */
    const umbralCelda = document.createElement('td');
    if (asignada) {
      const propio = plan.actividades.find(a => a.id === actividad.id);
      const campo = document.createElement('input');
      campo.type = 'number';
      campo.min = '0';
      campo.className = 'form-control';
      campo.style.maxWidth = '92px';
      campo.value = typeof propio.umbral === 'number' ? String(propio.umbral) : '';
      campo.placeholder = String(automaticos[actividad.id] || 0);
      campo.title = 'Puntos que debe llevar el aprendiz. Vacío = automático (' +
                    (automaticos[actividad.id] || 0) + ').';
      campo.setAttribute('aria-label', 'Umbral de ' + actividad.titulo);
      campo.addEventListener('change', () => {
        setUmbralActividad(fichaEnPlan, actividad.id, campo.value);
        pintarPlanFormativo();
      });
      umbralCelda.appendChild(campo);
    } else {
      umbralCelda.textContent = '—';
    }

    fila.append(
      marcaCelda,
      celdaPlan(actividad.titulo),
      celdaPlan(actividad.modulo),
      celdaPlan(actividad.tipo),
      celdaPlan(actividad.puntua ? '0 a ' + actividad.maximo : 'Sin puntaje'),
      umbralCelda,
      celdaPlan(accionDeTipo(actividad.tipo)),
      acceso
    );

    cuerpo.appendChild(fila);
  });

  const conteo = document.getElementById('ac-conteo');
  if (conteo) conteo.textContent = lista.length + ' de ' + EMBEBIDOS.length + ' actividades';
}

/* ── Resumen ── */

function pintarResumenPlan() {
  const caja = document.getElementById('ac-resumen');
  if (!caja) return;
  caja.replaceChildren();

  const plan = getPlanFormativo(fichaEnPlan);
  const asignadas = plan.actividades
    .map(a => EMBEBIDOS.find(e => e.id === a.id))
    .filter(Boolean);
  const puntuables = asignadas.filter(a => a.puntua);
  const puntosPosibles = puntuables.reduce((total, a) => total + (a.maximo || 0), 0);

  const tope = fichaEsEstatica(fichaEnPlan) ? modulosDelCatalogo().length : MODULOS_POR_FICHA;

  const tarjetas = [
    ['🧩', plan.curriculo.length + ' / ' + tope, 'Módulos de la ficha'],
    ['🔓', plan.modulos.length + ' / ' + plan.curriculo.length, 'De ellos, desbloqueados'],
    ['📌', asignadas.length, 'Actividades asignadas'],
    ['⭐', puntosPosibles, 'Puntos en juego'],
    ['👥', fichaEsEstatica(fichaEnPlan) ? 27 : CUPOS_POR_FICHA, 'Cupos de la ficha']
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

function pintarPlanFormativo() {
  if (!document.getElementById('ac-catalogo')) return;
  pintarEstadoFicha();
  pintarResumenPlan();
  pintarModulosPlan();
  pintarCatalogoPlan();
}

/* ── Arranque ── */

function llenarFichasPlan(conservar) {
  const selFicha = document.getElementById('ac-ficha');
  if (!selFicha) return;

  const anterior = conservar || selFicha.value;
  selFicha.replaceChildren();

  fichasParaSelector().forEach(ficha => {
    const opcion = document.createElement('option');
    opcion.value = ficha.id;
    opcion.textContent = ficha.nombre + ' · ' + ficha.nivel;
    selFicha.appendChild(opcion);
  });

  if (anterior && selFicha.querySelector('option[value="' + anterior + '"]')) {
    selFicha.value = anterior;
  }
  fichaEnPlan = selFicha.value;
}

function llenarSelectoresPlan() {
  llenarFichasPlan();

  const selNivel = document.getElementById('ac-nueva-nivel');
  if (selNivel) {
    selNivel.replaceChildren();
    NIVELES_FICHA.forEach(nivel => {
      const opcion = document.createElement('option');
      opcion.value = nivel;
      opcion.textContent = nivel;
      selNivel.appendChild(opcion);
    });
    selNivel.value = 'Tecnólogo';
  }

  const selModulo = document.getElementById('ac-filtro');
  if (selModulo) {
    selModulo.replaceChildren();
    const todos = document.createElement('option');
    todos.value = '';
    todos.textContent = 'Todos los módulos';
    selModulo.appendChild(todos);

    modulosDelCatalogo().forEach(modulo => {
      const opcion = document.createElement('option');
      opcion.value = modulo;
      opcion.textContent = 'Módulo ' + modulo;
      selModulo.appendChild(opcion);
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('ac-catalogo')) return;

  llenarSelectoresPlan();

  const selFicha = document.getElementById('ac-ficha');
  if (selFicha) {
    selFicha.addEventListener('change', () => {
      fichaEnPlan = selFicha.value;
      pintarPlanFormativo();
    });
  }

  const selModulo = document.getElementById('ac-filtro');
  if (selModulo) {
    selModulo.addEventListener('change', () => {
      moduloEnFiltro = selModulo.value;
      pintarCatalogoPlan();
    });
  }

  const proximo = document.getElementById('ac-proximo');
  if (proximo) {
    proximo.addEventListener('click', () => {
      const abierto = abrirProximoModulo(fichaEnPlan);
      avisarPlan(abierto
        ? 'Se desbloqueó el módulo ' + abierto + ' para la ficha ' + fichaEnPlan + '.'
        : 'No queda ningún módulo del currículo por abrir. Agrega módulos a la ficha primero.');
      pintarPlanFormativo();
    });
  }

  /* Alta de ficha N: la 2 en adelante */
  const crear = document.getElementById('ac-crear');
  if (crear) {
    crear.addEventListener('click', () => {
      const campoNombre = document.getElementById('ac-nueva-nombre');
      const campoNivel  = document.getElementById('ac-nueva-nivel');
      const campoDocente = document.getElementById('ac-nueva-instructor');

      const nombre = campoNombre ? campoNombre.value.trim() : '';
      if (nombre.length < 3) {
        avisarPlan('Ponle un nombre a la ficha, de al menos 3 letras.');
        if (campoNombre) campoNombre.focus();
        return;
      }

      const ficha = crearFichaN(
        nombre,
        campoNivel ? campoNivel.value : 'Tecnólogo',
        campoDocente ? campoDocente.value : ''
      );

      if (campoNombre) campoNombre.value = '';
      if (campoDocente) campoDocente.value = '';

      llenarFichasPlan(ficha.id);
      avisarPlan('Ficha ' + ficha.id + ' creada (' + ficha.nivel + ', ' + CUPOS_POR_FICHA +
                 ' cupos). Arranca con el plan de modelo: ' + CURRICULO_INICIAL.join(', ') +
                 ', con ' + ABIERTOS_INICIALES.join(' y ') + ' abiertos. Cámbialo si necesitas otros módulos.');
      pintarPlanFormativo();
    });
  }

  pintarPlanFormativo();
});
