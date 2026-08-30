const express = require("express");
const router = express.Router();
const Quiz = require("../models/Quiz");
const Resultado = require("../models/Resultado");
const Aprendiz = require("../models/Aprendiz");
const FichaConfig = require("../models/FichaConfig");

/* "Módulo 4": banco de preguntas propio (Mongo), independiente del viejo
   esquema M1-M4 basado en archivos (server/routes/actividades.js). Es la
   única fuente del puntaje ponderado — ver GET /puntaje/:cedula más abajo.
   No hay un total de RA fijo ni una escala de puntaje fija: el instructor
   asigna un puntaje objetivo por ficha (FichaConfig) y el número de RAA se
   deriva de cuántos tienen al menos un módulo creado — se crean
   progresivamente (RA1, RA2, RA3...), nunca se declaran de antemano. */
const PUNTAJE_OBJETIVO_POR_DEFECTO = 1000;
const PREGUNTAS_REQUERIDAS_POR_TIPO = { quiz: 10, evaluacion: 30 };
const OPCIONES_REQUERIDAS_POR_TIPO_PREGUNTA = { vf: 2, opciones: 4 };

function cuestionarioId(ficha, raId, aa, modulo) {
  return `${ficha}-ra-${String(raId).padStart(2, "0")}-aa-${aa}-mod-${modulo}`;
}

// Puntaje objetivo de una ficha (lo asigna el instructor/administrador).
router.get("/config/:ficha", async (req, res) => {
  try {
    const config = await FichaConfig.findOne({ ficha: req.params.ficha }).lean();
    res.json({ ficha: req.params.ficha, puntajeObjetivo: config ? config.puntajeObjetivo : PUNTAJE_OBJETIVO_POR_DEFECTO });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/config", async (req, res) => {
  try {
    const { ficha, puntajeObjetivo } = req.body;
    if (!ficha || !Number.isFinite(Number(puntajeObjetivo)) || Number(puntajeObjetivo) < 1) {
      return res.status(400).json({ error: "ficha y puntajeObjetivo (≥ 1) son obligatorios" });
    }
    const config = await FichaConfig.findOneAndUpdate(
      { ficha },
      { ficha, puntajeObjetivo: Number(puntajeObjetivo) },
      { new: true, upsert: true, runValidators: true }
    );
    res.status(201).json(config);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Lista liviana de todos los módulos creados (listado del instructor).
router.get("/", async (req, res) => {
  try {
    const quizzes = await Quiz.find(
      {},
      "ficha raId aa modulo tipo preguntas puntajeMaximo limiteTiempoMinutos intentosPermitidos updatedAt"
    ).lean();
    res.json(
      quizzes.map((q) => ({
        ficha: q.ficha,
        raId: q.raId,
        aa: q.aa,
        modulo: q.modulo,
        tipo: q.tipo,
        maxPuntaje: q.puntajeMaximo,
        nPreguntas: q.preguntas.length,
        limiteTiempoMinutos: q.limiteTiempoMinutos,
        intentosPermitidos: q.intentosPermitidos,
        updatedAt: q.updatedAt,
      }))
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Puntaje ponderado de un aprendiz: cada RAA con módulos creados aporta
// (aciertos acumulados / máximo de lo creado) × (puntajeObjetivo de su ficha
// / cantidad de RAA que esa ficha tiene creados HOY). El peso por RAA se
// recalcula solo a medida que el instructor va creando más RAA — no hay
// que tocar código ni declarar un total de antemano. Un RAA sin ningún
// módulo creado no aparece (aporta 0 implícitamente).
router.get("/puntaje/:cedula", async (req, res) => {
  try {
    const cedula = String(req.params.cedula);
    const quizzes = await Quiz.find({}, "ficha raId aa modulo tipo puntajeMaximo").lean();
    if (!quizzes.length) {
      return res.json({ puntajeTotal: 0, escalaTotal: 0, porRAA: [] });
    }

    const aprendiz = await Aprendiz.findOne({ cedula }).lean();
    const historial = aprendiz
      ? await Resultado.find({ aprendiz: aprendiz._id }).lean()
      : [];
    // Se queda con el MEJOR puntaje de cada cuestionario, no el más reciente:
    // más intentos solo pueden ayudar, nunca bajar el puntaje ya ganado.
    const mejorPorCuestionario = new Map();
    historial.forEach((r) => {
      const previo = mejorPorCuestionario.get(r.cuestionario);
      if (!previo || r.puntaje > previo.puntaje) mejorPorCuestionario.set(r.cuestionario, r);
    });

    const porRAA = new Map();
    quizzes.forEach((q) => {
      const clave = `${q.ficha}|${q.raId}|${q.aa}`;
      if (!porRAA.has(clave)) porRAA.set(clave, { ficha: q.ficha, raId: q.raId, aa: q.aa, modulos: [] });
      porRAA.get(clave).modulos.push(q);
    });

    const totalRAACreadosPorFicha = new Map();
    porRAA.forEach((raa) => {
      totalRAACreadosPorFicha.set(raa.ficha, (totalRAACreadosPorFicha.get(raa.ficha) || 0) + 1);
    });

    const fichasPresentes = [...totalRAACreadosPorFicha.keys()];
    const configs = await FichaConfig.find({ ficha: { $in: fichasPresentes } }).lean();
    const objetivoPorFicha = new Map(configs.map((c) => [c.ficha, c.puntajeObjetivo]));

    let puntajeTotal = 0;
    const porRAAResultado = [...porRAA.values()].map((raa) => {
      const puntajeObjetivoFicha = objetivoPorFicha.get(raa.ficha) || PUNTAJE_OBJETIVO_POR_DEFECTO;
      const totalRAAFicha = totalRAACreadosPorFicha.get(raa.ficha);
      const pesoMaximo = puntajeObjetivoFicha / totalRAAFicha;

      let maxRAA = 0;
      let aciertosRAA = 0;
      const modulosDetalle = raa.modulos.map((m) => {
        const max = m.puntajeMaximo;
        maxRAA += max;
        const mejor = mejorPorCuestionario.get(cuestionarioId(raa.ficha, raa.raId, raa.aa, m.modulo));
        const aciertos = mejor ? mejor.puntaje : 0;
        aciertosRAA += aciertos;
        return { modulo: m.modulo, tipo: m.tipo, maxPuntaje: max, aciertos, presentado: Boolean(mejor) };
      });

      const fraccion = maxRAA > 0 ? aciertosRAA / maxRAA : 0;
      const puntosGanados = fraccion * pesoMaximo;
      puntajeTotal += puntosGanados;

      return { ficha: raa.ficha, raId: raa.raId, aa: raa.aa, pesoMaximo, puntosGanados, modulos: modulosDetalle };
    });

    porRAAResultado.sort((a, b) => a.ficha.localeCompare(b.ficha) || a.raId - b.raId || a.aa - b.aa);

    const escalaTotal = fichasPresentes.reduce(
      (suma, ficha) => suma + (objetivoPorFicha.get(ficha) || PUNTAJE_OBJETIVO_POR_DEFECTO),
      0
    );

    res.json({
      puntajeTotal: Math.round(puntajeTotal * 100) / 100,
      escalaTotal,
      porRAA: porRAAResultado,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Un módulo puntual (formulario de edición del instructor + motor de presentación).
router.get("/:ficha/:raId/:aa/:modulo", async (req, res) => {
  try {
    const { ficha, raId, aa, modulo } = req.params;
    const quiz = await Quiz.findOne({ ficha, raId: Number(raId), aa: Number(aa), modulo: Number(modulo) });
    if (!quiz) return res.status(404).json({ error: "Quiz no encontrado" });
    res.json(quiz);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Crea o reemplaza (upsert) un módulo — el instructor siempre guarda el set completo de preguntas.
router.post("/", async (req, res) => {
  try {
    const { ficha, raId, aa, modulo, tipo, preguntas, creadoPor } = req.body;
    const limiteTiempoMinutos = Number(req.body.limiteTiempoMinutos) || 0;
    const intentosPermitidos = Number(req.body.intentosPermitidos) || 0;
    if (!ficha || !raId || !aa || !modulo || !tipo || !Array.isArray(preguntas)) {
      return res.status(400).json({ error: "ficha, raId, aa, modulo, tipo y preguntas son obligatorios" });
    }
    if (Number(modulo) < 1 || Number(modulo) > 4) {
      return res.status(400).json({ error: "modulo debe estar entre 1 y 4" });
    }
    const requeridas = PREGUNTAS_REQUERIDAS_POR_TIPO[tipo];
    if (!requeridas) {
      return res.status(400).json({ error: 'tipo debe ser "quiz" (10 preguntas) o "evaluacion" (30 preguntas)' });
    }
    if (preguntas.length !== requeridas) {
      return res.status(400).json({ error: `${tipo} debe tener exactamente ${requeridas} preguntas` });
    }
    if (limiteTiempoMinutos < 0 || intentosPermitidos < 0) {
      return res.status(400).json({ error: "limiteTiempoMinutos e intentosPermitidos no pueden ser negativos" });
    }
    for (const p of preguntas) {
      const opcionesRequeridas = OPCIONES_REQUERIDAS_POR_TIPO_PREGUNTA[p.tipo];
      if (!opcionesRequeridas) {
        return res.status(400).json({ error: 'cada pregunta debe ser tipo "vf" o "opciones"' });
      }
      if (!Array.isArray(p.opciones) || p.opciones.length !== opcionesRequeridas) {
        return res.status(400).json({ error: `preguntas tipo ${p.tipo} deben tener ${opcionesRequeridas} opciones` });
      }
      if (typeof p.respuestaCorrecta !== "number" || p.respuestaCorrecta < 0 || p.respuestaCorrecta >= p.opciones.length) {
        return res.status(400).json({ error: "respuestaCorrecta inválida" });
      }
      if (!Number.isInteger(p.puntos) || p.puntos < 1) {
        return res.status(400).json({ error: "cada pregunta debe tener puntos (entero ≥ 1)" });
      }
    }

    const puntajeMaximo = preguntas.reduce((suma, p) => suma + p.puntos, 0);
    const quiz = await Quiz.findOneAndUpdate(
      { ficha, raId: Number(raId), aa: Number(aa), modulo: Number(modulo) },
      {
        ficha,
        raId: Number(raId),
        aa: Number(aa),
        modulo: Number(modulo),
        tipo,
        preguntas,
        puntajeMaximo,
        limiteTiempoMinutos,
        intentosPermitidos,
        creadoPor,
      },
      { new: true, upsert: true, runValidators: true }
    );
    res.status(201).json(quiz);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:ficha/:raId/:aa/:modulo", async (req, res) => {
  try {
    const { ficha, raId, aa, modulo } = req.params;
    await Quiz.findOneAndDelete({ ficha, raId: Number(raId), aa: Number(aa), modulo: Number(modulo) });
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
