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

function getGuiasCarrusel() {
  const lista = leerAlmacen(CLAVE_CARRUSEL_GUIAS, null);
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
