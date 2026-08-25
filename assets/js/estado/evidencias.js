/* ══════════════════════════════════════════
   SGMA-ADSO — Semáforo de evidencias

   El aprendiz adjunta evidencia (metadato, no archivo real — igual
   que el resto del sitio simula cargas) por sesión; el instructor
   la valida con un semáforo: amarillo (en revisión, valor por
   defecto), verde (aprobada) o rojo (rechazada), con motivo opcional.

   Depende de:
     · ficha.js → leerAlmacen, guardarAlmacen
══════════════════════════════════════════ */

const CLAVE_EVIDENCIAS = 'sgma_evidencias';

function getEvidencias(fichaId) {
  const todas = leerAlmacen(CLAVE_EVIDENCIAS, {});
  return Array.isArray(todas[fichaId]) ? todas[fichaId] : [];
}

function guardarEvidencias(fichaId, lista) {
  const todas = leerAlmacen(CLAVE_EVIDENCIAS, {});
  todas[fichaId] = lista;
  return guardarAlmacen(CLAVE_EVIDENCIAS, todas);
}

function adjuntarEvidencia(fichaId, idSesion, aprendizClave, nombreAprendiz, descripcion) {
  const lista = getEvidencias(fichaId);
  const evidencia = {
    id: 'evi-' + Date.now().toString(36),
    idSesion: idSesion || '',
    clave: aprendizClave,
    nombre: nombreAprendiz || '',
    descripcion: (descripcion || '').trim(),
    semaforo: 'amarillo',
    motivo: '',
    fecha: new Date().toISOString()
  };
  lista.push(evidencia);
  guardarEvidencias(fichaId, lista);
  return evidencia;
}

function fijarSemaforo(fichaId, idEvidencia, color, motivo) {
  const lista = getEvidencias(fichaId);
  const evidencia = lista.find(e => e.id === idEvidencia);
  if (!evidencia) return null;
  if (['rojo', 'amarillo', 'verde'].indexOf(color) === -1) return null;
  evidencia.semaforo = color;
  evidencia.motivo = (motivo || '').trim();
  guardarEvidencias(fichaId, lista);
  return evidencia;
}

function evidenciasDeSesion(fichaId, idSesion) {
  return getEvidencias(fichaId).filter(e => e.idSesion === idSesion);
}

function evidenciasDeAprendiz(fichaId, aprendizClave) {
  return getEvidencias(fichaId).filter(e => e.clave === aprendizClave);
}
