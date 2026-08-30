const express = require("express");
const router = express.Router();
const AccesoRA = require("../models/AccesoRA");

const RA_ABIERTOS_POR_DEFECTO = [1, 2, 3, 4, 5];
// No es un total de RA declarado (los RA se crean progresivamente, sin
// límite fijo por ficha) — es solo el rango que reciben las cédulas de
// "acceso total" de prueba; el contenido real que exista es lo que
// termina importando en el frontend.
const RANGO_ACCESO_TOTAL_PRUEBA = 200;

// Semilla de esta fase: estos dos ya tienen las 72 desbloqueadas para
// probar el flujo completo. Todos los demás aprendices arrancan solo con
// los 5 primeros, y el instructor habilita el resto uno por uno.
const CEDULAS_CON_ACCESO_TOTAL = ["1049634950", "12341234"]; // Miguel Arturo Castro Pacheco, Usuario1 ("aprendiz 1")

// Qué RA puede ver un aprendiz: los 5 abiertos por defecto + lo que el
// instructor le haya habilitado explícitamente en AccesoRA.
router.get("/:cedula", async (req, res) => {
  try {
    const cedula = String(req.params.cedula);
    if (CEDULAS_CON_ACCESO_TOTAL.includes(cedula)) {
      const todos = Array.from({ length: RANGO_ACCESO_TOTAL_PRUEBA }, (_, i) => i + 1);
      return res.json({ unlocked: todos });
    }
    const otorgados = await AccesoRA.find({ cedula }).lean();
    const unlocked = new Set(RA_ABIERTOS_POR_DEFECTO);
    otorgados.forEach((a) => unlocked.add(a.raId));
    res.json({ unlocked: [...unlocked].sort((a, b) => a - b) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// El instructor habilita un RA puntual para un aprendiz.
router.post("/", async (req, res) => {
  try {
    const { cedula, raId } = req.body;
    if (!cedula || !raId) {
      return res.status(400).json({ error: "cedula y raId son obligatorios" });
    }
    const acceso = await AccesoRA.findOneAndUpdate(
      { cedula: String(cedula), raId: Number(raId) },
      { habilitadoPor: "instructor" },
      { new: true, upsert: true, runValidators: true }
    );
    res.status(201).json(acceso);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
