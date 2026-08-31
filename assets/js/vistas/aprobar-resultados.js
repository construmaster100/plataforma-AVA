/* ══════════════════════════════════════════
   SGMA-ADSO — 3.4 Aprobar resultados (instructor)

   La instructora elige un RA y su GA vinculada (mismo catálogo que
   carrusel-evidencias.js, 3.1) y revisa las entregas de todos los
   aprendices para esa evidencia puntual: aprobar o rechazar (con
   comentario). El aprendiz ve ese mismo estado reflejado en su 3.1.

   Solo existe en pages/instructor.html. Depende de:
     · ficha.js               → leerAlmacen, guardarAlmacen
     · carrusel-evidencias.js → getEvidenciasCarrusel, getTodasEntregasEvidencia,
                                 CLAVE_EVIDENCIAS_ENTREGAS
══════════════════════════════════════════ */

function llenarRasAprobar() {
  const selRA = document.getElementById('ar-ra');
  if (!selRA) return;
  const catalogo = getEvidenciasCarrusel();
  const ras = [...new Set(catalogo.map(e => e.ra))].sort();
  const actual = selRA.value;
  selRA.innerHTML = '<option value="">Selecciona un RA…</option>' +
    ras.map(ra => '<option value="' + ra + '">' + ra + '</option>').join('');
  if (ras.includes(actual)) selRA.value = actual;
}

function llenarGasAprobar() {
  const selRA = document.getElementById('ar-ra');
  const selGA = document.getElementById('ar-ga');
  if (!selRA || !selGA) return;
  const ra = selRA.value;
  const catalogo = getEvidenciasCarrusel();
  const gas = [...new Set(catalogo.filter(e => !ra || e.ra === ra).map(e => e.ga))].sort();
  selGA.innerHTML = '<option value="">Todas las GA</option>' +
    gas.map(ga => '<option value="' + ga + '">' + ga + '</option>').join('');
  selGA.disabled = !ra;
}

function pintarPendientesAprobar() {
  const tbody = document.getElementById('ar-tbody');
  const vacio = document.getElementById('ar-vacio');
  const conteo = document.getElementById('ar-conteo');
  if (!tbody) return;

  const ra = document.getElementById('ar-ra').value;
  const ga = document.getElementById('ar-ga').value;

  if (!ra) {
    tbody.innerHTML = '';
    if (vacio) { vacio.hidden = false; vacio.textContent = 'Selecciona un RA para ver las entregas de sus aprendices.'; }
    if (conteo) conteo.textContent = '—';
    return;
  }

  const items = getEvidenciasCarrusel().filter(e => e.ra === ra && (!ga || e.ga === ga));
  const todasEntregas = getTodasEntregasEvidencia();

  const filas = [];
  items.forEach(item => {
    Object.entries(todasEntregas).forEach(([claveAprendiz, entregasDelAprendiz]) => {
      const entrega = entregasDelAprendiz[item.id];
      if (entrega) filas.push({ item, claveAprendiz, entrega });
    });
  });

  if (conteo) conteo.textContent = filas.length + ' entrega(s)';

  if (!filas.length) {
    tbody.innerHTML = '';
    if (vacio) { vacio.hidden = false; vacio.textContent = 'Todavía no hay entregas de aprendices para este RA/GA.'; }
    return;
  }
  if (vacio) vacio.hidden = true;

  tbody.innerHTML = filas.map(({ item, claveAprendiz, entrega }) => `
    <tr>
      <td>${entrega.nombreAprendiz || claveAprendiz}</td>
      <td>${item.ga}</td>
      <td>${item.nombre}</td>
      <td>${entrega.nombreArchivo}</td>
      <td>${new Date(entrega.fecha).toLocaleString()}</td>
      <td>${etiquetaEstadoEvidencia(entrega.estado)}</td>
      <td class="d-flex flex-wrap gap-1">
        <a class="btn btn-sm btn-outline-secondary" href="${entrega.contenido}" download="${entrega.nombreArchivo}">⬇</a>
        <button type="button" class="btn btn-sm btn-success ar-btn-aprobar" data-clave="${claveAprendiz}" data-item="${item.id}">✓ Aprobar</button>
        <button type="button" class="btn btn-sm btn-danger ar-btn-rechazar" data-clave="${claveAprendiz}" data-item="${item.id}">✕ Rechazar</button>
      </td>
    </tr>`).join('');
}

function resolverEntregaAprobar(claveAprendiz, itemId, estado, comentario) {
  const todas = getTodasEntregasEvidencia();
  const entrega = todas[claveAprendiz] && todas[claveAprendiz][itemId];
  if (!entrega) return;
  entrega.estado = estado;
  entrega.comentario = comentario || '';
  guardarAlmacen(CLAVE_EVIDENCIAS_ENTREGAS, todas);
  pintarPendientesAprobar();
}

function iniciarAprobarResultados() {
  if (!document.getElementById('ar-tbody')) return;
  llenarRasAprobar();
  llenarGasAprobar();
  pintarPendientesAprobar();
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-view="sec-aprobar-resultados"]').forEach(a =>
    a.addEventListener('click', iniciarAprobarResultados));

  const selRA = document.getElementById('ar-ra');
  const selGA = document.getElementById('ar-ga');
  const btnActualizar = document.getElementById('ar-refrescar');
  if (selRA) selRA.addEventListener('change', () => { llenarGasAprobar(); pintarPendientesAprobar(); });
  if (selGA) selGA.addEventListener('change', pintarPendientesAprobar);
  if (btnActualizar) btnActualizar.addEventListener('click', () => { llenarRasAprobar(); pintarPendientesAprobar(); });

  const tbody = document.getElementById('ar-tbody');
  if (tbody) tbody.addEventListener('click', e => {
    const btnAprobar = e.target.closest('.ar-btn-aprobar');
    const btnRechazar = e.target.closest('.ar-btn-rechazar');
    if (btnAprobar) resolverEntregaAprobar(btnAprobar.dataset.clave, btnAprobar.dataset.item, 'aprobado', '');
    if (btnRechazar) {
      const comentario = prompt('Comentario para el aprendiz (opcional):') || '';
      resolverEntregaAprobar(btnRechazar.dataset.clave, btnRechazar.dataset.item, 'rechazado', comentario);
    }
  });
});
