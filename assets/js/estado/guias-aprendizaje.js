/* ══════════════════════════════════════════
   SGMA-ADSO — Estado de las guías de aprendizaje (GAA)

   No hay catálogo propio de guías aquí: el catálogo real —
   código, nombre, fase, enlace al PDF— vive en la tabla estática
   de `sec-guias-gaa` (pages/aprendiz.html). Este módulo solo
   guarda, por aprendiz, qué códigos ha abierto y cuáles marcó
   como entregados; `assets/js/vistas/guias-vista.js` cruza esto
   con la tabla para pintar el estado de cada fila.

   Estado de una guía:
     Desarrollada → está en «entregadas»
     En curso     → está en «abiertas» y no en «entregadas»
     Pendiente    → ninguna de las dos

   Depende de:
     · ficha.js → leerAlmacen, guardarAlmacen
══════════════════════════════════════════ */

const CLAVE_GUIAS_GAA = 'sgma_guias_gaa';

function registroDeGuias(clave) {
  const todas = leerAlmacen(CLAVE_GUIAS_GAA, {});
  const mio = todas[clave];
  return {
    abiertas: Array.isArray(mio && mio.abiertas) ? mio.abiertas : [],
    entregadas: Array.isArray(mio && mio.entregadas) ? mio.entregadas : []
  };
}

function guardarRegistroDeGuias(clave, registro) {
  const todas = leerAlmacen(CLAVE_GUIAS_GAA, {});
  todas[clave] = registro;
  return guardarAlmacen(CLAVE_GUIAS_GAA, todas);
}

function marcarGuiaAbierta(clave, codigo) {
  if (!codigo) return false;
  const registro = registroDeGuias(clave);
  if (registro.abiertas.indexOf(codigo) !== -1) return false;
  registro.abiertas.push(codigo);
  guardarRegistroDeGuias(clave, registro);
  return true;
}

function marcarGuiaEntregada(clave, codigo) {
  if (!codigo) return false;
  const registro = registroDeGuias(clave);
  if (registro.entregadas.indexOf(codigo) === -1) registro.entregadas.push(codigo);
  if (registro.abiertas.indexOf(codigo) === -1) registro.abiertas.push(codigo);
  return guardarRegistroDeGuias(clave, registro);
}

function desmarcarGuiaEntregada(clave, codigo) {
  const registro = registroDeGuias(clave);
  const puesto = registro.entregadas.indexOf(codigo);
  if (puesto === -1) return false;
  registro.entregadas.splice(puesto, 1);
  return guardarRegistroDeGuias(clave, registro);
}

function estadoDeGuia(clave, codigo) {
  const registro = registroDeGuias(clave);
  if (registro.entregadas.indexOf(codigo) !== -1) return 'Desarrollada';
  if (registro.abiertas.indexOf(codigo) !== -1) return 'En curso';
  return 'Pendiente';
}

/* Código de la guía «en curso» más reciente que aún no se entregó,
   o '' si no hay ninguna así. El orden de `abiertas` es el orden
   en que se fueron abriendo, así que la última es la vigente. */
function guiaActual(clave) {
  const registro = registroDeGuias(clave);
  for (let i = registro.abiertas.length - 1; i >= 0; i--) {
    const codigo = registro.abiertas[i];
    if (registro.entregadas.indexOf(codigo) === -1) return codigo;
  }
  return '';
}
