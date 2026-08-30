const ExcelJS = require("exceljs");
const PDFDocument = require("pdfkit");
const { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, HeadingLevel } = require("docx");
const Quiz = require("../models/Quiz");
const Resultado = require("../models/Resultado");
const Aprendiz = require("../models/Aprendiz");
const FichaConfig = require("../models/FichaConfig");

const PUNTAJE_OBJETIVO_POR_DEFECTO = 1000;
const UMBRAL_APROBACION = 0.6;

function cuestionarioId(ficha, raId, aa, modulo) {
  return `${ficha}-ra-${String(raId).padStart(2, "0")}-aa-${aa}-mod-${modulo}`;
}

/* Mismo cálculo de puntaje ponderado que GET /api/quizzes/puntaje/:cedula
   (server/routes/quizzes.js), pero devuelto como juicio de evaluación
   (Aprobado / No aprobado / Sin presentar) por RAA — lo que RF06-1..3 del
   documento de requisitos pide poder consultar y exportar, y lo que RF13-1
   pide poder llevar a un reporte. No se tocó la ruta original: esto es una
   lectura aparte, para no arriesgar el endpoint que ya usa el frontend. */
async function juiciosDeEvaluacion(ficha, cedula) {
  const quizzes = await Quiz.find({ ficha }, "ficha raId aa modulo tipo puntajeMaximo").lean();
  if (!quizzes.length) return { puntajeTotal: 0, escalaTotal: 0, juicios: [] };

  const aprendiz = await Aprendiz.findOne({ cedula }).lean();
  const historial = aprendiz
    ? await Resultado.find({ aprendiz: aprendiz._id }).sort({ createdAt: -1 }).lean()
    : [];
  const ultimoPorCuestionario = new Map();
  historial.forEach((r) => {
    if (!ultimoPorCuestionario.has(r.cuestionario)) ultimoPorCuestionario.set(r.cuestionario, r);
  });

  const porRAA = new Map();
  quizzes.forEach((q) => {
    const clave = `${q.raId}|${q.aa}`;
    if (!porRAA.has(clave)) porRAA.set(clave, { raId: q.raId, aa: q.aa, modulos: [] });
    porRAA.get(clave).modulos.push(q);
  });

  const config = await FichaConfig.findOne({ ficha }).lean();
  const puntajeObjetivo = config ? config.puntajeObjetivo : PUNTAJE_OBJETIVO_POR_DEFECTO;
  const totalRAA = porRAA.size || 1;
  const pesoMaximo = puntajeObjetivo / totalRAA;

  let puntajeTotal = 0;
  const juicios = [...porRAA.values()]
    .sort((a, b) => a.raId - b.raId || a.aa - b.aa)
    .map((raa) => {
      let maxRAA = 0, aciertosRAA = 0, presentados = 0;
      raa.modulos.forEach((m) => {
        maxRAA += m.puntajeMaximo;
        const ultimo = ultimoPorCuestionario.get(cuestionarioId(ficha, raa.raId, raa.aa, m.modulo));
        if (ultimo) { aciertosRAA += ultimo.puntaje; presentados += 1; }
      });
      const fraccion = maxRAA > 0 ? aciertosRAA / maxRAA : 0;
      const puntosGanados = fraccion * pesoMaximo;
      puntajeTotal += puntosGanados;

      const juicio = presentados === 0 ? "Sin presentar" : (fraccion >= UMBRAL_APROBACION ? "Aprobado" : "No aprobado");

      return {
        raId: raa.raId,
        aa: raa.aa,
        presentados,
        totalModulos: raa.modulos.length,
        puntosGanados: Math.round(puntosGanados * 100) / 100,
        pesoMaximo: Math.round(pesoMaximo * 100) / 100,
        juicio,
      };
    });

  return {
    puntajeTotal: Math.round(puntajeTotal * 100) / 100,
    escalaTotal: puntajeObjetivo,
    juicios,
  };
}

/* aprendices: [{ cedula, nombre, asistencia: { puntual, tarde, excusa,
   noAsiste, porcentaje } }] — la asistencia la manda el cliente porque
   hoy solo vive en localStorage (assets/js/estado/asistencia.js); el
   servidor solo aporta los juicios de evaluación, que sí están en Mongo. */
async function construirPortafolio({ ficha, instructor, aprendices }) {
  const filas = [];
  for (const a of aprendices) {
    const evaluacion = await juiciosDeEvaluacion(ficha, a.cedula);
    filas.push({ cedula: a.cedula, nombre: a.nombre, asistencia: a.asistencia || {}, evaluacion });
  }
  return { ficha, instructor, generado: new Date(), filas };
}

/* ── Excel ── */
async function portafolioExcel(datos) {
  const libro = new ExcelJS.Workbook();
  libro.creator = "SGMA-ADSO";
  const hoja = libro.addWorksheet("Portafolio");

  hoja.columns = [
    { header: "Aprendiz", key: "nombre", width: 30 },
    { header: "Cédula", key: "cedula", width: 15 },
    { header: "RA", key: "ra", width: 8 },
    { header: "Juicio", key: "juicio", width: 15 },
    { header: "Puntaje RA", key: "puntos", width: 16 },
    { header: "Puntaje global", key: "global", width: 18 },
    { header: "Puntual", key: "puntual", width: 10 },
    { header: "Tarde", key: "tarde", width: 10 },
    { header: "Excusa", key: "excusa", width: 10 },
    { header: "No asiste", key: "noAsiste", width: 10 },
    { header: "% Asistencia", key: "pctAsistencia", width: 14 },
  ];
  hoja.getRow(1).font = { bold: true };

  datos.filas.forEach((fila) => {
    const asis = fila.asistencia || {};
    if (!fila.evaluacion.juicios.length) {
      hoja.addRow({
        nombre: fila.nombre, cedula: fila.cedula, ra: "—", juicio: "Sin RA creados",
        global: fila.evaluacion.puntajeTotal + " / " + fila.evaluacion.escalaTotal,
        puntual: asis.puntual || 0, tarde: asis.tarde || 0, excusa: asis.excusa || 0,
        noAsiste: asis.noAsiste || 0, pctAsistencia: (asis.porcentaje || 0) + "%",
      });
      return;
    }
    fila.evaluacion.juicios.forEach((j, i) => {
      hoja.addRow({
        nombre: i === 0 ? fila.nombre : "",
        cedula: i === 0 ? fila.cedula : "",
        ra: "RA-" + String(j.raId).padStart(2, "0"),
        juicio: j.juicio,
        puntos: j.puntosGanados + " / " + j.pesoMaximo,
        global: i === 0 ? fila.evaluacion.puntajeTotal + " / " + fila.evaluacion.escalaTotal : "",
        puntual: i === 0 ? (asis.puntual || 0) : "",
        tarde: i === 0 ? (asis.tarde || 0) : "",
        excusa: i === 0 ? (asis.excusa || 0) : "",
        noAsiste: i === 0 ? (asis.noAsiste || 0) : "",
        pctAsistencia: i === 0 ? (asis.porcentaje || 0) + "%" : "",
      });
    });
  });

  return libro.xlsx.writeBuffer();
}

/* ── PDF ── */
function portafolioPDF(datos) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40 });
    const trozos = [];
    doc.on("data", (t) => trozos.push(t));
    doc.on("end", () => resolve(Buffer.concat(trozos)));
    doc.on("error", reject);

    doc.fontSize(16).text("Portafolio del instructor — SGMA-ADSO", { align: "center" });
    doc.fontSize(10).fillColor("#555").text(
      `Ficha ${datos.ficha} · Instructor: ${datos.instructor} · Generado: ${datos.generado.toLocaleString("es-CO")}`,
      { align: "center" }
    );
    doc.moveDown(1.5);

    datos.filas.forEach((fila) => {
      const asis = fila.asistencia || {};
      doc.fillColor("#000").fontSize(13).text(`${fila.nombre} — C.C. ${fila.cedula}`, { underline: true });
      doc.fontSize(10).text(
        `Asistencia — puntual: ${asis.puntual || 0} · tarde: ${asis.tarde || 0} · excusa: ${asis.excusa || 0} · ` +
        `no asiste: ${asis.noAsiste || 0} · ${asis.porcentaje || 0}%`
      );
      doc.text(`Puntaje global de evaluación: ${fila.evaluacion.puntajeTotal} / ${fila.evaluacion.escalaTotal}`);
      if (!fila.evaluacion.juicios.length) {
        doc.text("Sin resultados de aprendizaje creados todavía.");
      } else {
        fila.evaluacion.juicios.forEach((j) => {
          doc.text(
            `  RA-${String(j.raId).padStart(2, "0")}: ${j.juicio} (${j.puntosGanados} / ${j.pesoMaximo} pts, ` +
            `${j.presentados}/${j.totalModulos} módulos presentados)`
          );
        });
      }
      doc.moveDown(1);
    });

    doc.end();
  });
}

/* ── Word ── */
async function portafolioWord(datos) {
  const encabezado = new TableRow({
    children: ["Aprendiz", "RA", "Juicio", "Puntaje", "% Asistencia"].map(
      (t) => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: t, bold: true })] })] })
    ),
  });

  const filas = [encabezado];
  datos.filas.forEach((fila) => {
    const asis = fila.asistencia || {};
    const juicios = fila.evaluacion.juicios.length
      ? fila.evaluacion.juicios
      : [{ raId: null, juicio: "Sin RA creados", puntosGanados: "", pesoMaximo: "" }];

    juicios.forEach((j, i) => {
      const celdas = [
        i === 0 ? fila.nombre : "",
        j.raId === null ? "—" : "RA-" + String(j.raId).padStart(2, "0"),
        j.juicio,
        j.puntosGanados === "" ? "" : `${j.puntosGanados} / ${j.pesoMaximo}`,
        i === 0 ? (asis.porcentaje || 0) + "%" : "",
      ];
      filas.push(new TableRow({ children: celdas.map((t) => new TableCell({ children: [new Paragraph(String(t))] })) }));
    });
  });

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({ text: "Portafolio del instructor — SGMA-ADSO", heading: HeadingLevel.HEADING_1 }),
          new Paragraph({
            text: `Ficha ${datos.ficha} · Instructor: ${datos.instructor} · Generado: ${datos.generado.toLocaleString("es-CO")}`,
          }),
          new Paragraph({ text: "" }),
          new Table({ rows: filas }),
        ],
      },
    ],
  });

  return Packer.toBuffer(doc);
}

module.exports = { construirPortafolio, portafolioExcel, portafolioPDF, portafolioWord };
