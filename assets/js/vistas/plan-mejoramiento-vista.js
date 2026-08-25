/* ══════════════════════════════════════════
   SGMA-ADSO — Plan de mejoramiento del aprendiz

   Pinta dos hojas sobre el mismo estado de validaciones:
     · sec-plan-mejoramiento (3.2) — estado de cada módulo formativo
     · sec-modulo-mejora     (3.3) — solo los que quedaron «No aprobado»,
       con acceso directo a repracticar (2.4/English Coding, según el
       curso activo del selector de la cabecera)

   Depende de:
     · embebidos-catalogo.js  → identidadActual(), leerPuntajes()
     · plan-formativo.js      → fichaDeQuienJuega()
     · modulos-formativos.js  → getModulosFormativos, avanceEnModulo, getValidacion
     · ficha.js                → getCursoActivo()
══════════════════════════════════════════ */

function claveDePlanMejoramiento() {
  return typeof identidadActual === 'function' ? identidadActual().clave : 'anonimo';
}

function modulosDeMiFicha() {
  const fichaId = typeof fichaDeQuienJuega === 'function' ? fichaDeQuienJuega() : FICHA_EN_CURSO;
  return getModulosFormativos().filter(m => m.fichaId === fichaId);
}

function marcasDelAprendiz() {
  return typeof leerPuntajes === 'function' ? leerPuntajes() : {};
}

function badgeDeValidacion(validacion) {
  const sello = document.createElement('span');
  const aprobado = validacion && validacion.estado === 'Aprobado';
  const rechazado = validacion && validacion.estado === 'No aprobado';
  sello.className = 'badge status-badge ' +
    (aprobado ? 'status-active' : rechazado ? 'status-inactive' : 'status-closed');
  sello.textContent = aprobado ? 'Aprobado' : rechazado ? 'No aprobado' : 'Sin validar';
  return sello;
}

/* ── 3.2 Plan de mejoramiento ── */

function pintarPlanMejoramiento() {
  const caja = document.getElementById('mejoramiento-lista');
  if (!caja) return;

  const modulos = modulosDeMiFicha();
  const clave = claveDePlanMejoramiento();
  const marcas = marcasDelAprendiz();

  caja.replaceChildren();

  if (!modulos.length) {
    const vacio = document.createElement('p');
    vacio.className = 'bloque-nota';
    vacio.textContent = 'Todavía no hay módulos formativos con un resultado de aprendizaje que validar.';
    caja.appendChild(vacio);
    return;
  }

  modulos.forEach(modulo => {
    const avance = avanceEnModulo(modulo, marcas);
    const validacion = getValidacion(clave, modulo.id);

    const tarjeta = document.createElement('article');
    tarjeta.className = 'card notif-card';

    const cabecera = document.createElement('div');
    cabecera.className = 'mf-cabecera';
    const titulo = document.createElement('h3');
    titulo.className = 'mf-titulo';
    titulo.textContent = modulo.nombre + (modulo.ra ? ' — ' + modulo.ra : '');
    cabecera.appendChild(titulo);
    cabecera.appendChild(badgeDeValidacion(validacion));
    tarjeta.appendChild(cabecera);

    const meta = document.createElement('p');
    meta.className = 'notif-meta';
    meta.textContent = 'Avance de la parte: ' + avance.hechas + '/' + avance.total + ' (' + avance.porcentaje + '%)';
    tarjeta.appendChild(meta);

    if (validacion && validacion.estado === 'No aprobado') {
      const nota = document.createElement('p');
      nota.textContent = validacion.nota
        ? 'Motivo: ' + validacion.nota
        : 'El instructor no dejó un motivo escrito.';
      tarjeta.appendChild(nota);

      const cta = document.createElement('a');
      cta.href = '#';
      cta.className = 'btn btn-action btn-primary';
      cta.setAttribute('data-view', 'sec-modulo-mejora');
      cta.textContent = 'Ir al módulo de mejora →';
      tarjeta.appendChild(cta);
    }

    caja.appendChild(tarjeta);
  });
}

/* ── 3.3 Módulo de mejora y práctica ── */

function pintarModuloMejora() {
  const caja = document.getElementById('modulo-mejora-lista');
  if (!caja) return;

  const clave = claveDePlanMejoramiento();
  const rechazados = modulosDeMiFicha().filter(modulo => {
    const validacion = getValidacion(clave, modulo.id);
    return validacion && validacion.estado === 'No aprobado';
  });

  caja.replaceChildren();

  if (!rechazados.length) {
    const vacio = document.createElement('p');
    vacio.className = 'bloque-nota';
    vacio.textContent = 'No tienes ningún resultado pendiente de repracticar. Buen trabajo.';
    caja.appendChild(vacio);
    return;
  }

  const cursoActivo = typeof getCursoActivo === 'function' ? getCursoActivo() : 'adso';
  const destinoPractica = cursoActivo === 'english' ? 'sec-prueba-modulo' : 'sec-ver-eval';

  rechazados.forEach(modulo => {
    const validacion = getValidacion(clave, modulo.id);

    const tarjeta = document.createElement('article');
    tarjeta.className = 'card notif-card';

    const titulo = document.createElement('h3');
    titulo.textContent = modulo.nombre + (modulo.ra ? ' — ' + modulo.ra : '');
    tarjeta.appendChild(titulo);

    const nota = document.createElement('p');
    nota.className = 'notif-meta';
    nota.textContent = (validacion.nota ? validacion.nota + ' · ' : '') +
      'Intento ' + (validacion.intento || 1);
    tarjeta.appendChild(nota);

    const cta = document.createElement('a');
    cta.href = '#';
    cta.className = 'btn btn-action btn-primary';
    cta.setAttribute('data-view', destinoPractica);
    cta.textContent = 'Volver a practicar →';
    tarjeta.appendChild(cta);

    caja.appendChild(tarjeta);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  if (typeof getModulosFormativos !== 'function') return;

  pintarPlanMejoramiento();
  pintarModuloMejora();
});

window.addEventListener('storage', evento => {
  if (evento.key === 'sgma_validaciones_ra') {
    pintarPlanMejoramiento();
    pintarModuloMejora();
  }
});
