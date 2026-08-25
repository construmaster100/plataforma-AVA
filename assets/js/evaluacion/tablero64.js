/* ══════════════════════════════════════════
   SGMA-ADSO — Tablero de 64 bits
   Ocho por ocho: 64 bits, cada uno con uno de tres
   tonos y un valor de logro entre 0 y 1.

   Cuatro maneras de mirarlo, disponibles en los tres
   roles: planta, barras, isométrica y torres en volumen.
   El tono da la lectura rápida; el valor da la altura.
══════════════════════════════════════════ */

/* Cada reporte reparte los 64 bits a su manera */
const REPORTES_64 = {
  aa1: {
    nombre: 'AA 1 — Programación en Python',
    bloques: [
      { id: 'sondeo',   rotulo: 'Sondeo de conocimientos', unidad: 'Pregunta', bits: 20 },
      { id: 'terminos', rotulo: 'Unir términos y definiciones', unidad: 'Término', bits: 6 },
      { id: 'glosario', rotulo: 'Glosario español – inglés', unidad: 'Par', bits: 20 },
      { id: 'practica', rotulo: 'Evaluación de práctica', unidad: 'Criterio', bits: 18 }
    ],
    tonos: { alto: 'Logrado', medio: 'Parcial', bajo: 'No logrado' }
  },
  evidencias: {
    nombre: 'Entrega de evidencias',
    bloques: [{ id: 'evidencias', rotulo: 'Evidencias del trimestre', unidad: 'Evidencia', bits: 64 }],
    tonos: { alto: 'A tiempo', medio: 'Fuera de plazo', bajo: 'Sin entregar' }
  },
  asistencia: {
    nombre: 'Asistencia a la formación',
    bloques: [{ id: 'asistencia', rotulo: 'Sesiones programadas', unidad: 'Sesión', bits: 64 }],
    tonos: { alto: 'Asistió', medio: 'Llegó tarde', bajo: 'Falló' }
  },
  mejoramiento: {
    nombre: 'Plan de mejoramiento',
    bloques: [{ id: 'mejoramiento', rotulo: 'Criterios de competencia', unidad: 'Criterio', bits: 64 }],
    tonos: { alto: 'Superado', medio: 'En plan', bajo: 'Pendiente' }
  }
};

/* Las cuatro vistas del mismo tablero. `iso` marca las que
   se dibujan sobre el plano inclinado en axonometría. */
const MODOS_64 = {
  planta: { nombre: 'Planta — casillas de color',      iso: false,
            ayuda: 'Cada casilla toma el tono de su resultado.' },
  barras: { nombre: 'Barras — altura por logro',       iso: false,
            ayuda: 'Dentro de cada casilla, la barra sube según el logro alcanzado.' },
  iso:    { nombre: 'Isométrica — relieve por logro',  iso: true,
            ayuda: 'El plano se inclina y cada casilla se levanta según su logro.' },
  torres: { nombre: 'Torres 3D — volumen por logro',   iso: true,
            ayuda: 'Cada casilla se extruye en una torre cuyo alto es el logro alcanzado.' }
};

const MODO_POR_DEFECTO = 'iso';
const TOTAL_BITS = 64;

/* Semilla estable: el mismo nombre produce siempre el mismo tablero */
function semilla64(texto) {
  let h = 0x811c9dc5;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

function azar64(semilla) {
  const x = Math.sin(semilla) * 43758.5453;
  return x - Math.floor(x);
}

/* El registro de la instructora manda; si no hay, el valor es simulado */
function puntajeRegistrado(persona, componente) {
  let registro = [];
  try { registro = JSON.parse(localStorage.getItem('sgma_act_puntajes')) || []; } catch (e) {}

  const corto = persona.includes(',') ? persona.split(',')[1].trim() : persona;
  const propios = registro.filter(r => {
    if (r.aprendiz === persona) return true;
    const nombres = r.aprendiz.includes(',') ? r.aprendiz.split(',')[1].trim() : r.aprendiz;
    return nombres.split(' ')[0] === corto.split(' ')[0];
  });

  const anotado = propios.filter(r => r.componente === componente).pop();
  return anotado ? anotado.puntos : null;
}

const TOPES_AA1 = { sondeo: 20, terminos: 30, glosario: 50, practica: 50 };

/* Qué fracción del bloque domina esta persona, de 0 a 1 */
function dominioDelBloque(persona, reporteId, bloque) {
  if (reporteId === 'aa1') {
    const anotado = puntajeRegistrado(persona, bloque.id);
    if (anotado !== null) return anotado / TOPES_AA1[bloque.id];
  }
  return 0.45 + azar64(semilla64(persona + reporteId + bloque.id)) * 0.5;
}

/* Cada tono ocupa su franja del eje de logro. El valor concreto
   dentro de la franja es estable para el mismo bit. */
const FRANJAS_64 = { alto: [0.70, 1.00], medio: [0.40, 0.70], bajo: [0.06, 0.40] };

function valorDelTono(tono, textoSemilla) {
  const [minimo, maximo] = FRANJAS_64[tono];
  return minimo + azar64(semilla64(textoSemilla)) * (maximo - minimo);
}

/* Los 64 bits de una persona: tono, valor de logro y rótulos */
function bitsDePersona(persona, reporteId) {
  const reporte = REPORTES_64[reporteId] || REPORTES_64.aa1;
  const bits = [];

  reporte.bloques.forEach(bloque => {
    const dominio = Math.min(Math.max(dominioDelBloque(persona, reporteId, bloque), 0), 1);
    const enAlto = Math.round(dominio * bloque.bits);
    const enMedio = Math.round((bloque.bits - enAlto) * 0.55);

    // Un orden estable decide qué bits concretos quedan en cada tono
    const orden = Array.from({ length: bloque.bits }, (_, i) => i)
      .sort((a, b) => azar64(semilla64(persona + bloque.id + a)) -
                      azar64(semilla64(persona + bloque.id + b)));

    const tonos = new Array(bloque.bits);
    orden.forEach((posicion, rango) => {
      tonos[posicion] = rango < enAlto ? 'alto' : rango < enAlto + enMedio ? 'medio' : 'bajo';
    });

    tonos.forEach((tono, i) => bits.push({
      tono,
      valor: valorDelTono(tono, persona + reporteId + bloque.id + 'v' + i),
      bloque: bloque.rotulo,
      bloqueId: bloque.id,
      indiceBloque: i,
      etiqueta: bloque.unidad + ' ' + (i + 1)
    }));
  });

  return bits;
}

/* El tablero grupal: cada bit resume cómo le fue al grupo en ese punto.
   Aquí el valor no se simula: es la fracción real de la ficha que lo logró. */
function bitsDelGrupo(nomina, reporteId) {
  if (!nomina.length) return [];
  const porPersona = nomina.map(nombre => bitsDePersona(nombre, reporteId));

  return porPersona[0].map((referencia, i) => {
    const logrados = porPersona.filter(bits => bits[i].tono === 'alto').length;
    const parte = logrados / nomina.length;
    return {
      tono: parte >= 0.7 ? 'alto' : parte >= 0.4 ? 'medio' : 'bajo',
      valor: parte,
      bloque: referencia.bloque,
      bloqueId: referencia.bloqueId,
      indiceBloque: referencia.indiceBloque,
      etiqueta: referencia.etiqueta,
      detalle: Math.round(parte * 100) + ' % del grupo lo logró'
    };
  });
}

/* ── Una casilla, según la vista elegida ──
   Cuando el tablero es interactivo la casilla es un botón:
   se alcanza con el teclado y abre la actividad embebida. */
function celdaBit(bit, indice, reporte, modo, interactivo) {
  const celda = document.createElement(interactivo ? 'button' : 'span');
  celda.className = 't64-bit t64-' + bit.tono;
  celda.dataset.bit = indice + 1;
  if (interactivo) celda.type = 'button';

  const logro = Math.min(Math.max(bit.valor === undefined ? 0.5 : bit.valor, 0), 1);
  celda.style.setProperty('--valor', Math.round(logro * 100) + '%');
  celda.style.setProperty('--alto', (3 + logro * 27).toFixed(1) + 'px');

  celda.title = 'Bit ' + (indice + 1) + ' · ' + bit.bloque + ' · ' + bit.etiqueta +
                ' — ' + reporte.tonos[bit.tono] +
                ' · logro ' + Math.round(logro * 100) + ' %' +
                (bit.detalle ? ' (' + bit.detalle + ')' : '') +
                (interactivo ? ' — abrir la actividad' : '');
  if (interactivo) celda.setAttribute('aria-label', celda.title);

  if (modo === 'barras') {
    const relleno = document.createElement('i');
    relleno.className = 't64-relleno';
    celda.appendChild(relleno);
  } else if (modo === 'torres') {
    ['sup', 'fte', 'izq'].forEach(cara => {
      const plano = document.createElement('i');
      plano.className = 't64-cara t64-cara-' + cara;
      celda.appendChild(plano);
    });
  }

  return celda;
}

/* Dibuja el tablero de 8 × 8 dentro del nodo indicado */
function pintarTablero64(nodo, bits, opciones) {
  const ajustes = opciones || {};
  const reporte = REPORTES_64[ajustes.reporte] || REPORTES_64.aa1;

  // `iso: true` de versiones anteriores sigue funcionando
  const modo = MODOS_64[ajustes.modo] ? ajustes.modo
             : (ajustes.iso ? 'iso' : 'planta');
  const vista = MODOS_64[modo];

  nodo.replaceChildren();

  if (!bits.length) {
    const vacio = document.createElement('p');
    vacio.className = 'tabla-vacia';
    vacio.textContent = 'No hay datos para dibujar el tablero.';
    nodo.appendChild(vacio);
    return;
  }

  const escena = document.createElement('div');
  escena.className = 't64-escena t64-modo-' + modo + (vista.iso ? ' t64-iso' : '');

  const rejilla = document.createElement('div');
  rejilla.className = 't64-rejilla';
  rejilla.setAttribute('role', 'img');
  rejilla.setAttribute('aria-label',
    'Tablero de 64 bits — ' + reporte.nombre + ' — ' + vista.nombre +
    ' — ' + (ajustes.titulo || ''));

  // El tablero interactivo entrega cada bit al módulo de contenido embebido
  const interactivo = !!(ajustes.interactivo && ajustes.contenedor &&
                         typeof abrirContenido64 === 'function');

  bits.forEach((bit, i) => {
    const celda = celdaBit(bit, i, reporte, modo, interactivo);
    if (interactivo) {
      celda.addEventListener('click', () => {
        rejilla.querySelectorAll('.t64-bit-activo')
          .forEach(c => c.classList.remove('t64-bit-activo'));
        celda.classList.add('t64-bit-activo');
        abrirContenido64(bit, i, ajustes.reporte, ajustes.contenedor);
      });
    }
    rejilla.appendChild(celda);
  });

  escena.appendChild(rejilla);
  nodo.appendChild(escena);

  // Recuento y leyenda de los tres tonos, con el logro medio de cada uno
  const cuenta = { alto: 0, medio: 0, bajo: 0 };
  const suma = { alto: 0, medio: 0, bajo: 0 };
  bits.forEach(b => {
    cuenta[b.tono]++;
    suma[b.tono] += (b.valor === undefined ? 0.5 : b.valor);
  });

  const leyenda = document.createElement('ul');
  leyenda.className = 't64-leyenda';
  ['alto', 'medio', 'bajo'].forEach(tono => {
    const item = document.createElement('li');
    const muestra = document.createElement('i');
    muestra.className = 't64-' + tono;
    const texto = document.createElement('span');
    const medio = cuenta[tono] ? Math.round((suma[tono] / cuenta[tono]) * 100) : 0;
    texto.textContent = reporte.tonos[tono] + ' — ' + cuenta[tono] + ' de ' + TOTAL_BITS +
                        ' bits · logro medio ' + medio + ' %';
    item.append(muestra, texto);
    leyenda.appendChild(item);
  });
  nodo.appendChild(leyenda);

  const notaVista = document.createElement('p');
  notaVista.className = 't64-vista-nota';
  notaVista.textContent = vista.nombre + '. ' + vista.ayuda;
  nodo.appendChild(notaVista);

  if (ajustes.pie) {
    const pie = document.createElement('p');
    pie.className = 't64-pie';
    pie.textContent = ajustes.pie;
    nodo.appendChild(pie);
  }
}

/* Puntaje de AA 1 de una persona, con lo registrado o lo simulado */
function resumenAA1(persona) {
  const reporte = REPORTES_64.aa1;
  const detalle = reporte.bloques.map(bloque => {
    const anotado = puntajeRegistrado(persona, bloque.id);
    const tope = TOPES_AA1[bloque.id];
    const puntos = anotado !== null
      ? anotado
      : Math.round(dominioDelBloque(persona, 'aa1', bloque) * tope);
    return { rotulo: bloque.rotulo, puntos, tope, registrado: anotado !== null };
  });

  const total = detalle.reduce((s, d) => s + d.puntos, 0);
  const tope = detalle.reduce((s, d) => s + d.tope, 0);

  return {
    detalle, total, tope,
    porcentaje: Math.round((total / tope) * 100),
    registrado: detalle.some(d => d.registrado),
    resultado: total >= 105 ? 'Aprobado' : total >= 74 ? 'Por mejorar' : 'No aprobado'
  };
}

function pintarResumenAA1(nodo, resumen) {
  nodo.replaceChildren();

  resumen.detalle.concat([{ rotulo: 'Total AA 1', puntos: resumen.total, tope: resumen.tope }])
    .forEach(fila => {
      const caja = document.createElement('div');
      caja.className = 'medida';
      const valor = document.createElement('p');
      valor.className = 'medida-valor';
      valor.textContent = fila.puntos + '/' + fila.tope;
      const rotulo = document.createElement('p');
      rotulo.className = 'medida-rotulo';
      rotulo.textContent = fila.rotulo;
      caja.append(valor, rotulo);
      nodo.appendChild(caja);
    });
}

/* ── Llenado de selectores, común a los tres roles ── */
function llenarSelector64(selector, entradas, previo) {
  if (!selector) return;
  const anterior = previo !== undefined ? previo : selector.value;
  selector.replaceChildren();
  entradas.forEach(([valor, rotulo]) => {
    const opcion = document.createElement('option');
    opcion.value = valor;
    opcion.textContent = rotulo;
    selector.appendChild(opcion);
  });
  if (anterior && Array.from(selector.options).some(o => o.value === anterior)) {
    selector.value = anterior;
  }
}

function selectorDeReportes(selector) {
  llenarSelector64(selector, Object.entries(REPORTES_64).map(([id, r]) => [id, r.nombre]));
}

function selectorDeVistas(selector, inicial) {
  llenarSelector64(selector, Object.entries(MODOS_64).map(([id, m]) => [id, m.nombre]));
  if (selector) selector.value = inicial || MODO_POR_DEFECTO;
}

document.addEventListener('DOMContentLoaded', () => {

  const nomina = fichaId =>
    (typeof getMatricula === 'function' ? getMatricula(fichaId) : []);

  /* ── Aprendiz: su propio tablero, con reporte y vista a elección ── */
  const lienzoAprendiz = document.getElementById('t64-aprendiz');
  if (lienzoAprendiz) {
    const quien = new URLSearchParams(window.location.search).get('u') || 'Aprendiz';
    const selReporte = document.getElementById('t64-ap-reporte');
    const selVista   = document.getElementById('t64-ap-vista');
    const medidas    = document.getElementById('t64-aprendiz-medidas');
    const contenido  = document.getElementById('t64-contenido');

    selectorDeReportes(selReporte);
    selectorDeVistas(selVista);

    const dibujar = () => {
      const reporteId = selReporte ? selReporte.value : 'aa1';
      const modo = selVista ? selVista.value : MODO_POR_DEFECTO;

      // Al cambiar de reporte o de vista se cierra la actividad abierta
      if (contenido) contenido.replaceChildren();

      const comunes = { modo, reporte: reporteId, titulo: quien,
                        interactivo: true, contenedor: contenido };

      if (reporteId === 'aa1') {
        const resumen = resumenAA1(quien);
        pintarTablero64(lienzoAprendiz, bitsDePersona(quien, 'aa1'), Object.assign({}, comunes, {
          pie: 'AA 1 · Programación en Python — ' + resumen.total + ' de ' + resumen.tope +
               ' puntos (' + resumen.porcentaje + ' %) · ' + resumen.resultado +
               (resumen.registrado ? '' : ' · sin puntaje registrado por la instructora')
        }));
        if (medidas) pintarResumenAA1(medidas, resumen);
        return;
      }

      pintarTablero64(lienzoAprendiz, bitsDePersona(quien, reporteId), Object.assign({}, comunes, {
        pie: REPORTES_64[reporteId].nombre + ' · ' + quien
      }));
      if (medidas) medidas.replaceChildren();
    };

    if (selReporte) selReporte.addEventListener('change', dibujar);
    if (selVista) selVista.addEventListener('change', dibujar);

    const titulo = document.getElementById('t64-aprendiz-quien');
    if (titulo) titulo.textContent = quien;

    dibujar();
  }

  /* ── Instructora: individual o grupal, con reporte y vista a elección ── */
  const lienzoInstructor = document.getElementById('t64-instructor');
  if (lienzoInstructor) {
    const selAlcance = document.getElementById('t64-ins-modo');
    const selReporte = document.getElementById('t64-ins-reporte');
    const selVista   = document.getElementById('t64-ins-vista');
    const selFicha   = document.getElementById('ins-ficha-activa');
    const medidas    = document.getElementById('t64-ins-medidas');

    selectorDeReportes(selReporte);
    selectorDeVistas(selVista);

    const fichaActiva = () =>
      (selFicha ? selFicha.value : (typeof FICHA_EN_CURSO !== 'undefined' ? FICHA_EN_CURSO : ''));

    const llenarAlcance = () => {
      llenarSelector64(selAlcance,
        [['*', 'Reporte grupal de la ficha']].concat(nomina(fichaActiva()).map(n => [n, n])));
    };

    const dibujar = () => {
      const lista = nomina(fichaActiva());
      const reporteId = selReporte ? selReporte.value : 'aa1';
      const modo = selVista ? selVista.value : MODO_POR_DEFECTO;
      const grupal = selAlcance.value === '*';

      if (grupal) {
        pintarTablero64(lienzoInstructor, bitsDelGrupo(lista, reporteId), {
          modo, reporte: reporteId, titulo: 'Ficha ' + fichaActiva(),
          pie: REPORTES_64[reporteId].nombre + ' · reporte grupal · ficha ' + fichaActiva() +
               ' · ' + lista.length + ' aprendices. Un bit queda en verde cuando lo logra ' +
               'al menos el 70 % del grupo; su altura es la fracción exacta que lo logró.'
        });
        if (medidas) medidas.replaceChildren();
        return;
      }

      if (reporteId === 'aa1') {
        const resumen = resumenAA1(selAlcance.value);
        pintarTablero64(lienzoInstructor, bitsDePersona(selAlcance.value, 'aa1'), {
          modo, reporte: 'aa1', titulo: selAlcance.value,
          pie: 'Reporte individual · ' + selAlcance.value + ' — ' + resumen.total + ' de ' +
               resumen.tope + ' puntos (' + resumen.porcentaje + ' %) · ' + resumen.resultado
        });
        if (medidas) pintarResumenAA1(medidas, resumen);
        return;
      }

      pintarTablero64(lienzoInstructor, bitsDePersona(selAlcance.value, reporteId), {
        modo, reporte: reporteId, titulo: selAlcance.value,
        pie: REPORTES_64[reporteId].nombre + ' · reporte individual · ' + selAlcance.value
      });
      if (medidas) medidas.replaceChildren();
    };

    selAlcance.addEventListener('change', dibujar);
    if (selReporte) selReporte.addEventListener('change', dibujar);
    if (selVista) selVista.addEventListener('change', dibujar);
    if (selFicha) selFicha.addEventListener('change', () => { llenarAlcance(); dibujar(); });

    llenarAlcance();
    dibujar();
  }

  /* ── Panel del escritorio: la ficha en curso, de un vistazo ── */
  const lienzoPanel = document.getElementById('t64-panel');
  if (lienzoPanel && typeof FICHA_EN_CURSO !== 'undefined') {
    const lista = nomina(FICHA_EN_CURSO);
    pintarTablero64(lienzoPanel, bitsDelGrupo(lista, 'aa1'), {
      modo: 'planta', reporte: 'aa1', titulo: 'Ficha ' + FICHA_EN_CURSO,
      pie: 'Reporte grupal de la ficha ' + FICHA_EN_CURSO + ' · ' + lista.length + ' aprendices'
    });
  }

  /* ── Administrador: cualquier ficha, reporte, alcance y vista ── */
  const lienzoAdmin = document.getElementById('t64-admin');
  if (lienzoAdmin) {
    const selFicha   = document.getElementById('t64-adm-ficha');
    const selReporte = document.getElementById('t64-adm-reporte');
    const selAlcance = document.getElementById('t64-adm-alcance');
    const selVista   = document.getElementById('t64-adm-vista');

    if (typeof FICHAS_SISTEMA === 'object') {
      llenarSelector64(selFicha, Object.entries(FICHAS_SISTEMA)
        .map(([id, ficha]) => [id, 'Ficha ' + id + ' — ' + ficha.modalidad]));
    }

    selectorDeReportes(selReporte);
    selectorDeVistas(selVista, 'planta');

    const llenarAlcance = () => {
      llenarSelector64(selAlcance,
        [['*', 'Reporte grupal de la ficha']].concat(nomina(selFicha.value).map(n => [n, n])));
    };

    const dibujar = () => {
      const lista = nomina(selFicha.value);
      const reporteId = selReporte.value;
      const modo = selVista ? selVista.value : 'planta';
      const grupal = selAlcance.value === '*';

      const bits = grupal ? bitsDelGrupo(lista, reporteId)
                          : bitsDePersona(selAlcance.value, reporteId);

      pintarTablero64(lienzoAdmin, bits, {
        modo, reporte: reporteId,
        titulo: grupal ? 'Ficha ' + selFicha.value : selAlcance.value,
        pie: REPORTES_64[reporteId].nombre + ' · ' +
             (grupal ? 'ficha ' + selFicha.value + ' · ' + lista.length + ' aprendices'
                     : selAlcance.value)
      });
    };

    selFicha.addEventListener('change', () => { llenarAlcance(); dibujar(); });
    selReporte.addEventListener('change', dibujar);
    selAlcance.addEventListener('change', dibujar);
    if (selVista) selVista.addEventListener('change', dibujar);

    llenarAlcance();
    dibujar();
  }
});
