/* ══════════════════════════════════════════
   Footer de progreso — pages/aprendiz.html (solo visible en "Inicio")
   Barra de avance + score de la ficha activa (selector "Ficha / curso
   activo" del sidebar). ADSO tiene 72 RA; English Coding solo tiene 5
   (pages/Fichas Tecnicos y tecnologos/English coding/RA1..RA5) — el total
   se ajusta según cuál esté seleccionada.
══════════════════════════════════════════ */

const API_BASE_FOOTER = 'http://localhost:3000/api';
const PORCENTAJE_APROBACION_FOOTER = 70;
const TOTAL_RA_POR_FICHA_FOOTER = { adso: 72, english: 5 };

function ultimoIntentoPorCuestionarioFooter(historial) {
  const ultimos = new Map();
  historial.forEach(h => {
    const previo = ultimos.get(h.cuestionario);
    if (!previo || new Date(h.createdAt) > new Date(previo.createdAt)) ultimos.set(h.cuestionario, h);
  });
  return ultimos;
}

async function actualizarFooterProgreso() {
  const fill = document.getElementById('footer-progreso-fill');
  const texto = document.getElementById('footer-progreso-texto');
  const estadoEl = document.getElementById('footer-progreso-estado');
  const scoreEl = document.getElementById('footer-progreso-score');
  if (!fill) return;

  const cedula = new URLSearchParams(window.location.search).get('doc');
  if (!cedula) return;

  const ficha = typeof getCursoActivo === 'function' ? getCursoActivo() : 'adso';
  const totalRA = TOTAL_RA_POR_FICHA_FOOTER[ficha] || 72;

  let catalogo, datos, acceso;
  try {
    [catalogo, datos, acceso] = await Promise.all([
      fetch(API_BASE_FOOTER + '/actividades').then(r => r.json()),
      fetch(API_BASE_FOOTER + '/resultados/' + encodeURIComponent(cedula)).then(r => r.json()),
      fetch(API_BASE_FOOTER + '/acceso/' + encodeURIComponent(cedula)).then(r => r.json()),
    ]);
  } catch (e) {
    texto.textContent = 'Sin conexión al servidor de reportes';
    return;
  }

  const historialFicha = (datos.historial || []).filter(h => h.cuestionario.startsWith(ficha + '-ra-'));
  const ultimos = ultimoIntentoPorCuestionarioFooter(historialFicha);
  const desbloqueados = (acceso.unlocked || []).filter(ra => ra <= totalRA);

  const porRA = new Map();
  catalogo.filter(a => a.ficha === ficha).forEach(a => {
    if (!porRA.has(a.raId)) porRA.set(a.raId, []);
    porRA.get(a.raId).push(a);
  });

  /* El avance se calcula sobre las RA desbloqueadas que YA tienen
     contenido cargado, no sobre las 72 fijas (casi todas aún vacías):
     de lo contrario la barra queda pegada cerca de 0% aunque el
     aprendiz complete todo lo que existe hoy. Cada RA aporta de forma
     proporcional a sus M aprobados (no todo o nada), así que puede
     llegar a 100% completando el material disponible. */
  let raCompletas = 0;
  let sumaFraccion = 0;
  let raConContenido = 0;

  desbloqueados.forEach(raId => {
    const actividades = porRA.get(raId) || [];
    if (!actividades.length) return;
    raConContenido += 1;

    const aprobados = actividades.filter(a => {
      const r = ultimos.get(a.cuestionarioId);
      if (!r || !r.totalPreguntas) return false;
      return (r.puntaje / r.totalPreguntas) * 100 >= PORCENTAJE_APROBACION_FOOTER;
    }).length;

    sumaFraccion += aprobados / actividades.length;
    if (aprobados === actividades.length) raCompletas += 1;
  });

  const scoreTotal = historialFicha.reduce((suma, h) => suma + (h.puntaje || 0), 0);
  const porcentaje = raConContenido ? Math.round((sumaFraccion / raConContenido) * 100) : 0;

  fill.style.width = porcentaje + '%';
  texto.textContent = `${raCompletas}/${raConContenido} RA con contenido · ${porcentaje}% · ${totalRA} RA en el programa`;
  estadoEl.textContent = porcentaje >= 100 ? 'APROBADO' : 'EN PROGRESO';
  estadoEl.className = 'badge ' + (porcentaje >= 100 ? 'bg-success' : 'bg-warning text-dark');
  scoreEl.innerHTML = `<strong>Score:</strong> ${scoreTotal} pts`;
}

document.addEventListener('DOMContentLoaded', () => {
  actualizarFooterProgreso();

  const selectorCurso = document.getElementById('apr-curso-activo');
  if (selectorCurso) selectorCurso.addEventListener('change', actualizarFooterProgreso);

  // El footer solo tiene sentido en "Inicio": se oculta en cualquier otra
  // sección, envolviendo showSection() sin tocar su lógica original.
  if (typeof window.showSection === 'function') {
    const original = window.showSection;
    window.showSection = function (id) {
      original(id);
      const footer = document.getElementById('footer-progreso-general');
      if (footer) footer.style.display = id === 'sec-home' ? 'flex' : 'none';
    };
  }
});
