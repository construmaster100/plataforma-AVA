/* ==========================================================================
   Script de una sola vez: crea 2 RA de ejemplo (4 módulos cada uno) para la
   ficha "adso" y reporta resultados ya obtenidos por tres casos de prueba
   (dos aprendices reales de la nómina y una cuenta de prueba sintética),
   para tener un ejemplo funcionando de punta a punta en Módulo 4.

   Casos de prueba:
     · usuario1                      — cédula 12341234 (cuenta sintética,
       fuera de la nómina real: no aparece en "4.2 Resultados de evaluación"
       del instructor, que solo recorre REGISTRO_FICHA1 — sí es consultable
       directo por /api/quizzes/puntaje/12341234 y en aprendiz.html con
       ?doc=12341234 en la URL).
     · Miguel Arturo Castro Pacheco  — cédula 1049634950 (nómina real)
     · Mauro Alexandro Cative Garcia — cédula 1002687505 (nómina real)

   No pisa contenido existente: detecta el último RA con módulos creados
   en "adso" y usa los dos siguientes números libres. Sí fija (o sobrescribe)
   el puntaje objetivo de "adso" en 500 — es el valor pedido para estos
   casos de prueba, cámbialo en PUNTAJE_OBJETIVO_EJEMPLO si hace falta.

   Uso:
     node seed-ejemplo-modulo4.js
   (por defecto apunta a la app en vivo de Render; para probar contra tu
   servidor local corre primero "npm start" y usa:)
     BASE_URL=http://localhost:4000 node seed-ejemplo-modulo4.js

   Puedes borrar este archivo después de correrlo.
   ========================================================================== */

const BASE_URL = process.env.BASE_URL || 'https://plataforma-ava-wu3i.onrender.com';
const API = BASE_URL + '/api';
const FICHA = 'adso';
const AA = 1;

const APRENDICES = [
  { cedula: '12341234', nombre: 'usuario1' },
  { cedula: '1049634950', nombre: 'Miguel Arturo Castro Pacheco' },
  { cedula: '1002687505', nombre: 'Mauro Alexandro Cative Garcia' },
];

function preguntasEjemplo(modulo, n, puntos) {
  return Array.from({ length: n }, (_, i) => ({
    texto: `[Ejemplo] Pregunta ${i + 1} del Módulo ${modulo} — reemplázala con contenido real`,
    tipo: 'opciones',
    opciones: ['Opción A (ejemplo)', 'Opción B (ejemplo)', 'Opción C (ejemplo)', 'Opción D (ejemplo)'],
    respuestaCorrecta: 0,
    puntos,
  }));
}

async function crearModulo(raId, modulo, tipo, puntos) {
  const n = tipo === 'quiz' ? 10 : 30;
  const resp = await fetch(`${API}/quizzes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ficha: FICHA, raId, aa: AA, modulo, tipo,
      preguntas: preguntasEjemplo(modulo, n, puntos),
      limiteTiempoMinutos: 0, intentosPermitidos: 0,
      creadoPor: 'script-ejemplo',
    }),
  });
  const json = await resp.json();
  if (!resp.ok) throw new Error(`Error creando RA-${raId} Módulo ${modulo}: ${JSON.stringify(json)}`);
  return json;
}

async function desbloquear(cedula, raId) {
  await fetch(`${API}/acceso`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cedula, raId }),
  });
}

async function reportar(cedula, nombre, raId, modulo, aciertos, puntos) {
  const cuestionario = `${FICHA}-ra-${String(raId).padStart(2, '0')}-aa-${AA}-mod-${modulo}`;
  const totalPreguntas = (modulo === 4 ? 30 : 10) * puntos;
  const puntaje = aciertos * puntos;
  const resp = await fetch(`${API}/resultados`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cedula, nombre, modulo: FICHA, cuestionario, puntaje, totalPreguntas }),
  });
  if (!resp.ok) throw new Error(`Error reportando RA-${raId} Módulo ${modulo} de ${nombre}: ${await resp.text()}`);
  return puntaje;
}

// [tipo, puntosPorPregunta, aciertos usuario1, aciertos Miguel, aciertos Mauro]
// (de 10 preguntas en quiz, de 30 en evaluación — módulo 4)
const PLAN_RA_A = [
  ['quiz', 2, 8, 9, 6],
  ['quiz', 1, 6, 10, 7],
  ['quiz', 3, 9, 8, 5],
  ['evaluacion', 1, 20, 25, 18],
];
const PLAN_RA_B = [
  ['quiz', 1, 7, 10, 9],
  ['quiz', 2, 8, 9, 4],
  ['quiz', 1, 5, 7, 10],
  ['quiz', 2, 9, 10, 6],
];

async function crearRA(raId, plan) {
  console.log(`\n--- Creando RA-${String(raId).padStart(2, '0')} · AA${AA} (4 módulos) ---`);
  for (let i = 0; i < 4; i++) {
    const modulo = i + 1;
    const [tipo, puntos] = plan[i];
    await crearModulo(raId, modulo, tipo, puntos);
    console.log(`  Módulo ${modulo} (${tipo}) creado — ${puntos} pt/pregunta`);
  }
  for (const a of APRENDICES) await desbloquear(a.cedula, raId);
  console.log(`  Desbloqueado para: ${APRENDICES.map(a => a.nombre).join(', ')}`);

  for (let i = 0; i < 4; i++) {
    const modulo = i + 1;
    const [, puntos, ...aciertosPorAprendiz] = plan[i];
    const resultados = [];
    for (let j = 0; j < APRENDICES.length; j++) {
      const a = APRENDICES[j];
      const pts = await reportar(a.cedula, a.nombre, raId, modulo, aciertosPorAprendiz[j], puntos);
      resultados.push(`${a.nombre.split(' ')[0]} ${pts} pts`);
    }
    console.log(`  Módulo ${modulo}: ${resultados.join(' · ')}`);
  }
}

const PUNTAJE_OBJETIVO_EJEMPLO = 500;

(async () => {
  console.log('Conectando a', API);

  await fetch(`${API}/quizzes/config`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ficha: FICHA, puntajeObjetivo: PUNTAJE_OBJETIVO_EJEMPLO }),
  });
  console.log(`Puntaje objetivo de "${FICHA}" fijado en ${PUNTAJE_OBJETIVO_EJEMPLO} (para estos casos de prueba).`);

  const lista = await (await fetch(`${API}/quizzes`)).json();
  const raIdsAdso = lista.filter(q => q.ficha === FICHA).map(q => q.raId);
  const maxRA = raIdsAdso.length ? Math.max(...raIdsAdso) : 0;
  const RA_A = maxRA + 1;
  const RA_B = maxRA + 2;
  console.log(`RA existentes en "adso": [${[...new Set(raIdsAdso)].sort((a, b) => a - b).join(', ') || 'ninguno'}]`);
  console.log(`Voy a crear RA-${RA_A} y RA-${RA_B} (no toco los que ya existan).`);

  await crearRA(RA_A, PLAN_RA_A);
  await crearRA(RA_B, PLAN_RA_B);

  console.log('\n=== Listo ===');
  console.log(`Revisa "4.2 Resultados de evaluación" en instructor.html (busca a Miguel Arturo Castro Pacheco`);
  console.log(`y Mauro Alexandro Cative Garcia — usuario1 no aparece ahí por no ser de la nómina real,`);
  console.log(`pero sí responde GET ${API}/quizzes/puntaje/12341234) y en aprendiz.html con ?doc=<cédula>.`);
})().catch(e => { console.error('FALLÓ:', e.message); process.exit(1); });
