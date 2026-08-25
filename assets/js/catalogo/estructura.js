/* ══════════════════════════════════════════
   SGMA-ADSO — Estructura de carpetas de la ficha

   El menú lateral reproduce el árbol del repositorio
   ADSO 3293836 con nodos desplegables. Al elegir una
   carpeta, la pantalla central lista su índice:
   primero las subcarpetas y después los archivos.

   El árbol se arma con REPOSITORIO (documentos.js), que
   ya es el índice del repositorio: aquí no se repite el
   catálogo, solo se le da forma de árbol. Se respetan los
   permisos por rol de cada fase.
══════════════════════════════════════════ */

(function () {
  const navegador = document.getElementById('arbol-repo-nav');
  const cuerpo    = document.getElementById('estructura-tbody');
  if (!navegador || !cuerpo || typeof REPOSITORIO !== 'object') return;

  const migas   = document.getElementById('estructura-ruta');
  const titulo  = document.getElementById('estructura-titulo');
  const conteo  = document.getElementById('estructura-conteo');
  const vacio   = document.getElementById('estructura-vacio');

  const rolPagina = window.location.pathname.split('/').pop().replace('.html', '');
  const fases = REPOSITORIO.fases.filter(fase => fase.roles.includes(rolPagina));

  /* ── Árbol ── */

  const raiz = { nombre: 'ADSO 3293836', ruta: '', hijos: new Map(), archivos: [] };

  function nodoDe(ruta) {
    if (!ruta) return raiz;
    let actual = raiz, acumulada = '';
    ruta.split('/').forEach(parte => {
      acumulada = acumulada ? acumulada + '/' + parte : parte;
      if (!actual.hijos.has(parte)) {
        actual.hijos.set(parte, { nombre: parte, ruta: acumulada, hijos: new Map(), archivos: [] });
      }
      actual = actual.hijos.get(parte);
    });
    return actual;
  }

  fases.forEach(fase => {
    nodoDe(fase.carpeta === '(raíz)' ? '' : fase.carpeta);
    fase.carpetas.forEach(carpeta => {
      const nodo = nodoDe(carpeta.ruta);
      carpeta.archivos.forEach(archivo => nodo.archivos.push(archivo));
    });
  });

  // El árbol queda disponible para el tercer nivel de Contenido del curso
  window.ARBOL_FICHA = raiz;

  function recuento(nodo) {
    let carpetas = nodo.hijos.size, archivos = nodo.archivos.length;
    nodo.hijos.forEach(hijo => {
      const sub = recuento(hijo);
      carpetas += sub.carpetas;
      archivos += sub.archivos;
    });
    return { carpetas: carpetas, archivos: archivos };
  }

  const ordenar = nodos => Array.from(nodos).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));

  /* ── Enlaces a los archivos ── */

  const extension = nombre => (nombre.split('.').pop() || '').toLowerCase();

  function enlaceArchivo(nodo, nombre) {
    const destino = REPOSITORIO.base + (nodo.ruta ? nodo.ruta + '/' : '') + nombre;
    const a = document.createElement('a');
    a.href = encodeURI(destino);
    a.target = '_blank';
    a.rel = 'noopener';
    a.className = 'repo-doc';
    a.textContent = nombre;
    return a;
  }

  /* ── Pantalla central: índice de la carpeta ── */

  function listar(nodo) {
    cuerpo.replaceChildren();
    titulo.textContent = nodo.nombre;

    const total = recuento(nodo);
    conteo.textContent = total.carpetas + ' carpetas · ' + total.archivos + ' archivos';

    // Migas de pan, para volver hacia atrás
    migas.replaceChildren();
    const camino = [raiz];
    if (nodo.ruta) {
      let actual = raiz;
      nodo.ruta.split('/').forEach(parte => {
        actual = actual.hijos.get(parte);
        if (actual) camino.push(actual);
      });
    }
    camino.forEach((paso, indice) => {
      if (indice) migas.appendChild(document.createTextNode(' › '));
      const boton = document.createElement('button');
      boton.type = 'button';
      boton.className = 'estructura-miga';
      boton.textContent = paso.nombre;
      boton.disabled = paso === nodo;
      boton.addEventListener('click', () => abrir(paso));
      migas.appendChild(boton);
    });

    ordenar(nodo.hijos.values()).forEach(hijo => {
      const sub = recuento(hijo);
      const fila = document.createElement('tr');

      const celdaNombre = document.createElement('td');
      const boton = document.createElement('button');
      boton.type = 'button';
      boton.className = 'estructura-carpeta';
      boton.textContent = '📁 ' + hijo.nombre;
      boton.addEventListener('click', () => abrir(hijo));
      celdaNombre.appendChild(boton);

      const celdaTipo = document.createElement('td');
      celdaTipo.innerHTML = '<span class="badge badge-type badge-guia">CARPETA</span>';

      const celdaContenido = document.createElement('td');
      celdaContenido.textContent = sub.carpetas + ' carpetas · ' + sub.archivos + ' archivos';

      fila.append(celdaNombre, celdaTipo, celdaContenido);
      cuerpo.appendChild(fila);
    });

    nodo.archivos.slice().sort((a, b) => a.localeCompare(b, 'es')).forEach(nombre => {
      const fila = document.createElement('tr');

      const celdaNombre = document.createElement('td');
      celdaNombre.appendChild(enlaceArchivo(nodo, nombre));

      const celdaTipo = document.createElement('td');
      const etiqueta = document.createElement('span');
      etiqueta.className = 'repo-tipo tipo-' + extension(nombre);
      etiqueta.textContent = extension(nombre).toUpperCase().slice(0, 4);
      celdaTipo.appendChild(etiqueta);

      const celdaContenido = document.createElement('td');
      celdaContenido.textContent = '—';

      fila.append(celdaNombre, celdaTipo, celdaContenido);
      cuerpo.appendChild(fila);
    });

    vacio.hidden = nodo.hijos.size > 0 || nodo.archivos.length > 0;
  }

  /* ── Selección: sincroniza árbol y pantalla ── */

  const botonesArbol = new Map();

  function abrir(nodo) {
    listar(nodo);
    botonesArbol.forEach((boton, ruta) => {
      boton.classList.toggle('nodo-activo', ruta === nodo.ruta);
    });
    desplegarHasta(nodo);
    if (typeof showSection === 'function') showSection('sec-estructura-repo');
    const barra = document.getElementById('titulo-vista');
    if (barra) barra.textContent = 'Estructura de carpetas — ' + nodo.nombre;
    window.scrollTo({ top: 0 });
  }

  function desplegarHasta(nodo) {
    if (!nodo.ruta) return;
    let acumulada = '';
    nodo.ruta.split('/').forEach(parte => {
      acumulada = acumulada ? acumulada + '/' + parte : parte;
      const boton = botonesArbol.get(acumulada);
      if (boton && boton.dataset.rama === 'si') abrirRama(boton, true);
    });
  }

  function abrirRama(boton, abierta) {
    const hijos = boton.parentElement.querySelector('.arbol-hijos');
    if (!hijos) return;
    hijos.hidden = !abierta;
    boton.setAttribute('aria-expanded', String(abierta));
    boton.classList.toggle('rama-abierta', abierta);
  }

  /* ── Árbol del menú lateral ── */

  function pintarRama(nodos, contenedor) {
    ordenar(nodos).forEach(nodo => {
      const item = document.createElement('li');

      const boton = document.createElement('button');
      boton.type = 'button';
      boton.className = 'arbol-nodo';
      boton.dataset.rama = nodo.hijos.size ? 'si' : 'no';
      boton.setAttribute('aria-expanded', 'false');

      const flecha = document.createElement('span');
      flecha.className = 'arbol-flecha';
      flecha.textContent = nodo.hijos.size ? '▸' : '·';

      const texto = document.createElement('span');
      texto.className = 'arbol-texto';
      texto.textContent = nodo.nombre;

      boton.append(flecha, texto);
      botonesArbol.set(nodo.ruta, boton);
      item.appendChild(boton);

      if (nodo.hijos.size) {
        const hijos = document.createElement('ul');
        hijos.className = 'arbol-hijos';
        hijos.hidden = true;
        pintarRama(nodo.hijos.values(), hijos);
        item.appendChild(hijos);
      }

      boton.addEventListener('click', evento => {
        evento.preventDefault();
        evento.stopPropagation();
        if (nodo.hijos.size) {
          abrirRama(boton, boton.getAttribute('aria-expanded') !== 'true');
        }
        abrir(nodo);
      });

      contenedor.appendChild(item);
    });
  }

  pintarRama(raiz.hijos.values(), navegador);

  // La opción del menú abre la raíz: el índice de la ficha completa
  const opcion = document.querySelector('.arbol-repo-raiz > a[data-view="sec-estructura-repo"]');
  if (opcion) opcion.addEventListener('click', () => abrir(raiz));

  listar(raiz);
})();
