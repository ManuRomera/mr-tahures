# Changelog

## 3.0.0 — 2026-10-17

Primera versión pública con la marca MR: el antiguo «Queso o Mentira» reescrito y rebautizado de arriba abajo. Cambia el id del módulo (`queso-mentira` → `mr-tahures`) y el nombre; no hay migración, la partida en curso de versiones anteriores no se conserva.

- 🎲 **Registro de juegos** y dos juegos: Dado del Mentiroso y **Mia / Meyer** (nuevo).
- 🎭 **Cinco skins** con arte propio: El Garito, La Taberna, El Camarote, El Saloon y La Cantina Neón; selector en el formulario y en los ajustes.
- 🙈 **Manos privadas:** los dados ya no viajan en el ajuste público de la partida; cada dueño recibe los suyos por mensaje dirigido y se recuperan al recargar.
- 🔒 Validación en el GM de cada jugada (dueño del actor y turno) y solo procesa el GM activo.
- 🤖 IAs con personalidad (farolera, cauta, observadora con memoria) y frases de taberna.
- 🧩 Reglas **clásicas** o **de la casa** para calzar y palifico.
- 💰 **Bote** con dinero del actor (ruta configurable), pago al ganador y reembolso al cancelar.
- 🪟 ApplicationV2 y DialogV2; compatibilidad con Foundry v13.
- 💬 Revelación en el chat con las manos de todos, copa levantada en Mia y fichas de vida.
- 🖼️ Dados dibujados con las imágenes de cada skin (con respaldo en CSS puro), iconos SVG tintables y mensajes de chat con la marca del módulo.
- 🧪 Motor de reglas puro con 28 tests; guía para añadir juegos en `docs/JUEGOS.md`.

## Versiones anteriores (1.x, no publicadas en releases)

Dado del Mentiroso con IA básica / experta / tramposa, palifico opcional y jugadores tramposos, sobre ventanas V1.
