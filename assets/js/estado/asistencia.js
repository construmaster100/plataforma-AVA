/* ══════════════════════════════════════════
   SGMA-ADSO — Asistencia del aprendiz

   Un registro por día por aprendiz (upsert por fecha, no se
   acumulan varios reportes del mismo día). El estado se deriva
   del tipo de reporte:

     ingreso       → Asiste
     demora        → Tardanza
     inasistencia  → Excusa   (si trae motivo)
                     No asiste (si no trae motivo)

   Depende de:
     · ficha.js → leerAlmacen, guardarAlmacen
══════════════════════════════════════════ */

const CLAVE_ASISTENCIA = 'sgma_asistencia';

function getAsistencias(clave) {
  const todas = leerAlmacen(CLAVE_ASISTENCIA, {});
  const mias = (todas && todas[clave]) || [];
  return mias.slice().sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
}

function estadoDeReporte(tipo, motivo) {
  if (tipo === 'ingreso') return 'Asiste';
  if (tipo === 'demora') return 'Tardanza';
  return (motivo || '').trim() ? 'Excusa' : 'No asiste';
}

function registrarAsistencia(clave, nombre, tipo, motivo) {
  const todas = leerAlmacen(CLAVE_ASISTENCIA, {});
  const mias = Array.isArray(todas[clave]) ? todas[clave] : [];
  const hoy = new Date().toISOString().slice(0, 10);

  const registro = {
    fecha: hoy,
    tipo: tipo,
    estado: estadoDeReporte(tipo, motivo),
    motivo: (motivo || '').trim(),
    nombre: nombre || '',
    registrado: new Date().toISOString()
  };

  const puesto = mias.findIndex(r => r.fecha === hoy);
  if (puesto === -1) mias.push(registro);
  else mias[puesto] = registro;

  todas[clave] = mias;
  guardarAlmacen(CLAVE_ASISTENCIA, todas);
  return registro;
}

function resumenAsistencia(clave) {
  const mias = getAsistencias(clave);
  const resumen = { asiste: 0, noAsiste: 0, tardanza: 0, excusa: 0, total: mias.length };
  mias.forEach(r => {
    if (r.estado === 'Asiste') resumen.asiste++;
    else if (r.estado === 'Tardanza') resumen.tardanza++;
    else if (r.estado === 'Excusa') resumen.excusa++;
    else resumen.noAsiste++;
  });
  return resumen;
}

/* ── Ponderación de asistencia ──
   Puntual = 2, tarde = 1, excusa justificada = 0.3 (cuenta en el
   promedio, no en el % de asistencia), no asiste = 0. */
const PESOS_ASISTENCIA = { Asiste: 2, Tardanza: 1, Excusa: 0.3, 'No asiste': 0 };

function promedioPonderado(clave) {
  const mias = getAsistencias(clave);
  if (!mias.length) return 0;
  const suma = mias.reduce((acum, r) => acum + (PESOS_ASISTENCIA[r.estado] || 0), 0);
  return suma / mias.length;
}

/* El % de asistencia excluye la excusa justificada del cálculo:
   ni suma como presente ni resta como ausente. */
function porcentajeAsistencia(clave) {
  const r = resumenAsistencia(clave);
  const base = r.asiste + r.tardanza + r.noAsiste;
  if (!base) return 0;
  return Math.round((r.asiste + r.tardanza) * 100 / base);
}

/* Tablero por ficha: agrega el promedio ponderado y el % de cada
   aprendiz del roster, más el total de la ficha. */
function resumenPonderadoFicha(fichaId) {
  const roster = typeof rosterConClave === 'function' ? rosterConClave(fichaId) : [];
  const aprendices = roster.map(a => {
    const resumen = resumenAsistencia(a.clave);
    return {
      clave: a.clave,
      nombre: a.nombre,
      resumen: resumen,
      promedio: promedioPonderado(a.clave),
      porcentaje: porcentajeAsistencia(a.clave)
    };
  });

  const conReportes = aprendices.filter(a => a.resumen.total > 0);
  const promedioFicha = conReportes.length
    ? conReportes.reduce((acum, a) => acum + a.promedio, 0) / conReportes.length
    : 0;
  const porcentajeFicha = conReportes.length
    ? Math.round(conReportes.reduce((acum, a) => acum + a.porcentaje, 0) / conReportes.length)
    : 0;

  return { fichaId, aprendices, promedioFicha, porcentajeFicha, total: roster.length };
}
