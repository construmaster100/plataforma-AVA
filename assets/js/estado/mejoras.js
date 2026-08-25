/* ══════════════════════════════════════════
   SGMA-ADSO — Billetera de puntos y mejoras

   El aprendiz acumula puntos respondiendo actividades. Con
   ellos puede:

     · comprar mejoras del catálogo,
     · transferir puntos a otro aprendiz,
     · intercambiar una mejora comprada por la mitad de lo
       que costó,
     · crear una mejora nueva, eligiéndole su símbolo.

   Los puntos ganados salen de puntosAcumulados(): la suma de
   los mejores puntajes. Lo gastado y lo transferido se lleva
   aparte, para no tocar nunca el histórico de puntajes.

       disponible = ganados - gastados - enviados + recibidos

   Depende de:
     · ficha.js              → leerAlmacen, guardarAlmacen, FICHA_NUEVA_ID
     · embebidos-catalogo.js → misPuntajes(), identidadActual(), leerPuntajes()
     · plan-formativo.js     → puntosAcumulados()
     · fichas-n.js           → cuposDeFichaN()
══════════════════════════════════════════ */

const CLAVE_MEJORAS = 'sgma_mejoras';
const CLAVE_BILLETERAS = 'sgma_billeteras';

/* Lo que se recupera al devolver una mejora comprada */
const RESCATE_INTERCAMBIO = 0.5;

const MEJORAS_INICIALES = [
  { id: 'm-intento', simbolo: '⏱️', nombre: 'Intento extra',
    descripcion: 'Un intento más en cualquier cuestionario, sin que cuente el anterior.',
    costo: 50, creadaPor: 'Sistema' },
  { id: 'm-pista', simbolo: '💡', nombre: 'Pista',
    descripcion: 'Descarta dos opciones incorrectas en una pregunta.',
    costo: 30, creadaPor: 'Sistema' },
  { id: 'm-nivel', simbolo: '🔓', nombre: 'Abrir nivel antes',
    descripcion: 'Abre el siguiente nivel sin esperar a juntar su umbral de puntos.',
    costo: 120, creadaPor: 'Sistema' },
  { id: 'm-insignia', simbolo: '🏅', nombre: 'Insignia de módulo',
    descripcion: 'Distintivo visible en tu tablero al terminar un módulo.',
    costo: 200, creadaPor: 'Sistema' }
];

function getMejoras() {
  const guardadas = leerAlmacen(CLAVE_MEJORAS, null);
  return Array.isArray(guardadas) && guardadas.length ? guardadas : MEJORAS_INICIALES.slice();
}

function setMejoras(lista) {
  return guardarAlmacen(CLAVE_MEJORAS, lista);
}

function buscarMejora(id) {
  return getMejoras().find(m => m.id === id) || null;
}

function crearMejora(simbolo, nombre, costo, descripcion) {
  const lista = getMejoras();
  const nueva = {
    id: 'm-' + Date.now().toString(36),
    simbolo: (simbolo || '✨').trim().slice(0, 4),
    nombre: (nombre || '').trim(),
    descripcion: (descripcion || '').trim(),
    costo: Math.max(1, Math.round(Number(costo) || 0)),
    creadaPor: identidadActual().nombre
  };

  lista.push(nueva);
  setMejoras(lista);
  return nueva;
}

/* ── Billeteras ── */

function billeteraEnBlanco() {
  return { gastados: 0, enviados: 0, recibidos: 0, compradas: [] };
}

function getBilletera(clave) {
  const todas = leerAlmacen(CLAVE_BILLETERAS, {});
  const mia = todas[clave || identidadActual().clave];
  if (!mia) return billeteraEnBlanco();

  return {
    gastados: Number(mia.gastados) || 0,
    enviados: Number(mia.enviados) || 0,
    recibidos: Number(mia.recibidos) || 0,
    compradas: Array.isArray(mia.compradas) ? mia.compradas : []
  };
}

function setBilletera(clave, billetera) {
  const todas = leerAlmacen(CLAVE_BILLETERAS, {});
  todas[clave] = billetera;
  return guardarAlmacen(CLAVE_BILLETERAS, todas);
}

/* Puntos ganados: los del histórico de puntajes, intactos */
function puntosGanados() {
  return puntosAcumulados(misPuntajes());
}

function puntosDisponibles() {
  const b = getBilletera();
  return puntosGanados() - b.gastados - b.enviados + b.recibidos;
}

/* ── Las tres operaciones ── */

function comprarMejora(idMejora) {
  const mejora = buscarMejora(idMejora);
  if (!mejora) return { ok: false, motivo: 'La mejora ya no existe.' };

  if (puntosDisponibles() < mejora.costo) {
    return { ok: false, motivo: 'Te faltan ' + (mejora.costo - puntosDisponibles()) + ' puntos.' };
  }

  const clave = identidadActual().clave;
  const billetera = getBilletera(clave);
  billetera.gastados += mejora.costo;
  billetera.compradas.push({
    ref: 'x' + Date.now().toString(36),
    mejoraId: mejora.id,
    costo: mejora.costo,
    fecha: new Date().toISOString()
  });

  setBilletera(clave, billetera);
  return { ok: true, mejora: mejora };
}

/* Devolver una mejora comprada: vuelve la mitad de su costo */
function intercambiarMejora(ref) {
  const clave = identidadActual().clave;
  const billetera = getBilletera(clave);
  const puesto = billetera.compradas.findIndex(c => c.ref === ref);
  if (puesto === -1) return { ok: false, motivo: 'No tienes esa mejora.' };

  const compra = billetera.compradas[puesto];
  const vuelto = Math.floor(compra.costo * RESCATE_INTERCAMBIO);

  billetera.compradas.splice(puesto, 1);
  billetera.gastados = Math.max(0, billetera.gastados - vuelto);

  setBilletera(clave, billetera);
  return { ok: true, vuelto: vuelto };
}

function transferirPuntos(claveDestino, cuantos) {
  const monto = Math.max(0, Math.round(Number(cuantos) || 0));
  if (!monto) return { ok: false, motivo: 'Indica cuántos puntos transferir.' };

  const yo = identidadActual().clave;
  if (claveDestino === yo) return { ok: false, motivo: 'No puedes transferirte a ti.' };
  if (puntosDisponibles() < monto) {
    return { ok: false, motivo: 'Solo tienes ' + puntosDisponibles() + ' puntos disponibles.' };
  }

  const mia = getBilletera(yo);
  mia.enviados += monto;
  setBilletera(yo, mia);

  const suya = getBilletera(claveDestino);
  suya.recibidos += monto;
  setBilletera(claveDestino, suya);

  return { ok: true, monto: monto };
}

/* ── A quién se le puede transferir ── */

/* Los que ya tienen puntaje registrado, más los cupos libres
   de la ficha de práctica. Sin backend no hay más censo. */
function destinatariosDePuntos() {
  const yo = identidadActual().clave;
  const vistos = {};
  const lista = [];

  const todos = leerPuntajes();
  Object.keys(todos).forEach(clave => {
    if (clave === yo) return;
    const marcas = todos[clave];
    const ids = Object.keys(marcas);
    const nombre = ids.length ? marcas[ids[0]].nombre : clave;
    vistos[clave] = true;
    lista.push({ clave: clave, nombre: nombre });
  });

  return lista;
}
