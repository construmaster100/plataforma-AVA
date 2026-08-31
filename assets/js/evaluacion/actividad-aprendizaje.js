/* ══════════════════════════════════════════
   2.5 Actividad de aprendizaje — pages/aprendiz.html
   Cada AA de la guía en curso (RA-01, ver assets/js/evaluacion/ra-tablero.js)
   se abre con sus cuatro M (M1..M4) como pestañas sobre un único iframe.
   El catálogo real sale de server/routes/actividades.js (mismo que usa
   Mi progreso — 72 RA, ver progreso-ra.js) y el estado aprobado/no
   aprobado del último intento sale de /api/resultados/{cedula}. Un M sin
   carpeta creada todavía (pages/Fichas Tecnicos y tecnologos/.../RA1/
   AA{n}/M{k}/) se muestra deshabilitado como "sin contenido aún".
══════════════════════════════════════════ */

const API_BASE_AA = '/api';
const RA_ACTIVIDAD_APRENDIZAJE = 1;
const FICHA_ACTIVIDAD_APRENDIZAJE = 'adso';
const PORCENTAJE_APROBACION_AA = 70;

function estadoAA(resultado) {
  if (!resultado) return { texto: 'Sin presentar', clase: '' };
  const porcentaje = resultado.totalPreguntas ? (resultado.puntaje / resultado.totalPreguntas) * 100 : 0;
  return porcentaje >= PORCENTAJE_APROBACION_AA
    ? { texto: 'Aprobado', clase: 'btn-outline-success' }
    : { texto: 'No aprobado', clase: 'btn-outline-warning' };
}

function cargarFrameAA(frame, material) {
  const params = new URLSearchParams(window.location.search);
  frame.src = material.embebidoUrl + '?doc=' + encodeURIComponent(params.get('doc') || '')
    + '&u=' + encodeURIComponent(params.get('u') || '')
    + '&ra=' + material.raId + '&aa=' + material.actividadIndex + '&m=' + material.materialIndex
    + '&ficha=' + material.ficha;
}

function construirBotonesAA(caja, catalogo, ultimos) {
  const aaId = Number(caja.dataset.aa);
  const estado = caja.querySelector('.aa-tabs-estado');
  const botones = caja.querySelector('.aa-tabs-botones');
  const frame = caja.querySelector('.aa-tabs-frame');
  botones.innerHTML = '';

  const materiales = catalogo.filter(a =>
    a.ficha === FICHA_ACTIVIDAD_APRENDIZAJE && a.raId === RA_ACTIVIDAD_APRENDIZAJE && a.actividadIndex === aaId);

  let primero = null;
  let conContenido = 0;

  [1, 2, 3, 4].forEach(m => {
    const material = materiales.find(x => x.materialIndex === m);
    const boton = document.createElement('button');
    boton.type = 'button';
    boton.className = 'btn btn-sm aa-tab-btn';

    if (!material) {
      boton.classList.add('btn-outline-secondary');
      boton.textContent = `VAA${m} — sin contenido aún`;
      boton.disabled = true;
      botones.appendChild(boton);
      return;
    }

    conContenido += 1;
    const { texto, clase } = estadoAA(ultimos.get(material.cuestionarioId));
    boton.classList.add(clase || 'btn-outline-secondary');
    boton.textContent = `VAA${m} · ${texto}`;
    boton.addEventListener('click', () => {
      botones.querySelectorAll('.aa-tab-btn').forEach(b => b.classList.remove('active'));
      boton.classList.add('active');
      cargarFrameAA(frame, material);
    });
    botones.appendChild(boton);
    if (!primero) primero = { boton, material };
  });

  estado.textContent = `RA-01 · AA${aaId} · ${conContenido} de 4 VAA con contenido.`;

  if (primero) {
    primero.boton.classList.add('active');
    cargarFrameAA(frame, primero.material);
  } else {
    frame.removeAttribute('src');
  }
}

async function iniciarAA(caja) {
  const estado = caja.querySelector('.aa-tabs-estado');
  estado.textContent = 'Cargando VAA…';

  const cedula = new URLSearchParams(window.location.search).get('doc');
  let catalogo, datos;
  try {
    [catalogo, datos] = await Promise.all([
      fetch(API_BASE_AA + '/actividades').then(r => r.json()),
      cedula
        ? fetch(API_BASE_AA + '/resultados/' + encodeURIComponent(cedula)).then(r => r.json()).catch(() => ({ historial: [] }))
        : Promise.resolve({ historial: [] }),
    ]);
  } catch (e) {
    estado.textContent = 'No se pudo conectar con el servidor de reportes (npm run start:adso).';
    return;
  }

  const ultimos = new Map();
  (datos.historial || []).forEach(h => {
    const previo = ultimos.get(h.cuestionario);
    if (!previo || new Date(h.createdAt) > new Date(previo.createdAt)) ultimos.set(h.cuestionario, h);
  });

  construirBotonesAA(caja, catalogo, ultimos);
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.aa-tabs[data-aa]').forEach(caja => {
    document.querySelectorAll('[data-view="sec-aa-' + caja.dataset.aa + '"]')
      .forEach(enlace => enlace.addEventListener('click', () => iniciarAA(caja)));
  });
});
