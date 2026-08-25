/* ══════════════════════════════════════════
   SGMA-ADSO — Slide de fotografías (bienvenida.html)

   Crossfade por opacidad entre las fotos reales del centro, con
   avance automático cada 5 s y controles manuales (anterior /
   siguiente / puntos). No depende de sesión ni de ninguna otra
   pieza del sitio: solo lee el marcado que ya trae `.slide-hero`.

   Depende de: nada más que el DOM ya presente en bienvenida.html.
══════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

  const marco = document.querySelector('.slide-hero');
  if (!marco) return;

  const fotos   = Array.from(marco.querySelectorAll('img'));
  const puntos  = Array.from(marco.querySelectorAll('.slide-hero-punto'));
  const btnAnt  = marco.querySelector('.slide-hero-anterior');
  const btnSig  = marco.querySelector('.slide-hero-siguiente');
  if (!fotos.length) return;

  let actual = 0;
  let temporizador = null;

  function mostrar(indice) {
    actual = (indice + fotos.length) % fotos.length;
    fotos.forEach((img, i) => img.classList.toggle('slide-activa', i === actual));
    puntos.forEach((p, i) => p.classList.toggle('slide-activa', i === actual));
  }

  function reiniciarAutomatico() {
    if (temporizador) clearInterval(temporizador);
    temporizador = setInterval(() => mostrar(actual + 1), 5000);
  }

  if (btnAnt) btnAnt.addEventListener('click', () => { mostrar(actual - 1); reiniciarAutomatico(); });
  if (btnSig) btnSig.addEventListener('click', () => { mostrar(actual + 1); reiniciarAutomatico(); });
  puntos.forEach((p, i) => p.addEventListener('click', () => { mostrar(i); reiniciarAutomatico(); }));

  mostrar(0);
  reiniciarAutomatico();
});
