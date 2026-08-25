/* ══════════════════════════════════════════
   SGMA-ADSO — Reporte de ejecución y plan de mejora (instructor)

   Pinta:
     · sec-reporte-ejecucion (3.2) — 3.2.1 reporte de sesión por
       aprendiz, y 3.2.2 tabla de puntos/intentos/última fecha por
       módulo formativo
     · sec-plan-mejora-ins   (3.3) — dispara evaluarPlanMejoraAutomatico()
       y lista los casos para revisión humana

   Depende de:
     · ficha.js               → getFichaInstructor
     · sesiones.js            → getSesiones
     · asistencia.js          → getAsistencias
     · embebidos-catalogo.js  → EMBEBIDOS, leerPuntajes
     · modulos-formativos.js  → getModulosFormativos, avanceEnModulo,
                                 getValidacion, validarResultado,
                                 retirarValidacion, rosterConClave,
                                 evaluarPlanMejoraAutomatico
══════════════════════════════════════════ */

function fichaDeEjecucion() {
  return typeof getFichaInstructor === 'function' ? getFichaInstructor() : FICHA_EN_CURSO;
}

/* ── 3.2.1 Reporte de la sesión: asistencia por aprendiz, semana/mes ── */

function contarSesionesEnRango(sesiones, desde) {
  return sesiones.filter(s => s.fecha >= desde).length;
}

function pintarReporteSesionPorAprendiz() {
  const caja = document.getElementById('rep-ejec-sesion');
  if (!caja) return;

  const fichaId = fichaDeEjecucion();
  const roster = rosterConClave(fichaId);
  const sesiones = getSesiones(fichaId);

  const hoy = new Date();
  const inicioSemana = new Date(hoy);
  inicioSemana.setDate(hoy.getDate() - ((hoy.getDay() + 6) % 7));
  const inicioSemanaISO = inicioSemana.toISOString().slice(0, 10);
  const inicioMesISO = hoy.toISOString().slice(0, 7) + '-01';

  const sesionesSemana = contarSesionesEnRango(sesiones, inicioSemanaISO);
  const sesionesMes = contarSesionesEnRango(sesiones, inicioMesISO);

  const tabla = document.createElement('table');
  tabla.className = 'table table-hover align-middle data-table';
  tabla.innerHTML = '<thead><tr><th>Aprendiz</th><th>Esta semana</th><th>Este mes</th></tr></thead>';
  const cuerpo = document.createElement('tbody');

  roster.forEach(alumno => {
    const registros = getAsistencias(alumno.clave);
    const asistidasSemana = registros.filter(r => r.fecha >= inicioSemanaISO && r.estado !== 'No asiste').length;
    const asistidasMes = registros.filter(r => r.fecha >= inicioMesISO && r.estado !== 'No asiste').length;

    const fila = document.createElement('tr');
    [
      alumno.nombre,
      asistidasSemana + ' / ' + sesionesSemana,
      asistidasMes + ' / ' + sesionesMes
    ].forEach(valor => {
      const celda = document.createElement('td');
      celda.textContent = valor;
      fila.appendChild(celda);
    });
    cuerpo.appendChild(fila);
  });

  tabla.appendChild(cuerpo);
  caja.replaceChildren(tabla);
}

/* ── 3.2.2 Tabla de puntos por módulo formativo ── */

function llenarSelectorModuloEjecucion() {
  const selector = document.getElementById('rep-ejec-modulo');
  if (!selector) return;

  const modulos = getModulosFormativos().filter(m => m.fichaId === fichaDeEjecucion());
  selector.replaceChildren();
  modulos.forEach(m => {
    const opcion = document.createElement('option');
    opcion.value = m.id;
    opcion.textContent = m.nombre + (m.ra ? ' — ' + m.ra : '');
    selector.appendChild(opcion);
  });
}

function puntosEnModulo(modulo, marcas) {
  return actividadesDelModulo(modulo)
    .reduce((total, id) => total + ((marcas[id] && marcas[id].mejor) || 0), 0);
}

function pintarTablaEjecucionModulo() {
  const selector = document.getElementById('rep-ejec-modulo');
  const cuerpo = document.getElementById('rep-ejec-tbody');
  if (!selector || !cuerpo) return;

  const modulo = getModulosFormativos().find(m => m.id === selector.value);
  cuerpo.replaceChildren();
  if (!modulo) return;

  const fichaId = fichaDeEjecucion();
  const roster = rosterConClave(fichaId);
  const todosPuntajes = leerPuntajes();

  roster.forEach(alumno => {
    const marcas = todosPuntajes[alumno.clave] || {};
    const avance = avanceEnModulo(modulo, marcas);
    const puntos = puntosEnModulo(modulo, marcas);
    const intentos = intentosEnModulo(modulo, marcas);
    const fechas = actividadesDelModulo(modulo)
      .map(id => marcas[id] && marcas[id].fecha).filter(Boolean).sort();
    const ultima = fechas.length ? fechas[fechas.length - 1] : '';
    const validacion = getValidacion(alumno.clave, modulo.id);

    const fila = document.createElement('tr');
    [
      alumno.nombre,
      avance.detalle['Contenido'].hechas + '/' + avance.detalle['Contenido'].de,
      avance.detalle['Práctica'].hechas + '/' + avance.detalle['Práctica'].de,
      avance.detalle['Evaluación'].hechas + '/' + avance.detalle['Evaluación'].de,
      avance.detalle['Evidencia'].hechas + '/' + avance.detalle['Evidencia'].de,
      String(puntos),
      String(intentos),
      ultima ? new Date(ultima).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }) : '—'
    ].forEach(valor => {
      const celda = document.createElement('td');
      celda.textContent = valor;
      fila.appendChild(celda);
    });

    const celdaEstado = document.createElement('td');
    const aprobado = validacion && validacion.estado === 'Aprobado';
    const rechazado = validacion && validacion.estado === 'No aprobado';
    const sello = document.createElement('span');
    sello.className = 'badge status-badge ' + (aprobado ? 'status-active' : rechazado ? 'status-inactive' : 'status-closed');
    sello.textContent = aprobado ? 'Aprobado' : rechazado ? 'No aprobado' : 'Sin validar';
    if (validacion) sello.title = (validacion.por || '') + ' · intento ' + (validacion.intento || 1);
    celdaEstado.appendChild(sello);
    fila.appendChild(celdaEstado);

    cuerpo.appendChild(fila);
  });
}

/* ── 3.3 Plan de mejora ── */

function pintarPlanMejoraInstructor() {
  const caja = document.getElementById('plan-mejora-ins-lista');
  if (!caja) return;

  const fichaId = fichaDeEjecucion();

  // El disparo automático corre cada vez que se pinta esta hoja: no
  // pisa nada que ya tenga validación, humana o automática.
  evaluarPlanMejoraAutomatico(fichaId);

  const modulos = getModulosFormativos().filter(m => m.fichaId === fichaId);
  const roster = rosterConClave(fichaId);
  const casos = [];

  modulos.forEach(modulo => {
    roster.forEach(alumno => {
      const validacion = getValidacion(alumno.clave, modulo.id);
      if (validacion && validacion.estado === 'No aprobado') {
        casos.push({ alumno: alumno, modulo: modulo, validacion: validacion });
      }
    });
  });

  caja.replaceChildren();

  if (!casos.length) {
    const vacio = document.createElement('p');
    vacio.className = 'bloque-nota';
    vacio.textContent = 'Nadie está en plan de mejora en esta ficha por ahora.';
    caja.appendChild(vacio);
    return;
  }

  casos.forEach(caso => {
    const tarjeta = document.createElement('article');
    tarjeta.className = 'card notif-card';

    const cabecera = document.createElement('div');
    cabecera.className = 'mf-cabecera';
    const titulo = document.createElement('h3');
    titulo.className = 'mf-titulo';
    titulo.textContent = caso.alumno.nombre + ' — ' + caso.modulo.nombre;
    const sello = document.createElement('span');
    sello.className = 'badge status-badge status-inactive';
    sello.textContent = 'No aprobado';
    cabecera.append(titulo, sello);
    tarjeta.appendChild(cabecera);

    const meta = document.createElement('p');
    meta.className = 'notif-meta';
    meta.textContent = 'Marcado por ' + caso.validacion.por + ' · ' + caso.validacion.nota;
    tarjeta.appendChild(meta);

    const acciones = document.createElement('div');
    acciones.className = 'mf-acciones-validacion';

    const aprobar = document.createElement('button');
    aprobar.type = 'button';
    aprobar.className = 'btn btn-sm btn-table btn-success';
    aprobar.textContent = 'Aprobar ahora';
    aprobar.addEventListener('click', () => {
      validarResultado(caso.alumno.clave, caso.modulo.id, quienEditaMF(), 'Aprobado tras revisión del plan de mejora.');
      pintarPlanMejoraInstructor();
    });

    const retirar = document.createElement('button');
    retirar.type = 'button';
    retirar.className = 'btn btn-sm btn-table';
    retirar.textContent = 'Retirar (dejar sin validar)';
    retirar.addEventListener('click', () => {
      retirarValidacion(caso.alumno.clave, caso.modulo.id);
      pintarPlanMejoraInstructor();
    });

    acciones.append(aprobar, retirar);
    tarjeta.appendChild(acciones);
    caja.appendChild(tarjeta);
  });
}

/* ── Alertas de desempeño (RF09): generadas solas, sin fila fija ──
   Mismo criterio ya usado en el plan de mejora automático: baja
   asistencia ponderada (< 50%), bajo avance de módulo (< umbral de
   plan-mejora) o módulo marcado «No aprobado». */

const UMBRAL_ALERTA_ASISTENCIA = 50;

function alertasTempranasFicha(fichaId) {
  const roster = rosterConClave(fichaId);
  const modulos = getModulosFormativos().filter(m => m.fichaId === fichaId);
  const todosPuntajes = typeof leerPuntajes === 'function' ? leerPuntajes() : {};
  const alertas = [];

  roster.forEach(alumno => {
    if (typeof porcentajeAsistencia === 'function') {
      const pct = porcentajeAsistencia(alumno.clave);
      const resumen = typeof resumenAsistencia === 'function' ? resumenAsistencia(alumno.clave) : null;
      if (resumen && resumen.total > 0 && pct < UMBRAL_ALERTA_ASISTENCIA) {
        alertas.push({ alumno, causa: 'Baja asistencia', detalle: pct + '% de asistencia ponderada', nivel: 'Alto' });
      }
    }

    modulos.forEach(modulo => {
      const marcas = todosPuntajes[alumno.clave] || {};
      const avance = avanceEnModulo(modulo, marcas);
      if (avance.porcentaje > 0 && avance.porcentaje < UMBRAL_MEJORA_PORCENTAJE) {
        alertas.push({ alumno, causa: 'Bajo avance', detalle: modulo.nombre + ' — ' + avance.porcentaje + '% completado', nivel: 'Medio' });
      }

      const validacion = getValidacion(alumno.clave, modulo.id);
      if (validacion && validacion.estado === 'No aprobado') {
        alertas.push({ alumno, causa: 'Módulo no aprobado', detalle: modulo.nombre + ' — ' + validacion.nota, nivel: 'Alto' });
      }
    });
  });

  return alertas;
}

function pintarAlertasDesempeno() {
  const cuerpo = document.getElementById('alertas-tbody');
  if (!cuerpo) return;

  const fichaId = fichaDeEjecucion();
  const alertas = alertasTempranasFicha(fichaId);
  cuerpo.replaceChildren();

  if (!alertas.length) {
    const fila = document.createElement('tr');
    const celda = document.createElement('td');
    celda.colSpan = 4;
    celda.style.color = '#999';
    celda.textContent = 'Nadie de la ficha tiene alertas de desempeño por ahora.';
    fila.appendChild(celda);
    cuerpo.appendChild(fila);
    return;
  }

  alertas.forEach(a => {
    const fila = document.createElement('tr');
    fila.className = 'row-alert';
    [a.alumno.nombre, a.causa, a.detalle].forEach(valor => {
      const celda = document.createElement('td');
      celda.textContent = valor;
      fila.appendChild(celda);
    });
    const celdaNivel = document.createElement('td');
    const sello = document.createElement('span');
    sello.className = 'badge status-badge ' + (a.nivel === 'Alto' ? 'status-inactive' : 'status-closed');
    sello.textContent = a.nivel;
    celdaNivel.appendChild(sello);
    fila.appendChild(celdaNivel);
    cuerpo.appendChild(fila);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  if (typeof getModulosFormativos !== 'function') return;

  if (document.getElementById('rep-ejec-sesion')) pintarReporteSesionPorAprendiz();

  const selectorModulo = document.getElementById('rep-ejec-modulo');
  if (selectorModulo) {
    llenarSelectorModuloEjecucion();
    selectorModulo.addEventListener('change', pintarTablaEjecucionModulo);
    pintarTablaEjecucionModulo();
  }

  if (document.getElementById('plan-mejora-ins-lista')) pintarPlanMejoraInstructor();
  if (document.getElementById('alertas-tbody')) pintarAlertasDesempeno();
});

window.addEventListener('storage', evento => {
  if (evento.key === 'sgma_puntajes_embebidos') {
    if (document.getElementById('rep-ejec-tbody')) pintarTablaEjecucionModulo();
    if (document.getElementById('plan-mejora-ins-lista')) pintarPlanMejoraInstructor();
  }
});
