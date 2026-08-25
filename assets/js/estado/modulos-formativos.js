/* ══════════════════════════════════════════
   SGMA-ADSO — Módulos formativos de cuatro partes

   Cuidado con el nombre: aquí «módulo» NO es uno de los diez
   del catálogo de embebidos (Python, Java…). Es una unidad
   creable —por ejemplo «Python en inglés»— con:

     · las cuatro partes fijas: Contenido, Práctica,
       Evaluación y Evidencia,
     · una ficha a la que pertenece,
     · un instructor propio, que puede no ser el titular de
       la ficha: cada módulo puede tener el suyo,
     · un resultado de aprendizaje que valida.

   A cada parte se le enganchan actividades del catálogo. El
   catálogo sigue siendo la fuente del material; esto es la
   capa curricular que lo organiza.

   La validación del RA es **manual**: el sistema calcula el
   avance, pero solo el instructor asignado al módulo lo da
   por aprobado, y queda constancia de quién y cuándo.

   Depende de:
     · ficha.js              → leerAlmacen, guardarAlmacen, FICHA_EN_CURSO, getAsignaciones()
     · embebidos-catalogo.js → EMBEBIDOS
══════════════════════════════════════════ */

const CLAVE_MODULOS_F = 'sgma_modulos_formativos';
const CLAVE_VALIDACIONES = 'sgma_validaciones_ra';

/* Las cuatro partes son fijas y en este orden */
const PARTES_MODULO = ['Contenido', 'Práctica', 'Evaluación', 'Evidencia'];

const ICONO_PARTE = {
  'Contenido':  '📘',
  'Práctica':   '⌨️',
  'Evaluación': '📝',
  'Evidencia':  '📤'
};

function partesEnBlanco() {
  const partes = {};
  PARTES_MODULO.forEach(nombre => { partes[nombre] = []; });
  return partes;
}

/* ── Módulos ── */

const MODULOS_F_INICIALES = [
  {
    id: 'mf-python-en',
    nombre: 'Python en inglés',
    fichaId: '3293836',
    instructor: 'Zulma Salas',
    documento: '123456789',
    ra: 'RA-02',
    creadoPor: 'Sistema',
    creado: '',
    partes: {
      'Contenido':  ['ejemplos-python', 'diccionario-python'],
      'Práctica':   ['minijuego-comandos'],
      'Evaluación': ['cuestionario-python', 'english-python'],
      'Evidencia':  []
    }
  }
];

function getModulosFormativos() {
  const guardados = leerAlmacen(CLAVE_MODULOS_F, null);
  const lista = Array.isArray(guardados) && guardados.length
    ? guardados
    : MODULOS_F_INICIALES.slice();

  /* Un módulo viejo puede no traer las cuatro partes */
  return lista.map(modulo => {
    const partes = partesEnBlanco();
    PARTES_MODULO.forEach(nombre => {
      const guardada = modulo.partes && modulo.partes[nombre];
      if (Array.isArray(guardada)) partes[nombre] = guardada.slice();
    });
    return {
      id: modulo.id,
      nombre: modulo.nombre,
      fichaId: String(modulo.fichaId || FICHA_EN_CURSO),
      instructor: modulo.instructor || 'Por asignar',
      documento: modulo.documento || '',
      ra: modulo.ra || '',
      creadoPor: modulo.creadoPor || '',
      creado: modulo.creado || '',
      partes: partes
    };
  });
}

function setModulosFormativos(lista) {
  return guardarAlmacen(CLAVE_MODULOS_F, lista);
}

function buscarModuloFormativo(id) {
  return getModulosFormativos().find(m => m.id === id) || null;
}

function crearModuloFormativo(datos) {
  const lista = getModulosFormativos();
  const nuevo = {
    id: 'mf-' + Date.now().toString(36),
    nombre: (datos.nombre || '').trim(),
    fichaId: String(datos.fichaId || FICHA_EN_CURSO),
    instructor: (datos.instructor || '').trim() || 'Por asignar',
    documento: (datos.documento || '').trim(),
    ra: (datos.ra || '').trim(),
    creadoPor: datos.creadoPor || '',
    creado: new Date().toISOString(),
    partes: partesEnBlanco()
  };

  lista.push(nuevo);
  setModulosFormativos(lista);
  return nuevo;
}

function editarModuloFormativo(id, cambios) {
  const lista = getModulosFormativos();
  const modulo = lista.find(m => m.id === id);
  if (!modulo) return null;

  ['nombre', 'instructor', 'documento', 'ra'].forEach(campo => {
    if (typeof cambios[campo] === 'string' && cambios[campo].trim()) {
      modulo[campo] = cambios[campo].trim();
    }
  });
  if (cambios.fichaId) modulo.fichaId = String(cambios.fichaId);

  setModulosFormativos(lista);
  return modulo;
}

function eliminarModuloFormativo(id) {
  return setModulosFormativos(getModulosFormativos().filter(m => m.id !== id));
}

/* ── Actividades dentro de cada parte ── */

function alternarActividadEnParte(idModulo, parte, idActividad) {
  if (PARTES_MODULO.indexOf(parte) === -1) return false;

  const lista = getModulosFormativos();
  const modulo = lista.find(m => m.id === idModulo);
  if (!modulo) return false;

  const dentro = modulo.partes[parte];
  const puesto = dentro.indexOf(idActividad);
  if (puesto === -1) dentro.push(idActividad);
  else dentro.splice(puesto, 1);

  setModulosFormativos(lista);
  return puesto === -1;
}

/* Cuántas actividades tiene el módulo repartidas entre sus partes */
function actividadesDelModulo(modulo) {
  const ids = [];
  PARTES_MODULO.forEach(parte => {
    modulo.partes[parte].forEach(id => { if (ids.indexOf(id) === -1) ids.push(id); });
  });
  return ids;
}

/* Un módulo está armado cuando sus cuatro partes tienen algo */
function moduloArmado(modulo) {
  return PARTES_MODULO.every(parte => modulo.partes[parte].length > 0);
}

function partesVacias(modulo) {
  return PARTES_MODULO.filter(parte => !modulo.partes[parte].length);
}

/* ── Avance del aprendiz ── */

/* Lo que un aprendiz lleva hecho de cada parte, según sus
   marcas de puntaje. No decide nada: solo informa. */
function avanceEnModulo(modulo, marcas) {
  const hechas = marcas || {};
  const detalle = {};
  let total = 0, logradas = 0;

  PARTES_MODULO.forEach(parte => {
    const ids = modulo.partes[parte];
    const cuantas = ids.filter(id => hechas[id]).length;
    detalle[parte] = { de: ids.length, hechas: cuantas };
    total += ids.length;
    logradas += cuantas;
  });

  return {
    detalle: detalle,
    total: total,
    hechas: logradas,
    completo: total > 0 && logradas === total,
    porcentaje: total ? Math.round(logradas / total * 100) : 0
  };
}

/* ── Validación del resultado de aprendizaje ── */

function getValidaciones() {
  const guardadas = leerAlmacen(CLAVE_VALIDACIONES, {});
  return guardadas && typeof guardadas === 'object' ? guardadas : {};
}

function getValidacion(claveAprendiz, idModulo) {
  const suyas = getValidaciones()[claveAprendiz];
  return (suyas && suyas[idModulo]) || null;
}

/* Solo el instructor valida. El sistema nunca lo hace solo. */
function validarResultado(claveAprendiz, idModulo, quien, nota) {
  const todas = getValidaciones();
  const suyas = todas[claveAprendiz] || {};
  const previa = suyas[idModulo];

  suyas[idModulo] = {
    estado: 'Aprobado',
    por: quien || 'Instructor',
    fecha: new Date().toISOString(),
    nota: (nota || '').trim(),
    intento: previa ? (previa.intento || 1) + 1 : 1
  };

  todas[claveAprendiz] = suyas;
  guardarAlmacen(CLAVE_VALIDACIONES, todas);
  return suyas[idModulo];
}

/* Rama que antes no existía: el instructor rechaza el RA y el
   aprendiz vuelve a un módulo de mejora para reintentarlo. */
function rechazarResultado(claveAprendiz, idModulo, quien, motivo) {
  const todas = getValidaciones();
  const suyas = todas[claveAprendiz] || {};
  const previa = suyas[idModulo];

  suyas[idModulo] = {
    estado: 'No aprobado',
    por: quien || 'Instructor',
    fecha: new Date().toISOString(),
    nota: (motivo || '').trim(),
    intento: previa ? (previa.intento || 1) + 1 : 1
  };

  todas[claveAprendiz] = suyas;
  guardarAlmacen(CLAVE_VALIDACIONES, todas);
  return suyas[idModulo];
}

function retirarValidacion(claveAprendiz, idModulo) {
  const todas = getValidaciones();
  const suyas = todas[claveAprendiz];
  if (!suyas || !suyas[idModulo]) return false;

  delete suyas[idModulo];
  todas[claveAprendiz] = suyas;
  return guardarAlmacen(CLAVE_VALIDACIONES, todas);
}

/* ── Plan de mejora automático ──

   Umbrales del prototipo (ajustables): si el avance del aprendiz
   en el módulo queda por debajo de UMBRAL_MEJORA_PORCENTAJE, o sus
   intentos acumulados superan UMBRAL_MEJORA_INTENTOS, y todavía no
   hay ninguna validación para ese [aprendiz, módulo] —ni humana ni
   automática—, se marca «No aprobado» sin que el instructor tenga
   que hacer clic. Nunca se pisa una decisión que ya existe: una vez
   que alguien (persona o sistema) decidió, el automático no vuelve
   a tocar ese par. Quien no ha intentado nada del módulo tampoco se
   marca — el umbral solo aplica a quien ya empezó. */

const UMBRAL_MEJORA_PORCENTAJE = 50;
const UMBRAL_MEJORA_INTENTOS = 5;

/* Ficha → [{nombre, clave}], por posición sobre getMatricula().
   Frágil si un administrador reordena la matrícula de la ficha
   (mismo límite ya aceptado en el resto del prototipo). */
function rosterConClave(fichaId) {
  const nombres = typeof getMatricula === 'function' ? getMatricula(fichaId) : [];
  return nombres.map((nombre, i) => ({ nombre: nombre, clave: 'aprendiz-' + i }));
}

function intentosEnModulo(modulo, marcas) {
  return actividadesDelModulo(modulo)
    .reduce((total, id) => total + ((marcas[id] && marcas[id].intentos) || 0), 0);
}

function evaluarPlanMejoraAutomatico(fichaId) {
  const modulos = getModulosFormativos().filter(m => m.fichaId === fichaId);
  if (!modulos.length) return [];

  const roster = rosterConClave(fichaId);
  const todosPuntajes = typeof leerPuntajes === 'function' ? leerPuntajes() : {};
  const marcados = [];

  modulos.forEach(modulo => {
    roster.forEach(aprendiz => {
      if (getValidacion(aprendiz.clave, modulo.id)) return; // ya hay una decisión, no se toca

      const marcas = todosPuntajes[aprendiz.clave] || {};
      const avance = avanceEnModulo(modulo, marcas);
      if (!avance.total || !avance.hechas) return; // no ha intentado nada del módulo

      const intentos = intentosEnModulo(modulo, marcas);
      const enRiesgo = avance.porcentaje < UMBRAL_MEJORA_PORCENTAJE || intentos > UMBRAL_MEJORA_INTENTOS;
      if (!enRiesgo) return;

      rechazarResultado(aprendiz.clave, modulo.id, 'Sistema (automático)',
        'Umbral de avance o intentos superado automáticamente (' + avance.porcentaje + '% · ' + intentos + ' intentos).');
      marcados.push({ clave: aprendiz.clave, nombre: aprendiz.nombre, moduloId: modulo.id });
    });
  });

  return marcados;
}

/* ── Instructores disponibles ── */

/* Los titulares de ficha más los que ya llevan algún módulo:
   así un módulo nuevo puede quedar en manos de alguien que
   no es titular de la ficha. */
function instructoresDisponibles() {
  const vistos = {};
  const lista = [];

  const agregar = (nombre, documento) => {
    const limpio = (nombre || '').trim();
    if (!limpio || vistos[limpio]) return;
    vistos[limpio] = true;
    lista.push({ nombre: limpio, documento: documento || '' });
  };

  if (typeof getAsignaciones === 'function') {
    getAsignaciones().forEach(a => agregar(a.nombre, a.documento));
  }
  getModulosFormativos().forEach(m => agregar(m.instructor, m.documento));

  return lista;
}
