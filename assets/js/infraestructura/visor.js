/* ══════════════════════════════════════════
   SGMA-ADSO — Ventana visor de recursos embebidos

   Los objetos de aprendizaje de la ficha son páginas web.
   En vez de sacar al aprendiz de la plataforma, cualquier
   enlace que apunte a un .html del repositorio se abre en
   esta ventana: una vista flotante con su marco embebido,
   que se puede mover, expandir y cerrar.

   Sigue disponible «abrir en pestaña nueva» para quien lo
   prefiera, y la tecla Esc cierra la ventana.
══════════════════════════════════════════ */

(function () {
  const ventana = document.getElementById('visor-ventana');
  const fondo   = document.getElementById('visor-fondo');
  const barra   = document.getElementById('visor-barra');
  const marco   = document.getElementById('visor-marco');
  const titulo  = document.getElementById('visor-titulo');
  const ruta    = document.getElementById('visor-ruta');
  const nueva   = document.getElementById('visor-nueva');
  const expandir= document.getElementById('visor-expandir');
  const cerrar  = document.getElementById('visor-cerrar');
  if (!ventana || !marco) return;

  /* ── Apertura y cierre ── */

  function abrir(destino, nombre) {
    marco.src = destino;
    titulo.textContent = nombre || 'Recurso';
    ruta.textContent = decodeURI(destino.split('/').pop());
    nueva.href = destino;
    fondo.hidden = false;
    ventana.hidden = false;
    ventana.style.removeProperty('left');
    ventana.style.removeProperty('top');
    ventana.style.removeProperty('transform');
    cerrar.focus();
  }

  function ocultar() {
    marco.removeAttribute('src');
    ventana.hidden = true;
    fondo.hidden = true;
    ventana.classList.remove('visor-expandido');
    expandir.setAttribute('aria-pressed', 'false');
  }

  cerrar.addEventListener('click', ocultar);
  fondo.addEventListener('click', ocultar);

  document.addEventListener('keydown', evento => {
    if (evento.key === 'Escape' && !ventana.hidden) ocultar();
  });

  expandir.addEventListener('click', () => {
    const ampliada = ventana.classList.toggle('visor-expandido');
    expandir.setAttribute('aria-pressed', String(ampliada));
    expandir.title = ampliada ? 'Restaurar' : 'Expandir';
    if (ampliada) {
      ventana.style.removeProperty('left');
      ventana.style.removeProperty('top');
      ventana.style.removeProperty('transform');
    }
  });

  /* ── Enlaces del repositorio: se quedan dentro de la plataforma ──
     El navegador puede mostrar PDF/JPG/PNG dentro del mismo iframe que
     ya usan los .html; Word/Excel no tienen forma de previsualizarse
     sin un backend, así que se quedan en descarga (no se finge un
     visor que no puede funcionar). YouTube se reescribe a /embed/. */

  const esYouTube = destino => /(^https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//i.test(destino);

  const comoEmbedYouTube = destino => {
    const idCorto = destino.match(/youtu\.be\/([\w-]+)/i);
    if (idCorto) return 'https://www.youtube.com/embed/' + idCorto[1];
    const idLargo = destino.match(/[?&]v=([\w-]+)/i);
    if (idLargo) return 'https://www.youtube.com/embed/' + idLargo[1];
    return destino;
  };

  const esRecurso = enlace => {
    const destino = enlace.getAttribute('href') || '';
    if (esYouTube(destino)) return true;

    const esRepositorio = destino.indexOf('../docs/') === 0;
    const esEmbebido    = destino.indexOf('../assets/embebidos/') === 0;
    if (!esRepositorio && !esEmbebido) return false;

    const ruta = destino.split('?')[0];
    return /\.(html?|pdf|jpe?g|png)$/i.test(ruta);
  };

  document.addEventListener('click', evento => {
    const enlace = evento.target.closest('a[href]');
    if (!enlace || !esRecurso(enlace)) return;
    if (enlace.id === 'visor-nueva') return;          // el propio botón de la ventana
    if (enlace.closest('#consola-html-lista')) return; // la consola tiene su marco propio
    if (evento.ctrlKey || evento.metaKey || evento.shiftKey) return; // pestaña nueva a propósito
    evento.preventDefault();

    const destino = enlace.getAttribute('href');
    const abrirComo = esYouTube(destino) ? comoEmbedYouTube(destino) : destino;
    abrir(abrirComo, enlace.textContent.trim());
  });

  /* ── Arrastre por la barra de título ── */

  let arrastrando = false, desfaseX = 0, desfaseY = 0;

  barra.addEventListener('mousedown', evento => {
    if (evento.target.closest('.visor-acciones')) return;
    if (ventana.classList.contains('visor-expandido')) return;
    const caja = ventana.getBoundingClientRect();
    arrastrando = true;
    desfaseX = evento.clientX - caja.left;
    desfaseY = evento.clientY - caja.top;
    ventana.classList.add('visor-arrastrando');
    evento.preventDefault();
  });

  document.addEventListener('mousemove', evento => {
    if (!arrastrando) return;
    const ancho = ventana.offsetWidth, alto = ventana.offsetHeight;
    const x = Math.min(Math.max(0, evento.clientX - desfaseX), window.innerWidth  - ancho);
    const y = Math.min(Math.max(0, evento.clientY - desfaseY), window.innerHeight - alto);
    ventana.style.left = x + 'px';
    ventana.style.top  = y + 'px';
    ventana.style.transform = 'none';
  });

  document.addEventListener('mouseup', () => {
    arrastrando = false;
    ventana.classList.remove('visor-arrastrando');
  });
})();
