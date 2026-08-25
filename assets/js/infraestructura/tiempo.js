/* ══════════════════════════════════════════
   SGMA-ADSO — Sistema de fecha y hora
   Reloj, calendario y línea de tiempo de la ficha.
   Todo se dibuja sobre rejillas CSS.
══════════════════════════════════════════ */

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
               'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

/* Fases de la formación: alimentan la línea de tiempo */
const FASES = [
  { nombre: 'Inducción',        inicio: '2026-02-01', fin: '2026-03-15', tono: 'fase-1' },
  { nombre: 'Análisis',         inicio: '2026-03-16', fin: '2026-06-30', tono: 'fase-2' },
  { nombre: 'Planeación',       inicio: '2026-07-01', fin: '2026-09-30', tono: 'fase-3' },
  { nombre: 'Construcción',     inicio: '2026-10-01', fin: '2026-12-15', tono: 'fase-4' },
  { nombre: 'Evaluación',       inicio: '2026-12-16', fin: '2027-01-31', tono: 'fase-5' }
];

/* Eventos con fecha: se marcan en el calendario y se listan en la tabla.
   hora/lugar/materiales/requisitos son reales sobre lo que ya declara
   el resto del sitio (ambientes de sesiones.js, materiales de
   ficha.js, requisitos de requisitos.js) — no se inventan datos nuevos. */
const EVENTOS = [
  { fecha: '2026-08-05', titulo: 'Sesión en línea — bienvenida al trimestre', tipo: 'sesion',
    hora: '08:00', lugar: 'Sala de sistemas 3', materiales: 'Guía de aprendizaje 1 — Análisis de requisitos', requisitos: 'Equipo de cómputo, conexión a internet' },
  { fecha: '2026-08-12', titulo: 'Entrega AA1-EV03 — Informe de modelado', tipo: 'entrega',
    hora: '10:00', lugar: 'Virtual — Sofia Plus', materiales: 'Plantilla de informe técnico', requisitos: 'Cuenta activa en Sofia Plus' },
  { fecha: '2026-08-18', titulo: 'Cuestionario AA2-EV01 — Macros en Excel', tipo: 'evaluacion',
    hora: '09:00', lugar: 'Sala de sistemas 3', materiales: 'Modelado UML con StarUML', requisitos: 'Equipo de cómputo, navegador actualizado' },
  { fecha: '2026-08-21', titulo: 'Sesión en línea — bases de datos', tipo: 'sesion',
    hora: '08:00', lugar: 'Sala de sistemas 2', materiales: 'Guía de aprendizaje 1 — Análisis de requisitos', requisitos: 'Equipo de cómputo, conexión a internet' },
  { fecha: '2026-08-28', titulo: 'Cierre Taller Python — Estructuras', tipo: 'entrega',
    hora: '14:00', lugar: 'Virtual — Sofia Plus', materiales: 'Plantilla de informe técnico', requisitos: 'Correo institucional habilitado' },
  { fecha: '2026-08-31', titulo: 'Cierre de todas las actividades del mes', tipo: 'cierre',
    hora: '17:00', lugar: 'Virtual — Sofia Plus', materiales: '—', requisitos: 'Carné de aprendiz vigente' },
  { fecha: '2026-09-04', titulo: 'Apertura fase de planeación', tipo: 'sesion',
    hora: '08:00', lugar: 'Sala de sistemas 3', materiales: 'Modelado UML con StarUML', requisitos: 'Equipo de cómputo, conexión a internet' },
  { fecha: '2026-09-15', titulo: 'Evaluación Módulo 2 — Modelo de datos', tipo: 'evaluacion',
    hora: '09:00', lugar: 'Sala de sistemas 2', materiales: 'Plantilla de informe técnico', requisitos: 'Navegador actualizado (Chrome, Edge o Firefox)' },
  { fecha: '2026-09-30', titulo: 'Cierre Proyecto Integrador — avance 1', tipo: 'cierre',
    hora: '17:00', lugar: 'Virtual — Sofia Plus', materiales: '—', requisitos: 'Carné de aprendiz vigente' }
];

const ETIQUETA_TIPO = {
  sesion: 'Sesión', entrega: 'Entrega', evaluacion: 'Evaluación', cierre: 'Cierre'
};

/* ── Calendario mensual en rejilla de 7 columnas ── */
function pintarCalendario(contenedor, anio, mes, alElegirDia) {
  if (!contenedor) return;
  contenedor.replaceChildren();

  DIAS.forEach(dia => {
    const celda = document.createElement('div');
    celda.className = 'cal-dia-nombre';
    celda.textContent = dia;
    contenedor.appendChild(celda);
  });

  const primero = new Date(anio, mes, 1);
  // getDay() da 0 para domingo; la semana del calendario empieza en lunes
  const desplazamiento = (primero.getDay() + 6) % 7;
  const diasDelMes = new Date(anio, mes + 1, 0).getDate();
  const hoy = new Date();

  for (let i = 0; i < desplazamiento; i++) {
    const vacia = document.createElement('div');
    vacia.className = 'cal-celda cal-vacia';
    contenedor.appendChild(vacia);
  }

  for (let dia = 1; dia <= diasDelMes; dia++) {
    const iso = [anio, String(mes + 1).padStart(2, '0'), String(dia).padStart(2, '0')].join('-');
    const delDia = EVENTOS.filter(e => e.fecha === iso);

    const celda = document.createElement('button');
    celda.type = 'button';
    celda.className = 'cal-celda';
    if (delDia.length) celda.classList.add('cal-con-evento');
    if (anio === hoy.getFullYear() && mes === hoy.getMonth() && dia === hoy.getDate()) {
      celda.classList.add('cal-hoy');
    }

    const numero = document.createElement('span');
    numero.className = 'cal-numero';
    numero.textContent = dia;
    celda.appendChild(numero);

    if (delDia.length) {
      const puntos = document.createElement('span');
      puntos.className = 'cal-puntos';
      delDia.forEach(e => {
        const punto = document.createElement('i');
        punto.className = 'cal-punto punto-' + e.tipo;
        punto.title = e.titulo;
        puntos.appendChild(punto);
      });
      celda.appendChild(puntos);
    }

    celda.addEventListener('click', () => {
      contenedor.querySelectorAll('.cal-celda').forEach(c => c.classList.remove('cal-activa'));
      celda.classList.add('cal-activa');
      if (alElegirDia) alElegirDia(iso, delDia);
    });

    contenedor.appendChild(celda);
  }
}

/* ── Línea de tiempo: cada fase ocupa las columnas de sus meses ── */
function pintarLineaTiempo(contenedor, mesesTotales) {
  if (!contenedor) return;
  contenedor.replaceChildren();

  const arranque = new Date(FASES[0].inicio);
  const columnaDe = fecha => {
    const d = new Date(fecha);
    return (d.getFullYear() - arranque.getFullYear()) * 12 + (d.getMonth() - arranque.getMonth()) + 1;
  };

  contenedor.style.gridTemplateColumns = 'repeat(' + mesesTotales + ', minmax(58px, 1fr))';

  for (let i = 0; i < mesesTotales; i++) {
    const mes = new Date(arranque.getFullYear(), arranque.getMonth() + i, 1);
    const rotulo = document.createElement('div');
    rotulo.className = 'lt-mes';
    rotulo.style.gridColumn = (i + 1) + ' / ' + (i + 2);
    rotulo.textContent = MESES[mes.getMonth()].slice(0, 3) + ' ' + String(mes.getFullYear()).slice(2);
    contenedor.appendChild(rotulo);
  }

  FASES.forEach((fase, fila) => {
    const barra = document.createElement('div');
    barra.className = 'lt-fase ' + fase.tono;
    barra.style.gridColumn = columnaDe(fase.inicio) + ' / ' + (columnaDe(fase.fin) + 1);
    barra.style.gridRow = (fila + 2);
    barra.textContent = fase.nombre;
    barra.title = fase.nombre + ': ' + fase.inicio + ' a ' + fase.fin;
    contenedor.appendChild(barra);
  });

  // Marca del día actual sobre la columna del mes en curso
  const hoy = new Date();
  const columnaHoy = (hoy.getFullYear() - arranque.getFullYear()) * 12 +
                     (hoy.getMonth() - arranque.getMonth()) + 1;
  if (columnaHoy >= 1 && columnaHoy <= mesesTotales) {
    const marca = document.createElement('div');
    marca.className = 'lt-hoy';
    marca.style.gridColumn = columnaHoy + ' / ' + (columnaHoy + 1);
    marca.style.gridRow = '2 / ' + (FASES.length + 2);
    marca.title = 'Mes en curso';
    contenedor.appendChild(marca);
  }
}
