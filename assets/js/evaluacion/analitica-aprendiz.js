/* ══════════════════════════════════════════
   SGMA-ADSO — Analítica del aprendiz

   La banda de indicadores y las dos series del «Tablero de
   puntajes de desempeño»: evolución del puntaje en el tiempo
   y desempeño por módulo.

   Todo sale de lo que el aprendiz realmente resolvió, que
   embebidos-catalogo.js guarda con fecha, mejor intento y
   número de intentos. Cuando no hay registros, se dice: no
   se dibuja una curva inventada.

   Depende de:
     · embebidos-catalogo.js → EMBEBIDOS, misPuntajes(), identidadActual()
     · asistencia.js         → resumenAsistencia() (opcional, para el KPI de asistencia)
══════════════════════════════════════════ */

const SVG_NS = 'http://www.w3.org/2000/svg';

function nodoSVG(etiqueta, atributos) {
  const nodo = document.createElementNS(SVG_NS, etiqueta);
  Object.keys(atributos || {}).forEach(k => nodo.setAttribute(k, atributos[k]));
  return nodo;
}

/* ── Los registros del aprendiz, ordenados por fecha ── */

function registrosDelAprendiz() {
  const catalogo = typeof EMBEBIDOS !== 'undefined' ? EMBEBIDOS : [];
  const puntajes = typeof misPuntajes === 'function' ? misPuntajes() : {};

  return Object.keys(puntajes)
    .map(id => {
      const ficha = catalogo.find(a => a.id === id);
      const dato = puntajes[id];
      return {
        id: id,
        titulo: ficha ? ficha.titulo : id,
        modulo: ficha ? ficha.modulo : 'Otros',
        puntaje: Number(dato.puntaje) || 0,
        mejor: Number(dato.mejor) || 0,
        intentos: Number(dato.intentos) || 0,
        fecha: dato.fecha ? new Date(dato.fecha) : null
      };
    })
    .filter(r => r.fecha && !isNaN(r.fecha))
    .sort((a, b) => a.fecha - b.fecha);
}

function mediaDe(numeros) {
  if (!numeros.length) return 0;
  return Math.round(numeros.reduce((s, n) => s + n, 0) / numeros.length);
}

/* ── Banda de indicadores ── */

function pintarBandaAnalitica(registros) {
  const nombre = document.getElementById('ds-nombre');
  if (nombre && typeof identidadActual === 'function') {
    nombre.textContent = identidadActual().nombre;
  }

  const corte = document.getElementById('ds-corte');
  if (corte) {
    corte.textContent = registros.length
      ? registros[registros.length - 1].fecha.toLocaleDateString('es-CO',
          { day: '2-digit', month: 'short', year: 'numeric' })
      : 'sin registros';
  }

  const lista = document.getElementById('ds-kpis');
  if (!lista) return;

  const mejores = registros.map(r => r.mejor);
  const media = mediaDe(mejores);

  // Tendencia: la media de la segunda mitad frente a la primera
  const mitad = Math.floor(registros.length / 2);
  const delta = registros.length >= 4
    ? mediaDe(mejores.slice(mitad)) - mediaDe(mejores.slice(0, mitad))
    : null;

  const intentos = registros.reduce((s, r) => s + r.intentos, 0);
  const primeraVez = registros.filter(r => r.intentos === 1).length;

  const kpis = [
    { rotulo: 'Puntaje medio',      valor: media,                   sufijo: '/100', delta: delta },
    { rotulo: 'Actividades',        valor: registros.length,        sufijo: '',     delta: null },
    { rotulo: 'Mejor resultado',    valor: mejores.length ? Math.max.apply(null, mejores) : 0,
      sufijo: '/100', delta: null },
    { rotulo: 'Acierto al 1.er intento',
      valor: registros.length ? Math.round(primeraVez * 100 / registros.length) : 0,
      sufijo: '%', delta: null, nota: intentos + ' intentos en total' }
  ];

  if (typeof resumenAsistencia === 'function' && typeof identidadActual === 'function') {
    const resumen = resumenAsistencia(identidadActual().clave);
    kpis.push({
      rotulo: 'Asistencia',
      valor: resumen.total ? Math.round(resumen.asiste * 100 / resumen.total) : 0,
      sufijo: '%', delta: null,
      nota: resumen.total ? resumen.total + ' días reportados' : 'sin reportes todavía'
    });
  }

  lista.replaceChildren();
  kpis.forEach(kpi => {
    const item = document.createElement('li');
    item.className = 'ds-kpi';

    const rotulo = document.createElement('span');
    rotulo.className = 'ds-kpi-rotulo';
    rotulo.textContent = kpi.rotulo;

    const cifra = document.createElement('span');
    cifra.className = 'ds-kpi-cifra';
    cifra.textContent = kpi.valor;

    if (kpi.sufijo) {
      const sufijo = document.createElement('span');
      sufijo.className = 'ds-kpi-sufijo';
      sufijo.textContent = kpi.sufijo;
      cifra.appendChild(sufijo);
    }

    item.append(rotulo, cifra);

    if (kpi.delta !== null) {
      const tendencia = document.createElement('span');
      tendencia.className = 'ds-kpi-delta';
      tendencia.dataset.signo = kpi.delta > 0 ? 'sube' : kpi.delta < 0 ? 'baja' : 'igual';
      tendencia.textContent = (kpi.delta > 0 ? '▲ +' : kpi.delta < 0 ? '▼ ' : '▬ ') + kpi.delta;
      tendencia.title = 'Media de la segunda mitad frente a la primera';
      item.appendChild(tendencia);
    } else if (kpi.nota) {
      const nota = document.createElement('span');
      nota.className = 'ds-kpi-nota';
      nota.textContent = kpi.nota;
      item.appendChild(nota);
    }

    lista.appendChild(item);
  });
}

/* ── Serie temporal del puntaje ── */

function pintarSerieAnalitica(registros) {
  const zona = document.getElementById('ds-serie');
  if (!zona) return;
  zona.replaceChildren();

  const cuenta = document.getElementById('ds-serie-n');
  if (cuenta) cuenta.textContent = registros.length;

  if (registros.length < 2) {
    const aviso = document.createElement('p');
    aviso.className = 'ds-vacio';
    aviso.textContent = registros.length
      ? 'Con una sola actividad no hay evolución que mostrar.'
      : 'Todavía no hay actividades resueltas.';
    zona.appendChild(aviso);
    return;
  }

  const ANCHO = 520, ALTO = 190, MARGEN = { arriba: 14, derecha: 10, abajo: 26, izquierda: 34 };
  const util = { x: ANCHO - MARGEN.izquierda - MARGEN.derecha,
                 y: ALTO - MARGEN.arriba - MARGEN.abajo };

  const svg = nodoSVG('svg', { viewBox: '0 0 ' + ANCHO + ' ' + ALTO,
                               class: 'ds-svg', preserveAspectRatio: 'xMidYMid meet' });

  const px = i => MARGEN.izquierda + (registros.length === 1 ? util.x / 2
                                      : util.x * i / (registros.length - 1));
  const py = v => MARGEN.arriba + util.y * (1 - v / 100);

  // Rejilla y escala
  [0, 25, 50, 75, 100].forEach(v => {
    svg.appendChild(nodoSVG('line', {
      class: 'ds-rejilla', x1: MARGEN.izquierda, x2: ANCHO - MARGEN.derecha,
      y1: py(v), y2: py(v)
    }));
    const etiqueta = nodoSVG('text', { class: 'ds-eje', x: MARGEN.izquierda - 7, y: py(v) + 3.5 });
    etiqueta.textContent = v;
    svg.appendChild(etiqueta);
  });

  // Media como línea de referencia
  const media = mediaDe(registros.map(r => r.mejor));
  svg.appendChild(nodoSVG('line', {
    class: 'ds-media', x1: MARGEN.izquierda, x2: ANCHO - MARGEN.derecha,
    y1: py(media), y2: py(media)
  }));
  const rotuloMedia = nodoSVG('text', {
    class: 'ds-media-rotulo', x: ANCHO - MARGEN.derecha, y: py(media) - 5, 'text-anchor': 'end' });
  rotuloMedia.textContent = 'media ' + media;
  svg.appendChild(rotuloMedia);

  const puntos = registros.map((r, i) => px(i) + ',' + py(r.mejor)).join(' ');

  svg.appendChild(nodoSVG('polygon', {
    class: 'ds-area',
    points: MARGEN.izquierda + ',' + py(0) + ' ' + puntos + ' ' +
            (ANCHO - MARGEN.derecha) + ',' + py(0)
  }));
  svg.appendChild(nodoSVG('polyline', { class: 'ds-linea', points: puntos }));

  registros.forEach((r, i) => {
    const punto = nodoSVG('circle', { class: 'ds-punto-serie', cx: px(i), cy: py(r.mejor), r: 4 });
    const titulo = nodoSVG('title', {});
    titulo.textContent = r.titulo + ' — ' + r.mejor + '/100 · ' +
      r.fecha.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
    punto.appendChild(titulo);
    svg.appendChild(punto);
  });

  zona.appendChild(svg);

  const pie = document.getElementById('ds-serie-pie');
  if (pie) {
    const primera = registros[0].fecha.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
    const ultima = registros[registros.length - 1].fecha
      .toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
    pie.textContent = 'Del ' + primera + ' al ' + ultima + ' · mejor intento de cada actividad.';
  }
}

/* ── Barras por módulo ── */

function pintarBarrasAnalitica(registros) {
  const zona = document.getElementById('ds-barras');
  if (!zona) return;
  zona.replaceChildren();

  const porModulo = {};
  registros.forEach(r => {
    if (!porModulo[r.modulo]) porModulo[r.modulo] = [];
    porModulo[r.modulo].push(r.mejor);
  });

  const filas = Object.keys(porModulo)
    .map(m => ({ modulo: m, media: mediaDe(porModulo[m]), n: porModulo[m].length }))
    .sort((a, b) => b.media - a.media)
    .slice(0, 8);

  const media = document.getElementById('ds-barras-media');
  if (media) media.textContent = mediaDe(filas.map(f => f.media));

  if (!filas.length) {
    const aviso = document.createElement('p');
    aviso.className = 'ds-vacio';
    aviso.textContent = 'Ningún módulo tiene actividades resueltas todavía.';
    zona.appendChild(aviso);
    return;
  }

  const tabla = document.createElement('ul');
  tabla.className = 'ds-barras';

  filas.forEach(fila => {
    const item = document.createElement('li');

    const nombre = document.createElement('span');
    nombre.className = 'ds-barra-nombre';
    nombre.textContent = fila.modulo;

    const riel = document.createElement('span');
    riel.className = 'ds-barra-riel';
    const relleno = document.createElement('span');
    relleno.className = 'ds-barra-relleno';
    relleno.dataset.nivel = fila.media >= 80 ? 'alto' : fila.media >= 60 ? 'medio' : 'bajo';
    relleno.style.width = fila.media + '%';
    riel.appendChild(relleno);

    const cifra = document.createElement('span');
    cifra.className = 'ds-barra-cifra';
    cifra.textContent = fila.media;
    cifra.title = fila.n + (fila.n === 1 ? ' actividad' : ' actividades');

    item.append(nombre, riel, cifra);
    tabla.appendChild(item);
  });

  zona.appendChild(tabla);
}

function pintarAnaliticaAprendiz() {
  const registros = registrosDelAprendiz();
  pintarBandaAnalitica(registros);
  pintarSerieAnalitica(registros);
  pintarBarrasAnalitica(registros);
}

document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('ds-kpis')) return;

  pintarAnaliticaAprendiz();

  window.addEventListener('message', evento => {
    if (evento.data && evento.data.tipo === 'sgma-puntaje') {
      setTimeout(pintarAnaliticaAprendiz, 60);
    }
  });

  window.addEventListener('storage', evento => {
    if (evento.key === 'sgma_puntajes_embebidos') pintarAnaliticaAprendiz();
  });
});
