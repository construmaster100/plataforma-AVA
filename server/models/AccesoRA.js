const mongoose = require("mongoose");

/* Qué RA puede ver/presentar cada aprendiz, más allá de los 5 primeros
   (que están abiertos para todos por defecto — ver GET /api/acceso/:cedula
   en server/routes/acceso.js). Solo el instructor otorga estos accesos. */
const accesoSchema = new mongoose.Schema(
  {
    cedula: { type: String, required: true, trim: true },
    raId: { type: Number, required: true, min: 1, max: 72 },
    habilitadoPor: { type: String, default: "instructor" },
  },
  { timestamps: true }
);
accesoSchema.index({ cedula: 1, raId: 1 }, { unique: true });

module.exports = mongoose.model("AccesoRA", accesoSchema);
