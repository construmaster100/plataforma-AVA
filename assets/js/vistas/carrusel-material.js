/* ══════════════════════════════════════════
   SGMA-ADSO — 1.3 Material de aprendizaje (Módulo 1, carrusel)

   Cada material está ligado a RA + GA + sección de la guía — la
   colección del carrusel solo trae el material del contexto elegido
   en los selectores de arriba (se recalculan del propio catálogo, sin
   lista fija). 5 tipos de contenido, cada uno con su propio visor:
   video, imagen (con zoom), documento (PDF embebido), iframe_video
   (embed responsive) y presentacion (diapositivas con su propio
   anterior/siguiente, aparte del carrusel principal).

   Depende de:
     · ficha.js             → leerAlmacen, guardarAlmacen
     · carrusel-generico.js → crearCarrusel
     · <body data-rol="…">
══════════════════════════════════════════ */

const CLAVE_CARRUSEL_MATERIAL = 'sgma_carrusel_material';
let carruselMaterialCtrl = null;
let indiceDiapositivaCM = 0;

function getMaterialCarrusel() {
  const lista = leerAlmacen(CLAVE_CARRUSEL_MATERIAL, null);
  return Array.isArray(lista) ? lista : [];
}
function setMaterialCarrusel(lista) { return guardarAlmacen(CLAVE_CARRUSEL_MATERIAL, lista); }

function esInstructorCM() {
  const rol = document.body.dataset.rol || '';
  return rol !== '' && rol !== 'Aprendiz';
}

function filtroActualCM() {
  return {
    ra: (document.getElementById('cm-filtro-ra') || {}).value || '',
    ga: (document.getElementById('cm-filtro-ga') || {}).value || ''
  };
}

function materialFiltradoCM() {
  const { ra, ga } = filtroActualCM();
  return getMaterialCarrusel().filter(m => (!ra || m.ra === ra) && (!ga || m.ga === ga));
}

function poblarFiltrosCM() {
  const catalogo = getMaterialCarrusel();
  const selRA = document.getElementById('cm-filtro-ra');
  const selGA = document.getElementById('cm-filtro-ga');
  if (!selRA || !selGA) return;

  const raPrevio = selRA.value;
  const gaPrevio = selGA.value;
  const ras = [...new Set(catalogo.map(m => m.ra))].sort();
  const gas = [...new Set(catalogo.map(m => m.ga))].sort();

  selRA.innerHTML = '<option value="">Todos los RA</option>' + ras.map(r => '<option value="' + r + '">' + r + '</option>').join('');
  selGA.innerHTML = '<option value="">Todas las GA</option>' + gas.map(g => '<option value="' + g + '">' + g + '</option>').join('');
  if (ras.includes(raPrevio)) selRA.value = raPrevio;
  if (gas.includes(gaPrevio)) selGA.value = gaPrevio;
}

/* ── Visores por tipo de material ── */

function visorVideoCM(item) {
  return '<video controls style="width:100%;max-height:50vh;border-radius:8px;background:#000;">' +
    '<source src="' + item.url + '">Tu navegador no soporta video HTML5.</video>';
}
function alternarZoomImagenCM(img) {
  const ampliada = img.dataset.ampliada === '1';
  img.dataset.ampliada = ampliada ? '0' : '1';
  img.style.maxHeight = ampliada ? '50vh' : '85vh';
  img.style.cursor = ampliada ? 'zoom-in' : 'zoom-out';
}
function visorImagenCM(item) {
  return '<img src="' + item.url + '" alt="' + item.nombre + '" data-ampliada="0" ' +
    'style="max-width:100%;max-height:50vh;border-radius:8px;cursor:zoom-in;display:block;margin:0 auto;transition:max-height .2s ease;" ' +
    'onclick="alternarZoomImagenCM(this)">';
}
function visorDocumentoCM(item) {
  return '<iframe src="' + item.url + '" title="' + item.nombre + '" ' +
    'style="width:100%;height:50vh;border:1px solid #ddd;border-radius:8px;background:#fff;"></iframe>';
}
function visorIframeVideoCM(item) {
  return '<div style="position:relative;padding-bottom:56.25%;height:0;">' +
    '<iframe src="' + item.url + '" title="' + item.nombre + '" allowfullscreen loading="lazy" ' +
    'style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;border-radius:8px;"></iframe></div>';
}
function visorPresentacionCM(item) {
  indiceDiapositivaCM = Math.min(indiceDiapositivaCM, (item.slides || []).length - 1);
  if (indiceDiapositivaCM < 0) indiceDiapositivaCM = 0;
  const slide = (item.slides || [])[indiceDiapositivaCM];
  return '<div class="text-center">' +
    (slide ? '<img src="' + slide + '" alt="Diapositiva ' + (indiceDiapositivaCM + 1) + '" style="max-width:100%;max-height:44vh;border-radius:8px;">' : '<p class="text-muted">Sin diapositivas.</p>') +
    '<div class="d-flex justify-content-center align-items-center gap-2 mt-2">' +
      '<button type="button" class="btn btn-sm btn-action btn-secondary" id="cm-slide-anterior">‹ Diapositiva anterior</button>' +
      '<span class="small">' + (item.slides && item.slides.length ? (indiceDiapositivaCM + 1) + ' / ' + item.slides.length : '0 / 0') + '</span>' +
      '<button type="button" class="btn btn-sm btn-action btn-secondary" id="cm-slide-siguiente">Diapositiva siguiente ›</button>' +
    '</div></div>';
}

const VISORES_CM = {
  video: visorVideoCM,
  imagen: visorImagenCM,
  documento: visorDocumentoCM,
  iframe_video: visorIframeVideoCM,
  presentacion: visorPresentacionCM
};

const ETIQUETA_TIPO_CM = {
  video: '🎬 Video', imagen: '🖼️ Imagen', documento: '📄 Documento',
  iframe_video: '📺 Video embebido', presentacion: '🖥️ Presentación'
};

function limpiarFormularioCM() {
  ['cm-form-ra', 'cm-form-ga', 'cm-form-seccion', 'cm-form-nombre', 'cm-form-url'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  const raInput = document.getElementById('cm-form-ra');
  if (raInput) raInput.dataset.editando = '';
  const check = document.getElementById('cm-form-descargable');
  if (check) check.checked = true;
}

function pintarMaterialActual(item) {
  const visor = document.getElementById('cm-visor');
  const acciones = document.getElementById('cm-acciones');
  if (!visor || !acciones) return;

  indiceDiapositivaCM = 0;

  if (!item) {
    visor.innerHTML = '<p class="text-muted">No hay material para este RA/GA todavía.</p>';
    acciones.innerHTML = '';
    limpiarFormularioCM();
    return;
  }

  const construirVisor = VISORES_CM[item.tipo] || visorDocumentoCM;
  visor.innerHTML =
    '<h3 class="mb-1">' + item.nombre + '</h3>' +
    '<p class="small text-muted mb-2">' + (ETIQUETA_TIPO_CM[item.tipo] || item.tipo) +
      ' · ' + item.ra + ' · ' + item.ga + (item.seccion ? ' · ' + item.seccion : '') + '</p>' +
    construirVisor(item);

  if (item.tipo === 'presentacion') {
    const btnAnt = document.getElementById('cm-slide-anterior');
    const btnSig = document.getElementById('cm-slide-siguiente');
    if (btnAnt) btnAnt.addEventListener('click', () => {
      indiceDiapositivaCM = Math.max(0, indiceDiapositivaCM - 1);
      pintarMaterialActual(item);
    });
    if (btnSig) btnSig.addEventListener('click', () => {
      indiceDiapositivaCM = Math.min((item.slides || []).length - 1, indiceDiapositivaCM + 1);
      pintarMaterialActual(item);
    });
  }

  acciones.innerHTML = item.descargable !== false
    ? '<a class="btn btn-action btn-secondary" href="' + item.url + '" download target="_blank" rel="noopener">⬇ Descargar</a>'
    : '<span class="small text-muted">Descarga no permitida para este material.</span>';

  if (esInstructorCM()) {
    document.getElementById('cm-form-ra').value = item.ra;
    document.getElementById('cm-form-ga').value = item.ga;
    document.getElementById('cm-form-seccion').value = item.seccion || '';
    document.getElementById('cm-form-nombre').value = item.nombre;
    document.getElementById('cm-form-tipo').value = item.tipo;
    document.getElementById('cm-form-url').value = item.url;
    document.getElementById('cm-form-descargable').checked = item.descargable !== false;
    document.getElementById('cm-form-ra').dataset.editando = item.id;
  }
}

function iniciarCarruselMaterial() {
  const contenedor = document.getElementById('carrusel-material-contenedor');
  if (!contenedor) return;

  const bloqueInstructor = document.getElementById('carrusel-material-instructor');
  if (bloqueInstructor) bloqueInstructor.hidden = !esInstructorCM();

  poblarFiltrosCM();

  if (!carruselMaterialCtrl) {
    carruselMaterialCtrl = crearCarrusel({
      contenedorId: 'carrusel-material-contenedor',
      contadorId: 'cm-contador',
      listaId: 'cm-lista',
      btnAnteriorId: 'cm-btn-anterior',
      btnSiguienteId: 'cm-btn-siguiente',
      obtenerItems: materialFiltradoCM,
      renderItem: pintarMaterialActual,
      etiquetaItem: item => (ETIQUETA_TIPO_CM[item.tipo] || item.tipo) + ' — ' + item.nombre
    });

    ['cm-filtro-ra', 'cm-filtro-ga'].forEach(id => {
      const sel = document.getElementById(id);
      if (sel) sel.addEventListener('change', () => carruselMaterialCtrl.ir(0));
    });

    if (esInstructorCM()) {
      const btnGuardar = document.getElementById('cm-btn-guardar');
      const btnEliminar = document.getElementById('cm-btn-eliminar');
      const btnNueva = document.getElementById('cm-btn-nueva');
      const selTipo = document.getElementById('cm-form-tipo');
      const bloqueSlides = document.getElementById('cm-form-slides-grupo');

      if (selTipo && bloqueSlides) {
        selTipo.addEventListener('change', () => { bloqueSlides.hidden = selTipo.value !== 'presentacion'; });
      }

      if (btnGuardar) btnGuardar.addEventListener('click', () => {
        const ra = document.getElementById('cm-form-ra').value.trim();
        const ga = document.getElementById('cm-form-ga').value.trim();
        const seccion = document.getElementById('cm-form-seccion').value.trim();
        const nombre = document.getElementById('cm-form-nombre').value.trim();
        const tipo = document.getElementById('cm-form-tipo').value;
        const url = document.getElementById('cm-form-url').value.trim();
        const descargable = document.getElementById('cm-form-descargable').checked;
        const slidesTexto = (document.getElementById('cm-form-slides') || {}).value || '';
        const aviso = document.getElementById('cm-aviso');
        aviso.hidden = false;

        if (!ra || !ga || !nombre || !tipo || (tipo !== 'presentacion' && !url)) {
          aviso.textContent = 'RA, GA, nombre, tipo y URL son obligatorios (URL no aplica solo si es presentación con diapositivas).';
          aviso.style.color = '#c0392b';
          return;
        }
        const slides = tipo === 'presentacion'
          ? slidesTexto.split('\n').map(l => l.trim()).filter(Boolean)
          : undefined;
        if (tipo === 'presentacion' && (!slides || !slides.length)) {
          aviso.textContent = 'Una presentación necesita al menos una URL de diapositiva.';
          aviso.style.color = '#c0392b';
          return;
        }

        const lista = getMaterialCarrusel();
        const editando = document.getElementById('cm-form-ra').dataset.editando;
        const datos = { ra, ga, seccion, nombre, tipo, url: url || (slides && slides[0]) || '', descargable, slides };
        let indiceDestino = 0;
        if (editando) {
          const idx = lista.findIndex(m => m.id === editando);
          if (idx !== -1) lista[idx] = { ...lista[idx], ...datos };
        } else {
          lista.push({ id: 'm-' + Date.now().toString(36), ...datos, fecha: new Date().toISOString() });
        }
        setMaterialCarrusel(lista);
        aviso.textContent = editando ? 'Material actualizado.' : 'Material cargado y asignado.';
        aviso.style.color = '#278238';
        poblarFiltrosCM();
        const filtrados = materialFiltradoCM();
        indiceDestino = Math.max(0, filtrados.length - 1);
        carruselMaterialCtrl.ir(indiceDestino);
      });

      if (btnEliminar) btnEliminar.addEventListener('click', () => {
        const filtrados = materialFiltradoCM();
        const idx = carruselMaterialCtrl.indiceActual();
        if (!filtrados.length) return;
        const item = filtrados[idx];
        if (!confirm('¿Eliminar "' + item.nombre + '"?')) return;
        const lista = getMaterialCarrusel().filter(m => m.id !== item.id);
        setMaterialCarrusel(lista);
        poblarFiltrosCM();
        carruselMaterialCtrl.ir(Math.max(0, idx - 1));
      });

      if (btnNueva) btnNueva.addEventListener('click', limpiarFormularioCM);
    }
  }

  carruselMaterialCtrl.ir(carruselMaterialCtrl.indiceActual());
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-view="sec-carrusel-material"]').forEach(a =>
    a.addEventListener('click', iniciarCarruselMaterial));
});
