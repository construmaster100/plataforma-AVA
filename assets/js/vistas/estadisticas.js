/* ══════════════════════════════════════════
   SGMA-ADSO — Analítica de fichas
   Perfil de cada aprendiz, medidas descriptivas del
   grupo, gráficos en SVG y aula tridimensional.
   Sin librerías externas.

   Los indicadores se derivan del nombre del aprendiz
   mediante una semilla, de modo que son ficticios pero
   ESTABLES: el mismo aprendiz da siempre el mismo dato.
══════════════════════════════════════════ */

const SEMANAS = 8;
const EVIDENCIAS_ESPERADAS = 12;
const SESIONES_PROGRAMADAS = 40;

/* ── Semilla determinista a partir del texto ── */
function semillaDe(texto) {
  let h = 2166136261;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pseudoAzar(semilla, indice) {
  const x = Math.sin(semilla * (indice + 1) * 0.0001) * 10000;
  return x - Math.floor(x);
}

/* ── Perfil de un aprendiz ── */
function perfilAprendiz(nombre) {
  const s = semillaDe(nombre);
  const avance = Math.round(32 + pseudoAzar(s, 1) * 63);
  const evidencias = Math.round((avance / 100) * EVIDENCIAS_ESPERADAS);
  const faltas = Math.round(pseudoAzar(s, 2) * 7);
  const inasistencias = Math.round(pseudoAzar(s, 3) * 4);

  const porSemana = [];
  let acumulado = 0;
  for (let w = 0; w < SEMANAS; w++) {
    const cuota = Math.round(pseudoAzar(s, 10 + w) * 2.2);
    const entrega = Math.max(Math.min(cuota, evidencias - acumulado), 0);
    acumulado += entrega;
    porSemana.push(entrega);
  }

  return {
    nombre: nombre,
    corto: nombre.split(',')[0],
    avance: avance,
    evidencias: evidencias,
    faltas: faltas,
    inasistencias: inasistencias,
    porSemana: porSemana,
    requiereMejora: avance < 60 || faltas >= 5
  };
}

/* ── Medidas descriptivas del grupo ── */
function medidas(valores) {
  if (!valores.length) return { n: 0, media: 0, mediana: 0, desviacion: 0, min: 0, max: 0, q1: 0, q3: 0 };

  const orden = valores.slice().sort((a, b) => a - b);
  const n = orden.length;
  const media = orden.reduce((s, v) => s + v, 0) / n;

  const cuantil = p => {
    const pos = (n - 1) * p;
    const bajo = Math.floor(pos);
    const alto = Math.ceil(pos);
    return bajo === alto ? orden[bajo] : orden[bajo] + (orden[alto] - orden[bajo]) * (pos - bajo);
  };

  const varianza = orden.reduce((s, v) => s + Math.pow(v - media, 2), 0) / n;
  const red = v => Math.round(v * 10) / 10;

  return {
    n: n, media: red(media), mediana: red(cuantil(0.5)),
    desviacion: red(Math.sqrt(varianza)), min: orden[0], max: orden[n - 1],
    q1: red(cuantil(0.25)), q3: red(cuantil(0.75))
  };
}

/* ── Reparto por rangos de avance ── */
function distribucion(valores) {
  const rangos = [
    { rotulo: '0 – 40 %',   min: 0,  max: 40,  tono: '#c62828' },
    { rotulo: '40 – 60 %',  min: 40, max: 60,  tono: '#e8590c' },
    { rotulo: '60 – 75 %',  min: 60, max: 75,  tono: '#f0a726' },
    { rotulo: '75 – 90 %',  min: 75, max: 90,  tono: '#39a900' },
    { rotulo: '90 – 100 %', min: 90, max: 101, tono: '#005c26' }
  ];
  return rangos.map(r => Object.assign({}, r, {
    cuantos: valores.filter(v => v >= r.min && v < r.max).length
  }));
}

/* ══════════════════════════════════════════
   Gráficos en SVG
══════════════════════════════════════════ */

const SVG_NS = 'http://www.w3.org/2000/svg';

function nodoSVG(etiqueta, atributos) {
  const nodo = document.createElementNS(SVG_NS, etiqueta);
  Object.entries(atributos || {}).forEach(([k, v]) => nodo.setAttribute(k, v));
  return nodo;
}

function textoSVG(padre, atributos, contenido) {
  const t = nodoSVG('text', atributos);
  t.textContent = contenido;
  padre.appendChild(t);
  return t;
}

/* Barras verticales: una por aprendiz, con la media del grupo marcada */
function graficoAvance(perfiles, media) {
  const ancho = Math.max(perfiles.length * 22, 320);
  const alto = 190;
  const base = alto - 26;

  const svg = nodoSVG('svg', {
    viewBox: '0 0 ' + ancho + ' ' + alto, class: 'gr-svg', role: 'img',
    'aria-label': 'Avance individual de ' + perfiles.length + ' aprendices'
  });

  [0, 25, 50, 75, 100].forEach(marca => {
    const y = base - (marca / 100) * (base - 12);
    svg.appendChild(nodoSVG('line', { x1: 0, y1: y, x2: ancho, y2: y, class: 'gr-guia' }));
    textoSVG(svg, { x: 2, y: y - 3, class: 'gr-guia-texto' }, marca + '%');
  });

  perfiles.forEach((p, i) => {
    const altura = (p.avance / 100) * (base - 12);
    const barra = nodoSVG('rect', {
      x: i * 22 + 6, y: base - altura, width: 14, height: altura, rx: 3,
      class: 'gr-barra ' + (p.avance < 60 ? 'gr-baja' : p.avance < 75 ? 'gr-media' : 'gr-alta')
    });
    const titulo = nodoSVG('title');
    titulo.textContent = p.nombre + ' — ' + p.avance + '%';
    barra.appendChild(titulo);
    svg.appendChild(barra);
  });

  const yMedia = base - (media / 100) * (base - 12);
  svg.appendChild(nodoSVG('line', { x1: 0, y1: yMedia, x2: ancho, y2: yMedia, class: 'gr-media-linea' }));
  textoSVG(svg, { x: ancho - 4, y: yMedia - 5, class: 'gr-media-texto', 'text-anchor': 'end' },
           'Media del grupo ' + media + '%');

  return svg;
}

/* Reparto por rangos, en barras horizontales */
function graficoDistribucion(rangos, total) {
  const contenedor = document.createElement('div');
  contenedor.className = 'gr-distribucion';

  rangos.forEach(r => {
    const fila = document.createElement('div');
    fila.className = 'gr-rango';

    const rotulo = document.createElement('span');
    rotulo.className = 'gr-rango-nombre';
    rotulo.textContent = r.rotulo;

    const pista = document.createElement('span');
    pista.className = 'gr-rango-pista';
    const relleno = document.createElement('i');
    relleno.style.width = Math.round((r.cuantos / (total || 1)) * 100) + '%';
    relleno.style.background = r.tono;
    pista.appendChild(relleno);

    const cifra = document.createElement('span');
    cifra.className = 'gr-rango-cifra';
    cifra.textContent = r.cuantos;

    fila.append(rotulo, pista, cifra);
    contenedor.appendChild(fila);
  });

  return contenedor;
}

/* Evidencias entregadas semana a semana */
function graficoEvidencias(perfiles) {
  const totales = Array.from({ length: SEMANAS }, (_, w) =>
    perfiles.reduce((suma, p) => suma + p.porSemana[w], 0));

  const ancho = 460, alto = 170, base = alto - 26, margen = 34;
  const maximo = Math.max.apply(null, totales.concat([1]));
  const paso = (ancho - margen - 10) / (SEMANAS - 1);

  const svg = nodoSVG('svg', {
    viewBox: '0 0 ' + ancho + ' ' + alto, class: 'gr-svg', role: 'img',
    'aria-label': 'Evidencias entregadas por semana'
  });

  [0, 0.5, 1].forEach(f => {
    const y = base - f * (base - 14);
    svg.appendChild(nodoSVG('line', { x1: margen, y1: y, x2: ancho - 6, y2: y, class: 'gr-guia' }));
    textoSVG(svg, { x: 2, y: y + 3, class: 'gr-guia-texto' }, Math.round(maximo * f));
  });

  const puntos = totales.map((v, i) =>
    (margen + i * paso) + ',' + (base - (v / maximo) * (base - 14)));

  svg.appendChild(nodoSVG('polygon', {
    points: margen + ',' + base + ' ' + puntos.join(' ') + ' ' + (margen + (SEMANAS - 1) * paso) + ',' + base,
    class: 'gr-area'
  }));
  svg.appendChild(nodoSVG('polyline', { points: puntos.join(' '), class: 'gr-linea' }));

  totales.forEach((v, i) => {
    const cx = margen + i * paso;
    const cy = base - (v / maximo) * (base - 14);
    const punto = nodoSVG('circle', { cx: cx, cy: cy, r: 4, class: 'gr-punto' });
    const titulo = nodoSVG('title');
    titulo.textContent = 'Semana ' + (i + 1) + ': ' + v + ' evidencias';
    punto.appendChild(titulo);
    svg.appendChild(punto);
    textoSVG(svg, { x: cx, y: alto - 6, class: 'gr-eje', 'text-anchor': 'middle' }, 'S' + (i + 1));
  });

  return svg;
}

/* ══════════════════════════════════════════
   Aula tridimensional: cada aprendiz es una
   columna que crece con su avance, dispuesta
   sobre el piso de un cubo en perspectiva.
══════════════════════════════════════════ */
function aulaTridimensional(perfiles, fichaId) {
  const escena = document.createElement('div');
  escena.className = 'aula3d';

  const cubo = document.createElement('div');
  cubo.className = 'aula3d-cubo';

  ['aula3d-pared-fondo', 'aula3d-pared-lado', 'aula3d-piso'].forEach(clase => {
    const cara = document.createElement('div');
    cara.className = 'aula3d-cara ' + clase;
    cubo.appendChild(cara);
  });

  const rejilla = document.createElement('div');
  rejilla.className = 'aula3d-rejilla';

  perfiles.forEach(p => {
    const puesto = document.createElement('div');
    puesto.className = 'aula3d-puesto';

    const columna = document.createElement('div');
    columna.className = 'aula3d-columna ' +
      (p.avance < 60 ? 'col-baja' : p.avance < 75 ? 'col-media' : 'col-alta');
    columna.style.height = Math.max(Math.round(p.avance * 0.9), 8) + 'px';
    columna.title = p.nombre + ' — ' + p.avance + ' % de avance';

    const cifra = document.createElement('span');
    cifra.className = 'aula3d-cifra';
    cifra.textContent = p.avance;
    columna.appendChild(cifra);

    const base = document.createElement('span');
    base.className = 'aula3d-base';

    puesto.append(columna, base);
    rejilla.appendChild(puesto);
  });

  cubo.appendChild(rejilla);
  escena.appendChild(cubo);

  const pie = document.createElement('p');
  pie.className = 'aula3d-pie';
  pie.textContent = 'Ficha ' + fichaId + ' · ' + perfiles.length +
                    ' aprendices · altura proporcional al avance';
  escena.appendChild(pie);

  return escena;
}

/* ══════════════════════════════════════════
   Vistas del administrador
══════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

  const selEstadistica = document.getElementById('est-ficha');
  const selReporte = document.getElementById('rep-ficha');
  const lienzoAula = document.getElementById('pt-aula');
  if (!selEstadistica && !selReporte && !lienzoAula) return;

  const nomina = fichaId =>
    (typeof getMatricula === 'function' ? getMatricula(fichaId) : []);

  const llenarFichas = select => {
    if (!select) return;
    select.replaceChildren();
    Object.entries(FICHAS_SISTEMA).forEach(([id, ficha]) => {
      const opcion = document.createElement('option');
      opcion.value = id;
      opcion.textContent = 'Ficha ' + id + ' — ' + ficha.programa;
      select.appendChild(opcion);
    });
  };

  llenarFichas(selEstadistica);
  llenarFichas(selReporte);

  /* ── Aula tridimensional del tablero ── */
  const selAula = document.getElementById('pt-aula-ficha');
  if (lienzoAula) {
    llenarFichas(selAula);
    const pintarAula = () => {
      const fichaId = selAula ? selAula.value : FICHA_EN_CURSO;
      const perfiles = nomina(fichaId).map(perfilAprendiz);
      const m = medidas(perfiles.map(p => p.avance));

      lienzoAula.replaceChildren(aulaTridimensional(perfiles, fichaId));

      const resumen = document.getElementById('pt-aula-resumen');
      if (resumen) {
        resumen.textContent = 'Media ' + m.media + ' % · Mediana ' + m.mediana +
                              ' % · Desviación ' + m.desviacion;
      }
    };
    if (selAula) selAula.addEventListener('change', pintarAula);
    pintarAula();
  }

  /* ── Estadísticas ── */
  const pintarEstadisticas = () => {
    const perfiles = nomina(selEstadistica.value).map(perfilAprendiz);
    const avances = perfiles.map(p => p.avance);
    const m = medidas(avances);

    document.getElementById('est-n').textContent = m.n + ' aprendices';

    const zonaMedidas = document.getElementById('est-medidas');
    zonaMedidas.replaceChildren();
    [['Media', m.media + ' %'], ['Mediana', m.mediana + ' %'],
     ['Desviación', m.desviacion], ['Mínimo', m.min + ' %'],
     ['Máximo', m.max + ' %'], ['Q1 – Q3', m.q1 + ' – ' + m.q3]
    ].forEach(par => {
      const caja = document.createElement('div');
      caja.className = 'medida';
      const v = document.createElement('span');
      v.className = 'medida-valor';
      v.textContent = par[1];
      const r = document.createElement('span');
      r.className = 'medida-rotulo';
      r.textContent = par[0];
      caja.append(v, r);
      zonaMedidas.appendChild(caja);
    });

    document.getElementById('est-avance').replaceChildren(graficoAvance(perfiles, m.media));
    document.getElementById('est-distribucion').replaceChildren(graficoDistribucion(distribucion(avances), m.n));
    document.getElementById('est-evidencias').replaceChildren(graficoEvidencias(perfiles));
    document.getElementById('est-aula').replaceChildren(aulaTridimensional(perfiles, selEstadistica.value));
  };

  if (selEstadistica) {
    selEstadistica.addEventListener('change', pintarEstadisticas);
    pintarEstadisticas();
  }

  /* ── Reportes ── */
  if (!selReporte) return;

  const salida = document.getElementById('rep-salida');

  const tabla = (titulo, cabeceras, filas) => {
    const bloque = document.createElement('section');
    bloque.className = 'rep-bloque';

    const h = document.createElement('h2');
    h.textContent = titulo;
    bloque.appendChild(h);

    if (!filas.length) {
      const vacio = document.createElement('p');
      vacio.className = 'sugerencia';
      vacio.textContent = 'Sin registros.';
      bloque.appendChild(vacio);
      return bloque;
    }

    const t = document.createElement('table');
    t.className = 'table table-hover align-middle data-table';

    const thead = document.createElement('thead');
    const filaCab = document.createElement('tr');
    cabeceras.forEach(c => {
      const th = document.createElement('th');
      th.textContent = c;
      filaCab.appendChild(th);
    });
    thead.appendChild(filaCab);

    const tbody = document.createElement('tbody');
    filas.forEach(fila => {
      const tr = document.createElement('tr');
      fila.forEach(celda => {
        const td = document.createElement('td');
        td.textContent = celda;
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });

    t.append(thead, tbody);
    bloque.appendChild(t);
    return bloque;
  };

  const generar = () => {
    const fichaId = selReporte.value;
    const ficha = FICHAS_SISTEMA[fichaId];
    const perfiles = nomina(fichaId).map(perfilAprendiz);
    const m = medidas(perfiles.map(p => p.avance));
    const elegidos = Array.from(document.querySelectorAll('.rep-opciones input:checked'))
                          .map(i => i.value);

    salida.replaceChildren();

    const cabecera = document.createElement('div');
    cabecera.className = 'rep-cabecera';

    const titulo = document.createElement('h2');
    titulo.textContent = 'Reporte de la ficha ' + fichaId;

    const titular = (typeof getAsignaciones === 'function'
      ? getAsignaciones().find(a => a.fichaId === fichaId) : null);

    const meta = document.createElement('p');
    meta.className = 'rep-meta';
    meta.textContent = ficha.programa + ' · ' + ficha.modalidad +
      ' · Instructor: ' + (titular ? titular.nombre : 'sin asignar') +
      ' · Generado el ' + new Date().toLocaleDateString('es-CO') +
      ' · ' + m.n + ' aprendices · Media ' + m.media + ' %';

    cabecera.append(titulo, meta);
    salida.appendChild(cabecera);

    if (elegidos.indexOf('aprendices') >= 0) {
      salida.appendChild(tabla('Aprendices de la ficha',
        ['Aprendiz', 'Avance', 'Evidencias', 'Estado'],
        perfiles.map(p => [p.nombre, p.avance + ' %',
          p.evidencias + ' / ' + EVIDENCIAS_ESPERADAS,
          p.avance >= 75 ? 'Al día' : p.avance >= 60 ? 'Con pendientes' : 'En riesgo'])));
    }

    if (elegidos.indexOf('resultados') >= 0) {
      const resultados = (typeof getResultados === 'function' ? getResultados(fichaId) : []);
      salida.appendChild(tabla('Resultados de aprendizaje',
        ['Código', 'Descripción', 'Aprendices por encima del 60 %'],
        resultados.map(r => [r.codigo, r.descripcion,
          perfiles.filter(p => p.avance >= 60).length + ' de ' + m.n])));
    }

    if (elegidos.indexOf('evidencias') >= 0) {
      const porSemana = Array.from({ length: SEMANAS }, (_, w) =>
        perfiles.reduce((s, p) => s + p.porSemana[w], 0));
      salida.appendChild(tabla('Entrega de evidencias en el tiempo',
        ['Semana', 'Evidencias entregadas', 'Promedio por aprendiz'],
        porSemana.map((v, i) => ['Semana ' + (i + 1), v, (m.n ? (v / m.n).toFixed(1) : '0')])));
    }

    if (elegidos.indexOf('asistencia') >= 0) {
      const conFaltas = perfiles.filter(p => p.faltas > 0 || p.inasistencias > 0);
      salida.appendChild(tabla('Faltas e inasistencias',
        ['Aprendiz', 'Faltas', 'Inasistencias', 'Asistencia'],
        conFaltas.map(p => [p.nombre, p.faltas, p.inasistencias,
          Math.round(((SESIONES_PROGRAMADAS - p.faltas - p.inasistencias) / SESIONES_PROGRAMADAS) * 100) + ' %'])));
    }

    if (elegidos.indexOf('mejoramiento') >= 0) {
      const enMejora = perfiles.filter(p => p.requiereMejora);
      salida.appendChild(tabla('Planes de mejoramiento',
        ['Aprendiz', 'Avance', 'Motivo', 'Actividad requerida'],
        enMejora.map(p => [p.nombre, p.avance + ' %',
          p.avance < 60 ? 'Avance por debajo del 60 %' : 'Cinco o más faltas',
          p.avance < 60 ? 'Nivelación de resultados pendientes' : 'Plan de asistencia y recuperación'])));
    }
  };

  document.getElementById('rep-generar').addEventListener('click', generar);
  document.getElementById('rep-imprimir').addEventListener('click', () => {
    if (!salida.childElementCount) generar();
    window.print();
  });

  generar();
});
