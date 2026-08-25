/* ══════════════════════════════════════════
   SGMA-ADSO — Tercer nivel de Contenido del curso

   La vista tiene dos niveles escritos a mano: la fase
   (curso-seccion) y la guía (curso-subgrupo). El tercero
   —las subcarpetas de cada guía— se arma iterando el árbol
   del repositorio, para que no haya que mantenerlo a mano
   ni se desfase de lo que hay en disco.

   La jerarquía de la vista es h1 Módulo 1 › h2 Contenido
   del curso › h3 sección › h4 subcategoría: cada una abre
   con su h4 y lista debajo sus archivos directos; de las
   carpetas más hondas se anuncia el nombre y cuánto
   contienen.
══════════════════════════════════════════ */

(function () {
  const bloques = document.querySelectorAll('[data-carpeta]');
  const arbol = window.ARBOL_FICHA;
  if (!bloques.length || !arbol || typeof REPOSITORIO !== 'object') return;

  const TOPE_ARCHIVOS = 30;   // más allá de esto se resume, para no volcar cientos de filas

  const ordenar = nodos => Array.from(nodos).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  const extension = nombre => (nombre.split('.').pop() || '').toLowerCase();

  function buscar(ruta) {
    let nodo = arbol;
    for (const parte of ruta.split('/')) {
      if (!nodo.hijos.has(parte)) return null;
      nodo = nodo.hijos.get(parte);
    }
    return nodo;
  }

  function recuento(nodo) {
    let carpetas = nodo.hijos.size, archivos = nodo.archivos.length;
    nodo.hijos.forEach(hijo => {
      const sub = recuento(hijo);
      carpetas += sub.carpetas;
      archivos += sub.archivos;
    });
    return { carpetas: carpetas, archivos: archivos };
  }

  function resumen(nodo) {
    const total = recuento(nodo);
    const partes = [];
    if (total.carpetas) partes.push(total.carpetas + (total.carpetas === 1 ? ' carpeta' : ' carpetas'));
    partes.push(total.archivos + (total.archivos === 1 ? ' archivo' : ' archivos'));
    return partes.join(' · ');
  }

  /* ── Filas ── */

  function filaArchivo(nodo, nombre) {
    const fila = document.createElement('div');
    fila.className = 'curso-actividad';

    const linea = document.createElement('div');
    linea.className = 'curso-fila';

    const icono = document.createElement('span');
    icono.className = 'curso-icono icono-pagina';
    icono.textContent = 'P';

    const enlace = document.createElement('a');
    enlace.href = encodeURI(REPOSITORIO.base + (nodo.ruta ? nodo.ruta + '/' : '') + nombre);
    enlace.target = '_blank';
    enlace.rel = 'noopener';
    enlace.textContent = nombre;

    const tipo = document.createElement('span');
    tipo.className = 'curso-tipo';
    tipo.textContent = extension(nombre).toUpperCase();

    linea.append(icono, enlace, tipo);
    fila.appendChild(linea);
    return fila;
  }

  function filaCarpeta(hijo) {
    const fila = document.createElement('div');
    fila.className = 'curso-actividad';

    const linea = document.createElement('div');
    linea.className = 'curso-fila';

    const icono = document.createElement('span');
    icono.className = 'curso-icono icono-evidencia';
    icono.textContent = 'C';

    const nombre = document.createElement('span');
    nombre.className = 'curso-nivel3-carpeta';
    nombre.textContent = hijo.nombre;

    const tipo = document.createElement('span');
    tipo.className = 'curso-tipo';
    tipo.textContent = resumen(hijo);

    linea.append(icono, nombre, tipo);
    fila.appendChild(linea);
    return fila;
  }

  /* ── Tercer nivel de un bloque ── */

  function desplegar(bloque) {
    const nodo = buscar(bloque.dataset.carpeta);
    if (!nodo || !nodo.hijos.size) return 0;

    const destino = bloque.classList.contains('curso-seccion')
      ? bloque.querySelector('.curso-cuerpo')
      : bloque;
    if (!destino) return 0;

    let puestos = 0;

    ordenar(nodo.hijos.values()).forEach(hijo => {
      const titulo = document.createElement('h4');
      titulo.className = 'curso-nivel3';
      titulo.textContent = hijo.nombre;

      const conteo = document.createElement('span');
      conteo.className = 'curso-nivel3-conteo';
      conteo.textContent = resumen(hijo);
      titulo.appendChild(conteo);

      const cuerpo = document.createElement('div');
      cuerpo.className = 'curso-nivel3-cuerpo';

      ordenar(hijo.hijos.values()).forEach(nieto => cuerpo.appendChild(filaCarpeta(nieto)));

      const archivos = hijo.archivos.slice().sort((a, b) => a.localeCompare(b, 'es'));
      archivos.slice(0, TOPE_ARCHIVOS).forEach(nombre => cuerpo.appendChild(filaArchivo(hijo, nombre)));

      if (archivos.length > TOPE_ARCHIVOS) {
        const resto = document.createElement('p');
        resto.className = 'curso-nivel3-resto';
        resto.textContent = 'y ' + (archivos.length - TOPE_ARCHIVOS) +
                            ' archivos más en esta carpeta.';
        cuerpo.appendChild(resto);
      }

      destino.append(titulo, cuerpo);
      puestos += 1;
    });

    return puestos;
  }

  bloques.forEach(desplegar);
})();
