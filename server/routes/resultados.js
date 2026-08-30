const express = require("express");
const router = express.Router();
const Aprendiz = require("../models/Aprendiz");
const Resultado = require("../models/Resultado");
const Quiz = require("../models/Quiz");

// Reconoce el cuestionarioId que arma server/routes/quizzes.js
// (`${ficha}-ra-${raId}-aa-${aa}-mod-${modulo}`) para poder mirar, solo en
// ese caso, si ese módulo tiene un tope de intentos configurado.
const PATRON_CUESTIONARIO_QUIZ = /^(.+)-ra-(\d+)-aa-(\d+)-mod-(\d+)$/;

// Guarda el resultado de un cuestionario resuelto dentro de un módulo.
// Crea el aprendiz si todavía no existía (mismo criterio que el ingreso).
router.post("/", async (req, res) => {
  try {
    const { cedula, nombre, modulo, cuestionario, puntaje, totalPreguntas } = req.body;
    if (!cedula || !nombre || !modulo || !cuestionario || puntaje === undefined || totalPreguntas === undefined) {
      return res.status(400).json({
        error: "cedula, nombre, modulo, cuestionario, puntaje y totalPreguntas son obligatorios",
      });
    }

    const aprendiz = await Aprendiz.findOneAndUpdate(
      { cedula },
      { nombre, cedula },
      { new: true, upsert: true, runValidators: true }
    );

    // El tope de intentos que fija el instructor (server/routes/quizzes.js)
    // antes solo se respetaba en el navegador (quiz-dinamico-presentar.js) —
    // cualquiera que llamara a esta API directo podía saltárselo y seguir
    // sumando al score. Ahora, si el cuestionario corresponde a un módulo de
    // ese banco de preguntas con un tope configurado, se hace cumplir aquí
    // también, sea cual sea el cliente que reporte el resultado.
    const coincidencia = String(cuestionario).match(PATRON_CUESTIONARIO_QUIZ);
    if (coincidencia) {
      const [, ficha, raId, aa, moduloQuiz] = coincidencia;
      const quiz = await Quiz.findOne(
        { ficha, raId: Number(raId), aa: Number(aa), modulo: Number(moduloQuiz) },
        "intentosPermitidos"
      ).lean();
      if (quiz && quiz.intentosPermitidos > 0) {
        const intentosUsados = await Resultado.countDocuments({ aprendiz: aprendiz._id, cuestionario });
        if (intentosUsados >= quiz.intentosPermitidos) {
          return res.status(403).json({
            error: `Ya usaste tus ${quiz.intentosPermitidos} intento(s) permitido(s) para este módulo.`,
          });
        }
      }
    }

    const resultado = await Resultado.create({
      aprendiz: aprendiz._id,
      modulo,
      cuestionario,
      puntaje,
      totalPreguntas,
    });

    res.status(201).json(resultado);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reporte consolidado para el instructor: puntaje acumulado por aprendiz.
router.get("/reporte/instructor", async (req, res) => {
  try {
    const consolidado = await Resultado.aggregate([
      {
        $group: {
          _id: "$aprendiz",
          cuestionariosResueltos: { $sum: 1 },
          puntajeAcumulado: { $sum: "$puntaje" },
          totalPreguntas: { $sum: "$totalPreguntas" },
          ultimaFecha: { $max: "$createdAt" },
        },
      },
      { $sort: { ultimaFecha: -1 } },
    ]);

    const aprendices = await Aprendiz.find({
      _id: { $in: consolidado.map((fila) => fila._id) },
    });
    const porId = new Map(aprendices.map((a) => [String(a._id), a]));

    const reporte = consolidado.map((fila) => {
      const aprendiz = porId.get(String(fila._id));
      return {
        aprendiz: aprendiz ? aprendiz.nombre : "Desconocido",
        cedula: aprendiz ? aprendiz.cedula : null,
        cuestionariosResueltos: fila.cuestionariosResueltos,
        puntajeAcumulado: fila.puntajeAcumulado,
        totalPreguntas: fila.totalPreguntas,
        porcentaje: fila.totalPreguntas
          ? Math.round((fila.puntajeAcumulado / fila.totalPreguntas) * 100)
          : 0,
        ultimaFecha: fila.ultimaFecha,
      };
    });

    res.json(reporte);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Historial y puntaje acumulado de un aprendiz puntual.
router.get("/:cedula", async (req, res) => {
  try {
    const aprendiz = await Aprendiz.findOne({ cedula: req.params.cedula });
    if (!aprendiz) return res.status(404).json({ error: "Aprendiz no encontrado" });

    const historial = await Resultado.find({ aprendiz: aprendiz._id }).sort({ createdAt: -1 });

    const acumulado = historial.reduce(
      (acc, r) => {
        acc.puntaje += r.puntaje;
        acc.totalPreguntas += r.totalPreguntas;
        return acc;
      },
      { puntaje: 0, totalPreguntas: 0 }
    );

    res.json({
      aprendiz,
      historial,
      puntajeAcumulado: acumulado.puntaje,
      totalPreguntas: acumulado.totalPreguntas,
      porcentaje: acumulado.totalPreguntas
        ? Math.round((acumulado.puntaje / acumulado.totalPreguntas) * 100)
        : 0,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
