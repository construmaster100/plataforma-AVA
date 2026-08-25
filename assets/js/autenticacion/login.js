/* ══════════════════════════════════════════
   SGMA-ADSO — Ingreso por rol
   SENA CEGAFE · Tunja 2026

   Tres caminos:
   · Aprendiz    — solo los nombres de la nómina de la ficha
                   3293836. La clave son sus dos primeros
                   nombres en minúscula. Tras validar, queda
                   registrado como participante de SENAEnglish
                   (pages/quiz.html) con un color asignado
                   automáticamente, antes de entrar.
   · Instructor  — documento y clave.
   · Administrador — no es una opción del selector: se obtiene
                   entrando como instructor con el documento/clave
                   especial definido en ADMIN_ESPECIAL.

   Las credenciales viven en el navegador: sirven para la
   maqueta, no como control de acceso real.
══════════════════════════════════════════ */

const ROLES = {
  aprendiz: {
    pagina: 'pages/aprendiz.html'
  },
  instructor: {
    pagina: 'pages/instructor.html',
    documento: '123456789',
    clave: 'zulmaSALAS3293836'
  }
};

/* El administrador ya no es una página aparte: es un rol especializado
   de instructor con casillas extra (Módulo 4), visibles solo cuando
   llega el parámetro admin=1 (ver instructor.html). */
const PAGINA_ADMIN = ROLES.instructor.pagina;
const ADMINS_ESPECIALES = [
  { documento: '1049634950', clave: 'MACastrop2027' },
  { documento: '0000',       clave: 'administrador' }
];

// Para añadir aspectos, deje el archivo en assets/img/pj/ y agréguelo aquí.
const AVATARES = ['pj1.png', 'pj2.png', 'pj3.png', 'pj4.png', 'pj5.png'];

document.addEventListener('DOMContentLoaded', () => {

  const form          = document.getElementById('login-form');
  const msgLogin      = document.getElementById('login-error');
  const selectorRol   = document.getElementById('rol');
  const campoDocNum   = document.getElementById('doc_num');
  const campoClave    = document.getElementById('password');
  const botonIngresar = form.querySelector('button[type="submit"]');

  /* Sin tildes y en minúscula: así se compara la clave del aprendiz
     sin obligarlo a escribir los acentos. */
  const normalizar = texto => texto
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/\s+/g, ' ').trim();

  const mostrarError = (destino, texto, culpable) => {
    destino.textContent = texto;
    destino.className = 'login-msg error';
    if (culpable) {
      culpable.classList.add('campo-invalido');
      culpable.scrollIntoView({ block: 'nearest' });
    }
  };

  const limpiarError = destino => {
    destino.textContent = '';
    destino.className = 'login-msg';
    document.querySelectorAll('.campo-invalido')
      .forEach(el => el.classList.remove('campo-invalido'));
  };

  /* ── Se registra al aprendiz como participante de SENAEnglish antes
     de entrar a pages/aprendiz.html, para que el quiz de 30 preguntas
     ya tenga con qué asignarle puntaje. El color se asigna solo (el
     primero libre de la paleta): no se le pide elegirlo. ── */

  async function ingresarComoAprendiz(aprendiz, documento, avatar) {
    botonIngresar.disabled = true;
    const estado = await SENAEnglish.observar();
    const tomados = new Set(estado.participantes.filter(p => p.conectado).map(p => p.color));
    const color = estado.config.paleta.find(c => !tomados.has(c.id)) || estado.config.paleta[aprendiz.i % estado.config.paleta.length];

    const res = await SENAEnglish.unirse(aprendiz.completo, color.id);
    botonIngresar.disabled = false;
    if (!res.ok) {
      mostrarError(msgLogin, res.motivo || 'No se pudo ingresar al cuestionario de inglés.');
      return;
    }
    window.location.href = ROLES.aprendiz.pagina
      + '?u=' + encodeURIComponent(aprendiz.completo)
      + '&i=' + aprendiz.i
      + '&doc=' + encodeURIComponent(documento)
      + '&pj=' + encodeURIComponent(avatar);
  }

  /* ── Envío del formulario ── */

  form.addEventListener('submit', e => {
    e.preventDefault();
    limpiarError(msgLogin);

    const rol = selectorRol.value;
    if (!rol) {
      mostrarError(msgLogin, 'Seleccione un rol para continuar.');
      return;
    }

    const documento = campoDocNum.value.trim();
    const clave     = campoClave.value;

    /* El aprendiz se identifica con su documento, que está en el
       registro de la ficha 1, y con sus dos primeros nombres. */
    if (rol === 'aprendiz') {
      const usuario = REGISTRO_FICHA1.usuarios.find(u => u.documento === documento);
      if (!usuario) {
        mostrarError(msgLogin, 'Ese documento no figura en la ficha 3293836.', campoDocNum);
        return;
      }

      const aprendiz = NOMINA.find(a => a.i === usuario.i);
      const escrita  = normalizar(clave);
      const esperada = normalizar(aprendiz.nombre);
      if (escrita !== esperada && escrita !== esperada.replace(/ /g, '')) {
        mostrarError(msgLogin, 'Contraseña incorrecta: son su primer y segundo nombre en minúscula.', campoClave);
        return;
      }

      const avatar = AVATARES[aprendiz.i % AVATARES.length];
      ingresarComoAprendiz(aprendiz, documento, avatar);
      return;
    }

    /* El instructor no es uno solo: cada uno entra con su
       documento, y ese documento lo identifica en su panel. El
       documento/clave especial de administrador entra por este
       mismo camino, hacia el panel de administración. */
    if (rol === 'instructor') {
      const esAdmin = ADMINS_ESPECIALES.some(a => a.documento === documento && a.clave === clave);
      if (esAdmin) {
        window.location.href = PAGINA_ADMIN
          + '?doc=' + encodeURIComponent(documento)
          + '&u=' + encodeURIComponent('Administrador')
          + '&admin=1';
        return;
      }

      const docente = typeof buscarInstructor === 'function' ? buscarInstructor(documento) : null;
      if (!docente || clave !== docente.clave) {
        mostrarError(msgLogin, 'Documento o contraseña incorrectos para ese rol.');
        return;
      }
      window.location.href = ROLES.instructor.pagina
        + '?doc=' + encodeURIComponent(docente.documento)
        + '&u=' + encodeURIComponent(docente.nombre);
      return;
    }
  });

});
