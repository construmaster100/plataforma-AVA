const mongoose = require("mongoose");

// A diferencia de Participante (que se sobrescribe con upsert para reflejar
// el estado "en vivo" de la partida), cada documento de Reporte es inmutable
// y se crea una vez por evaluación finalizada. Es la fuente del tablero de
// puntuaciones: así el ranking no se pierde ni se reordena cuando
// admin_reiniciar() resetea el progreso en vivo para un nuevo grupo.
const reporteSchema = new mongoose.Schema(
  {
    jugadorId: { type: String, required: true },
    nombre: { type: String, required: true },
    color: { type: String, required: true },
    aciertos: { type: Number, required: true },
    desaciertos: { type: Number, required: true },
    score: { type: Number, required: true },
    totalPreguntas: { type: Number, required: true },
    finalizadoEn: { type: Number, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Reporte", reporteSchema);
