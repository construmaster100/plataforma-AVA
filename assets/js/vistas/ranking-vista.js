/* ══════════════════════════════════════════
   SGMA-ADSO — Vista de ranking de puntos

   Pinta:
     · sec-ranking     (aprendiz, 3.Resultados) — mi puesto resaltado
     · sec-ranking-ins (instructor, solo lectura) — ficha activa

   Depende de:
     · ranking.js → calcularRanking(fichaId)
     · ficha.js   → FICHA_EN_CURSO
══════════════════════════════════════════ */

function filaRanking(fila, claveResaltar) {
  const tr = document.createElement('tr');
  if (claveResaltar && fila.clave === claveResaltar) tr.className = 'row-alert';

  [String(fila.puesto), fila.nombre, String(fila.base), String(fila.bonoModulos),
    String(fila.penalizaciones), String(fila.total)].forEach(valor => {
    const celda = document.createElement('td');
    celda.textContent = valor;
    tr.appendChild(celda);
  });
  return tr;
}

function pintarRankingAprendiz() {
  const cuerpo = document.getElementById('ranking-tbody');
  if (!cuerpo || typeof calcularRanking !== 'function') return;

  const fichaId = typeof fichaDeQuienJuega === 'function' ? fichaDeQuienJuega() : FICHA_EN_CURSO;
  const miClave = typeof identidadActual === 'function' ? identidadActual().clave : '';
  const filas = calcularRanking(fichaId);

  cuerpo.replaceChildren();
  filas.forEach(fila => cuerpo.appendChild(filaRanking(fila, miClave)));
}

function pintarRankingInstructor() {
  const cuerpo = document.getElementById('ranking-ins-tbody');
  if (!cuerpo || typeof calcularRanking !== 'function') return;

  const fichaId = typeof getFichaInstructor === 'function' ? getFichaInstructor() : FICHA_EN_CURSO;
  const filas = calcularRanking(fichaId);

  cuerpo.replaceChildren();
  filas.forEach(fila => cuerpo.appendChild(filaRanking(fila, null)));
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('ranking-tbody')) pintarRankingAprendiz();
  if (document.getElementById('ranking-ins-tbody')) pintarRankingInstructor();
});
