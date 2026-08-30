/* ==========================================================================
   Quiz dinámico — pages/quiz-dinamico.html — Módulo 4
   Motor genérico para los módulos creados por el instructor en
   "4.1 Crear Quiz/Evaluación" (banco de preguntas en Mongo, server/routes/
   quizzes.js). Mismo patrón que assets/js/quiz-irregular-verbs.js: sin
   servidor en tiempo real, corrige en el navegador al instante, y solo al
   terminar manda UN reporte a /api/resultados. El "cuestionario" reportado
   usa el segmento "-mod-" (en vez del "-m-" legacy) para no colisionar con
   los cuestionarioId del esquema viejo M1-M4.
   ========================================================================== */

const API_BASE = "/api";
const PORCENTAJE_APROBACION = 70;
const LETRAS = ["A", "B", "C", "D"];

const params = new URLSearchParams(window.location.search);
const cedula = params.get("doc") || "";
const nombre = params.get("u") || "Aprendiz";
const ficha = params.get("ficha") || "adso";
const raId = params.get("ra");
const aa = params.get("aa");
const modulo = params.get("modulo");

const tituloEl = document.getElementById("titulo-cuestionario");
const progresoActualEl = document.getElementById("progreso-actual");
const progresoTextoEl = document.getElementById("progreso-texto");
const progressFillEl = document.getElementById("progress-fill");
const questionTextEl = document.getElementById("question-text");
const optionsGridEl = document.getElementById("options-grid");
const playerNameEl = document.getElementById("player-name");
const playerScoreEl = document.getElementById("player-score");
const playerScoreTotalEl = document.getElementById("player-score-total");
const quizFrameEl = document.getElementById("quiz-frame");
const pantallaFinalEl = document.getElementById("pantalla-final");
const zonaTiempoEl = document.getElementById("zona-tiempo");
const tiempoRestanteEl = document.getElementById("tiempo-restante");

playerNameEl.textContent = nombre;

let quiz = null;
let indiceActual = 0;
let aciertos = 0;
let puntosGanados = 0;
let puntajeMaximoPosible = 0;
let respondiendo = false;
let finalizado = false;
let segundosRestantes = 0;
let temporizadorId = null;

function cuestionarioId() {
  const raTexto = String(raId).padStart(2, "0");
  return `${ficha}-ra-${raTexto}-aa-${aa}-mod-${modulo}`;
}

function opcionesDePregunta(pregunta) {
  if (pregunta.tipo === "vf") return ["Verdadero", "Falso"];
  return pregunta.opciones;
}

function renderProgreso() {
  const numero = indiceActual + 1;
  const total = quiz.preguntas.length;
  progresoActualEl.textContent = String(numero).padStart(2, "0");
  progresoTextoEl.textContent = `${String(numero).padStart(2, "0")} / ${total}`;
  progressFillEl.style.width = `${(indiceActual / total) * 100}%`;
}

function crearOptionCard(texto, letra, opcionId, pregunta) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "option-card";
  btn.dataset.opcionId = opcionId;
  btn.innerHTML = `
    <div class="option-card-inner">
      <div class="option-face option-front">
        <span class="option-letter">${letra}</span>
        <span class="option-text">${texto}</span>
      </div>
      <div class="option-face option-back">
        <span class="option-result-icon" data-role="icon"></span>
        <span class="option-result-label" data-role="label"></span>
      </div>
    </div>`;
  btn.addEventListener("click", () => onSeleccionar(opcionId, btn, pregunta));
  return btn;
}

function renderPregunta() {
  respondiendo = false;
  const pregunta = quiz.preguntas[indiceActual];
  questionTextEl.textContent = pregunta.texto;
  renderProgreso();

  optionsGridEl.innerHTML = "";
  optionsGridEl.classList.remove("is-locked");
  opcionesDePregunta(pregunta).forEach((texto, i) => {
    optionsGridEl.appendChild(crearOptionCard(texto, LETRAS[i], i, pregunta));
  });
}

function iniciarTemporizador(minutos) {
  segundosRestantes = minutos * 60;
  zonaTiempoEl.style.display = 'flex';
  renderTiempoRestante();
  temporizadorId = setInterval(() => {
    segundosRestantes -= 1;
    renderTiempoRestante();
    if (segundosRestantes <= 0) {
      clearInterval(temporizadorId);
      finalizarPorTiempo();
    }
  }, 1000);
}

function renderTiempoRestante() {
  const m = Math.floor(segundosRestantes / 60);
  const s = segundosRestantes % 60;
  tiempoRestanteEl.textContent = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function finalizarPorTiempo() {
  if (quizFrameEl.hidden) return; // ya finalizó por otra vía
  respondiendo = true;
  optionsGridEl.classList.add("is-locked");
  finalizar();
}

function onSeleccionar(opcionId, btn, pregunta) {
  if (respondiendo) return;
  respondiendo = true;
  optionsGridEl.classList.add("is-locked");

  const correcta = pregunta.respuestaCorrecta === opcionId;
  if (correcta) {
    aciertos += 1;
    puntosGanados += pregunta.puntos;
  }
  playerScoreEl.textContent = puntosGanados;

  btn.classList.add("is-flipped", correcta ? "is-correct" : "is-incorrect");
  btn.querySelector('[data-role="icon"]').textContent = correcta ? "✓" : "✕";
  btn.querySelector('[data-role="label"]').textContent = correcta ? "Acierto +1" : "Desacierto 0";
  if (!correcta) {
    const correctaCard = optionsGridEl.querySelector(`[data-opcion-id="${pregunta.respuestaCorrecta}"]`);
    if (correctaCard) correctaCard.classList.add("is-correct-hint");
  }

  setTimeout(() => {
    indiceActual += 1;
    if (indiceActual >= quiz.preguntas.length) {
      finalizar();
    } else {
      renderPregunta();
    }
  }, 1000);
}

async function reportarResultado() {
  if (!cedula) return;
  try {
    await fetch(API_BASE + "/resultados", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cedula,
        nombre,
        modulo: "SENAEnglish",
        cuestionario: cuestionarioId(),
        puntaje: puntosGanados,
        totalPreguntas: puntajeMaximoPosible,
      }),
    });
  } catch (e) {
    // best-effort, igual que en quiz-irregular-verbs.js
  }
}

function finalizar() {
  if (finalizado) return;
  finalizado = true;
  if (temporizadorId) clearInterval(temporizadorId);
  const total = quiz.preguntas.length;
  progresoActualEl.textContent = String(total).padStart(2, "0");
  progresoTextoEl.textContent = `${total} / ${total}`;
  progressFillEl.style.width = "100%";

  reportarResultado();

  const porcentaje = Math.round((puntosGanados / puntajeMaximoPosible) * 10000) / 100;
  const aprobado = porcentaje >= PORCENTAJE_APROBACION;

  quizFrameEl.hidden = true;
  pantallaFinalEl.hidden = false;
  pantallaFinalEl.innerHTML = `
    <section class="result-card" id="result-card">
      <span class="result-badge" style="background:${aprobado ? "#278238" : "#e23c2f"}">
        ${aprobado ? "APROBADO" : "SIN APROBAR"}
      </span>
      <div class="result-user"><span id="result-nombre">${nombre}</span></div>
      <dl class="result-grid">
        <div><dt>Preguntas</dt><dd>${total}</dd></div>
        <div><dt>Aciertos</dt><dd>${aciertos}</dd></div>
        <div><dt>Desaciertos</dt><dd>${total - aciertos}</dd></div>
        <div><dt>Puntaje</dt><dd>${puntosGanados} / ${puntajeMaximoPosible}</dd></div>
        <div><dt>Porcentaje</dt><dd>${porcentaje.toFixed(2)} %</dd></div>
      </dl>
    </section>`;
}

async function iniciar() {
  if (!ficha || !raId || !aa || !modulo) {
    questionTextEl.textContent = "Falta información en la URL (ficha/ra/aa/modulo).";
    return;
  }
  try {
    const resp = await fetch(`${API_BASE}/quizzes/${ficha}/${raId}/${aa}/${modulo}`);
    if (!resp.ok) throw new Error("no encontrado");
    quiz = await resp.json();
  } catch (e) {
    questionTextEl.textContent = "Este módulo todavía no tiene preguntas cargadas.";
    return;
  }

  if (quiz.intentosPermitidos > 0 && cedula) {
    let intentosUsados = 0;
    try {
      const historial = await (await fetch(`${API_BASE}/resultados/${encodeURIComponent(cedula)}`)).json();
      intentosUsados = (historial.historial || []).filter((r) => r.cuestionario === cuestionarioId()).length;
    } catch (e) {
      // si no se puede consultar el historial, se deja presentar (best-effort)
    }
    if (intentosUsados >= quiz.intentosPermitidos) {
      questionTextEl.textContent = `Ya usaste tus ${quiz.intentosPermitidos} intento(s) permitido(s) para este módulo.`;
      return;
    }
  }

  puntajeMaximoPosible = quiz.preguntas.reduce((suma, p) => suma + p.puntos, 0);
  tituloEl.textContent = `RA-${String(raId).padStart(2, "0")} · AA${aa} · Módulo ${modulo} (${quiz.tipo === "quiz" ? "Quiz" : "Evaluación"})`;
  playerScoreTotalEl.textContent = puntajeMaximoPosible;
  if (quiz.limiteTiempoMinutos > 0) iniciarTemporizador(quiz.limiteTiempoMinutos);
  renderPregunta();
}

iniciar();
