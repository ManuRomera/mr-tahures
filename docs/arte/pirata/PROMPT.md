# Prompt - skin «El Camarote» (`pirata`)

> Pega TODO lo que hay debajo de la línea en el chat que genera las imágenes. Adjunta también `arte-spec.json` y `verificar_zip.py` de esta carpeta. Te entregará el zip de esta skin; ese es el que me traes.

---

You are the art director and production artist for a Foundry VTT module of **tavern bluffing-dice games** (Liar's Dice, Mia/Meyer and more). The module has several visual **skins** for different settings; I need the complete art pack of ONE skin, **"El Camarote"**, delivered as ONE zip file. Speak to me in Spanish, but write every image prompt in English.

## 1. Art direction

**Skin setting:** 18th-century pirate ship's cabin at night: swaying lantern, rum, salt and tar, a game that ends with a knife in the table.

**Tone: serious, adult, rogue ("canalla").** Gritty, atmospheric, a little menacing, with dry humour at most - NEVER
cute, NEVER cartoonish, NEVER mascots, NEVER bright toy colours. Think graphic-novel noir (Mignola / Sin City flat
lighting meets painterly concept art): strong chiaroscuro, hard directional light, worn and used objects, scratches,
stains, patina. These are the tools of people who gamble for money they cannot afford to lose.

**Rendering (identical in EVERY image of this skin):** hand-painted illustration with visible but subtle brush/paper
grain; hard key light from the UPPER-LEFT, deep shadows, restrained warm or cool rim light as the palette dictates;
clean, bold, readable silhouettes (these images are shown very small in a UI: 24-96 px for dice and tokens);
thin dark contour line (#120c08) of about 2 % of the object's width. NOT photorealistic, NOT flat vector, NOT pixel
art, NOT glossy plastic 3D, NOT anime, NOT cute.
**Absolutely no text, letters, numerals, watermarks or logos in any image** (dice pips are dots). Typography is added
later in code.

**Palette for this skin (stick to these hues; shading may go lighter/darker):** tarred plank `#2a2118` / `#4a3a2a` · rope tan `#b59a6a` · verdigris `#3f7a6b` · rum amber `#a8651f` · sea-chart parchment `#d8c79a` · rust red `#8b3a22` · ink `#16110c` · lantern `#ffcf80`

**Materials:** tarred planks, salt-stained canvas, hemp rope, rusted iron, scrimshawed ivory, brass, sea charts.

## 2. Technical rules (non-negotiable)

1. **Exact deliverables.** Every file below must exist with EXACTLY the path, pixel size and format listed. Not one
   pixel off. If your generator cannot output that size, generate larger/closest and then resize/crop with Python
   (Pillow, LANCZOS) to the exact size; never stretch non-uniformly (crop instead).
2. **Transparent assets** (`bg = transparent`): PNG, RGBA, truly transparent background (alpha 0), clean anti-aliased
   edges, no white/black/magenta fringe, no baked drop shadow, no ground plane. If your image tool cannot output real
   transparency, generate the subject on a flat pure `#FF00FF` magenta background and remove it with Python
   (chroma-key + despill + edge feather) - NO magenta pixels may remain, not even faintly on edges.
   The subject must be **centered** and leave at least the listed `margin` of empty space on every side.
3. **Opaque assets** (`bg = opaque`): no alpha channel at all (RGB). Textures marked `tile` must be **seamlessly
   tileable** (in both directions unless the file says horizontal only): after generating, make them tileable with
   Python (offset by half the image, blend the seams) and test by tiling 2x2 - no visible seams, no repeating hero
   features.
4. **Formats:** PNG for transparent images; WebP (lossy, quality 86, method 6) for opaque images.
5. **Consistency is the whole point.** The group `dice` must look like one physical set photographed identically (same
   camera, same size, same lighting, same material). Preferred technique: generate ONE blank die once, then build the
   six faces + wild + hidden variants by compositing the same pip sprite at the standard pip positions with Python, so
   the cube is pixel-identical across files. Do the same for the three button plates (same construction, same
   lighting) and for the four tokens (same style and stroke weight).
6. **Size budget:** each file <= 400 KB (dice <= 150 KB), whole zip <= 25 MB.
7. **Readability test:** downscale every transparent image to 32 px (dice to 24 px) and look at it. Pips and token
   meaning must still be obvious. If not, redo it bolder and simpler. High contrast between pip and die body is a must.
8. **File names:** exactly as listed (lowercase ASCII, hyphens, no accents, no spaces).

## 3. How to work

**Step 0 - tools.** Tell me whether you can (a) generate images and (b) run Python to resize, chroma-key, tile-test and
build a zip. If you cannot run Python, say so and tell me what you can and cannot guarantee.
**Step 1 - style lock.** Produce ONE reference image first (`brand/emblema.png`) and show it to me. Wait for my "ok" or
corrections. Reuse that look for everything.
**Step 2 - production in batches**, in this order, showing me a contact sheet after each batch:
dice -> cup -> ui -> tokens -> scene. Fix anything that fails the readability test
before moving on.
**Step 3 - verify.** If I attach `arte-spec.json` and `verificar_zip.py`, run
`python3 verificar_zip.py queso-mentira-arte-pirata.zip arte-spec.json` and do not stop until it prints `TODO CORRECTO`.
If they are not attached, implement the same checks yourself (existence, exact size, format, alpha/no-alpha, margin,
no magenta, tileability) and print the table.
**Step 4 - deliver** `queso-mentira-arte-pirata.zip` containing the files at the paths below, preserving folders (the
zip root contains the folder `assets/`), plus nothing else. Reply in Spanish; write all image prompts in English.

## 4. The assets (25 files)

Paths are relative to the zip root and must start with `assets/skins/pirata/`. `margin` = minimum empty border on every side, in % of the image size (transparent assets only).

| # | File | Size (px) | Format | Background | Tileable | Margin | Group |
|---|---|---|---|---|---|---|---|
| 1 | `assets/skins/pirata/dice/die-1.png` | 512×512 | PNG | transparent | no | 8 % | dice |
| 2 | `assets/skins/pirata/dice/die-2.png` | 512×512 | PNG | transparent | no | 8 % | dice |
| 3 | `assets/skins/pirata/dice/die-3.png` | 512×512 | PNG | transparent | no | 8 % | dice |
| 4 | `assets/skins/pirata/dice/die-4.png` | 512×512 | PNG | transparent | no | 8 % | dice |
| 5 | `assets/skins/pirata/dice/die-5.png` | 512×512 | PNG | transparent | no | 8 % | dice |
| 6 | `assets/skins/pirata/dice/die-6.png` | 512×512 | PNG | transparent | no | 8 % | dice |
| 7 | `assets/skins/pirata/dice/die-1-wild.png` | 512×512 | PNG | transparent | no | 8 % | dice |
| 8 | `assets/skins/pirata/dice/die-hidden.png` | 512×512 | PNG | transparent | no | 8 % | dice |
| 9 | `assets/skins/pirata/cup/cubilete-cerrado.png` | 768×768 | PNG | transparent | no | 6 % | cup |
| 10 | `assets/skins/pirata/cup/cubilete-levantado.png` | 768×768 | PNG | transparent | no | 6 % | cup |
| 11 | `assets/skins/pirata/ui/mesa.webp` | 1024×1024 | WEBP | opaque | yes | 0 % | ui |
| 12 | `assets/skins/pirata/ui/panel.webp` | 1024×1024 | WEBP | opaque | yes | 0 % | ui |
| 13 | `assets/skins/pirata/ui/marco.webp` | 1024×1024 | WEBP | opaque | yes | 0 % | ui |
| 14 | `assets/skins/pirata/ui/esquina.png` | 192×192 | PNG | transparent | no | 4 % | ui |
| 15 | `assets/skins/pirata/ui/divisor.png` | 900×60 | PNG | transparent | no | 2 % | ui |
| 16 | `assets/skins/pirata/ui/cabecera.webp` | 1200×96 | WEBP | opaque | yes | 0 % | ui |
| 17 | `assets/skins/pirata/ui/boton-primario.webp` | 512×128 | WEBP | opaque | no | 0 % | ui |
| 18 | `assets/skins/pirata/ui/boton-peligro.webp` | 512×128 | WEBP | opaque | no | 0 % | ui |
| 19 | `assets/skins/pirata/ui/boton-secundario.webp` | 512×128 | WEBP | opaque | no | 0 % | ui |
| 20 | `assets/skins/pirata/tokens/vida.png` | 128×128 | PNG | transparent | no | 8 % | tokens |
| 21 | `assets/skins/pirata/tokens/perdido.png` | 128×128 | PNG | transparent | no | 8 % | tokens |
| 22 | `assets/skins/pirata/tokens/moneda.png` | 128×128 | PNG | transparent | no | 8 % | tokens |
| 23 | `assets/skins/pirata/tokens/bolsa.png` | 128×128 | PNG | transparent | no | 8 % | tokens |
| 24 | `assets/skins/pirata/scene/mesa.webp` | 2560×1440 | WEBP | opaque | no | 0 % | scene |
| 25 | `assets/skins/pirata/brand/emblema.png` | 1024×1024 | PNG | transparent | no | 5 % | brand |


### Group: dice

**`assets/skins/pirata/dice/die-1.png`** — 512×512 PNG, transparent
- Where it is used: Dado, cara 1 (bandejas, chat de revelación, apuesta actual; 24-96 px).
- Image prompt: A single six-sided die seen almost straight from above so the TOP FACE is large and square-on, with only a hint of the two lit side faces (very slight 3/4 bevel). Die of old yellowed ivory/whalebone with faint scrimshaw hairline cracks, worn edges; the pips are dark sepia ink (#2a1a0e) circles. Pips are VERY LARGE, bold and high-contrast so they read at 24 px. Standard pip layout. No shadow, no ground, no text, no numerals. Centered with generous margin. The top face shows exactly 1 pip (one large centered pip).

**`assets/skins/pirata/dice/die-2.png`** — 512×512 PNG, transparent
- Where it is used: Dado, cara 2 (bandejas, chat de revelación, apuesta actual; 24-96 px).
- Image prompt: A single six-sided die seen almost straight from above so the TOP FACE is large and square-on, with only a hint of the two lit side faces (very slight 3/4 bevel). Die of old yellowed ivory/whalebone with faint scrimshaw hairline cracks, worn edges; the pips are dark sepia ink (#2a1a0e) circles. Pips are VERY LARGE, bold and high-contrast so they read at 24 px. Standard pip layout. No shadow, no ground, no text, no numerals. Centered with generous margin. The top face shows exactly 2 pips.

**`assets/skins/pirata/dice/die-3.png`** — 512×512 PNG, transparent
- Where it is used: Dado, cara 3 (bandejas, chat de revelación, apuesta actual; 24-96 px).
- Image prompt: A single six-sided die seen almost straight from above so the TOP FACE is large and square-on, with only a hint of the two lit side faces (very slight 3/4 bevel). Die of old yellowed ivory/whalebone with faint scrimshaw hairline cracks, worn edges; the pips are dark sepia ink (#2a1a0e) circles. Pips are VERY LARGE, bold and high-contrast so they read at 24 px. Standard pip layout. No shadow, no ground, no text, no numerals. Centered with generous margin. The top face shows exactly 3 pips.

**`assets/skins/pirata/dice/die-4.png`** — 512×512 PNG, transparent
- Where it is used: Dado, cara 4 (bandejas, chat de revelación, apuesta actual; 24-96 px).
- Image prompt: A single six-sided die seen almost straight from above so the TOP FACE is large and square-on, with only a hint of the two lit side faces (very slight 3/4 bevel). Die of old yellowed ivory/whalebone with faint scrimshaw hairline cracks, worn edges; the pips are dark sepia ink (#2a1a0e) circles. Pips are VERY LARGE, bold and high-contrast so they read at 24 px. Standard pip layout. No shadow, no ground, no text, no numerals. Centered with generous margin. The top face shows exactly 4 pips.

**`assets/skins/pirata/dice/die-5.png`** — 512×512 PNG, transparent
- Where it is used: Dado, cara 5 (bandejas, chat de revelación, apuesta actual; 24-96 px).
- Image prompt: A single six-sided die seen almost straight from above so the TOP FACE is large and square-on, with only a hint of the two lit side faces (very slight 3/4 bevel). Die of old yellowed ivory/whalebone with faint scrimshaw hairline cracks, worn edges; the pips are dark sepia ink (#2a1a0e) circles. Pips are VERY LARGE, bold and high-contrast so they read at 24 px. Standard pip layout. No shadow, no ground, no text, no numerals. Centered with generous margin. The top face shows exactly 5 pips.

**`assets/skins/pirata/dice/die-6.png`** — 512×512 PNG, transparent
- Where it is used: Dado, cara 6 (bandejas, chat de revelación, apuesta actual; 24-96 px).
- Image prompt: A single six-sided die seen almost straight from above so the TOP FACE is large and square-on, with only a hint of the two lit side faces (very slight 3/4 bevel). Die of old yellowed ivory/whalebone with faint scrimshaw hairline cracks, worn edges; the pips are dark sepia ink (#2a1a0e) circles. Pips are VERY LARGE, bold and high-contrast so they read at 24 px. Standard pip layout. No shadow, no ground, no text, no numerals. Centered with generous margin. The top face shows exactly 6 pips.

**`assets/skins/pirata/dice/die-1-wild.png`** — 512×512 PNG, transparent
- Where it is used: Dado «1 comodín» (los unos valen por cualquier valor).
- Image prompt: A single six-sided die seen almost straight from above so the TOP FACE is large and square-on, with only a hint of the two lit side faces (very slight 3/4 bevel). Die of old yellowed ivory/whalebone with faint scrimshaw hairline cracks, worn edges; the pips are dark sepia ink (#2a1a0e) circles. Pips are VERY LARGE, bold and high-contrast so they read at 24 px. Standard pip layout. No shadow, no ground, no text, no numerals. Centered with generous margin. WILD variant: a die of black ebony with pips inlaid in brass; the single central pip is a brass ring around a tiny dark dot. Same cube size and camera as the others.

**`assets/skins/pirata/dice/die-hidden.png`** — 512×512 PNG, transparent
- Where it is used: Dado oculto de un rival (se ve que existe, no su valor).
- Image prompt: A single six-sided die seen almost straight from above so the TOP FACE is large and square-on, with only a hint of the two lit side faces (very slight 3/4 bevel). Die of old yellowed ivory/whalebone with faint scrimshaw hairline cracks, worn edges; the pips are dark sepia ink (#2a1a0e) circles. Pips are VERY LARGE, bold and high-contrast so they read at 24 px. Standard pip layout. No shadow, no ground, no text, no numerals. Centered with generous margin. MYSTERY variant: the same ivory die wrapped in a small knotted hemp-rope net over the top face (no symbols). Same cube size and camera as the others.


### Group: cup

**`assets/skins/pirata/cup/cubilete-cerrado.png`** — 768×768 PNG, transparent
- Where it is used: Mia/Meyer: cubilete tapando los dados.
- Image prompt: A dice cup made from a rum-barrel stave section bound with hemp rope and a rusted iron hoop. Shown standing upside down covering the dice, 3/4 view from slightly above. No shadow, no table.

**`assets/skins/pirata/cup/cubilete-levantado.png`** — 768×768 PNG, transparent
- Where it is used: Mia/Meyer: cubilete levantado al revelar.
- Image prompt: A dice cup made from a rum-barrel stave section bound with hemp rope and a rusted iron hoop. The same cup tilted and lifted about 35 degrees, mouth toward the viewer, dark empty interior. Identical materials, scale and style to the closed cup. No dice, no shadow, no table.


### Group: ui

**`assets/skins/pirata/ui/mesa.webp`** — 1024×1024 WEBP, opaque, seamless tile
- Where it is used: Fondo de la zona de juego (dados y estado).
- Image prompt: Seamless tileable texture. Dark blue-green sailcloth/canvas texture, salt-stained and slightly stiff. Flat lighting so it tiles, no objects, low contrast, no vignette.

**`assets/skins/pirata/ui/panel.webp`** — 1024×1024 WEBP, opaque, seamless tile
- Where it is used: Fondo de paneles de lectura: formulario de partida y mensajes de chat.
- Image prompt: Seamless tileable texture. Stained sea-chart parchment with faint coastline outlines and compass lines (no letters, no numbers). Completely free of text, folds that break the tile and vignette; very low contrast so text on top stays readable.

**`assets/skins/pirata/ui/marco.webp`** — 1024×1024 WEBP, opaque, seamless tile
- Where it is used: Marcos, bordes y fondo de las cabeceras de ventana.
- Image prompt: Seamless tileable texture. Wet tarred ship planks with rope-wrapped iron nails. Flat lighting so it tiles, low contrast, no dominant features.

**`assets/skins/pirata/ui/esquina.png`** — 192×192 PNG, transparent
- Where it is used: Adorno de esquina de las ventanas (se gira por CSS a las 4 esquinas).
- Image prompt: A corner ornament for a frame, TOP-LEFT orientation, arms running along the top and left edges: rusted iron corner bracket with a small hemp-rope knot. Arms end cleanly at the canvas edges (touching the top and left edge is allowed for THIS asset), transparent elsewhere. Matches the palette and materials of the skin.

**`assets/skins/pirata/ui/divisor.png`** — 900×60 PNG, transparent
- Where it is used: Separador horizontal entre secciones.
- Image prompt: A thin horizontal divider, perfectly symmetric left-right: a twisted hemp-rope line with a single sailor's knot in the exact centre. Readable on both dark and light backgrounds.

**`assets/skins/pirata/ui/cabecera.webp`** — 1200×96 WEBP, opaque, seamless tile
- Where it is used: Barra de título de las ventanas (se estira a lo ancho).
- Image prompt: A window title-bar strip: tarred ship plank with a thin hemp-rope inlay line along the bottom edge. The middle 80 % must be plain with NO focal features so it can stretch and tile horizontally; left and right edges must tile horizontally.

**`assets/skins/pirata/ui/boton-primario.webp`** — 512×128 WEBP, opaque
- Where it is used: Botón principal (Subir, Anunciar, Iniciar partida).
- Image prompt: A flat button plate texture, rectangle edge to edge: tarnished brass ship-fitting plate with rivets and an engraved inner border. Completely empty in the centre (text goes there), no ornament in the middle, no text. Same construction, lighting and detail level as the other two button plates.

**`assets/skins/pirata/ui/boton-peligro.webp`** — 512×128 WEBP, opaque
- Where it is used: Botón «¡Mentira!» / «¡Dudo!».
- Image prompt: A flat button plate texture, rectangle edge to edge: faded crimson sailcloth plate with rope stitching. Completely empty in the centre (text goes there), no ornament in the middle, no text. Same construction, lighting and detail level as the other two button plates.

**`assets/skins/pirata/ui/boton-secundario.webp`** — 512×128 WEBP, opaque
- Where it is used: Botón secundario (Calzar, Acepto).
- Image prompt: A flat button plate texture, rectangle edge to edge: salt-bleached canvas plate with a thin dark border. Completely empty in the centre (text goes there), no ornament in the middle, no text. Same construction, lighting and detail level as the other two button plates.


### Group: tokens

**`assets/skins/pirata/tokens/vida.png`** — 128×128 PNG, transparent
- Where it is used: Contador de dados/vidas que quedan (sustituye a ★ y ♥).
- Image prompt: A small ship's lantern, lit, with a warm glow behind its glass. Bold simple shape, thick readable silhouette, readable at 24 px.

**`assets/skins/pirata/tokens/perdido.png`** — 128×128 PNG, transparent
- Where it is used: Dado/vida perdida (se muestra apagado junto a los que quedan).
- Image prompt: The same lantern extinguished, glass cracked, dark and cold. Same size, angle and style as `vida.png`.

**`assets/skins/pirata/tokens/moneda.png`** — 128×128 PNG, transparent
- Where it is used: Moneda suelta (entradas, premios).
- Image prompt: A gold doubloon with an embossed crown and cross (no text, no numerals). Bold rim, readable at 24 px.

**`assets/skins/pirata/tokens/bolsa.png`** — 128×128 PNG, transparent
- Where it is used: Bote de la partida.
- Image prompt: A burlap sack tied with rope, overflowing with a few gold doubloons. Bold silhouette, readable at 32 px.


### Group: scene

**`assets/skins/pirata/scene/mesa.webp`** — 2560×1440 WEBP, opaque
- Where it is used: Fondo de escena para jugar (opcional): el GM lo pone como imagen de la escena.
- Image prompt: Top-down captain's round table in a ship cabin: a sea chart, a rum bottle, a flintlock pistol and a few doubloons near the OUTER edges only, lantern light. The central 60 % of the picture is clear, calm and low-contrast so game tokens read perfectly on top. Slight dark vignette at the corners. No text, no characters.


### Group: brand

**`assets/skins/pirata/brand/emblema.png`** — 1024×1024 PNG, transparent
- Where it is used: Imagen principal de la skin: ficha del módulo y selector. ¡Es la referencia de estilo!
- Image prompt: HERO EMBLEM (still life, no characters): Two ivory dice resting on a flintlock pistol and a gold doubloon on dark planks, lantern light. Centered compact composition, rich painterly detail, no text, no background.

## 5. Final acceptance checklist (answer it explicitly at the end)

- [ ] The zip has exactly the files of the table, nothing missing, nothing extra, correct folders.
- [ ] Every size is exact; every transparent image has real alpha and zero magenta/white fringe.
- [ ] The 3 textures and the header strip tile seamlessly (tested 2×2).
- [ ] The 8 dice are one consistent set; pips readable at 24 px.
- [ ] The 3 button plates and the 4 tokens are consistent in construction, lighting and weight.
- [ ] The tone is serious and rogue everywhere: nothing cute, nothing cartoonish.
- [ ] No text, letters or numerals anywhere.
- [ ] `verificar_zip.py` printed `TODO CORRECTO` (or an equivalent check you wrote, shown to me).
