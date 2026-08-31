require("dotenv").config();
const path = require("path");
const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const { EvaluationState } = require("./gameState");

const ROOT = path.join(__dirname, "..");
const PORT = process.env.PORT || 4000;
const SALA = "sena-english";

const app = express();
const server = createServer(app);
const io = new Server(server);

const estado = new EvaluationState();

app.use(express.json());
app.use("/assets", express.static(path.join(ROOT, "assets")));
app.use("/pages", express.static(path.join(ROOT, "pages")));
app.use("/docs", express.static(path.join(ROOT, "docs")));
// Módulo 5 · AVA Code Lab: editor HTML/CSS/JS independiente, incrustado
// por iframe desde pages/aprendiz.html (ver sec-code-lab).
app.use("/editor", express.static(path.join(ROOT, "editor")));
// 2.3 · Laboratorio de Lógica: página independiente, incrustada por
// iframe desde pages/aprendiz.html (ver sec-logica-lab).
app.use("/logica", express.static(path.join(ROOT, "logica")));
app.get("/", (req, res) => res.redirect("/pages/bienvenida.html"));
app.get("/index.html", (req, res) => res.sendFile(path.join(ROOT, "index.html")));

/* Sistema de 72 RA (ADSO): antes solo vivía en server/server.js, un
   segundo proceso (puerto 3000) que Render nunca desplegaba junto a
   este. Se monta aquí para que /api/actividades, /api/resultados,
   /api/acceso y /api/aprendices respondan en el mismo origen que
   sirve las páginas — así los fetch("/api/...") del frontend
   funcionan sin importar el dominio o puerto real. */
app.use("/api/aprendices", require("../server/routes/aprendices"));
app.use("/api/resultados", require("../server/routes/resultados"));
app.use("/api/actividades", require("../server/routes/actividades"));
app.use("/api/acceso", require("../server/routes/acceso"));
app.use("/api/quizzes", require("../server/routes/quizzes"));
// Mensajería con persistencia real (antes solo localStorage) y
// notificación por correo cuando se indica destinatario.
app.use("/api/mensajes", require("../server/routes/mensajes"));
// Portafolio del instructor (juicios de evaluación + asistencia) en
// Excel, PDF o Word — ver server/services/portafolio.js.
app.use("/api/reportes", require("../server/routes/reportes"));

io.on("connection", (socket) => {
  socket.on("observar", (_payload, cb) => {
    socket.join(SALA);
    if (typeof cb === "function") cb(estado.serializarEstado());
  });

  socket.on("unirse", ({ nombre, color, jugadorId } = {}, cb) => {
    const resultado = estado.unirse({ nombre, color, jugadorId, socketId: socket.id });
    if (!resultado.ok) {
      if (typeof cb === "function") cb({ ok: false, motivo: resultado.motivo });
      return;
    }

    const participante = resultado.participante;
    socket.data.jugadorId = participante.id;
    socket.join(SALA);

    if (typeof cb === "function") {
      cb({
        ok: true,
        jugadorId: participante.id,
        participante: estado.serializarParticipante(participante),
        pregunta: estado.preguntaActualDe(participante),
        config: estado.serializarEstado().config,
        ranking: estado.ranking(),
      });
    }
    if (resultado.esNuevo) {
      socket.to(SALA).emit("jugador_nuevo", estado.serializarParticipante(participante));
    } else {
      socket.to(SALA).emit("jugador_reconectado", estado.serializarParticipante(participante));
    }
  });

  socket.on("responder", ({ preguntaId, opcionId } = {}, cb) => {
    const jugadorId = socket.data.jugadorId;
    if (!jugadorId) {
      if (typeof cb === "function") cb({ ok: false, motivo: "Debes ingresar antes de responder." });
      return;
    }

    const resultado = estado.responder(jugadorId, Number(preguntaId), opcionId);
    if (!resultado.ok) {
      if (typeof cb === "function") cb({ ok: false, motivo: resultado.motivo });
      return;
    }

    if (typeof cb === "function") cb({ ok: true });

    const respuestaPayload = {
      preguntaId: Number(preguntaId),
      opcionId,
      correcta: resultado.correcta,
      opcionCorrectaId: resultado.opcionCorrectaId,
      aciertos: resultado.participante.aciertos,
      desaciertos: resultado.participante.desaciertos,
      score: resultado.participante.score,
    };
    socket.emit("respuesta_validada", respuestaPayload);
    io.to(SALA).emit("jugador_actualizado", estado.serializarParticipante(resultado.participante));

    if (resultado.finalizado) {
      const final = estado.resultadoFinal(jugadorId);
      if (final.ok) socket.emit("evaluacion_finalizada", final.resultado);
      io.to(SALA).emit("ranking_actualizado", estado.ranking());
      io.to(SALA).emit("historial_actualizado", estado.historialRecords());
    } else {
      socket.emit("pregunta_actualizada", { pregunta: resultado.siguientePregunta, preguntaActual: resultado.participante.preguntaActual });
    }
  });

  socket.on("finalizar", (_payload, cb) => {
    const jugadorId = socket.data.jugadorId;
    if (!jugadorId) {
      if (typeof cb === "function") cb({ ok: false, motivo: "Debes ingresar antes de finalizar." });
      return;
    }
    const final = estado.resultadoFinal(jugadorId);
    if (typeof cb === "function") cb(final);
  });

  socket.on("admin_reiniciar", () => {
    estado.reiniciar();
    io.to(SALA).emit("estado_inicial", estado.serializarEstado());
  });

  socket.on("reiniciar_propio", (_payload, cb) => {
    const jugadorId = socket.data.jugadorId;
    if (!jugadorId) {
      if (typeof cb === "function") cb({ ok: false, motivo: "Debes ingresar antes de reiniciar." });
      return;
    }
    const resultado = estado.reiniciarParticipante(jugadorId);
    if (typeof cb === "function") cb({ ok: resultado.ok, motivo: resultado.motivo });
    if (resultado.ok) io.to(SALA).emit("jugador_actualizado", estado.serializarParticipante(resultado.participante));
  });

  socket.on("disconnect", () => {
    const jugadorId = socket.data.jugadorId;
    if (!jugadorId) return;
    estado.desconectar(jugadorId, socket.id);
    io.to(SALA).emit("jugador_desconectado", { id: jugadorId });
  });
});

estado.cargarDesdeMongo().finally(() => {
  server.listen(PORT, () => {
    console.log(`SENAEnglish escuchando en http://localhost:${PORT}`);
  });
});
