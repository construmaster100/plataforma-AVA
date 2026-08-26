/* ==========================================================================
   M3 — 15 preguntas Verdadero/Falso (15 puntos)
   Fundamentos de Análisis y Desarrollo de Software (contenido de ejemplo).
   Mismo patrón sin servidor que m1-cuestionario-10.js.
   ========================================================================== */

const MODULO_M3 = "SENAEnglish";
const API_BASE_M3 = "/api";
const PORCENTAJE_APROBACION_M3 = 70;

const AFIRMACIONES_M3 = [
  { texto: "Un algoritmo siempre debe tener un número finito de pasos.", correcta: true },
  { texto: "SQL es un lenguaje de programación orientado a objetos.", correcta: false },
  { texto: "El análisis de requisitos es la última fase del ciclo de vida del software.", correcta: false },
  { texto: "Git es un sistema de control de versiones.", correcta: true },
  { texto: "Una variable puede cambiar su valor durante la ejecución de un programa.", correcta: true },
  { texto: "HTML es un lenguaje de programación.", correcta: false },
  { texto: "Una función puede recibir parámetros y retornar un valor.", correcta: true },
  { texto: "Scrum es una metodología de desarrollo en cascada.", correcta: false },
  { texto: "Una base de datos relacional organiza los datos en tablas.", correcta: true },
  { texto: "Las pruebas de software no son necesarias si el código compila sin errores.", correcta: false },
  { texto: "Una API permite que dos sistemas se comuniquen entre sí.", correcta: true },
  { texto: "En programación orientada a objetos, una clase es una instancia de un objeto.", correcta: false },
  { texto: "Los bucles permiten repetir instrucciones varias veces.", correcta: true },
  { texto: "Un bug es un error en el software.", correcta: true },
  { texto: "El despliegue es la fase donde se recopilan los requisitos del sistema.", correcta: false },
];

function barajarM3(arr) {
  const copia = arr.slice();
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
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

const paramsM3 = new URLSearchParams(window.location.search);
const cedulaM3 = paramsM3.get("doc") || "";
const nombreM3 = paramsM3.get("u") || "Aprendiz";

let afirmacionesM3 = barajarM3(AFIRMACIONES_M3);
let indiceActualM3 = 0;
let aciertosM3 = 0;
let respondiendoM3 = false;

playerNameEl.textContent = nombreM3;

function idCuestionarioM3() {
  const ra = paramsM3.get("ra");
  const aa = paramsM3.get("aa");
  const m = paramsM3.get("m") || "3";
  const ficha = paramsM3.get("ficha") || "adso";
  if (!ra || !aa) return "m3-verdadero-falso";
  return `${ficha}-ra-${String(ra).padStart(2, "0")}-aa-${aa}-m-${m}`;
}

function renderProgresoM3() {
  const numero = indiceActualM3 + 1;
  progresoActualEl.textContent = String(numero).padStart(2, "0");
  progresoTextoEl.textContent = `${String(numero).padStart(2, "0")} / ${AFIRMACIONES_M3.length}`;
  progressFillEl.style.width = `${(indiceActualM3 / AFIRMACIONES_M3.length) * 100}%`;
}

function crearOpcionVF(valor, etiqueta, afirmacion) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "option-card";
  btn.dataset.opcionId = valor;
  btn.innerHTML = `
    <div class="option-card-inner">
      <div class="option-face option-front">
        <span class="option-text">${etiqueta}</span>
      </div>
      <div class="option-face option-back">
        <span class="option-result-icon" data-role="icon"></span>
        <span class="option-result-label" data-role="label"></span>
      </div>
    </div>`;
  btn.addEventListener("click", () => onSeleccionarVF(valor, btn, afirmacion));
  return btn;
}

function renderAfirmacionM3() {
  respondiendoM3 = false;
  const afirmacion = afirmacionesM3[indiceActualM3];
  questionTextEl.textContent = afirmacion.texto;
  renderProgresoM3();

  optionsGridEl.innerHTML = "";
  optionsGridEl.classList.remove("is-locked");
  optionsGridEl.style.gridTemplateRows = "1fr";
  optionsGridEl.appendChild(crearOpcionVF("v", "Verdadero", afirmacion));
  optionsGridEl.appendChild(crearOpcionVF("f", "Falso", afirmacion));
}

function onSeleccionarVF(valor, btn, afirmacion) {
  if (respondiendoM3) return;
  respondiendoM3 = true;
  optionsGridEl.classList.add("is-locked");

  const respuestaCorrecta = afirmacion.correcta ? "v" : "f";
  const correcta = valor === respuestaCorrecta;
  if (correcta) aciertosM3 += 1;
  playerScoreEl.textContent = aciertosM3;

  btn.classList.add("is-flipped", correcta ? "is-correct" : "is-incorrect");
  btn.querySelector('[data-role="icon"]').textContent = correcta ? "✓" : "✕";
  btn.querySelector('[data-role="label"]').textContent = correcta ? "Acierto +1" : "Desacierto 0";
  if (!correcta) {
    const correctaCard = optionsGridEl.querySelector(`[data-opcion-id="${respuestaCorrecta}"]`);
    if (correctaCard) correctaCard.classList.add("is-correct-hint");
  }

  setTimeout(() => {
    indiceActualM3 += 1;
    if (indiceActualM3 >= afirmacionesM3.length) {
      finalizarM3();
    } else {
      renderAfirmacionM3();
    }
  }, 1000);
}

async function reportarResultadoM3() {
  if (!cedulaM3) return;
  try {
    await fetch(API_BASE_M3 + "/resultados", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cedula: cedulaM3,
        nombre: nombreM3,
        modulo: MODULO_M3,
        cuestionario: idCuestionarioM3(),
        puntaje: aciertosM3,
        totalPreguntas: AFIRMACIONES_M3.length,
      }),
    });
  } catch (e) {
    // best-effort
  }
}

function finalizarM3() {
  progresoActualEl.textContent = String(AFIRMACIONES_M3.length).padStart(2, "0");
  progresoTextoEl.textContent = `${AFIRMACIONES_M3.length} / ${AFIRMACIONES_M3.length}`;
  progressFillEl.style.width = "100%";

  reportarResultadoM3();

  const porcentaje = Math.round((aciertosM3 / AFIRMACIONES_M3.length) * 10000) / 100;
  const aprobado = porcentaje >= PORCENTAJE_APROBACION_M3;

  quizFrameEl.hidden = true;
  pantallaFinalEl.hidden = false;
  pantallaFinalEl.innerHTML = `
    <section class="result-card" id="result-card">
      <span class="result-badge" style="background:${aprobado ? "#278238" : "#e23c2f"}">
        ${aprobado ? "APROBADO" : "SIN APROBAR"}
      </span>
      <div class="result-user"><span id="result-nombre">${nombreM3}</span></div>
      <dl class="result-grid">
        <div><dt>Afirmaciones</dt><dd>${AFIRMACIONES_M3.length}</dd></div>
        <div><dt>Aciertos</dt><dd>${aciertosM3}</dd></div>
        <div><dt>Score</dt><dd>${aciertosM3} / ${AFIRMACIONES_M3.length}</dd></div>
        <div><dt>Porcentaje</dt><dd>${porcentaje.toFixed(2)} %</dd></div>
      </dl>
      <button type="button" class="login-submit" id="btn-retomar">Volver a intentar</button>
    </section>`;

  document.getElementById("btn-retomar").addEventListener("click", () => {
    afirmacionesM3 = barajarM3(AFIRMACIONES_M3);
    indiceActualM3 = 0;
    aciertosM3 = 0;
    playerScoreEl.textContent = "0";
    pantallaFinalEl.hidden = true;
    pantallaFinalEl.innerHTML = "";
    quizFrameEl.hidden = false;
    renderAfirmacionM3();
  });
}

renderAfirmacionM3();
