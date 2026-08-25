/* ══════════════════════════════════════════
   SGMA-ADSO — Cards de módulo

   El módulo ES el contenido: cada card representa un módulo
   del currículo de la ficha y lleva a su contenido. Las que
   están abiertas se pulsan; las cerradas muestran candado.

   Dos formas de usarlas:

     · Una sola, fija:
         <div class="card-modulo" data-modulo="Python"></div>

     · La rejilla con todos los módulos de la ficha:
         <div class="card-modulo-rejilla"></div>

   En ambas se puede forzar la ficha con data-ficha="2" y
   pedir el avance personal con data-progreso.

   La portada sale del catálogo, para que imagen y material
   no se separen nunca.

   Depende de:
     · ficha.js              → FICHA_EN_CURSO
     · embebidos-catalogo.js → EMBEBIDOS, misPuntajes()
     · plan-formativo.js     → getPlanFormativo(), contenidoAsignado()
══════════════════════════════════════════ */

/* Cada módulo tiene su bloque de contenido en «Practicar» */
const ANCLA_MODULO = {
  'Python': 'modulo-python',
  'Java': 'modulo-java',
  'HTML': 'modulo-html',
  'CSS': 'modulo-css',
  'Desarrollo web': 'modulo-web',
  'PHP': 'modulo-php',
  'C': 'modulo-c',
  'C++': 'modulo-cpp',
  'C#': 'modulo-csharp',
  'English': 'modulo-english',
  'Sede Tunja': 'modulo-tunja'
};

function portadaDeModulo(modulo) {
  const primera = EMBEBIDOS.find(a => a.modulo === modulo && a.portada);
  return primera ? primera.portada : '';
}

/* La ficha que mira la card: la del atributo, la de quien
   juega si la página es del aprendiz, o la ficha en curso. */
function fichaDeCard(caja) {
  if (caja.dataset.ficha) return caja.dataset.ficha;
  if (typeof fichaDeQuienJuega === 'function') return fichaDeQuienJuega();
  return FICHA_EN_CURSO;
}

/* Llevar al contenido del módulo. Solo se engancha si el
   bloque existe en esta página: en los paneles del
   instructor y del administrador no está. */
function irAlModulo(modulo) {
  const ancla = ANCLA_MODULO[modulo];
  const bloque = ancla ? document.getElementById(ancla) : null;
  if (!bloque) return false;

  if (typeof showSection === 'function') showSection('sec-ver-eval');
  bloque.scrollIntoView({ behavior: 'smooth', block: 'start' });
  return true;
}

/* ── Una card ── */

function construirCardModulo(modulo, fichaId, conProgreso) {
  const marcas  = typeof misPuntajes === 'function' ? misPuntajes() : {};
  const niveles = contenidoAsignado(fichaId, marcas).filter(a => a.modulo === modulo);
  const enFicha = getPlanFormativo(fichaId).curriculo.indexOf(modulo) !== -1;
  const abierto = niveles.length ? niveles[0].abierto : false;
  const hechos  = niveles.filter(a => a.hecha).length;
  const listos  = niveles.filter(a => a.accesible).length;
  const enlazable = abierto && Boolean(document.getElementById(ANCLA_MODULO[modulo] || ''));

  const card = document.createElement(enlazable ? 'button' : 'div');
  card.className = 'card-modulo ' + (abierto ? 'es-abierto' : 'es-cerrado');
  if (enlazable) {
    card.type = 'button';
    card.addEventListener('click', () => irAlModulo(modulo));
  }

  /* Portada, con la cinta de estado y el candado si toca */
  const portada = portadaDeModulo(modulo);
  if (portada) {
    const marco = document.createElement('span');
    marco.className = 'card-modulo-portada';

    const imagen = document.createElement('img');
    imagen.src = portada;
    imagen.alt = '';
    imagen.loading = 'lazy';
    imagen.addEventListener('error', () => imagen.remove());
    marco.appendChild(imagen);

    if (!abierto) {
      const candado = document.createElement('span');
      candado.className = 'card-modulo-candado';
      candado.textContent = '🔒';
      marco.appendChild(candado);
    }

    const cinta = document.createElement('span');
    cinta.className = 'card-modulo-cinta ' + (abierto ? 'es-si' : 'es-no');
    cinta.textContent = abierto ? 'Disponible' : (enFicha ? 'Bloqueado' : 'Fuera de la ficha');
    marco.appendChild(cinta);

    card.appendChild(marco);
  }

  const cuerpo = document.createElement('span');
  cuerpo.className = 'card-modulo-cuerpo';

  const titulo = document.createElement('span');
  titulo.className = 'card-modulo-titulo';
  titulo.textContent = 'Módulo ' + modulo;

  const detalle = document.createElement('span');
  detalle.className = 'card-modulo-detalle';

  if (!enFicha) {
    detalle.textContent = 'Fuera de la ficha ' + fichaId;
  } else if (!niveles.length) {
    detalle.textContent = 'Sin actividades asignadas';
  } else if (!abierto) {
    detalle.textContent = niveles.length + ' niveles esperando apertura';
  } else if (conProgreso) {
    detalle.textContent = listos + ' de ' + niveles.length + ' abiertos · ' + hechos + ' hechos';
  } else {
    detalle.textContent = niveles.length + ' niveles asignados';
  }

  cuerpo.append(titulo, detalle);

  if (niveles.length && conProgreso) {
    const barra = document.createElement('span');
    barra.className = 'card-modulo-barra';
    const relleno = document.createElement('span');
    relleno.style.width = Math.round(hechos / niveles.length * 100) + '%';
    barra.appendChild(relleno);
    cuerpo.appendChild(barra);
  }

  card.appendChild(cuerpo);
  return card;
}

/* ── Contenedores ── */

/* Card suelta: el contenedor mismo es la card */
function pintarCardModulo(caja) {
  const modulo = caja.dataset.modulo;
  if (!modulo) return;

  const armada = construirCardModulo(modulo, fichaDeCard(caja), caja.hasAttribute('data-progreso'));
  caja.replaceChildren();
  caja.className = armada.className;
  while (armada.firstChild) caja.appendChild(armada.firstChild);
}

/* Rejilla: los módulos del currículo, los abiertos primero.
   Con data-modulos="Python, Java" se limita a esos. */
function pintarRejillaModulos(caja) {
  const fichaId = fichaDeCard(caja);
  const conProgreso = caja.hasAttribute('data-progreso');
  const plan = getPlanFormativo(fichaId);

  const soloEstos = (caja.dataset.modulos || '')
    .split(',')
    .map(m => m.trim())
    .filter(Boolean);

  const delPlan = soloEstos.length
    ? soloEstos.filter(m => plan.curriculo.indexOf(m) !== -1)
    : plan.curriculo;

  caja.replaceChildren();

  if (!delPlan.length) {
    const vacio = document.createElement('p');
    vacio.className = 'card-modulo-vacio';
    vacio.textContent = soloEstos.length
      ? 'El módulo ' + soloEstos.join(', ') + ' no está en la ficha ' + fichaId + '.'
      : 'Todavía no hay módulos asignados a la ficha.';
    caja.appendChild(vacio);
    return;
  }

  const abiertos = delPlan.filter(m => plan.modulos.indexOf(m) !== -1);
  const cerrados = delPlan.filter(m => plan.modulos.indexOf(m) === -1);

  abiertos.concat(cerrados).forEach(modulo => {
    caja.appendChild(construirCardModulo(modulo, fichaId, conProgreso));
  });
}

/* Los niveles de un módulo, para la pantalla del tablero */
function pintarNivelesModulo(caja) {
  const modulo = caja.dataset.niveles;
  if (!modulo) return;

  const fichaId = fichaDeCard(caja);
  const marcas = typeof misPuntajes === 'function' ? misPuntajes() : {};
  const niveles = contenidoAsignado(fichaId, marcas).filter(a => a.modulo === modulo);

  caja.replaceChildren();

  if (!niveles.length) {
    const vacio = document.createElement('p');
    vacio.className = 'card-modulo-vacio';
    vacio.textContent = 'El módulo ' + modulo + ' no tiene actividades asignadas en la ficha ' + fichaId + '.';
    caja.appendChild(vacio);
    return;
  }

  niveles.forEach(actividad => {
    const fila = document.createElement('div');
    fila.className = 'tablero-nivel';

    const marca = document.createElement('span');
    marca.className = 'tablero-nivel-marca';
    marca.textContent = actividad.abierto ? String(actividad.nivel) : '🔒';

    const texto = document.createElement('span');
    texto.className = 'tablero-nivel-texto';

    const titulo = document.createElement('span');
    titulo.className = 'tablero-nivel-titulo';
    titulo.textContent = actividad.titulo;

    const pie = document.createElement('span');
    pie.className = 'tablero-nivel-meta';
    pie.textContent = actividad.tipo + ' · ' + actividad.accion +
      (actividad.puntua ? ' · hasta ' + actividad.maximo + ' pts' : ' · sin puntaje') +
      (actividad.umbral ? ' · cuesta ' + actividad.umbral + ' pts' : '');

    texto.append(titulo, pie);

    const sello = document.createElement('span');
    sello.className = 'badge status-badge ' + (actividad.abierto ? 'status-active' : 'status-closed');
    sello.textContent = actividad.abierto ? 'Abierto' : 'Bloqueado';

    fila.append(marca, texto, sello);
    caja.appendChild(fila);
  });
}

function pintarCardsModulo() {
  document.querySelectorAll('.card-modulo[data-modulo]').forEach(pintarCardModulo);
  document.querySelectorAll('.card-modulo-rejilla').forEach(pintarRejillaModulos);
  document.querySelectorAll('[data-niveles]').forEach(pintarNivelesModulo);
}

/* ── Barra de autocompletado ──
   Predice sobre el catálogo local: los módulos y sus
   actividades. Al elegir, la card de arriba cambia de módulo.

   <div class="autocompletar" data-destino="id-de-la-card">
     <input …><ul …></ul>
   </div>
══════════════════════════════════════════ */

/* Sin tildes y en minúscula: nadie las escribe al buscar */
function normalizarTexto(texto) {
  return String(texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/* Los módulos primero, después sus actividades */
function indiceDeModulos() {
  const indice = [];

  modulosDelCatalogo().forEach(modulo => {
    const cuantas = EMBEBIDOS.filter(a => a.modulo === modulo).length;
    indice.push({
      modulo: modulo,
      etiqueta: 'Módulo ' + modulo,
      detalle: cuantas + ' actividades',
      esModulo: true
    });
  });

  EMBEBIDOS.forEach(actividad => {
    indice.push({
      modulo: actividad.modulo,
      etiqueta: actividad.titulo,
      detalle: actividad.modulo + ' · ' + actividad.tipo,
      esModulo: false
    });
  });

  return indice;
}

/* Los módulos pesan más que las actividades, y empezar por
   lo escrito pesa más que contenerlo en medio. */
function sugerenciasDeModulo(texto, tope) {
  const busca = normalizarTexto(texto).trim();
  if (!busca) return [];

  return indiceDeModulos()
    .map(entrada => {
      const donde = normalizarTexto(entrada.etiqueta).indexOf(busca);
      if (donde === -1) return null;
      return { entrada: entrada, peso: donde + (entrada.esModulo ? 0 : 100) };
    })
    .filter(Boolean)
    .sort((a, b) => a.peso - b.peso)
    .slice(0, tope || 8)
    .map(x => x.entrada);
}

function montarAutocompletar(caja) {
  const campo = caja.querySelector('input');
  const lista = caja.querySelector('ul');
  const destino = document.getElementById(caja.dataset.destino || '');
  if (!campo || !lista) return;

  let marcado = -1;

  function cerrar() {
    lista.replaceChildren();
    lista.hidden = true;
    campo.setAttribute('aria-expanded', 'false');
    marcado = -1;
  }

  function elegir(entrada) {
    campo.value = entrada.etiqueta;
    cerrar();
    if (destino) {
      destino.dataset.modulo = entrada.modulo;
      pintarCardModulo(destino);
    }
  }

  function resaltar() {
    Array.from(lista.children).forEach((nodo, i) => {
      nodo.classList.toggle('es-marcado', i === marcado);
    });
  }

  function abrir() {
    const encontradas = sugerenciasDeModulo(campo.value);
    lista.replaceChildren();

    if (!encontradas.length) {
      cerrar();
      return;
    }

    encontradas.forEach(entrada => {
      const nodo = document.createElement('li');
      nodo.className = 'autocompletar-opcion';
      nodo.setAttribute('role', 'option');

      const titulo = document.createElement('span');
      titulo.className = 'autocompletar-titulo';
      titulo.textContent = entrada.etiqueta;

      const pie = document.createElement('span');
      pie.className = 'autocompletar-detalle';
      pie.textContent = entrada.detalle;

      nodo.append(titulo, pie);
      nodo.addEventListener('mousedown', evento => {
        evento.preventDefault();       // no perder el foco antes del clic
        elegir(entrada);
      });

      lista.appendChild(nodo);
    });

    lista.hidden = false;
    campo.setAttribute('aria-expanded', 'true');
    marcado = -1;
  }

  campo.addEventListener('input', abrir);
  campo.addEventListener('focus', () => { if (campo.value) abrir(); });
  campo.addEventListener('blur', () => setTimeout(cerrar, 120));

  campo.addEventListener('keydown', evento => {
    const cuantas = lista.children.length;

    if (evento.key === 'Escape') { cerrar(); return; }
    if (!cuantas) return;

    if (evento.key === 'ArrowDown') {
      evento.preventDefault();
      marcado = (marcado + 1) % cuantas;
      resaltar();
    } else if (evento.key === 'ArrowUp') {
      evento.preventDefault();
      marcado = (marcado - 1 + cuantas) % cuantas;
      resaltar();
    } else if (evento.key === 'Enter') {
      evento.preventDefault();
      const encontradas = sugerenciasDeModulo(campo.value);
      const elegida = encontradas[marcado === -1 ? 0 : marcado];
      if (elegida) elegir(elegida);
    }
  });
}

/* ── Módulos disponibles: lista fija de tres, con instructor real ── */
const MODULOS_DISPONIBLES = [
  { numero: 1, nombre: 'ADSO — Análisis y Desarrollo de Software', instructor: 'Zulma Salas', rolInstructor: 'instructora', modulo: null },
  { numero: 2, nombre: 'English coding', instructor: 'Alejandra Calixto', rolInstructor: 'teacher', modulo: 'English' },
  { numero: 3, nombre: 'SENA institucional', instructor: null, rolInstructor: '', modulo: 'Sede Tunja' }
];

function pintarModulosDisponibles() {
  const caja = document.getElementById('modulos-disponibles-tarjetas');
  if (!caja) return;

  caja.replaceChildren();
  MODULOS_DISPONIBLES.forEach(item => {
    const enlazable = item.modulo && Boolean(document.getElementById(ANCLA_MODULO[item.modulo] || ''));
    const tarjeta = document.createElement(enlazable ? 'button' : 'div');
    tarjeta.className = 'tarjeta tarjeta-estatica';
    if (enlazable) {
      tarjeta.type = 'button';
      tarjeta.style.cursor = 'pointer';
      tarjeta.addEventListener('click', () => irAlModulo(item.modulo));
    }

    const pie = document.createElement('span');
    pie.className = 'tarjeta-pie';
    const avatar = document.createElement('span');
    avatar.className = 'tarjeta-avatar';
    avatar.textContent = String(item.numero);
    const texto = document.createElement('span');
    texto.className = 'tarjeta-texto';
    const titulo = document.createElement('span');
    titulo.className = 'tarjeta-titulo';
    titulo.textContent = item.numero + ' ' + item.nombre;
    const meta = document.createElement('span');
    meta.className = 'tarjeta-meta';
    meta.textContent = item.instructor ? (item.rolInstructor + ' ' + item.instructor) : 'Aspecto institucional del SENA';
    texto.append(titulo, meta);
    pie.append(avatar, texto);
    tarjeta.appendChild(pie);
    caja.appendChild(tarjeta);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.autocompletar').forEach(montarAutocompletar);
  pintarModulosDisponibles();
});

document.addEventListener('DOMContentLoaded', pintarCardsModulo);

/* Se ponen al día cuando cambia el plan o llega un puntaje */
window.addEventListener('storage', evento => {
  if (evento.key === CLAVE_PLAN || evento.key === CLAVE_PUNTAJES) pintarCardsModulo();
});

window.addEventListener('message', evento => {
  const dato = evento.data;
  if (dato && dato.tipo === 'sgma-puntaje') pintarCardsModulo();
});
