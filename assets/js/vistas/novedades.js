/* ══════════════════════════════════════════
   SGMA-ADSO — Novedades del instructor
   Registro de llamados de atención, inasistencias,
   comportamiento, entregas impuntuales y demoras en
   evidencia. Lo registrado aquí es lo que el
   administrador consulta como reporte de novedades.
══════════════════════════════════════════ */

const CLAVE_NOVEDADES = 'sgma_novedades';

function getNovedades() {
  try {
    const crudo = localStorage.getItem(CLAVE_NOVEDADES);
    return crudo ? JSON.parse(crudo) : [];
  } catch (e) { return []; }
}

function setNovedades(lista) {
  try { localStorage.setItem(CLAVE_NOVEDADES, JSON.stringify(lista)); } catch (e) {}
  return lista;
}

document.addEventListener('DOMContentLoaded', () => {

  const formulario = document.getElementById('nv-form');
  if (!formulario) return;

  const selAprendiz = document.getElementById('nv-aprendiz');
  const selTipo     = document.getElementById('nv-tipo');
  const campoFecha  = document.getElementById('nv-fecha');
  const campoDetalle= document.getElementById('nv-detalle');
  const selEstado   = document.getElementById('nv-estado');
  const cuerpo      = document.getElementById('nv-cuerpo');
  const sello       = document.getElementById('nv-sello');
  const selFicha    = document.getElementById('ins-ficha-activa');
  const selRepTipo  = document.getElementById('rep-tipo');
  const selRepAprendiz = document.getElementById('rep-aprendiz');

  const fichaActiva = () =>
    (selFicha ? selFicha.value : (typeof FICHA_EN_CURSO !== 'undefined' ? FICHA_EN_CURSO : ''));

  const nomina = () =>
    (typeof getMatricula === 'function' ? getMatricula(fichaActiva()) : []);

  const hoyISO = () => new Date().toISOString().slice(0, 10);

  /* ── La nómina real alimenta los dos selectores de aprendiz ── */
  const llenarAprendices = () => {
    const lista = nomina();

    selAprendiz.replaceChildren();
    lista.forEach(nombre => {
      const op = document.createElement('option');
      op.value = nombre; op.textContent = nombre;
      selAprendiz.appendChild(op);
    });

    if (selRepAprendiz) {
      selRepAprendiz.replaceChildren();
      const todos = document.createElement('option');
      todos.value = ''; todos.textContent = '— Todos —';
      selRepAprendiz.appendChild(todos);
      lista.forEach(nombre => {
        const op = document.createElement('option');
        op.value = nombre; op.textContent = nombre;
        selRepAprendiz.appendChild(op);
      });
    }
  };

  const claseEstado = estado =>
    estado === 'Abierta' ? 'status-inactive'
    : estado === 'En seguimiento' ? 'status-closed'
    : 'status-active';

  /* ── Tabla de lo ya reportado en la ficha activa ── */
  const pintarTabla = () => {
    const ficha = fichaActiva();
    const propias = getNovedades().filter(n => n.fichaId === ficha);
    cuerpo.replaceChildren();

    if (!propias.length) {
      const fila = document.createElement('tr');
      const celda = document.createElement('td');
      celda.colSpan = 6;
      celda.className = 'tabla-vacia';
      celda.textContent = 'Aún no se ha reportado ninguna novedad en esta ficha.';
      fila.appendChild(celda);
      cuerpo.appendChild(fila);
    } else {
      propias.slice().reverse().forEach(novedad => {
        const fila = document.createElement('tr');

        [novedad.fecha, novedad.aprendiz, novedad.tipo, novedad.detalle].forEach(texto => {
          const celda = document.createElement('td');
          celda.textContent = texto;
          fila.appendChild(celda);
        });

        const celdaEstado = document.createElement('td');
        const marca = document.createElement('span');
        marca.className = 'badge status-badge ' + claseEstado(novedad.estado);
        marca.textContent = novedad.estado;
        celdaEstado.appendChild(marca);
        fila.appendChild(celdaEstado);

        const celdaAccion = document.createElement('td');
        const borrar = document.createElement('button');
        borrar.type = 'button';
        borrar.className = 'btn btn-sm btn-table btn-danger';
        borrar.textContent = 'Retirar';
        borrar.addEventListener('click', () => {
          setNovedades(getNovedades().filter(n => n.id !== novedad.id));
          pintarTabla();
        });
        celdaAccion.appendChild(borrar);
        fila.appendChild(celdaAccion);

        cuerpo.appendChild(fila);
      });
    }

    sello.textContent = propias.length + (propias.length === 1 ? ' novedad' : ' novedades');
  };

  formulario.addEventListener('submit', e => {
    e.preventDefault();
    if (!selAprendiz.value) return;

    const lista = getNovedades();
    lista.push({
      id: Date.now(),
      fichaId: fichaActiva(),
      fecha: campoFecha.value || hoyISO(),
      aprendiz: selAprendiz.value,
      tipo: selTipo.value,
      detalle: campoDetalle.value.trim() || 'Sin descripción adicional',
      estado: selEstado.value,
      instructor: 'Zulma Salas'
    });
    setNovedades(lista);

    campoDetalle.value = '';
    pintarTabla();
  });

  /* ── Los botones de la tarjeta llegan con el motivo ya elegido ── */
  document.querySelectorAll('[data-tipo]').forEach(boton => {
    boton.addEventListener('click', () => {
      selTipo.value = boton.dataset.tipo;
      campoFecha.value = hoyISO();
    });
  });

  if (selRepTipo) {
    document.querySelectorAll('[data-rep]').forEach(boton => {
      boton.addEventListener('click', () => { selRepTipo.value = boton.dataset.rep; });
    });
  }

  if (selFicha) selFicha.addEventListener('change', () => { llenarAprendices(); pintarTabla(); });

  campoFecha.value = hoyISO();
  llenarAprendices();
  pintarTabla();
});
