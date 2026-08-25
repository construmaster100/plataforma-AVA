/* ══════════════════════════════════════════
   SGMA-ADSO — Consola de práctica (3 paneles)

   Grid superior: Ejemplo (solo lectura) + Consola de entrada
   (borrador libre, persistido). Panel inferior: Consola de
   ejecución simulada — compara la respuesta escrita contra el
   resultado esperado del reto elegido, normalizando el texto
   igual que login.js. No hay intérprete real: el propio documento
   de especificación lo llama «código simulado».

   Depende de:
     · ficha.js               → leerAlmacen, guardarAlmacen
     · embebidos-catalogo.js  → identidadActual()
══════════════════════════════════════════ */

const CLAVE_CONSOLA_BORRADOR = 'sgma_consola_borrador';

const CONSOLA_RETOS = [
  {
    id: 'python-print',
    modulo: 'Python',
    enunciado: 'Python — ¿qué imprime este programa?',
    ejemplo: 'nombre = "Ana"\nprint("Hola, " + nombre)',
    codigo: 'edad = 20\nprint("Tengo " + str(edad) + " años")',
    respuestas: ['Tengo 20 años']
  },
  {
    id: 'java-suma',
    modulo: 'Java',
    enunciado: 'Java — ¿qué valor imprime System.out.println?',
    ejemplo: 'int a = 2;\nint b = 3;\nSystem.out.println(a + b);',
    codigo: 'int x = 10;\nint y = 15;\nSystem.out.println(x + y);',
    respuestas: ['25']
  },
  {
    id: 'html-etiqueta',
    modulo: 'HTML',
    enunciado: 'HTML — ¿qué etiqueta crea un párrafo?',
    ejemplo: '<h1>Título</h1> crea un encabezado.',
    codigo: '¿Qué etiqueta HTML crea un párrafo de texto?',
    respuestas: ['<p>', 'p']
  },
  {
    id: 'css-color',
    modulo: 'CSS',
    enunciado: 'CSS — ¿qué propiedad cambia el color del texto?',
    ejemplo: 'background-color cambia el fondo.',
    codigo: '¿Qué propiedad CSS cambia el color del texto?',
    respuestas: ['color']
  },
  {
    id: 'english-verb',
    modulo: 'English',
    enunciado: 'English — complete: "She ___ a developer."',
    ejemplo: '"I am a student." uses the verb TO BE.',
    codigo: 'She ___ a developer.',
    respuestas: ['is']
  }
];

function normalizarRespuestaConsola(texto) {
  return String(texto || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function claveDeConsola() {
  return typeof identidadActual === 'function' ? identidadActual().clave : 'anonimo';
}

function pintarRetoConsola() {
  const selector = document.getElementById('consola-practica-reto');
  const ejemplo = document.getElementById('consola-practica-ejemplo');
  const enunciado = document.getElementById('consola-practica-enunciado');
  if (!selector || !ejemplo || !enunciado) return;

  const reto = CONSOLA_RETOS.find(r => r.id === selector.value) || CONSOLA_RETOS[0];
  ejemplo.textContent = reto.ejemplo;
  enunciado.textContent = reto.enunciado + '\n\n' + reto.codigo;

  const salida = document.getElementById('consola-practica-salida');
  if (salida) salida.value = '';
}

function iniciarConsolaPractica() {
  const selector = document.getElementById('consola-practica-reto');
  const entrada = document.getElementById('consola-practica-entrada');
  const respuesta = document.getElementById('consola-practica-respuesta');
  const ejecutar = document.getElementById('consola-practica-ejecutar');
  const salida = document.getElementById('consola-practica-salida');
  if (!selector || !entrada || !respuesta || !ejecutar || !salida) return;

  selector.replaceChildren();
  CONSOLA_RETOS.forEach(reto => {
    const opcion = document.createElement('option');
    opcion.value = reto.id;
    opcion.textContent = reto.modulo + ' — ' + reto.enunciado;
    selector.appendChild(opcion);
  });

  const clave = claveDeConsola();
  const borradores = leerAlmacen(CLAVE_CONSOLA_BORRADOR, {});
  entrada.value = borradores[clave] || '';

  entrada.addEventListener('input', () => {
    const todos = leerAlmacen(CLAVE_CONSOLA_BORRADOR, {});
    todos[clave] = entrada.value;
    guardarAlmacen(CLAVE_CONSOLA_BORRADOR, todos);
  });

  selector.addEventListener('change', pintarRetoConsola);
  pintarRetoConsola();

  ejecutar.addEventListener('click', () => {
    const reto = CONSOLA_RETOS.find(r => r.id === selector.value) || CONSOLA_RETOS[0];
    const escrita = normalizarRespuestaConsola(respuesta.value);
    const acierto = reto.respuestas.some(r => normalizarRespuestaConsola(r) === escrita);
    salida.value = acierto
      ? '✅ Correcto — coincide con el resultado esperado.'
      : '❌ No coincide con el resultado esperado. Vuelve a intentarlo.';
  });
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('consola-practica-reto')) iniciarConsolaPractica();
});
