const mongoose = require("mongoose");

/* Configuración por ficha/tecnólogo, asignada por el instructor/administrador
   (ya no hay un total de RA ni una escala de puntaje fijos en el código —
   ver server/routes/quizzes.js). El número real de RAA de una ficha se
   deriva de cuántos tienen contenido creado (progresivo: RA1, RA2, RA3...),
   nunca de un total declarado de antemano. */
const fichaConfigSchema = new mongoose.Schema(
  {
    ficha: { type: String, required: true, trim: true, unique: true },
    puntajeObjetivo: { type: Number, required: true, min: 1, default: 1000 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("FichaConfig", fichaConfigSchema);
