/* ══════════════════════════════════════════
   SGMA-ADSO — GAA 1 · AA 1 · Programación en Python
   Componentes evaluables, recursos, evidencias y
   registro de puntajes. El instructor asigna la fecha
   de cada componente y califica por competencia.
══════════════════════════════════════════ */

const ACTIVIDAD = {
  guia: 'GAA 1 — Guía de aprendizaje 1',
  actividad: 'AA 1 — Actividad de aprendizaje 1',
  tema: 'Programación en Python',
  minimoCompetencia: 105          // 70 % de los 150 puntos
};

const COMPONENTES = [
  { id: 'sondeo',    nombre: 'Cuestionario de sondeo de conocimientos',
    detalle: '20 preguntas de selección múltiple', puntos: 20 },
  { id: 'terminos',  nombre: 'Unir términos y definiciones',
    detalle: '6 términos con su definición', puntos: 30 },
  { id: 'glosario',  nombre: 'Glosario español – inglés por correspondencia',
    detalle: 'Correspondencia de vocabulario técnico', puntos: 50 },
  { id: 'practica',  nombre: 'Evaluación de práctica',
    detalle: 'Ejercicio resuelto en la consola de práctica', puntos: 50 }
];

const PUNTAJE_TOTAL = COMPONENTES.reduce((s, c) => s + c.puntos, 0);

const CLAVES_ACTIVIDAD = {
  fechas:     'sgma_act_fechas',
  puntajes:   'sgma_act_puntajes',
  evidencias: 'sgma_act_evidencias'
};

function leerActividad(clave, porDefecto) {
  try {
    const crudo = localStorage.getItem(clave);
    return crudo ? JSON.parse(crudo) : porDefecto;
  } catch (e) { return porDefecto; }
}

function guardarActividad(clave, valor) {
  try { localStorage.setItem(clave, JSON.stringify(valor)); } catch (e) {}
  return valor;
}

/* Puntaje de cada aprendiz: lo registrado por la instructora y, mientras
   no haya registro, un valor estable derivado del nombre para que la
   gráfica del panel no aparezca vacía. */
function puntajesDe(nomina) {
  const registro = leerActividad(CLAVES_ACTIVIDAD.puntajes, []);

  return nomina.map(nombre => {
    const propios = registro.filter(r => r.aprendiz === nombre);
    const real = propios.length > 0;

    const porComponente = {};
    COMPONENTES.forEach(c => {
      const anotado = propios.filter(r => r.componente === c.id).pop();
      if (anotado) { porComponente[c.id] = anotado.puntos; return; }
      porComponente[c.id] = real ? 0 : Math.round(pseudoAzar(semillaDe(nombre + c.id)) * c.puntos);
    });

    const total = COMPONENTES.reduce((s, c) => s + porComponente[c.id], 0);

    return {
      nombre,
      corto: nombre.split(',')[0].split(' ')[0],
      real,
      porComponente,
      total,
      porcentaje: Math.round((total / PUNTAJE_TOTAL) * 100),
      resultado: total >= ACTIVIDAD.minimoCompetencia ? 'Aprobado'
                 : total >= ACTIVIDAD.minimoCompetencia * 0.7 ? 'Por mejorar'
                 : 'No aprobado'
    };
  });
}

/* Barras verticales: una por aprendiz, con la línea del mínimo aprobatorio */
function graficoPuntajes(marcas) {
  const paso = 24;
  const ancho = Math.max(marcas.length * paso, 340);
  const alto = 210;
  const base = alto - 30;
  const util = base - 14;

  const svg = nodoSVG('svg', {
    viewBox: '0 0 ' + ancho + ' ' + alto, class: 'gr-svg', role: 'img',
    'aria-label': 'Puntaje de ' + marcas.length + ' aprendices sobre ' + PUNTAJE_TOTAL + ' puntos'
  });

  [0, 50, 100, 150].forEach(valor => {
    const y = base - (valor / PUNTAJE_TOTAL) * util;
    svg.appendChild(nodoSVG('line', { x1: 0, y1: y, x2: ancho, y2: y, class: 'gr-guia' }));
    textoSVG(svg, { x: 2, y: y - 3, class: 'gr-guia-texto' }, valor + ' pts');
  });

  marcas.forEach((m, i) => {
    const altura = Math.max((m.total / PUNTAJE_TOTAL) * util, 1);
    const barra = nodoSVG('rect', {
      x: i * paso + 7, y: base - altura, width: 15, height: altura, rx: 3,
      class: 'gr-barra ' + (m.resultado === 'Aprobado' ? 'gr-alta'
                          : m.resultado === 'Por mejorar' ? 'gr-media' : 'gr-baja')
    });
    const titulo = nodoSVG('title');
    titulo.textContent = m.nombre + ' — ' + m.total + '/' + PUNTAJE_TOTAL +
                         ' pts · ' + m.resultado + (m.real ? '' : ' (sin registrar)');
    barra.appendChild(titulo);
    svg.appendChild(barra);

    textoSVG(svg, {
      x: i * paso + 14.5, y: alto - 16, class: 'gr-eje',
      'text-anchor': 'end', transform: 'rotate(-60 ' + (i * paso + 14.5) + ' ' + (alto - 16) + ')'
    }, m.corto);
  });

  const yMinimo = base - (ACTIVIDAD.minimoCompetencia / PUNTAJE_TOTAL) * util;
  svg.appendChild(nodoSVG('line', { x1: 0, y1: yMinimo, x2: ancho, y2: yMinimo, class: 'gr-media-linea' }));
  textoSVG(svg, { x: ancho - 4, y: yMinimo - 5, class: 'gr-media-texto', 'text-anchor': 'end' },
           'Mínimo por competencia ' + ACTIVIDAD.minimoCompetencia + ' pts');

  return svg;
}

document.addEventListener('DOMContentLoaded', () => {

  const lienzo = document.getElementById('act-grafico');
  const tablaComponentes = document.getElementById('act-componentes');
  if (!lienzo && !tablaComponentes) return;

  const selFicha = document.getElementById('ins-ficha-activa');
  const fichaActiva = () =>
    (selFicha ? selFicha.value : (typeof FICHA_EN_CURSO !== 'undefined' ? FICHA_EN_CURSO : ''));
  const nomina = () =>
    (typeof getMatricula === 'function' ? getMatricula(fichaActiva()) : []);

  /* ── Componentes evaluables y su fecha ── */
  const pintarComponentes = () => {
    if (!tablaComponentes) return;
    const fechas = leerActividad(CLAVES_ACTIVIDAD.fechas, {});
    tablaComponentes.replaceChildren();

    COMPONENTES.forEach(comp => {
      const fila = document.createElement('tr');

      const nombre = document.createElement('td');
      const titulo = document.createElement('strong');
      titulo.textContent = comp.nombre;
      const detalle = document.createElement('p');
      detalle.className = 'act-detalle';
      detalle.textContent = comp.detalle;
      nombre.append(titulo, detalle);

      const puntos = document.createElement('td');
      puntos.className = 'act-puntos';
      puntos.textContent = comp.puntos + ' pts';

      const celdaFecha = document.createElement('td');
      const fecha = document.createElement('input');
      fecha.type = 'date';
      fecha.className = 'form-control form-control-sm';
      fecha.value = fechas[comp.id] || '';
      fecha.setAttribute('aria-label', 'Fecha de entrega de ' + comp.nombre);
      fecha.addEventListener('change', () => {
        const todas = leerActividad(CLAVES_ACTIVIDAD.fechas, {});
        todas[comp.id] = fecha.value;
        guardarActividad(CLAVES_ACTIVIDAD.fechas, todas);
        pintarComponentes();
      });
      celdaFecha.appendChild(fecha);

      const celdaEstado = document.createElement('td');
      const marca = document.createElement('span');
      marca.className = 'badge status-badge ' + (fechas[comp.id] ? 'status-active' : 'status-inactive');
      marca.textContent = fechas[comp.id] ? 'Programada' : 'Sin fecha';
      celdaEstado.appendChild(marca);

      fila.append(nombre, puntos, celdaFecha, celdaEstado);
      tablaComponentes.appendChild(fila);
    });
  };

  /* ── Gráfico de puntajes del grupo ── */
  const pintarGrafico = () => {
    if (!lienzo) return;
    const lista = nomina();
    lienzo.replaceChildren();

    if (!lista.length) {
      const vacio = document.createElement('p');
      vacio.className = 'pantalla-pie';
      vacio.textContent = 'No hay aprendices vinculados a la ficha.';
      lienzo.appendChild(vacio);
      return;
    }

    const marcas = puntajesDe(lista);
    lienzo.appendChild(graficoPuntajes(marcas));

    const aprobados = marcas.filter(m => m.resultado === 'Aprobado').length;
    const registrados = marcas.filter(m => m.real).length;
    const promedio = Math.round(marcas.reduce((s, m) => s + m.total, 0) / marcas.length);

    const pie = document.getElementById('act-grafico-pie');
    if (pie) {
      pie.textContent = lista.length + ' aprendices · promedio ' + promedio + '/' + PUNTAJE_TOTAL +
                        ' pts · ' + aprobados + ' aprobados · ' +
                        registrados + ' con puntaje registrado';
    }
  };

  /* ── Registro de puntaje por aprendiz y componente ── */
  const formPuntaje = document.getElementById('act-form-puntaje');
  const selAprendiz = document.getElementById('act-aprendiz');
  const selComponente = document.getElementById('act-componente');
  const campoPuntos = document.getElementById('act-puntos');
  const cuerpoNotas = document.getElementById('act-notas');

  const llenarSelectores = () => {
    if (!selAprendiz) return;
    selAprendiz.replaceChildren();
    nomina().forEach(nombre => {
      const op = document.createElement('option');
      op.value = nombre; op.textContent = nombre;
      selAprendiz.appendChild(op);
    });

    selComponente.replaceChildren();
    COMPONENTES.forEach(comp => {
      const op = document.createElement('option');
      op.value = comp.id;
      op.textContent = comp.nombre + ' (máx. ' + comp.puntos + ')';
      selComponente.appendChild(op);
    });
  };

  const topeDelComponente = () =>
    (COMPONENTES.find(c => c.id === selComponente.value) || COMPONENTES[0]).puntos;

  const pintarNotas = () => {
    if (!cuerpoNotas) return;
    const marcas = puntajesDe(nomina()).filter(m => m.real);
    cuerpoNotas.replaceChildren();

    if (!marcas.length) {
      const fila = document.createElement('tr');
      const celda = document.createElement('td');
      celda.colSpan = 3 + COMPONENTES.length;
      celda.className = 'tabla-vacia';
      celda.textContent = 'Todavía no se ha registrado ningún puntaje. La gráfica muestra valores simulados.';
      fila.appendChild(celda);
      cuerpoNotas.appendChild(fila);
      return;
    }

    marcas.forEach(m => {
      const fila = document.createElement('tr');

      const nombre = document.createElement('td');
      nombre.textContent = m.nombre;
      fila.appendChild(nombre);

      COMPONENTES.forEach(c => {
        const celda = document.createElement('td');
        celda.className = 'act-puntos';
        celda.textContent = m.porComponente[c.id] + '/' + c.puntos;
        fila.appendChild(celda);
      });

      const total = document.createElement('td');
      total.className = 'act-puntos';
      total.textContent = m.total + '/' + PUNTAJE_TOTAL + ' (' + m.porcentaje + '%)';
      fila.appendChild(total);

      const celdaResultado = document.createElement('td');
      const marca = document.createElement('span');
      marca.className = 'badge status-badge ' +
        (m.resultado === 'Aprobado' ? 'status-active'
         : m.resultado === 'Por mejorar' ? 'status-closed' : 'status-inactive');
      marca.textContent = m.resultado;
      celdaResultado.appendChild(marca);
      fila.appendChild(celdaResultado);

      cuerpoNotas.appendChild(fila);
    });
  };

  if (formPuntaje) {
    selComponente.addEventListener('change', () => {
      campoPuntos.max = topeDelComponente();
      campoPuntos.value = '';
    });

    formPuntaje.addEventListener('submit', e => {
      e.preventDefault();
      const tope = topeDelComponente();
      const puntos = Math.min(Math.max(Number(campoPuntos.value) || 0, 0), tope);

      const registro = leerActividad(CLAVES_ACTIVIDAD.puntajes, []);
      registro.push({
        aprendiz: selAprendiz.value,
        componente: selComponente.value,
        puntos,
        fecha: new Date().toISOString().slice(0, 10)
      });
      guardarActividad(CLAVES_ACTIVIDAD.puntajes, registro);

      campoPuntos.value = '';
      pintarNotas();
      pintarGrafico();
    });
  }

  /* ── Evidencias adjuntas ── */
  const formEvidencia = document.getElementById('act-form-evidencia');
  const archivoEvidencia = document.getElementById('act-archivo');
  const listaEvidencias = document.getElementById('act-evidencias');

  const pintarEvidencias = () => {
    if (!listaEvidencias) return;
    const guardadas = leerActividad(CLAVES_ACTIVIDAD.evidencias, []);
    listaEvidencias.replaceChildren();

    if (!guardadas.length) {
      const vacio = document.createElement('li');
      vacio.className = 'act-evidencia-vacia';
      vacio.textContent = 'Sin evidencias adjuntas para esta actividad.';
      listaEvidencias.appendChild(vacio);
      return;
    }

    guardadas.forEach(ev => {
      const fila = document.createElement('li');
      const nombre = document.createElement('span');
      nombre.textContent = ev.archivo;
      const meta = document.createElement('span');
      meta.className = 'act-evidencia-meta';
      meta.textContent = ev.aprendiz + ' · ' + ev.fecha;
      fila.append(nombre, meta);
      listaEvidencias.appendChild(fila);
    });
  };

  if (formEvidencia) {
    formEvidencia.addEventListener('submit', e => {
      e.preventDefault();
      const archivo = archivoEvidencia.files[0];
      if (!archivo) return;

      const guardadas = leerActividad(CLAVES_ACTIVIDAD.evidencias, []);
      guardadas.push({
        aprendiz: selAprendiz ? selAprendiz.value : '',
        archivo: archivo.name,
        fecha: new Date().toISOString().slice(0, 10)
      });
      guardarActividad(CLAVES_ACTIVIDAD.evidencias, guardadas);

      formEvidencia.reset();
      pintarEvidencias();
    });
  }

  // La pantalla del gráfico se abre también con el teclado
  const tarjetaGrafico = lienzo && lienzo.closest('[data-view]');
  if (tarjetaGrafico) {
    tarjetaGrafico.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tarjetaGrafico.click(); }
    });
  }

  const panelVideo = document.getElementById('act-panel-video');
  const botonVideo = document.querySelector('[data-act-video]');
  if (panelVideo && botonVideo) {
    botonVideo.addEventListener('click', () => {
      panelVideo.open = !panelVideo.open;
      if (panelVideo.open) panelVideo.scrollIntoView({ block: 'nearest' });
    });
  }

  if (selFicha) selFicha.addEventListener('change', () => {
    llenarSelectores(); pintarGrafico(); pintarNotas();
  });

  llenarSelectores();
  if (campoPuntos) campoPuntos.max = topeDelComponente();
  pintarComponentes();
  pintarGrafico();
  pintarNotas();
  pintarEvidencias();
});
