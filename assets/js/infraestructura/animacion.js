/* ══════════════════════════════════════════
   SGMA-ADSO — Sala de sistemas animada
   Versión en movimiento del modelo conceptual:
   cada aprendiz alterna entre mensaje, código e imagen.
══════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

  const rejilla = document.getElementById('fondo-sala') || document.getElementById('sala-grid');
  if (!rejilla) return;

  const COLORES = ['verde', 'amarillo', 'beige'];
  // El fondo cubre la ventana, así que necesita más estaciones que la tarjeta
  const ESTACIONES = rejilla.id === 'fondo-sala' ? 24 : 8;
  const CICLO = 3400;

  const burbujaMensaje = () =>
    '<div class="sala-b-head"><span class="sala-b-icon sala-ic-texto">&#9993;</span>Mensaje</div>' +
    '<div class="sala-dots"><span></span><span></span><span></span></div>' +
    '<div class="sala-linea-msg"></div>';

  const burbujaCodigo = () =>
    '<div class="sala-b-head"><span class="sala-b-icon sala-ic-codigo">&lt;/&gt;</span>Código</div>' +
    '<div class="sala-code-line"></div>' +
    '<div class="sala-code-line sala-l2"></div>' +
    '<div class="sala-code-line sala-l3"></div>';

  const burbujaImagen = () =>
    '<div class="sala-b-head"><span class="sala-b-icon sala-ic-imagen">&#9635;</span>Imagen</div>' +
    '<div class="sala-img-frame"><div class="sala-img-scene">' +
    '<span class="sala-img-sol"></span><span class="sala-img-monte2"></span>' +
    '<span class="sala-img-monte"></span></div></div>';

  const PLANTILLAS = [burbujaMensaje, burbujaCodigo, burbujaImagen];

  for (let i = 0; i < ESTACIONES; i++) {
    const estacion = document.createElement('div');
    estacion.className = 'sala-estacion';
    estacion.innerHTML =
      '<div class="sala-burbuja" id="sala-burbuja-' + i + '"></div>' +
      '<div class="sala-personaje ' + COLORES[i % COLORES.length] + '">' +
      '  <div class="sala-cabeza"><span class="sala-visor"></span></div>' +
      '  <div class="sala-cuerpo"><span class="sala-torso"></span></div>' +
      '</div>' +
      '<div class="sala-escritorio"><span class="sala-laptop"></span></div>';
    rejilla.appendChild(estacion);
  }

  // Quien prefiere menos movimiento ve una sola burbuja fija por estación
  const sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const mostrar = (indice, tipo) => {
    const burbuja = document.getElementById('sala-burbuja-' + indice);
    burbuja.classList.remove('sala-anim');
    burbuja.innerHTML = PLANTILLAS[tipo]();
    void burbuja.offsetWidth;   // reinicia la animación de entrada
    burbuja.classList.add('sala-anim');
  };

  for (let i = 0; i < ESTACIONES; i++) {
    let tipo = i % PLANTILLAS.length;

    if (sinMovimiento) {
      mostrar(i, tipo);
      continue;
    }

    setTimeout(() => {
      mostrar(i, tipo);
      setInterval(() => {
        tipo = (tipo + 1) % PLANTILLAS.length;
        mostrar(i, tipo);
      }, CICLO);
    }, i * 260);
  }
});
