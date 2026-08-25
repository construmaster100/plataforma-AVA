/* ══════════════════════════════════════════
   SGMA-ADSO — Plan formativo de la ficha

   Lo que el instructor (o el administrador) habilita aquí
   es lo que el aprendiz encuentra en «Reportar evidencia de
   aprendizaje», dentro del Módulo 3 — Evalúa.

   Dos capas, a propósito distintas:
     · módulos abiertos → la llave. Mientras el módulo esté
       cerrado, sus actividades se ven pero no se entran.
     · actividades asignadas → la lista de trabajo. Sale del
       catálogo de embebidos, no se inventan actividades.

   El plan es de la ficha entera: los 27 aprendices de la
   3293836 ven lo mismo.

   Depende de:
     · ficha.js              → leerAlmacen, guardarAlmacen, FICHA_EN_CURSO
     · embebidos-catalogo.js → EMBEBIDOS
══════════════════════════════════════════ */

const CLAVE_PLAN = 'sgma_plan_formativo';

function planEnBlanco() {
  return { curriculo: [], modulos: [], actividades: [] };
}

/* ── Punto de partida, antes de que el instructor arme la ficha ──
   Cuatro módulos hacen la ficha; de esos, Python y HTML arrancan
   abiertos y los otros dos esperan a que el instructor los suelte.
   La ficha 2 es «de modelo», así que este mismo plan es el molde
   del que salen las fichas N nuevas. */
const CURRICULO_INICIAL = ['Python', 'Java', 'HTML', 'CSS'];
const ABIERTOS_INICIALES = ['Python', 'HTML'];

/* Solo la ficha real (sin tope de módulos, ver topeDeModulos) arranca
   con este módulo extra ya en su currículo y abierto. Las fichas N
   siguen naciendo con exactamente los cuatro de CURRICULO_INICIAL,
   para no romper su tope de MODULOS_POR_FICHA. */
const MODULOS_EXTRA_FICHA_ESTATICA = ['Sede Tunja'];

function planInicial(fichaId) {
  const extra = (typeof fichaEsEstatica === 'function' && fichaEsEstatica(fichaId))
    ? MODULOS_EXTRA_FICHA_ESTATICA : [];
  const curriculo = CURRICULO_INICIAL.concat(extra);
  const abiertos = ABIERTOS_INICIALES.concat(extra);
  const actividades = [];

  EMBEBIDOS.forEach(actividad => {
    if (curriculo.indexOf(actividad.modulo) !== -1) {
      actividades.push({ id: actividad.id, asignada: '', por: 'Plan inicial' });
    }
  });

  return {
    curriculo: curriculo,
    modulos: abiertos,
    actividades: actividades
  };
}

function getPlanFormativo(fichaId) {
  const guardado = leerAlmacen(CLAVE_PLAN, {})[fichaId];
  if (!guardado) return planInicial(fichaId);
  return {
    curriculo: Array.isArray(guardado.curriculo) ? guardado.curriculo : [],
    modulos: Array.isArray(guardado.modulos) ? guardado.modulos : [],
    actividades: Array.isArray(guardado.actividades) ? guardado.actividades : []
  };
}

function setPlanFormativo(fichaId, plan) {
  const todos = leerAlmacen(CLAVE_PLAN, {});
  todos[fichaId] = plan;
  return guardarAlmacen(CLAVE_PLAN, todos);
}

/* ── Módulos ── */

/* Los módulos salen del catálogo, en el orden en que están
   declarados: ese es el orden del curso. */
function modulosDelCatalogo() {
  const vistos = [];
  EMBEBIDOS.forEach(actividad => {
    if (vistos.indexOf(actividad.modulo) === -1) vistos.push(actividad.modulo);
  });
  return vistos;
}

/* ── Currículo: los cuatro módulos que hacen la ficha ── */

/* La ficha real ya viene armada y no se le impone el tope;
   las fichas N sí llevan exactamente MODULOS_POR_FICHA. */
function topeDeModulos(fichaId) {
  if (typeof fichaEsEstatica === 'function' && fichaEsEstatica(fichaId)) return Infinity;
  return typeof MODULOS_POR_FICHA === 'number' ? MODULOS_POR_FICHA : 4;
}

function getCurriculo(fichaId) {
  return getPlanFormativo(fichaId).curriculo;
}

function moduloEnCurriculo(fichaId, modulo) {
  return getCurriculo(fichaId).indexOf(modulo) !== -1;
}

function cupoDeModulosLibre(fichaId) {
  return Math.max(0, topeDeModulos(fichaId) - getCurriculo(fichaId).length);
}

/* Cuántos módulos faltan para que la ficha quede armada.
   Devuelve negativo si se pasó del tope. */
function faltanModulosFicha(fichaId) {
  const tope = topeDeModulos(fichaId);
  if (tope === Infinity) return 0;
  return tope - getCurriculo(fichaId).length;
}

function fichaCompleta(fichaId) {
  return faltanModulosFicha(fichaId) === 0;
}

/* Meter o sacar un módulo del currículo. Al sacarlo se lleva
   consigo su desbloqueo y sus actividades: dejar actividades
   de un módulo que ya no es de la ficha no tendría sentido. */
function alternarModuloCurriculo(fichaId, modulo) {
  const plan = getPlanFormativo(fichaId);
  const puesto = plan.curriculo.indexOf(modulo);

  if (puesto === -1) {
    if (plan.curriculo.length >= topeDeModulos(fichaId)) return false;
    plan.curriculo.push(modulo);
  } else {
    const ids = EMBEBIDOS.filter(a => a.modulo === modulo).map(a => a.id);
    plan.curriculo.splice(puesto, 1);
    plan.modulos = plan.modulos.filter(m => m !== modulo);
    plan.actividades = plan.actividades.filter(a => ids.indexOf(a.id) === -1);
  }

  setPlanFormativo(fichaId, plan);
  return puesto === -1;
}

/* ── Desbloqueo: la llave del instructor ── */

function moduloAbierto(fichaId, modulo) {
  return getPlanFormativo(fichaId).modulos.indexOf(modulo) !== -1;
}

/* Solo se abre lo que pertenece al currículo de la ficha */
function alternarModulo(fichaId, modulo) {
  const plan = getPlanFormativo(fichaId);
  if (plan.curriculo.indexOf(modulo) === -1) return false;

  const puesto = plan.modulos.indexOf(modulo);
  if (puesto === -1) plan.modulos.push(modulo);
  else plan.modulos.splice(puesto, 1);

  setPlanFormativo(fichaId, plan);
  return puesto === -1;
}

/* «Colocar el próximo módulo»: abre el primero del currículo
   que siga cerrado, siguiendo el orden del catálogo. */
function abrirProximoModulo(fichaId) {
  const plan = getPlanFormativo(fichaId);
  const proximo = modulosDelCatalogo()
    .filter(m => plan.curriculo.indexOf(m) !== -1)
    .find(m => plan.modulos.indexOf(m) === -1);

  if (!proximo) return '';
  plan.modulos.push(proximo);
  setPlanFormativo(fichaId, plan);
  return proximo;
}

/* ── Actividades asignadas ── */

function actividadAsignada(fichaId, id) {
  return getPlanFormativo(fichaId).actividades.some(a => a.id === id);
}

/* Asignar una actividad mete su módulo al currículo si hay
   cupo. Si la ficha ya llegó a sus cuatro módulos, se niega:
   devuelve 'sin-cupo' para que el panel lo explique. */
function alternarActividad(fichaId, id, quien) {
  const plan = getPlanFormativo(fichaId);
  const puesto = plan.actividades.findIndex(a => a.id === id);

  if (puesto !== -1) {
    plan.actividades.splice(puesto, 1);
    setPlanFormativo(fichaId, plan);
    return false;
  }

  const actividad = EMBEBIDOS.find(a => a.id === id);
  if (!actividad) return false;

  if (plan.curriculo.indexOf(actividad.modulo) === -1) {
    if (plan.curriculo.length >= topeDeModulos(fichaId)) return 'sin-cupo';
    plan.curriculo.push(actividad.modulo);
  }

  plan.actividades.push({ id: id, asignada: new Date().toISOString(), por: quien || '' });
  setPlanFormativo(fichaId, plan);
  return true;
}

/* Cargar un módulo entero: lo mete al currículo, lo abre y
   asigna todas sus actividades de una vez. */
function asignarModuloCompleto(fichaId, modulo, quien) {
  const plan = getPlanFormativo(fichaId);

  if (plan.curriculo.indexOf(modulo) === -1) {
    if (plan.curriculo.length >= topeDeModulos(fichaId)) return 'sin-cupo';
    plan.curriculo.push(modulo);
  }
  if (plan.modulos.indexOf(modulo) === -1) plan.modulos.push(modulo);

  let agregadas = 0;
  EMBEBIDOS.filter(a => a.modulo === modulo).forEach(actividad => {
    if (plan.actividades.some(a => a.id === actividad.id)) return;
    plan.actividades.push({ id: actividad.id, asignada: new Date().toISOString(), por: quien || '' });
    agregadas += 1;
  });

  setPlanFormativo(fichaId, plan);
  return agregadas;
}

/* Sacar el módulo de la ficha: libera su cupo del currículo */
function quitarModuloCompleto(fichaId, modulo) {
  const plan = getPlanFormativo(fichaId);
  const ids = EMBEBIDOS.filter(a => a.modulo === modulo).map(a => a.id);
  const antes = plan.actividades.length;

  plan.actividades = plan.actividades.filter(a => ids.indexOf(a.id) === -1);
  plan.modulos = plan.modulos.filter(m => m !== modulo);
  plan.curriculo = plan.curriculo.filter(m => m !== modulo);

  setPlanFormativo(fichaId, plan);
  return antes - plan.actividades.length;
}

/* ── Árbol de niveles por puntos ── */

/* Cuánto de lo repartido antes hay que llevar ganado para
   que el siguiente nivel se abra. La mitad deja avanzar sin
   exigir el puntaje perfecto en todo lo anterior. */
const FACTOR_UMBRAL = 0.5;

/* Lo asignado, en el orden del catálogo: ese es el orden del
   árbol. Dentro de cada módulo, cada actividad es un nivel. */
function actividadesEnOrden(fichaId) {
  const plan = getPlanFormativo(fichaId);
  const pares = [];

  EMBEBIDOS.forEach(actividad => {
    const entrada = plan.actividades.find(a => a.id === actividad.id);
    if (entrada) pares.push({ actividad: actividad, entrada: entrada });
  });

  return pares;
}

/* Umbral automático de cada nivel: una fracción de los puntos
   que reparten los niveles anteriores. El primero es libre. */
/* La escalera se cuenta DENTRO de cada módulo, no sobre el
   árbol entero. Si se contara global, los módulos cerrados
   inflarían el umbral de los abiertos y el aprendiz vería un
   módulo «Disponible» en el que no puede entrar: su primer
   nivel costaría los puntos de todo lo anterior, incluido lo
   que no puede jugar. Así el nivel 1 de cada módulo abierto
   siempre es accesible, y los puntos escalonan hacia dentro. */
function umbralesAutomaticos(fichaId) {
  const mapa = {};
  const repartidosPorModulo = {};

  actividadesEnOrden(fichaId).forEach(par => {
    const modulo = par.actividad.modulo;
    if (repartidosPorModulo[modulo] === undefined) repartidosPorModulo[modulo] = 0;

    mapa[par.actividad.id] = Math.round(repartidosPorModulo[modulo] * FACTOR_UMBRAL);
    if (par.actividad.puntua) repartidosPorModulo[modulo] += par.actividad.maximo || 0;
  });

  return mapa;
}

function umbralDeActividad(fichaId, id) {
  const entrada = getPlanFormativo(fichaId).actividades.find(a => a.id === id);
  if (entrada && typeof entrada.umbral === 'number') return entrada.umbral;
  return umbralesAutomaticos(fichaId)[id] || 0;
}

/* Con valor nulo o vacío, el nivel vuelve a su umbral automático. */
function setUmbralActividad(fichaId, id, valor) {
  const plan = getPlanFormativo(fichaId);
  const entrada = plan.actividades.find(a => a.id === id);
  if (!entrada) return false;

  const numero = Number(valor);
  if (valor === null || valor === '' || isNaN(numero)) delete entrada.umbral;
  else entrada.umbral = Math.max(0, Math.round(numero));

  return setPlanFormativo(fichaId, plan);
}

/* ── Lectura para el aprendiz ── */

/* Qué hace el aprendiz con cada tipo de material. El verbo
   es lo que va en el botón de la lista. */
function accionDeTipo(tipo) {
  const acciones = {
    'Cuestionario':     'Presentar el cuestionario',
    'Cuestionario 30':  'Presentar el cuestionario',
    'Actividad':        'Jugar la actividad',
    'Juego de parejas': 'Jugar la actividad',
    'Video':            'Ver el video',
    'English practice': 'Practicar en inglés',
    'Ejemplos':         'Consultar los ejemplos',
    'Diccionario':      'Consultar el diccionario'
  };
  return acciones[tipo] || 'Abrir el material';
}

/* La ficha contra la que juega quien tiene la página abierta.
   Ya no hay rol invitado (iba a la ficha 2): todo aprendiz
   real juega contra su propia ficha. */
function fichaDeQuienJuega() {
  return FICHA_EN_CURSO;
}

/* El plan de la ficha cruzado con el catálogo, el desbloqueo
   del módulo y lo que este aprendiz lleva hecho. Es lo que
   se pinta en «Reportar evidencia de aprendizaje». */
function contenidoAsignado(fichaId, marcas) {
  const plan = getPlanFormativo(fichaId);
  const hechas = marcas || {};
  const ganados = puntosAcumulados(hechas);
  const automaticos = umbralesAutomaticos(fichaId);
  const nivelEnModulo = {};

  return actividadesEnOrden(fichaId).map(par => {
    const actividad = par.actividad;
    const entrada = par.entrada;
    const marca = hechas[actividad.id];

    nivelEnModulo[actividad.modulo] = (nivelEnModulo[actividad.modulo] || 0) + 1;

    const propio  = typeof entrada.umbral === 'number';
    const umbral  = propio ? entrada.umbral : (automaticos[actividad.id] || 0);
    const abierto = plan.modulos.indexOf(actividad.modulo) !== -1;  // llave del instructor
    const alcanzado = ganados >= umbral;                            // llave de puntos

    return {
      id: actividad.id,
      titulo: actividad.titulo,
      modulo: actividad.modulo,
      tipo: actividad.tipo,
      ruta: actividad.ruta,
      puntua: actividad.puntua,
      maximo: actividad.maximo || 0,
      accion: accionDeTipo(actividad.tipo),
      nivel: nivelEnModulo[actividad.modulo],
      umbral: umbral,
      umbralPropio: propio,
      abierto: abierto,
      alcanzado: alcanzado,
      accesible: abierto && alcanzado,        // hacen falta las dos llaves
      faltan: Math.max(0, umbral - ganados),
      asignada: entrada.asignada,
      por: entrada.por,
      hecha: Boolean(marca),
      puntos: marca ? (marca.mejor || 0) : 0,
      intentos: marca ? (marca.intentos || 0) : 0,
      fecha: marca ? marca.fecha : ''
    };
  });
}

/* Puntos que lleva sumados quien juega. Se acumulan sin tope:
   cada actividad aporta su mejor puntaje. */
function puntosAcumulados(marcas) {
  const hechas = marcas || {};
  return Object.keys(hechas).reduce((total, id) => total + (hechas[id].mejor || 0), 0);
}
