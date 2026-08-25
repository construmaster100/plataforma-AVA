const express = require("express");
const fs = require("fs");
const path = require("path");
const router = express.Router();

const ROOT = path.join(__dirname, "..", "..");
const BASE_DIR = path.join(ROOT, "pages", "Fichas Tecnicos y tecnologos");
const TOTAL_RA = 72;

/* Puntaje máximo fijo por material (M = envío de reporte/tabla para
   aprobado): M1 = cuestionario 10 preguntas, M2 = unir palabras (20),
   M3 = verdadero/falso (15), M4 = el modelo de 30 preguntas. */
const MAX_PUNTAJE_POR_M = { 1: 10, 2: 20, 3: 15, 4: 30 };

/* El catálogo no vive en Mongo: se lee en vivo del filesystem real,
   pages/Fichas Tecnicos y tecnologos/{ficha}/RA{n}/AA{m}/M{k}/*.html —
   una carpeta por ficha (hoy "Analisis y desarrollo de software-Resultados
   de Aprendizaje" y "English coding"), y dentro de cada una el árbol
   RA × AA × M que va armando el instructor. Una RA/AA/M sin .html adentro
   simplemente no aparece: la casilla existe como carpeta, pero no como
   actividad presentable todavía. */
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
              const aaPath = path.join(raPath, aaDir.name);

              fs.readdirSync(aaPath, { withFileTypes: true })
                .filter((d) => d.isDirectory() && /^M[1-4]$/i.test(d.name))
                .forEach((mDir) => {
                  const materialIndex = Number(mDir.name.replace(/^M/i, ""));
                  const mPath = path.join(aaPath, mDir.name);
                  const archivo = fs.readdirSync(mPath).find((f) => f.toLowerCase().endsWith(".html"));
                  if (!archivo) return;

                  const raTexto = String(raId).padStart(2, "0");
                  const rutaRelativa = ["pages", fichaDir.name, raDir.name, aaDir.name, mDir.name, archivo].join("/");
                  filas.push({
                    ficha: fichaId,
                    fichaNombre: fichaDir.name,
                    raId,
                    actividadIndex,
                    materialIndex,
                    tipo: "quiz",
                    maxPuntaje: MAX_PUNTAJE_POR_M[materialIndex] || 30,
                    titulo: `RA-${raTexto} · AA${actividadIndex} · M${materialIndex}`,
                    cuestionarioId: `${fichaId}-ra-${raTexto}-aa-${actividadIndex}-m-${materialIndex}`,
                    embebidoUrl: "/" + rutaRelativa.split("/").map(encodeURIComponent).join("/"),
                  });
                });
            });
        });
    });

  filas.sort((a, b) => a.ficha.localeCompare(b.ficha) || a.raId - b.raId
    || a.actividadIndex - b.actividadIndex || a.materialIndex - b.materialIndex);
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
