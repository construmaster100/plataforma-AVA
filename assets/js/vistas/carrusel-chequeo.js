/* ══════════════════════════════════════════
   SGMA-ADSO — 1.2 Listas de chequeo (Módulo 1, carrusel)

   Mismo patrón que carrusel-guias.js (catálogo global en localStorage,
   instructor carga/edita/elimina). A diferencia de las guías, el
   aprendiz además puede "cargar lista diligenciada": el archivo se lee
   como Data URL y se guarda por aprendiz + item, sin backend — límite
   de 4 MB para no saturar localStorage.

   Depende de:
     · ficha.js               → leerAlmacen, guardarAlmacen
     · carrusel-generico.js   → crearCarrusel
     · embebidos-catalogo.js  → identidadActual() (solo en aprendiz.html)
     · <body data-rol="…">
══════════════════════════════════════════ */

const CLAVE_CARRUSEL_CHEQUEO = 'sgma_carrusel_chequeo';
const CLAVE_CHEQUEO_ENTREGAS = 'sgma_carrusel_chequeo_entregas';
const LIMITE_ENTREGA_CHEQUEO_BYTES = 4 * 1024 * 1024;
let carruselChequeoCtrl = null;

function getChequeoCarrusel() {
  const lista = leerAlmacen(CLAVE_CARRUSEL_CHEQUEO, null);
  return Array.isArray(lista) ? lista : [];
}
function setChequeoCarrusel(lista) { return guardarAlmacen(CLAVE_CARRUSEL_CHEQUEO, lista); }

function esInstructorCC() {
  const rol = document.body.dataset.rol || '';
  return rol !== '' && rol !== 'Aprendiz';
}

function claveAprendizCC() {
  return typeof identidadActual === 'function' ? identidadActual().clave : 'anonimo';
}

function getEntregaChequeo(itemId) {
  const todas = leerAlmacen(CLAVE_CHEQUEO_ENTREGAS, {});
  const mias = todas[claveAprendizCC()] || {};
  return mias[itemId] || null;
}

function setEntregaChequeo(itemId, entrega) {
  const todas = leerAlmacen(CLAVE_CHEQUEO_ENTREGAS, {});
  const clave = claveAprendizCC();
  todas[clave] = todas[clave] || {};
  todas[clave][itemId] = entrega;
  return guardarAlmacen(CLAVE_CHEQUEO_ENTREGAS, todas);
}

function limpiarFormularioCC() {
  ['cc-form-ra', 'cc-form-ga', 'cc-form-nombre', 'cc-form-url'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  const raInput = document.getElementById('cc-form-ra');
  if (raInput) raInput.dataset.editando = '';
}

function pintarChequeoActual(item) {
  const visor = document.getElementById('cc-visor');
  const acciones = document.getElementById('cc-acciones');
  if (!visor || !acciones) return;

  if (!item) {
    visor.innerHTML = '<p class="text-muted">Todavía no hay listas de chequeo cargadas.</p>';
    acciones.innerHTML = '';
    limpiarFormularioCC();
    return;
  }

  visor.innerHTML =
    '<h3 class="mb-1">' + item.nombre + '</h3>' +
    '<p class="small text-muted mb-2">' + item.ra + ' · ' + item.ga + '</p>' +
    '<iframe src="' + item.url + '" title="' + item.nombre + '" ' +
      'style="width:100%;height:45vh;border:1px solid #ddd;border-radius:8px;background:#fff;"></iframe>';

  let accionesHtml = '<a class="btn btn-action btn-secondary" href="' + item.url + '" download target="_blank" rel="noopener">⬇ Descargar</a>';

  if (!esInstructorCC()) {
    const entrega = getEntregaChequeo(item.id);
    accionesHtml +=
      '<div class="mt-3">' +
        '<label class="form-label small">Cargar lista diligenciada (máx. 4 MB)</label>' +
        '<input type="file" class="form-control form-control-sm" id="cc-form-entrega" style="max-width:320px;">' +
        '<button type="button" class="btn btn-sm btn-action btn-primary mt-2" id="cc-btn-entregar">📤 Entregar</button>' +
        '<p class="small text-muted mt-1" id="cc-entrega-estado">' +
          (entrega ? 'Entregada el ' + new Date(entrega.fecha).toLocaleString() + ' (' + entrega.nombreArchivo + ')' : 'Todavía no la has entregado.') +
        '</p>' +
      '</div>';
  }
  acciones.innerHTML = accionesHtml;

  if (!esInstructorCC()) {
    const btnEntregar = document.getElementById('cc-btn-entregar');
    if (btnEntregar) btnEntregar.addEventListener('click', () => entregarListaChequeo(item.id));
  }

  if (esInstructorCC()) {
    document.getElementById('cc-form-ra').value = item.ra;
    document.getElementById('cc-form-ga').value = item.ga;
    document.getElementById('cc-form-nombre').value = item.nombre;
    document.getElementById('cc-form-url').value = item.url;
    document.getElementById('cc-form-ra').dataset.editando = item.id;
  }
}

function entregarListaChequeo(itemId) {
  const input = document.getElementById('cc-form-entrega');
  const estado = document.getElementById('cc-entrega-estado');
  const archivo = input && input.files[0];
  if (!archivo) { if (estado) estado.textContent = 'Elige un archivo primero.'; return; }
  if (archivo.size > LIMITE_ENTREGA_CHEQUEO_BYTES) {
    if (estado) estado.textContent = 'El archivo pesa más de 4 MB — elige uno más liviano.';
    return;
  }
  const lector = new FileReader();
  lector.onload = () => {
    setEntregaChequeo(itemId, {
      nombreArchivo: archivo.name,
      contenido: lector.result,
      fecha: new Date().toISOString()
    });
    if (estado) estado.textContent = 'Entregada el ' + new Date().toLocaleString() + ' (' + archivo.name + ')';
  };
  lector.onerror = () => { if (estado) estado.textContent = 'No se pudo leer el archivo.'; };
  lector.readAsDataURL(archivo);
}

function iniciarCarruselChequeo() {
  const contenedor = document.getElementById('carrusel-chequeo-contenedor');
  if (!contenedor) return;

  const bloqueInstructor = document.getElementById('carrusel-chequeo-instructor');
  if (bloqueInstructor) bloqueInstructor.hidden = !esInstructorCC();

  if (!carruselChequeoCtrl) {
    carruselChequeoCtrl = crearCarrusel({
      contenedorId: 'carrusel-chequeo-contenedor',
      contadorId: 'cc-contador',
      listaId: 'cc-lista',
      btnAnteriorId: 'cc-btn-anterior',
      btnSiguienteId: 'cc-btn-siguiente',
      obtenerItems: getChequeoCarrusel,
      renderItem: pintarChequeoActual,
      etiquetaItem: item => item.nombre
    });

    if (esInstructorCC()) {
      const btnGuardar = document.getElementById('cc-btn-guardar');
      const btnEliminar = document.getElementById('cc-btn-eliminar');
      const btnNueva = document.getElementById('cc-btn-nueva');

      if (btnGuardar) btnGuardar.addEventListener('click', () => {
        const ra = document.getElementById('cc-form-ra').value.trim();
        const ga = document.getElementById('cc-form-ga').value.trim();
        const nombre = document.getElementById('cc-form-nombre').value.trim();
        const url = document.getElementById('cc-form-url').value.trim();
        const aviso = document.getElementById('cc-aviso');
        aviso.hidden = false;
        if (!ra || !ga || !nombre || !url) {
          aviso.textContent = 'RA, GA, nombre y URL son obligatorios.';
          aviso.style.color = '#c0392b';
          return;
        }

        const lista = getChequeoCarrusel();
        const editando = document.getElementById('cc-form-ra').dataset.editando;
        let indiceDestino = lista.length;
        if (editando) {
          const idx = lista.findIndex(c => c.id === editando);
          if (idx !== -1) { lista[idx] = { ...lista[idx], ra, ga, nombre, url }; indiceDestino = idx; }
        } else {
          lista.push({ id: 'c-' + Date.now().toString(36), ra, ga, nombre, url, fecha: new Date().toISOString() });
          indiceDestino = lista.length - 1;
        }
        setChequeoCarrusel(lista);
        aviso.textContent = editando ? 'Lista actualizada.' : 'Lista cargada y asignada.';
        aviso.style.color = '#278238';
        carruselChequeoCtrl.ir(indiceDestino);
      });

      if (btnEliminar) btnEliminar.addEventListener('click', () => {
        const lista = getChequeoCarrusel();
        const idx = carruselChequeoCtrl.indiceActual();
        if (!lista.length) return;
        if (!confirm('¿Eliminar "' + lista[idx].nombre + '"?')) return;
        lista.splice(idx, 1);
        setChequeoCarrusel(lista);
        carruselChequeoCtrl.ir(Math.max(0, idx - 1));
      });

      if (btnNueva) btnNueva.addEventListener('click', limpiarFormularioCC);
    }
  }

  carruselChequeoCtrl.refrescar();
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-view="sec-carrusel-chequeo"]').forEach(a =>
    a.addEventListener('click', iniciarCarruselChequeo));
});
