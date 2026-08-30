/* ══════════════════════════════════════════
   SGMA-ADSO — Motor de carrusel genérico (Módulo 1)

   Un solo controlador reutilizado por los 3 carruseles de Módulo 1
   (Guías de aprendizaje, Listas de chequeo, Material de aprendizaje):
   contador "X de Y", anterior/siguiente, lista de posiciones con
   selección directa, y navegación por teclado, rueda del mouse,
   arrastre y touch swipe — sin recargar la página.

   No sabe nada de guías/chequeo/material: recibe los items y una
   función para pintar el actual (renderItem) y otra para pintar la
   etiqueta de cada posición en la lista (etiquetaItem).
══════════════════════════════════════════ */

function crearCarrusel(opciones) {
  const {
    contenedorId,
    contadorId,
    listaId,
    btnAnteriorId,
    btnSiguienteId,
    obtenerItems,
    renderItem,
    etiquetaItem
  } = opciones;

  let indice = 0;

  function pintarContador() {
    const contador = document.getElementById(contadorId);
    if (!contador) return;
    const total = obtenerItems().length;
    contador.textContent = total ? (indice + 1) + ' de ' + total : '0 de 0';
  }

  function pintarLista() {
    const lista = document.getElementById(listaId);
    if (!lista) return;
    const items = obtenerItems();
    lista.innerHTML = items.map((item, i) =>
      '<option value="' + i + '"' + (i === indice ? ' selected' : '') + '>' +
      (i + 1) + ' de ' + items.length + ' — ' + etiquetaItem(item, i) + '</option>'
    ).join('');
  }

  function ir(nuevoIndice) {
    const items = obtenerItems();
    if (!items.length) {
      indice = 0;
      renderItem(null, 0, 0);
      pintarContador();
      pintarLista();
      return;
    }
    indice = Math.max(0, Math.min(nuevoIndice, items.length - 1));
    renderItem(items[indice], indice, items.length);
    pintarContador();
    pintarLista();
  }

  function anterior() { ir(indice - 1); }
  function siguiente() { ir(indice + 1); }
  // Vuelve a pintar sin cambiar de posición — se usa después de que el
  // instructor agrega/edita/elimina un item del catálogo.
  function refrescar() { ir(indice); }

  const contenedor = document.getElementById(contenedorId);
  if (contenedor) {
    contenedor.addEventListener('wheel', e => {
      e.preventDefault();
      if (e.deltaY > 0 || e.deltaX > 0) siguiente(); else anterior();
    }, { passive: false });

    if (!contenedor.hasAttribute('tabindex')) contenedor.tabIndex = 0;
    contenedor.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); siguiente(); }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); anterior(); }
    });

    let xTouchInicio = null;
    contenedor.addEventListener('touchstart', e => {
      xTouchInicio = e.touches[0].clientX;
    }, { passive: true });
    contenedor.addEventListener('touchend', e => {
      if (xTouchInicio === null) return;
      const delta = e.changedTouches[0].clientX - xTouchInicio;
      if (Math.abs(delta) > 40) { delta < 0 ? siguiente() : anterior(); }
      xTouchInicio = null;
    }, { passive: true });

    let arrastrando = false;
    let xArrastreInicio = 0;
    contenedor.addEventListener('mousedown', e => {
      arrastrando = true;
      xArrastreInicio = e.clientX;
    });
    window.addEventListener('mouseup', e => {
      if (!arrastrando) return;
      arrastrando = false;
      const delta = e.clientX - xArrastreInicio;
      if (Math.abs(delta) > 60) { delta < 0 ? siguiente() : anterior(); }
    });
  }

  const btnAnterior = document.getElementById(btnAnteriorId);
  const btnSiguiente = document.getElementById(btnSiguienteId);
  if (btnAnterior) btnAnterior.addEventListener('click', anterior);
  if (btnSiguiente) btnSiguiente.addEventListener('click', siguiente);

  const lista = document.getElementById(listaId);
  if (lista) lista.addEventListener('change', () => ir(Number(lista.value)));

  return { ir, anterior, siguiente, refrescar, indiceActual: () => indice };
}
