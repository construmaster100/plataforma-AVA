/* ══════════════════════════════════════════
   SGMA-ADSO — Cabecera del tablero por resultado de aprendizaje

   Lo primero que ve el aprendiz al abrir «Tablero de puntajes
   de desempeño»:

     · el reloj de horas del RA en curso, 36 h con contador
     · el total del programa: 73 resultados de aprendizaje
     · el diagrama de entregas pendientes
     · los materiales por entregar
     · los módulos por practicar

   Las dos últimas listas salen de datos reales: lo que el
   instructor asignó y lo que el aprendiz ya resolvió. Las
   cifras del programa —73 RA, 36 h, 65 %— son del plan de
   formación, no se calculan aquí.

   Depende de:
     · embebidos-catalogo.js → EMBEBIDOS, misPuntajes()
     · plan-formativo.js     → contenidoAsignado(), fichaDeQuienJuega()
══════════════════════════════════════════ */

/* ── Cifras del plan de formación ── */
const RA_HORAS = 36;          // horas de cada resultado de aprendizaje
const RA_TOTAL = 73;          // resultados de aprendizaje del programa
const RA_AVANCE = 65;         // porcentaje alcanzado

const RA_EN_CURSO = {
  codigo: 'RA-01',
  descripcion: 'Caracterizar los procesos de la organización',
  horasCursadas: 23
};

const RA_ENTREGAS = [
  { id: 'entregadas', rotulo: 'Entregadas',   valor: 9, tono: 'ok' },
  { id: 'revision',   rotulo: 'En revisión',  valor: 4, tono: 'espera' },
  { id: 'pendientes', rotulo: 'Pendientes',   valor: 6, tono: 'aviso' },
  { id: 'vencidas',   rotulo: 'Vencidas',     valor: 2, tono: 'malo' }
];

/* ── Contador que sube hasta su cifra ── */

function contarRA(nodo, destino, milisegundos) {
  if (!nodo) return;
  const pasos = Math.max(1, Math.round((milisegundos || 900) / 40));
  let paso = 0;

  const tic = setInterval(() => {
    paso += 1;
    // Desacelera al final: el número se asienta en vez de cortarse
    const avance = 1 - Math.pow(1 - paso / pasos, 3);
    nodo.textContent = Math.round(destino * avance);
    if (paso >= pasos) { nodo.textContent = destino; clearInterval(tic); }
  }, 40);
}

/* ── Lo que el aprendiz tiene por delante ── */

function pendientesDelAprendiz() {
  const catalogo = typeof EMBEBIDOS !== 'undefined' ? EMBEBIDOS : [];
  const puntajes = typeof misPuntajes === 'function' ? misPuntajes() : {};

  // Materiales: lo asignado por el instructor que aún no ha presentado
  let materiales = [];
  if (typeof contenidoAsignado === 'function' && typeof fichaDeQuienJuega === 'function') {
    try {
      materiales = (contenidoAsignado(fichaDeQuienJuega(), puntajes) || [])
        .filter(a => !a.hecha)
        .map(a => ({
          titulo: a.titulo || a.id,
          nota: a.accesible ? 'disponible ahora' : 'bloqueado',
          libre: !!a.accesible
        }));
    } catch (e) {
      materiales = [];
    }
  }

  // Módulos: los del catálogo donde queda alguna actividad puntuable sin resolver
  const porModulo = {};
  catalogo.filter(a => a.puntua).forEach(a => {
    if (!porModulo[a.modulo]) porModulo[a.modulo] = { total: 0, hechas: 0 };
    porModulo[a.modulo].total += 1;
    if (puntajes[a.id]) porModulo[a.modulo].hechas += 1;
  });

  const modulos = Object.keys(porModulo)
    .map(nombre => ({
      titulo: nombre,
      hechas: porModulo[nombre].hechas,
      total: porModulo[nombre].total
    }))
    .filter(m => m.hechas < m.total)
    .sort((a, b) => (b.hechas / b.total) - (a.hechas / a.total));

  return { materiales: materiales, modulos: modulos };
}

/* ── Pintado ── */

function pintarListaRA(contenedor, filas, vacio) {
  contenedor.replaceChildren();

  if (!filas.length) {
    const nada = document.createElement('li');
    nada.className = 'ra-lista-vacia';
    nada.textContent = vacio;
    contenedor.appendChild(nada);
    return;
  }

  filas.slice(0, 6).forEach(fila => {
    const item = document.createElement('li');
    item.className = 'ra-lista-item' + (fila.libre === false ? ' es-bloqueado' : '');

    const nombre = document.createElement('span');
    nombre.className = 'ra-lista-nombre';
    nombre.textContent = fila.titulo;

    const nota = document.createElement('span');
    nota.className = 'ra-lista-nota';
    nota.textContent = fila.nota;

    item.append(nombre, nota);
    contenedor.appendChild(item);
  });
}

function pintarTableroRA() {
  const trazo = document.getElementById('ra-horas-trazo');
  if (!trazo) return;

  /* 1. Reloj de horas del RA en curso */
  const radio = 46;
  const vuelta = 2 * Math.PI * radio;
  const parte = Math.min(1, RA_EN_CURSO.horasCursadas / RA_HORAS);
  trazo.style.strokeDasharray = vuelta + ' ' + vuelta;
  trazo.style.strokeDashoffset = vuelta * (1 - parte);
  contarRA(document.getElementById('ra-horas-contador'), RA_EN_CURSO.horasCursadas);

  const pie = document.getElementById('ra-horas-pie');
  if (pie) pie.textContent = RA_EN_CURSO.codigo + ' · ' + RA_EN_CURSO.descripcion;

  /* 2. Total del programa */
  contarRA(document.getElementById('ra-total-contador'), RA_TOTAL);
  contarRA(document.getElementById('ra-total-hechos'), Math.round(RA_TOTAL * RA_AVANCE / 100));

  const barra = document.getElementById('ra-total-barra');
  if (barra) setTimeout(() => { barra.style.width = RA_AVANCE + '%'; }, 80);

  const pct = document.getElementById('ra-total-pct');
  if (pct) pct.textContent = RA_AVANCE + '%';

  /* 3. Diagrama de entregas */
  const diagrama = document.getElementById('ra-diagrama');
  const leyenda = document.getElementById('ra-leyenda');
  if (diagrama && leyenda) {
    const suma = RA_ENTREGAS.reduce((s, e) => s + e.valor, 0) || 1;
    diagrama.replaceChildren();
    leyenda.replaceChildren();

    RA_ENTREGAS.forEach(entrega => {
      const trozo = document.createElement('span');
      trozo.className = 'ra-diagrama-trozo';
      trozo.dataset.tono = entrega.tono;
      trozo.style.width = (entrega.valor * 100 / suma) + '%';
      trozo.title = entrega.rotulo + ': ' + entrega.valor;
      diagrama.appendChild(trozo);

      const item = document.createElement('li');
      const punto = document.createElement('i');
      punto.dataset.tono = entrega.tono;
      const texto = document.createElement('span');
      texto.textContent = entrega.rotulo + ' · ' + entrega.valor;
      item.append(punto, texto);
      leyenda.appendChild(item);
    });

    diagrama.setAttribute('aria-label',
      RA_ENTREGAS.map(e => e.rotulo + ': ' + e.valor).join(', '));
  }

  /* 4 y 5. Lo que queda por hacer */
  const { materiales, modulos } = pendientesDelAprendiz();

  const listaMat = document.getElementById('ra-materiales');
  if (listaMat) {
    pintarListaRA(listaMat, materiales, 'El instructor no ha asignado material todavía.');
    const chip = document.getElementById('ra-materiales-conteo');
    if (chip) chip.textContent = materiales.length;
  }

  const listaMod = document.getElementById('ra-modulos');
  if (listaMod) {
    pintarListaRA(listaMod, modulos.map(m => ({
      titulo: m.titulo,
      nota: m.hechas + ' de ' + m.total + ' resueltas',
      libre: true
    })), 'No queda ningún módulo por practicar.');
    const chip = document.getElementById('ra-modulos-conteo');
    if (chip) chip.textContent = modulos.length;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('ra-horas-trazo')) return;

  pintarTableroRA();

  // Un puntaje nuevo cambia lo que queda por practicar
  window.addEventListener('message', evento => {
    if (evento.data && evento.data.tipo === 'sgma-puntaje') setTimeout(pintarTableroRA, 60);
  });

  window.addEventListener('storage', evento => {
    if (evento.key === 'sgma_puntajes_embebidos' || evento.key === 'sgma_plan_formativo') {
      pintarTableroRA();
    }
  });
});
