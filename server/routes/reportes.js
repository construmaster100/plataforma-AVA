const express = require("express");
const router = express.Router();
const { construirPortafolio, portafolioExcel, portafolioPDF, portafolioWord } = require("../services/portafolio");

/* Portafolio del instructor en un solo documento: juicios de evaluación
   (Aprobado/No aprobado/Sin presentar por RA, calculados de Mongo) más
   asistencia (que hoy solo vive en localStorage del navegador — la manda
   el cliente en el cuerpo). No es carga automática a SOFIA Plus: es un
   reporte exportable en Excel, PDF o Word a partir de los datos reales
   de la ficha, tal como lo pide RF13-1/RF13-2 del documento de requisitos. */
router.post("/portafolio", async (req, res) => {
  try {
    const { ficha, instructor, aprendices, formato } = req.body;
    if (!ficha || !instructor || !Array.isArray(aprendices) || !aprendices.length) {
      return res.status(400).json({ error: "ficha, instructor y aprendices (no vacío) son obligatorios" });
    }

    const datos = await construirPortafolio({ ficha, instructor, aprendices });

    if (formato === "pdf") {
      const buffer = await portafolioPDF(datos);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="portafolio-${ficha}.pdf"`);
      return res.send(buffer);
    }
    if (formato === "word") {
      const buffer = await portafolioWord(datos);
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      );
      res.setHeader("Content-Disposition", `attachment; filename="portafolio-${ficha}.docx"`);
      return res.send(buffer);
    }

    const buffer = await portafolioExcel(datos);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="portafolio-${ficha}.xlsx"`);
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
