/* ══════════════════════════════════════════
   SGMA-ADSO — 1.1 Guías de aprendizaje (Módulo 1, carrusel)

   Catálogo global en localStorage (mismo patrón de catálogo +
   localStorage que el resto del sitio — ver mejoras.js): el
   instructor carga/edita/elimina, el aprendiz solo consulta,
   visualiza y descarga. Usa el motor genérico de
   assets/js/vistas/carrusel-generico.js.

   Depende de:
     · ficha.js             → leerAlmacen, guardarAlmacen
     · carrusel-generico.js → crearCarrusel
     · <body data-rol="…">  → decide si se muestra el panel de carga
══════════════════════════════════════════ */

const CLAVE_CARRUSEL_GUIAS = 'sgma_carrusel_guias';
let carruselGuiasCtrl = null;

/* Semilla: las 17 guías reales de la ficha 3293836 que antes vivían en
   la tabla estática de sec-guias-gaa (17 filas con enlaces reales a
   PDF), portadas aquí para no perderlas al sustituir esa sección por
   este carrusel. Solo se usa mientras el catálogo esté vacío — en
   cuanto el instructor carga o edita algo, sgma_carrusel_guias manda. */
const GUIAS_SEMILLA_CG = [
  { id: 'gaa-1', ra: 'Inducción', ga: 'GAA 1', nombre: "Inducción de aprendices 2025", url: "../docs/Fichas/ADSO 3293836/0. Diseño curricular técnologo/4.1.Guía Inducción Aprendices 2025 v 1.pdf" },
  { id: 'gaa-2', ra: 'Análisis', ga: 'GAA 2', nombre: "Caracterización de procesos de la empresa", url: "../docs/Fichas/ADSO 3293836/2.Fase Análisis/2. Caracterización de procesos empresa/GFPI-F-135 Caracterización de procesos empresa.pdf" },
  { id: 'gaa-3', ra: 'Análisis', ga: 'GAA 3', nombre: "Recolectar información del software a construir", url: "../docs/Fichas/ADSO 3293836/2.Fase Análisis/3.Recoleciòn de información para definición de requisitos/Guia Recolectar Información del Software a Construir .pdf" },
  { id: 'gaa-4', ra: 'Análisis', ga: 'GAA 4', nombre: "Especificación y validación de requisitos", url: "../docs/Fichas/ADSO 3293836/2.Fase Análisis/4. Especificación y validación de requisitos/Guìa especificaciòn y validaciòn de requisitos .pdf" },
  { id: 'gaa-5', ra: 'Análisis', ga: 'GAA 5', nombre: "TIC Ofimática", url: "../docs/Fichas/ADSO 3293836/2.Fase Análisis/5.TIC Ofimática/Guía TIC Ofimática.pdf" },
  { id: 'gaa-6', ra: 'Análisis', ga: 'GAA 6', nombre: "Desarrollo de procesos lógicos", url: "../docs/Fichas/ADSO 3293836/2.Fase Análisis/GA6. Lógica Programación/Guía Desarrollo Procesos Lógicos.pdf" },
  { id: 'gaa-7', ra: 'Análisis', ga: 'GAA 7', nombre: "Modelado de datos", url: "../docs/Fichas/ADSO 3293836/2.Fase Análisis/GA7. Base Datos - Modelado Datos/Guía Modelado de Datos.pdf" },
  { id: 'gaa-8', ra: 'Análisis', ga: 'GAA 8', nombre: "Validar artefactos de análisis con listas de chequeo", url: "../docs/Fichas/ADSO 3293836/2.Fase Análisis/GA8. Validar Artefactos de Análisis con Listas de Chequeo/Guía Validar Artefactos de Análisis con Listas de Chequeo.pdf" },
  { id: 'gaa-9', ra: 'Análisis', ga: 'GAA 8A', nombre: "Validar propuesta técnica", url: "../docs/Fichas/ADSO 3293836/2.Fase Análisis/GA8A.Guía Validar Propuesta Técnica/Guía Validar Propuesta Técnica.pdf" },
  { id: 'gaa-10', ra: 'Análisis', ga: 'GAA 9', nombre: "Matemáticas", url: "../docs/Fichas/ADSO 3293836/2.Fase Análisis/GA9. Matemáticas/Guía Matemáticas.pdf" },
  { id: 'gaa-11', ra: 'Planeación', ga: 'GAA 10', nombre: "Estructurar el modelo de datos del software", url: "../docs/Fichas/ADSO 3293836/3.Fase Planeación/GA10. Estructurar el modelo de datos del software/Guía estructurar el modelo de datos del software.pdf" },
  { id: 'gaa-12', ra: 'Planeación', ga: 'GAA 11', nombre: "Física", url: "../docs/Fichas/ADSO 3293836/3.Fase Planeación/GA11. Física/Guia física.pdf" },
  { id: 'gaa-13', ra: 'Planeación', ga: 'GAA 12', nombre: "Elaborar los artefactos de diseño del software", url: "../docs/Fichas/ADSO 3293836/3.Fase Planeación/GA12. Elaborar los artefactos de diseño del software/Guía Elaborar los artefactos de diseño del software.pdf" },
  { id: 'gaa-14', ra: 'Construcción', ga: 'GAA 13', nombre: "Construcción del software front-end: HTML, CSS y JavaScript", url: "../docs/Fichas/ADSO 3293836/4. construccion de software/Guía Construcción del Software FrondEnd -HTML CSS JavaScrip.pdf" },
  { id: 'gaa-15', ra: 'Diseño', ga: 'GAA 14', nombre: "Diseño de interfaces gráficas de usuario: stand-alone, web y móviles", url: "../docs/Fichas/ADSO 3293836/5. Diseño interfaces graficas/Guía. Diseño interfaces gráficas usuario aplicaciones stand-alone, web y móviles.pdf" },
  { id: 'gaa-16', ra: 'Diseño', ga: 'GAA 15', nombre: "Verificar los entregables de la fase de diseño del software", url: "../docs/Fichas/ADSO 3293836/6.Diseños de software/Guìa Verificar los entregables de la fase de diseño del software.pdf" },
  { id: 'gaa-17', ra: 'Investigación', ga: 'GAA 16', nombre: "Investigación", url: "../docs/Fichas/ADSO 3293836/7. investigacion/Guìa Investigación.pdf" }
];

function getGuiasCarrusel() {
  const lista = leerAlmacen(CLAVE_CARRUSEL_GUIAS, null);
  if (lista === null) return GUIAS_SEMILLA_CG.slice();
  return Array.isArray(lista) ? lista : [];
}
function setGuiasCarrusel(lista) { return guardarAlmacen(CLAVE_CARRUSEL_GUIAS, lista); }

function esInstructorCG() {
  const rol = document.body.dataset.rol || '';
  return rol !== '' && rol !== 'Aprendiz';
}

function limpiarFormularioCG() {
  ['cg-form-ra', 'cg-form-ga', 'cg-form-nombre', 'cg-form-url'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  const raInput = document.getElementById('cg-form-ra');
  if (raInput) raInput.dataset.editando = '';
}

function pintarGuiaActual(item) {
  const visor = document.getElementById('cg-visor');
  const acciones = document.getElementById('cg-acciones');
  if (!visor || !acciones) return;

  if (!item) {
    visor.innerHTML = '<p class="text-muted">Todavía no hay guías cargadas.</p>';
    acciones.innerHTML = '';
    limpiarFormularioCG();
    return;
  }

  visor.innerHTML =
    '<h3 class="mb-1">' + item.nombre + '</h3>' +
    '<p class="small text-muted mb-2">' + item.ra + ' · ' + item.ga + '</p>' +
    '<iframe src="' + item.url + '" title="' + item.nombre + '" ' +
      'style="width:100%;height:50vh;border:1px solid #ddd;border-radius:8px;background:#fff;"></iframe>';
  acciones.innerHTML =
    '<a class="btn btn-action btn-secondary" href="' + item.url + '" download target="_blank" rel="noopener">⬇ Descargar</a>';

  if (esInstructorCG()) {
    document.getElementById('cg-form-ra').value = item.ra;
    document.getElementById('cg-form-ga').value = item.ga;
    document.getElementById('cg-form-nombre').value = item.nombre;
    document.getElementById('cg-form-url').value = item.url;
    document.getElementById('cg-form-ra').dataset.editando = item.id;
  }
}

function iniciarCarruselGuias() {
  const contenedor = document.getElementById('carrusel-guias-contenedor');
  if (!contenedor) return;

  const bloqueInstructor = document.getElementById('carrusel-guias-instructor');
  if (bloqueInstructor) bloqueInstructor.hidden = !esInstructorCG();

  if (!carruselGuiasCtrl) {
    carruselGuiasCtrl = crearCarrusel({
      contenedorId: 'carrusel-guias-contenedor',
      contadorId: 'cg-contador',
      listaId: 'cg-lista',
      btnAnteriorId: 'cg-btn-anterior',
      btnSiguienteId: 'cg-btn-siguiente',
      obtenerItems: getGuiasCarrusel,
      renderItem: pintarGuiaActual,
      etiquetaItem: item => item.nombre
    });

    if (esInstructorCG()) {
      const btnGuardar = document.getElementById('cg-btn-guardar');
      const btnEliminar = document.getElementById('cg-btn-eliminar');
      const btnNueva = document.getElementById('cg-btn-nueva');

      if (btnGuardar) btnGuardar.addEventListener('click', () => {
        const ra = document.getElementById('cg-form-ra').value.trim();
        const ga = document.getElementById('cg-form-ga').value.trim();
        const nombre = document.getElementById('cg-form-nombre').value.trim();
        const url = document.getElementById('cg-form-url').value.trim();
        const aviso = document.getElementById('cg-aviso');
        aviso.hidden = false;
        if (!ra || !ga || !nombre || !url) {
          aviso.textContent = 'RA, GA, nombre y URL son obligatorios.';
          aviso.style.color = '#c0392b';
          return;
        }

        const lista = getGuiasCarrusel();
        const editando = document.getElementById('cg-form-ra').dataset.editando;
        let indiceDestino = lista.length;
        if (editando) {
          const idx = lista.findIndex(g => g.id === editando);
          if (idx !== -1) { lista[idx] = { ...lista[idx], ra, ga, nombre, url }; indiceDestino = idx; }
        } else {
          lista.push({ id: 'g-' + Date.now().toString(36), ra, ga, nombre, url, fecha: new Date().toISOString() });
          indiceDestino = lista.length - 1;
        }
        setGuiasCarrusel(lista);
        aviso.textContent = editando ? 'Guía actualizada.' : 'Guía cargada y asignada.';
        aviso.style.color = '#278238';
        carruselGuiasCtrl.ir(indiceDestino);
      });

      if (btnEliminar) btnEliminar.addEventListener('click', () => {
        const lista = getGuiasCarrusel();
        const idx = carruselGuiasCtrl.indiceActual();
        if (!lista.length) return;
        if (!confirm('¿Eliminar "' + lista[idx].nombre + '"?')) return;
        lista.splice(idx, 1);
        setGuiasCarrusel(lista);
        carruselGuiasCtrl.ir(Math.max(0, idx - 1));
      });

      if (btnNueva) btnNueva.addEventListener('click', limpiarFormularioCG);
    }
  }

  carruselGuiasCtrl.refrescar();
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-view="sec-carrusel-guias"]').forEach(a =>
    a.addEventListener('click', iniciarCarruselGuias));
});
