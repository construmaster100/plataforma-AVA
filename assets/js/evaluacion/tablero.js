/* ══════════════════════════════════════════
   SGMA-ADSO — Tablero del aprendiz
   Pantalla central donde se abren las actividades
   elegidas en el menú lateral. Cada una registra
   intentos y puntaje, y suma al marcador global.
══════════════════════════════════════════ */

/* ── Banco de preguntas del programa ── */
const BANCO = [
  ['¿Qué describe un requisito funcional?', ['El comportamiento del sistema ante una acción del usuario','La velocidad de respuesta del servidor','El color de la interfaz','El costo del proyecto'], 0],
  ['¿Qué actor del SGMA-ADSO crea las evaluaciones?', ['Aprendiz','Instructor','Administrador','El sistema'], 1],
  ['¿Qué significa la sigla ADSO?', ['Análisis y Desarrollo de Software','Administración de Sistemas Operativos','Análisis de Datos y Soporte Ofimático','Aplicaciones Digitales y Soluciones Online'], 0],
  ['En UML, ¿qué representa un caso de uso?', ['Una clase del sistema','Una funcionalidad vista desde el actor','Una tabla de la base de datos','Un archivo de configuración'], 1],
  ['¿Cuál es la primera forma normal?', ['Eliminar dependencias transitivas','Eliminar grupos repetitivos y valores multivaluados','Eliminar dependencias parciales','Crear índices'], 1],
  ['¿Qué instrucción SQL recupera datos?', ['INSERT','UPDATE','SELECT','DELETE'], 2],
  ['¿Qué es una clave foránea?', ['Un campo que referencia la clave primaria de otra tabla','Un campo cifrado','Un índice único','Una columna calculada'], 0],
  ['En Python, ¿qué produce len("SENA")?', ['3','4','5','Error'], 1],
  ['¿Qué estructura repite instrucciones un número conocido de veces?', ['while','if','for','switch'], 2],
  ['¿Qué es un algoritmo?', ['Un lenguaje de programación','Una secuencia finita y ordenada de pasos','Un tipo de dato','Una base de datos'], 1],
  ['¿Qué fase sigue al análisis en el proyecto formativo?', ['Construcción','Planeación','Evaluación','Implantación'], 1],
  ['¿Qué documento recoge los requisitos acordados con el cliente?', ['Manual de usuario','Informe de requisitos','Acta de cierre','Plan de pruebas'], 1],
  ['¿Qué diagrama muestra el flujo de acciones de un caso de uso?', ['De clases','De actividades','De despliegue','Entidad-relación'], 1],
  ['¿Cuál NO es un tipo de dato primitivo?', ['Entero','Booleano','Cadena','Formulario'], 3],
  ['¿Qué hace la sentencia INSERT?', ['Consulta filas','Agrega filas','Elimina filas','Modifica la estructura'], 1],
  ['¿Qué es el frontend?', ['La parte del software con la que interactúa el usuario','El servidor de datos','El sistema operativo','La red interna'], 0],
  ['¿Qué significa que un software sea escalable?', ['Que cambia de color','Que soporta más carga sin rehacerse','Que ocupa poco espacio','Que se instala rápido'], 1],
  ['¿Qué prueba verifica que un módulo funcione aislado?', ['De integración','Unitaria','De aceptación','De carga'], 1],
  ['En control de versiones, ¿qué es un commit?', ['Un registro de cambios confirmados','Un borrado de archivos','Una copia de seguridad automática','Un permiso de usuario'], 0],
  ['¿Qué es la etapa productiva en el SENA?', ['Las clases teóricas','La aplicación en un entorno laboral real','El examen final','La inducción'], 1],
  ['¿Qué representa un modelo entidad-relación?', ['La interfaz gráfica','La estructura de los datos y sus vínculos','El flujo de pantallas','El cronograma'], 1],
  ['¿Qué operador compara igualdad estricta en JavaScript?', ['=','==','===','=>'], 2],
  ['¿Qué es una variable?', ['Un espacio con nombre que guarda un valor','Una función sin retorno','Un tipo de bucle','Un comentario'], 0],
  ['¿Qué hace un bucle while?', ['Repite mientras la condición sea verdadera','Repite un número fijo de veces','Ejecuta una sola vez','Detiene el programa'], 0],
  ['¿Qué es la normalización?', ['Ordenar alfabéticamente','Organizar datos para evitar redundancia','Comprimir archivos','Cifrar contraseñas'], 1],
  ['¿Qué significa API?', ['Interfaz de programación de aplicaciones','Archivo Portátil de Imagen','Análisis Previo de Interfaz','Aplicación Personal Integrada'], 0],
  ['¿Qué documento define cómo se evaluará al aprendiz?', ['Guía de aprendizaje','Reglamento del aprendiz','Contrato de aprendizaje','Acta de comité'], 0],
  ['¿Qué es un resultado de aprendizaje?', ['Una nota numérica','Lo que el aprendiz debe ser capaz de hacer','Un módulo del curso','Un tipo de evidencia'], 1],
  ['¿Qué elemento HTML define una tabla?', ['<div>','<table>','<form>','<section>'], 1],
  ['En CSS, ¿qué propiedad crea una rejilla?', ['display: grid','position: fixed','float: left','overflow: auto'], 0]
];

const IMAGENES_TABLERO = [
  ['../assets/img/SENA/salasistemas.jpeg', 'Sala de sistemas'],
  ['../assets/img/SENA/insigniareal.png', 'Escudo institucional'],
  ['../assets/img/SENA/aulavirtual1.svg', 'Aula virtual 1'],
  ['../assets/img/SENA/aulavirtual2.svg', 'Aula virtual 2'],
  ['../assets/img/SENA/portada.JPG', 'Portada institucional'],
  ['../assets/img/SENA/colombiacroquis.JPG', 'Cobertura nacional']
];

/* ── Puntajes: cada aprendiz guarda los suyos ── */
function claveDePuntajes() {
  const params = new URLSearchParams(window.location.search);
  const usuario = params.get('u') || params.get('i') || 'anonimo';
  return 'sgma_puntajes_' + usuario;
}

function leerPuntajesTablero() {
  try {
    return JSON.parse(localStorage.getItem(claveDePuntajes())) || { global: 0, actividades: {} };
  } catch (e) {
    return { global: 0, actividades: {} };
  }
}

function registrarPuntaje(actividad, puntos, maximo) {
  const datos = leerPuntajesTablero();
  const previo = datos.actividades[actividad] || { intentos: 0, mejor: 0, ultimo: 0, maximo: maximo };

  previo.intentos += 1;
  previo.ultimo = puntos;
  previo.maximo = maximo;
  if (puntos > previo.mejor) {
    // El marcador global solo suma la mejora sobre el mejor intento previo
    datos.global += puntos - previo.mejor;
    previo.mejor = puntos;
  }

  datos.actividades[actividad] = previo;
  try { localStorage.setItem(claveDePuntajes(), JSON.stringify(datos)); } catch (e) {}
  return previo;
}

/* ── Reporte al backend: además del localStorage de siempre, se intenta
   guardar el resultado en el servidor. Si no hay cédula (login viejo,
   o se entró sin loguearse) o el servidor no responde, no pasa nada:
   el cuestionario sigue funcionando igual, esto es solo un extra. ── */
const API_BASE = 'http://localhost:3000/api';

async function reportarResultadoBackend(modulo, cuestionario, puntaje, totalPreguntas) {
  const params = new URLSearchParams(window.location.search);
  const cedula = params.get('doc');
  if (!cedula) return;
  const nombre = params.get('u') || 'Aprendiz';

  try {
    await fetch(API_BASE + '/resultados', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cedula, nombre, modulo, cuestionario, puntaje, totalPreguntas })
    });
  } catch (e) {
    // Backend best-effort: sin conexión o sin servidor, se ignora.
  }
}

document.addEventListener('DOMContentLoaded', () => {

  const pantalla = document.getElementById('tablero-pantalla');
  if (!pantalla) return;

  const rotulo = document.getElementById('tablero-titulo');
  const marcador = document.getElementById('tablero-marcador');

  const nombreAprendiz = new URLSearchParams(window.location.search).get('u') || 'Aprendiz';

  const pintarMarcador = () => {
    const datos = leerPuntajesTablero();
    marcador.textContent = nombreAprendiz + ' · ' + datos.global + ' puntos';
  };

  const limpiar = titulo => {
    rotulo.textContent = titulo;
    pantalla.replaceChildren();
    return pantalla;
  };

  const crear = (etiqueta, clase, texto) => {
    const nodo = document.createElement(etiqueta);
    if (clase) nodo.className = clase;
    if (texto !== undefined) nodo.textContent = texto;
    return nodo;
  };

  /* ── Video ── */
  const APPS = {};

  APPS.video = () => {
    const zona = limpiar('Video de la sesión');
    const marco = document.createElement('div');
    marco.className = 'tablero-video';
    const video = document.createElement('iframe');
    video.src = 'https://www.youtube.com/embed/videoseries?list=PLm0OphJk3vE6NXk9pNz3xBWfUJ8pAkQpk';
    video.title = 'Video de la sesión';
    video.allow = 'accelerometer; clipboard-write; encrypted-media; picture-in-picture';
    video.allowFullscreen = true;
    video.loading = 'lazy';
    marco.appendChild(video);
    zona.append(crear('p', 'tablero-nota',
      'Reproduce la grabación de la sesión en línea. Requiere conexión a internet.'), marco);
  };

  /* ── Consola JavaScript ── */
  APPS.consola = () => {
    const zona = limpiar('Consola JavaScript');
    zona.appendChild(crear('p', 'tablero-nota',
      'Escriba código JavaScript y ejecútelo. Lo que imprima con console.log aparece abajo.'));

    const editor = document.createElement('textarea');
    editor.className = 'form-control tablero-editor';
    editor.spellcheck = false;
    editor.value = 'const nombre = "' + nombreAprendiz + '";\nfor (let i = 1; i <= 3; i++) {\n  console.log(i + " — hola " + nombre);\n}';

    const salida = crear('pre', 'tablero-salida', '');

    const boton = crear('button', 'btn btn-action btn-primary', '▶ Ejecutar');
    boton.type = 'button';
    boton.addEventListener('click', () => {
      const lineas = [];
      const registrar = (...partes) => lineas.push(partes.map(String).join(' '));
      try {
        // Se ejecuta en su propio ámbito con un console de reemplazo
        new Function('console', editor.value)({ log: registrar, info: registrar, warn: registrar, error: registrar });
        salida.textContent = lineas.join('\n') || '(sin salida)';
        salida.classList.remove('tablero-error');
      } catch (error) {
        salida.textContent = error.name + ': ' + error.message;
        salida.classList.add('tablero-error');
      }
    });

    const barra = crear('div', 'tablero-acciones');
    barra.appendChild(boton);
    zona.append(editor, barra, salida);
  };

  /* ── Imágenes ── */
  APPS.imagenes = () => {
    const zona = limpiar('Galería de imágenes');
    const rejilla = crear('div', 'tablero-galeria');
    IMAGENES_TABLERO.forEach(([ruta, titulo]) => {
      const figura = crear('figure', 'tablero-figura');
      const img = document.createElement('img');
      img.src = ruta;
      img.alt = titulo;
      img.loading = 'lazy';
      figura.append(img, crear('figcaption', null, titulo));
      rejilla.appendChild(figura);
    });
    zona.appendChild(rejilla);
  };

  /* ── Cuestionarios ── */
  const cuestionario = (cantidad, identificador) => {
    const zona = limpiar('Cuestionario de ' + cantidad + ' preguntas');
    const previo = leerPuntajesTablero().actividades[identificador];

    zona.appendChild(crear('p', 'tablero-nota',
      'Responde las ' + cantidad + ' preguntas y envía para calificar.' +
      (previo ? ' Intentos: ' + previo.intentos + ' · Mejor puntaje: ' + previo.mejor + '/' + cantidad + '.'
              : ' Es tu primer intento.')));

    // Se baraja el banco para que cada intento no repita el mismo orden
    const preguntas = BANCO.slice().sort(() => Math.random() - 0.5).slice(0, cantidad);

    const formulario = document.createElement('form');
    formulario.className = 'tablero-quiz';

    preguntas.forEach((pregunta, i) => {
      const bloque = crear('div', 'quiz-pregunta');
      bloque.appendChild(crear('p', 'quiz-enunciado', (i + 1) + '. ' + pregunta[0]));

      pregunta[1].forEach((opcion, j) => {
        const etiqueta = crear('label', 'quiz-opcion');
        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = 'p' + i;
        radio.value = j;
        etiqueta.append(radio, crear('span', null, opcion));
        bloque.appendChild(etiqueta);
      });

      formulario.appendChild(bloque);
    });

    const aviso = crear('p', 'login-msg', '');
    const enviar = crear('button', 'btn btn-action btn-primary', 'Enviar y calificar');
    enviar.type = 'submit';

    const acciones = crear('div', 'tablero-acciones');
    acciones.appendChild(enviar);
    formulario.append(acciones, aviso);

    formulario.addEventListener('submit', e => {
      e.preventDefault();
      let aciertos = 0;
      let sinResponder = 0;

      preguntas.forEach((pregunta, i) => {
        const marcada = formulario.querySelector('input[name="p' + i + '"]:checked');
        if (!marcada) { sinResponder++; return; }
        if (Number(marcada.value) === pregunta[2]) aciertos++;
      });

      if (sinResponder) {
        aviso.textContent = 'Faltan ' + sinResponder + ' preguntas por responder.';
        aviso.className = 'login-msg error';
        return;
      }

      const registro = registrarPuntaje(identificador, aciertos, cantidad);
      reportarResultadoBackend('Programa ADSO — Banco general', identificador, aciertos, cantidad);
      aviso.textContent = 'Puntaje: ' + aciertos + ' de ' + cantidad +
                          ' · Intento ' + registro.intentos +
                          ' · Mejor: ' + registro.mejor;
      aviso.className = 'login-msg success';
      enviar.disabled = true;
      pintarMarcador();
    });

    zona.appendChild(formulario);
  };

  APPS.quiz10 = () => cuestionario(10, 'quiz10');
  APPS.quiz30 = () => cuestionario(30, 'quiz30');

  /* ── Puntajes ── */
  APPS.puntajes = () => {
    const zona = limpiar('Mis puntajes');
    const datos = leerPuntajesTablero();

    zona.appendChild(crear('p', 'tablero-nota',
      'Registro de ' + nombreAprendiz + '. El puntaje global suma el mejor resultado de cada actividad.'));

    const total = crear('div', 'tablero-global');
    total.append(crear('span', 'global-numero', datos.global), crear('span', 'global-texto', 'puntos en total'));
    zona.appendChild(total);

    const tabla = document.createElement('table');
    tabla.className = 'table table-hover align-middle data-table';
    tabla.innerHTML = '<thead><tr><th>Actividad</th><th>Intentos</th><th>Último</th><th>Mejor</th></tr></thead>';
    const cuerpo = document.createElement('tbody');

    const NOMBRES = { quiz10: 'Cuestionario de 10 preguntas', quiz30: 'Cuestionario de 30 preguntas' };
    const entradas = Object.entries(datos.actividades);

    if (!entradas.length) {
      const fila = document.createElement('tr');
      const celda = document.createElement('td');
      celda.colSpan = 4;
      celda.textContent = 'Todavía no has presentado ninguna actividad.';
      celda.style.color = '#999';
      fila.appendChild(celda);
      cuerpo.appendChild(fila);
    }

    entradas.forEach(([clave, registro]) => {
      const fila = document.createElement('tr');
      [NOMBRES[clave] || clave, registro.intentos,
       registro.ultimo + ' / ' + registro.maximo,
       registro.mejor + ' / ' + registro.maximo].forEach(valor => {
        const celda = document.createElement('td');
        celda.textContent = valor;
        fila.appendChild(celda);
      });
      cuerpo.appendChild(fila);
    });

    tabla.appendChild(cuerpo);
    zona.appendChild(tabla);
  };

  /* ── Estado de reposo: lo que se ve al entrar y al reiniciar ── */

  const reposo = () => {
    rotulo.textContent = 'Tablero';
    pantalla.replaceChildren(
      crear('p', 'tablero-vacio', 'Elija una actividad de la fila de arriba para abrirla aquí.'));
    document.querySelectorAll('[data-app]')
      .forEach(b => b.classList.remove('es-activa'));
  };

  /* ── Botones de las actividades del tablero ── */
  document.querySelectorAll('[data-app]').forEach(boton => {
    boton.addEventListener('click', e => {
      e.preventDefault();
      const app = APPS[boton.dataset.app];
      if (!app) return;

      // El tablero vive en la vista de inicio: hay que mostrarla
      document.querySelectorAll('.view-section').forEach(s => s.style.display = 'none');
      const inicio = document.getElementById('sec-home');
      if (inicio) inicio.style.display = 'block';

      document.querySelectorAll('[data-app]').forEach(b => b.classList.remove('es-activa'));
      boton.classList.add('es-activa');

      app();
      document.getElementById('tablero').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  /* ── «Tablero» del menú: vuelve al inicio y deja todo como al entrar ──
     No despliega submenú; sólo reinicia la vista. sofia_plus.js ya se
     encarga de mostrar sec-home, aquí se limpia lo que quedó abierto. */
  const botonInicio = document.getElementById('btn-tablero-inicio');
  if (botonInicio) {
    botonInicio.addEventListener('click', () => {
      reposo();
      pintarMarcador();
      document.querySelectorAll('.submenu a.link-active')
        .forEach(a => a.classList.remove('link-active'));
      window.scrollTo({ top: 0 });
    });
  }

  pintarMarcador();
});
