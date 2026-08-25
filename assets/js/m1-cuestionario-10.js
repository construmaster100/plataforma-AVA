/* ==========================================================================
   M1 — Cuestionario de 10 preguntas (10 puntos)
   Fundamentos de Análisis y Desarrollo de Software (contenido de ejemplo,
   reemplazable por el instructor). Mismo patrón sin servidor que
   assets/js/quiz-irregular-verbs.js: se corrige en el navegador y solo
   reporta un POST al terminar.
   ========================================================================== */

const MODULO_M1 = "SENAEnglish";
const API_BASE_M1 = "http://localhost:3000/api";
const PORCENTAJE_APROBACION_M1 = 70;
const LETRAS_M1 = ["A", "B", "C", "D"];

const PREGUNTAS_M1 = [
  { texto: '¿Qué significa la sigla "ADSO"?', opciones: ["Análisis y Desarrollo de Software", "Administración de Sistemas Operativos", "Automatización de Sistemas de Oficina", "Análisis de Datos y Software"], correcta: 0 },
  { texto: "¿Cuál es la primera fase del ciclo de vida del software?", opciones: ["Despliegue", "Análisis de requisitos", "Pruebas", "Mantenimiento"], correcta: 1 },
  { texto: "¿Qué es un requisito funcional?", opciones: ["Un error del sistema", "Una condición del hardware", "Algo que el sistema debe hacer", "Un estándar de diseño gráfico"], correcta: 2 },
  { texto: "¿Qué lenguaje se usa para modelar el diseño de un sistema orientado a objetos?", opciones: ["HTML", "UML", "SQL", "CSS"], correcta: 1 },
  { texto: "¿Qué es una base de datos relacional?", opciones: ["Un conjunto de tablas relacionadas entre sí", "Un archivo de texto plano", "Un lenguaje de programación", "Un servidor web"], correcta: 0 },
  { texto: "¿Qué significa SQL?", opciones: ["Software Query Logic", "Structured Query Language", "System Quality Level", "Simple Query List"], correcta: 1 },
  { texto: "¿Qué es una API?", opciones: ["Un tipo de base de datos", "Una interfaz de programación de aplicaciones", "Un lenguaje de marcado", "Un antivirus"], correcta: 1 },
  { texto: "¿Cuál de las siguientes es una metodología ágil?", opciones: ["Cascada", "Scrum", "V-Model", "Espiral clásico"], correcta: 1 },
  { texto: "¿Qué es el control de versiones?", opciones: ["Un sistema para rastrear cambios en el código", "Un antivirus para el código", "Un compilador", "Un tipo de base de datos"], correcta: 0 },
  { texto: "¿Qué es un algoritmo?", opciones: ["Un error de programación", "Una secuencia de pasos para resolver un problema", "Un lenguaje de programación", "Un tipo de variable"], correcta: 1 },
];

function barajarM1(arr) {
  const copia = arr.slice();
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

function construirPreguntasM1() {
  return PREGUNTAS_M1.map((p, i) => {
    const opcionesConIndice = p.opciones.map((texto, idx) => ({ texto, esCorrecta: idx === p.correcta }));
    const barajadas = barajarM1(opcionesConIndice);
    const opciones = barajadas.map((o, idx) => ({ id: LETRAS_M1[idx].toLowerCase(), texto: o.texto }));
    const respuestaCorrecta = opciones[barajadas.findIndex(o => o.esCorrecta)].id;
    return { id: i, texto: p.texto, opciones, respuestaCorrecta };
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

const paramsM1 = new URLSearchParams(window.location.search);
const cedulaM1 = paramsM1.get("doc") || "";
const nombreM1 = paramsM1.get("u") || "Aprendiz";

let preguntasM1 = construirPreguntasM1();
let indiceActualM1 = 0;
let aciertosM1 = 0;
let respondiendoM1 = false;

playerNameEl.textContent = nombreM1;

function idCuestionarioM1() {
  const ra = paramsM1.get("ra");
  const aa = paramsM1.get("aa");
  const m = paramsM1.get("m") || "1";
  const ficha = paramsM1.get("ficha") || "adso";
  if (!ra || !aa) return "m1-cuestionario-10";
  return `${ficha}-ra-${String(ra).padStart(2, "0")}-aa-${aa}-m-${m}`;
}

function renderProgresoM1() {
  const numero = indiceActualM1 + 1;
  progresoActualEl.textContent = String(numero).padStart(2, "0");
  progresoTextoEl.textContent = `${String(numero).padStart(2, "0")} / ${PREGUNTAS_M1.length}`;
  progressFillEl.style.width = `${(indiceActualM1 / PREGUNTAS_M1.length) * 100}%`;
}

function crearOpcionM1(opcion, letra, pregunta) {
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
  btn.addEventListener("click", () => onSeleccionarM1(opcion.id, btn, pregunta));
  return btn;
}

function renderPreguntaM1() {
  respondiendoM1 = false;
  const pregunta = preguntasM1[indiceActualM1];
  questionTextEl.textContent = pregunta.texto;
  renderProgresoM1();

  optionsGridEl.innerHTML = "";
  optionsGridEl.classList.remove("is-locked");
  pregunta.opciones.forEach((opcion, i) => {
    optionsGridEl.appendChild(crearOpcionM1(opcion, LETRAS_M1[i], pregunta));
  });
}

function onSeleccionarM1(opcionId, btn, pregunta) {
  if (respondiendoM1) return;
  respondiendoM1 = true;
  optionsGridEl.classList.add("is-locked");

  const correcta = pregunta.respuestaCorrecta === opcionId;
  if (correcta) aciertosM1 += 1;
  playerScoreEl.textContent = aciertosM1;

  btn.classList.add("is-flipped", correcta ? "is-correct" : "is-incorrect");
  btn.querySelector('[data-role="icon"]').textContent = correcta ? "✓" : "✕";
  btn.querySelector('[data-role="label"]').textContent = correcta ? "Acierto +1" : "Desacierto 0";
  if (!correcta) {
    const correctaCard = optionsGridEl.querySelector(`[data-opcion-id="${pregunta.respuestaCorrecta}"]`);
    if (correctaCard) correctaCard.classList.add("is-correct-hint");
  }

  setTimeout(() => {
    indiceActualM1 += 1;
    if (indiceActualM1 >= preguntasM1.length) {
      finalizarM1();
    } else {
      renderPreguntaM1();
    }
  }, 1000);
}

async function reportarResultadoM1() {
  if (!cedulaM1) return;
  try {
    await fetch(API_BASE_M1 + "/resultados", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cedula: cedulaM1,
        nombre: nombreM1,
        modulo: MODULO_M1,
        cuestionario: idCuestionarioM1(),
        puntaje: aciertosM1,
        totalPreguntas: PREGUNTAS_M1.length,
      }),
    });
  } catch (e) {
    // best-effort
  }
}

function finalizarM1() {
  progresoActualEl.textContent = String(PREGUNTAS_M1.length).padStart(2, "0");
  progresoTextoEl.textContent = `${PREGUNTAS_M1.length} / ${PREGUNTAS_M1.length}`;
  progressFillEl.style.width = "100%";

  reportarResultadoM1();

  const porcentaje = Math.round((aciertosM1 / PREGUNTAS_M1.length) * 10000) / 100;
  const aprobado = porcentaje >= PORCENTAJE_APROBACION_M1;

  quizFrameEl.hidden = true;
  pantallaFinalEl.hidden = false;
  pantallaFinalEl.innerHTML = `
    <section class="result-card" id="result-card">
      <span class="result-badge" style="background:${aprobado ? "#278238" : "#e23c2f"}">
        ${aprobado ? "APROBADO" : "SIN APROBAR"}
      </span>
      <div class="result-user"><span id="result-nombre">${nombreM1}</span></div>
      <dl class="result-grid">
        <div><dt>Preguntas</dt><dd>${PREGUNTAS_M1.length}</dd></div>
        <div><dt>Aciertos</dt><dd>${aciertosM1}</dd></div>
        <div><dt>Score</dt><dd>${aciertosM1} / ${PREGUNTAS_M1.length}</dd></div>
        <div><dt>Porcentaje</dt><dd>${porcentaje.toFixed(2)} %</dd></div>
      </dl>
      <button type="button" class="login-submit" id="btn-retomar">Volver a intentar</button>
    </section>`;

  document.getElementById("btn-retomar").addEventListener("click", () => {
    preguntasM1 = construirPreguntasM1();
    indiceActualM1 = 0;
    aciertosM1 = 0;
    playerScoreEl.textContent = "0";
    pantallaFinalEl.hidden = true;
    pantallaFinalEl.innerHTML = "";
    quizFrameEl.hidden = false;
    renderPreguntaM1();
  });
}

renderPreguntaM1();
