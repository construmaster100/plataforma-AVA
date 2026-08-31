/* ══════════════════════════════════════════
   SGMA-ADSO — 3.1 Entrega de evidencias (Módulo 3, carrusel)

   Mismo patrón que carrusel-chequeo.js (catálogo global en localStorage,
   instructor define qué evidencia se pide por RA/GA; el aprendiz la
   entrega como Data URL, límite 4 MB, sin backend). Se le agrega un
   estado de revisión (pendiente/aprobado/rechazado) que la instructora
   cambia desde 3.4 · Aprobar resultados (ver aprobar-resultados.js) —
   el aprendiz ve ese mismo estado reflejado aquí, en su entrega.

   Depende de:
     · ficha.js               → leerAlmacen, guardarAlmacen
     · carrusel-generico.js   → crearCarrusel
     · embebidos-catalogo.js  → identidadActual() (solo en aprendiz.html)
     · <body data-rol="…">
══════════════════════════════════════════ */

const CLAVE_CARRUSEL_EVIDENCIAS = 'sgma_carrusel_evidencias';
const CLAVE_EVIDENCIAS_ENTREGAS = 'sgma_carrusel_evidencias_entregas';
const LIMITE_ENTREGA_EVIDENCIA_BYTES = 4 * 1024 * 1024;
let carruselEvidenciasCtrl = null;

function getEvidenciasCarrusel() {
  const lista = leerAlmacen(CLAVE_CARRUSEL_EVIDENCIAS, null);
  return Array.isArray(lista) ? lista : [];
}
function setEvidenciasCarrusel(lista) { return guardarAlmacen(CLAVE_CARRUSEL_EVIDENCIAS, lista); }

function esInstructorCE() {
  const rol = document.body.dataset.rol || '';
  return rol !== '' && rol !== 'Aprendiz';
}

function claveAprendizCE() {
  return typeof identidadActual === 'function' ? identidadActual().clave : 'anonimo';
}

function getTodasEntregasEvidencia() {
  return leerAlmacen(CLAVE_EVIDENCIAS_ENTREGAS, {});
}

function getEntregaEvidencia(itemId) {
  const todas = getTodasEntregasEvidencia();
  const mias = todas[claveAprendizCE()] || {};
  return mias[itemId] || null;
}

function setEntregaEvidencia(itemId, entrega) {
  const todas = getTodasEntregasEvidencia();
  const clave = claveAprendizCE();
  todas[clave] = todas[clave] || {};
  todas[clave][itemId] = entrega;
  return guardarAlmacen(CLAVE_EVIDENCIAS_ENTREGAS, todas);
}

function etiquetaEstadoEvidencia(estado) {
  if (estado === 'aprobado') return '<span class="badge status-badge status-active">✅ Aprobada</span>';
  if (estado === 'rechazado') return '<span class="badge status-badge status-inactive">❌ Rechazada</span>';
  return '<span class="badge status-badge status-closed">⏳ Pendiente de revisión</span>';
}

function limpiarFormularioCE() {
  ['ce-form-ra', 'ce-form-ga', 'ce-form-nombre', 'ce-form-url'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  const raInput = document.getElementById('ce-form-ra');
  if (raInput) raInput.dataset.editando = '';
}

function pintarEvidenciaActual(item) {
  const visor = document.getElementById('ce-visor');
  const acciones = document.getElementById('ce-acciones');
  if (!visor || !acciones) return;

  if (!item) {
    visor.innerHTML = '<p class="text-muted">Todavía no hay evidencias solicitadas.</p>';
    acciones.innerHTML = '';
    limpiarFormularioCE();
    return;
  }

  visor.innerHTML =
    '<h3 class="mb-1">' + item.nombre + '</h3>' +
    '<p class="small text-muted mb-2">' + item.ra + ' · ' + item.ga + '</p>' +
    (item.url
      ? '<iframe src="' + item.url + '" title="' + item.nombre + '" ' +
        'style="width:100%;height:50vh;border:1px solid #ddd;border-radius:8px;background:#fff;"></iframe>'
      : '<p class="bloque-nota">Esta evidencia no tiene instrucciones adjuntas — entrégala directamente.</p>');

  let accionesHtml = '';

  if (!esInstructorCE()) {
    const entrega = getEntregaEvidencia(item.id);
    accionesHtml +=
      '<div class="col-md-6 mx-auto mt-4">' +
        '<label class="form-label small">Entregar evidencia (máx. 4 MB)</label>' +
        '<div class="input-group">' +
          '<input type="file" class="form-control" id="ce-form-entrega">' +
          '<button type="button" class="btn btn-primary" id="ce-btn-entregar">📤 Entregar</button>' +
        '</div>' +
        '<p class="small mt-2" id="ce-entrega-estado">' +
          (entrega
            ? etiquetaEstadoEvidencia(entrega.estado) + ' — entregada el ' + new Date(entrega.fecha).toLocaleString() + ' (' + entrega.nombreArchivo + ')'
            : 'Todavía no la has entregado.') +
        '</p>' +
        (entrega && entrega.estado === 'rechazado' && entrega.comentario
          ? '<p class="small text-danger mb-0">Comentario de tu instructor: ' + entrega.comentario + '</p>'
          : '') +
      '</div>';
  }
  acciones.innerHTML = '<div class="d-grid gap-2 col-md-6 mx-auto">' + accionesHtml + '</div>';

  if (!esInstructorCE()) {
    const btnEntregar = document.getElementById('ce-btn-entregar');
    if (btnEntregar) btnEntregar.addEventListener('click', () => entregarEvidencia(item.id));
  }

  if (esInstructorCE()) {
    document.getElementById('ce-form-ra').value = item.ra;
    document.getElementById('ce-form-ga').value = item.ga;
    document.getElementById('ce-form-nombre').value = item.nombre;
    document.getElementById('ce-form-url').value = item.url || '';
    document.getElementById('ce-form-ra').dataset.editando = item.id;
  }
}

function entregarEvidencia(itemId) {
  const input = document.getElementById('ce-form-entrega');
  const estadoTxt = document.getElementById('ce-entrega-estado');
  const archivo = input && input.files[0];
  if (!archivo) { if (estadoTxt) estadoTxt.textContent = 'Elige un archivo primero.'; return; }
  if (archivo.size > LIMITE_ENTREGA_EVIDENCIA_BYTES) {
    if (estadoTxt) estadoTxt.textContent = 'El archivo pesa más de 4 MB — elige uno más liviano.';
    return;
  }
  const lector = new FileReader();
  lector.onload = () => {
    const identidad = typeof identidadActual === 'function' ? identidadActual() : { nombre: 'Sin identificar' };
    setEntregaEvidencia(itemId, {
      nombreArchivo: archivo.name,
      nombreAprendiz: identidad.nombre,
      contenido: lector.result,
      fecha: new Date().toISOString(),
      estado: 'pendiente',
      comentario: ''
    });
    if (estadoTxt) estadoTxt.innerHTML = etiquetaEstadoEvidencia('pendiente') + ' — entregada el ' + new Date().toLocaleString() + ' (' + archivo.name + ')';
  };
  lector.onerror = () => { if (estadoTxt) estadoTxt.textContent = 'No se pudo leer el archivo.'; };
  lector.readAsDataURL(archivo);
}

function iniciarCarruselEvidencias() {
  const contenedor = document.getElementById('carrusel-evidencias-contenedor');
  if (!contenedor) return;

  const bloqueInstructor = document.getElementById('carrusel-evidencias-instructor');
  if (bloqueInstructor) bloqueInstructor.hidden = !esInstructorCE();

  if (!carruselEvidenciasCtrl) {
    carruselEvidenciasCtrl = crearCarrusel({
      contenedorId: 'carrusel-evidencias-contenedor',
      contadorId: 'ce-contador',
      listaId: 'ce-lista',
      btnAnteriorId: 'ce-btn-anterior',
      btnSiguienteId: 'ce-btn-siguiente',
      obtenerItems: getEvidenciasCarrusel,
      renderItem: pintarEvidenciaActual,
      etiquetaItem: item => item.nombre
    });

    if (esInstructorCE()) {
      const btnGuardar = document.getElementById('ce-btn-guardar');
      const btnEliminar = document.getElementById('ce-btn-eliminar');
      const btnNueva = document.getElementById('ce-btn-nueva');

      if (btnGuardar) btnGuardar.addEventListener('click', () => {
        const ra = document.getElementById('ce-form-ra').value.trim();
        const ga = document.getElementById('ce-form-ga').value.trim();
        const nombre = document.getElementById('ce-form-nombre').value.trim();
        const url = document.getElementById('ce-form-url').value.trim();
        const aviso = document.getElementById('ce-aviso');
        aviso.hidden = false;
        if (!ra || !ga || !nombre) {
          aviso.textContent = 'RA, GA y nombre son obligatorios.';
          aviso.style.color = '#c0392b';
          return;
        }

        const lista = getEvidenciasCarrusel();
        const editando = document.getElementById('ce-form-ra').dataset.editando;
        let indiceDestino = lista.length;
        if (editando) {
          const idx = lista.findIndex(c => c.id === editando);
          if (idx !== -1) { lista[idx] = { ...lista[idx], ra, ga, nombre, url }; indiceDestino = idx; }
        } else {
          lista.push({ id: 'e-' + Date.now().toString(36), ra, ga, nombre, url, fecha: new Date().toISOString() });
          indiceDestino = lista.length - 1;
        }
        setEvidenciasCarrusel(lista);
        aviso.textContent = editando ? 'Evidencia actualizada.' : 'Evidencia solicitada y publicada.';
        aviso.style.color = '#278238';
        carruselEvidenciasCtrl.ir(indiceDestino);
      });

      if (btnEliminar) btnEliminar.addEventListener('click', () => {
        const lista = getEvidenciasCarrusel();
        const idx = carruselEvidenciasCtrl.indiceActual();
        if (!lista.length) return;
        if (!confirm('¿Eliminar "' + lista[idx].nombre + '"?')) return;
        lista.splice(idx, 1);
        setEvidenciasCarrusel(lista);
        carruselEvidenciasCtrl.ir(Math.max(0, idx - 1));
      });

      if (btnNueva) btnNueva.addEventListener('click', limpiarFormularioCE);
    }
  }

  carruselEvidenciasCtrl.refrescar();
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-view="sec-carrusel-evidencias"]').forEach(a =>
    a.addEventListener('click', iniciarCarruselEvidencias));
});
