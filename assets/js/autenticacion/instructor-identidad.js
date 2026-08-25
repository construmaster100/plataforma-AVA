/* ══════════════════════════════════════════
   SGMA-ADSO — Quién es el instructor que entró

   El panel del instructor lo usan tres personas distintas.
   El documento llega en la URL desde el ingreso (?doc=) y
   con él se decide qué puede tocar cada una:

     · La ficha 3293836 es exclusiva de su titular, Zulma
       Salas. Los demás la consultan; no la editan.
     · Las fichas N las edita cualquier instructor reconocido.
     · Los módulos formativos los puede crear cualquiera, y
       cada uno queda a cargo de quien se le asigne.

   Sin backend esto no es seguridad, es reparto de trabajo:
   deja claro de quién es cada cosa y evita pisadas. El
   control real necesita servidor (ver el documento).

   Depende de:
     · ficha.js → INSTRUCTORES, buscarInstructor(), titularDeFicha(), puedeEditarFicha()
══════════════════════════════════════════ */

/* El instructor de esta sesión, deducido del documento */
function instructorActual() {
  const doc = new URLSearchParams(window.location.search).get('doc');
  const encontrado = buscarInstructor(doc);
  if (encontrado) return encontrado;

  /* Sin documento en la URL se asume el titular del programa,
     para que el panel siga siendo usable al abrirlo suelto. */
  return INSTRUCTORES[0];
}

/* ¿Puede el instructor de esta sesión editar esta ficha? */
function puedoEditar(fichaId) {
  return puedeEditarFicha(fichaId, instructorActual().documento);
}

/* Aviso visible cuando la ficha no es suya */
function avisoDeExclusividad(fichaId) {
  const titular = titularDeFicha(fichaId);
  const yo = instructorActual();
  if (!titular) return 'La ficha ' + fichaId + ' no tiene instructor titular asignado.';
  return 'El contenido formativo de la ficha ' + fichaId + ' es exclusivo de ' +
         titular.nombre + '. Entraste como ' + yo.nombre + ', así que puedes consultarlo pero no editarlo.';
}

/* ── Pintado ── */

/* Cédula del instructor, junto al nombre que ya muestra #ses-nombre —
   no se repite el nombre aquí para no duplicar la misma identidad dos
   veces en la barra lateral. */
function pintarIdentidadInstructor() {
  const caja = document.getElementById('ins-quien');
  if (!caja) return;
  caja.textContent = 'C.C. ' + instructorActual().documento;
}

/* Bloquea o suelta los controles de la ficha elegida */
function aplicarExclusividad() {
  const selFicha = document.getElementById('ac-ficha');
  const fichaId = selFicha ? selFicha.value : FICHA_EN_CURSO;
  const puedo = puedoEditar(fichaId);

  const seccion = document.getElementById('sec-plan-formativo');
  if (seccion) {
    seccion.classList.toggle('es-solo-lectura', !puedo);
    seccion.querySelectorAll('input, button, select').forEach(campo => {
      if (campo.id === 'ac-ficha') return;          // cambiar de ficha siempre se puede
      campo.disabled = !puedo;
    });
  }

  const aviso = document.getElementById('ac-exclusiva');
  if (aviso) {
    aviso.textContent = puedo ? '' : avisoDeExclusividad(fichaId);
    aviso.hidden = puedo;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (typeof INSTRUCTORES === 'undefined') return;

  pintarIdentidadInstructor();

  const selFicha = document.getElementById('ac-ficha');
  if (!selFicha) return;

  /* Se aplica al arrancar y cada vez que cambia la ficha.
     El setTimeout deja que asignar-contenido.js repinte
     primero: si no, se bloquearían controles que aún no
     existen. */
  const aplicar = () => setTimeout(aplicarExclusividad, 0);
  selFicha.addEventListener('change', aplicar);
  document.addEventListener('click', evento => {
    if (evento.target.closest('#sec-plan-formativo')) aplicar();
  });
  aplicar();
});
