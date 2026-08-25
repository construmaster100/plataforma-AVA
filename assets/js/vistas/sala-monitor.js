/* ══════════════════════════════════════════
   SGMA-ADSO — Sala en tiempo real
   Cada estación es un aprendiz de la ficha y su
   burbuja muestra el estado real del sistema:
   nómina, materiales, resultados y matrícula.
══════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

  const rejilla = document.getElementById('sala-monitor');
  if (!rejilla) return;

  const COLORES = ['verde', 'amarillo', 'beige'];
  const ESTACIONES = 8;
  const CICLO = 4000;

  const dosCifras = n => String(n).padStart(2, '0');
  const ahoraHM = () => {
    const t = new Date();
    return dosCifras(t.getHours()) + ':' + dosCifras(t.getMinutes()) + ':' + dosCifras(t.getSeconds());
  };

  /* ── Fuentes reales de datos ── */
  const nombres = () => {
    if (typeof DIRECTORIO === 'object' && DIRECTORIO.aprendices.length) {
      return DIRECTORIO.aprendices.map(a => a.nombres.split(' ')[0] + ' ' + a.apellidos.split(' ')[0]);
    }
    return Array.from({ length: ESTACIONES }, (_, i) => 'Aprendiz ' + (i + 1));
  };

  const materiales = () =>
    (typeof getMateriales === 'function' ? getMateriales(FICHA_EN_CURSO) : []);

  const resultados = () =>
    (typeof getResultados === 'function' ? getResultados(FICHA_EN_CURSO) : []);

  const vinculados = () =>
    (typeof getMatricula === 'function' ? getMatricula(FICHA_EN_CURSO) : []);

  const NOMINA = nombres();

  /* ── Plantillas de burbuja con datos del sistema ── */
  const cabecera = (clase, simbolo, titulo) =>
    '<div class="sala-b-head"><span class="sala-b-icon ' + clase + '">' + simbolo + '</span>' +
    titulo + '</div>';

  const escapar = texto => String(texto)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const burbujaConexion = quien =>
    cabecera('sala-ic-texto', '&#9993;', 'Sesión') +
    '<p class="sala-dato">' + escapar(quien) + '</p>' +
    '<p class="sala-hora">Conectado ' + ahoraHM() + '</p>';

  const burbujaMaterial = () => {
    const lista = materiales();
    if (!lista.length) {
      return cabecera('sala-ic-codigo', '&lt;/&gt;', 'Materiales') +
             '<p class="sala-dato">Sin materiales cargados</p>';
    }
    const uno = lista[Math.floor(Math.random() * lista.length)];
    return cabecera('sala-ic-codigo', '&lt;/&gt;', 'Material') +
           '<p class="sala-dato">' + escapar(uno.nombre) + '</p>' +
           '<p class="sala-hora">' + escapar(uno.tipo) + ' · ' + escapar(uno.fecha) + '</p>';
  };

  const burbujaResultado = () => {
    const lista = resultados();
    if (!lista.length) {
      return cabecera('sala-ic-imagen', '&#9635;', 'Resultados') +
             '<p class="sala-dato">Sin resultados definidos</p>';
    }
    const uno = lista[Math.floor(Math.random() * lista.length)];
    return cabecera('sala-ic-imagen', '&#9635;', uno.codigo) +
           '<p class="sala-dato">' + escapar(uno.descripcion.slice(0, 74)) + '…</p>';
  };

  const burbujaFicha = () =>
    cabecera('sala-ic-texto', '&#9635;', 'Ficha ' + FICHA_EN_CURSO) +
    '<p class="sala-dato">' + vinculados().length + ' vinculados · ' +
    NOMINA.length + ' en directorio</p>' +
    '<p class="sala-hora">' + materiales().length + ' materiales · ' +
    resultados().length + ' resultados</p>';

  const PLANTILLAS = [burbujaConexion, burbujaMaterial, burbujaResultado, burbujaFicha];

  /* ── Estaciones ── */
  for (let i = 0; i < ESTACIONES; i++) {
    const estacion = document.createElement('div');
    estacion.className = 'sala-estacion';
    estacion.innerHTML =
      '<div class="sala-burbuja" id="monitor-burbuja-' + i + '"></div>' +
      '<div class="sala-personaje ' + COLORES[i % COLORES.length] + '">' +
      '  <div class="sala-cabeza"><span class="sala-visor"></span></div>' +
      '  <div class="sala-cuerpo"><span class="sala-torso"></span></div>' +
      '</div>' +
      '<div class="sala-escritorio"><span class="sala-laptop"></span></div>';
    rejilla.appendChild(estacion);
  }

  const sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const mostrar = (indice, tipo) => {
    const burbuja = document.getElementById('monitor-burbuja-' + indice);
    burbuja.classList.remove('sala-anim');
    burbuja.innerHTML = PLANTILLAS[tipo](NOMINA[indice % NOMINA.length]);
    void burbuja.offsetWidth;
    burbuja.classList.add('sala-anim');
  };

  const sello = document.getElementById('monitor-sello');
  const marcarSello = () => {
    if (sello) sello.textContent = 'Actualizado ' + ahoraHM();
  };

  for (let i = 0; i < ESTACIONES; i++) {
    let tipo = i % PLANTILLAS.length;

    if (sinMovimiento) {
      mostrar(i, tipo);
      continue;
    }

    setTimeout(() => {
      mostrar(i, tipo);
      marcarSello();
      setInterval(() => {
        tipo = (tipo + 1) % PLANTILLAS.length;
        mostrar(i, tipo);
        marcarSello();
      }, CICLO);
    }, i * 300);
  }

  marcarSello();
});
