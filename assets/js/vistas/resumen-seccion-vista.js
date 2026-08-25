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
    titulo: '1. Investiga',
    hojas: [
      { titulo: '1.1 Plan curricular', desc: 'Programa de formación — diseño curricular', icono: '📘', dataView: 'sec-programa' },
      { titulo: '1.2 Reporte de asistencias', desc: 'Asiste / No asiste / Tardanza / Excusa', icono: '🗓️', dataView: 'sec-asistencia' },
      { titulo: '1.3 Guías de aprendizaje', desc: 'En curso / Desarrolladas / Pendientes', icono: '📋', dataView: 'sec-guias-gaa' },
      { titulo: '1.4 Material de consulta', desc: 'Videos, lecturas, imágenes, PPTX', icono: '📚', dataView: 'sec-materiales' },
      { titulo: '1.5 Requisitos para la formación', desc: 'Documentos y materiales requeridos', icono: '✅', dataView: 'sec-requisitos' }
    ]
  },
  formacion: {
    titulo: '2. Formación (5 hrs)',
    hojas: [
      { titulo: '2.1 Reportar ingreso', desc: 'Solicitar ingreso, demora o inasistencia', icono: '🔔', dataView: 'sec-reportar-ingreso' },
      { titulo: '2.2 Consultar guías de aprendizaje', desc: 'Listado GA1, GA2, GA3…', icono: '📋', dataView: 'sec-guias-gaa' },
      { titulo: '2.3 Guía en curso', desc: 'La guía que tienes abierta ahora', icono: '📄', dataView: 'sec-guia-en-curso' },
      { titulo: '2.4 Material de aprendizaje', desc: 'Cuestionario, ejemplos y actividad del módulo', icono: '💻', elementId: 'apr-link-material-aprendizaje' }
    ]
  },
  resultados: {
    titulo: '3. Resultados',
    hojas: [
      { titulo: '3.1 Reporte acumulado', desc: 'Asistencia y porcentaje de avance', icono: '📊', dataView: 'sec-reporte-acumulado' },
      { titulo: '3.2 Plan de mejoramiento', desc: 'Estado de tus resultados de aprendizaje', icono: '🛠️', dataView: 'sec-plan-mejoramiento' },
      { titulo: '3.3 Práctica', desc: 'Módulo de mejora y práctica', icono: '⌨️', dataView: 'sec-modulo-mejora' },
      { titulo: 'Evaluación de aprendizaje', desc: 'Tablero de puntajes de desempeño', icono: '⭐', dataView: 'sec-puntajes' }
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
