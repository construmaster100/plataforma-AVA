/* ==========================================================================
   M2 — Unir palabras y significados (20 palabras, 1 punto c/u)
   Fundamentos de Análisis y Desarrollo de Software (contenido de ejemplo).
   Cada palabra se presenta una vez, con su significado correcto entre 4
   opciones (las otras 3 son significados de otras palabras del banco) —
   mismo mecanismo probado que m1-cuestionario-10.js, sin reintentos.
   ========================================================================== */

const MODULO_M2 = "SENAEnglish";
const API_BASE_M2 = "/api";
const PORCENTAJE_APROBACION_M2 = 70;
const LETRAS_M2 = ["A", "B", "C", "D"];

const PALABRAS_M2 = [
  { termino: "Requisito", significado: "Condición o capacidad que un sistema debe cumplir" },
  { termino: "Algoritmo", significado: "Secuencia finita de pasos para resolver un problema" },
  { termino: "Variable", significado: "Espacio de memoria que almacena un valor" },
  { termino: "Función", significado: "Bloque de código reutilizable que realiza una tarea" },
  { termino: "Base de datos", significado: "Conjunto organizado de datos relacionados entre sí" },
  { termino: "Servidor", significado: "Equipo que provee servicios a otros equipos en red" },
  { termino: "Framework", significado: "Conjunto de herramientas y convenciones para desarrollar software" },
  { termino: "Depuración", significado: "Proceso de encontrar y corregir errores en el código" },
  { termino: "Compilador", significado: "Programa que traduce código fuente a código máquina" },
  { termino: "Interfaz", significado: "Punto de interacción entre el usuario y el sistema" },
  { termino: "Módulo", significado: "Parte independiente de un programa con una función específica" },
  { termino: "Bucle", significado: "Estructura que repite instrucciones mientras se cumpla una condición" },
  { termino: "Condicional", significado: "Estructura que ejecuta código según se cumpla o no una condición" },
  { termino: "Clase", significado: "Plantilla para crear objetos en programación orientada a objetos" },
  { termino: "Objeto", significado: "Instancia de una clase" },
  { termino: "Herencia", significado: "Mecanismo que permite a una clase adquirir propiedades de otra" },
  { termino: "Versión", significado: "Estado específico de un software en un momento del tiempo" },
  { termino: "Repositorio", significado: "Lugar donde se almacena y gestiona el código fuente" },
  { termino: "Prueba unitaria", significado: "Verificación del funcionamiento correcto de una unidad de código" },
  { termino: "Despliegue", significado: "Proceso de poner en funcionamiento un sistema en producción" },
];

function barajarM2(arr) {
  const copia = arr.slice();
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

function construirPreguntasM2() {
  return barajarM2(PALABRAS_M2).map((p, i) => {
    const distractores = barajarM2(PALABRAS_M2.filter(x => x.termino !== p.termino)).slice(0, 3).map(x => x.significado);
    const textos = barajarM2([p.significado, ...distractores]);
    const opciones = textos.map((texto, idx) => ({ id: LETRAS_M2[idx].toLowerCase(), texto }));
    const respuestaCorrecta = opciones.find(o => o.texto === p.significado).id;
    return { id: i, termino: p.termino, opciones, respuestaCorrecta };
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

const paramsM2 = new URLSearchParams(window.location.search);
const cedulaM2 = paramsM2.get("doc") || "";
const nombreM2 = paramsM2.get("u") || "Aprendiz";

let preguntasM2 = construirPreguntasM2();
let indiceActualM2 = 0;
let aciertosM2 = 0;
let respondiendoM2 = false;

playerNameEl.textContent = nombreM2;

function idCuestionarioM2() {
  const ra = paramsM2.get("ra");
  const aa = paramsM2.get("aa");
  const m = paramsM2.get("m") || "2";
  const ficha = paramsM2.get("ficha") || "adso";
  if (!ra || !aa) return "m2-unir-palabras";
  return `${ficha}-ra-${String(ra).padStart(2, "0")}-aa-${aa}-m-${m}`;
}

function renderProgresoM2() {
  const numero = indiceActualM2 + 1;
  progresoActualEl.textContent = String(numero).padStart(2, "0");
  progresoTextoEl.textContent = `${String(numero).padStart(2, "0")} / ${PALABRAS_M2.length}`;
  progressFillEl.style.width = `${(indiceActualM2 / PALABRAS_M2.length) * 100}%`;
}

function crearOpcionM2(opcion, letra, pregunta) {
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
  btn.addEventListener("click", () => onSeleccionarM2(opcion.id, btn, pregunta));
  return btn;
}

function renderPreguntaM2() {
  respondiendoM2 = false;
  const pregunta = preguntasM2[indiceActualM2];
  questionTextEl.textContent = `¿Cuál es el significado de "${pregunta.termino}"?`;
  renderProgresoM2();

  optionsGridEl.innerHTML = "";
  optionsGridEl.classList.remove("is-locked");
  pregunta.opciones.forEach((opcion, i) => {
    optionsGridEl.appendChild(crearOpcionM2(opcion, LETRAS_M2[i], pregunta));
  });
}

function onSeleccionarM2(opcionId, btn, pregunta) {
  if (respondiendoM2) return;
  respondiendoM2 = true;
  optionsGridEl.classList.add("is-locked");

  const correcta = pregunta.respuestaCorrecta === opcionId;
  if (correcta) aciertosM2 += 1;
  playerScoreEl.textContent = aciertosM2;

  btn.classList.add("is-flipped", correcta ? "is-correct" : "is-incorrect");
  btn.querySelector('[data-role="icon"]').textContent = correcta ? "✓" : "✕";
  btn.querySelector('[data-role="label"]').textContent = correcta ? "Acierto +1" : "Desacierto 0";
  if (!correcta) {
    const correctaCard = optionsGridEl.querySelector(`[data-opcion-id="${pregunta.respuestaCorrecta}"]`);
    if (correctaCard) correctaCard.classList.add("is-correct-hint");
  }

  setTimeout(() => {
    indiceActualM2 += 1;
    if (indiceActualM2 >= preguntasM2.length) {
      finalizarM2();
    } else {
      renderPreguntaM2();
    }
  }, 1000);
}

async function reportarResultadoM2() {
  if (!cedulaM2) return;
  try {
    await fetch(API_BASE_M2 + "/resultados", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cedula: cedulaM2,
        nombre: nombreM2,
        modulo: MODULO_M2,
        cuestionario: idCuestionarioM2(),
        puntaje: aciertosM2,
        totalPreguntas: PALABRAS_M2.length,
      }),
    });
  } catch (e) {
    // best-effort
  }
}

function finalizarM2() {
  progresoActualEl.textContent = String(PALABRAS_M2.length).padStart(2, "0");
  progresoTextoEl.textContent = `${PALABRAS_M2.length} / ${PALABRAS_M2.length}`;
  progressFillEl.style.width = "100%";

  reportarResultadoM2();

  const porcentaje = Math.round((aciertosM2 / PALABRAS_M2.length) * 10000) / 100;
  const aprobado = porcentaje >= PORCENTAJE_APROBACION_M2;

  quizFrameEl.hidden = true;
  pantallaFinalEl.hidden = false;
  pantallaFinalEl.innerHTML = `
    <section class="result-card" id="result-card">
      <span class="result-badge" style="background:${aprobado ? "#278238" : "#e23c2f"}">
        ${aprobado ? "APROBADO" : "SIN APROBAR"}
      </span>
      <div class="result-user"><span id="result-nombre">${nombreM2}</span></div>
      <dl class="result-grid">
        <div><dt>Palabras</dt><dd>${PALABRAS_M2.length}</dd></div>
        <div><dt>Aciertos</dt><dd>${aciertosM2}</dd></div>
        <div><dt>Score</dt><dd>${aciertosM2} / ${PALABRAS_M2.length}</dd></div>
        <div><dt>Porcentaje</dt><dd>${porcentaje.toFixed(2)} %</dd></div>
      </dl>
      <button type="button" class="login-submit" id="btn-retomar">Volver a intentar</button>
    </section>`;

  document.getElementById("btn-retomar").addEventListener("click", () => {
    preguntasM2 = construirPreguntasM2();
    indiceActualM2 = 0;
    aciertosM2 = 0;
    playerScoreEl.textContent = "0";
    pantallaFinalEl.hidden = true;
    pantallaFinalEl.innerHTML = "";
    quizFrameEl.hidden = false;
    renderPreguntaM2();
  });
}

renderPreguntaM2();
