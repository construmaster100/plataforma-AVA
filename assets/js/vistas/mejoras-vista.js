/* ══════════════════════════════════════════
   SGMA-ADSO — Casilla de puntaje del aprendiz

   Va en el sidebar: el marcador con los puntos disponibles
   y los tres accesos —comprar, transferir, crear mejora—
   que despliegan su panel debajo.

   Depende de:
     · mejoras.js → puntosDisponibles(), comprarMejora()…
══════════════════════════════════════════ */

let panelAbierto = '';

function avisarBilletera(texto, malo) {
  const aviso = document.getElementById('bil-aviso');
  if (!aviso) return;
  aviso.textContent = texto || '';
  aviso.hidden = !texto;
  aviso.classList.toggle('es-malo', Boolean(malo));
}

function pintarMarcadorBilletera() {
  const caja = document.getElementById('bil-marcador');
  if (!caja) return;

  const billetera = getBilletera();
  const ganados = puntosGanados();
  const libres = puntosDisponibles();

  caja.replaceChildren();

  const cifra = document.createElement('span');
  cifra.className = 'bil-cifra';
  cifra.textContent = String(libres);

  const rotulo = document.createElement('span');
  rotulo.className = 'bil-rotulo';
  rotulo.textContent = libres === 1 ? 'punto disponible' : 'puntos disponibles';

  caja.append(cifra, rotulo);

  const desglose = document.createElement('span');
  desglose.className = 'bil-desglose';
  const partes = ['ganados ' + ganados];
  if (billetera.gastados) partes.push('gastados ' + billetera.gastados);
  if (billetera.enviados) partes.push('enviados ' + billetera.enviados);
  if (billetera.recibidos) partes.push('recibidos ' + billetera.recibidos);
  desglose.textContent = partes.join(' · ');
  caja.appendChild(desglose);

  const mias = billetera.compradas.length;
  if (mias) {
    const tenencia = document.createElement('span');
    tenencia.className = 'bil-desglose';
    tenencia.textContent = mias === 1 ? '1 mejora activa' : mias + ' mejoras activas';
    caja.appendChild(tenencia);
  }
}

/* ── Comprar ── */

function pintarTiendaMejoras() {
  const caja = document.getElementById('bil-tienda');
  if (!caja) return;
  caja.replaceChildren();

  const libres = puntosDisponibles();

  getMejoras().forEach(mejora => {
    const alcanza = libres >= mejora.costo;

    const fila = document.createElement('button');
    fila.type = 'button';
    fila.className = 'bil-mejora' + (alcanza ? '' : ' es-cara');
    fila.disabled = !alcanza;
    fila.title = mejora.descripcion + ' · creada por ' + mejora.creadaPor;

    const simbolo = document.createElement('span');
    simbolo.className = 'bil-simbolo';
    simbolo.textContent = mejora.simbolo;

    const texto = document.createElement('span');
    texto.className = 'bil-mejora-texto';

    const nombre = document.createElement('span');
    nombre.className = 'bil-mejora-nombre';
    nombre.textContent = mejora.nombre;

    const detalle = document.createElement('span');
    detalle.className = 'bil-mejora-detalle';
    detalle.textContent = mejora.descripcion;

    texto.append(nombre, detalle);

    const costo = document.createElement('span');
    costo.className = 'bil-costo';
    costo.textContent = mejora.costo;

    fila.append(simbolo, texto, costo);
    fila.addEventListener('click', () => {
      const salida = comprarMejora(mejora.id);
      avisarBilletera(salida.ok
        ? 'Compraste «' + salida.mejora.nombre + '» por ' + salida.mejora.costo + ' puntos.'
        : salida.motivo, !salida.ok);
      refrescarBilletera();
    });

    caja.appendChild(fila);
  });
}

/* Lo comprado, para poder intercambiarlo */
function pintarMisMejoras() {
  const caja = document.getElementById('bil-mias');
  if (!caja) return;
  caja.replaceChildren();

  const compradas = getBilletera().compradas;

  if (!compradas.length) {
    const vacio = document.createElement('p');
    vacio.className = 'bil-vacio';
    vacio.textContent = 'Todavía no has comprado ninguna mejora.';
    caja.appendChild(vacio);
    return;
  }

  compradas.forEach(compra => {
    const mejora = buscarMejora(compra.mejoraId);
    const fila = document.createElement('div');
    fila.className = 'bil-mia';

    const simbolo = document.createElement('span');
    simbolo.className = 'bil-simbolo';
    simbolo.textContent = mejora ? mejora.simbolo : '❔';

    const nombre = document.createElement('span');
    nombre.className = 'bil-mejora-nombre';
    nombre.textContent = mejora ? mejora.nombre : 'Mejora retirada';

    const canjear = document.createElement('button');
    canjear.type = 'button';
    canjear.className = 'bil-canjear';
    canjear.textContent = '⇄ ' + Math.floor(compra.costo * RESCATE_INTERCAMBIO);
    canjear.title = 'Intercambiar: recuperas la mitad de lo que costó';
    canjear.addEventListener('click', () => {
      const salida = intercambiarMejora(compra.ref);
      avisarBilletera(salida.ok
        ? 'Intercambiada. Recuperaste ' + salida.vuelto + ' puntos.'
        : salida.motivo, !salida.ok);
      refrescarBilletera();
    });

    fila.append(simbolo, nombre, canjear);
    caja.appendChild(fila);
  });
}

/* ── Transferir ── */

function llenarDestinatarios() {
  const selector = document.getElementById('bil-destino');
  if (!selector) return;

  const previo = selector.value;
  selector.replaceChildren();

  const gente = destinatariosDePuntos();
  if (!gente.length) {
    const nadie = document.createElement('option');
    nadie.value = '';
    nadie.textContent = 'No hay a quién enviarle';
    selector.appendChild(nadie);
    return;
  }

  gente.forEach(persona => {
    const opcion = document.createElement('option');
    opcion.value = persona.clave;
    opcion.textContent = persona.nombre;
    selector.appendChild(opcion);
  });

  if (previo) selector.value = previo;
}

/* ── Paneles ── */

function abrirPanelBilletera(cual) {
  panelAbierto = panelAbierto === cual ? '' : cual;

  ['comprar', 'transferir', 'crear'].forEach(nombre => {
    const panel = document.getElementById('bil-panel-' + nombre);
    if (panel) panel.hidden = panelAbierto !== nombre;
    const boton = document.getElementById('bil-btn-' + nombre);
    if (boton) boton.setAttribute('aria-expanded', String(panelAbierto === nombre));
  });

  if (panelAbierto === 'comprar') { pintarTiendaMejoras(); pintarMisMejoras(); }
  if (panelAbierto === 'transferir') llenarDestinatarios();
}

function refrescarBilletera() {
  pintarMarcadorBilletera();
  if (panelAbierto === 'comprar') { pintarTiendaMejoras(); pintarMisMejoras(); }
  if (panelAbierto === 'transferir') llenarDestinatarios();
}

document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('bil-marcador')) return;

  [['comprar', 'bil-btn-comprar'], ['transferir', 'bil-btn-transferir'], ['crear', 'bil-btn-crear']]
    .forEach(par => {
      const boton = document.getElementById(par[1]);
      if (boton) boton.addEventListener('click', () => abrirPanelBilletera(par[0]));
    });

  const formTransferir = document.getElementById('bil-form-transferir');
  if (formTransferir) {
    formTransferir.addEventListener('submit', evento => {
      evento.preventDefault();
      const destino = document.getElementById('bil-destino');
      const monto = document.getElementById('bil-monto');
      if (!destino || !destino.value) {
        avisarBilletera('Elige a quién enviarle.', true);
        return;
      }
      const salida = transferirPuntos(destino.value, monto ? monto.value : 0);
      avisarBilletera(salida.ok
        ? 'Enviaste ' + salida.monto + ' puntos a ' + destino.selectedOptions[0].textContent + '.'
        : salida.motivo, !salida.ok);
      if (salida.ok && monto) monto.value = '';
      refrescarBilletera();
    });
  }

  const formCrear = document.getElementById('bil-form-crear');
  if (formCrear) {
    formCrear.addEventListener('submit', evento => {
      evento.preventDefault();
      const simbolo = document.getElementById('bil-nueva-simbolo');
      const nombre  = document.getElementById('bil-nueva-nombre');
      const costo   = document.getElementById('bil-nueva-costo');
      const desc    = document.getElementById('bil-nueva-desc');

      if (!nombre || nombre.value.trim().length < 3) {
        avisarBilletera('Ponle un nombre de al menos 3 letras.', true);
        if (nombre) nombre.focus();
        return;
      }
      if (!costo || Number(costo.value) < 1) {
        avisarBilletera('La mejora debe costar al menos 1 punto.', true);
        if (costo) costo.focus();
        return;
      }

      const nueva = crearMejora(
        simbolo ? simbolo.value : '✨',
        nombre.value,
        costo.value,
        desc ? desc.value : ''
      );

      nombre.value = '';
      if (costo) costo.value = '';
      if (desc) desc.value = '';

      avisarBilletera('Mejora «' + nueva.simbolo + ' ' + nueva.nombre + '» creada por ' + nueva.costo + ' puntos.');
      refrescarBilletera();
    });
  }

  pintarMarcadorBilletera();
});

/* El puntaje sube al terminar una actividad en el visor */
window.addEventListener('message', evento => {
  const dato = evento.data;
  if (dato && dato.tipo === 'sgma-puntaje') refrescarBilletera();
});

window.addEventListener('storage', evento => {
  if (evento.key === CLAVE_PUNTAJES ||
      evento.key === CLAVE_BILLETERAS ||
      evento.key === CLAVE_MEJORAS) refrescarBilletera();
});
