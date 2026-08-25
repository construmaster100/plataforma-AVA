const mongoose = require("mongoose");

// Un documento por cada vez que un nuevo reporte supera el mejor score visto
// hasta ese momento (un "récord"). Es el historial de quién fue llegando a la
// cima del ranking, ordenado del más reciente al más antiguo.
const recordHistorialSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true },
    color: { type: String, required: true },
    score: { type: Number, required: true },
    aciertos: { type: Number, required: true },
    alcanzadoEn: { type: Number, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("RecordHistorial", recordHistorialSchema);
