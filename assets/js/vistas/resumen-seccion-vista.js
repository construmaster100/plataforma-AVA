/* ══════════════════════════════════════════
   SGMA-ADSO — Resumen de sección del aprendiz

   Al hacer clic en el título de una de las 3 secciones del
   sidebar (1. Investiga / 2. Formación / 3. Resultados), además
   de abrirse el acordeón se pinta un tablero de tarjetas con sus
   hojas reales — no contenido inventado, los mismos títulos y
   `data-view` que ya tiene el sidebar. Cada tarjeta navega a la
   hoja real; esto no la reemplaza, es un paso intermedio.

   Los 3 botones ya traen `data-view="sec-resumen-seccion"` en el
   HTML, así que el cambio de vista lo hace el switcher genérico
   de sofia_plus.js — aquí solo se pintan las tarjetas y el título,
   y hay que hacerlo ANTES de que ese switcher lea el `<h1>` de la
   sección. Por eso este archivo se carga antes que sofia_plus.js:
   los listeners de un mismo elemento se disparan en el orden en
   que se registraron, y el registro sigue el orden de los <script>.

   Depende de: nada más que el DOM ya presente en aprendiz.html.
══════════════════════════════════════════ */

const RESUMEN_SECCIONES = {
  investiga: {
    titulo: '1. Modulo 1',
    hojas: [
      { titulo: '1.1 Contenidos formativos', desc: 'Recursos multimedia, ejemplos de código, recursos interactivos', icono: '📚', dataView: 'sec-materiales' },
      { titulo: '1.2 Actividades asociadas', desc: 'AA1 a AA5, cada una con 4 módulos (M1-M4)', icono: '📋', dataView: 'sec-aa-1' },
      { titulo: '1.3 Contenidos', desc: 'Descargar contenidos y consultar orientaciones de aprendizaje', icono: '✅', dataView: 'sec-descargar' }
    ]
  },
  formacion: {
    titulo: '2. Modulo 2',
    hojas: [
      { titulo: '2.1 Evaluaciones y retroalimentación', desc: 'Presentar evaluaciones y ver retroalimentación', icono: '📝', dataView: 'sec-presentar' },
      { titulo: '2.2 Avance académico', desc: 'Tu ficha de aprendizaje y resultados', icono: '📊', dataView: 'sec-ficha-aprendizaje' },
      { titulo: '2.3 Dashboard académico', desc: 'Tablero de puntajes de desempeño', icono: '⭐', dataView: 'sec-puntajes' },
      { titulo: '2.4 Resultados de aprendizaje', desc: 'Mi progreso — 72 RA', icono: '📈', dataView: 'sec-progreso-ra' },
      { titulo: '2.5 Historial académico', desc: 'Calificaciones y retroalimentaciones por módulo', icono: '🗂️', dataView: 'sec-historial-acad' }
    ]
  },
  resultados: {
    titulo: '3. Modulo 3',
    hojas: [
      { titulo: '3.1 Ejercicios prácticos', desc: 'Programación, bases de datos, emprendimiento, ciencias básicas', icono: '⌨️', dataView: 'sec-ejercicios-ap' },
      { titulo: '3.2 Entrega de evidencias', desc: 'Reportar evidencia de código', icono: '📤', dataView: 'sec-evidencias' },
      { titulo: '3.3 Retroalimentación del instructor', desc: 'Reporte académico ante el instructor', icono: '💬', dataView: 'sec-reporte-inst' },
      { titulo: '3.4 Repositorio de evidencias', desc: 'Documentos de la ficha organizados por fase', icono: '🗄️', dataView: 'sec-repositorio' },
      { titulo: '3.5 Seguimiento de entregas', desc: 'Cronograma de la formación', icono: '🗓️', dataView: 'sec-cronograma' },
      { titulo: '3.6 Historial de versiones', desc: 'Todas tus entregas anteriores', icono: '🕘', dataView: 'sec-historial-ver' }
    ]
  }
};

function crearTarjetaResumen(hoja) {
  const tarjeta = document.createElement('div');
  tarjeta.className = 'card content-card';
  tarjeta.style.width = '220px';

  const icono = document.createElement('div');
  icono.className = 'cc-icon';
  icono.textContent = hoja.icono;

  const titulo = document.createElement('h4');
  titulo.textContent = hoja.titulo;

  const desc = document.createElement('p');
  desc.textContent = hoja.desc;

  const enlace = document.createElement('a');
  enlace.href = '#';
  enlace.className = 'btn btn-sm btn-ver';
  enlace.textContent = 'Entrar →';
  // Esta tarjeta se crea al hacer clic, mucho después de que
  // sofia_plus.js capturó su lista fija de [data-view] al cargar
  // la página — un data-view puesto aquí no tendría oyente. En vez
  // de eso, se dispara el enlace real del sidebar para ese destino,
  // que sí lo tiene desde el arranque. La hoja 2.4 usa elementId
  // porque su data-view cambia en caliente según el curso elegido
  // (ADSO/English) — buscarla por id es lo único estable.
  enlace.addEventListener('click', evento => {
    evento.preventDefault();
    const real = hoja.elementId
      ? document.getElementById(hoja.elementId)
      : document.querySelector('.sidebar-menu a[data-view="' + hoja.dataView + '"]');
    if (real) real.click();
  });

  tarjeta.append(icono, titulo, desc, enlace);
  return tarjeta;
}

function renderizarResumenSeccion(clave) {
  const seccion = RESUMEN_SECCIONES[clave];
  const titulo = document.getElementById('resumen-seccion-titulo');
  const tablero = document.getElementById('resumen-seccion-tablero');
  if (!seccion || !titulo || !tablero) return;

  titulo.textContent = seccion.titulo;
  tablero.replaceChildren(...seccion.hojas.map(crearTarjetaResumen));
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.sidebar-menu button.menu-btn[data-resumen]').forEach(boton => {
    boton.addEventListener('click', () => renderizarResumenSeccion(boton.dataset.resumen));
  });
});
