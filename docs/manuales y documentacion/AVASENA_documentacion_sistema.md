# AVA SENA — Documento funcional y de arquitectura

**Sistema:** SGMA-ADSO, Sistema de Gestión y Monitoreo Académico basado en AVA.
**Programa:** Tecnólogo en Análisis y Desarrollo de Software (ADSO), ficha 3293836.
**Contexto institucional:** SENA CEGAFE, Tunja.
**Fecha de actualización:** 14 de agosto de 2026.

> Este documento describe el sistema **tal como está hoy en el código**, no como se
> proyectó. Donde una funcionalidad es maqueta y no lógica real, se dice. Donde hay
> un problema abierto, se enumera en la sección 12.

---

## 1. Propósito, alcance y problema atendido

SGMA-ADSO es una plataforma web tipo Ambiente Virtual de Aprendizaje (AVA) que apoya la competencia de Desarrollo de Software. Centraliza contenidos, actividades, evidencias de código, evaluaciones, retroalimentación y seguimiento académico para aprendices ADSO, instructores y administradores.

La solución atiende la dispersión de recursos entre correo, Drive, documentos físicos, enlaces y hojas de cálculo; mejora la visibilidad del avance individual y grupal; facilita la entrega y revisión de evidencias de programación; y permite generar alertas y reportes para el acompañamiento pedagógico.

El sistema complementa los procesos institucionales de Preparación de la Formación, Ejecución de la Formación por el Instructor y Ejecución de la Formación por el Aprendiz. No reemplaza el criterio pedagógico del instructor ni los sistemas institucionales; se proyecta como una herramienta compatible e integrable con SOFIA Plus.

---

## 2. Composición física del sistema

Sitio **estático**: HTML, CSS y JavaScript de navegador, sin build, sin framework. Bootstrap 5 se carga por CDN; todo lo demás es propio. Desde el 14 de agosto hay además un **backend provisional** (Express + Mongoose) que corre aparte del sitio estático — ver 2.5. No reemplaza `localStorage`, que sigue siendo la fuente de verdad del sitio.

### 2.1 Páginas

| Archivo | Rol | Líneas | Vistas |
| --- | --- | --- | --- |
| `index.html` | Ingreso por rol | 183 | — |
| `pages/aprendiz.html` | Panel del aprendiz | 4 794 | 32 |
| `pages/instructor.html` | Panel del instructor | 3 342 | 54 |
| `pages/administrador.html` | Panel del administrador | 1 247 | 24 |
| `pages/resultadosdeaprendizajeADSO.html` | Documento de RA | 1 211 | — |
| `pages/ADSOsena.html` | **Página institucional del CEGAFE** | 676 | 10 |

Las tres primeras comparten la misma anatomía: `brandbar` → `navbar` → `page-wrapper` → `aside` (menú) + `main.main-content` → `titulo-vista` + N `section.view-section`. Solo una sección es visible a la vez; la conmuta `sofia_plus.js` por el atributo `data-view`.

### 2.2 Hojas de estilo — 8 archivos

| Archivo | Líneas | Alcance |
| --- | --- | --- |
| `sofia_plus.css` | 3 428 | Base compartida: navbar, menú, tablas, tarjetas, tablero |
| `arbol.css` | 845 | Árbol de niveles, cards de módulo, sidebars, casilla de puntaje |
| `login.css` | 368 | Pantalla de ingreso |
| `mensajeria.css` | 375 | **Sin enlazar** (ver 12.1) |
| `institucional.css` | 218 | Página institucional: coordinadores, directorio, oferta |
| `analitica.css` | 232 | Gráficas de instructor y administrador |
| `sala.css` | 210 | Sala en tiempo real del administrador |

### 2.3 Módulos JavaScript — 39 archivos

Desde el 14 de agosto viven en subcarpetas de `assets/js/` por tipo de función — antes eran 39 archivos sueltos en un mismo directorio. Evaluación y autenticación se separaron como categorías propias por ser los dos dominios de negocio más sensibles (puntaje y acceso); el resto sigue la misma partición por tipo de función que ya traía este documento (estado, catálogo, vistas, infraestructura).

**`assets/js/evaluacion/` (9)** — capturan, califican o visualizan puntaje

| Módulo | Líneas | Responsabilidad |
| --- | --- | --- |
| `tablero.js` | 368 | Banco de preguntas del programa y pantalla de actividades del aprendiz (quiz10/quiz30). Desde esta corrección también reporta cada resultado al backend (ver 2.5), en paralelo a `localStorage` |
| `embebidos-catalogo.js` | ~690 | Las 54 actividades embebidas, identidad de quien juega, puntajes — el corazón del sistema de calificación |
| `actividad.js` | 390 | Componentes evaluables de GAA1/AA1 (cuestionario, glosario, práctica) |
| `resultados-ficha.js` | 307 | Instructor y administrador: consolidado de puntajes de toda la ficha |
| `analitica-aprendiz.js` | 297 | Series del tablero de puntajes (evolución, desempeño por módulo) a partir de los registros reales del aprendiz |
| `avance-aprendiz.js` | 211 | Gráfico circular de avance general (contenidos, materiales, puntajes, evidencias) |
| `ra-tablero.js` | 220 | Cabecera del tablero de puntajes: horas del RA en curso, total de RA, entregas pendientes |

**`assets/js/autenticacion/` (5)** — ingreso, credenciales, identidad de sesión

| Módulo | Líneas | Responsabilidad |
| --- | --- | --- |
| `login.js` | 219 | Pantalla de ingreso por rol: valida credenciales y redirige a cada panel con la identidad en la URL (`?u=`, `&doc=`, `&i=`, `&pj=` según el rol) |
| `registro.js` | 41 | Registro de usuarios (documento + índice) de la ficha, usado junto con `nomina.js` para las claves de acceso |
| `nomina.js` | 168 | Nómina de la ficha 3293836 usada solo para el ingreso (solo nombres) |
| `instructor-identidad.js` | 107 | Determina qué instructor entró (`?doc=`) y qué fichas/módulos puede editar |

**`assets/js/estado/` (7)** — sin DOM; solo leen y escriben `localStorage`

| Módulo | Líneas | Responsabilidad |
| --- | --- | --- |
| `ficha.js` | 215 | Fichas del sistema, matrícula, instructores titulares, materiales, RA. Expone `leerAlmacen`/`guardarAlmacen`, la base de persistencia de todo lo demás |
| `fichas-n.js` | 132 | Fichas de aprendizaje virtual (la 2 en adelante): alta, nivel, cupos |
| `plan-formativo.js` | 373 | Currículo, desbloqueo, actividades asignadas, umbrales del árbol |
| `mejoras.js` | 202 | Billetera de puntos, catálogo de mejoras, comprar/enviar/intercambiar |
| `modulos-formativos.js` | 265 | Módulos de cuatro partes, instructores por módulo, validación de RA |
| `aprendices.js` | 444 | Directorio con datos personales — **no se carga en el panel del aprendiz** |
| `asistencia.js` | 111 | Autorreporte de asistencia y su ponderación (puntual 2, tarde 1, excusa 0.3, no asiste 0) |
| `sesiones.js` | 162 | Sesiones de formación programadas; solicitud del aprendiz → aceptación del instructor → ventana de 5 horas que autentica la asistencia y da acceso al contenido |
| `requisitos.js` | 123 | Checklist de requisitos, solicitudes de requisitos de la sesión y solicitudes de equipo SENNOVA |
| `evidencias.js` | 60 | Semáforo de evidencias (rojo/amarillo/verde) que adjunta el aprendiz y valida el instructor |
| `ranking.js` | 63 | Ranking de puntos por ficha: puntaje de actividades + bono por módulo aprobado − penalización por novedad |
| `mensajeria.js` | 165 | Correo y chat entre roles. El chat quedó cableado sobre la bandeja existente con tope de 50 caracteres — ver 12.1 |

**`assets/js/catalogo/` (3)** — catálogo y contenido

| Módulo | Líneas | Responsabilidad |
| --- | --- | --- |
| `documentos.js` | 2 328 | Índice de 241 archivos reales de `docs/Fichas/ADSO 3293836/` |
| `estructura.js` | 243 | Estructura del repositorio |
| `curso-nivel3.js` | 153 | Contenido del curso |

**`assets/js/vistas/` (10)** — leen el estado y pintan

| Módulo | Líneas | Panel |
| --- | --- | --- |
| `mi-contenido.js` | 393 | Aprendiz: árbol de niveles, detalle, notificaciones |
| `card-modulo.js` | 425 | Los tres: cards de módulo, rejilla, autocompletado |
| `mejoras-vista.js` | 286 | Aprendiz: casilla de puntaje |
| `asignar-contenido.js` | 436 | Instructor y administrador: armado de la ficha |
| `modulos-formativos-vista.js` | 391 | Instructor y administrador: crear módulos y validar RA |
| `estadisticas.js` | 497 | Gráficas e indicadores |
| `sala-monitor.js` | 136 | Sala en tiempo real del administrador |
| `pantallas.js` | 212 | Pantallas de estado del administrador |
| `novedades.js` | 166 | Novedades y llamados de atención (falta leve, falta grave, inasistencia, incumplimiento, lenguaje/conducta inadecuada) |
| `mensajeria-vista.js` | 318 | Pintado de la bandeja de correo estilo tabla — la parte de correo sigue sin cablear, ver 12.1 |
| `asistencia-instructor-vista.js` | 623 | Tablero de asistencia ponderada (una tarjeta por ficha del instructor) + detalle individual + reportes diario/semanal/mensual |
| `sesiones-vista.js` | 357 | Programar/iniciar sesión, solicitudes de ingreso pendientes con botón Aceptar, guía en curso de la sesión |
| `requisitos-instructor-vista.js` | 178 | Agregado del checklist + solicitudes de requisitos + solicitudes de equipo SENNOVA |
| `seguimiento-modulos-vista.js` | 329 | Reporte de ejecución por aprendiz, plan de mejora automático y alertas de desempeño (RF09) generadas solas |
| `evidencias-vista.js` | 83 | Semáforo de evidencias del instructor |
| `ranking-vista.js` | 52 | Ranking de puntos, aprendiz (resaltando su fila) e instructor (solo lectura) |
| `consola-practica-vista.js` | 127 | Consola de práctica de 3 paneles: ejemplo, entrada libre persistida, ejecución simulada por comparación de texto |

**`assets/js/infraestructura/` (5)** — navegación, cronología y adorno

| Módulo | Líneas | Responsabilidad |
| --- | --- | --- |
| `sofia_plus.js` | 1 234 | Conmutación de vistas, menús, identidad del sidebar, formularios varios |
| `visor.js` | ~140 | Abre embebidos, PDF y JPG/PNG en iframe sin salir de la página; reescribe enlaces de YouTube a `/embed/`. Word/Excel se quedan en descarga — no hay forma real de previsualizarlos sin backend |
| `consola.js` | 81 | Abre los recursos HTML del repositorio en un marco embebido |
| `tiempo.js` | ~165 | Reloj, calendario mensual y línea de tiempo. Cada evento trae además hora/lugar/materiales/requisitos para la tabla de cronograma |
| `animacion.js` | 76 | Animación decorativa de la sala de sistemas |

### 2.4 Actividades embebidas

54 carpetas en `assets/embebidos/`, cada una un `index.html` autónomo (verificado: sin `src=`/`href=` externos, cero dependencias entre carpetas), agrupadas en **12 subcarpetas numeradas por módulo** (las 2 más recientes: `11-sede-tunja/` y `12-practica-ampliada/`, esta última con las 3 actividades nuevas — cuestionario general de 30 preguntas, juego de unir palabras y significado, y video de práctica):

```
assets/embebidos/
  01-python/  02-java/       03-html/  04-css/          05-desarrollo-web/
  06-php/     07-c/          08-cpp/   09-csharp/       10-english/
  11-sede-tunja/              12-practica-ampliada/
```

El módulo de cada actividad es el campo `modulo:` de su entrada en `embebidos-catalogo.js`, no el sufijo del nombre de carpeta: los 21 `diccionario-*`/`english-*` (incluidos los que llevan sufijo de lenguaje, como `diccionario-java`) caen todos en `10-english/` porque son material bilingüe de esa práctica, no del módulo de ese lenguaje. Las demás 9 subcarpetas (01 a 09) llevan 3 actividades cada una: `cuestionario-`, `ejemplos-` y `minijuego-` de su lenguaje.

| Tipo | Cantidad | Puntúa |
| --- | --- | --- |
| Cuestionario | 9 | Sí, 0–100 |
| Actividad (minijuego) | 9 | Sí, 0–100 |
| English practice | 10 | Sí, 0–100 |
| Ejemplos | 9 | No |
| Diccionario | 11 | No |

**28 actividades puntuables · 2 900 puntos en juego** si se asignaran todas.

### 2.5 Backend (provisional, en construcción)

Servidor Node/Express aparte del sitio estático, en `server/`, con conexión a MongoDB Atlas vía Mongoose:

| Archivo | Responsabilidad |
| --- | --- |
| `server/server.js` | Arranca Express, carga `.env` con `dotenv`, conecta Mongo antes de escuchar en el puerto 3000, monta las rutas |
| `server/config/db.js` | `mongoose.connect(process.env.MONGODB_URI)`; si falla, lo registra en consola y corta el arranque |
| `server/models/Aprendiz.js` | Esquema `{ nombre, cedula (única) }` — identidad mínima, sin login propio: se crea por upsert la primera vez que llega un resultado a su nombre |
| `server/models/Resultado.js` | Esquema `{ aprendiz (ref), modulo, cuestionario, puntaje, totalPreguntas }` con `timestamps` — un documento por cuestionario resuelto |
| `server/routes/aprendices.js` | `POST /api/aprendices` (upsert por cédula), `GET /api/aprendices/:cedula` |
| `server/routes/resultados.js` | `POST /api/resultados` (guarda el resultado, crea el aprendiz si no existía), `GET /api/resultados/reporte/instructor` (consolidado por aprendiz vía agregación), `GET /api/resultados/:cedula` (historial y acumulado) |

**Estado real:** la conexión a Atlas está pendiente de que el usuario agregue su IP a la whitelist (`Network Access` del clúster) — hasta entonces `npm start` conecta el servidor Express pero la base de datos rechaza la conexión y el arranque se corta. El único punto del frontend que llama a este backend es el cuestionario de `tablero.js` (quiz10/quiz30, ver 2.3): al enviarlo, además de guardar en `localStorage` como siempre, intenta un `POST /api/resultados` envuelto en `try/catch` — si el servidor no responde, no pasa nada, es *best-effort*. `embebidos-catalogo.js` (48 actividades) y `actividad.js` (GAA1/AA1) siguen sin tocar el backend; sus puntajes siguen viviendo solo en `localStorage`. El acceso por rol (quién puede reportar, quién solo consulta) no lo aplica el backend — sigue dependiendo, como en el resto del sitio, de qué script carga cada página (ver 2.3).

---

## 3. Arquitectura de datos

El sitio estático sigue sin base de datos ni API propia: todo su estado vive en `localStorage`, bajo 21 claves con prefijo `sgma_`. Aparte, hay un backend provisional (Mongo vía Mongoose, ver 2.5) que por ahora solo guarda una copia adicional de los cuestionarios de `tablero.js` — no reemplaza ninguna de estas claves ni las lee.

| Clave | Dueño | Contenido |
| --- | --- | --- |
| `sgma_plan_formativo` | `plan-formativo.js` | Por ficha: currículo, módulos abiertos, actividades asignadas con su umbral |
| `sgma_puntajes_embebidos` | `embebidos-catalogo.js` | Por identidad y actividad: mejor puntaje, último, intentos, fecha |
| `sgma_fichas_n` | `fichas-n.js` | Fichas virtuales creadas |
| `sgma_billeteras` | `mejoras.js` | Por identidad: gastados, enviados, recibidos, mejoras compradas |
| `sgma_mejoras` | `mejoras.js` | Catálogo de mejoras, incluidas las creadas por aprendices |
| `sgma_modulos_formativos` | `modulos-formativos.js` | Módulos de cuatro partes, con su ficha, instructor y RA |
| `sgma_validaciones_ra` | `modulos-formativos.js` | Qué RA le validó qué instructor a qué aprendiz, y cuándo |
| `sgma_matricula`, `sgma_materiales`, `sgma_resultados`, `sgma_instructores`, `sgma_ficha_instructor` | `ficha.js` | Estado que el administrador carga y leen los demás |
| `sgma_act_puntajes`, `sgma_act_fechas`, `sgma_act_evidencias` | `actividad.js` | GAA 1 · AA 1 |
| `sgma_novedades`, `sgma_evaluaciones` | `novedades.js`, `sofia_plus.js` | Novedades y evaluaciones creadas |
| `sgma_puntajes_*`, `sgma_emb_*` | `tablero.js`, `embebido.js` | Puntajes por usuario del tablero y de los embebidos sueltos |
| `sgma_correos`, `sgma_chat` | `mensajeria.js` | **Inactivas** (ver 12.1) |

### 3.1 Identidad

`identidadActual()` en `embebidos-catalogo.js` deduce quién juega a partir de la URL:

| Parámetros | Clave | Rol |
| --- | --- | --- |
| `?u=Nombre&i=3` | `aprendiz-3` | aprendiz |
| sin parámetros | `anonimo` | anónimo |

El aprendiz entra desde `index.html` con su índice de nómina.

Desde el 14 de agosto, `login.js` agrega dos parámetros más a la redirección, para el backend provisional (2.5) y para que el sidebar (`sofia_plus.js`, `#ses-nombre`) siempre muestre el nombre correcto:

- **Aprendiz** — se suma `&doc=<cédula>` (antes solo llevaba `u`, `i` y `pj`); es lo que usa `tablero.js` para reportar el resultado del cuestionario al backend.
- **Instructor** — se suma `&u=<nombre>` (antes solo llevaba `doc`); sin esto, el sidebar quedaba fijo en el nombre de ejemplo del HTML (`Zulma Salas`) sin importar quién entrara — ver corrección 24 en la sección 10.

### 3.2 Las dos fichas

| Ficha | Naturaleza | Currículo | Cupos |
| --- | --- | --- | --- |
| **3293836** | Real y estática. Tecnólogo, Zulma Salas, material en `docs/Fichas/ADSO 3293836/` | Sin tope | 27 (nómina real) |
| **2 en adelante** | Fichas N: plantillas para montar cursos | Exactamente 4 módulos, validado | 35, «Aprendiz 1» … «Aprendiz 35» |

La ficha 2 es la plantilla madre y no se puede borrar. Las nuevas nacen con id autoincremental y nivel **Técnico** o **Tecnólogo**.


### 3.3 Las tres entidades y cómo se encajan

Todo el sistema gira sobre tres entidades. Conviene tenerlas separadas porque la palabra
«módulo» se usa con dos sentidos distintos.

```
                        ┌──────────────────────────┐
                        │          FICHA           │
                        │  3293836 (real, fija)    │
                        │  2, 3, 4… (fichas N)     │
                        └───────────┬──────────────┘
                    ┌───────────────┼───────────────┐
                    │               │               │
            ┌───────▼──────┐ ┌──────▼───────┐ ┌─────▼──────────┐
            │    GRUPO     │ │  CURRÍCULO   │ │    MÓDULOS     │
            │  las personas│ │  4 módulos   │ │   FORMATIVOS   │
            │              │ │ del catálogo │ │  4 partes c/u  │
            │ 27 nómina    │ │              │ │                │
            │ 35 cupos     │ │ Python, Java │ │ «Python en     │
            │              │ │ HTML, CSS…   │ │  inglés»       │
            └───────┬──────┘ └──────┬───────┘ └─────┬──────────┘
                    │               │               │
                    │        ┌──────▼───────┐       │
                    │        │  ACTIVIDADES │◄──────┘
                    │        │  48 embebidas│  cada parte engancha
                    │        └──────┬───────┘  las que necesite
                    │               │
                    └──────►  PUNTAJES  ◄──── el aprendiz las resuelve
                                    │
                                    ▼
                            VALIDACIÓN DEL RA
                          (la aprueba el instructor)
```

| Entidad | Qué es | Dónde vive |
| --- | --- | --- |
| **Ficha** | El contenedor. Programa, nivel, jornada, instructor titular y cupos | `ficha.js`, `fichas-n.js` |
| **Grupo** | Las personas de esa ficha: 27 de nómina real en la 3293836, 35 cupos «Aprendiz 1…35» en las fichas N | `nomina.js`, `aprendices.js` |
| **Módulo del catálogo** | Uno de los 10 con sus actividades. Cuatro de ellos arman una ficha | `embebidos-catalogo.js`, `plan-formativo.js` |
| **Módulo formativo** | Unidad creable de 4 partes, con instructor propio y un RA que valida | `modulos-formativos.js` |

**Las dos relaciones que hay que recordar:**

- **4 módulos del catálogo = 1 ficha.** Es el currículo, con tope validado.
- **4 partes = 1 módulo formativo.** Contenido, Práctica, Evaluación y Evidencia.

Un aprendiz pertenece a **un grupo**, que pertenece a **una ficha**. Esa ficha tiene un
currículo de cuatro módulos del catálogo, y puede además tener módulos formativos, cada
uno a cargo del instructor que se le asigne.

### 3.4 Dónde se toca cada entidad

Ruta exacta de menú, sección e interacción para cada entidad.

#### Ficha

| Panel | Ruta de menú | Sección | Qué se hace |
| --- | --- | --- | --- |
| Administrador | Administración → Crear curso (Virtual / Técnico / Tecnólogo) | `sec-curso` | Crea la ficha |
| Administrador | Administrar → Cargar materiales del curso | `sec-materiales-curso` | Carga material de la ficha |
| Administrador | Administrar → Cargar resultados de aprendizaje | `sec-ra-curso` | Define los RA que la ficha valida |
| Administrador | Administrar → Asignar instructor | `sec-asignar-instructor` | Nombra al titular |
| Administrador · Instructor | Administrar / Ejecución → Asignar contenido y desbloquear módulos | `sec-plan-formativo` | **Crea fichas N**, elige sus 4 módulos y los desbloquea |
| Instructor | Barra lateral, selector **Fichas disponibles** | `ins-ficha-activa` | Cambia la ficha sobre la que trabaja |
| Instructor | Ejecución de la formación → Fichas disponibles | `sec-fichas` | Consulta el estado de cada ficha |
| Aprendiz · Instructor · Administrador | Acceso directo → Ficha de aprendizaje | `sec-ficha-aprendizaje` | Consulta la ficha |

#### Grupo

| Panel | Ruta de menú | Sección | Qué se hace |
| --- | --- | --- | --- |
| Administrador | Gestión de Usuarios → Listar / Crear / Buscar | `sec-listar`, `sec-crear`, `sec-buscar` | Alta y consulta de personas |
| Administrador | Administrar → Vincular aprendices a la ficha | `sec-vincular` | Mete personas en el grupo de una ficha |
| Administrador | Sala en tiempo real | `sec-sala` | Ve el grupo en vivo |
| Instructor | Ejecución → Ficha de aprendices matriculados | `sec-ficha-matricula` | Consulta su grupo |
| Instructor | Ejecución de la formación → Aprendices en riesgo | `sec-alertas` | Ve quién va mal |
| Instructor · Administrador | Ejecución / Administrar → Resultados de las actividades | `sec-resultados-embebidos` | **Consolidado de puntajes de todo el grupo**, filtrable por ficha y rol |
| Instructor · Administrador | Módulos formativos → «Validar aprendices» | `sec-modulos-formativos` | Recorre el grupo y valida el RA uno a uno |

#### Módulo del catálogo

| Panel | Ruta de menú | Sección | Qué se hace |
| --- | --- | --- | --- |
| Administrador · Instructor | Asignar contenido y desbloquear módulos | `sec-plan-formativo` | Mete el módulo en el currículo, lo desbloquea, asigna sus actividades y fija umbrales |
| Aprendiz | Tablero, rejilla de módulos | `sec-home` | Ve sus módulos con estado y candado; entra al que esté abierto |
| Aprendiz | Módulo 2 → Practicar | `sec-ver-eval` | El contenido del módulo, bloque por bloque |
| Aprendiz | Módulo 3 → Reportar evidencia de aprendizaje | `sec-evidencias` | **Árbol de niveles**: recorre el módulo nivel por nivel |
| Instructor | Tablero, card con autocompletado | `sec-home` | Consulta cualquier módulo por nombre o actividad |

#### Módulo formativo

| Panel | Ruta de menú | Sección | Qué se hace |
| --- | --- | --- | --- |
| Administrador | Administrar → Módulos formativos | `sec-modulos-formativos` | Crea el módulo: nombre, ficha, instructor y RA |
| Instructor | Ejecución de la formación → Módulos formativos | `sec-modulos-formativos` | Lo mismo, más enganchar actividades a cada parte |
| Ambos | Dentro de cada parte, desplegable «+ añadir actividad» | — | Engancha una de las 48 actividades del catálogo |
| Ambos | Botón «Validar aprendices» | — | **Aprueba o retira el RA de cada aprendiz, a mano** |

### 3.5 Recorrido de una interacción completa

Ejemplo con las tres entidades encadenadas:

1. El administrador crea la **ficha** 3 (Técnico, 35 cupos) en `sec-plan-formativo`.
2. Elige sus cuatro **módulos del catálogo** y desbloquea dos.
3. Vincula personas al **grupo** desde `sec-vincular`.
4. El instructor crea el **módulo formativo** «Python en inglés» en `sec-modulos-formativos`,
   se lo asigna a otro instructor y le declara el RA-02.
5. Reparte actividades del catálogo entre las cuatro partes.
6. El aprendiz las resuelve desde su **árbol de niveles** en `sec-evidencias`; el puntaje
   vuelve solo por `postMessage`.
7. El instructor abre «Validar aprendices», ve el avance parte por parte y **aprueba el RA**.
8. El consolidado de `sec-resultados-embebidos` refleja el puntaje de todo el grupo.

---

## 4. El circuito completo: de la asignación al puntaje

Es el flujo central del sistema y atraviesa los tres paneles.

```
INSTRUCTOR / ADMINISTRADOR            APRENDIZ                      INSTRUCTOR / ADMIN
──────────────────────────            ────────                      ──────────────────
sec-plan-formativo                    sec-evidencias                sec-resultados-embebidos
        │                                    │                              ▲
        │ 1. elige 4 módulos                 │ 4. ve su árbol               │
        │    (currículo)                     │    de niveles                │
        │ 2. desbloquea los                  │ 5. entra a la actividad      │
        │    que correspondan                │    (visor.js, en iframe)     │
        │ 3. asigna actividades              │ 6. la resuelve               │
        │    y fija umbrales                 │                              │
        ▼                                    ▼                              │
  sgma_plan_formativo  ──────────────▶ contenidoAsignado()                  │
                                             │                              │
                                             │ 7. postMessage               │
                                             │    {tipo:'sgma-puntaje'}     │
                                             ▼                              │
                                    sgma_puntajes_embebidos ────────────────┘
                                             │
                                             │ 8. puntosAcumulados()
                                             ▼
                                       sgma_billeteras
                                    (comprar · enviar · intercambiar)
```

### 4.1 La doble llave

Una actividad se abre solo si se cumplen **las dos** condiciones:

1. **El instructor abrió su módulo** — decisión curricular.
2. **El aprendiz alcanzó el umbral de puntos** — progresión.

La interfaz nunca dice «bloqueado» a secas: dice cuál de las dos llaves falta y cuánto falta.

### 4.2 Umbrales automáticos

Cada actividad asignada es un **nivel** dentro de su módulo, numerado por el orden del catálogo. El umbral automático es `round(puntos_del_módulo_repartidos_antes × FACTOR_UMBRAL)`, con `FACTOR_UMBRAL = 0.5`.

La escalera se cuenta **dentro de cada módulo**, no sobre el árbol entero: así el nivel 1 de todo módulo abierto siempre es accesible, y los puntos escalonan hacia dentro. El instructor puede sobrescribir cualquier umbral desde su panel.

### 4.3 Cómo vuelve el puntaje

Los enlaces a `../assets/embebidos/…` los intercepta `visor.js`, que los abre en un iframe dentro de la plataforma. Al terminar, el embebido hace `parent.postMessage({tipo:'sgma-puntaje', …})` y `embebidos-catalogo.js` lo guarda. Si la actividad se abriera en pestaña propia, el mensaje no llegaría a nadie: **el visor es parte del circuito, no un adorno**.

### 4.4 Economía de puntos

```
disponible = ganados − gastados − enviados + recibidos
```

Los **ganados** son la suma de los mejores puntajes. Lo gastado y lo enviado se lleva en la billetera, **sin tocar el histórico**: el instructor sigue viendo los resultados reales aunque el aprendiz gaste todo.

El aprendiz puede **comprar** mejoras del catálogo, **enviar** puntos a otro participante, **intercambiar** una mejora comprada por la mitad de su costo (`RESCATE_INTERCAMBIO = 0.5`) y **crear** una mejora nueva eligiéndole símbolo, nombre, costo y descripción.


### 4.5 Módulos formativos de cuatro partes

Capa curricular **distinta** de los diez módulos del catálogo. Aquí «módulo» es una
unidad creable por el administrador o el instructor —por ejemplo «Python en inglés»—
compuesta siempre por las mismas **cuatro partes**:

| Parte | Qué contiene |
| --- | --- |
| 📘 Contenido | Material de estudio |
| ⌨️ Práctica | Actividades de ejercitación |
| 📝 Evaluación | Cuestionarios y pruebas |
| 📤 Evidencia | Lo que el aprendiz entrega |

A cada parte se le enganchan actividades del catálogo: **el catálogo sigue siendo la
fuente del material, y esto lo organiza**. Un módulo se considera *armado* cuando sus
cuatro partes tienen contenido.

Cada módulo lleva su **ficha**, su **instructor** —que puede no ser el titular de la
ficha, de modo que varios instructores pueden repartirse los módulos de un mismo
grupo— y el **resultado de aprendizaje que valida**.

**La validación del RA es manual.** El sistema calcula el avance del aprendiz parte por
parte, pero solo el instructor lo aprueba, y queda constancia de quién validó y cuándo.
Nada se aprueba solo.

> **Cuidado con el nombre.** En `plan-formativo.js`, «módulo» son los diez del catálogo
> y una ficha son cuatro de ellos. En `modulos-formativos.js`, «módulo» es esta unidad
> de cuatro partes. Son dos conceptos con el mismo nombre y conviven a propósito.

---

## 5. Roles y responsabilidades

| Rol | Responsabilidades y permisos |
| --- | --- |
| Administrador | Gestiona usuarios y roles; crea fichas; configura parámetros; carga materiales y RA; vincula aprendices; asigna instructores; arma el plan formativo; consulta estadísticas, reportes, directorio, cronograma, sala y resultados de actividades. |
| Instructor | Media el aprendizaje; consulta programa, matrícula, lineamientos y guías; planea formación y cronograma; **arma la ficha, desbloquea módulos y asigna actividades con sus umbrales**; revisa evidencias; califica, retroalimenta, monitorea avance y reporta novedades. |
| Aprendiz | Consulta contenidos y guías; practica los módulos; **recorre su árbol de niveles**; presenta actividades; acumula y administra puntos; entrega evidencias; consulta avance, historial y retroalimentación. |

---

## 6. Estructura de los paneles

### 6.1 Aprendiz

**Menú:** Tablero · Módulo 1 Contenidos · Módulo 2 Evaluaciones · Módulo 3 Práctica · Cronograma · Ficha de aprendizaje · Repositorio.

**Tablero (`sec-home`)** — el `.tablero` azul contiene, de arriba abajo:
1. Barra de título y marcador.
2. **Rejilla de módulos**: 3 columnas que se repiten hacia abajo, una card por módulo del currículo con su portada, estado y candado si está cerrado. Las abiertas llevan al bloque del módulo en «Practicar».
3. Pantalla de actividades.

**Sidebar derecho** — casilla de puntaje (marcador, Mejora / Enviar / Crear mejora) y el bloque Actividad con 8 accesos.

**Módulo 3 → Reportar evidencia de aprendizaje (`sec-evidencias`)** — el centro del sistema para el aprendiz:
- Seis tarjetas de resumen, separando los dos motivos de bloqueo.
- **Árbol de niveles**: una rama por módulo, nodos encadenados con su estado por color.
- Tabla de detalle con nivel, umbral, estado, intentos y puntaje.
- Registro de notificaciones: módulos sin abrir, niveles disponibles con enlace y niveles esperando puntos.

### 6.2 Instructor

**Tablero** — tablero compacto con la actividad de Python, card del módulo con autocompletado sobre el catálogo local, y métricas.

**Sidebar derecho** — bloque Actividad con 12 accesos, alineado con el borde del navbar.

**Ejecución de la formación → Asignar contenido y desbloquear módulos (`sec-plan-formativo`)**
- Selector de ficha y alta de fichas N.
- Estado de armado: «Incompleta · faltan 2 de 4 módulos» o «Ficha armada».
- Tabla de módulos: pertenencia al currículo, desbloqueo, cargar módulo completo.
- Catálogo de 48 actividades con casilla de asignación y umbral editable.

**Ficha → Resultados de las actividades (`sec-resultados-embebidos`)** — consolidado por participante con filtros por ficha y rol, y detalle por actividad.

### 6.3 Administrador

Mismas dos secciones que el instructor, más gestión de usuarios, fichas, sala en tiempo real, estadísticas y reportes. Sidebar Actividad con 8 accesos.

### 6.4 Funciones agregadas — implementación del documento de especificación

Cierre de la brecha entre el documento formal "Funciones del producto" (Módulos 1-3 y
transversales) y el código: 19 puntos identificados como faltantes o parciales,
implementados sobre los módulos ya existentes en vez de crear un sistema paralelo.

- **Sesión de formación real** (`sesiones.js`): el aprendiz solicita ingreso
  (`solicitarIngreso`) desde `sec-reportar-ingreso`; el instructor acepta
  (`aceptarSolicitud`) desde `sec-iniciar-sesion` → «Solicitudes de ingreso»; la
  aceptación abre una ventana de **exactamente 5 horas** (`solicitudVigente`) que
  autentica la asistencia y condiciona el acceso a `sec-guia-en-curso` y al material de
  aprendizaje (2.4), que muestran un aviso en vez del contenido si no hay sesión vigente.
- **Asistencia ponderada**: puntual = 2, tarde = 1, excusa justificada = 0.3 (cuenta en
  el promedio, no en el % de asistencia), no asiste = 0 (`asistencia.js` →
  `resumenPonderadoFicha`). Tablero de tarjetas por ficha en `sec-fichas`
  (instructor), con detalle individual al hacer clic.
- **Alertas de desempeño (`sec-alertas`, RF09)**: dejaron de ser filas fijas; se
  generan solas por baja asistencia ponderada, bajo avance de módulo o módulo «No
  aprobado» (`alertasTempranasFicha`, `seguimiento-modulos-vista.js`).
- **Semáforo de evidencias** (`evidencias.js`, `sec-semaforo`): el aprendiz adjunta
  evidencia, el instructor la marca amarillo (en revisión, por defecto), verde
  (aprobada) o rojo (rechazada, con motivo).
- **Ranking de puntos** (`ranking.js`, `sec-ranking`/`sec-ranking-ins`): puntaje base de
  actividades + bono por módulo formativo aprobado − penalización por novedad
  (falta leve −5, falta grave −15, inasistencia −10, incumplimiento −10, lenguaje o
  conducta inadecuada −15).
- **Consola de práctica de 3 paneles** (`sec-consola`, aprendiz): grid superior
  Ejemplo (snippet real) + Consola de entrada (borrador libre persistido); panel
  inferior de ejecución **simulada** — compara la respuesta escrita contra el
  resultado esperado de un reto fijo, sin intérprete real, tal como lo nombra el
  propio documento de especificación («código simulado»).
- **Solicitudes de requisitos y de equipo SENNOVA** (`requisitos.js`): el aprendiz
  pide hora/lugar/materiales/equipos para la sesión y equipo de los ambientes de
  `pages/Sennova/`; el instructor atiende o rechaza cada solicitud.
- **Cronograma con hora/lugar/materiales/requisitos**: la tabla de actividades
  (`crono-tabla`) pasó de 3 a 7 columnas (`tiempo.js`).
- **Módulos disponibles** (`sec-home`, aprendiz): lista fija de 3 —
  1 ADSO (instructora Zulma Salas), 2 English coding (teacher Alejandra Calixto,
  antes sin ningún módulo asociado en la interfaz), 3 SENA institucional (ancla al
  módulo Sede Tunja).
- **Puntajes por aprendiz**: `sec-resultados-embebidos` (instructor y administrador)
  ganó un selector de aprendiz individual, poblado desde la matrícula real de la
  ficha elegida.
- **Barra de progreso a nivel de ficha**: `progresoTiempoFicha()`
  (`avance-aprendiz.js`) mide días/semanas transcurridas del calendario de la ficha
  (`FASES`, `tiempo.js`), distinta de la rueda de avance individual — visible en el
  reporte acumulado del aprendiz y en el reporte de ejecución del instructor.
- **Visor genérico**: `visor.js` ahora abre PDF y JPG/PNG en el mismo iframe que ya
  usaba para `.html`, y reescribe enlaces de YouTube a `/embed/`. Word/Excel se
  quedan en descarga simulada — no hay forma real de previsualizarlos sin backend.
- **Contraseña del aprendiz visible para administrador**: `sec-listar` agrega una
  columna «Contraseña» calculada del nombre de pila real (la misma que valida
  `login.js`), sin nuevo almacenamiento.
- **Tres actividades embebidas nuevas** (`assets/embebidos/12-practica-ampliada/`):
  cuestionario general de 30 preguntas, juego de unir palabras y significado, video
  de práctica — instructor-asignables desde el catálogo igual que las 51 anteriores.
- **Mensajería cableada** — ver 12.1.

---

## 7. Paleta y sistema visual

Base minimalista blanco y negro; **un solo acento por rol**, declarado en cinco variables CSS:

| Panel | `--acento` | Texto encima |
| --- | --- | --- |
| Aprendiz | `#0F3D1F` verde oscuro | blanco |
| Instructor | `#3FAEBE` azul | blanco |
| Administrador | `#F5C518` amarillo | negro `#1A1A1A` |

Los botones y fichas usan estilo *gloss*: degradado de tres paradas, filo de luz interior arriba y sombra teñida con el acento del rol. El administrador lleva texto oscuro porque blanco sobre amarillo no cumple contraste.

---

## 8. Trazabilidad de requisitos

Esta tabla es el resumen a nivel de RF01-RF13. El detalle fino —los 50 sub-requisitos
(RF01-1 … RF13-3) tal como los define el proyecto formativo formal
`docs/documentacion/AVA SENA.docx`, cada uno con su estado real de implementación
verificado contra el código— vive en `docs/documentacion/informe.md`, que reproduce la
estructura completa de ese documento. Los sub-requisitos que sí tienen código real
detrás quedan resaltados en amarillo dentro del propio `.docx` (nueva fila «Estado de
implementación (código real)» en cada una de sus 50 tablas) para que ambos documentos
queden correspondidos.

| Requisito | Evidencia en el sistema |
| --- | --- |
| RF01 Usuarios y roles | `index.html`, `login.js`, navegación por rol |
| RF02 Contenidos y recursos | `documentos.js` (241 archivos), materiales, índice del material |
| RF03 Resultados de aprendizaje | `ficha.js`, panel de RA |
| RF04 Actividades de formación | **`plan-formativo.js`, `asignar-contenido.js`, 54 embebidos**. Acceso a la guía en curso y al material de aprendizaje condicionado a una sesión aceptada vigente (`sesiones.js` → `solicitudVigente`, ventana de 5 horas) |
| RF05 Evaluaciones | Cuestionarios embebidos con puntaje real; creación de evaluaciones aún maqueta |
| RF06 Retroalimentación | Sección Ver retroalimentación (maqueta) |
| RF07 Práctica de programación | Embebidos, tablero de 64 bits, y la **consola de práctica de 3 paneles** (`sec-consola`): ejemplo, entrada libre y ejecución simulada por comparación de texto |
| RF08 Evidencias | `sec-evidencias` reconstruida como árbol de niveles; **semáforo de evidencias** (`evidencias.js`, `sec-semaforo`) para la validación del instructor |
| RF09 Refuerzo académico | **Alertas de desempeño generadas solas** (`alertasTempranasFicha`), plan de mejora automático, **ranking de puntos** (`ranking.js`) con bono por módulo y penalización por novedad |
| RF10 Fichas | **`fichas-n.js`: fichas virtuales de 4 módulos y 35 cupos** |
| RF11 Talento docente | Planeación, cronograma (con hora/lugar/materiales/requisitos), guías, novedades (falta leve/grave, inasistencia, incumplimiento, lenguaje/conducta inadecuada) |
| RF12 Infraestructura | Ambientes y equipos; **solicitudes de requisitos y de equipo SENNOVA** (`requisitos.js`) atendibles por el instructor |
| RF13 Reportes y trazabilidad | **`resultados-ficha.js`** (con selector de aprendiz individual), `estadisticas.js`, `seguimiento-modulos-vista.js` (reporte de ejecución por aprendiz), barra de progreso a nivel de ficha (`progresoTiempoFicha`) |

---

## 9. Flujo operativo

1. El administrador crea o configura una ficha, asigna instructor y vincula aprendices.
2. El administrador o el instructor arma el plan: elige los 4 módulos, los desbloquea y asigna actividades.
3. El aprendiz entra, ve su árbol de niveles y recorre lo que tiene abierto.
4. Al terminar cada actividad, el puntaje vuelve solo y el árbol avanza.
5. El aprendiz administra sus puntos: compra mejoras, envía a compañeros o intercambia.
6. El instructor y el administrador consultan el consolidado por participante y por actividad.

---

## 10. Correcciones aplicadas

Defectos reales encontrados en el código y corregidos.

| # | Defecto | Impacto | Corrección |
| --- | --- | --- | --- |
| 1 | En `english-python`, la respuesta correcta era **siempre la primera opción** en las 10 preguntas | Se sacaba 100/100 pulsando diez veces el primer botón; el puntaje llegaba al gradebook como legítimo | Barajado Fisher-Yates de las opciones, emparejando por texto |
| 2 | `tablero.js` y `embebidos-catalogo.js` declaraban ambos `leerPuntajes()` global, con formas de retorno distintas | `aprendiz.html` carga los dos: la segunda pisaba a la primera y `tablero.js` reventaba con `TypeError` | Renombrada la privada a `leerPuntajesTablero()` |
| 3 | El enlace de `invitado.html` al curso no llevaba identidad | Todos los invitados caían en la clave `anonimo` y se pisaban entre sí | El enlace arrastra `?u=`, `&n=` y `&pj=` |
| 4 | Las portadas del catálogo apuntaban a imágenes genéricas mientras el HTML ya usaba las nuevas | Cualquier vista generada desde el catálogo mostraba la imagen equivocada | Sincronizadas las 4 entradas afectadas |
| 5 | `mi-contenido.js` reordenaba la lista poniendo lo hecho al final | Rompía la numeración del árbol: el nivel 3 podía salir antes que el 2 | Eliminado el `sort`; el orden de árbol es el contrato |
| 6 | `APRENDICES_FICHA_NUEVA` valía 20 mientras la ficha 2 declaraba 30 cupos | Matrícula y cupos no cuadraban | Unificado en 30 |
| 7 | `getMatricula()` solo cubría la ficha en curso y la 2 | Una ficha N nueva devolvía lista vacía | Cubre cualquier ficha distinta de la real |
| 8 | `aprendiz.html` usaba símbolos de `fichas-n.js` sin cargarlo | Degradaba en silencio a valores por defecto | Script añadido |
| 9 | `.tablero` reservaba una tercera fila de 320px | Franja azul vacía en el tablero del instructor | Clase `tablero-compacto` |
| 10 | Las rejillas del bloque Actividad asumían ancho completo | Desbordamiento horizontal dentro de un sidebar de 250px | Una sola columna dentro del sidebar |
| 11 | `color-mix` sin respaldo | En navegadores sin soporte se caía toda la declaración `box-shadow` | Declaración neutra previa como fallback |

| 12 | El panel del instructor no tenía el índice de material, las guías GAA ni el árbol del repositorio que sí tenía el aprendiz | Zulma no podía consultar el material real de su propia ficha desde su panel | Copiadas las tres secciones y cargado `estructura.js` |
| 13 | Seis textos citaban la **ficha 2847561**, que no existe en el sistema | El programa de formación, el reporte académico y la sala mostraban un número de ficha inventado | Sustituido por `3293836` en las 6 apariciones |
| 14 | La carpeta `docs/ADSO 3293836` se movió a `docs/Fichas/ADSO 3293836` sin avisar al código | **181 rutas rotas** en 6 archivos, incluido el `base` del que cuelga todo el índice documental: el árbol del repositorio y las 33 guías GAA dejaban de abrir | Migradas las 181, en texto plano y percent-encoded, verificando que cada destino existe en disco |
| 15 | `docs/Fichas/Ficha n` trae 35 carpetas de aprendiz, pero el sistema declaraba 30 cupos | Las carpetas 31 a 35 nunca se habrían asignado | `CUPOS_POR_FICHA`, `APRENDICES_FICHA_NUEVA` y `FICHA_INVITADOS.cupos` a 35 || 16 | Las otras nueve prácticas de inglés arrastraban el mismo defecto de la corrección 1: respuesta correcta siempre en la primera opción | 90 preguntas con 900 puntos en juego se resolvían pulsando siempre el primer botón | Propagado el barajado a los nueve, comprobando que cada uno conserva sus preguntas y su `ACTIVIDAD` |
| 17 | El análisis de coordinadores vivía en una página suelta, sin enlazar desde ningún sitio y con su propio sistema visual de 282 líneas | Contenido institucional real inalcanzable desde la plataforma | Integrado en `ADSOsena.html` traduciendo su markup al del proyecto: 18 tablas, 65 insignias, 4 secciones. `analisis_coordinadores_area.html` eliminado tras verificar que los 491 fragmentos de texto migraron |
| 18 | El umbral automático se calculaba sobre el orden del árbol entero, contando los módulos cerrados | Con el plan inicial, HTML salía «Disponible» pero su nivel 1 costaba **200 puntos**: el aprendiz veía el módulo abierto y no podía entrar. Con 0 puntos solo 1 de 12 niveles era accesible | La escalera se cuenta por módulo. HTML nivel 1 pasa de 200 a 0 |
| 19 | El calendario del panel derecho seguía vivo en `sofia_plus.js` y `sofia_plus.css` después de que sus widgets desaparecieran de los tres paneles | 73 líneas de JS y 17 reglas CSS que no pintaban nada | Eliminados tras comprobar que sus 13 clases no las usa ningún HTML ni JS |
| 20 | Tres enlaces apuntaban a `docs/Seccion4_SGMA_ADSO.docx`, archivo borrado del disco aunque seguía en git | La especificación de requisitos no se podía descargar desde ningún panel | Recuperado de git y ubicado en `docs/documentacion/`; los 3 enlaces apuntan ahí |
| 21 | Dentro de `sec-home` (`aprendiz.html`), un `</div>` de más cerraba `panel-solo`/`tablero` una vez de más | El cierre extra arrastraba el cierre implícito de `<main>`/`.page-wrapper` antes de tiempo: **todas** las `view-section` siguientes (incluida `sec-prueba-modulo`) quedaban colgando de `<body>` en vez de `main.main-content`, invadiendo el sidebar fijo | Quitado el `</div>` sobrante |
| 22 | Dos `</section>` sin apertura correspondiente (líneas ~2917 y ~3272 antes del arreglo), sobrantes de una edición anterior | Sin efecto visual (el parser los descarta al no encontrar `<section>` abierto que cerrar) pero HTML inválido | Eliminados ambos, verificado con un parser de árbol DOM que las 32 `view-section` quedan dentro de `main` |
| 23 | `INSTRUCTORES` en `ficha.js` guardaba a Alejandra Calixto con `documento: '09876543210'` (cero inicial de más) | El login fallaba con la cédula real, `9876543210` — «Documento o contraseña incorrectos» | Quitado el cero inicial |
| 24 | `login.js` solo pasaba `&u=` en la redirección de aprendiz e invitado, nunca en la de instructor | El sidebar (`#ses-nombre`, junto a la foto de perfil) se quedaba fijo en el nombre de ejemplo del HTML, `Zulma Salas`, sin importar qué instructor entrara — aunque la casilla `#ins-quien` (más abajo, resuelta por `instructor-identidad.js` vía `?doc=`) sí mostraba el nombre correcto | Sumado `&u=<nombre>` a la redirección de instructor, igual que ya llevaban aprendiz e invitado |

---

## 11. Verificación

El sitio estático sigue sin ejecutarse en un navegador real durante el desarrollo — la comprobación es estática, con scripts propios que verifican en cada cambio:

- Balance de llaves, paréntesis y corchetes de los JS, ignorando cadenas y comentarios.
- Que todo `getElementById` del JS corresponda a un `id` existente en las páginas que lo cargan.
- Que cada símbolo externo esté definido **antes** según el orden real de los `<script>` (crítico al reordenar rutas, como en la reorganización por carpetas de 2.3: mismo orden de carga, solo cambia el prefijo de ruta).
- Cero colisiones de nombres globales entre los 39 módulos.
- Que las columnas declaradas en `<thead>` cuadren con las celdas que agrega el JS.
- Que las clases usadas por el JS tengan regla CSS.
- Balance de etiquetas HTML e ids sin duplicar — con un parser real de árbol DOM (no solo grep), que fue lo que encontró la corrección 21.

Desde el 14 de agosto sí hay Node en el equipo de trabajo: el backend de 2.5 se probó arrancándolo de verdad (`npm start`) y con peticiones HTTP reales, no solo lectura estática.

---

## 12. Problemas abiertos

### 12.1 Mensajería — el chat quedó cableado, el correo sigue pendiente

`mensajeria.js` (correo + chat) y `mensajeria-vista.js` (pintado de ambos) llevaban
tiempo en disco sin que ninguna página los cargara. Al implementar el punto
transversal "envío de notificaciones y mensajes, no más de 50 caracteres" del
documento de especificación, se resolvió **solo la mitad**:

- **Chat — resuelto.** `<body data-rol="…">` se agregó a las 3 páginas (antes no
  existía, y `yoSoy()` en `mensajeria.js` depende de él). El manejador de
  `#chat-form` que ya vivía en `sofia_plus.js` (antes local, sin persistir, sin
  cruzar roles) se reescribió para usar `enviarMensajeChat()`/`getChat()` de
  verdad, con el tope de 50 caracteres (`maxlength` en el HTML y
  `LIMITE_MENSAJE_CHAT` en el JS) y sincronización entre pestañas por el evento
  `storage`. Se cargó `mensajeria.js` en las 3 páginas.
- **Correo (bandeja) — sigue sin cablear.** `mensajeria-vista.js` espera un
  `id="correo-lista"` para pintar `getCorreos()`, pero la bandeja *offcanvas* de
  las 3 páginas ya tiene contenido real hardcodeado con la clase (no el id)
  `correo-lista`, con su propio marcado (`correo-item`, `correo-cabecera`, etc.)
  incompatible con lo que pinta `mensajeria-vista.js` (`correo-barra`,
  `correo-avatar`…). Cablearlo implicaría reemplazar ese contenido — se dejó fuera
  de esta implementación por el riesgo de pisar una hoja que ya funciona; queda
  como el problema abierto real de esta sección.

### 12.2 Duplicación en `aprendiz.html`

Las diez secciones `modulo-*` de «Practicar» tienen un clon casi idéntico `modulo-*-en` en `sec-prueba-modulo`; varios bloques son byte por byte iguales. Además la sección `modulo-python-en` quedó a medias: sus títulos dicen inglés pero los enlaces abren el material de Python.

### 12.3 Backend provisional, no generalizado

`localStorage` es **por navegador y por origen**. El instructor solo ve lo jugado en su mismo equipo. Funciona de verdad entre pestañas del mismo navegador —de ahí el `storage` que sincroniza los paneles al instante—, pero no entre máquinas.

Es la limitación de fondo del prototipo, y sigue afectando a plan formativo, billeteras y mensajería por igual, y a dos de los tres sistemas de puntaje (`embebidos-catalogo.js`, `actividad.js`). Desde el 14 de agosto existe un backend real (Express + Mongoose, ver 2.5) para el tercero (`tablero.js`, quiz10/quiz30), pero:

- La conexión a MongoDB Atlas está pendiente de whitelistear la IP del equipo de trabajo — hoy el servidor arranca y corta la conexión con error, así que **en la práctica nada se está guardando todavía**.
- Aunque conectara, solo cubre un cuestionario de los tres sistemas de puntaje; el resto sigue siendo exclusivamente `localStorage`.
- El reporte consolidado para el instructor (`GET /api/resultados/reporte/instructor`) existe en el backend pero **ningún panel lo consume**: `sec-resultados-embebidos` sigue leyendo solo de `localStorage`, igual que antes.

En resumen: el camino hacia un backend real está empezado, pero el sistema sigue siendo, en la práctica, un prototipo `localStorage`.

---

## 13. Pendientes para producción

Autenticación segura con contraseñas cifradas, control de acceso real en servidor, copias de seguridad, auditoría, protección de datos personales conforme a la Ley 1581 de 2012 —`aprendices.js` contiene documentos, teléfonos y direcciones reales de 27 personas—, integración institucional y exportación real de reportes.

La base de datos ya no está sin empezar (ver 2.5 y 12.3), pero sigue lejos de producción: falta conectar Atlas (whitelist de IP pendiente), cubrir los otros dos sistemas de puntaje además de `tablero.js`, exponer el reporte del instructor en algún panel, y sobre todo un control de acceso real — hoy cualquiera que sepa la cédula de un aprendiz puede reportarle un resultado por la API, sin verificación alguna.

Deben conservarse los requisitos no funcionales del PDF: usabilidad, compatibilidad móvil, disponibilidad, rendimiento, mantenibilidad, escalabilidad, integridad, interoperabilidad y portabilidad web.

---

## 14. Fuentes y documentos relacionados

Consolidado desde `docs/manuales y documentacion/AVA sena.pdf` —propósito, módulos, roles, requisitos RF01–RF13 y restricciones— y contrastado contra el código. Este es el único documento de arquitectura y funcionamiento del sistema: el 16 de agosto de 2026 se eliminaron nueve documentos redundantes que describían estados anteriores del sistema (antes de la reorganización de `assets/js/`, de `assets/embebidos/` y del backend `server/`) — cinco `.md` en `documento/obsoleto/`, dos `.docx` de borrador (`AVASENA_documentacion_actualizada.docx`, `AVASENA_documentacion_sistema.docx`), un `.doc` (`REPORTE_SISTEMA_LMS_SENA.doc`) y dos copias de `Seccion4_SGMA_ADSO.docx` duplicadas del archivo que de verdad enlaza el sitio, en `docs/documentacion/`. Ante cualquier documento que reaparezca por fuera de este archivo, manda este documento.

El archivo `docs/manuales y documentacion/AVASENA.docx` permanece porque está corrupto (offset de directorio central inválido) y no se puede abrir ni para verificar si contiene algo distinto.
