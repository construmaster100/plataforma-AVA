/* ==========================================================================
   Quiz "Irregular Verbs" — pages/quiz-irregular-verbs.html
   Versión "simple" del modelo de quiz: sin servidor en tiempo real. Las
   30 preguntas y su corrección viven en este archivo, se corrigen en el
   navegador al instante, y solo al terminar se manda UN reporte
   asíncrono a la API REST (server/routes/resultados.js) — el mismo
   fetch que ya usa assets/js/quiz.js para SENAEnglish, cambiando el
   valor de "cuestionario".
   ========================================================================== */

const MODULO = "SENAEnglish";
const API_BASE = "http://localhost:3000/api";
const PORCENTAJE_APROBACION = 70;
const LETRAS = ["A", "B", "C", "D"];

// A qué RA/actividad pertenece esta copia (pages/Resultados de Aprendizaje/
// RA{n}/AA{m}), igual que en assets/js/quiz.js. Sin "ra"/"aa" usa el id
// genérico de siempre.
function idCuestionarioActual() {
  const params = new URLSearchParams(window.location.search);
  const ra = params.get("ra");
  const aa = params.get("aa");
  const ficha = params.get("ficha") || "adso";
  if (!ra || !aa) return "irregular-verbs";
  return `${ficha}-ra-${String(ra).padStart(2, "0")}-act-${aa}`;
}

/* 30 verbos irregulares — una pregunta por verbo (base → pasado simple). */
const VERBOS = [
  { base: "go", pasado: "went" },
  { base: "eat", pasado: "ate" },
  { base: "drink", pasado: "drank" },
  { base: "see", pasado: "saw" },
  { base: "take", pasado: "took" },
  { base: "give", pasado: "gave" },
  { base: "come", pasado: "came" },
  { base: "write", pasado: "wrote" },
  { base: "speak", pasado: "spoke" },
  { base: "break", pasado: "broke" },
  { base: "choose", pasado: "chose" },
  { base: "drive", pasado: "drove" },
  { base: "fall", pasado: "fell" },
  { base: "feel", pasado: "felt" },
  { base: "find", pasado: "found" },
  { base: "fly", pasado: "flew" },
  { base: "forget", pasado: "forgot" },
  { base: "get", pasado: "got" },
  { base: "grow", pasado: "grew" },
  { base: "hear", pasado: "heard" },
  { base: "keep", pasado: "kept" },
  { base: "know", pasado: "knew" },
  { base: "leave", pasado: "left" },
  { base: "lose", pasado: "lost" },
  { base: "make", pasado: "made" },
  { base: "meet", pasado: "met" },
  { base: "pay", pasado: "paid" },
  { base: "run", pasado: "ran" },
  { base: "say", pasado: "said" },
  { base: "sell", pasado: "sold" },
];

function barajar(arr) {
  const copia = arr.slice();
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

function construirPreguntas() {
  return barajar(VERBOS).map((v, i) => {
    const distractores = barajar(VERBOS.filter(x => x.pasado !== v.pasado)).slice(0, 3).map(x => x.pasado);
    const textos = barajar([v.pasado, ...distractores]);
    const opciones = textos.map((texto, idx) => ({ id: LETRAS[idx].toLowerCase(), texto }));
    const respuestaCorrecta = opciones.find(o => o.texto === v.pasado).id;
    return { id: i, base: v.base, opciones, respuestaCorrecta };
  });
}

const progresoActualEl = document.getElementById("progreso-actual");
const progresoTextoEl = document.getElementById("progreso-texto");
const progressFillEl = document.getElementById("progress-fill");
const questionTextEl = document.getElementById("question-text");
const optionsGridEl = document.getElementById("options-grid");
const playerNameEl = document.getElementById("player-name");
const playerScoreEl = document.getElementById("player-score");
const quizFrameEl = document.getElementById("quiz-frame");
const pantallaFinalEl = document.getElementById("pantalla-final");

const params = new URLSearchParams(window.location.search);
const cedula = params.get("doc") || "";
const nombre = params.get("u") || "Aprendiz";

let preguntas = construirPreguntas();
let indiceActual = 0;
let aciertos = 0;
let respondiendo = false;

playerNameEl.textContent = nombre;

function renderProgreso() {
  const numero = indiceActual + 1;
  progresoActualEl.textContent = String(numero).padStart(2, "0");
  progresoTextoEl.textContent = `${String(numero).padStart(2, "0")} / ${VERBOS.length}`;
  progressFillEl.style.width = `${(indiceActual / VERBOS.length) * 100}%`;
}

function crearOptionCard(opcion, letra, pregunta) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "option-card";
  btn.dataset.opcionId = opcion.id;
  btn.innerHTML = `
    <div class="option-card-inner">
      <div class="option-face option-front">
        <span class="option-letter">${letra}</span>
        <span class="option-text">${opcion.texto}</span>
      </div>
      <div class="option-face option-back">
        <span class="option-result-icon" data-role="icon"></span>
        <span class="option-result-label" data-role="label"></span>
      </div>
    </div>`;
  btn.addEventListener("click", () => onSeleccionar(opcion.id, btn, pregunta));
  return btn;
}

function renderPregunta() {
  respondiendo = false;
  const pregunta = preguntas[indiceActual];
  questionTextEl.textContent = `¿Cuál es el pasado simple (past simple) de "${pregunta.base}"?`;
  renderProgreso();

  optionsGridEl.innerHTML = "";
  optionsGridEl.classList.remove("is-locked");
  pregunta.opciones.forEach((opcion, i) => {
    optionsGridEl.appendChild(crearOptionCard(opcion, LETRAS[i], pregunta));
  });
}

function onSeleccionar(opcionId, btn, pregunta) {
  if (respondiendo) return;
  respondiendo = true;
  optionsGridEl.classList.add("is-locked");

  const correcta = pregunta.respuestaCorrecta === opcionId;
  if (correcta) aciertos += 1;
  playerScoreEl.textContent = aciertos;

  btn.classList.add("is-flipped", correcta ? "is-correct" : "is-incorrect");
  btn.querySelector('[data-role="icon"]').textContent = correcta ? "✓" : "✕";
  btn.querySelector('[data-role="label"]').textContent = correcta ? "Acierto +1" : "Desacierto 0";
  if (!correcta) {
    const correctaCard = optionsGridEl.querySelector(`[data-opcion-id="${pregunta.respuestaCorrecta}"]`);
    if (correctaCard) correctaCard.classList.add("is-correct-hint");
  }

  setTimeout(() => {
    indiceActual += 1;
    if (indiceActual >= preguntas.length) {
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
        modulo: MODULO,
        cuestionario: idCuestionarioActual(),
        puntaje: aciertos,
        totalPreguntas: VERBOS.length,
      }),
    });
  } catch (e) {
    // best-effort, igual que en assets/js/quiz.js
  }
}

function finalizar() {
  progresoActualEl.textContent = String(VERBOS.length).padStart(2, "0");
  progresoTextoEl.textContent = `${VERBOS.length} / ${VERBOS.length}`;
  progressFillEl.style.width = "100%";

  reportarResultado();

  const porcentaje = Math.round((aciertos / VERBOS.length) * 10000) / 100;
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
        <div><dt>Preguntas</dt><dd>${VERBOS.length}</dd></div>
        <div><dt>Aciertos</dt><dd>${aciertos}</dd></div>
        <div><dt>Desaciertos</dt><dd>${VERBOS.length - aciertos}</dd></div>
        <div><dt>Score</dt><dd>${aciertos} / ${VERBOS.length}</dd></div>
        <div><dt>Porcentaje</dt><dd>${porcentaje.toFixed(2)} %</dd></div>
      </dl>
      <button type="button" class="login-submit" id="btn-retomar">Volver a intentar</button>
    </section>`;

  document.getElementById("btn-retomar").addEventListener("click", () => {
    preguntas = construirPreguntas();
    indiceActual = 0;
    aciertos = 0;
    playerScoreEl.textContent = "0";
    pantallaFinalEl.hidden = true;
    pantallaFinalEl.innerHTML = "";
    quizFrameEl.hidden = false;
    renderPregunta();
  });
}

renderPregunta();
