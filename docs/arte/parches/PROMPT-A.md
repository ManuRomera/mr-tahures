# Parche A — 3 texturas a rehacer (obligatorio)

> Pega TODO lo de debajo de la línea en el mismo proyecto/chat donde generaste los 5 kits. Adjunta `arte-spec-parche-A.json` y `verificar_zip.py`.

---

You already delivered the five skin packs of **Queso o Mentira** and all five passed the automatic check. I then reviewed every image by eye (tiling them 2×2, comparing the five skins side by side) and found **three real defects in three texture files**. Redo ONLY these three files. Keep exactly the same path, pixel size (1024×1024), format (WebP, quality 86, method 6, RGB with no alpha) and seamless tiling. Do not touch anything else. Speak to me in Spanish; write image prompts in English.

## Defect 1 — `assets/skins/oeste/ui/panel.webp`
**What is wrong:** straight fold/crease lines cross the texture at regular positions, so when tiled they draw a visible grid of squares.
**What I need:** brittle, aged frontier poster paper (tone around `#d9c7a0`, same family as now), but with **NO folds, creases, straight lines, scratches or edges of any kind**. Only soft organic mottling, fine paper fibres and very slight darkening patches. Very low contrast so dark text on top stays readable. Tile it 2×2: no grid, no repeating hero stain.

## Defect 2 — `assets/skins/garito/ui/mesa.webp`
**What is wrong:** isolated glass-ring stains and burn marks are clearly visible and repeat in a conspicuous pattern when tiled.
**What I need:** uniform worn green baize (`#14352c` to `#1f4a3a`) with only micro-variation: wool fibre grain and very faint broad lightness drift. **No isolated stains, rings, burns, scratches or marks at all** (those will be added later in code). Flat lighting. Tile it 2×2: no repetition visible to the eye.

## Defect 3 — `assets/skins/neon/ui/panel.webp`
**What is wrong:** saturated cyan, magenta and yellow dashes make the panel busy and text laid over it is hard to read.
**What I need:** dark smoked glass with a barely visible hex grid and faint scanlines. **No saturated coloured specks.** Luminance of every pixel between about 6 % and 22 % (very dark); the grid lines at most a few percent brighter, tinted cold cyan-grey, never fully saturated. Tile it 2×2 seamlessly.

## How to deliver
1. Produce the three files, check each tiled 2×2 and show me the three 2×2 tests.
2. Build `queso-mentira-arte-parche-A.zip` containing ONLY these three files at their exact paths (the zip root contains the folder `assets/`).
3. Run `python3 verificar_zip.py queso-mentira-arte-parche-A.zip arte-spec-parche-A.json` and do not stop until it prints `TODO CORRECTO`.
