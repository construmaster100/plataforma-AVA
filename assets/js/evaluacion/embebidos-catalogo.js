/* ══════════════════════════════════════════
   SGMA-ADSO — Material embebido de prueba de desempeño

   Cada actividad es una carpeta autocontenida en
   assets/embebidos/<actividad>/index.html: se abre dentro
   de la plataforma y, al terminar, avisa su puntaje con

     parent.postMessage({ tipo: 'sgma-puntaje',
                          actividad: '<id>',
                          puntaje: 0-100,
                          maximo: 100,
                          detalle: '…' }, '*');

   Aquí se escucha ese aviso y se guarda el puntaje bajo la
   identidad de quien está en pantalla: el aprendiz llega con
   ?i= en la URL.
══════════════════════════════════════════ */

const EMBEBIDOS = [
  {
    id: 'cuestionario-python',
    modulo: 'Python',
    titulo: 'Cuestionario — Introducción a Python',
    tipo: 'Cuestionario',
    descripcion: '10 preguntas de selección única, 10 puntos por acierto',
    ruta: '../assets/embebidos/01-python/cuestionario-python/index.html',
    portada: '../assets/img/portadas%20video/Lenguajes%20de%20programaci%C3%B3n/instroduccion%20a%20python.jpeg',
    puntua: true,
    maximo: 100
  },
  {
    id: 'ejemplos-python',
    modulo: 'Python',
    titulo: 'Ejemplos básicos de Python',
    tipo: 'Ejemplos',
    descripcion: 'Seis piezas de código comentadas, con su salida',
    ruta: '../assets/embebidos/01-python/ejemplos-python/index.html',
    portada: '../assets/img/portadas%20video/Lenguajes%20de%20programaci%C3%B3n/ejemplos%20python.jpeg',
    puntua: false
  },
  {
    id: 'cuestionario-general-30',
    modulo: 'Python',
    titulo: 'Cuestionario general — 30 preguntas',
    tipo: 'Cuestionario 30',
    descripcion: '30 preguntas de repaso sobre Python, Java y HTML',
    ruta: '../assets/embebidos/12-practica-ampliada/cuestionario-general-30/index.html',
    portada: '../assets/img/portadas%20video/Lenguajes%20de%20programaci%C3%B3n/instroduccion%20a%20python.jpeg',
    puntua: true,
    maximo: 100
  },
  {
    id: 'unir-palabras',
    modulo: 'Python',
    titulo: 'Actividad — Unir palabras y significado',
    tipo: 'Juego de parejas',
    descripcion: 'Une cada término de Python con su definición',
    ruta: '../assets/embebidos/12-practica-ampliada/unir-palabras/index.html',
    portada: '../assets/img/portadas%20video/Lenguajes%20de%20programaci%C3%B3n/actividad%20didactica%20python.jpeg',
    puntua: true,
    maximo: 100
  },
  {
    id: 'video-practica',
    modulo: 'Python',
    titulo: 'Video — Práctica de programación',
    tipo: 'Video',
    descripcion: 'Repaso en video de estructuras de control y funciones',
    ruta: '../assets/embebidos/12-practica-ampliada/video-practica/index.html',
    portada: '../assets/img/portadas%20video/Lenguajes%20de%20programaci%C3%B3n/ejemplos%20python.jpeg',
    puntua: true,
    maximo: 100
  },
  {
    id: 'minijuego-comandos',
    modulo: 'Python',
    titulo: 'Actividad — Comandos de Python',
    tipo: 'Actividad',
    descripcion: 'Partida de 45 segundos: acierta el resultado de cada instrucción',
    ruta: '../assets/embebidos/01-python/minijuego-comandos/index.html',
    portada: '../assets/img/portadas%20video/Lenguajes%20de%20programaci%C3%B3n/actividad%20didactica%20python.jpeg',
    puntua: true,
    maximo: 100
  },
  {
    id: 'cuestionario-java',
    modulo: 'Java',
    titulo: 'Cuestionario — Introducción a Java',
    tipo: 'Cuestionario',
    descripcion: '10 preguntas de selección única, 10 puntos por acierto',
    ruta: '../assets/embebidos/02-java/cuestionario-java/index.html',
    portada: '../assets/img/SENA/pizarra.JPG',
    puntua: true,
    maximo: 100
  },
  {
    id: 'ejemplos-java',
    modulo: 'Java',
    titulo: 'Ejemplos básicos de Java',
    tipo: 'Ejemplos',
    descripcion: 'Seis piezas de código comentadas, con su salida',
    ruta: '../assets/embebidos/02-java/ejemplos-java/index.html',
    portada: '../assets/img/SENA/idea.JPG',
    puntua: false
  },
  {
    id: 'minijuego-java',
    modulo: 'Java',
    titulo: 'Actividad — Comandos de Java',
    tipo: 'Actividad',
    descripcion: 'Partida de 45 segundos: acierta el resultado de cada instrucción',
    ruta: '../assets/embebidos/02-java/minijuego-java/index.html',
    portada: '../assets/img/SENA/escritorio.JPG',
    puntua: true,
    maximo: 100
  },
  {
    id: 'cuestionario-html',
    modulo: 'HTML',
    titulo: 'Cuestionario — Introducción a HTML',
    tipo: 'Cuestionario',
    descripcion: '10 preguntas de selección única, 10 puntos por acierto',
    ruta: '../assets/embebidos/03-html/cuestionario-html/index.html',
    portada: '../assets/img/SENA/pizarra.JPG',
    puntua: true,
    maximo: 100
  },
  {
    id: 'ejemplos-html',
    modulo: 'HTML',
    titulo: 'Ejemplos básicos de HTML',
    tipo: 'Ejemplos',
    descripcion: 'Seis piezas de código comentadas, con su salida',
    ruta: '../assets/embebidos/03-html/ejemplos-html/index.html',
    portada: '../assets/img/SENA/idea.JPG',
    puntua: false
  },
  {
    id: 'minijuego-html',
    modulo: 'HTML',
    titulo: 'Actividad — Comandos de HTML',
    tipo: 'Actividad',
    descripcion: 'Partida de 45 segundos: acierta el resultado de cada instrucción',
    ruta: '../assets/embebidos/03-html/minijuego-html/index.html',
    portada: '../assets/img/portadas%20video/Lenguajes%20de%20programaci%C3%B3n/html3.jpeg',
    puntua: true,
    maximo: 100
  },
  {
    id: 'cuestionario-css',
    modulo: 'CSS',
    titulo: 'Cuestionario — Introducción a CSS',
    tipo: 'Cuestionario',
    descripcion: '10 preguntas de selección única, 10 puntos por acierto',
    ruta: '../assets/embebidos/04-css/cuestionario-css/index.html',
    portada: '../assets/img/SENA/pizarra.JPG',
    puntua: true,
    maximo: 100
  },
  {
    id: 'ejemplos-css',
    modulo: 'CSS',
    titulo: 'Ejemplos básicos de CSS',
    tipo: 'Ejemplos',
    descripcion: 'Seis piezas de código comentadas, con su salida',
    ruta: '../assets/embebidos/04-css/ejemplos-css/index.html',
    portada: '../assets/img/SENA/idea.JPG',
    puntua: false
  },
  {
    id: 'minijuego-css',
    modulo: 'CSS',
    titulo: 'Actividad — Comandos de CSS',
    tipo: 'Actividad',
    descripcion: 'Partida de 45 segundos: acierta el resultado de cada instrucción',
    ruta: '../assets/embebidos/04-css/minijuego-css/index.html',
    portada: '../assets/img/SENA/escritorio.JPG',
    puntua: true,
    maximo: 100
  },
  {
    id: 'cuestionario-web',
    modulo: 'Desarrollo web',
    titulo: 'Cuestionario — Introducción a Desarrollo web',
    tipo: 'Cuestionario',
    descripcion: '10 preguntas de selección única, 10 puntos por acierto',
    ruta: '../assets/embebidos/05-desarrollo-web/cuestionario-web/index.html',
    portada: '../assets/img/SENA/pizarra.JPG',
    puntua: true,
    maximo: 100
  },
  {
    id: 'ejemplos-web',
    modulo: 'Desarrollo web',
    titulo: 'Ejemplos básicos de Desarrollo web',
    tipo: 'Ejemplos',
    descripcion: 'Seis piezas de código comentadas, con su salida',
    ruta: '../assets/embebidos/05-desarrollo-web/ejemplos-web/index.html',
    portada: '../assets/img/SENA/idea.JPG',
    puntua: false
  },
  {
    id: 'minijuego-web',
    modulo: 'Desarrollo web',
    titulo: 'Actividad — Comandos de Desarrollo web',
    tipo: 'Actividad',
    descripcion: 'Partida de 45 segundos: acierta el resultado de cada instrucción',
    ruta: '../assets/embebidos/05-desarrollo-web/minijuego-web/index.html',
    portada: '../assets/img/SENA/escritorio.JPG',
    puntua: true,
    maximo: 100
  },
  {
    id: 'cuestionario-php',
    modulo: 'PHP',
    titulo: 'Cuestionario — Introducción a PHP',
    tipo: 'Cuestionario',
    descripcion: '10 preguntas de selección única, 10 puntos por acierto',
    ruta: '../assets/embebidos/06-php/cuestionario-php/index.html',
    portada: '../assets/img/SENA/pizarra.JPG',
    puntua: true,
    maximo: 100
  },
  {
    id: 'ejemplos-php',
    modulo: 'PHP',
    titulo: 'Ejemplos básicos de PHP',
    tipo: 'Ejemplos',
    descripcion: 'Seis piezas de código comentadas, con su salida',
    ruta: '../assets/embebidos/06-php/ejemplos-php/index.html',
    portada: '../assets/img/SENA/idea.JPG',
    puntua: false
  },
  {
    id: 'minijuego-php',
    modulo: 'PHP',
    titulo: 'Actividad — Comandos de PHP',
    tipo: 'Actividad',
    descripcion: 'Partida de 45 segundos: acierta el resultado de cada instrucción',
    ruta: '../assets/embebidos/06-php/minijuego-php/index.html',
    portada: '../assets/img/SENA/escritorio.JPG',
    puntua: true,
    maximo: 100
  },
  {
    id: 'cuestionario-c',
    modulo: 'C',
    titulo: 'Cuestionario — Introducción a C',
    tipo: 'Cuestionario',
    descripcion: '10 preguntas de selección única, 10 puntos por acierto',
    ruta: '../assets/embebidos/07-c/cuestionario-c/index.html',
    portada: '../assets/img/SENA/pizarra.JPG',
    puntua: true,
    maximo: 100
  },
  {
    id: 'ejemplos-c',
    modulo: 'C',
    titulo: 'Ejemplos básicos de C',
    tipo: 'Ejemplos',
    descripcion: 'Seis piezas de código comentadas, con su salida',
    ruta: '../assets/embebidos/07-c/ejemplos-c/index.html',
    portada: '../assets/img/SENA/idea.JPG',
    puntua: false
  },
  {
    id: 'minijuego-c',
    modulo: 'C',
    titulo: 'Actividad — Comandos de C',
    tipo: 'Actividad',
    descripcion: 'Partida de 45 segundos: acierta el resultado de cada instrucción',
    ruta: '../assets/embebidos/07-c/minijuego-c/index.html',
    portada: '../assets/img/SENA/escritorio.JPG',
    puntua: true,
    maximo: 100
  },
  {
    id: 'cuestionario-cpp',
    modulo: 'C++',
    titulo: 'Cuestionario — Introducción a C++',
    tipo: 'Cuestionario',
    descripcion: '10 preguntas de selección única, 10 puntos por acierto',
    ruta: '../assets/embebidos/08-cpp/cuestionario-cpp/index.html',
    portada: '../assets/img/SENA/pizarra.JPG',
    puntua: true,
    maximo: 100
  },
  {
    id: 'ejemplos-cpp',
    modulo: 'C++',
    titulo: 'Ejemplos básicos de C++',
    tipo: 'Ejemplos',
    descripcion: 'Seis piezas de código comentadas, con su salida',
    ruta: '../assets/embebidos/08-cpp/ejemplos-cpp/index.html',
    portada: '../assets/img/SENA/idea.JPG',
    puntua: false
  },
  {
    id: 'minijuego-cpp',
    modulo: 'C++',
    titulo: 'Actividad — Comandos de C++',
    tipo: 'Actividad',
    descripcion: 'Partida de 45 segundos: acierta el resultado de cada instrucción',
    ruta: '../assets/embebidos/08-cpp/minijuego-cpp/index.html',
    portada: '../assets/img/SENA/escritorio.JPG',
    puntua: true,
    maximo: 100
  },
  {
    id: 'cuestionario-csharp',
    modulo: 'C#',
    titulo: 'Cuestionario — Introducción a C#',
    tipo: 'Cuestionario',
    descripcion: '10 preguntas de selección única, 10 puntos por acierto',
    ruta: '../assets/embebidos/09-csharp/cuestionario-csharp/index.html',
    portada: '../assets/img/SENA/pizarra.JPG',
    puntua: true,
    maximo: 100
  },
  {
    id: 'ejemplos-csharp',
    modulo: 'C#',
    titulo: 'Ejemplos básicos de C#',
    tipo: 'Ejemplos',
    descripcion: 'Seis piezas de código comentadas, con su salida',
    ruta: '../assets/embebidos/09-csharp/ejemplos-csharp/index.html',
    portada: '../assets/img/SENA/idea.JPG',
    puntua: false
  },
  {
    id: 'minijuego-csharp',
    modulo: 'C#',
    titulo: 'Actividad — Comandos de C#',
    tipo: 'Actividad',
    descripcion: 'Partida de 45 segundos: acierta el resultado de cada instrucción',
    ruta: '../assets/embebidos/09-csharp/minijuego-csharp/index.html',
    portada: '../assets/img/SENA/escritorio.JPG',
    puntua: true,
    maximo: 100
  },
  {
    id: 'diccionario-english',
    modulo: 'English',
    titulo: 'Diccionario técnico ES–EN',
    tipo: 'Diccionario',
    descripcion: '100 términos en español e inglés, con frase de uso y buscador',
    ruta: '../assets/embebidos/10-english/diccionario-english/index.html',
    portada: '../assets/img/SENA/manual.JPG',
    puntua: false
  },
  {
    id: 'english-general',
    modulo: 'English',
    titulo: 'Lenguaje Vocabulario general — English practice',
    tipo: 'English practice',
    descripcion: '10 términos del módulo: elige la traducción correcta al inglés',
    ruta: '../assets/embebidos/10-english/english-general/index.html',
    portada: '../assets/img/SENA/pizarra.JPG',
    puntua: true,
    maximo: 100
  },
  {
    id: 'english-html',
    modulo: 'English',
    titulo: 'Lenguaje HTML — English practice',
    tipo: 'English practice',
    descripcion: '10 términos del módulo: elige la traducción correcta al inglés',
    ruta: '../assets/embebidos/10-english/english-html/index.html',
    portada: '../assets/img/SENA/pizarra.JPG',
    puntua: true,
    maximo: 100
  },
  {
    id: 'english-css',
    modulo: 'English',
    titulo: 'Lenguaje CSS — English practice',
    tipo: 'English practice',
    descripcion: '10 términos del módulo: elige la traducción correcta al inglés',
    ruta: '../assets/embebidos/10-english/english-css/index.html',
    portada: '../assets/img/SENA/pizarra.JPG',
    puntua: true,
    maximo: 100
  },
  {
    id: 'english-web',
    modulo: 'English',
    titulo: 'Lenguaje Desarrollo web — English practice',
    tipo: 'English practice',
    descripcion: '10 términos del módulo: elige la traducción correcta al inglés',
    ruta: '../assets/embebidos/10-english/english-web/index.html',
    portada: '../assets/img/SENA/pizarra.JPG',
    puntua: true,
    maximo: 100
  },
  {
    id: 'english-python',
    modulo: 'English',
    titulo: 'Verbo TO BE — English practice',
    tipo: 'English practice',
    descripcion: '10 términos del módulo: elige la traducción correcta al inglés',
    ruta: '../assets/embebidos/10-english/english-python/index.html',
    portada: '../assets/img/SENA/pizarra.JPG',
    puntua: true,
    maximo: 100
  },
  {
    id: 'english-java',
    modulo: 'English',
    titulo: 'Advervios — English practice',
    tipo: 'English practice',
    descripcion: '10 términos del módulo: elige la traducción correcta al inglés',
    ruta: '../assets/embebidos/10-english/english-java/index.html',
    portada: '../assets/img/SENA/pizarra.JPG',
    puntua: true,
    maximo: 100
  },
  {
    id: 'english-php',
    modulo: 'English',
    titulo: 'Presente continuo — English practice',
    tipo: 'English practice',
    descripcion: '10 términos del módulo: elige la traducción correcta al inglés',
    ruta: '../assets/embebidos/10-english/english-php/index.html',
    portada: '../assets/img/SENA/pizarra.JPG',
    puntua: true,
    maximo: 100
  },
  {
    id: 'english-c',
    modulo: 'English',
    titulo: 'Lenguaje C — English practice',
    tipo: 'English practice',
    descripcion: '10 términos del módulo: elige la traducción correcta al inglés',
    ruta: '../assets/embebidos/10-english/english-c/index.html',
    portada: '../assets/img/SENA/pizarra.JPG',
    puntua: true,
    maximo: 100
  },
  {
    id: 'english-cpp',
    modulo: 'English',
    titulo: 'Lenguaje C++ — English practice',
    tipo: 'English practice',
    descripcion: '10 términos del módulo: elige la traducción correcta al inglés',
    ruta: '../assets/embebidos/10-english/english-cpp/index.html',
    portada: '../assets/img/SENA/pizarra.JPG',
    puntua: true,
    maximo: 100
  },
  {
    id: 'english-csharp',
    modulo: 'English',
    titulo: 'Lenguaje C# — English practice',
    tipo: 'English practice',
    descripcion: '10 términos del módulo: elige la traducción correcta al inglés',
    ruta: '../assets/embebidos/10-english/english-csharp/index.html',
    portada: '../assets/img/SENA/pizarra.JPG',
    puntua: true,
    maximo: 100
  },
  {
    id: 'diccionario-general',
    modulo: 'English',
    titulo: 'Diccionario Vocabulario general · ES–EN',
    tipo: 'Diccionario',
    descripcion: '20 términos del módulo en español e inglés, con frase de uso',
    ruta: '../assets/embebidos/10-english/diccionario-general/index.html',
    portada: '../assets/img/SENA/manual.JPG',
    puntua: false
  },
  {
    id: 'diccionario-html',
    modulo: 'English',
    titulo: 'Diccionario HTML · ES–EN',
    tipo: 'Diccionario',
    descripcion: '20 términos del módulo en español e inglés, con frase de uso',
    ruta: '../assets/embebidos/10-english/diccionario-html/index.html',
    portada: '../assets/img/SENA/manual.JPG',
    puntua: false
  },
  {
    id: 'diccionario-css',
    modulo: 'English',
    titulo: 'Diccionario CSS · ES–EN',
    tipo: 'Diccionario',
    descripcion: '20 términos del módulo en español e inglés, con frase de uso',
    ruta: '../assets/embebidos/10-english/diccionario-css/index.html',
    portada: '../assets/img/SENA/manual.JPG',
    puntua: false
  },
  {
    id: 'diccionario-web',
    modulo: 'English',
    titulo: 'Diccionario Desarrollo web · ES–EN',
    tipo: 'Diccionario',
    descripcion: '20 términos del módulo en español e inglés, con frase de uso',
    ruta: '../assets/embebidos/10-english/diccionario-web/index.html',
    portada: '../assets/img/SENA/manual.JPG',
    puntua: false
  },
  {
    id: 'diccionario-python',
    modulo: 'English',
    titulo: 'Diccionario Python · ES–EN',
    tipo: 'Diccionario',
    descripcion: '20 términos del módulo en español e inglés, con frase de uso',
    ruta: '../assets/embebidos/10-english/diccionario-python/index.html',
    portada: '../assets/img/SENA/manual.JPG',
    puntua: false
  },
  {
    id: 'diccionario-java',
    modulo: 'English',
    titulo: 'Diccionario Java · ES–EN',
    tipo: 'Diccionario',
    descripcion: '20 términos del módulo en español e inglés, con frase de uso',
    ruta: '../assets/embebidos/10-english/diccionario-java/index.html',
    portada: '../assets/img/SENA/manual.JPG',
    puntua: false
  },
  {
    id: 'diccionario-php',
    modulo: 'English',
    titulo: 'Diccionario PHP · ES–EN',
    tipo: 'Diccionario',
    descripcion: '20 términos del módulo en español e inglés, con frase de uso',
    ruta: '../assets/embebidos/10-english/diccionario-php/index.html',
    portada: '../assets/img/SENA/manual.JPG',
    puntua: false
  },
  {
    id: 'diccionario-c',
    modulo: 'English',
    titulo: 'Diccionario C · ES–EN',
    tipo: 'Diccionario',
    descripcion: '20 términos del módulo en español e inglés, con frase de uso',
    ruta: '../assets/embebidos/10-english/diccionario-c/index.html',
    portada: '../assets/img/SENA/manual.JPG',
    puntua: false
  },
  {
    id: 'diccionario-cpp',
    modulo: 'English',
    titulo: 'Diccionario C++ · ES–EN',
    tipo: 'Diccionario',
    descripcion: '20 términos del módulo en español e inglés, con frase de uso',
    ruta: '../assets/embebidos/10-english/diccionario-cpp/index.html',
    portada: '../assets/img/SENA/manual.JPG',
    puntua: false
  },
  {
    id: 'diccionario-csharp',
    modulo: 'English',
    titulo: 'Diccionario C# · ES–EN',
    tipo: 'Diccionario',
    descripcion: '20 términos del módulo en español e inglés, con frase de uso',
    ruta: '../assets/embebidos/10-english/diccionario-csharp/index.html',
    portada: '../assets/img/SENA/manual.JPG',
    puntua: false
  },
  {
    id: 'cuestionario-tunja',
    modulo: 'Sede Tunja',
    titulo: 'Cuestionario — Sede Tunja',
    tipo: 'Cuestionario',
    descripcion: '10 preguntas de selección única sobre el centro y el programa, 10 puntos por acierto',
    ruta: '../assets/embebidos/11-sede-tunja/cuestionario-tunja/index.html',
    portada: '../assets/img/SENA/sedestunja.jpeg',
    puntua: true,
    maximo: 100
  },
  {
    id: 'ejemplos-tunja',
    modulo: 'Sede Tunja',
    titulo: 'Información — Sede Tunja',
    tipo: 'Ejemplos',
    descripcion: 'Seis fichas de contexto sobre el centro CEGAFE y el programa',
    ruta: '../assets/embebidos/11-sede-tunja/ejemplos-tunja/index.html',
    portada: '../assets/img/SENA/sedestunja.jpeg',
    puntua: false
  },
  {
    id: 'minijuego-tunja',
    modulo: 'Sede Tunja',
    titulo: 'Actividad — Datos de Sede Tunja',
    tipo: 'Actividad',
    descripcion: 'Partida de 45 segundos: acierta cada dato del centro y el programa',
    ruta: '../assets/embebidos/11-sede-tunja/minijuego-tunja/index.html',
    portada: '../assets/img/SENA/sedestunja.jpeg',
    puntua: true,
    maximo: 100
  }
];

const CLAVE_PUNTAJES = 'sgma_puntajes_embebidos';

/* ── Identidad de quien juega ── */

function identidadActual() {
  const datos = new URLSearchParams(window.location.search);
  const indice = datos.get('i');
  const nombre = datos.get('u');

  if (indice !== null && /^\d+$/.test(indice)) {
    return { clave: 'aprendiz-' + indice, nombre: nombre || 'Aprendiz ' + indice, rol: 'aprendiz' };
  }
  return { clave: 'anonimo', nombre: 'Sin identificar', rol: 'anonimo' };
}

/* ── Puntajes ── */

function leerPuntajes() {
  try {
    const guardado = JSON.parse(localStorage.getItem(CLAVE_PUNTAJES));
    return guardado && typeof guardado === 'object' ? guardado : {};
  } catch (e) {
    return {};
  }
}

function guardarPuntajeEmbebido(actividad, puntaje, detalle) {
  const identidad = identidadActual();
  const todos = leerPuntajes();
  const mios = todos[identidad.clave] || {};
  const previo = mios[actividad];

  mios[actividad] = {
    puntaje: puntaje,
    mejor: previo ? Math.max(previo.mejor || 0, puntaje) : puntaje,
    intentos: (previo ? previo.intentos : 0) + 1,
    detalle: detalle || '',
    fecha: new Date().toISOString(),
    nombre: identidad.nombre
  };

  todos[identidad.clave] = mios;
  try { localStorage.setItem(CLAVE_PUNTAJES, JSON.stringify(todos)); } catch (e) {}
  return mios[actividad];
}

function misPuntajes() {
  return leerPuntajes()[identidadActual().clave] || {};
}

/* ── Tabla de resultados ── */

/* Pinta cada tabla marcada con data-embebidos. El valor del atributo
   filtra por módulo; vacío significa «todos». */
function pintarPuntajesEmbebidos() {
  document.querySelectorAll('tbody[data-embebidos]').forEach(pintarTabla);

  const quien = identidadActual().nombre;
  ['embebidos-quien', 'embebidos-quien-modulo'].forEach(id => {
    const titular = document.getElementById(id);
    if (titular) titular.textContent = quien;
  });
}

function pintarTabla(cuerpo) {
  const filtro = cuerpo.dataset.embebidos;
  const mios = misPuntajes();
  cuerpo.replaceChildren();

  EMBEBIDOS.filter(a => !filtro || a.modulo === filtro).forEach(actividad => {
    const marca = mios[actividad.id];
    const fila = document.createElement('tr');

    const celda = (texto, clase) => {
      const td = document.createElement('td');
      td.textContent = texto;
      if (clase) td.className = clase;
      return td;
    };

    const celdaNombre = document.createElement('td');
    const enlace = document.createElement('a');
    enlace.href = actividad.ruta;
    enlace.target = '_blank';
    enlace.rel = 'noopener';
    enlace.textContent = actividad.titulo;
    celdaNombre.appendChild(enlace);

    const puntaje = !actividad.puntua
      ? 'Sin puntaje'
      : (marca ? marca.mejor + ' / ' + actividad.maximo : '—');

    fila.append(
      celdaNombre,
      celda(actividad.modulo),
      celda(actividad.tipo),
      celda(puntaje),
      celda(marca ? String(marca.intentos) : '0'),
      celda(marca ? marca.detalle : (actividad.puntua ? 'Sin presentar' : 'Material de consulta'))
    );

    cuerpo.appendChild(fila);
  });
}

/* ── Aviso de puntaje desde el material embebido ── */

window.addEventListener('message', evento => {
  const dato = evento.data;
  if (!dato || dato.tipo !== 'sgma-puntaje') return;
  if (!EMBEBIDOS.some(a => a.id === dato.actividad)) return;

  guardarPuntajeEmbebido(dato.actividad, Number(dato.puntaje) || 0, dato.detalle);
  pintarPuntajesEmbebidos();
});

document.addEventListener('DOMContentLoaded', pintarPuntajesEmbebidos);
