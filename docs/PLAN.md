# Tahúres — Plan de mejora

Estado de partida (oct 2026): la copia local es **v1.6.1** (con jugadores «tramposos» y botón de vista GM); GitHub sigue en **v1.3.1**; `module.json` dice **0.7.0**. Un solo script de ~820 líneas, ventanas V1 (`Application`/`FormApplication`), compat declarada V11–V12.

Decisiones abiertas (marcadas **[D]**) al final.

---

## Fase 1 — Cimientos (hecha, v1.7.0)

Objetivo: que lo que hay sea correcto, seguro y mantenible antes de añadir nada.

1. **Motor de reglas puro** (`scripts/engine/liars-dice.js`, sin dependencias de Foundry): recuento con comodines, validación de apuestas, resolución de «¡Mentira!» y «Calzar», pérdida de dados/eliminación, siguiente turno, probabilidad binomial y decisión de las tres IA.
2. **Tests** con `node --test` (`tests/engine.test.mjs`), sin dependencias.
3. **El módulo usa el motor**: `mr-tahures.js` deja de tener la lógica duplicada.
4. **Validación en el GM** de cada acción de jugador: solo actúa quien es dueño del actor al que le toca, y solo el GM activo procesa (hoy, con dos GM conectados, todo se ejecuta dos veces; y cualquier cliente puede enviar `callerIx` arbitrario).
5. **Higiene del repo**: `module.json` a la versión real, `LICENSE` (el README lo cita y no existe), `.gitignore`, `package.json` mínimo, quitar el `.zip` del repo (lo genera la release), README sin el enlace roto del manifiesto.
6. **Sincronizar con GitHub**: la copia local manda; subir tras tu visto bueno.

Fuera de la Fase 1 a propósito: manos privadas (requiere reescribir el flujo de datos de las bandejas → Fase 2) y ApplicationV2.

## Fase 2 — Interfaz, compatibilidad y privacidad (hecha en V13, v2.0.0)

Hecho: ApplicationV2/DialogV2, manos privadas (GM por ajuste de cliente, jugadores por socket dirigido, recuperación al recargar), revelación en el chat, compat V13, cierre de bandejas, alt localizado, escapado de nombres, GM fuera de las bandejas de jugador. Probado en Foundry 13.351 con GM + jugador. **Pendiente de la fase:** Dice So Nice, ajustes de módulo (volumen/velocidad/tema), selector sin tokens, lupa, probar en V14 (no instalado aquí; `verified` sigue en 13).


- **ApplicationV2 + `HandlebarsApplicationMixin`**; `DialogV2` para la apuesta (`icon` y `label` por separado); compat **V13/V14** (`getSceneControlButtons` pasa a objeto, `renderChatMessageHTML`, `toggleStatusEffect`).
- **Manos privadas**: hoy los dados de todos viajan en el ajuste de mundo `session` y cualquier jugador los lee desde la consola. Pasar las manos a memoria/ajuste de cliente del GM y enviar a cada dueño la suya por socket dirigido (los tramposos reciben las ajenas).
- **Revelación en el chat** con los dados de todos dibujados y los que cuentan resaltados; integración con **Dice So Nice** (tirada 3D del recuento).
- **Sin depender de tokens**: sentar a usuarios/actores desde un selector aunque no haya escena; ficha de mesa con avatares, turno resaltado y dados restantes.
- Ajustes de módulo (volumen, silenciar, velocidad de IA, tema) en Configuración; diagnóstico solo ahí.
- Accesibilidad: texto alternativo, foco en teclado, contraste, no depender solo del color/estrellas.
- Lupa sobre los dados; arte grande en chat.
- Cierre correcto de bandejas al terminar (hoy `CLOSE_ALL_TRAYS` nunca se emite).

## Fase 3 — Reglas y variantes (hecha en parte, v2.1.0)

Hecho y probado en Foundry 13.351: calzar y palifico clásicos como opción (selector «De la casa / Clásica», por defecto la casa — decide D2), IA con personalidad (farolera, cauta, observadora con memoria de mentiras) y frases de taberna, bote con dinero (ruta configurable en Ajustes del módulo; los actores sin ese campo juegan por la casa; pago al ganador y reembolso al cancelar). **Pendiente:** subida de ases (Perudo), temporizador de turno, deshacer del GM e historial.


- **Calzar estándar** como opción (hoy: acierto → todos los demás pierden 1; fallo → pierdes 2; la regla clásica es: acierto → recuperas un dado). Selector «Reglas de la casa / Clásicas».
- **Palifico por jugador** (hoy se activa para todos en cuanto alguien tiene 1 dado; en el clásico lo elige quien llega a 1 dado, una vez).
- Subida de ases (reglas Perudo: apostar ases divide la cantidad).
- Temporizador de turno opcional; deshacer del GM; historial de la partida.
- **IA con personalidad**: farolera, cauta, vengativa, que recuerda cómo apostó cada rival; bluff real (hoy la experta nunca farolea). Nombres y frases de taberna.
- **Apuestas con dinero**: bote configurable y atributo del actor (ruta configurable, p. ej. `system.monedas.value`) para ser agnóstico al sistema.

## Fase 4 — Plataforma multijuego (hecha en lo esencial, v2.2.0)

Hecho y probado en Foundry 13.351: registro de juegos (`core.js`, `games/*`), selector de juego con opciones propias, API `game.modules.get("mr-tahures").api`, guía en `docs/JUEGOS.md`. **Pendiente:** hooks públicos (`mr-tahures.roundEnd`…), temas de mesa, registro desde módulos de terceros, macro de apertura.


- Registro de juegos (`Tahures.registerGame({id, name, engine, ui})`) para que cada juego sea un motor puro + una vista.
- API pública y hooks (`mr-tahures.roundEnd`, `mr-tahures.gameEnd`, `mr-tahures.bet`) para que los sistemas de Manu enganchen recompensas.
- Temas de mesa: pulp-militar (actual), taberna medieval, pirata, noir, cantina sci-fi.
- Selector de juego en la barra de escenas; macro de apertura.

## Fase 5 — Juegos de taberna (orden propuesto por coste/valor)

**Hecho:** nº 1, Mia / Meyer (v2.2.0): anuncio con farol, dudar/aceptar, vidas (Mia vale 2), 6 personalidades de IA, bote y manos privadas. Siguiente: Diez Mil / Farkle.


| # | Juego | Por qué | Dominio público |
|---|---|---|---|
| 1 | **Mia / Meyer** (dados con cubilete y mentira encadenada) | Mismo ADN de farol; casi gratis sobre el motor actual | sí |
| 2 | **Diez Mil / Farkle** (empujar la suerte) | Muy rápido de jugar entre escenas | sí |
| 3 | **Capitán, Barco y Tripulación** | Temática pirata, 5 dados, reglas mínimas | sí |
| 4 | **Chuza / Craps / Hazard** con apuestas laterales | Clásico de taberna medieval/western | sí |
| 5 | **Siete y media** (baraja española) | Cartas con `Cards` de Foundry, muy hispano | sí |
| 6 | **Tabas / Hueso** (astrágalo) | Juego tradicional; 4 resultados, ideal para ambientación | sí |
| 7 | **Pulso y concurso de bebida** | No son dados: tiradas enfrentadas del sistema (fórmula configurable) con narración | — |
| 8 | **Generala / Yahtzee-like** | Más largo; para sesiones de mesa | sí (reglas) |
| 9 | **Guiñote / Brisca / Tute** | Cartas por parejas; es el más caro | sí |

Todos reutilizan: sentarse a la mesa, turnos, bote, chat de revelación, sonidos, IA con personalidad.

## Fase 6 — Extras de rol

- **Trampas con tirada**: el jugador intenta ver/cambiar un dado (Juego de manos) y los demás pueden descubrirlo (Percepción/Perspicacia), con fórmula configurable por sistema.
- **Parroquianos con memoria**: PNJ habituales con personalidad, reputación y deudas entre partidas.
- **Torneo de taberna**: cuadro eliminatorio con premio.
- **Diario de partidas** y marcador (JournalEntry generado).
- Opcionales solo si se piden: tutorial guiado (`foundry.nue.Tour`) y mesa a pantalla completa.

## Fase 7 — Publicación

- CI de release por tag con `scripts/zip.mjs` y comprobación del contenido del zip.
- GitHub Pages con manual y capturas; ES/EN completos, estructura lista para más idiomas.
- Créditos y licencia del arte y los sonidos (comprobar origen de los `.ogg`).
- Probar en V13 y V14 limpios.

---

## Decisiones abiertas

- **[D1] Resuelta:** el módulo se llama **MR- Tahúres** (id `mr-tahures`, antes «Queso o Mentira»).
- **[D2]** Reglas por defecto: ¿mantener las de la casa actuales o pasar a las clásicas? Recomendado: mantener las actuales por defecto y ofrecer el selector (Fase 3).
- **[D3]** ¿Un módulo con todos los juegos o módulos separados por juego? Recomendado: uno solo con registro de juegos.
- **[D4]** Fecha tope de compat: V13 mínimo, V14 verificado. ¿Se abandona V11/V12?

---

## Estado visual (2026-10-17, v2.4.0)

Cinco skins integradas con arte propio (`assets/skins/<skin>/`, 126 imágenes): garito, taberna, pirata, oeste, neón. CSS en `styles/mr-tahures.css` (variables por skin) y `styles/skins.css` (generado por `docs/arte/gen_skins_css.py`). Sin arte, cada skin cae al diseño CSS puro.
**Pendiente de arte:** parches A (3 texturas) y B (32 dados) en `docs/arte/parches/`; al llegar basta con sustituir los archivos del mismo nombre. **Hecho (v2.5.0):** 17 iconos SVG de un color (`assets/icons/`, generador `docs/arte/gen_iconos.py`, tintables con `currentColor`): 6 acciones, 3 jugadores y 8 emblemas de juego (los de Fase 5 ya están listos). **Pendiente de diseño:** dado oculto de rivales, banner del README, escena de mesa como acción del GM, tipografías propias.
