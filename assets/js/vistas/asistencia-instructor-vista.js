/* ══════════════════════════════════════════
   SGMA-ADSO — Vista de asistencia del instructor

   Agrega, sobre el roster de la ficha, el mismo estado que ya
   usa el autorreporte del aprendiz (asistencia.js). El instructor
   también puede marcar asistencia por cualquier aprendiz de su
   ficha — registrarAsistencia() no está atada a "quien soy yo".

   Pinta:
     · sec-asistencia-ins      (1.2) — listado de aprendices + reporte agregado
       + calendario individual de asistencia (verde/rojo/azul)
     · sec-asistencia-sesion   (2.2) — roster + marcar + estado de sesión
     · sec-reporte-asistencias (3.1) — diario/semanal/mensual/inasistencias/individual
     · sec-fichas              (1.x) — tablero de tarjetas de asistencia ponderada,
       una por ficha del instructor, con detalle individual al hacer clic

   Depende de:
     · ficha.js                → getFichaInstructor, FICHAS_SISTEMA, getAsignaciones
     · asistencia.js           → getAsistencias, registrarAsistencia, resumenAsistencia,
                                  resumenPonderadoFicha
     · sesiones.js             → sesionActiva
     · modulos-formativos.js   → rosterConClave(fichaId)
     · instructor-identidad.js → instructorActual()
     · tiempo.js               → MESES, DIAS (rótulos del calendario)
══════════════════════════════════════════ */

const ROTULO_TIPO_INS = { ingreso: 'Ingreso', demora: 'Demora', inasistencia: 'Inasistencia' };

function fichaDeAsistenciaIns() {
  return typeof getFichaInstructor === 'function' ? getFichaInstructor() : FICHA_EN_CURSO;
}

function tarjetaMetrica(icono, valor, rotulo) {
  const tarjeta = document.createElement('div');
  tarjeta.className = 'metric-card';
  const ic = document.createElement('div');
  ic.className = 'metric-icon chip-verde';
  ic.textContent = icono;
  const val = document.createElement('div');
  val.className = 'metric-value';
  val.textContent = String(valor);
  const rot = document.createElement('div');
  rot.className = 'metric-label';
  rot.textContent = rotulo;
  tarjeta.append(ic, val, rot);
  return tarjeta;
}

/* ── 1.2 Listado y reporte de asistencias ──

   El selector de ficha real es el de la cabecera (#ins-ficha-activa,
   ya wireado en sofia_plus.js). Aquí no se duplica un segundo
   selector — se lee getFichaInstructor() y se muestra como dato,
   para no tener dos «fichas activas» compitiendo por la misma
   decisión. */

function pintarFichaInfoLYA() {
  const caja = document.getElementById('lya-ficha-info');
  if (!caja) return;

  const fichaId = fichaDeAsistenciaIns();
  const ficha = typeof FICHAS_SISTEMA === 'object' ? FICHAS_SISTEMA[fichaId] : null;
  const roster = rosterConClave(fichaId);

  caja.replaceChildren();
  const titulo = document.createElement('h3');
  titulo.textContent = 'Ficha ' + fichaId + (ficha ? ' — ' + ficha.programa : '');
  caja.appendChild(titulo);

  const meta = document.createElement('p');
  meta.className = 'notif-meta';
  meta.textContent = (ficha ? ficha.modalidad + ' · ' + ficha.jornada + ' · ' : '') +
    roster.length + ' aprendices en la ficha';
  caja.appendChild(meta);
}

function pintarSesionValidacionesLYA() {
  const caja = document.getElementById('lya-sesion-validaciones');
  if (!caja) return;

  const activa = sesionActiva(fichaDeAsistenciaIns());
  caja.replaceChildren();

  [
    ['Validar asistencia de aprendiz', activa ? 'Sesión en curso desde ' + new Date(activa.iniciada).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : 'Sin sesión en curso todavía'],
    ['Validar conexión a internet', navigator.onLine ? 'En línea' : 'Sin conexión']
  ].forEach(([rotulo, valor]) => {
    const fila = document.createElement('p');
    fila.className = 'dato-fila';
    const clave = document.createElement('span');
    clave.className = 'dato-clave';
    clave.textContent = rotulo;
    const dato = document.createElement('span');
    dato.textContent = valor;
    fila.append(clave, dato);
    caja.appendChild(fila);
  });
}

function pintarPorcentajesLYA() {
  const caja = document.getElementById('lya-porcentajes');
  if (!caja) return;

  const roster = rosterConClave(fichaDeAsistenciaIns());
  const hoy = new Date().toISOString().slice(0, 10);

  const conReporteHoy = roster.filter(a => getAsistencias(a.clave).some(r => r.fecha === hoy && r.estado === 'Asiste')).length;
  const pctSesion = roster.length ? Math.round(conReporteHoy * 100 / roster.length) : 0;

  let asisteTotal = 0, reportadoTotal = 0;
  roster.forEach(a => {
    const r = resumenAsistencia(a.clave);
    asisteTotal += r.asiste;
    reportadoTotal += r.total;
  });
  const pctTotal = reportadoTotal ? Math.round(asisteTotal * 100 / reportadoTotal) : 0;

  caja.replaceChildren(
    tarjetaMetrica('👥', roster.length, 'Aprendices — número total'),
    tarjetaMetrica('📅', pctSesion + '%', 'Porcentaje de asistencia — sesión de hoy'),
    tarjetaMetrica('📊', pctTotal + '%', 'Porcentaje de asistencia — total')
  );
}

function pintarListadoAsistenciasLYA() {
  const cuerpo = document.getElementById('lya-tbody');
  const selector = document.getElementById('lya-seleccionar-aprendiz');
  if (!cuerpo || !selector) return;

  const roster = rosterConClave(fichaDeAsistenciaIns());
  const seleccionPrevia = selector.value;

  cuerpo.replaceChildren();
  selector.replaceChildren();
  const vacia = document.createElement('option');
  vacia.value = '';
  vacia.textContent = 'Seleccionar aprendiz…';
  selector.appendChild(vacia);

  roster.forEach(alumno => {
    const resumen = resumenAsistencia(alumno.clave);
    const pct = resumen.total ? Math.round(resumen.asiste * 100 / resumen.total) : 0;

    const fila = document.createElement('tr');
    [alumno.nombre, pct + '%', String(resumen.total)].forEach(valor => {
      const celda = document.createElement('td');
      celda.textContent = valor;
      fila.appendChild(celda);
    });
    cuerpo.appendChild(fila);

    const opcion = document.createElement('option');
    opcion.value = alumno.clave;
    opcion.textContent = alumno.nombre;
    selector.appendChild(opcion);
  });

  if (roster.some(a => a.clave === seleccionPrevia)) selector.value = seleccionPrevia;
}

/* ── Calendario mensual individual de asistencia (verde/rojo/azul) ── */

let lyaClaveActual = '';
let lyaAnioVista = new Date().getFullYear();
let lyaMesVista = new Date().getMonth();

function colorDeEstadoLYA(estado) {
  if (estado === 'Asiste') return 'cal-asis-verde';
  if (estado === 'Tardanza') return 'cal-asis-azul';
  return 'cal-asis-rojo'; // No asiste y Excusa comparten el rojo del boceto
}

function pintarCalendarioAsistenciaLYA() {
  const contenedor = document.getElementById('lya-calendario');
  const titulo = document.getElementById('lya-cal-titulo');
  const caja = document.getElementById('lya-individual');
  if (!contenedor || !caja) return;

  if (!lyaClaveActual) { caja.hidden = true; return; }
  caja.hidden = false;

  if (titulo) {
    titulo.textContent = MESES[lyaMesVista].charAt(0).toUpperCase() + MESES[lyaMesVista].slice(1) + ' ' + lyaAnioVista;
  }

  const registros = getAsistencias(lyaClaveActual);
  const porFecha = {};
  registros.forEach(r => { porFecha[r.fecha] = r; });

  contenedor.replaceChildren();
  DIAS.forEach(dia => {
    const celda = document.createElement('div');
    celda.className = 'cal-dia-nombre';
    celda.textContent = dia;
    contenedor.appendChild(celda);
  });

  const primero = new Date(lyaAnioVista, lyaMesVista, 1);
  const desplazamiento = (primero.getDay() + 6) % 7;
  const diasDelMes = new Date(lyaAnioVista, lyaMesVista + 1, 0).getDate();
  const hoy = new Date();

  for (let i = 0; i < desplazamiento; i++) {
    const vacia = document.createElement('div');
    vacia.className = 'cal-celda cal-vacia';
    contenedor.appendChild(vacia);
  }

  for (let dia = 1; dia <= diasDelMes; dia++) {
    const iso = [lyaAnioVista, String(lyaMesVista + 1).padStart(2, '0'), String(dia).padStart(2, '0')].join('-');
    const registro = porFecha[iso];

    const celda = document.createElement('div');
    celda.className = 'cal-celda' + (registro ? ' ' + colorDeEstadoLYA(registro.estado) : '');
    if (lyaAnioVista === hoy.getFullYear() && lyaMesVista === hoy.getMonth() && dia === hoy.getDate()) {
      celda.classList.add('cal-hoy');
    }
    if (registro) celda.title = registro.estado + (registro.motivo ? ' — ' + registro.motivo : '');

    const numero = document.createElement('span');
    numero.className = 'cal-numero';
    numero.textContent = String(dia);
    celda.appendChild(numero);

    contenedor.appendChild(celda);
  }
}

function iniciarSelectorIndividualLYA() {
  const selector = document.getElementById('lya-seleccionar-aprendiz');
  const antes = document.getElementById('lya-cal-antes');
  const despues = document.getElementById('lya-cal-despues');
  if (!selector) return;

  selector.addEventListener('change', () => {
    lyaClaveActual = selector.value;
    lyaAnioVista = new Date().getFullYear();
    lyaMesVista = new Date().getMonth();
    pintarCalendarioAsistenciaLYA();
  });

  if (antes) antes.addEventListener('click', () => {
    lyaMesVista--;
    if (lyaMesVista < 0) { lyaMesVista = 11; lyaAnioVista--; }
    pintarCalendarioAsistenciaLYA();
  });
  if (despues) despues.addEventListener('click', () => {
    lyaMesVista++;
    if (lyaMesVista > 11) { lyaMesVista = 0; lyaAnioVista++; }
    pintarCalendarioAsistenciaLYA();
  });
}

function pintarListadoYReporteAsistenciasLYA() {
  pintarFichaInfoLYA();
  pintarSesionValidacionesLYA();
  pintarPorcentajesLYA();
  pintarListadoAsistenciasLYA();
}

/* ── Tablero de asistencia ponderada, una tarjeta por ficha del instructor ── */

function fichasDelInstructor() {
  const instructor = typeof instructorActual === 'function' ? instructorActual() : null;
  if (!instructor || typeof getAsignaciones !== 'function') return [];
  return getAsignaciones().filter(a => String(a.documento) === String(instructor.documento));
}

function pintarTableroAsistenciaFichas() {
  const tablero = document.getElementById('ins-tablero-asistencia');
  if (!tablero || typeof resumenPonderadoFicha !== 'function') return;

  const fichas = fichasDelInstructor();
  tablero.replaceChildren();

  if (!fichas.length) {
    const vacio = document.createElement('p');
    vacio.className = 'bloque-nota';
    vacio.textContent = 'Este instructor no tiene fichas asignadas todavía.';
    tablero.appendChild(vacio);
    return;
  }

  fichas.forEach(asignacion => {
    const resumen = resumenPonderadoFicha(asignacion.fichaId);
    const ficha = typeof FICHAS_SISTEMA === 'object' ? FICHAS_SISTEMA[asignacion.fichaId] : null;

    const tarjeta = document.createElement('div');
    tarjeta.className = 'tarjeta tarjeta-estatica metric-card';
    tarjeta.style.cursor = 'pointer';

    const titulo = document.createElement('h3');
    titulo.textContent = 'Ficha ' + asignacion.fichaId + (ficha ? ' — ' + ficha.programa : '');
    const asistentes = document.createElement('p');
    asistentes.className = 'metric-value';
    const conAlMenosUnReporte = resumen.aprendices.filter(a => a.resumen.total > 0).length;
    asistentes.textContent = conAlMenosUnReporte + '/' + resumen.total;
    const rotuloAsistentes = document.createElement('p');
    rotuloAsistentes.className = 'metric-label';
    rotuloAsistentes.textContent = 'Aprendices con reporte';
    const pct = document.createElement('p');
    pct.className = 'metric-value';
    pct.textContent = resumen.porcentajeFicha + '%';
    const rotuloPct = document.createElement('p');
    rotuloPct.className = 'metric-label';
    rotuloPct.textContent = '% de asistencia ponderado';

    tarjeta.append(titulo, asistentes, rotuloAsistentes, pct, rotuloPct);
    tarjeta.addEventListener('click', () => pintarDetalleAsistenciaFicha(asignacion.fichaId));
    tablero.appendChild(tarjeta);
  });
}

function pintarDetalleAsistenciaFicha(fichaId) {
  const caja = document.getElementById('ins-detalle-asistencia');
  const titulo = document.getElementById('ins-detalle-titulo');
  const cuerpo = document.getElementById('ins-detalle-tbody');
  if (!caja || !cuerpo || typeof resumenPonderadoFicha !== 'function') return;

  const resumen = resumenPonderadoFicha(fichaId);
  if (titulo) titulo.textContent = 'Detalle individual — Ficha ' + fichaId;

  cuerpo.replaceChildren();
  resumen.aprendices.forEach(a => {
    const fila = document.createElement('tr');
    [a.nombre, a.resumen.asiste, a.resumen.tardanza, a.resumen.excusa, a.resumen.noAsiste,
      a.promedio.toFixed(2), a.porcentaje + '%'].forEach(valor => {
      const celda = document.createElement('td');
      celda.textContent = String(valor);
      fila.appendChild(celda);
    });
    cuerpo.appendChild(fila);
  });

  caja.hidden = false;
  caja.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ── 2.2 Asistencia de la sesión activa ── */

function pintarEstadoSesionAsistencia() {
  const caja = document.getElementById('asis-sesion-estado');
  if (!caja) return;

  const instructor = typeof instructorActual === 'function' ? instructorActual() : null;
  caja.replaceChildren();

  [
    ['Conexión', navigator.onLine ? 'En línea' : 'Sin conexión'],
    ['Autenticación', instructor ? instructor.nombre + ' verificado' : 'Sin identificar']
  ].forEach(([rotulo, valor]) => {
    const fila = document.createElement('p');
    fila.className = 'dato-fila';
    const clave = document.createElement('span');
    clave.className = 'dato-clave';
    clave.textContent = rotulo;
    const dato = document.createElement('span');
    dato.textContent = valor;
    fila.append(clave, dato);
    caja.appendChild(fila);
  });
}

function pintarAsistenciaSesion() {
  const cuerpo = document.getElementById('asis-sesion-tbody');
  if (!cuerpo) return;

  const fichaId = fichaDeAsistenciaIns();
  const roster = rosterConClave(fichaId);
  const hoy = new Date().toISOString().slice(0, 10);

  cuerpo.replaceChildren();
  roster.forEach(alumno => {
    const registro = getAsistencias(alumno.clave).find(r => r.fecha === hoy);

    const fila = document.createElement('tr');
    const celdaNombre = document.createElement('td');
    celdaNombre.textContent = alumno.nombre;

    const celdaEstado = document.createElement('td');
    if (registro) {
      const sello = document.createElement('span');
      sello.className = 'badge status-badge ' +
        (registro.estado === 'Asiste' ? 'status-active' : registro.estado === 'No asiste' ? 'status-inactive' : 'status-closed');
      sello.textContent = registro.estado;
      celdaEstado.appendChild(sello);
    } else {
      celdaEstado.textContent = 'Sin reportar';
      celdaEstado.style.color = '#999';
    }

    const celdaAcciones = document.createElement('td');
    [['ingreso', 'Asiste'], ['demora', 'Demora'], ['inasistencia', 'Inasistencia']].forEach(([tipo, etiqueta]) => {
      const boton = document.createElement('button');
      boton.type = 'button';
      boton.className = 'btn btn-sm btn-table';
      boton.textContent = etiqueta;
      boton.addEventListener('click', () => {
        registrarAsistencia(alumno.clave, alumno.nombre, tipo, '');
        pintarAsistenciaSesion();
        pintarListadoYReporteAsistenciasLYA();
        pintarReporteAsistencias(modoAsistenciaActivo);
      });
      celdaAcciones.appendChild(boton);
    });

    fila.append(celdaNombre, celdaEstado, celdaAcciones);
    cuerpo.appendChild(fila);
  });
}

/* ── 3.1 Reporte de asistencias ── */

let modoAsistenciaActivo = 'diario';

function agruparPorMes(registros) {
  const grupos = {};
  registros.forEach(r => {
    const mes = r.fecha.slice(0, 7);
    if (!grupos[mes]) grupos[mes] = { asiste: 0, noAsiste: 0, tardanza: 0, excusa: 0, total: 0 };
    grupos[mes].total++;
    if (r.estado === 'Asiste') grupos[mes].asiste++;
    else if (r.estado === 'Tardanza') grupos[mes].tardanza++;
    else if (r.estado === 'Excusa') grupos[mes].excusa++;
    else grupos[mes].noAsiste++;
  });
  return grupos;
}

function numeroDeSemanaISO(fechaISO) {
  const fecha = new Date(fechaISO + 'T00:00:00');
  const dia = (fecha.getDay() + 6) % 7;
  fecha.setDate(fecha.getDate() - dia + 3);
  const primerJueves = new Date(fecha.getFullYear(), 0, 4);
  const semana = 1 + Math.round(((fecha - primerJueves) / 86400000 - 3 + ((primerJueves.getDay() + 6) % 7)) / 7);
  return fecha.getFullYear() + '-S' + String(semana).padStart(2, '0');
}

function agruparPorSemana(registros) {
  const grupos = {};
  registros.forEach(r => {
    const semana = numeroDeSemanaISO(r.fecha);
    if (!grupos[semana]) grupos[semana] = { asiste: 0, noAsiste: 0, tardanza: 0, excusa: 0, total: 0 };
    grupos[semana].total++;
    if (r.estado === 'Asiste') grupos[semana].asiste++;
    else if (r.estado === 'Tardanza') grupos[semana].tardanza++;
    else if (r.estado === 'Excusa') grupos[semana].excusa++;
    else grupos[semana].noAsiste++;
  });
  return grupos;
}

function tablaDeGrupos(grupos, rotuloColumna) {
  const tabla = document.createElement('table');
  tabla.className = 'table table-hover align-middle data-table';
  tabla.innerHTML = '<thead><tr><th>' + rotuloColumna + '</th><th>Asiste</th><th>No asiste</th><th>Tardanza</th><th>Excusa</th><th>% asistencia</th></tr></thead>';
  const cuerpo = document.createElement('tbody');

  Object.keys(grupos).sort().reverse().forEach(clave => {
    const g = grupos[clave];
    const fila = document.createElement('tr');
    const pct = g.total ? Math.round(g.asiste * 100 / g.total) : 0;
    [clave, g.asiste, g.noAsiste, g.tardanza, g.excusa, pct + '%'].forEach(valor => {
      const celda = document.createElement('td');
      celda.textContent = String(valor);
      fila.appendChild(celda);
    });
    cuerpo.appendChild(fila);
  });

  tabla.appendChild(cuerpo);
  return tabla;
}

function pintarReporteAsistencias(modo) {
  modoAsistenciaActivo = modo || modoAsistenciaActivo;
  const zona = document.getElementById('rep-asis-contenido');
  if (!zona) return;

  document.querySelectorAll('#rep-asis-modo button').forEach(b => {
    b.classList.toggle('active', b.dataset.modo === modoAsistenciaActivo);
  });

  const roster = rosterConClave(fichaDeAsistenciaIns());
  zona.replaceChildren();

  if (modoAsistenciaActivo === 'diario' || modoAsistenciaActivo === 'semanal' || modoAsistenciaActivo === 'mensual') {
    const todosRegistros = [];
    roster.forEach(a => getAsistencias(a.clave).forEach(r => todosRegistros.push(r)));

    if (modoAsistenciaActivo === 'diario') {
      zona.appendChild(tablaDeGrupos(agruparPorFecha(todosRegistros), 'Fecha'));
    } else if (modoAsistenciaActivo === 'semanal') {
      zona.appendChild(tablaDeGrupos(agruparPorSemana(todosRegistros), 'Semana ISO'));
    } else {
      zona.appendChild(tablaDeGrupos(agruparPorMes(todosRegistros), 'Mes'));
    }
    return;
  }

  if (modoAsistenciaActivo === 'inasistencias') {
    const conInasistencias = roster
      .map(a => ({ nombre: a.nombre, clave: a.clave, resumen: resumenAsistencia(a.clave) }))
      .filter(a => a.resumen.noAsiste > 0)
      .sort((a, b) => b.resumen.noAsiste - a.resumen.noAsiste);

    if (!conInasistencias.length) {
      const vacio = document.createElement('p');
      vacio.className = 'bloque-nota';
      vacio.textContent = 'Nadie de la ficha tiene inasistencias registradas.';
      zona.appendChild(vacio);
      return;
    }

    const tabla = document.createElement('table');
    tabla.className = 'table table-hover align-middle data-table';
    tabla.innerHTML = '<thead><tr><th>Aprendiz</th><th>Inasistencias</th><th>Total reportado</th></tr></thead>';
    const cuerpo = document.createElement('tbody');
    conInasistencias.forEach(a => {
      const fila = document.createElement('tr');
      [a.nombre, a.resumen.noAsiste, a.resumen.total].forEach(valor => {
        const celda = document.createElement('td');
        celda.textContent = String(valor);
        fila.appendChild(celda);
      });
      cuerpo.appendChild(fila);
    });
    tabla.appendChild(cuerpo);
    zona.appendChild(tabla);
    return;
  }

  if (modoAsistenciaActivo === 'individual') {
    const selector = document.createElement('select');
    selector.className = 'form-select mb-3';
    selector.style.maxWidth = '320px';
    roster.forEach(a => {
      const opcion = document.createElement('option');
      opcion.value = a.clave;
      opcion.textContent = a.nombre;
      selector.appendChild(opcion);
    });
    zona.appendChild(selector);

    const detalle = document.createElement('div');
    zona.appendChild(detalle);

    const pintarDetalleIndividual = () => {
      detalle.replaceChildren();
      const registros = getAsistencias(selector.value);
      if (!registros.length) {
        const vacio = document.createElement('p');
        vacio.className = 'bloque-nota';
        vacio.textContent = 'Sin reportes de asistencia todavía.';
        detalle.appendChild(vacio);
        return;
      }
      const tabla = document.createElement('table');
      tabla.className = 'table table-hover align-middle data-table';
      tabla.innerHTML = '<thead><tr><th>Fecha</th><th>Tipo</th><th>Estado</th><th>Motivo</th></tr></thead>';
      const cuerpo = document.createElement('tbody');
      registros.forEach(r => {
        const fila = document.createElement('tr');
        [r.fecha, ROTULO_TIPO_INS[r.tipo] || r.tipo, r.estado, r.motivo || '—'].forEach(valor => {
          const celda = document.createElement('td');
          celda.textContent = valor;
          fila.appendChild(celda);
        });
        cuerpo.appendChild(fila);
      });
      tabla.appendChild(cuerpo);
      detalle.appendChild(tabla);
    };

    selector.addEventListener('change', pintarDetalleIndividual);
    pintarDetalleIndividual();
  }
}

function agruparPorFecha(registros) {
  const grupos = {};
  registros.forEach(r => {
    if (!grupos[r.fecha]) grupos[r.fecha] = { asiste: 0, noAsiste: 0, tardanza: 0, excusa: 0, total: 0 };
    grupos[r.fecha].total++;
    if (r.estado === 'Asiste') grupos[r.fecha].asiste++;
    else if (r.estado === 'Tardanza') grupos[r.fecha].tardanza++;
    else if (r.estado === 'Excusa') grupos[r.fecha].excusa++;
    else grupos[r.fecha].noAsiste++;
  });
  return grupos;
}

document.addEventListener('DOMContentLoaded', () => {
  if (typeof rosterConClave !== 'function') return;

  if (document.getElementById('lya-ficha-info')) {
    pintarListadoYReporteAsistenciasLYA();
    iniciarSelectorIndividualLYA();
  }

  if (document.getElementById('ins-tablero-asistencia')) {
    pintarTableroAsistenciaFichas();
    const cerrarDetalle = document.getElementById('ins-detalle-cerrar');
    if (cerrarDetalle) {
      cerrarDetalle.addEventListener('click', () => {
        document.getElementById('ins-detalle-asistencia').hidden = true;
      });
    }
  }

  if (document.getElementById('asis-sesion-tbody')) {
    pintarEstadoSesionAsistencia();
    pintarAsistenciaSesion();
  }

  const grupoModo = document.getElementById('rep-asis-modo');
  if (grupoModo) {
    grupoModo.querySelectorAll('button').forEach(boton => {
      boton.addEventListener('click', () => pintarReporteAsistencias(boton.dataset.modo));
    });
    pintarReporteAsistencias('diario');
  }
});
