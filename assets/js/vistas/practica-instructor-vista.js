/* ══════════════════════════════════════════
   SGMA-ADSO — Vista previa de práctica (instructor)

   Genera tarjetas desde EMBEBIDOS (no copia el markup estático
   del aprendiz) para que el instructor vea el mismo material que
   desbloquea puntos y alimenta el plan de mejora. Solo el material
   de ADSO: Zulma Salas no dicta English Coding. Los enlaces los
   intercepta visor.js (ya cargado) igual que en el resto del sitio.

   Depende de:
     · embebidos-catalogo.js → EMBEBIDOS
══════════════════════════════════════════ */

function pintarPracticaInstructor() {
  const zona = document.getElementById('practica-ins-tarjetas');
  if (!zona) return;

  const catalogo = EMBEBIDOS.filter(a => a.modulo !== 'English');

  zona.replaceChildren();

  catalogo.forEach(actividad => {
    const tarjeta = document.createElement('a');
    tarjeta.href = actividad.ruta;
    tarjeta.className = 'tarjeta';

    const portada = document.createElement('span');
    portada.className = 'tarjeta-portada';
    const img = document.createElement('img');
    img.src = actividad.portada;
    img.alt = '';
    img.loading = 'lazy';
    const etiqueta = document.createElement('span');
    etiqueta.className = 'tarjeta-etiqueta';
    etiqueta.textContent = actividad.puntua ? '0 – ' + actividad.maximo : actividad.tipo;
    portada.append(img, etiqueta);

    const pie = document.createElement('span');
    pie.className = 'tarjeta-pie';
    const avatar = document.createElement('span');
    avatar.className = 'tarjeta-avatar';
    const texto = document.createElement('span');
    texto.className = 'tarjeta-texto';
    const paso = document.createElement('span');
    paso.className = 'tarjeta-paso';
    paso.textContent = actividad.modulo;
    const titulo = document.createElement('span');
    titulo.className = 'tarjeta-titulo';
    titulo.textContent = actividad.titulo;
    const meta = document.createElement('span');
    meta.className = 'tarjeta-meta';
    meta.textContent = actividad.descripcion;
    texto.append(paso, titulo, meta);
    pie.append(avatar, texto);

    tarjeta.append(portada, pie);
    zona.appendChild(tarjeta);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('practica-ins-tarjetas')) return;
  pintarPracticaInstructor();
});
