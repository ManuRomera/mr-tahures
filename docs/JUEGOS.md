# Cómo añadir un juego de taberna

Cada juego es un **motor puro** (sin Foundry, con tests) más un **objeto registrado** que lo conecta con Foundry. Ejemplos completos: `scripts/engine/mia.js` + `scripts/games/mia.js`.

## Piezas

1. `scripts/engine/<juego>.js`: reglas, validación y decisión de la IA. Puede reutilizar `applyLosses`, `canAct`, `rollHand`, `recordReveal` y `liarRate` (se reexportan desde `engine/liars-dice.js`).
2. `tests/<juego>.test.mjs`: `node --test tests/`.
3. `scripts/games/<juego>.js`: llama a `core.registerGame({...})`.
4. `templates/<juego>-tray.html` y `<juego>-gm-tray.html`: bandeja del jugador y del GM (un solo elemento raíz).
5. Textos en `lang/es.json` y `lang/en.json`, y una línea `import "./games/<juego>.js"` en `scripts/mr-tahures.js`.
6. Si tiene opciones propias, una sección `<div data-game="<id>">` en `templates/select-actors.html` (solo se ve con ese juego elegido).

## Interfaz de `registerGame`

| Campo | Para qué |
|---|---|
| `id`, `title` (clave de idioma), `icon`, `lifeSymbol` | Identidad; el símbolo dibuja las vidas/dados en el chat de situación |
| `trayTemplate`, `gmTemplate` | Plantillas de las bandejas |
| `registerSettings()` | Ajustes propios del juego |
| `optionsContext()` | Valores del formulario de partida (se mezclan en el contexto de la plantilla) |
| `startGame(formData)` | Lee el formulario, crea la sesión `{game: id, jugadores, turno, ...}` y llama a `core.beginGame(this, S, ante)` |
| `intro(S)` | HTML del mensaje de inicio |
| `startRound()` | Tira, guarda con `core.saveFull`, envía manos con `core.sendHands`, `core.promptTurn()` |
| `aiPlay()` | Turno de una IA (se llama solo si le toca a un jugador `type: "ia"`) |
| `onPlayerAction(S, ix, action, payload)` | **GM**: acción de un jugador, ya validada (dueño y turno) |
| `onTrayAction(action, ix, {gm})` | **Cliente**: botón pulsado en una bandeja; envía `PLAYER_ACTION` por socket (o actúa directo si es el GM) |
| `trayContext(S, me, hands)` / `gmContext(S)` | Datos extra para las plantillas |

Las acciones de botón disponibles son `raise`, `lie`, `spoton`, `doubt`, `accept` y `announce` (lista `ACTIONS` en `mr-tahures.js`; añade ahí las nuevas).

## Reglas de oro

- **La sesión pública no lleva información secreta.** Los dados viven en `jugadores[].dados` solo en el GM (`core.loadFull/saveFull`); cada dueño recibe lo suyo con `core.sendHands`.
- Las vidas/dados son `dadosRestantes`; así `core.resolveRound`, el bote, la eliminación y el botón −1 del chat funcionan sin código extra.
- Toda acción de jugador pasa por `Engine.canAct` en el GM; no te saltes esa validación.
- API: `game.modules.get("mr-tahures").api` expone `registerGame`, `GAMES` y `core` tras el hook `setup`. Registrar juegos desde otro módulo aún **no está soportado de forma estable** (sus ajustes tendrían que registrarse en `setup`, antes de que el selector los lea); de momento los juegos se añaden dentro de este módulo.

## Siguientes juegos previstos

Diez Mil / Farkle, Capitán Barco y Tripulación, Chuza/Craps, Siete y media, Tabas, Pulso y concurso de bebida (ver `PLAN.md`, Fase 5).
