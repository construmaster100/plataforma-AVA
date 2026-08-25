const assert = require("assert");
const { EvaluationState, TOTAL_PREGUNTAS } = require("../game-server/gameState");
const { PREGUNTAS } = require("../game-server/questions");

// Responde las TOTAL_PREGUNTAS preguntas del cuestionario para un
// participante, acertando las primeras "aciertosDeseados" y fallando el
// resto, hasta que finalizado quede en true.
function completarEvaluacion(estado, jugadorId, aciertosDeseados) {
  for (let i = 0; i < TOTAL_PREGUNTAS; i++) {
    const pregunta = PREGUNTAS[i];
    const opcionCorrecta = pregunta.respuestaCorrecta;
    const opcionIncorrecta = pregunta.opciones.find((o) => o.id !== opcionCorrecta).id;
    const opcionId = i < aciertosDeseados ? opcionCorrecta : opcionIncorrecta;
    const resultado = estado.responder(jugadorId, pregunta.id, opcionId);
    assert(resultado.ok, `responder pregunta ${pregunta.id} debe aceptarse`);
  }
}

(() => {
  const estado = new EvaluationState();

  const j1 = estado.unirse({ nombre: "Ana", color: "rojo", socketId: "s1" });
  assert(j1.ok, "Ana se une");
  completarEvaluacion(estado, j1.participante.id, 20);

  assert.strictEqual(estado.reportes.length, 1, "la primera evaluación finalizada crea un reporte");
  assert.strictEqual(estado.ranking()[0].nombre, "Ana", "Ana encabeza el ranking con 20 aciertos");
  assert.strictEqual(estado.historialRecords().length, 1, "el primer reporte finalizado siempre es un nuevo récord");
  assert.strictEqual(estado.historialRecords()[0].nombre, "Ana", "el récord registrado es el de Ana");

  const j2 = estado.unirse({ nombre: "Beto", color: "azul", socketId: "s2" });
  assert(j2.ok, "Beto se une");
  completarEvaluacion(estado, j2.participante.id, 15);

  assert.strictEqual(estado.reportes.length, 2, "cada nuevo usuario que finaliza agrega su propio reporte");
  assert.strictEqual(estado.ranking()[0].nombre, "Ana", "Beto no supera a Ana: el ranking no cambia de líder");
  assert.strictEqual(estado.historialRecords().length, 1, "un score menor al récord actual no genera una entrada nueva");

  // admin_reiniciar(): el progreso en vivo se resetea para un nuevo grupo,
  // pero el tablero histórico (reportes + récords) debe seguir intacto —
  // esa es la "estabilidad" pedida: reiniciar no borra el ranking acumulado.
  estado.reiniciar();
  assert.strictEqual(estado.reportes.length, 2, "reiniciar() no borra el historial de reportes");
  assert.strictEqual(estado.historialRecords().length, 1, "reiniciar() no borra el historial de récords");
  assert.strictEqual(estado.ranking()[0].nombre, "Ana", "el ranking histórico sigue mostrando a Ana tras reiniciar");
  assert.strictEqual(
    estado.participantes.get(j1.participante.id).finalizado,
    false,
    "reiniciar() sí resetea el progreso en vivo para permitir una nueva ronda"
  );

  // Beto retoma la evaluación en la nueva ronda y esta vez supera a Ana: se
  // registra un nuevo reporte (no se sobrescribe el anterior) y un nuevo
  // récord al frente del historial (del más reciente al más antiguo).
  completarEvaluacion(estado, j2.participante.id, 25);

  assert.strictEqual(estado.reportes.length, 3, "retomar la evaluación agrega un tercer reporte, no reemplaza el anterior");
  assert.strictEqual(estado.ranking()[0].nombre, "Beto", "Beto ahora encabeza el ranking con 25 aciertos");
  assert.strictEqual(estado.historialRecords().length, 2, "superar el récord anterior agrega una nueva entrada histórica");
  assert.strictEqual(estado.historialRecords()[0].nombre, "Beto", "el récord más reciente (Beto) queda primero en el historial");
  assert.strictEqual(estado.historialRecords()[1].nombre, "Ana", "el récord anterior (Ana) se conserva después del más reciente");

  console.log("Todas las verificaciones de historial/estabilidad terminaron correctamente.");
})();
