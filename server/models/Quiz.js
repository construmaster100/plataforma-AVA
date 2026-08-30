const mongoose = require("mongoose");

/* Banco de preguntas del "Módulo 4": cada RAA (par RA-AA) puede tener hasta
   4 módulos propios (a diferencia del viejo esquema M1-M4 basado en
   archivos, este vive en Mongo). Cada módulo es un Quiz (10 preguntas) o
   una Evaluación (30 preguntas); cada pregunta es Verdadero/Falso (2
   opciones) o de 4 opciones con una correcta. Es la única fuente del
   sistema de puntaje ponderado (ver GET /api/quizzes/puntaje/:cedula). */
const preguntaSchema = new mongoose.Schema(
  {
    texto: { type: String, required: true, trim: true },
    tipo: { type: String, enum: ["vf", "opciones"], required: true },
    opciones: { type: [String], required: true },
    respuestaCorrecta: { type: Number, required: true, min: 0 },
    puntos: { type: Number, required: true, min: 1, default: 1 },
  },
  { _id: false }
);

const quizSchema = new mongoose.Schema(
  {
    ficha: { type: String, required: true, trim: true },
    raId: { type: Number, required: true, min: 1, max: 72 },
    aa: { type: Number, required: true, min: 1 },
    modulo: { type: Number, required: true, min: 1, max: 4 },
    tipo: { type: String, enum: ["quiz", "evaluacion"], required: true },
    preguntas: { type: [preguntaSchema], required: true },
    // Suma de preguntas[].puntos — se recalcula en cada guardado (ver POST en
    // server/routes/quizzes.js) para no tener que traer el array completo de
    // preguntas solo para calcular el puntaje ponderado (GET /puntaje/:cedula).
    puntajeMaximo: { type: Number, required: true, min: 1 },
    // 0 = sin límite / intentos ilimitados.
    limiteTiempoMinutos: { type: Number, min: 0, default: 0 },
    intentosPermitidos: { type: Number, min: 0, default: 0 },
    creadoPor: { type: String, trim: true },
  },
  { timestamps: true }
);
quizSchema.index({ ficha: 1, raId: 1, aa: 1, modulo: 1 }, { unique: true });

module.exports = mongoose.model("Quiz", quizSchema);
