# plataforma-AVA

LMS del SENA que unifica dos programas — **SGMA-ADSO** (Análisis y Desarrollo
de Software, currículo de 72 Resultados de Aprendizaje) y **SENAEnglish**
(cuestionario de inglés en tiempo real) — en una sola aplicación Node.js +
Express + Socket.IO + MongoDB/Mongoose, servida como páginas HTML estáticas
con JavaScript vanilla (sin build step ni framework de frontend).

Este documento describe la arquitectura **real** del código tal como existe
hoy, incluida la deuda técnica conocida — no es un documento de requisitos.

## Despliegue

| | |
| --- | --- |
| GitHub | [construmaster100/plataforma-AVA](https://github.com/construmaster100/plataforma-AVA), branch `main` |
| Render (en vivo) | https://plataforma-ava-wu3i.onrender.com |
| Auto-deploy | cada push a `main` redespliega automáticamente |

## Cómo correrlo localmente

```
npm install
npm start
```

Requiere un `.env` en la raíz con `MONGODB_URI`. `npm start` corre
`game-server/index.js` en el puerto `4000` (o `process.env.PORT`) — es el
único servidor que hace falta levantar; sirve las páginas, los assets y toda
la API. `npm run start:adso` (`server/server.js`) es un servidor REST viejo,
standalone, que **no se usa en producción** — quedó de una fase anterior del
proyecto ADSO antes de la unificación.

## Arquitectura del servidor

`game-server/index.js` es la única autoridad de backend:

- Sirve estático `/pages`, `/assets`, `/docs`.
- Monta Socket.IO para el cuestionario SENAEnglish en tiempo real
  (`gameState.js`: sala única, ranking de hasta 20 participantes).
- Monta todas las rutas REST de `server/routes/`: `aprendices`, `resultados`,
  `actividades`, `acceso`, `quizzes` — mismo origen que sirve las páginas, así
  los `fetch("/api/...")` del frontend funcionan sin importar el dominio.

`server/server.js` monta las mismas rutas REST pero como proceso aparte en
otro puerto; es el servidor original del programa ADSO antes de que todo se
uniera en `game-server/index.js`. No está conectado a Render.

## Roles y autenticación

**No hay autenticación real de servidor.** Todo el login (`assets/js/autenticacion/login.js`)
valida contra arrays de JavaScript embebidos en el propio frontend:

- **Aprendiz**: documento contra `REGISTRO_FICHA1.usuarios` (`registro.js`) +
  clave = nombre normalizado contra `NOMINA` (`nomina.js`).
- **Instructor**: documento/clave contra `INSTRUCTORES` (`assets/js/estado/ficha.js`)
  o contra `ADMINS_ESPECIALES` (dos cuentas hardcodeadas en `login.js`).
- **Administrador NO es un rol separado**: es un instructor especial que,
  tras validar sus credenciales, es redirigido a `pages/instructor.html?...&admin=1`,
  lo que revela un menú "Módulo 5" extra (gestión de usuarios/plataforma) que
  el resto de instructores no ve. `pages/administrador.html` (el archivo) hoy
  solo es el monitor en vivo de SENAEnglish — el panel real de admin vive
  fusionado dentro de `instructor.html`.

"Ficha" tiene **dos significados sin unificar** en el código:
1. Ficha SENA real con nómina (`3293836`) — usada en `ficha.js`/`login.js`.
2. Slug de currículo (`adso` | `english`) — usado en `acceso.js`, `quizzes.js`,
   `actividades.js`.

Se cruzan solo indirectamente vía `fichasDeAprendiz()`/`fichasDeInstructor()`
en `ficha.js`, que son tablas manuales (`FICHAS_EXTRA_APRENDIZ`, `FICHAS_POR_INSTRUCTOR`).

## Estructura de contenido (ADSO)

```
pages/Fichas Tecnicos y tecnologos/
  Analisis y desarrollo de software-Resultados de Aprendizaje/
    RA1 .. RA72/
      AA1 .. AA5/
        M1/  M2/  M3/  M4/quiz.html
```

Cada RA/AA/Módulo es una carpeta con su propio `quiz.html`. **Coexisten dos
esquemas de evaluación no relacionados**, ambos vigentes:

### Esquema viejo — basado en archivos

Un JS standalone por módulo, con las preguntas embebidas en el propio
archivo: `assets/js/m1-cuestionario-10.js`, `m2-unir-palabras.js`,
`m3-verdadero-falso.js`, `quiz-irregular-verbs.js` (M4, 30 verbos
irregulares fijos). Cada uno corrige en el navegador y hace un solo
`POST /api/resultados` con `cuestionario` = `` `${ficha}-ra-${ra}-aa-${aa}-m-${m}` ``
(segmento **`-m-`**).

### Esquema nuevo — "Módulo 4" con banco de preguntas en Mongo

El instructor **crea** el contenido (no viene precargado): por cada
ficha+RA+AA+módulo(1-4) arma un Quiz (10 preguntas) o Evaluación (30),
con preguntas V/F o 4 opciones, puntos por pregunta, límite de tiempo e
intentos permitidos (`server/models/Quiz.js`, `server/routes/quizzes.js`).

- Instructor: `pages/instructor.html` → "4.1 Crear Quiz/Evaluación"
  (`assets/js/evaluacion/quiz-crear-instructor.js`) y "4.2 Resultados de
  evaluación" (`resultados-eval-instructor.js`).
- Aprendiz: `pages/aprendiz.html` → "4.1 Presentar Quiz/Evaluación"
  (`quiz-dinamico-presentar.js`) y "4.2 Resultados de evaluación"
  (`resultados-eval-aprendiz.js`).
- Motor de presentación: `pages/quiz-dinamico.html` + `assets/js/quiz-dinamico.js`,
  reporta a `POST /api/resultados` con `cuestionario` = `` `${ficha}-ra-${ra}-aa-${aa}-mod-${m}` ``
  — segmento **`-mod-`**, deliberadamente distinto del viejo `-m-` para no
  colisionar en la misma tabla `Resultado`.

### Un tercer sistema, aparte: catálogo de embebidos

`assets/js/evaluacion/embebidos-catalogo.js` cataloga contenido de estudio
HTML autocontenido (Python, Java, HTML/CSS, PHP, C/C++/C#, inglés, Sede
Tunja). Guarda su propio puntaje **solo en `localStorage`** del navegador —
nunca llega al servidor ni aparece en ningún reporte de instructor.

## Control de acceso a RA

`server/routes/acceso.js`: todo aprendiz arranca con `RA_ABIERTOS_POR_DEFECTO
= [1,2,3,4,5]`. El instructor habilita el resto **uno por uno**, manualmente,
desde `tabla-score-ra.js` (botón "Habilitar este RA" → `POST /api/acceso`).
No hay desbloqueo automático por aprobar el anterior. Dos cédulas de prueba
(`CEDULAS_CON_ACCESO_TOTAL`) tienen las 72 abiertas de entrada.

## ⚠️ Deuda técnica conocida

Documentada aquí a propósito porque es el punto de partida para cualquier
simplificación futura del sistema de evaluación/score:

1. **La constante `{ adso: 72, english: 5 }` (cuántos RA tiene cada ficha)
   está duplicada en 6 archivos** (`server/routes/quizzes.js`,
   `assets/js/evaluacion/ra-cards-render.js`, `tabla-score-ra.js`,
   `progreso-ra.js`, `footer-progreso.js`, `quiz-dinamico-presentar.js`),
   más `TOTAL_RA = 72` a secas (sin distinguir ficha) en `acceso.js` y
   `actividades.js` — 8 lugares en total. Cambiar el currículo implica
   editar los 8.
2. **Dos sistemas de puntaje en paralelo sobre la misma tabla `Resultado`,
   sin una única fuente de verdad**: el viejo (`server/routes/resultados.js`
   `/reporte/instructor` y `/:cedula`) suma aciertos/total de *todo* lo que
   haya en `Resultado` sin distinguir origen (SENAEnglish + M1-M4 + Módulo 4
   nuevo, todo junto); el nuevo (`quizzes.js` `/puntaje/:cedula`) solo mira
   los resultados con `-mod-` y pondera cada RAA a `10000 / total de RAA`.
3. **Un tercer sistema de score** vive aislado en `localStorage`
   (`embebidos-catalogo.js`), invisible para instructor y reportes.
4. El **tope de "5 RA visibles"** en la vista del aprendiz
   (`ra-cards-presentar.js`, `quiz-dinamico-presentar.js`, es un
   `Math.min(total, 5)` de UI) es un concepto distinto de los "5 RA
   abiertos por defecto" de `acceso.js` (control de acceso real) — fácil de
   confundir leyendo el código, aunque ambos casualmente valgan 5 hoy.
5. `tabla-score-ra.js` postea siempre `modulo: 'SENAEnglish'` al guardar una
   celda, sin importar la ficha/RA real que se está editando.
6. Algunos mensajes de error de frontend (`progreso-ra.js`, `tabla-score-ra.js`)
   siguen sugiriendo `npm run start:adso` (el servidor legado) como solución
   ante fallos de conexión — instrucción desactualizada.
7. El repo tenía además ~148 archivos duplicados con sufijo `" (2)"` (copias
   idénticas dejadas por Explorer al pegar carpetas) y una copia completa no
   rastreada de otro proyecto ajeno (SENAEnglish "MAP", desplegado por
   separado en `englishcoding.onrender.com`) pegada dentro de
   `pages/.../RA1/AA4/` — limpiado el 2026-08-29.
