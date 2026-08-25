/* ══════════════════════════════════════════
   SGMA-ADSO — Avance general del aprendiz

   Gráfico circular del «Tablero de puntajes de desempeño».
   Se completa con cinco cosas que el aprendiz hace:

     1. Consultar contenidos   → vistas del panel que ha abierto
     2. Interactuar materiales → recursos embebidos que ha abierto
     3. Reportar puntajes      → actividades puntuables resueltas
     4. Subir evidencias       → niveles asignados ya presentados
     5. Asistencia registrada  → días con reporte de asistencia

   Las dos primeras no se podían medir: nadie llevaba registro
   de lo consultado. Aquí se anota, bajo la identidad de quien
   está en pantalla, en «sgma_avance».

   Una parte sin denominador (nada asignado todavía, por ejemplo)
   no se inventa: se muestra «sin datos» y queda fuera del
   promedio, para que la rueda no premie lo que no existe.

   Depende de:
     · embebidos-catalogo.js → EMBEBIDOS, misPuntajes(), identidadActual()
     · plan-formativo.js     → contenidoAsignado(), fichaDeQuienJuega()
     · asistencia.js         → resumenAsistencia()
══════════════════════════════════════════ */

const CLAVE_AVANCE = 'sgma_avance';

function leerAvance() {
  try {
    const crudo = JSON.parse(localStorage.getItem(CLAVE_AVANCE));
    return crudo && typeof crudo === 'object' ? crudo : {};
  } catch (e) {
    return {};
  }
}

function claveDeAvance() {
  return typeof identidadActual === 'function' ? identidadActual().clave : 'anonimo';
}

/* Anota algo visitado. Devuelve true sólo si era nuevo, para no
   repintar la rueda en cada clic repetido. */
function anotarAvance(grupo, valor) {
  if (!valor) return false;

  const todos = leerAvance();
  const mio = todos[claveDeAvance()] || {};
  const lista = Array.isArray(mio[grupo]) ? mio[grupo] : [];
  if (lista.indexOf(valor) !== -1) return false;

  lista.push(valor);
  mio[grupo] = lista;
  todos[claveDeAvance()] = mio;
  try { localStorage.setItem(CLAVE_AVANCE, JSON.stringify(todos)); } catch (e) {}
  return true;
}

function visitadas(grupo) {
  const mio = leerAvance()[claveDeAvance()] || {};
  return Array.isArray(mio[grupo]) ? mio[grupo] : [];
}

/* ── Las cuatro partes del avance ── */

function partesDelAvance() {
  const catalogo = typeof EMBEBIDOS !== 'undefined' ? EMBEBIDOS : [];
  const puntajes = typeof misPuntajes === 'function' ? misPuntajes() : {};

  // 1. Contenidos consultados: cuántas vistas del panel ha abierto
  const destinos = new Set();
  document.querySelectorAll('.sidebar-menu [data-view]')
    .forEach(a => destinos.add(a.getAttribute('data-view')));
  const vistas = visitadas('vistas').filter(v => destinos.has(v));

  // 2. Materiales: recursos embebidos abiertos alguna vez
  const materiales = visitadas('materiales')
    .filter(id => catalogo.some(a => a.id === id));

  // 3. Puntajes: actividades puntuables con resultado registrado
  const puntuables = catalogo.filter(a => a.puntua);
  const resueltas = puntuables.filter(a => puntajes[a.id]);

  // 4. Evidencias: de lo asignado por el instructor, lo ya presentado
  let asignadas = [], presentadas = [];
  if (typeof contenidoAsignado === 'function' && typeof fichaDeQuienJuega === 'function') {
    try {
      asignadas = contenidoAsignado(fichaDeQuienJuega(), puntajes) || [];
      presentadas = asignadas.filter(a => a.hecha);
    } catch (e) {
      asignadas = [];
    }
  }

  // 5. Asistencia: de los días reportados, cuántos fueron «Asiste»
  let asistidos = 0, reportados = 0;
  if (typeof resumenAsistencia === 'function') {
    const resumen = resumenAsistencia(claveDeAvance());
    asistidos = resumen.asiste;
    reportados = resumen.total;
  }

  return [
    { id: 'consulta',    icono: '📖', rotulo: 'Contenidos consultados', hecho: vistas.length,      total: destinos.size },
    { id: 'materiales',  icono: '🧩', rotulo: 'Materiales trabajados',  hecho: materiales.length,  total: catalogo.length },
    { id: 'puntajes',    icono: '⭐', rotulo: 'Puntajes reportados',    hecho: resueltas.length,   total: puntuables.length },
    { id: 'evidencias',  icono: '📤', rotulo: 'Evidencias presentadas', hecho: presentadas.length, total: asignadas.length },
    { id: 'asistencia',  icono: '🗓️', rotulo: 'Asistencia registrada',  hecho: asistidos,          total: reportados }
  ];
}

function porcentajeDeParte(parte) {
  if (!parte.total) return null;                       // sin denominador: no se promedia
  return Math.min(100, Math.round(parte.hecho * 100 / parte.total));
}

/* ── Barra de progreso a nivel de ficha (tiempo transcurrido) ──
   Distinta de la rueda de arriba: no mide lo que el aprendiz hizo,
   sino cuánto del calendario de la ficha ya pasó (días/semanas),
   usando las mismas fechas de FASES (tiempo.js) que ya alimentan
   la línea de tiempo y el calendario del panel. */
function progresoTiempoFicha() {
  if (typeof FASES === 'undefined' || !FASES.length) return null;

  const inicio = new Date(FASES[0].inicio);
  const fin = new Date(FASES[FASES.length - 1].fin);
  const hoy = new Date();

  const totalDias = Math.max(1, Math.round((fin - inicio) / 86400000));
  const diasTranscurridos = Math.min(totalDias, Math.max(0, Math.round((hoy - inicio) / 86400000)));

  return {
    inicio: FASES[0].inicio,
    fin: FASES[FASES.length - 1].fin,
    diasTotales: totalDias,
    diasTranscurridos: diasTranscurridos,
    semanasTotales: Math.ceil(totalDias / 7),
    semanasTranscurridas: Math.ceil(diasTranscurridos / 7),
    porcentaje: Math.round(diasTranscurridos * 100 / totalDias)
  };
}

function pintarProgresoTiempoFicha(idBarra, idEtiqueta) {
  const barra = document.getElementById(idBarra);
  const etiqueta = document.getElementById(idEtiqueta);
  const progreso = progresoTiempoFicha();
  if (!progreso) return;

  if (barra) {
    const relleno = barra.querySelector('.progress-fill') || barra;
    relleno.style.width = progreso.porcentaje + '%';
  }
  if (etiqueta) {
    etiqueta.textContent = 'Semana ' + progreso.semanasTranscurridas + ' de ' + progreso.semanasTotales +
      ' — ' + progreso.porcentaje + '% del programa de formación ejecutado';
  }
}

/* ── Pintado ── */

const RADIO_RUEDA = 54;
const VUELTA = 2 * Math.PI * RADIO_RUEDA;

function pintarAvanceAprendiz() {
  const trazo = document.getElementById('avance-trazo');
  const lista = document.getElementById('avance-partes');
  if (!trazo || !lista) return;

  const partes = partesDelAvance();
  const medibles = partes.map(porcentajeDeParte).filter(p => p !== null);
  const global = medibles.length
    ? Math.round(medibles.reduce((s, p) => s + p, 0) / medibles.length)
    : 0;

  // El trazo se dibuja desde arriba: la vuelta menos lo alcanzado
  trazo.style.strokeDasharray = VUELTA + ' ' + VUELTA;
  trazo.style.strokeDashoffset = VUELTA * (1 - global / 100);
  trazo.parentElement.parentElement.dataset.tono =
    global >= 80 ? 'alto' : global >= 40 ? 'medio' : 'bajo';

  const numero = document.getElementById('avance-numero');
  if (numero) numero.textContent = global;

  const pie = document.getElementById('avance-pie');
  if (pie) {
    pie.textContent = medibles.length === 0
      ? 'sin actividad registrada'
      : medibles.length < partes.length
        ? 'sobre ' + medibles.length + ' de ' + partes.length + ' partes'
        : 'de todo el recorrido';
  }

  lista.replaceChildren();
  partes.forEach(parte => {
    const pct = porcentajeDeParte(parte);

    const item = document.createElement('li');
    item.className = 'avance-parte' + (pct === null ? ' es-sin-datos' : '');

    const cabecera = document.createElement('div');
    cabecera.className = 'avance-parte-cabecera';

    const nombre = document.createElement('span');
    nombre.className = 'avance-parte-rotulo';
    nombre.textContent = parte.icono + ' ' + parte.rotulo;

    const cifra = document.createElement('span');
    cifra.className = 'avance-parte-cifra';
    cifra.textContent = pct === null
      ? 'sin datos'
      : parte.hecho + ' / ' + parte.total + ' · ' + pct + '%';

    cabecera.append(nombre, cifra);

    const riel = document.createElement('div');
    riel.className = 'avance-parte-riel';
    const relleno = document.createElement('div');
    relleno.className = 'avance-parte-relleno';
    relleno.style.width = (pct === null ? 0 : pct) + '%';
    riel.appendChild(relleno);

    item.append(cabecera, riel);
    lista.appendChild(item);
  });
}

/* ── Registro de lo que el aprendiz va haciendo ── */

document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('avance-rueda')) return;

  // Consultar un contenido: abrir una vista desde el menú lateral
  document.querySelectorAll('.sidebar-menu [data-view]').forEach(enlace => {
    enlace.addEventListener('click', () => {
      if (anotarAvance('vistas', enlace.getAttribute('data-view'))) pintarAvanceAprendiz();
    });
  });

  // Interactuar con un material: abrir un recurso embebido
  document.addEventListener('click', evento => {
    const enlace = evento.target.closest('a[href*="/embebidos/"]');
    if (!enlace) return;
    const partes = enlace.getAttribute('href').split('/embebidos/')[1];
    const id = partes ? partes.split('/')[0] : '';
    if (anotarAvance('materiales', id)) pintarAvanceAprendiz();
  });

  // Un puntaje que llega de una actividad embebida mueve la rueda
  window.addEventListener('message', evento => {
    if (evento.data && evento.data.tipo === 'sgma-puntaje') {
      setTimeout(pintarAvanceAprendiz, 60);
    }
  });

  // Otra pestaña del mismo navegador también la mueve
  window.addEventListener('storage', evento => {
    if (evento.key === CLAVE_AVANCE || evento.key === 'sgma_puntajes_embebidos'
        || evento.key === 'sgma_plan_formativo') {
      pintarAvanceAprendiz();
    }
  });

  pintarAvanceAprendiz();
});

/* Independiente del guardia de arriba: esta barra también se pinta
   en el panel del instructor, que no tiene avance-rueda. */
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('ficha-tiempo-barra')) {
    pintarProgresoTiempoFicha('ficha-tiempo-barra', 'ficha-tiempo-etiqueta');
  }
});
