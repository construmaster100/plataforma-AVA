/* ══════════════════════════════════════════
   SGMA-ADSO — Estado compartido de las fichas
   Lo que el administrador carga aquí lo leen el
   instructor y el aprendiz desde sus propios paneles.
══════════════════════════════════════════ */

const FICHAS_SISTEMA = {
  '3293836': {
    programa: 'Análisis y Desarrollo de Software',
    modalidad: 'Tecnólogo',
    jornada: 'Mañana',
    estado: 'Lectiva — Trimestre 2'
  },
  '2': {
    programa: 'Análisis y Desarrollo de Software',
    modalidad: 'Tecnólogo',
    jornada: 'Por definir',
    estado: 'Nueva, sin iniciar'
  }
};

const FICHA_EN_CURSO = '3293836';
const FICHA_NUEVA_ID = '2';

const CLAVES = {
  materiales: 'sgma_materiales',
  resultados: 'sgma_resultados',
  matricula:  'sgma_matricula',
  fichaInstructor: 'sgma_ficha_instructor',
  asignaciones: 'sgma_instructores',
  cursoActivo: 'sgma_curso_activo',
  cursoInstructor: 'sgma_curso_activo_instructor'
};

function leerAlmacen(clave, porDefecto) {
  try {
    const bruto = localStorage.getItem(clave);
    return bruto ? JSON.parse(bruto) : porDefecto;
  } catch (e) {
    return porDefecto;
  }
}

function guardarAlmacen(clave, valor) {
  try {
    localStorage.setItem(clave, JSON.stringify(valor));
    return true;
  } catch (e) {
    return false;
  }
}

/* ── Punto de partida antes de que el administrador cargue nada ── */
const MATERIALES_INICIALES = [
  { ficha: FICHA_EN_CURSO, nombre: 'Guía de aprendizaje 1 — Análisis de requisitos', tipo: 'PDF', fecha: '2026-06-01' },
  { ficha: FICHA_EN_CURSO, nombre: 'Plantilla de informe técnico', tipo: 'Word', fecha: '2026-06-03' },
  { ficha: FICHA_EN_CURSO, nombre: 'Modelado UML con StarUML', tipo: 'Video', fecha: '2026-06-08' }
];

const RESULTADOS_INICIALES = [
  { ficha: FICHA_EN_CURSO, codigo: 'RA-01', descripcion: 'Caracterizar los procesos de la organización de acuerdo con el software a construir.' },
  { ficha: FICHA_EN_CURSO, codigo: 'RA-02', descripcion: 'Recolectar información del software a construir según las necesidades del cliente.' },
  { ficha: FICHA_EN_CURSO, codigo: 'RA-03', descripcion: 'Establecer los requisitos del software de acuerdo con la información recolectada.' }
];

/* Cupo de las fichas N: «Aprendiz 1» … «Aprendiz 35». */
const APRENDICES_FICHA_NUEVA = 35;

/* ── Instructores del programa ──
   El documento es la identidad: con él entra cada uno y con
   él se decide qué puede tocar. */
const INSTRUCTORES = [
  { nombre: 'Zulma Salas',       documento: '123456789',   clave: 'zulmaSALAS3293836' },
  { nombre: 'Andrés Holguín',    documento: '543210',      clave: 'andresHOLGUIN2' },
  { nombre: 'Alejandra Calixto', documento: '9876543210',  clave: 'alejandraCALIXTO' },
  { nombre: 'Usuario Instructor', documento: '321321',     clave: 'intructor0' }
];

/* ── Qué ficha puede ver cada instructor/aprendiz ──
   "Ficha" aquí = pages/Fichas Tecnicos y tecnologos/{carpeta}, escaneada
   en vivo por server/routes/actividades.js ("adso" / "english"). Zulma
   solo ve ADSO, Alejandra solo English Coding, el administrador ve las
   dos. Todo aprendiz ve ADSO por defecto; Miguel Arturo Castro Pacheco y
   el aprendiz de prueba ("aprendiz 1") ven además English Coding. */
const FICHAS_POR_INSTRUCTOR = {
  '123456789': ['adso'],       // Zulma Salas
  '9876543210': ['english'],   // Alejandra Calixto
};
const FICHAS_ADMIN = ['adso', 'english'];

const FICHAS_EXTRA_APRENDIZ = {
  '1049634950': ['english'], // Miguel Arturo Castro Pacheco
  '12341234': ['english'],   // Usuario1 ("aprendiz 1")
};

function fichasDeInstructor(documento) {
  return FICHAS_POR_INSTRUCTOR[String(documento || '')] || ['adso'];
}

function fichasDeAprendiz(cedula) {
  return ['adso', ...(FICHAS_EXTRA_APRENDIZ[String(cedula || '')] || [])];
}

/* Un instructor puede venir de dos sitios: los del programa,
   que están aquí arriba, y los que el administrador da de
   alta al asignarlos a una ficha. Los segundos solo sirven
   para entrar si el administrador les puso clave. */
function buscarInstructor(documento) {
  const doc = String(documento || '').trim();
  if (!doc) return null;

  const delPrograma = INSTRUCTORES.find(i => i.documento === doc);
  if (delPrograma) return delPrograma;

  const asignado = getAsignaciones().find(a => String(a.documento) === doc && a.clave);
  if (asignado) {
    return {
      nombre: asignado.nombre,
      documento: String(asignado.documento),
      clave: asignado.clave,
      creadoPor: 'Administrador'
    };
  }

  return null;
}

/* Todos los que hoy podrían entrar como instructor */
function instructoresConAcceso() {
  const lista = INSTRUCTORES.slice();
  getAsignaciones().forEach(a => {
    if (!a.clave) return;
    if (lista.some(i => i.documento === String(a.documento))) return;
    lista.push({
      nombre: a.nombre,
      documento: String(a.documento),
      clave: a.clave,
      creadoPor: 'Administrador'
    });
  });
  return lista;
}

/* La 3293836 es de Zulma y la 2 quedó a cargo de Andrés.
   Alejandra no tiene ficha titular: entra por módulo formativo. */
const ASIGNACIONES_INICIALES = [
  { fichaId: FICHA_EN_CURSO, nombre: 'Zulma Salas',    documento: '123456789', jornada: 'Mañana' },
  { fichaId: FICHA_NUEVA_ID, nombre: 'Andrés Holguín', documento: '543210',    jornada: 'Por definir' }
];

/* El contenido formativo de la ficha en curso es exclusivo de
   su titular: los demás instructores la consultan, no la
   editan. Las fichas N quedan abiertas a su propio titular. */
const FICHAS_EXCLUSIVAS = [FICHA_EN_CURSO];

function titularDeFicha(fichaId) {
  const asignada = getAsignaciones().find(a => String(a.fichaId) === String(fichaId));
  return asignada || null;
}

/* ¿Puede este documento editar el contenido formativo de la ficha? */
function puedeEditarFicha(fichaId, documento) {
  const doc = String(documento || '').trim();
  if (!doc) return false;

  const titular = titularDeFicha(fichaId);
  if (FICHAS_EXCLUSIVAS.indexOf(String(fichaId)) !== -1) {
    return Boolean(titular && titular.documento === doc);
  }
  // Fuera de las exclusivas, basta con ser instructor reconocido
  return Boolean(buscarInstructor(doc));
}

/* ── Materiales del curso: los carga el administrador ── */
function getMateriales(fichaId) {
  const todos = leerAlmacen(CLAVES.materiales, MATERIALES_INICIALES);
  return fichaId ? todos.filter(m => m.ficha === fichaId) : todos;
}
function addMaterial(material) {
  const todos = leerAlmacen(CLAVES.materiales, MATERIALES_INICIALES);
  todos.push(material);
  return guardarAlmacen(CLAVES.materiales, todos);
}
function quitarMaterial(indice) {
  const todos = leerAlmacen(CLAVES.materiales, MATERIALES_INICIALES);
  todos.splice(indice, 1);
  return guardarAlmacen(CLAVES.materiales, todos);
}

/* ── Resultados de aprendizaje: los carga el administrador ── */
function getResultados(fichaId) {
  const todos = leerAlmacen(CLAVES.resultados, RESULTADOS_INICIALES);
  return fichaId ? todos.filter(r => r.ficha === fichaId) : todos;
}
function addResultado(resultado) {
  const todos = leerAlmacen(CLAVES.resultados, RESULTADOS_INICIALES);
  todos.push(resultado);
  return guardarAlmacen(CLAVES.resultados, todos);
}
function quitarResultado(indice) {
  const todos = leerAlmacen(CLAVES.resultados, RESULTADOS_INICIALES);
  todos.splice(indice, 1);
  return guardarAlmacen(CLAVES.resultados, todos);
}

/* ── Matrícula: el administrador vincula aprendices a la ficha ── */
function getMatricula(fichaId) {
  const todas = leerAlmacen(CLAVES.matricula, {});
  if (todas[fichaId]) return todas[fichaId];

  // Sin registro propio, la ficha parte de su nómina real
  if (fichaId === FICHA_EN_CURSO && typeof DIRECTORIO === 'object') {
    return DIRECTORIO.aprendices.map(a => a.apellidos + ', ' + a.nombres);
  }
  // La 2 y las fichas N que salgan de ella comparten los mismos cupos
  if (fichaId !== FICHA_EN_CURSO) {
    return Array.from({ length: APRENDICES_FICHA_NUEVA }, (_, i) => 'Aprendiz ' + (i + 1));
  }
  return [];
}
function setMatricula(fichaId, lista) {
  const todas = leerAlmacen(CLAVES.matricula, {});
  todas[fichaId] = lista;
  return guardarAlmacen(CLAVES.matricula, todas);
}

/* ── Instructores titulares de cada ficha ── */
function getAsignaciones() {
  return leerAlmacen(CLAVES.asignaciones, ASIGNACIONES_INICIALES);
}
function setAsignaciones(lista) {
  return guardarAlmacen(CLAVES.asignaciones, lista);
}

/* ── Ficha que el instructor tiene abierta ── */
function getFichaInstructor() {
  return leerAlmacen(CLAVES.fichaInstructor, FICHA_EN_CURSO);
}
function setFichaInstructor(fichaId) {
  return guardarAlmacen(CLAVES.fichaInstructor, fichaId);
}

/* ── Curso que el aprendiz tiene activo en su selector Ficha/Curso ──
   No es una ficha (id numérico): es el toggle ADSO / English Coding
   que decide qué contenido de práctica se muestra en 2.4/3.3. */
function getCursoActivo() {
  return leerAlmacen(CLAVES.cursoActivo, 'adso');
}
function setCursoActivo(curso) {
  return guardarAlmacen(CLAVES.cursoActivo, curso === 'english' ? 'english' : 'adso');
}

/* ── Curso que el instructor tiene activo en su propio selector ──
   Clave separada de la del aprendiz a propósito: en este prototipo
   el estado vive en localStorage por navegador, así que si un mismo
   navegador se usa para probar los tres roles, compartir la misma
   clave haría que el instructor cambiara en silencio lo que ve el
   aprendiz. Aquí es solo su vista previa de práctica (3.4). */
function getCursoInstructor() {
  return leerAlmacen(CLAVES.cursoInstructor, 'adso');
}
function setCursoInstructor(curso) {
  return guardarAlmacen(CLAVES.cursoInstructor, curso === 'english' ? 'english' : 'adso');
}
