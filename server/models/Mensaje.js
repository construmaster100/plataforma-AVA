const mongoose = require("mongoose");

/* Persistencia real de los mensajes que hoy solo viven en localStorage
   (assets/js/estado/mensajeria.js, clave sgma_correos) — ese archivo
   documenta explícitamente que "no hay servidor" y que entre equipos
   distintos haría falta un backend. Este modelo es ese backend: no
   reemplaza localStorage (que sigue funcionando entre pestañas del
   mismo navegador vía el evento storage), lo complementa para que el
   mensaje también llegue entre equipos y, si se indica un correo real,
   dispare una notificación por email. */
const mensajeSchema = new mongoose.Schema(
  {
    de: { type: String, required: true, trim: true },
    deRol: { type: String, required: true, trim: true },
    para: { type: String, required: true, trim: true },
    paraRol: { type: String, required: true, trim: true },
    asunto: { type: String, trim: true, default: "" },
    cuerpo: { type: String, required: true, trim: true },
    leido: { type: Boolean, default: false },
    correoEnviado: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Mensaje", mensajeSchema);
