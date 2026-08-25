/* ══════════════════════════════════════════
   SGMA-ADSO — Fichas de aprendizaje virtual (fichas N)

   Dos clases de ficha conviven:

     · 3293836 — ficha real y estática. Tecnólogo, a cargo de
       Zulma Salas, con su material en docs/Fichas/ADSO 3293836. Ya
       tiene su asignación: no se le rearma el currículo.

     · Ficha 2 en adelante — fichas N, plantillas para montar
       cursos nuevos. Cada una lleva exactamente cuatro
       módulos del catálogo y hasta treinta y cinco cupos, nombrados
       «Aprendiz 1» … «Aprendiz 35». Ahí se ensayan los
       módulos nuevos antes de llevarlos a una ficha real.

   Depende de:
     · ficha.js → leerAlmacen, guardarAlmacen, FICHA_EN_CURSO, FICHA_NUEVA_ID
══════════════════════════════════════════ */

const CLAVE_FICHAS_N = 'sgma_fichas_n';

/* Cuatro módulos hacen una ficha de aprendizaje virtual */
const MODULOS_POR_FICHA = 4;
const CUPOS_POR_FICHA = 35;

const NIVELES_FICHA = ['Técnico', 'Tecnólogo'];

/* La ficha 2 existe desde el principio: es la plantilla madre */
const FICHAS_N_INICIALES = [
  {
    id: FICHA_NUEVA_ID,
    nombre: 'Ficha modelo — cursos nuevos',
    nivel: 'Tecnólogo',
    instructor: 'Andrés Holguín',
    creada: ''
  }
];

function getFichasN() {
  const guardadas = leerAlmacen(CLAVE_FICHAS_N, null);
  return Array.isArray(guardadas) && guardadas.length ? guardadas : FICHAS_N_INICIALES.slice();
}

function setFichasN(lista) {
  return guardarAlmacen(CLAVE_FICHAS_N, lista);
}

function buscarFichaN(id) {
  return getFichasN().find(f => String(f.id) === String(id)) || null;
}

/* La ficha real no se toca: ni se edita su currículo ni se borra */
function fichaEsEstatica(id) {
  return String(id) === String(FICHA_EN_CURSO);
}

/* El siguiente número libre a partir de la ficha 2 */
function proximoIdFichaN() {
  const usados = getFichasN()
    .map(f => Number(f.id))
    .filter(n => !isNaN(n));
  return String(usados.length ? Math.max.apply(null, usados) + 1 : Number(FICHA_NUEVA_ID));
}

function crearFichaN(nombre, nivel, instructor) {
  const lista = getFichasN();
  const ficha = {
    id: proximoIdFichaN(),
    nombre: (nombre || '').trim() || 'Ficha sin nombre',
    nivel: NIVELES_FICHA.indexOf(nivel) === -1 ? 'Tecnólogo' : nivel,
    instructor: (instructor || '').trim() || 'Por asignar',
    creada: new Date().toISOString()
  };

  lista.push(ficha);
  setFichasN(lista);
  return ficha;
}

function editarFichaN(id, cambios) {
  const lista = getFichasN();
  const ficha = lista.find(f => String(f.id) === String(id));
  if (!ficha) return null;

  if (typeof cambios.nombre === 'string') ficha.nombre = cambios.nombre.trim() || ficha.nombre;
  if (NIVELES_FICHA.indexOf(cambios.nivel) !== -1) ficha.nivel = cambios.nivel;
  if (typeof cambios.instructor === 'string') ficha.instructor = cambios.instructor.trim() || ficha.instructor;

  setFichasN(lista);
  return ficha;
}

/* No se borra la ficha 2: es la plantilla de la que salen las demás */
function eliminarFichaN(id) {
  if (String(id) === String(FICHA_NUEVA_ID)) return false;
  const lista = getFichasN().filter(f => String(f.id) !== String(id));
  return setFichasN(lista);
}

/* ── Cupos ── */

/* Los nombres de práctica de la ficha: Aprendiz 1 … Aprendiz 35.
   Coincide con las carpetas de docs/Fichas/Ficha n/ */
function cuposDeFichaN(id) {
  const ficha = buscarFichaN(id);
  if (!ficha) return [];
  return Array.from({ length: CUPOS_POR_FICHA }, (_, i) => 'Aprendiz ' + (i + 1));
}

/* ── Todas las fichas del sistema, para los selectores ── */

function fichasParaSelector() {
  const lista = [{
    id: FICHA_EN_CURSO,
    nombre: 'ADSO ' + FICHA_EN_CURSO + ' — Zulma Salas',
    nivel: 'Tecnólogo',
    instructor: 'Zulma Salas',
    estatica: true
  }];

  getFichasN().forEach(ficha => {
    lista.push({
      id: ficha.id,
      nombre: 'Ficha ' + ficha.id + ' — ' + ficha.nombre,
      nivel: ficha.nivel,
      instructor: ficha.instructor,
      estatica: false
    });
  });

  return lista;
}
