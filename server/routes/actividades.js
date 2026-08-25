const express = require("express");
const fs = require("fs");
const path = require("path");
const router = express.Router();

const ROOT = path.join(__dirname, "..", "..");
const BASE_DIR = path.join(ROOT, "pages", "Fichas Tecnicos y tecnologos");
const TOTAL_RA = 72;

/* El catálogo no vive en Mongo: se lee en vivo del filesystem real,
   pages/Fichas Tecnicos y tecnologos/{ficha}/RA{n}/AA{m}/M4/*.html — una
   carpeta por ficha (hoy "Analisis y desarrollo de software-Resultados de
   Aprendizaje" y "English coding"), y dentro de cada una el mismo árbol
   RA1..72 × AA1..4 × M1..4 que ya usa el instructor. Una RA/AA sin M4 (o
   sin ningún .html adentro) simplemente no aparece: la casilla existe
   como carpeta, pero no como actividad presentable todavía. */
function fichaIdDesdeNombre(nombreCarpeta) {
  return /english/i.test(nombreCarpeta) ? "english" : "adso";
}

function escanearCatalogo() {
  const filas = [];
  if (!fs.existsSync(BASE_DIR)) return filas;

  fs.readdirSync(BASE_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .forEach((fichaDir) => {
      const fichaId = fichaIdDesdeNombre(fichaDir.name);
      const fichaPath = path.join(BASE_DIR, fichaDir.name);

      fs.readdirSync(fichaPath, { withFileTypes: true })
        .filter((d) => d.isDirectory() && /^RA\d+$/i.test(d.name))
        .forEach((raDir) => {
          const raId = Number(raDir.name.replace(/^RA/i, ""));
          if (raId < 1 || raId > TOTAL_RA) return;
          const raPath = path.join(fichaPath, raDir.name);

          fs.readdirSync(raPath, { withFileTypes: true })
            .filter((d) => d.isDirectory() && /^AA\d+$/i.test(d.name))
            .forEach((aaDir) => {
              const actividadIndex = Number(aaDir.name.replace(/^AA/i, ""));
              const m4Path = path.join(raPath, aaDir.name, "M4");
              if (!fs.existsSync(m4Path)) return;

              const archivo = fs.readdirSync(m4Path).find((f) => f.toLowerCase().endsWith(".html"));
              if (!archivo) return;

              const raTexto = String(raId).padStart(2, "0");
              const rutaRelativa = ["pages", fichaDir.name, raDir.name, aaDir.name, "M4", archivo].join("/");
              filas.push({
                ficha: fichaId,
                fichaNombre: fichaDir.name,
                raId,
                actividadIndex,
                tipo: "quiz",
                titulo: `RA-${raTexto} · Actividad ${actividadIndex}`,
                cuestionarioId: `${fichaId}-ra-${raTexto}-act-${actividadIndex}`,
                embebidoUrl: "/" + rutaRelativa.split("/").map(encodeURIComponent).join("/"),
              });
            });
        });
    });

  filas.sort((a, b) => a.ficha.localeCompare(b.ficha) || a.raId - b.raId || a.actividadIndex - b.actividadIndex);
  return filas;
}

router.get("/", (req, res) => {
  try {
    res.json(escanearCatalogo());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
