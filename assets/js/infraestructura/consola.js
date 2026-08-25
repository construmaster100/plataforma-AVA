/* ══════════════════════════════════════════
   SGMA-ADSO — Recursos HTML ejecutados en la consola

   Los objetos de aprendizaje de la ficha son páginas web.
   Esta lista los abre dentro de la propia consola, en un
   marco embebido, en lugar de mandar al aprendiz fuera de
   la plataforma.

   El catálogo no se repite aquí: se lee del listado de
   Material de Formación, que es donde vive.
══════════════════════════════════════════ */

(function () {
  const cuerpo = document.getElementById('tbody-recursos-html');
  const lista  = document.getElementById('consola-html-lista');
  if (!cuerpo || !lista) return;

  const visor  = document.getElementById('consola-html-visor');
  const marco  = document.getElementById('consola-html-marco');
  const titulo = document.getElementById('consola-html-titulo');
  const nueva  = document.getElementById('consola-html-nueva');
  const cerrar = document.getElementById('consola-html-cerrar');
  const conteo = document.getElementById('consola-html-conteo');

  const recursos = Array.from(cuerpo.querySelectorAll('tr')).map(fila => {
    const enlace = fila.querySelector('a[href]');
    const celdas = fila.querySelectorAll('td');
    if (!enlace) return null;
    return {
      nombre: enlace.textContent.trim(),
      ruta:   enlace.getAttribute('href'),
      guia:   celdas[1] ? celdas[1].textContent.trim() : ''
    };
  }).filter(Boolean);

  if (!recursos.length) return;
  if (conteo) conteo.textContent = recursos.length + ' recursos';

  function marcarActivo(ruta) {
    lista.querySelectorAll('a').forEach(a => {
      a.classList.toggle('recurso-activo', a.getAttribute('href') === ruta);
    });
  }

  function ejecutar(recurso) {
    marco.src = recurso.ruta;
    titulo.textContent = recurso.nombre;
    nueva.href = recurso.ruta;
    visor.hidden = false;
    marcarActivo(recurso.ruta);
    visor.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  recursos.forEach(recurso => {
    const item = document.createElement('li');

    const enlace = document.createElement('a');
    enlace.href = recurso.ruta;
    enlace.textContent = recurso.nombre;
    enlace.addEventListener('click', evento => {
      evento.preventDefault();
      ejecutar(recurso);
    });

    const guia = document.createElement('span');
    guia.className = 'consola-html-guia';
    guia.textContent = recurso.guia;

    item.appendChild(enlace);
    item.appendChild(guia);
    lista.appendChild(item);
  });

  if (cerrar) {
    cerrar.addEventListener('click', () => {
      marco.removeAttribute('src');
      visor.hidden = true;
      marcarActivo(null);
    });
  }
})();
