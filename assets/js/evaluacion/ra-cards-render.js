/* ══════════════════════════════════════════
   Motor compartido de las cards de RA — usado por
   assets/js/evaluacion/ra-cards-presentar.js (aprendiz, su propio
   progreso) y assets/js/evaluacion/ra-cards-instructor.js (instructor
   y administrador, el progreso de cualquier aprendiz de la ficha).
   Un RA = una card con sus 4 módulos (AA1) como tiles — Cuestionario,
   Unir palabras, Verdadero o Falso, Evaluación final — y una barra de
   progreso verde. El filesystem sigue guardando 5 AA por RA
   (server/routes/actividades.js), pero la card solo expone AA1.
══════════════════════════════════════════ */

const PORCENTAJE_APROBACION_RA_CARDS = 70;
const AA_TARJETA_RA_CARDS = 1;
const TOTAL_RA_POR_FICHA_CARDS = { adso: 72, english: 5 };

const ETIQUETA_M = {
  1: { nombre: 'Módulo 1', tipo: 'Cuestionario', unidad: 'preguntas' },
  2: { nombre: 'Módulo 2', tipo: 'Unir palabras', unidad: 'palabras' },
  3: { nombre: 'Módulo 3', tipo: 'Verdadero o Falso', unidad: 'afirmaciones' },
  4: { nombre: 'Módulo 4', tipo: 'Evaluación final', unidad: 'preguntas' },
};

function ultimosPorCuestionarioCards(historial) {
  const ultimos = new Map();
  (historial || []).forEach(h => {
    const previo = ultimos.get(h.cuestionario);
    if (!previo || new Date(h.createdAt) > new Date(previo.createdAt)) ultimos.set(h.cuestionario, h);
  });
  return ultimos;
}

function estadoMCard(ultimos, cuestionarioId) {
  const r = ultimos.get(cuestionarioId);
  if (!r || !r.totalPreguntas) return { texto: 'Sin presentar', aprobado: false };
  const porcentaje = (r.puntaje / r.totalPreguntas) * 100;
  return porcentaje >= PORCENTAJE_APROBACION_RA_CARDS
    ? { texto: 'Aprobado', aprobado: true }
    : { texto: 'No aprobado', aprobado: false };
}

function agruparPorRaYAa(catalogo, fichas) {
  const porRA = new Map();
  catalogo.filter(a => fichas.includes(a.ficha)).forEach(a => {
    if (!porRA.has(a.raId)) porRA.set(a.raId, new Map());
    const porAA = porRA.get(a.raId);
    if (!porAA.has(a.actividadIndex)) porAA.set(a.actividadIndex, []);
    porAA.get(a.actividadIndex).push(a);
  });
  return porRA;
}

function cargarFrameRaCards(frame, material, params) {
  frame.src = material.embebidoUrl + '?doc=' + encodeURIComponent(params.get('doc') || '')
    + '&u=' + encodeURIComponent(params.get('u') || '')
    + '&ra=' + material.raId + '&aa=' + material.actividadIndex + '&m=' + material.materialIndex
    + '&ficha=' + material.ficha;
}

function pintarTileM(m, material, ultimos, activo, onClick) {
  const etiqueta = ETIQUETA_M[m];
  const tile = document.createElement('button');
  tile.type = 'button';
  tile.className = 'card ra-m-tile' + (activo ? ' ra-m-tile-activo' : '');
  tile.style.cssText = 'flex:1;min-width:130px;padding:14px 10px;text-align:center;'
    + 'border-radius:14px;border:1px solid ' + (activo ? '#39A900' : '#ddd') + ';'
    + 'background:' + (activo ? '#eef8e8' : '#fff') + ';cursor:' + (material ? 'pointer' : 'not-allowed') + ';';

  if (!material) {
    tile.disabled = true;
    tile.style.opacity = '0.55';
    tile.innerHTML = `<div style="font-weight:700;">${etiqueta.nombre}</div>
      <div class="small text-muted">${etiqueta.tipo}</div>
      <div class="small text-muted">Sin contenido aún</div>`;
    return tile;
  }

  const { texto, aprobado } = estadoMCard(ultimos, material.cuestionarioId);
  const colorEstado = aprobado ? '#278238' : (texto === 'Sin presentar' ? '#777' : '#c9640a');
  tile.innerHTML = `
    <div style="font-weight:700;">${etiqueta.nombre}</div>
    <div class="small text-muted">${etiqueta.tipo.toUpperCase()}</div>
    <div class="small text-muted">${material.maxPuntaje} ${etiqueta.unidad}</div>
    <div class="small text-muted">${material.maxPuntaje} puntos</div>
    <div class="small" style="color:${colorEstado};font-weight:600;margin-top:4px;">${texto}</div>`;
  tile.addEventListener('click', () => onClick(material));
  return tile;
}

/* Un card por RA: título, barra de progreso verde, y los 4 módulos de
   su AA1 como tiles — el que se elige carga su iframe debajo.
   `seleccionMPorRA` es un objeto { [raId]: mIndex } que el llamador
   conserva entre repintados (cada rol guarda el suyo). `onRefrescar`
   es lo que hace el botón "Actualizar estado" (vuelve a pedir los
   datos de ese aprendiz). `idPrefijo` evita choques de id cuando hay
   más de una lista de cards en la misma página (p.ej. instructor). */
function pintarCardRA(raId, porAA, ultimos, params, seleccionMPorRA, onRefrescar, idPrefijo) {
  const materiales = porAA.get(AA_TARJETA_RA_CARDS) || [];
  const estados = [1, 2, 3, 4].map(m => {
    const material = materiales.find(x => x.materialIndex === m);
    return material ? estadoMCard(ultimos, material.cuestionarioId) : null;
  });
  const conContenido = estados.filter(Boolean);
  const aprobados = conContenido.filter(e => e.aprobado).length;
  const porcentaje = conContenido.length ? Math.round((aprobados / conContenido.length) * 100) : 0;
  const raAprobado = conContenido.length > 0 && aprobados === conContenido.length;

  const card = document.createElement('div');
  card.className = 'card content-card ra-card';
  card.id = (idPrefijo || 'ra-card-') + raId;
  card.style.cssText = 'margin-bottom:18px;padding:18px;width:100%;background:#f4f4f4;';

  const encabezado = document.createElement('div');
  encabezado.className = 'd-flex flex-wrap align-items-center gap-2';
  encabezado.style.marginBottom = '14px';
  encabezado.innerHTML = `
    <h3 style="margin:0;">RA${raId}-Resultado de Aprendizaje ${raId}</h3>
    <span class="badge ${raAprobado ? 'bg-success' : 'bg-warning text-dark'}">${raAprobado ? 'APROBADO' : 'EN PROGRESO'}</span>`;
  card.appendChild(encabezado);

  const fila = document.createElement('div');
  fila.className = 'd-flex flex-wrap gap-2';

  const frame = document.createElement('iframe');
  frame.className = 'ra-card-frame';
  frame.title = 'RA-' + raId;
  frame.style.cssText = 'width:100%;height:60vh;border:0;border-radius:12px;margin-top:14px;display:none;';

  const mSel = seleccionMPorRA[raId];
  [1, 2, 3, 4].forEach(m => {
    const material = materiales.find(x => x.materialIndex === m);
    const tile = pintarTileM(m, material, ultimos, mSel === m, elegido => {
      // Acordeón: al abrir un cuestionario se cierran los demás, para
      // no apilar varios iframes de 60vh en un solo bloque largo.
      document.querySelectorAll('.ra-card-frame').forEach(otro => {
        if (otro !== frame) otro.style.display = 'none';
      });
      Object.keys(seleccionMPorRA).forEach(k => {
        if (Number(k) !== raId) delete seleccionMPorRA[k];
      });
      seleccionMPorRA[raId] = m;
      frame.style.display = 'block';
      cargarFrameRaCards(frame, elegido, params);
      frame.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    fila.appendChild(tile);
  });
  card.appendChild(fila);
  card.appendChild(frame);

  if (mSel) {
    const material = materiales.find(x => x.materialIndex === mSel);
    if (material) {
      frame.style.display = 'block';
      cargarFrameRaCards(frame, material, params);
    }
  }

  const barraWrap = document.createElement('div');
  barraWrap.style.cssText = 'margin-top:14px;height:14px;border-radius:8px;background:#e2e2e2;overflow:hidden;';
  const barraFill = document.createElement('div');
  barraFill.style.cssText = `height:100%;width:${porcentaje}%;background:#39A900;transition:width .3s ease;`;
  barraWrap.appendChild(barraFill);
  card.appendChild(barraWrap);

  const piePanel = document.createElement('div');
  piePanel.className = 'd-flex flex-wrap align-items-center gap-2 mt-2';
  const pie = document.createElement('p');
  pie.className = 'small text-muted mb-0';
  pie.textContent = `${aprobados} de ${conContenido.length || 4} módulos aprobados · ${porcentaje}%`;
  piePanel.appendChild(pie);
  if (onRefrescar) {
    const refrescar = document.createElement('button');
    refrescar.type = 'button';
    refrescar.className = 'btn btn-sm btn-outline-secondary';
    refrescar.textContent = '🔄 Actualizar estado';
    refrescar.addEventListener('click', onRefrescar);
    piePanel.appendChild(refrescar);
  }
  card.appendChild(piePanel);

  return card;
}

/* Franja superior con las 72 pastillas (5 en English): resalta las
   disponibles (con contenido y desbloqueadas) y muestra con 🔒 las que
   no. Un clic en una disponible baja la vista hasta su card. */
function pintarSelectorRA(selector, totalRA, raConContenido, desbloqueados, aprobadasPorRA, idPrefijo) {
  selector.replaceChildren();
  const conContenido = new Set(raConContenido);

  for (let raId = 1; raId <= totalRA; raId++) {
    const disponible = conContenido.has(raId);
    const boton = document.createElement('button');
    boton.type = 'button';
    boton.className = 'btn btn-sm ' + (!disponible
      ? 'btn-outline-secondary'
      : (aprobadasPorRA.get(raId) ? 'btn-outline-success' : 'btn-outline-warning'));

    if (!disponible) {
      boton.disabled = true;
      boton.title = desbloqueados.has(raId) ? 'Desbloqueado, sin contenido cargado todavía' : 'Bloqueado — no habilitado para este aprendiz';
      boton.textContent = 'RA-' + String(raId).padStart(2, '0') + ' 🔒';
    } else {
      boton.textContent = 'RA-' + String(raId).padStart(2, '0') + (aprobadasPorRA.get(raId) ? ' ✓' : '');
      boton.addEventListener('click', () => {
        const destino = document.getElementById((idPrefijo || 'ra-card-') + raId);
        if (destino) destino.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
    selector.appendChild(boton);
  }
}
