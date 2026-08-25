/* ══════════════════════════════════════════
   SGMA-ADSO — Ranking de puntos por ficha

   Combina lo que cada aprendiz ya trae de los embebidos (mismo
   cálculo que resultados-ficha.js), un bono por cada módulo
   formativo aprobado voluntariamente, y un descuento por cada
   novedad reportada — así una novedad negativa se puede compensar
   con módulos aprobados de más, tal como pide el documento.

   Depende de:
     · embebidos-catalogo.js   → leerPuntajes
     · plan-formativo.js       → puntosAcumulados
     · modulos-formativos.js   → rosterConClave, getModulosFormativos, getValidacion
     · novedades.js            → getNovedades
══════════════════════════════════════════ */

const BONO_MODULO_APROBADO = 50;

const PENALIZACION_NOVEDAD = {
  'Falta leve': -5,
  'Falta grave': -15,
  'Inasistencia': -10,
  'Incumplimiento': -10,
  'Lenguaje o conducta inadecuada': -15
};

function puntosBaseDeClave(clave) {
  const marcas = (typeof leerPuntajes === 'function' ? leerPuntajes() : {})[clave] || {};
  return typeof puntosAcumulados === 'function' ? puntosAcumulados(marcas) : 0;
}

function bonoModulosDeAprendiz(fichaId, clave) {
  if (typeof getModulosFormativos !== 'function' || typeof getValidacion !== 'function') return 0;
  const modulos = getModulosFormativos().filter(m => m.fichaId === fichaId);
  const aprobados = modulos.filter(m => {
    const v = getValidacion(clave, m.id);
    return v && v.estado === 'Aprobado';
  });
  return aprobados.length * BONO_MODULO_APROBADO;
}

function penalizacionesDeAprendiz(fichaId, nombre) {
  if (typeof getNovedades !== 'function') return 0;
  return getNovedades()
    .filter(n => n.fichaId === fichaId && n.aprendiz === nombre)
    .reduce((total, n) => total + (PENALIZACION_NOVEDAD[n.tipo] || 0), 0);
}

function calcularRanking(fichaId) {
  const roster = typeof rosterConClave === 'function' ? rosterConClave(fichaId) : [];

  const filas = roster.map(a => {
    const base = puntosBaseDeClave(a.clave);
    const bonoModulos = bonoModulosDeAprendiz(fichaId, a.clave);
    const penalizaciones = penalizacionesDeAprendiz(fichaId, a.nombre);
    const total = base + bonoModulos + penalizaciones;
    return { clave: a.clave, nombre: a.nombre, base, bonoModulos, penalizaciones, total };
  });

  filas.sort((x, y) => y.total - x.total);
  filas.forEach((fila, i) => { fila.puesto = i + 1; });
  return filas;
}
