/* ══════════════════════════════════════════
   SGMA-ADSO — Contenido embebido del tablero de 64 bits
   Cada bit del tablero es la puerta de una actividad.
   Al tocarlo se arma dentro de la pantalla el contenido
   que le corresponde: evaluación, encuesta, minijuego,
   video de YouTube o ficha de información.

   Lo que el aprendiz resuelve queda guardado bajo
   sgma_emb_*, de modo que al volver al bit lo encuentra
   como lo dejó.
══════════════════════════════════════════ */

const CLAVE_EMBEBIDO = 'sgma_emb_';

function leerEmbebido(clave) {
  try { return JSON.parse(localStorage.getItem(CLAVE_EMBEBIDO + clave)) || null; }
  catch (e) { return null; }
}

function guardarEmbebido(clave, dato) {
  try { localStorage.setItem(CLAVE_EMBEBIDO + clave, JSON.stringify(dato)); } catch (e) {}
  return dato;
}

function olvidarEmbebido(clave) {
  try { localStorage.removeItem(CLAVE_EMBEBIDO + clave); } catch (e) {}
}

/* ── Términos de la actividad, para el juego de parejas ── */
const TERMINOS_PY = [
  ['Variable', 'Espacio con nombre que guarda un valor y puede cambiar durante la ejecución'],
  ['Función', 'Bloque de código con nombre que se ejecuta al ser invocado y puede devolver un valor'],
  ['Lista', 'Colección ordenada y mutable de elementos, escrita entre corchetes'],
  ['Diccionario', 'Colección de pares clave-valor, escrita entre llaves'],
  ['Bucle', 'Estructura que repite un bloque de instrucciones mientras se cumpla una condición'],
  ['Módulo', 'Archivo .py con definiciones que otro programa puede importar']
];

/* ── Glosario español – inglés, para el juego de correspondencia ── */
const GLOSARIO_PY = [
  ['cadena', 'string'], ['entero', 'integer'], ['flotante', 'float'],
  ['booleano', 'boolean'], ['lista', 'list'], ['diccionario', 'dictionary'],
  ['tupla', 'tuple'], ['conjunto', 'set'], ['bucle', 'loop'],
  ['condición', 'condition'], ['función', 'function'], ['parámetro', 'parameter'],
  ['argumento', 'argument'], ['retorno', 'return value'], ['biblioteca', 'library'],
  ['archivo', 'file'], ['excepción', 'exception'], ['herencia', 'inheritance'],
  ['clase', 'class'], ['objeto', 'object']
];

/* ── Preguntas de la encuesta de percepción ── */
const ENCUESTA_ESCALA = [
  'Nada', 'Poco', 'Regular', 'Bastante', 'Del todo'
];

const ENCUESTA_PREGUNTAS = [
  '¿Qué tan claro le resultó el enunciado de la práctica?',
  '¿Alcanzó el tiempo asignado para resolver el ejercicio?',
  '¿Los materiales de formación le sirvieron para resolverlo?',
  '¿Se sintió acompañado por la instructora durante la actividad?',
  '¿Qué tan seguro se siente de repetir el ejercicio sin ayuda?',
  '¿Recomendaría esta actividad a la siguiente ficha?'
];

/* ── Fichas de información de la práctica ── */
const INFO_PRACTICA = [
  ['Criterio de entrega', 'La práctica se entrega como archivo .py con el nombre del aprendiz. Un archivo por ejercicio, sin comprimir.'],
  ['Criterio de legibilidad', 'Nombres de variables en español, sin abreviaturas de una letra salvo los índices de bucle.'],
  ['Criterio de corrección', 'El programa debe ejecutarse de principio a fin sin lanzar excepciones ante las entradas del enunciado.'],
  ['Criterio de comentarios', 'Cada función lleva una línea que explica qué recibe y qué devuelve. No se comenta lo obvio.'],
  ['Criterio de estructura', 'Nada de código suelto fuera de funciones, salvo la llamada principal al final del archivo.'],
  ['Criterio de plazo', 'Lo entregado después de la fecha se recibe, pero queda marcado como entrega fuera de plazo en el tablero.']
];

/* La lista de videos que ya usa la instructora en su panel */
const LISTA_VIDEOS = 'PLm0OphJk3vE6NXk9pNz3xBWfUJ8pAkQpk';

/* ── Qué contenido le toca a cada bit ──
   El bloque decide el tipo; dentro del bloque de práctica
   se reparten video, información y encuesta. */
function contenidoDelBit(reporteId, bloqueId, indice) {
  if (reporteId === 'aa1') {
    if (bloqueId === 'sondeo')   return { tipo: 'evaluacion' };
    if (bloqueId === 'terminos') return { tipo: 'minijuego', juego: 'parejas' };
    if (bloqueId === 'glosario') return { tipo: 'minijuego', juego: 'glosario' };
    if (bloqueId === 'practica') {
      if (indice < 6)  return { tipo: 'video' };
      if (indice < 12) return { tipo: 'info' };
      return { tipo: 'encuesta' };
    }
  }
  if (reporteId === 'mejoramiento') return { tipo: 'encuesta' };
  if (reporteId === 'evidencias')   return { tipo: 'info' };
  if (reporteId === 'asistencia')   return { tipo: 'info' };
  return { tipo: 'info' };
}

const ROTULOS_EMBEBIDO = {
  evaluacion: 'Evaluación',
  encuesta:   'Encuesta',
  minijuego:  'Minijuego',
  video:      'Video',
  info:       'Información'
};

/* ── Utilidades ── */
function barajarCon(lista, semilla) {
  const copia = lista.slice();
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(azar64(semilla64(semilla + i)) * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

function nodoEmb(etiqueta, clase, texto) {
  const nodo = document.createElement(etiqueta);
  if (clase) nodo.className = clase;
  if (texto !== undefined) nodo.textContent = texto;
  return nodo;
}

function marcaResuelto(nodo, texto, bien) {
  const marca = nodoEmb('p', 'emb-marca ' + (bien ? 'emb-bien' : 'emb-mal'), texto);
  marca.setAttribute('role', 'status');
  nodo.appendChild(marca);
}

/* ══ 1. Evaluación — una pregunta del banco del programa ══ */
function pintarEvaluacion(cuerpo, clave, indice) {
  const banco = (typeof BANCO !== 'undefined' && BANCO.length) ? BANCO : null;
  if (!banco) {
    cuerpo.appendChild(nodoEmb('p', 'emb-vacio', 'El banco de preguntas no está disponible en esta pantalla.'));
    return;
  }

  const pregunta = banco[indice % banco.length];
  const [enunciado, opciones, correcta] = pregunta;
  const previo = leerEmbebido(clave);

  cuerpo.appendChild(nodoEmb('p', 'emb-enunciado', enunciado));

  const lista = nodoEmb('div', 'emb-opciones');
  opciones.forEach((texto, i) => {
    const opcion = nodoEmb('button', 'emb-opcion', texto);
    opcion.type = 'button';

    if (previo) {
      if (i === correcta) opcion.classList.add('emb-opcion-bien');
      if (i === previo.eleccion && i !== correcta) opcion.classList.add('emb-opcion-mal');
      opcion.disabled = true;
    }

    opcion.addEventListener('click', () => {
      guardarEmbebido(clave, { eleccion: i, acierto: i === correcta, fecha: Date.now() });
      cuerpo.replaceChildren();
      pintarEvaluacion(cuerpo, clave, indice);
    });

    lista.appendChild(opcion);
  });
  cuerpo.appendChild(lista);

  if (previo) {
    marcaResuelto(cuerpo,
      previo.acierto ? 'Respuesta correcta.' : 'Respuesta incorrecta. La correcta queda marcada en verde.',
      previo.acierto);

    const reintentar = nodoEmb('button', 'emb-secundario', 'Responder de nuevo');
    reintentar.type = 'button';
    reintentar.addEventListener('click', () => {
      olvidarEmbebido(clave);
      cuerpo.replaceChildren();
      pintarEvaluacion(cuerpo, clave, indice);
    });
    cuerpo.appendChild(reintentar);
  }
}

/* ══ 2. Encuesta — escala de percepción ══ */
function pintarEncuesta(cuerpo, clave, indice) {
  const pregunta = ENCUESTA_PREGUNTAS[indice % ENCUESTA_PREGUNTAS.length];
  const previo = leerEmbebido(clave);

  cuerpo.appendChild(nodoEmb('p', 'emb-enunciado', pregunta));

  const escala = nodoEmb('div', 'emb-escala');
  ENCUESTA_ESCALA.forEach((rotulo, i) => {
    const paso = nodoEmb('button', 'emb-paso', '');
    paso.type = 'button';
    paso.appendChild(nodoEmb('span', 'emb-paso-num', String(i + 1)));
    paso.appendChild(nodoEmb('span', 'emb-paso-rot', rotulo));
    if (previo && previo.valor === i + 1) paso.classList.add('emb-paso-activo');

    paso.addEventListener('click', () => {
      guardarEmbebido(clave, { valor: i + 1, fecha: Date.now() });
      cuerpo.replaceChildren();
      pintarEncuesta(cuerpo, clave, indice);
    });

    escala.appendChild(paso);
  });
  cuerpo.appendChild(escala);

  if (previo) {
    marcaResuelto(cuerpo,
      'Respuesta registrada: ' + previo.valor + ' de 5 — ' + ENCUESTA_ESCALA[previo.valor - 1] + '.', true);
  } else {
    cuerpo.appendChild(nodoEmb('p', 'emb-ayuda', 'La encuesta es anónima y no incide en el puntaje de la actividad.'));
  }
}

/* ══ 3. Minijuego — parejas de términos ══ */
function juegoParejas(cuerpo, clave, indice) {
  const semilla = clave + 'parejas';
  const base = barajarCon(TERMINOS_PY, semilla).slice(0, 3);
  const definiciones = barajarCon(base, semilla + 'def');

  cuerpo.appendChild(nodoEmb('p', 'emb-enunciado', 'Una cada término con su definición. Toque primero el término y luego su definición.'));

  const marcador = nodoEmb('p', 'emb-marcador', 'Parejas armadas: 0 de 3');
  const tablero = nodoEmb('div', 'emb-parejas');

  const columnaT = nodoEmb('div', 'emb-columna');
  const columnaD = nodoEmb('div', 'emb-columna');

  let elegido = null;
  let armadas = 0;
  let fallos = 0;

  const limpiarElegido = () => {
    columnaT.querySelectorAll('.emb-ficha').forEach(f => f.classList.remove('emb-ficha-activa'));
    elegido = null;
  };

  base.forEach(par => {
    const ficha = nodoEmb('button', 'emb-ficha', par[0]);
    ficha.type = 'button';
    ficha.dataset.termino = par[0];
    ficha.addEventListener('click', () => {
      if (ficha.disabled) return;
      limpiarElegido();
      ficha.classList.add('emb-ficha-activa');
      elegido = par[0];
    });
    columnaT.appendChild(ficha);
  });

  definiciones.forEach(par => {
    const ficha = nodoEmb('button', 'emb-ficha emb-ficha-def', par[1]);
    ficha.type = 'button';
    ficha.addEventListener('click', () => {
      if (ficha.disabled || !elegido) return;

      if (elegido === par[0]) {
        const origen = columnaT.querySelector('[data-termino="' + CSS.escape(par[0]) + '"]');
        [origen, ficha].forEach(f => {
          f.disabled = true;
          f.classList.add('emb-ficha-lista');
          f.classList.remove('emb-ficha-activa');
        });
        armadas++;
        marcador.textContent = 'Parejas armadas: ' + armadas + ' de 3';
        elegido = null;

        if (armadas === 3) {
          guardarEmbebido(clave, { completado: true, fallos, fecha: Date.now() });
          marcaResuelto(cuerpo, fallos === 0
            ? 'Las tres parejas, sin un solo error.'
            : 'Juego completado con ' + fallos + (fallos === 1 ? ' error.' : ' errores.'), true);
        }
      } else {
        fallos++;
        ficha.classList.add('emb-ficha-error');
        setTimeout(() => ficha.classList.remove('emb-ficha-error'), 420);
        limpiarElegido();
      }
    });
    columnaD.appendChild(ficha);
  });

  tablero.append(columnaT, columnaD);
  cuerpo.append(marcador, tablero);

  const previo = leerEmbebido(clave);
  if (previo && previo.completado) {
    cuerpo.appendChild(nodoEmb('p', 'emb-ayuda',
      'Ya había completado este juego con ' + previo.fallos +
      (previo.fallos === 1 ? ' error.' : ' errores.') + ' Puede repetirlo.'));
  }
}

/* ══ 3b. Minijuego — correspondencia del glosario ══ */
function juegoGlosario(cuerpo, clave, indice) {
  const par = GLOSARIO_PY[indice % GLOSARIO_PY.length];
  const distractores = barajarCon(GLOSARIO_PY.filter(p => p[1] !== par[1]), clave).slice(0, 3);
  const opciones = barajarCon([par].concat(distractores), clave + 'op');
  const previo = leerEmbebido(clave);

  cuerpo.appendChild(nodoEmb('p', 'emb-enunciado', '¿Cómo se dice «' + par[0] + '» en inglés?'));

  const lista = nodoEmb('div', 'emb-opciones');
  opciones.forEach(op => {
    const boton = nodoEmb('button', 'emb-opcion', op[1]);
    boton.type = 'button';

    if (previo) {
      if (op[1] === par[1]) boton.classList.add('emb-opcion-bien');
      if (op[1] === previo.eleccion && op[1] !== par[1]) boton.classList.add('emb-opcion-mal');
      boton.disabled = true;
    }

    boton.addEventListener('click', () => {
      guardarEmbebido(clave, { eleccion: op[1], acierto: op[1] === par[1], fecha: Date.now() });
      cuerpo.replaceChildren();
      juegoGlosario(cuerpo, clave, indice);
    });

    lista.appendChild(boton);
  });
  cuerpo.appendChild(lista);

  if (previo) {
    marcaResuelto(cuerpo,
      previo.acierto ? '«' + par[0] + '» es «' + par[1] + '». Correcto.'
                     : 'No era esa: «' + par[0] + '» es «' + par[1] + '».',
      previo.acierto);
  }
}

/* ══ 4. Video — marco de YouTube ══ */
function pintarVideo(cuerpo, indice) {
  cuerpo.appendChild(nodoEmb('p', 'emb-enunciado',
    'Video de apoyo ' + (indice + 1) + ' — Programación en Python'));

  const marco = nodoEmb('div', 'emb-video');
  const cuadro = document.createElement('iframe');
  cuadro.src = 'https://www.youtube-nocookie.com/embed/videoseries?list=' +
               LISTA_VIDEOS + '&index=' + (indice + 1);
  cuadro.title = 'Video de aprendizaje de programación en Python ' + (indice + 1);
  cuadro.loading = 'lazy';
  cuadro.allowFullscreen = true;
  cuadro.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
  marco.appendChild(cuadro);
  cuerpo.appendChild(marco);

  cuerpo.appendChild(nodoEmb('p', 'emb-ayuda',
    'El video se sirve desde YouTube: necesita conexión a internet para reproducirse.'));
}

/* ══ 5. Información — ficha de criterio ══ */
function pintarInfo(cuerpo, clave, indice, bit, reporte) {
  const ficha = INFO_PRACTICA[indice % INFO_PRACTICA.length];

  cuerpo.appendChild(nodoEmb('h4', 'emb-info-titulo', ficha[0]));
  cuerpo.appendChild(nodoEmb('p', 'emb-enunciado', ficha[1]));

  const datos = nodoEmb('dl', 'emb-datos');
  [
    ['Bloque', bit.bloque],
    ['Unidad', bit.etiqueta],
    ['Estado', reporte.tonos[bit.tono]],
    ['Logro', Math.round((bit.valor === undefined ? 0.5 : bit.valor) * 100) + ' %']
  ].forEach(([rotulo, valor]) => {
    datos.appendChild(nodoEmb('dt', '', rotulo));
    datos.appendChild(nodoEmb('dd', '', String(valor)));
  });
  cuerpo.appendChild(datos);
}

/* ══ Punto de entrada que invoca el tablero ══ */
function abrirContenido64(bit, indice, reporteId, contenedor) {
  if (!contenedor) return;

  const reporte = REPORTES_64[reporteId] || REPORTES_64.aa1;
  const indiceBloque = bit.indiceBloque === undefined ? indice : bit.indiceBloque;
  const receta = contenidoDelBit(reporteId, bit.bloqueId, indiceBloque);
  const clave = reporteId + '_' + (bit.bloqueId || 'bloque') + '_' + indiceBloque;

  contenedor.replaceChildren();

  const panel = nodoEmb('article', 'emb-panel');

  const cabecera = nodoEmb('header', 'emb-cabecera');
  const tipo = nodoEmb('span', 'emb-tipo emb-tipo-' + receta.tipo, ROTULOS_EMBEBIDO[receta.tipo]);
  const titulo = nodoEmb('h3', 'emb-titulo', bit.bloque + ' · ' + bit.etiqueta);
  const cerrar = nodoEmb('button', 'emb-cerrar', '✕');
  cerrar.type = 'button';
  cerrar.setAttribute('aria-label', 'Cerrar la actividad');
  cerrar.addEventListener('click', () => {
    contenedor.replaceChildren();
    document.querySelectorAll('.t64-bit-activo').forEach(c => c.classList.remove('t64-bit-activo'));
  });
  cabecera.append(tipo, titulo, cerrar);
  panel.appendChild(cabecera);

  const cuerpo = nodoEmb('div', 'emb-cuerpo');
  panel.appendChild(cuerpo);

  if (receta.tipo === 'evaluacion')      pintarEvaluacion(cuerpo, clave, indiceBloque);
  else if (receta.tipo === 'encuesta')   pintarEncuesta(cuerpo, clave, indiceBloque);
  else if (receta.tipo === 'video')      pintarVideo(cuerpo, indiceBloque);
  else if (receta.tipo === 'minijuego')  {
    if (receta.juego === 'parejas') juegoParejas(cuerpo, clave, indiceBloque);
    else juegoGlosario(cuerpo, clave, indiceBloque);
  }
  else pintarInfo(cuerpo, clave, indiceBloque, bit, reporte);

  contenedor.appendChild(panel);
  panel.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}
