/* ══════════════════════════════════════════
   SGMA-ADSO — Pantallas del administrador
   Estado de las fichas y reporte de novedades de
   los aprendices: evidencias pendientes, desempeño
   y actividades de mejora o nivelación.
══════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

  const tablero = document.getElementById('pantallas');
  if (!tablero) return;

  const dosCifras = n => String(n).padStart(2, '0');
  const hoy = new Date();
  const fechaCorta = dias => {
    const d = new Date(hoy);
    d.setDate(d.getDate() - dias);
    return dosCifras(d.getDate()) + '/' + dosCifras(d.getMonth() + 1);
  };

  /* ── Lecturas del estado real ── */
  const asignaciones = () =>
    (typeof getAsignaciones === 'function' ? getAsignaciones() : []);

  const totalFichas = () =>
    (typeof FICHAS_SISTEMA === 'object' ? Object.keys(FICHAS_SISTEMA).length : 0);

  const vinculados = fichaId =>
    (typeof getMatricula === 'function' ? getMatricula(fichaId) : []);

  const listaMateriales = () =>
    (typeof getMateriales === 'function' ? getMateriales(FICHA_EN_CURSO) : []);

  const listaResultados = () =>
    (typeof getResultados === 'function' ? getResultados(FICHA_EN_CURSO) : []);

  /* ── Contador que sube hasta su valor ── */
  const contarHasta = (nodo, destino) => {
    const desde = Number(nodo.textContent) || 0;
    if (desde === destino) { nodo.textContent = destino; return; }

    const pasos = 16;
    let paso = 0;
    const salto = (destino - desde) / pasos;

    clearInterval(nodo.temporizador);
    nodo.temporizador = setInterval(() => {
      paso++;
      nodo.textContent = paso >= pasos ? destino : Math.round(desde + salto * paso);
      if (paso >= pasos) clearInterval(nodo.temporizador);
    }, 26);
  };

  /* ── Pantalla de fichas ── */
  const pintarFichas = () => {
    const total = totalFichas();
    const conTitular = asignaciones().length;
    const matriculados = Object.keys(FICHAS_SISTEMA)
      .reduce((suma, id) => suma + vinculados(id).length, 0);

    contarHasta(document.getElementById('pt-fichas'), total);
    document.getElementById('pt-fichas-pie').textContent =
      conTitular + ' con instructor · ' + (total - conTitular) + ' sin asignar';
    document.getElementById('pt-fichas-relleno').style.width =
      Math.round((conTitular / (total || 1)) * 100) + '%';

    // Nombre de cada ficha con su instructor y su nómina
    const lista = document.getElementById('pt-lista-fichas');
    lista.replaceChildren();
    Object.entries(FICHAS_SISTEMA).forEach(([id, ficha]) => {
      const titular = asignaciones().find(a => a.fichaId === id);
      const fila = document.createElement('li');
      fila.tabIndex = 0;
      fila.dataset.ir = 'sec-estadisticas';

      const nombre = document.createElement('span');
      nombre.className = 'pf-nombre';
      nombre.textContent = 'Ficha ' + id + ' — ' + ficha.modalidad;

      const detalle = document.createElement('span');
      detalle.className = 'pf-detalle';
      detalle.textContent = (titular ? titular.nombre : 'Sin instructor') +
                            ' · ' + vinculados(id).length + ' aprendices';

      fila.append(nombre, detalle);
      lista.appendChild(fila);
    });

    document.getElementById('pt-vinculados').textContent = matriculados;
    document.getElementById('pt-contenidos').textContent =
      listaMateriales().length + listaResultados().length;
  };

  /* ── Reporte de novedades ──
     Listado de seguimiento sobre la nómina real de la
     ficha. No es un aviso emergente ni rota solo. */
  const NOVEDADES = [
    { clase: 'nv-evidencia',  etiqueta: 'Evidencia pendiente',
      detalle: 'No ha cargado AA2-EV02 — Informe de automatización', dias: 1, estado: 'Abierta' },
    { clase: 'nv-desempeno',  etiqueta: 'Bajo desempeño',
      detalle: 'Avance del 38 % en los resultados del trimestre', dias: 2, estado: 'En seguimiento' },
    { clase: 'nv-nivelacion', etiqueta: 'Plan de nivelación',
      detalle: 'Actividad de mejora asignada en Bases de datos', dias: 3, estado: 'En curso' },
    { clase: 'nv-evidencia',  etiqueta: 'Evidencia pendiente',
      detalle: 'Entrega del Taller Python fuera de plazo', dias: 4, estado: 'Abierta' },
    { clase: 'nv-mejora',     etiqueta: 'Actividad de mejora',
      detalle: 'Sustentación de la infografía reprogramada', dias: 5, estado: 'Programada' },
    { clase: 'nv-nivelacion', etiqueta: 'Plan de nivelación',
      detalle: 'Refuerzo en lógica de programación', dias: 6, estado: 'En curso' }
  ];

  const claseEstado = estado =>
    estado === 'Abierta' ? 'status-inactive'
    : estado === 'En seguimiento' ? 'status-closed'
    : 'status-active';

  /* Lo reportado por la instructora se antepone al seguimiento de muestra */
  const claseTipo = tipo =>
    /inasistencia|atenci/i.test(tipo) ? 'nv-desempeno'
    : /comportamiento/i.test(tipo)    ? 'nv-mejora'
    : /nivelaci/i.test(tipo)          ? 'nv-nivelacion'
    : 'nv-evidencia';

  const reportadas = () => {
    if (typeof getNovedades !== 'function') return [];
    return getNovedades()
      .filter(n => n.fichaId === FICHA_EN_CURSO)
      .slice().reverse()
      .map(n => ({ clase: claseTipo(n.tipo), etiqueta: n.tipo, quien: n.aprendiz,
                   detalle: n.detalle, fecha: n.fecha, estado: n.estado }));
  };

  const pintarNovedades = () => {
    const zona = document.getElementById('pt-novedades');
    const nomina = vinculados(FICHA_EN_CURSO);
    zona.replaceChildren();

    if (!nomina.length) {
      const vacio = document.createElement('p');
      vacio.className = 'novedad-vacia';
      vacio.textContent = 'No hay aprendices vinculados a la ficha.';
      zona.appendChild(vacio);
      return;
    }

    const lista = reportadas().concat(
      NOVEDADES.map((n, i) => ({ ...n, quien: nomina[i % nomina.length], fecha: fechaCorta(n.dias) }))
    );

    lista.forEach(novedad => {
      const fila = document.createElement('article');
      fila.className = 'novedad ' + novedad.clase;

      const etiqueta = document.createElement('span');
      etiqueta.className = 'novedad-tipo';
      etiqueta.textContent = novedad.etiqueta;

      const centro = document.createElement('div');
      centro.className = 'novedad-centro';

      const quien = document.createElement('p');
      quien.className = 'novedad-quien';
      quien.textContent = novedad.quien;

      const detalle = document.createElement('p');
      detalle.className = 'novedad-detalle';
      detalle.textContent = novedad.detalle;

      centro.append(quien, detalle);

      const derecha = document.createElement('div');
      derecha.className = 'novedad-derecha';

      const estado = document.createElement('span');
      estado.className = 'badge status-badge ' + claseEstado(novedad.estado);
      estado.textContent = novedad.estado;

      const fecha = document.createElement('span');
      fecha.className = 'novedad-fecha';
      fecha.textContent = novedad.fecha;

      derecha.append(estado, fecha);
      fila.append(etiqueta, centro, derecha);
      zona.appendChild(fila);
    });

    document.getElementById('pt-sello').textContent = lista.length + ' novedades';
  };

  /* ── Cada pantalla y cada acceso llevan a su sección ──
     Se marca lo ya enlazado para no repetir manejadores
     cuando la lista de fichas se vuelve a pintar. */
  const conectarAccesos = raiz => {
    raiz.querySelectorAll('[data-ir]').forEach(pieza => {
      if (pieza.dataset.conectado) return;
      pieza.dataset.conectado = '1';
      const abrir = e => {
        e.stopPropagation();
        const enlace = document.querySelector('[data-view="' + pieza.dataset.ir + '"]');
        if (enlace) enlace.click();
      };
      pieza.addEventListener('click', abrir);
      pieza.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrir(e); }
      });
    });
  };

  pintarFichas();
  pintarNovedades();
  conectarAccesos(tablero);
});
