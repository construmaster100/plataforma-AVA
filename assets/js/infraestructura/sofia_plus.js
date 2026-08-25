/* ══════════════════════════════════════════
   SOFIA Plus — Acordeón Sidebar
   SENA CEGAFE · Tunja 2026
══════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

  // ── Identidad: nombre y foto según el rol que ingresó ──
  const datos  = new URLSearchParams(window.location.search);
  const nombre = datos.get('u');
  const pj     = datos.get('pj');

  const campoNombre  = document.getElementById('ses-nombre');
  const fotoCabecera = document.getElementById('perfil-avatar');
  const fotoMenu     = document.getElementById('ses-avatar');

  const ponerFoto = ruta => {
    [fotoCabecera, fotoMenu].forEach(img => { if (img) img.src = ruta; });
  };

  if (campoNombre && nombre) campoNombre.textContent = nombre;

  // El aprendiz llega con el personaje que eligió en el login.
  if (/^pj[1-9]\d?\.png$/.test(pj || '')) ponerFoto('../assets/img/pj/' + pj);

  // ── La ficha de aprendizaje hereda la identidad de quien ingresó ──
  const marcoRA = document.querySelector('.marco-ra');
  if (marcoRA) {
    const indice = datos.get('i');
    if (indice !== null && /^\d+$/.test(indice)) {
      marcoRA.src += '&i=' + indice;
    }
  }

  // ── Cambiar la foto de perfil ──
  const archivo = document.getElementById('perfil-archivo');
  if (archivo) {
    archivo.addEventListener('change', () => {
      const imagen = archivo.files[0];
      if (!imagen || !imagen.type.startsWith('image/')) return;

      const lector = new FileReader();
      lector.addEventListener('load', () => ponerFoto(lector.result));
      lector.readAsDataURL(imagen);
    });
  }

  // ── Panel «Instructor» del aprendiz: quién dicta la ficha real ──
  // Antes decía «Zulma Salas · Ficha 3293836» fijo. Ahora sale de
  // fichaDeQuienJuega() y de quién esté asignado como titular en
  // ese momento.
  const nombreInstructorPanel = document.getElementById('mi-instructor-nombre');
  if (nombreInstructorPanel && typeof fichaDeQuienJuega === 'function' && typeof titularDeFicha === 'function') {
    const fichaId = fichaDeQuienJuega();
    const titular = titularDeFicha(fichaId);
    const ficha = typeof FICHAS_SISTEMA === 'object' ? FICHAS_SISTEMA[fichaId] : null;

    nombreInstructorPanel.textContent = titular ? titular.nombre : 'Sin asignar';

    const campoFicha = document.getElementById('mi-instructor-ficha');
    if (campoFicha) campoFicha.textContent = 'Instructor · Ficha ' + fichaId;

    const campoPrograma = document.getElementById('mi-instructor-programa');
    if (campoPrograma) {
      campoPrograma.textContent = (ficha ? ficha.programa : 'Análisis y Desarrollo de Software') +
        ' · SENA CEGAFE — Regional Boyacá';
    }
  }

  // ── Selector Ficha/Curso del aprendiz: decide a dónde apunta 2.4/3.3 ──
  // No toca el switcher de abajo: solo cambia el data-view de destino
  // antes de que el usuario haga clic, para no duplicar esa lógica.
  const cursoAprendiz = document.getElementById('apr-curso-activo');
  if (cursoAprendiz && typeof getCursoActivo === 'function') {
    const enlaceMaterial = document.getElementById('apr-link-material-aprendizaje');

    const aplicarCursoAprendiz = () => {
      const destino = cursoAprendiz.value === 'english' ? 'sec-prueba-modulo' : 'sec-ver-eval';
      if (enlaceMaterial) enlaceMaterial.setAttribute('data-view', destino);
    };

    cursoAprendiz.value = getCursoActivo();
    cursoAprendiz.addEventListener('change', () => {
      setCursoActivo(cursoAprendiz.value);
      aplicarCursoAprendiz();
    });
    aplicarCursoAprendiz();
  }

  // ── Selector Ficha/Curso del instructor: su propia vista previa (3.4) ──
  // Clave separada de la del aprendiz (getCursoInstructor/setCursoInstructor
  // en ficha.js) — no comparten estado a propósito.
  const cursoInstructor = document.getElementById('ins-curso-activo');
  if (cursoInstructor && typeof getCursoInstructor === 'function') {
    cursoInstructor.value = getCursoInstructor();
    cursoInstructor.addEventListener('change', () => {
      setCursoInstructor(cursoInstructor.value);
      if (typeof pintarPracticaInstructor === 'function') pintarPracticaInstructor();
    });
  }

  // ── Cambio de vista por sección ──
  const disparadores  = document.querySelectorAll('[data-view]');
  // La marca de «vista abierta» vale para el menú lateral y para los
  // accesos del panel derecho del aprendiz.
  const enlacesMenu   = document.querySelectorAll('.submenu a[data-view], .nav-lateral a[data-view]');
  const viewSections  = document.querySelectorAll('.view-section');

  if (disparadores.length) {
    // Mostrar solo sec-home al cargar
    viewSections.forEach(s => s.style.display = 'none');
    const home = document.getElementById('sec-home');
    if (home) home.style.display = 'block';

    disparadores.forEach(disparador => {
      disparador.addEventListener('click', e => {
        e.preventDefault();
        const destino = disparador.getAttribute('data-view');
        const seccion = document.getElementById(destino);
        if (!seccion) return;

        viewSections.forEach(s => s.style.display = 'none');
        seccion.style.display = 'block';

        // La barra de título sigue a lo elegido en el menú
        const barraTitulo = document.getElementById('titulo-vista');
        if (barraTitulo) {
          const propio = seccion.querySelector('.sec-header h1');
          barraTitulo.textContent = propio
            ? propio.textContent.trim()
            : disparador.textContent.trim();
        }

        // Resalta la opción del menú que corresponde a la vista mostrada,
        // aunque el clic haya venido de una tarjeta o un botón.
        enlacesMenu.forEach(l => {
          l.classList.toggle('link-active', l.getAttribute('data-view') === destino);
        });
        window.scrollTo({ top: 0 });
      });
    });
  }

  // ── Seguimiento por ficha ──
  const selFicha = document.getElementById('sel-ficha');
  if (selFicha) {
    const FICHAS = {
      '3293836': {
        programa: 'Análisis y Desarrollo de Software',
        jornada: 'Mañana', estado: 'Lectiva — Trimestre 2', promedio: 68,
        aprendices: [
          ['1055315414', 'Arevalo Otalora, Yesika Paola', 92, 'Al día'],
          ['1029520968', 'Avendaño Ruiz, Sara Valentina', 78, 'Al día'],
          ['1013265363', 'Barreto Soler, Kevin Sair', 64, 'Con pendientes'],
          ['1010121521', 'Bulla Mateus, Luis Eduardo', 38, 'En riesgo']
        ]
      },
      '2': {
        programa: 'Análisis y Desarrollo de Software',
        jornada: 'Por definir', estado: 'Nueva, sin iniciar', promedio: 0,
        aprendices: [
          ['—', 'Aprendiz 1', 0, 'Con pendientes'],
          ['—', 'Aprendiz 2', 0, 'Con pendientes'],
          ['—', 'Aprendiz 3', 0, 'Con pendientes']
        ]
      }
    };

    const claseEstado = estado =>
      estado === 'En riesgo' ? 'status-inactive'
      : estado === 'Con pendientes' ? 'status-closed'
      : 'status-active';

    const resultado = document.getElementById('ficha-resultado');
    const vacio     = document.getElementById('ficha-vacio');
    const cuerpo    = document.getElementById('ficha-aprendices');

    selFicha.addEventListener('change', () => {
      const ficha = FICHAS[selFicha.value];

      if (!ficha) {
        resultado.hidden = true;
        vacio.hidden = false;
        return;
      }

      document.getElementById('ficha-titulo').textContent =
        'Ficha ' + selFicha.value + ' — ' + ficha.programa;
      document.getElementById('ficha-datos').textContent =
        'Jornada: ' + ficha.jornada + ' · Aprendices matriculados: ' + ficha.aprendices.length +
        ' · Avance promedio: ' + ficha.promedio + '%';
      document.getElementById('ficha-estado').textContent = 'Estado de la ficha: ' + ficha.estado;

      cuerpo.replaceChildren();
      ficha.aprendices.forEach(([documento, nombre, avance, estado]) => {
        const fila = document.createElement('tr');

        const celdaDoc = document.createElement('td');
        celdaDoc.textContent = documento;

        const celdaNombre = document.createElement('td');
        celdaNombre.textContent = nombre;

        const celdaAvance = document.createElement('td');
        const barra = document.createElement('div');
        barra.className = 'progress-bar';
        const relleno = document.createElement('div');
        relleno.className = 'progress-fill' + (avance < 50 ? ' low' : avance < 75 ? ' mid' : '');
        relleno.style.width = avance + '%';
        barra.appendChild(relleno);
        const etiqueta = document.createElement('small');
        etiqueta.textContent = avance + '%';
        celdaAvance.append(barra, etiqueta);

        const celdaEstado = document.createElement('td');
        const insignia = document.createElement('span');
        insignia.className = 'status-badge ' + claseEstado(estado);
        insignia.textContent = estado;
        celdaEstado.appendChild(insignia);

        fila.append(celdaDoc, celdaNombre, celdaAvance, celdaEstado);
        cuerpo.appendChild(fila);
      });

      vacio.hidden = true;
      resultado.hidden = false;
    });
  }

  // ── Registro de equipos ──
  const formEquipo = document.getElementById('form-equipo');
  if (formEquipo) {
    formEquipo.addEventListener('submit', e => {
      e.preventDefault();
      const mensaje = document.getElementById('equipo-msg');
      const codigo  = document.getElementById('eq-codigo').value.trim();
      const modelo  = document.getElementById('eq-modelo').value.trim();

      if (!codigo || !modelo) {
        mensaje.textContent = 'El código y el modelo del equipo son obligatorios.';
        mensaje.className = 'login-msg error';
        return;
      }

      mensaje.textContent = 'Equipo ' + codigo + ' registrado en el inventario.';
      mensaje.className = 'login-msg success';
      formEquipo.reset();
    });
  }

  // ── Gestión de usuarios: consultar ficha o aprendiz ──
  const listaFicha = document.getElementById('lst-ficha');
  if (listaFicha) {
    const buscarUsuario = document.getElementById('lst-buscar');
    const resultado = document.getElementById('lst-resultado');

    const FICHAS_ADMIN = {
      '3293836': { programa: 'Análisis y Desarrollo de Software', jornada: 'Mañana',
                   estado: 'Lectiva — Trimestre 2', instructor: 'Zulma Salas' },
      '2':       { programa: 'Análisis y Desarrollo de Software', jornada: 'Por definir',
                   estado: 'Nueva, sin iniciar', instructor: 'Sin asignar' }
    };

    // La ficha en curso usa la nómina real; la nueva, marcadores numerados
    const matriculados = fichaId => {
      if (fichaId === '3293836' && typeof DIRECTORIO === 'object') {
        return DIRECTORIO.aprendices.map(a => ({
          nombre: a.apellidos + ', ' + a.nombres,
          documento: a.documento,
          correo: a.correoInstitucional || a.correoPersonal || '',
          // La contraseña del aprendiz es su nombre de pila (login.js,
          // normalizar(clave) === normalizar(aprendiz.nombre)) — no hay
          // un campo de clave nuevo, se calcula del mismo dato real.
          contrasena: a.nombres.toLowerCase()
        }));
      }
      return Array.from({ length: 20 }, (_, i) => ({
        nombre: 'Aprendiz ' + (i + 1), documento: '—', correo: '', contrasena: '—'
      }));
    };

    const verFicha = () => {
      const id = listaFicha.value;
      const ficha = FICHAS_ADMIN[id];
      const total = matriculados(id).length;

      resultado.replaceChildren();
      const tarjeta = document.createElement('div');
      tarjeta.className = 'notif-card card';
      [['Ficha', id], ['Programa', ficha.programa], ['Jornada', ficha.jornada],
       ['Estado', ficha.estado], ['Instructor', ficha.instructor],
       ['Aprendices matriculados', String(total)]].forEach(([clave, valor]) => {
        const fila = document.createElement('p');
        fila.className = 'dato-fila';
        const rotulo = document.createElement('span');
        rotulo.className = 'dato-clave';
        rotulo.textContent = clave;
        const dato = document.createElement('span');
        dato.textContent = valor;
        fila.append(rotulo, dato);
        tarjeta.appendChild(fila);
      });
      resultado.appendChild(tarjeta);
    };

    const verAprendices = () => {
      const filtro = buscarUsuario.value.trim().toLowerCase();
      const visibles = matriculados(listaFicha.value).filter(a =>
        !filtro || a.nombre.toLowerCase().includes(filtro) || a.documento.includes(filtro));

      resultado.replaceChildren();

      const conteo = document.createElement('p');
      conteo.className = 'repo-conteo';
      conteo.textContent = visibles.length + ' aprendiz(ces) en la ficha ' + listaFicha.value;
      resultado.appendChild(conteo);

      const tabla = document.createElement('table');
      tabla.className = 'table table-hover align-middle data-table';
      tabla.innerHTML = '<thead><tr><th>#</th><th>Aprendiz</th><th>Documento</th><th>Correo</th><th>Contraseña</th></tr></thead>';

      const cuerpo = document.createElement('tbody');
      visibles.forEach((a, i) => {
        const fila = document.createElement('tr');
        [String(i + 1), a.nombre, a.documento, a.correo || '—', a.contrasena || '—'].forEach(valor => {
          const celda = document.createElement('td');
          celda.textContent = valor;
          fila.appendChild(celda);
        });
        cuerpo.appendChild(fila);
      });
      tabla.appendChild(cuerpo);
      resultado.appendChild(tabla);
    };

    document.getElementById('lst-ver-ficha').addEventListener('click', verFicha);
    document.getElementById('lst-ver-aprendiz').addEventListener('click', verAprendices);
    listaFicha.addEventListener('change', verFicha);
    buscarUsuario.addEventListener('input', verAprendices);
    verFicha();
  }

  // ── Sistema de fecha y hora ──
  const calendario = document.getElementById('calendario');
  if (calendario && typeof pintarCalendario === 'function') {
    pintarLineaTiempo(document.getElementById('linea-tiempo'), 12);

    const hoy = new Date();
    let anioVista = hoy.getFullYear();
    let mesVista = hoy.getMonth();

    const tabla = document.getElementById('crono-tabla');
    const conteo = document.getElementById('crono-conteo');

    const listar = (eventos, rotulo) => {
      // Se conservan las siete cabeceras y se reemplazan solo las filas
      while (tabla.children.length > 7) tabla.lastElementChild.remove();

      if (!eventos.length) {
        const vacio = document.createElement('div');
        vacio.className = 'tr-vacio';
        vacio.textContent = 'Sin actividades ' + rotulo + '.';
        tabla.appendChild(vacio);
      }

      eventos.forEach(e => {
        const fecha = document.createElement('div');
        fecha.className = 'tr-fecha';
        fecha.textContent = e.fecha;

        const titulo = document.createElement('div');
        titulo.textContent = e.titulo;

        const tipo = document.createElement('div');
        const insignia = document.createElement('span');
        insignia.className = 'badge status-badge status-active';
        insignia.textContent = ETIQUETA_TIPO[e.tipo] || e.tipo;
        tipo.appendChild(insignia);

        const hora = document.createElement('div');
        hora.textContent = e.hora || '—';

        const lugar = document.createElement('div');
        lugar.textContent = e.lugar || '—';

        const materiales = document.createElement('div');
        materiales.textContent = e.materiales || '—';

        const requisitos = document.createElement('div');
        requisitos.textContent = e.requisitos || '—';

        tabla.append(fecha, titulo, tipo, hora, lugar, materiales, requisitos);
      });

      conteo.textContent = eventos.length + ' actividad(es)';
    };

    const delMes = () => EVENTOS.filter(e => {
      const [a, m] = e.fecha.split('-').map(Number);
      return a === anioVista && m === mesVista + 1;
    });

    const refrescar = () => {
      document.getElementById('cal-titulo').textContent =
        MESES[mesVista].charAt(0).toUpperCase() + MESES[mesVista].slice(1) + ' ' + anioVista;
      pintarCalendario(calendario, anioVista, mesVista, (iso, eventos) =>
        listar(eventos, 'el ' + iso));
      listar(delMes(), 'este mes');
    };

    document.getElementById('cal-antes').addEventListener('click', () => {
      mesVista--;
      if (mesVista < 0) { mesVista = 11; anioVista--; }
      refrescar();
    });
    document.getElementById('cal-despues').addEventListener('click', () => {
      mesVista++;
      if (mesVista > 11) { mesVista = 0; anioVista++; }
      refrescar();
    });
    document.getElementById('cal-hoy-btn').addEventListener('click', () => {
      anioVista = new Date().getFullYear();
      mesVista = new Date().getMonth();
      refrescar();
    });

    refrescar();
  }


  // ── Aprendiz: lo que la administración cargó para su ficha ──
  const cuerpoMatAprendiz = document.getElementById('apr-mat-tbody');
  if (cuerpoMatAprendiz && typeof getMateriales === 'function') {
    const miFicha = FICHA_EN_CURSO;

    const pintarFilas = (cuerpo, filas, columnas, vacio) => {
      cuerpo.replaceChildren();
      if (!filas.length) {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = columnas;
        td.textContent = vacio;
        td.style.color = '#999';
        tr.appendChild(td);
        cuerpo.appendChild(tr);
        return;
      }
      filas.forEach(valores => {
        const tr = document.createElement('tr');
        valores.forEach(v => {
          const td = document.createElement('td');
          td.textContent = v;
          tr.appendChild(td);
        });
        cuerpo.appendChild(tr);
      });
    };

    const materiales = getMateriales(miFicha);
    pintarFilas(cuerpoMatAprendiz, materiales.map(m => [m.nombre, m.tipo, m.fecha]), 3,
                'La administración aún no ha cargado materiales para su ficha.');
    document.getElementById('apr-mat-conteo').textContent = materiales.length + ' materiales';

    const resultados = getResultados(miFicha);
    pintarFilas(document.getElementById('apr-ra-tbody'),
                resultados.map(r => [r.codigo, r.descripcion]), 2,
                'La administración aún no ha definido resultados para su ficha.');
    document.getElementById('apr-ra-conteo').textContent = resultados.length + ' resultados';
  }

  // ── Instructor: ficha que instruye, elegida entre las que le asignaron ──
  const fichaInstructor = document.getElementById('ins-ficha-activa');
  if (fichaInstructor) {
    fichaInstructor.value = getFichaInstructor();

    const filaSimple = valores => {
      const tr = document.createElement('tr');
      valores.forEach(v => {
        const td = document.createElement('td');
        td.textContent = v;
        tr.appendChild(td);
      });
      return tr;
    };

    const vaciar = (cuerpo, mensaje, columnas) => {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = columnas;
      td.textContent = mensaje;
      td.style.color = '#999';
      tr.appendChild(td);
      cuerpo.appendChild(tr);
    };

    const pintarCursoFicha = () => {
      const id = fichaInstructor.value;
      const ficha = FICHAS_SISTEMA[id];
      const materiales = getMateriales(id);
      const resultados = getResultados(id);
      const vinculados = getMatricula(id);

      const datos = document.getElementById('curso-ficha-datos');
      if (datos) {
        datos.replaceChildren();
        [['Ficha', id], ['Programa', ficha.programa], ['Modalidad', ficha.modalidad],
         ['Jornada', ficha.jornada], ['Estado', ficha.estado],
         ['Aprendices vinculados', String(vinculados.length)]].forEach(([clave, valor]) => {
          const linea = document.createElement('p');
          linea.className = 'dato-fila';
          const rotulo = document.createElement('span');
          rotulo.className = 'dato-clave';
          rotulo.textContent = clave;
          const dato = document.createElement('span');
          dato.textContent = valor;
          linea.append(rotulo, dato);
          datos.appendChild(linea);
        });
      }

      const cuerpoMat = document.getElementById('ins-mat-tbody');
      if (cuerpoMat) {
        cuerpoMat.replaceChildren();
        if (!materiales.length) vaciar(cuerpoMat, 'El administrador aún no ha cargado materiales.', 3);
        materiales.forEach(m => cuerpoMat.appendChild(filaSimple([m.nombre, m.tipo, m.fecha])));
        document.getElementById('ins-mat-conteo').textContent = materiales.length + ' materiales';
      }

      const cuerpoRA = document.getElementById('ins-ra-tbody');
      if (cuerpoRA) {
        cuerpoRA.replaceChildren();
        if (!resultados.length) vaciar(cuerpoRA, 'El administrador aún no ha definido resultados.', 2);
        resultados.forEach(r => cuerpoRA.appendChild(filaSimple([r.codigo, r.descripcion])));
        document.getElementById('ins-ra-conteo').textContent = resultados.length + ' resultados';
      }

      const cuerpoVin = document.getElementById('ins-vin-tbody');
      if (cuerpoVin) {
        cuerpoVin.replaceChildren();
        if (!vinculados.length) vaciar(cuerpoVin, 'El administrador aún no ha vinculado aprendices.', 2);
        vinculados.forEach((quien, i) => cuerpoVin.appendChild(filaSimple([String(i + 1), quien])));
        document.getElementById('ins-vin-conteo').textContent = vinculados.length + ' vinculados';
      }
    };

    fichaInstructor.addEventListener('change', () => {
      setFichaInstructor(fichaInstructor.value);
      pintarCursoFicha();
      const selSeguimiento = document.getElementById('sel-ficha');
      if (selSeguimiento) {
        selSeguimiento.value = fichaInstructor.value;
        selSeguimiento.dispatchEvent(new Event('change'));
      }
    });
    pintarCursoFicha();
  }

  // ── Gestión de la ficha: solo el administrador carga y vincula ──
  const fichaMaterial = document.getElementById('mat-ficha');
  if (fichaMaterial) {
    const fila = (valores, alQuitar) => {
      const tr = document.createElement('tr');
      valores.forEach(v => {
        const td = document.createElement('td');
        td.textContent = v;
        tr.appendChild(td);
      });
      const acciones = document.createElement('td');
      const boton = document.createElement('button');
      boton.type = 'button';
      boton.className = 'btn btn-sm btn-table btn-danger';
      boton.textContent = 'Quitar';
      boton.addEventListener('click', alQuitar);
      acciones.appendChild(boton);
      tr.appendChild(acciones);
      return tr;
    };

    // ── Materiales ──
    const pintarMateriales = () => {
      const ficha = fichaMaterial.value;
      const cuerpo = document.getElementById('mat-tbody');
      cuerpo.replaceChildren();
      getMateriales().forEach((m, i) => {
        if (m.ficha !== ficha) return;
        cuerpo.appendChild(fila([m.nombre, m.tipo, m.ficha, m.fecha],
          () => { quitarMaterial(i); pintarMateriales(); }));
      });
      document.getElementById('mat-conteo').textContent =
        getMateriales(ficha).length + ' materiales en la ficha ' + ficha;
    };

    document.getElementById('form-material').addEventListener('submit', e => {
      e.preventDefault();
      const aviso = document.getElementById('mat-msg');
      const nombreMaterial = document.getElementById('mat-nombre').value.trim();
      if (!nombreMaterial) {
        aviso.textContent = 'Indique el nombre del material.';
        aviso.className = 'login-msg error';
        return;
      }
      addMaterial({
        ficha: fichaMaterial.value,
        nombre: nombreMaterial,
        tipo: document.getElementById('mat-tipo').value,
        fecha: new Date().toISOString().slice(0, 10)
      });
      aviso.textContent = 'Material cargado en la ficha ' + fichaMaterial.value + '.';
      aviso.className = 'login-msg success';
      e.target.reset();
      pintarMateriales();
    });
    fichaMaterial.addEventListener('change', pintarMateriales);
    pintarMateriales();

    // ── Resultados de aprendizaje ──
    const fichaRA = document.getElementById('ra-ficha');
    const pintarRA = () => {
      const ficha = fichaRA.value;
      const cuerpo = document.getElementById('ra-tbody');
      cuerpo.replaceChildren();
      getResultados().forEach((r, i) => {
        if (r.ficha !== ficha) return;
        cuerpo.appendChild(fila([r.codigo, r.descripcion, r.ficha],
          () => { quitarResultado(i); pintarRA(); }));
      });
      document.getElementById('ra-conteo').textContent =
        getResultados(ficha).length + ' resultados en la ficha ' + ficha;
    };

    document.getElementById('form-ra').addEventListener('submit', e => {
      e.preventDefault();
      const aviso = document.getElementById('ra-msg');
      const codigo = document.getElementById('ra-codigo').value.trim();
      const descripcion = document.getElementById('ra-desc').value.trim();
      if (!codigo || !descripcion) {
        aviso.textContent = 'El código y la descripción son obligatorios.';
        aviso.className = 'login-msg error';
        return;
      }
      addResultado({ ficha: fichaRA.value, codigo: codigo, descripcion: descripcion });
      aviso.textContent = 'Resultado ' + codigo + ' cargado.';
      aviso.className = 'login-msg success';
      e.target.reset();
      pintarRA();
    });
    fichaRA.addEventListener('change', pintarRA);
    pintarRA();

    // ── Vinculación de aprendices ──
    const fichaVin = document.getElementById('vin-ficha');
    const pintarVinculados = () => {
      const ficha = fichaVin.value;
      const lista = getMatricula(ficha);
      const cuerpo = document.getElementById('vin-tbody');
      cuerpo.replaceChildren();
      lista.forEach((nombreAprendiz, i) => {
        cuerpo.appendChild(fila([String(i + 1), nombreAprendiz], () => {
          const restantes = getMatricula(ficha).filter((_, j) => j !== i);
          setMatricula(ficha, restantes);
          pintarVinculados();
        }));
      });
      document.getElementById('vin-conteo').textContent =
        lista.length + ' vinculados a la ficha ' + ficha;
    };

    document.getElementById('form-vincular').addEventListener('submit', e => {
      e.preventDefault();
      const aviso = document.getElementById('vin-msg');
      const nombreAprendiz = document.getElementById('vin-nombre').value.trim();
      if (!nombreAprendiz) {
        aviso.textContent = 'Escriba el nombre del aprendiz.';
        aviso.className = 'login-msg error';
        return;
      }
      const ficha = fichaVin.value;
      setMatricula(ficha, getMatricula(ficha).concat(nombreAprendiz));
      aviso.textContent = nombreAprendiz + ' vinculado a la ficha ' + ficha + '.';
      aviso.className = 'login-msg success';
      e.target.reset();
      pintarVinculados();
    });

    document.getElementById('vin-cargar-directorio').addEventListener('click', () => {
      if (typeof DIRECTORIO !== 'object') return;
      const ficha = fichaVin.value;
      setMatricula(ficha, DIRECTORIO.aprendices.map(a => a.apellidos + ', ' + a.nombres));
      document.getElementById('vin-msg').textContent =
        DIRECTORIO.total + ' aprendices del directorio vinculados a la ficha ' + ficha + '.';
      document.getElementById('vin-msg').className = 'login-msg success';
      pintarVinculados();
    });

    fichaVin.addEventListener('change', pintarVinculados);
    pintarVinculados();
  }

  // ── Asignar instructor a una ficha ──
  const formInstructor = document.getElementById('form-instructor');
  if (formInstructor) {
    const leerAsignaciones = () => getAsignaciones();
    const guardarAsignaciones = lista => setAsignaciones(lista);

    const pintarAsignaciones = () => {
      const asignadas = leerAsignaciones();
      const cuerpo = document.getElementById('ins-tbody');
      cuerpo.replaceChildren();

      Object.keys(FICHAS_SISTEMA).forEach(fichaId => {
        const titular = asignadas.find(a => a.fichaId === fichaId);
        const fila = document.createElement('tr');

        [fichaId,
         titular ? titular.nombre : 'Sin asignar',
         titular ? titular.documento : '—',
         titular ? titular.jornada : FICHAS_SISTEMA[fichaId].jornada].forEach(valor => {
          const celda = document.createElement('td');
          celda.textContent = valor;
          fila.appendChild(celda);
        });

        const acciones = document.createElement('td');
        if (titular) {
          const liberar = document.createElement('button');
          liberar.type = 'button';
          liberar.className = 'btn btn-sm btn-table btn-danger';
          liberar.textContent = 'Liberar';
          liberar.addEventListener('click', () => {
            guardarAsignaciones(leerAsignaciones().filter(a => a.fichaId !== fichaId));
            pintarAsignaciones();
          });
          acciones.appendChild(liberar);
        }
        fila.appendChild(acciones);
        cuerpo.appendChild(fila);
      });

      document.getElementById('ins-conteo').textContent =
        asignadas.length + ' de ' + Object.keys(FICHAS_SISTEMA).length + ' fichas asignadas';
    };

    formInstructor.addEventListener('submit', e => {
      e.preventDefault();
      const aviso = document.getElementById('ins-msg');
      const nombreInstructor = document.getElementById('ins-nombre').value.trim();
      const documento = document.getElementById('ins-documento').value.trim();
      const fichaId = document.getElementById('ins-ficha').value;

      if (!nombreInstructor || !documento) {
        aviso.textContent = 'El nombre y el documento son obligatorios.';
        aviso.className = 'login-msg error';
        return;
      }

      const previa = leerAsignaciones().find(a => a.fichaId === fichaId);
      if (previa && !confirm('La ficha ' + fichaId + ' ya está a cargo de ' + previa.nombre + '. ¿Reemplazarlo?')) return;

      const restantes = leerAsignaciones().filter(a => a.fichaId !== fichaId);
      restantes.push({
        fichaId: fichaId, nombre: nombreInstructor, documento: documento,
        jornada: document.getElementById('ins-jornada').value,
        // Sin clave queda asignado, pero no puede entrar al panel
        clave: (document.getElementById('ins-clave') || { value: '' }).value.trim(),
        fecha: new Date().toISOString().slice(0, 10)
      });
      guardarAsignaciones(restantes);

      const conClave = (document.getElementById('ins-clave') || { value: '' }).value.trim();
      aviso.textContent = 'Ficha ' + fichaId + ' asignada a ' + nombreInstructor + '.' +
        (conClave
          ? ' Ya puede entrar con su documento y esa clave.'
          : ' Sin clave de ingreso: queda asignado pero todavía no puede entrar al panel.');
      aviso.className = 'login-msg success';
      e.target.reset();
      pintarAsignaciones();
    });

    pintarAsignaciones();
  }

  // ── Crear contenido de evaluación ──
  const formEvaluacion = document.getElementById('form-evaluacion');
  if (formEvaluacion) {
    const CLAVE_EV = 'sgma_evaluaciones';
    const leerEvaluaciones = () => {
      try { return JSON.parse(localStorage.getItem(CLAVE_EV)) || []; }
      catch (e) { return []; }
    };
    const guardarEvaluaciones = lista => {
      try { localStorage.setItem(CLAVE_EV, JSON.stringify(lista)); } catch (e) {}
    };

    const pintarEvaluaciones = () => {
      const lista = leerEvaluaciones();
      const cuerpo = document.getElementById('ev-tbody');
      cuerpo.replaceChildren();

      if (!lista.length) {
        const fila = document.createElement('tr');
        const celda = document.createElement('td');
        celda.colSpan = 7;
        celda.textContent = 'Todavía no se ha creado ninguna evaluación.';
        celda.style.color = '#999';
        fila.appendChild(celda);
        cuerpo.appendChild(fila);
      }

      lista.forEach((ev, i) => {
        const fila = document.createElement('tr');
        [ev.nombre, ev.tipo, ev.ficha, ev.preguntas, ev.ra || '—', ev.cierre || '—'].forEach(valor => {
          const celda = document.createElement('td');
          celda.textContent = valor;
          fila.appendChild(celda);
        });

        const acciones = document.createElement('td');
        const quitar = document.createElement('button');
        quitar.type = 'button';
        quitar.className = 'btn btn-sm btn-table btn-danger';
        quitar.textContent = 'Quitar';
        quitar.addEventListener('click', () => {
          const restantes = leerEvaluaciones();
          restantes.splice(i, 1);
          guardarEvaluaciones(restantes);
          pintarEvaluaciones();
        });
        acciones.appendChild(quitar);
        fila.appendChild(acciones);
        cuerpo.appendChild(fila);
      });

      document.getElementById('ev-conteo').textContent = lista.length + ' evaluaciones';
    };

    formEvaluacion.addEventListener('submit', e => {
      e.preventDefault();
      const aviso = document.getElementById('ev-msg');
      const nombreEv = document.getElementById('ev-nombre').value.trim();

      if (!nombreEv) {
        aviso.textContent = 'Indique el nombre de la evaluación.';
        aviso.className = 'login-msg error';
        return;
      }

      guardarEvaluaciones(leerEvaluaciones().concat({
        nombre: nombreEv,
        tipo: document.getElementById('ev-tipo').value,
        ficha: document.getElementById('ev-ficha').value,
        preguntas: document.getElementById('ev-preguntas').value,
        ra: document.getElementById('ev-ra').value.trim(),
        cierre: document.getElementById('ev-cierre').value
      }));

      aviso.textContent = 'Evaluación «' + nombreEv + '» creada.';
      aviso.className = 'login-msg success';
      e.target.reset();
      pintarEvaluaciones();
    });

    pintarEvaluaciones();
  }

  // ── Crear curso ──
  const formCurso = document.getElementById('form-curso');
  if (formCurso) {
    const MODALIDAD = { virtual: 'Virtual', tecnico: 'Técnico', tecnologo: 'Tecnólogo' };
    const cuerpoCursos = document.getElementById('curso-tbody');
    const cursos = [
      ['Análisis y Desarrollo de Software', 'Tecnólogo', '3293836', '24 meses', '27', 'Zulma Salas'],
      ['Análisis y Desarrollo de Software', 'Tecnólogo', '2', '24 meses', '20', 'Sin asignar']
    ];

    const pintarCursos = () => {
      cuerpoCursos.replaceChildren();
      cursos.forEach(fila => {
        const tr = document.createElement('tr');
        fila.forEach(valor => {
          const td = document.createElement('td');
          td.textContent = valor;
          tr.appendChild(td);
        });
        cuerpoCursos.appendChild(tr);
      });
    };

    formCurso.addEventListener('submit', e => {
      e.preventDefault();
      const aviso = document.getElementById('curso-msg');
      const nombreCurso = document.getElementById('curso-nombre').value.trim();

      if (!nombreCurso) {
        aviso.textContent = 'El nombre del curso es obligatorio.';
        aviso.className = 'login-msg error';
        return;
      }

      cursos.push([
        nombreCurso,
        MODALIDAD[document.getElementById('curso-modalidad').value],
        document.getElementById('curso-ficha').value.trim() || 'Por asignar',
        document.getElementById('curso-duracion').value + ' meses',
        document.getElementById('curso-cupo').value,
        document.getElementById('curso-instructor').value.trim() || 'Sin asignar'
      ]);

      aviso.textContent = 'Curso «' + nombreCurso + '» creado.';
      aviso.className = 'login-msg success';
      formCurso.reset();
      pintarCursos();
    });

    pintarCursos();
  }

  // ── Ingreso de usuarios en tiempo real ──
  const cuerpoLive = document.getElementById('live-tbody');
  if (cuerpoLive) {
    const sello = document.getElementById('live-sello');
    const PERSONAS = [
      ['Aprendiz 3', 'Aprendiz', '3293836'], ['Zulma Salas', 'Instructor', '3293836'],
      ['Aprendiz 11', 'Aprendiz', '3293836'], ['Aprendiz 5', 'Aprendiz', '3293836'],
      ['M.A. Castro P.', 'Administrador', '—'], ['Aprendiz 18', 'Aprendiz', '3293836']
    ];
    const EVENTOS = ['Inicio de sesión', 'Cierre de sesión', 'Entrega de evidencia', 'Consulta de material'];
    const CLASE = { Aprendiz: 'role-aprendiz', Instructor: 'role-instructor', Administrador: 'role-admin' };

    const registrar = () => {
      const [quien, rol, ficha] = PERSONAS[Math.floor(Math.random() * PERSONAS.length)];
      const fila = document.createElement('tr');

      const hora = document.createElement('td');
      hora.textContent = new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      const usuario = document.createElement('td');
      usuario.textContent = quien;

      const celdaRol = document.createElement('td');
      const insignia = document.createElement('span');
      insignia.className = 'badge role-badge ' + CLASE[rol];
      insignia.textContent = rol;
      celdaRol.appendChild(insignia);

      const celdaFicha = document.createElement('td');
      celdaFicha.textContent = ficha;

      const evento = document.createElement('td');
      evento.textContent = EVENTOS[Math.floor(Math.random() * EVENTOS.length)];

      fila.append(hora, usuario, celdaRol, celdaFicha, evento);
      cuerpoLive.prepend(fila);
      while (cuerpoLive.children.length > 12) cuerpoLive.lastElementChild.remove();

      sello.textContent = 'Actualizado ' + hora.textContent;
    };

    registrar();
    setInterval(registrar, 5000);
  }

  // ── Directorio de aprendices de la ficha ──
  const cuerpoDir = document.getElementById('dir-tbody');
  if (cuerpoDir && typeof DIRECTORIO === 'object') {
    const fichaDir = document.getElementById('dir-ficha');
    const buscar  = document.getElementById('dir-buscar');
    const conteo  = document.getElementById('dir-conteo');
    const sinDatos = document.getElementById('dir-vacio');
    const modalAprendiz = new bootstrap.Modal(document.getElementById('modalAprendiz'));

    const celda = (texto, clase) => {
      const td = document.createElement('td');
      td.textContent = texto || '—';
      if (clase) td.className = clase;
      return td;
    };

    const detalle = aprendiz => {
      const campos = [
        ['Documento', aprendiz.documento],
        ['Fecha de nacimiento', aprendiz.nacimiento],
        ['Tipo de sangre', aprendiz.rh],
        ['Celular', aprendiz.celular],
        ['Correo institucional', aprendiz.correoInstitucional],
        ['Correo personal', aprendiz.correoPersonal],
        ['Dirección de residencia', aprendiz.direccion],
        ['Acudiente', aprendiz.acudiente],
        ['Parentesco', aprendiz.parentesco],
        ['Dirección del acudiente', aprendiz.direccionAcudiente],
        ['Celular del acudiente', aprendiz.celularAcudiente],
        ['Correo del acudiente', aprendiz.correoAcudiente]
      ];

      const contenedor = document.getElementById('aprendiz-detalle');
      contenedor.replaceChildren();
      campos.forEach(([rotulo, valor]) => {
        const fila = document.createElement('p');
        fila.className = 'dato-fila';
        const clave = document.createElement('span');
        clave.className = 'dato-clave';
        clave.textContent = rotulo;
        const dato = document.createElement('span');
        dato.textContent = valor || 'No registra';
        fila.append(clave, dato);
        contenedor.appendChild(fila);
      });

      document.getElementById('aprendiz-titulo').textContent =
        aprendiz.apellidos + ', ' + aprendiz.nombres;
      modalAprendiz.show();
    };

    // La ficha nueva no tiene matriculados: se muestra con marcadores
    const nomina = () => {
      if (!fichaDir || fichaDir.value === '3293836') return DIRECTORIO.aprendices;
      return Array.from({ length: 20 }, (_, i) => ({
        nombres: 'Aprendiz', apellidos: String(i + 1), documento: '—',
        celular: '', correoInstitucional: '', correoPersonal: '',
        rh: '', nacimiento: '', direccion: '', acudiente: '',
        parentesco: '', direccionAcudiente: '', celularAcudiente: '', correoAcudiente: ''
      }));
    };

    const pintarDirectorio = () => {
      const filtro = buscar.value.trim().toLowerCase();
      const visibles = nomina().filter(a =>
        !filtro ||
        (a.apellidos + ' ' + a.nombres).toLowerCase().includes(filtro) ||
        a.documento.includes(filtro) ||
        (a.correoInstitucional || '').toLowerCase().includes(filtro) ||
        (a.correoPersonal || '').toLowerCase().includes(filtro));

      cuerpoDir.replaceChildren();
      visibles.forEach((aprendiz, indice) => {
        const fila = document.createElement('tr');

        const nombre = document.createElement('td');
        nombre.innerHTML = '<strong></strong>';
        nombre.firstChild.textContent = aprendiz.apellidos + ', ' + aprendiz.nombres;

        const acciones = document.createElement('td');
        const boton = document.createElement('button');
        boton.type = 'button';
        boton.className = 'btn btn-sm btn-table';
        boton.textContent = 'Ver ficha';
        boton.addEventListener('click', () => detalle(aprendiz));
        acciones.appendChild(boton);

        fila.append(
          celda(String(indice + 1)),
          nombre,
          celda(aprendiz.documento),
          celda(aprendiz.celular),
          celda(aprendiz.correoInstitucional),
          acciones);
        cuerpoDir.appendChild(fila);
      });

      conteo.textContent = visibles.length + ' de ' + nomina().length + ' aprendices';
      sinDatos.hidden = visibles.length > 0;
    };

    buscar.addEventListener('input', pintarDirectorio);
    if (fichaDir) fichaDir.addEventListener('change', pintarDirectorio);
    pintarDirectorio();
  }

  // ── Repositorio documental de la ficha ──
  const arbol = document.getElementById('repo-arbol');
  if (arbol && typeof REPOSITORIO === 'object') {
    const rolPagina = window.location.pathname.split('/').pop().replace('.html', '');
    const fasesDelRol = REPOSITORIO.fases.filter(f => f.roles.includes(rolPagina));

    const campoBuscar = document.getElementById('repo-buscar');
    const campoTipo   = document.getElementById('repo-tipo');
    const conteo      = document.getElementById('repo-conteo');
    const vacio       = document.getElementById('repo-vacio');

    const extension = nombre => (nombre.split('.').pop() || '').toLowerCase();

    const enlace = (carpeta, nombre) => {
      const ruta = REPOSITORIO.base + (carpeta ? carpeta + '/' : '') + nombre;
      const a = document.createElement('a');
      a.href = encodeURI(ruta);
      a.target = '_blank';
      a.rel = 'noopener';
      a.className = 'repo-doc';

      const tipo = document.createElement('span');
      tipo.className = 'repo-tipo tipo-' + extension(nombre);
      tipo.textContent = extension(nombre).toUpperCase().slice(0, 4);

      const texto = document.createElement('span');
      texto.className = 'repo-nombre';
      texto.textContent = nombre;

      a.append(tipo, texto);
      return a;
    };

    const pintar = () => {
      const busqueda = campoBuscar.value.trim().toLowerCase();
      const tipo = campoTipo.value;
      arbol.replaceChildren();
      let mostrados = 0;

      fasesDelRol.forEach(fase => {
        const carpetas = [];

        fase.carpetas.forEach(carpeta => {
          const archivos = carpeta.archivos.filter(nombre =>
            (!busqueda || nombre.toLowerCase().includes(busqueda)) &&
            (!tipo || extension(nombre) === tipo));
          if (archivos.length) carpetas.push({ ruta: carpeta.ruta, archivos: archivos });
        });

        const encontrados = carpetas.reduce((n, c) => n + c.archivos.length, 0);
        if (!encontrados) return;
        mostrados += encontrados;

        const bloqueFase = document.createElement('details');
        bloqueFase.className = 'repo-fase';
        // Al filtrar conviene ver los resultados sin tener que desplegar
        bloqueFase.open = Boolean(busqueda || tipo);

        const tituloFase = document.createElement('summary');
        tituloFase.innerHTML = '<span class="repo-fase-nombre"></span>' +
                               '<span class="repo-badge"></span>';
        tituloFase.querySelector('.repo-fase-nombre').textContent = fase.nombre;
        tituloFase.querySelector('.repo-badge').textContent = encontrados;
        bloqueFase.appendChild(tituloFase);

        carpetas.forEach(carpeta => {
          const bloque = document.createElement('details');
          bloque.className = 'repo-carpeta';
          bloque.open = Boolean(busqueda || tipo);

          const titulo = document.createElement('summary');
          // Se omite la fase: ya la nombra el bloque contenedor
          const etiqueta = carpeta.ruta.split('/').slice(1).join(' › ') || 'Raíz de la ficha';
          titulo.innerHTML = '<span class="repo-carpeta-nombre"></span>' +
                             '<span class="repo-badge"></span>';
          titulo.querySelector('.repo-carpeta-nombre').textContent = etiqueta;
          titulo.querySelector('.repo-badge').textContent = carpeta.archivos.length;
          bloque.appendChild(titulo);

          const lista = document.createElement('div');
          lista.className = 'repo-lista';
          carpeta.archivos.forEach(nombre => lista.appendChild(enlace(carpeta.ruta, nombre)));
          bloque.appendChild(lista);

          bloqueFase.appendChild(bloque);
        });

        arbol.appendChild(bloqueFase);
      });

      conteo.textContent = mostrados + (mostrados === 1 ? ' documento' : ' documentos');
      vacio.hidden = mostrados > 0;
    };

    campoBuscar.addEventListener('input', pintar);
    campoTipo.addEventListener('change', pintar);
    pintar();
  }

  // ── Aparición progresiva de las imágenes diferidas ──
  document.querySelectorAll('img[loading="lazy"]').forEach(img => {
    if (img.complete) return;
    img.classList.add('img-entra');
    img.addEventListener('load', () => img.classList.add('img-lista'), { once: true });
    img.addEventListener('error', () => img.classList.add('img-lista'), { once: true });
  });

  // ── Contenido del curso: secciones plegables ──
  const curso = document.getElementById('curso-wrap');
  if (curso) {
    const secciones = curso.querySelectorAll('.curso-seccion');
    const botonColapsar = document.getElementById('curso-colapsar');

    curso.querySelectorAll('.curso-cabecera').forEach(cabecera => {
      cabecera.addEventListener('click', () => {
        cabecera.parentElement.classList.toggle('abierta');
      });
    });

    botonColapsar.addEventListener('click', () => {
      const hayAbiertas = [...secciones].some(s => s.classList.contains('abierta'));
      secciones.forEach(s => s.classList.toggle('abierta', !hayAbiertas));
      botonColapsar.textContent = hayAbiertas ? 'Expandir todo' : 'Colapsar todo';
    });
  }

  // ── Bandeja de correo: historias ──
  const pista = document.getElementById('historias-pista');
  if (pista) {
    document.querySelectorAll('[data-historias]').forEach(boton => {
      boton.addEventListener('click', () => {
        pista.scrollBy({ left: 150 * Number(boton.dataset.historias), behavior: 'smooth' });
      });
    });

    const visor = document.getElementById('modalHistoria');
    const modalHistoria = new bootstrap.Modal(visor);

    pista.querySelectorAll('.historia').forEach(historia => {
      historia.addEventListener('click', () => {
        // La historia propia usa la foto de perfil vigente
        const ruta = historia.dataset.historia
          || historia.querySelector('img').src;
        document.getElementById('historia-imagen').src = ruta;
        document.getElementById('historia-titulo').textContent = historia.dataset.nombre;
        modalHistoria.show();
      });
    });

    // Mantiene la historia propia sincronizada con la foto de perfil
    const miniatura = document.getElementById('historia-propia-img');
    if (miniatura && fotoCabecera) {
      new MutationObserver(() => { miniatura.src = fotoCabecera.src; })
        .observe(fotoCabecera, { attributes: true, attributeFilter: ['src'] });
      miniatura.src = fotoCabecera.src;
    }
  }

  // ── Mensajería entre roles: chat de la bandeja de correo ──
  // Persistido de verdad en mensajeria.js (sgma_chat), con tope de
  // 50 caracteres — entre pestañas del mismo navegador llega al
  // instante por el evento «storage».
  const formChat = document.getElementById('chat-form');
  if (formChat && typeof enviarMensajeChat === 'function') {
    const hilo  = document.getElementById('chat-hilo');
    const campo = document.getElementById('chat-texto');

    const pintarHilo = () => {
      const yo = yoSoy();
      hilo.replaceChildren();
      getChat().forEach(mensaje => {
        const mio = mensaje.de === yo.nombre && mensaje.deRol === yo.rol;

        const burbuja = document.createElement('div');
        burbuja.className = 'chat-burbuja ' + (mio ? 'chat-enviado' : 'chat-recibido');

        if (!mio) {
          const quien = document.createElement('span');
          quien.className = 'chat-quien';
          quien.textContent = mensaje.de;
          burbuja.appendChild(quien);
        }

        const parrafo = document.createElement('p');
        parrafo.textContent = mensaje.texto;

        const hora = document.createElement('span');
        hora.className = 'chat-hora';
        hora.textContent = horaCorta(mensaje.fecha);

        burbuja.append(parrafo, hora);
        hilo.appendChild(burbuja);
      });
      hilo.scrollTop = hilo.scrollHeight;
    };

    formChat.addEventListener('submit', e => {
      e.preventDefault();
      if (!enviarMensajeChat(campo.value)) return;
      campo.value = '';
      pintarHilo();
    });

    window.addEventListener('storage', evento => {
      if (evento.key === CLAVE_CHAT) pintarHilo();
    });

    pintarHilo();
  }

  const botones = document.querySelectorAll('.sidebar-menu button.menu-btn');

  botones.forEach(btn => {
    btn.addEventListener('click', () => {
      const estaAbierto = btn.getAttribute('aria-expanded') === 'true';

      // Cerrar todos los demás (comportamiento acordeón: solo uno abierto)
      botones.forEach(otro => {
        otro.setAttribute('aria-expanded', 'false');
        otro.closest('li').classList.remove('active');
        const sub = otro.nextElementSibling;
        if (sub) {
          sub.style.maxHeight = null;
          sub.style.opacity  = '0';
        }
      });

      // Si no estaba abierto, abrir este
      if (!estaAbierto) {
        btn.setAttribute('aria-expanded', 'true');
        btn.closest('li').classList.add('active');
        const submenu = btn.nextElementSibling;
        if (submenu) {
          submenu.style.maxHeight = submenu.scrollHeight + 'px';
          submenu.style.opacity   = '1';
        }
      }
    });
  });

});
