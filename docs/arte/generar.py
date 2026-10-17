#!/usr/bin/env python3
"""Fuente única del encargo de arte de «Tahúres», por skins.

Ejecutar:  python3 docs/arte/generar.py
Escribe, para cada skin, en docs/arte/<skin>/:
  - arte-spec.json   especificación legible por máquina (la usa verificar_zip.py)
  - PROMPT.md        prompt listo para pegar en el chat que genera las imágenes
y docs/arte/LEEME.md con las instrucciones. Para añadir una skin: una entrada más en SKINS.

Las imágenes van en assets/skins/<skin>/…; los iconos de acción, de jugador y los emblemas de juego los dibujo yo
en SVG (se tiñen con los colores de la skin), así que NO se piden al otro chat.
"""
import json
from pathlib import Path

OUT = Path(__file__).parent

# ---------------------------------------------------------------------------------------------
# Skins: cada una solo aporta texto; la estructura de archivos es idéntica en todas.
# ---------------------------------------------------------------------------------------------
SKINS = {
    "garito": {
        "nombre": "El Garito",
        "ambiente": "Black-and-white-movie noir: the smoky back room of a 1930s city gambling den, one hanging bulb, "
                    "bourbon rings on the table, menacing but stylish.",
        "paleta": "baize green `#14352c` / `#1f4a3a` · mahogany `#2a1810` / `#4a2a1c` · whisky amber `#c58a2b` · "
                  "nicotine cream `#d9c9a3` · blood red `#7a1c1c` · smoke grey `#3a3a3a` · ink black `#120c08` · "
                  "bulb light `#ffd9a0`",
        "materiales": "worn green baize with cigarette burns, old varnished mahogany, tarnished brass, yellowed "
                      "celluloid, ledger paper, black leather, casino chips",
        "dado": "Casino-style die of aged ivory-coloured celluloid, slightly yellowed, hard chamfered corners, scuffed "
                "edges; the pips are deep blood-red (#7a1c1c) inset circles.",
        "wild": "WILD variant: a black-lacquer die with a faint gold-leaf edge line; the pips are gold; the single "
                "central pip is a gold ring with a small dark dot inside.",
        "oculto": "MYSTERY variant: the same ivory die but the top face is covered by a dark-brown leather patch "
                  "stamped with one big question mark (the only symbol allowed in the whole set).",
        "cubilete": "A worn black-leather dice cup with tarnished brass rivets and a brass rim, stained and creased.",
        "mesa": "Worn green baize card-table cloth with faint cigarette burns and pale glass-ring stains.",
        "panel": "Yellowed bookmaker's ledger paper with faint blue ruled lines and a few coffee stains.",
        "marco": "Dark mahogany wood with scratches and old cracked varnish.",
        "esquina": "tarnished brass Art Deco corner bracket, stepped geometric fan motif",
        "divisor": "an Art Deco line with small stepped ends and a tiny diamond in the exact centre",
        "cabecera": "dark mahogany strip with a thin tarnished-brass inlay line along the bottom edge",
        "boton_primario": "tarnished brass plate with an engraved inner border",
        "boton_peligro": "dark blood-red leather plate with a stitched brass border",
        "boton_secundario": "aged cream cardstock plate with a thin dark border",
        "vida": "A short stack of two casino chips seen from the side, deep red with cream edge inserts.",
        "perdido": "The same chip stack but cracked in half, dull grey and lifeless.",
        "moneda": "A worn silver coin with an indistinct engraved eagle silhouette (no text, no numerals).",
        "bolsa": "A small tied canvas money bag with a bundle of banknotes peeking out of the top.",
        "escena": "Top-down round green-baize poker table with a worn leather rail, an ashtray with a smoking cigarette, "
                  "a whisky glass and a few chips near the OUTER edges only.",
        "emblema": "Two ivory dice resting on a crumpled banknote next to a lit cigarette in a glass ashtray, hard "
                   "side light, a thin curl of smoke.",
    },
    "taberna": {
        "nombre": "La Taberna",
        "ambiente": "Grim medieval-fantasy inn: tallow-candle light, smoke-stained rafters, a place where people get "
                    "robbed and stabbed over a game of dice.",
        "paleta": "scarred oak `#3a2615` / `#5b3b22` · wrought iron `#2b2b2e` / `#4a4d52` · tallow candle `#e8c872` · "
                  "wine red `#6e1f2a` · bone `#e6dcc3` · dark wool green `#25372b` · rust `#8a4b2a` · ink `#120c08`",
        "materiales": "scarred oak, wrought iron, hand-cut bone, vellum, rough wool, tallow wax, cracked leather",
        "dado": "Die hand-carved from animal bone, off-white to yellow, slightly uneven faces and softened corners; "
                "the pips are burnt-in black (#1b130c) rough circles.",
        "wild": "WILD variant: a die of dark blackwood with pips inlaid in tarnished silver; the single central pip "
                "is a silver ring around a tiny dark dot.",
        "oculto": "MYSTERY variant: the same bone die with a strip of black cloth tied across the top face, a small "
                  "knot in the middle (no symbols at all).",
        "cubilete": "A drinking-horn dice cup with a forged iron band and a leather strap, scratched and sooty.",
        "mesa": "Rough dark-green wool cloth, visible coarse weave, a few wax drips and dark stains.",
        "panel": "Dirty vellum with faint ink ruling, wine stains and darkened fibres.",
        "marco": "Scarred dark oak planks with forged nail heads.",
        "esquina": "blackened wrought-iron corner bracket with rivets and a plain medieval spur",
        "divisor": "a wrought-iron rule with a single large nail head in the exact centre",
        "cabecera": "dark oak plank with a thin forged-iron strap along the bottom edge",
        "boton_primario": "dark iron plate with brass rivets at the corners and an engraved inner border",
        "boton_peligro": "dried-blood-red leather plate with iron rivets",
        "boton_secundario": "tan cracked leather plate with simple stitching",
        "vida": "A single tallow candle stub with a small steady flame, melted wax at the base.",
        "perdido": "The same candle stub snuffed, a thin curl of smoke, cold grey wax.",
        "moneda": "A worn crude copper coin with a rough crown relief (no text, no numerals).",
        "bolsa": "A small leather drawstring pouch spilling a few copper coins.",
        "escena": "Top-down heavy scarred-oak round table with a dark-green cloth centre, candle stubs, two tankards, a "
                  "dagger stuck in the wood and a few copper coins near the OUTER edges only.",
        "emblema": "A bone die, a dagger and a burning candle stub on a scarred oak plank, dramatic single-candle light.",
    },
    "pirata": {
        "nombre": "El Camarote",
        "ambiente": "18th-century pirate ship's cabin at night: swaying lantern, rum, salt and tar, a game that ends "
                    "with a knife in the table.",
        "paleta": "tarred plank `#2a2118` / `#4a3a2a` · rope tan `#b59a6a` · verdigris `#3f7a6b` · rum amber "
                  "`#a8651f` · sea-chart parchment `#d8c79a` · rust red `#8b3a22` · ink `#16110c` · lantern `#ffcf80`",
        "materiales": "tarred planks, salt-stained canvas, hemp rope, rusted iron, scrimshawed ivory, brass, sea charts",
        "dado": "Die of old yellowed ivory/whalebone with faint scrimshaw hairline cracks, worn edges; the pips are "
                "dark sepia ink (#2a1a0e) circles.",
        "wild": "WILD variant: a die of black ebony with pips inlaid in brass; the single central pip is a brass "
                "ring around a tiny dark dot.",
        "oculto": "MYSTERY variant: the same ivory die wrapped in a small knotted hemp-rope net over the top face "
                  "(no symbols).",
        "cubilete": "A dice cup made from a rum-barrel stave section bound with hemp rope and a rusted iron hoop.",
        "mesa": "Dark blue-green sailcloth/canvas texture, salt-stained and slightly stiff.",
        "panel": "Stained sea-chart parchment with faint coastline outlines and compass lines (no letters, no numbers).",
        "marco": "Wet tarred ship planks with rope-wrapped iron nails.",
        "esquina": "rusted iron corner bracket with a small hemp-rope knot",
        "divisor": "a twisted hemp-rope line with a single sailor's knot in the exact centre",
        "cabecera": "tarred ship plank with a thin hemp-rope inlay line along the bottom edge",
        "boton_primario": "tarnished brass ship-fitting plate with rivets and an engraved inner border",
        "boton_peligro": "faded crimson sailcloth plate with rope stitching",
        "boton_secundario": "salt-bleached canvas plate with a thin dark border",
        "vida": "A small ship's lantern, lit, with a warm glow behind its glass.",
        "perdido": "The same lantern extinguished, glass cracked, dark and cold.",
        "moneda": "A gold doubloon with an embossed crown and cross (no text, no numerals).",
        "bolsa": "A burlap sack tied with rope, overflowing with a few gold doubloons.",
        "escena": "Top-down captain's round table in a ship cabin: a sea chart, a rum bottle, a flintlock pistol and a "
                  "few doubloons near the OUTER edges only, lantern light.",
        "emblema": "Two ivory dice resting on a flintlock pistol and a gold doubloon on dark planks, lantern light.",
    },
    "oeste": {
        "nombre": "El Saloon",
        "ambiente": "1880s frontier saloon: dust, whisky, tin and leather, a faro table where somebody always cheats.",
        "paleta": "pine plank `#6b4a2b` · dust tan `#c8a878` · whisky `#b86a1a` · faro green `#2e4a30` · tin grey "
                  "`#6d6f70` · blood red `#7a2020` · wanted-poster paper `#d9c7a0` · lamp `#ffd08a` · ink `#17100a`",
        "materiales": "rough pine boards, brittle poster paper, rawhide, stamped tin, brass cartridges, faded baize",
        "dado": "Yellowed bone die, slightly irregular, with chipped edges; the pips are black (#161210) drilled holes.",
        "wild": "WILD variant: the same bone die, but the single central pip is replaced by a small five-point tin "
                "sheriff star set into the face.",
        "oculto": "MYSTERY variant: the same bone die with a small stitched rawhide cap covering the top face, with "
                  "one burnt question mark.",
        "cubilete": "A rawhide dice cup stitched with sinew and a dented tin band.",
        "mesa": "Faded green faro baize with ground-in dust and a few whisky stains.",
        "panel": "Brittle wanted-poster paper with fold lines, darkened edges and faint soot marks (no text, no portraits).",
        "marco": "Rough pine boards with nail heads and a few small bullet holes.",
        "esquina": "stamped tin corner bracket with rivets and a tiny star",
        "divisor": "a thin barbed-wire line with a tiny five-point star in the exact centre",
        "cabecera": "pine board strip with a thin stamped-tin band along the bottom edge",
        "boton_primario": "stamped tin plate with an embossed border",
        "boton_peligro": "dark red leather plate with stitching",
        "boton_secundario": "tan rawhide plate with a thin dark border",
        "vida": "A single brass revolver cartridge standing upright, primer and bullet visible.",
        "perdido": "The same cartridge as a spent, dented, dull casing without bullet.",
        "moneda": "A worn silver dollar with an eagle silhouette (no text, no numerals).",
        "bolsa": "A small leather gold-dust pouch tied with a thong, a few nuggets spilling.",
        "escena": "Top-down round faro table with faded green baize, a whisky bottle and glass, a revolver and a few "
                  "silver dollars near the OUTER edges only, warm lamp light.",
        "emblema": "Two bone dice on a fanned deck of cards beside a revolver and a tin sheriff star, dusty side light.",
    },
    "neon": {
        "nombre": "La Cantina Neón",
        "ambiente": "Rain-slick cyberpunk / space-port bar: neon haze, chrome, dealers who are not quite human, high "
                    "stakes and worse manners.",
        "paleta": "black glass `#0b0e14` / `#151a24` · chrome `#9aa4b2` · neon cyan `#2ad4ff` · neon magenta `#ff2e93` "
                  "· acid yellow `#e8ff3a` · warning orange `#ff7a1a` · haze `#1d2433`",
        "materiales": "smoked glass, brushed chrome, matte carbon, translucent resin, neon tubing glow, wet asphalt",
        "dado": "Die of translucent smoked resin with a soft internal glow, chamfered corners, tiny internal circuitry "
                "lines; the pips are glowing cyan (#2ad4ff) inset dots.",
        "wild": "WILD variant: the same resin die but glowing magenta (#ff2e93); the single central pip is a hexagon "
                "ring around a small dot.",
        "oculto": "MYSTERY variant: an opaque black die with a faint glowing cyan question mark on the top face.",
        "cubilete": "A brushed-chrome cylindrical dice cup with a thin glowing cyan neon strip around the rim.",
        "mesa": "Dark matte carbon-fibre surface with extremely faint cyan grid lines, flat lighting.",
        "panel": "Dark smoked-glass panel with barely visible scanlines and a faint hex grid, very low contrast.",
        "marco": "Dark brushed metal with fine scratches and a few hex bolts.",
        "esquina": "chrome corner bracket with a thin glowing cyan line along both arms",
        "divisor": "a thin glowing cyan neon line with a small diamond in the exact centre",
        "cabecera": "brushed dark-metal strip with a thin glowing cyan line along the bottom edge",
        "boton_primario": "dark glass plate with a glowing cyan neon border",
        "boton_peligro": "dark glass plate with a glowing magenta-red neon border",
        "boton_secundario": "dark glass plate with a dim steel-grey border",
        "vida": "A glowing cyan energy-cell capsule, sleek, with a bright core.",
        "perdido": "The same capsule dead: dark, cracked glass, no glow.",
        "moneda": "A hexagonal metal credit token with a thin glowing line across it (no text, no numerals).",
        "bolsa": "A small sealed chrome data case, slightly open with a cyan glow inside.",
        "escena": "Top-down black glass holo-gaming table with a faint glowing grid, a glowing drink and a few credit "
                  "tokens near the OUTER edges only, neon reflections.",
        "emblema": "Two translucent glowing dice floating above a credit token inside a thin neon ring, wet reflections below.",
    },
}

# ---------------------------------------------------------------------------------------------
# Texto común
# ---------------------------------------------------------------------------------------------
STYLE = """\
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
"""

TECH = """\
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
"""


def workflow(skin_id):
    return f"""\
**Step 0 - tools.** Tell me whether you can (a) generate images and (b) run Python to resize, chroma-key, tile-test and
build a zip. If you cannot run Python, say so and tell me what you can and cannot guarantee.
**Step 1 - style lock.** Produce ONE reference image first (`brand/emblema.png`) and show it to me. Wait for my "ok" or
corrections. Reuse that look for everything.
**Step 2 - production in batches**, in this order, showing me a contact sheet after each batch:
dice -> cup -> ui -> tokens -> scene{' -> banner' if skin_id == 'garito' else ''}. Fix anything that fails the readability test
before moving on.
**Step 3 - verify.** If I attach `arte-spec.json` and `verificar_zip.py`, run
`python3 verificar_zip.py queso-mentira-arte-{skin_id}.zip arte-spec.json` and do not stop until it prints `TODO CORRECTO`.
If they are not attached, implement the same checks yourself (existence, exact size, format, alpha/no-alpha, margin,
no magenta, tileability) and print the table.
**Step 4 - deliver** `queso-mentira-arte-{skin_id}.zip` containing the files at the paths below, preserving folders (the
zip root contains the folder `assets/`), plus nothing else. Reply in Spanish; write all image prompts in English.
"""


# ---------------------------------------------------------------------------------------------
# Recursos de una skin: (ruta, w, h, bg, tile, margen%, grupo, uso, descripción)
# ---------------------------------------------------------------------------------------------
def assets_for(sid, s):
    die = ("A single six-sided die seen almost straight from above so the TOP FACE is large and square-on, with only a "
           "hint of the two lit side faces (very slight 3/4 bevel). " + s["dado"] + " Pips are VERY LARGE, bold and "
           "high-contrast so they read at 24 px. Standard pip layout. No shadow, no ground, no text, no numerals. "
           "Centered with generous margin.")
    base = f"assets/skins/{sid}/"
    A = []
    for n in range(1, 7):
        A.append((f"dice/die-{n}.png", 512, 512, "transparent", False, 8, "dice",
                  f"Dado, cara {n} (bandejas, chat de revelación, apuesta actual; 24-96 px).",
                  f"{die} The top face shows exactly {n} pip{'s' if n > 1 else ''}"
                  f"{' (one large centered pip)' if n == 1 else ''}."))
    A.append(("dice/die-1-wild.png", 512, 512, "transparent", False, 8, "dice",
              "Dado «1 comodín» (los unos valen por cualquier valor).",
              f"{die} {s['wild']} Same cube size and camera as the others."))
    A.append(("dice/die-hidden.png", 512, 512, "transparent", False, 8, "dice",
              "Dado oculto de un rival (se ve que existe, no su valor).",
              f"{die} {s['oculto']} Same cube size and camera as the others."))
    A.append(("cup/cubilete-cerrado.png", 768, 768, "transparent", False, 6, "cup",
              "Mia/Meyer: cubilete tapando los dados.",
              f"{s['cubilete']} Shown standing upside down covering the dice, 3/4 view from slightly above. "
              "No shadow, no table."))
    A.append(("cup/cubilete-levantado.png", 768, 768, "transparent", False, 6, "cup",
              "Mia/Meyer: cubilete levantado al revelar.",
              f"{s['cubilete']} The same cup tilted and lifted about 35 degrees, mouth toward the viewer, dark empty "
              "interior. Identical materials, scale and style to the closed cup. No dice, no shadow, no table."))
    A.append(("ui/mesa.webp", 1024, 1024, "opaque", True, 0, "ui",
              "Fondo de la zona de juego (dados y estado).",
              f"Seamless tileable texture. {s['mesa']} Flat lighting so it tiles, no objects, low contrast, no vignette."))
    A.append(("ui/panel.webp", 1024, 1024, "opaque", True, 0, "ui",
              "Fondo de paneles de lectura: formulario de partida y mensajes de chat.",
              f"Seamless tileable texture. {s['panel']} Completely free of text, folds that break the tile and vignette; "
              "very low contrast so text on top stays readable."))
    A.append(("ui/marco.webp", 1024, 1024, "opaque", True, 0, "ui",
              "Marcos, bordes y fondo de las cabeceras de ventana.",
              f"Seamless tileable texture. {s['marco']} Flat lighting so it tiles, low contrast, no dominant features."))
    A.append(("ui/esquina.png", 192, 192, "transparent", False, 4, "ui",
              "Adorno de esquina de las ventanas (se gira por CSS a las 4 esquinas).",
              f"A corner ornament for a frame, TOP-LEFT orientation, arms running along the top and left edges: "
              f"{s['esquina']}. Arms end cleanly at the canvas edges (touching the top and left edge is allowed for "
              "THIS asset), transparent elsewhere. Matches the palette and materials of the skin."))
    A.append(("ui/divisor.png", 900, 60, "transparent", False, 2, "ui",
              "Separador horizontal entre secciones.",
              f"A thin horizontal divider, perfectly symmetric left-right: {s['divisor']}. Readable on both dark and light "
              "backgrounds."))
    A.append(("ui/cabecera.webp", 1200, 96, "opaque", True, 0, "ui",
              "Barra de título de las ventanas (se estira a lo ancho).",
              f"A window title-bar strip: {s['cabecera']}. The middle 80 % must be plain with NO focal features so it can "
              "stretch and tile horizontally; left and right edges must tile horizontally."))
    for key, fname, uso in (("boton_primario", "boton-primario", "Botón principal (Subir, Anunciar, Iniciar partida)."),
                            ("boton_peligro", "boton-peligro", "Botón «¡Mentira!» / «¡Dudo!»."),
                            ("boton_secundario", "boton-secundario", "Botón secundario (Calzar, Acepto).")):
        A.append((f"ui/{fname}.webp", 512, 128, "opaque", False, 0, "ui", uso,
                  f"A flat button plate texture, rectangle edge to edge: {s[key]}. Completely empty in the centre (text goes "
                  "there), no ornament in the middle, no text. Same construction, lighting and detail level as the "
                  "other two button plates."))
    A.append(("tokens/vida.png", 128, 128, "transparent", False, 8, "tokens",
              "Contador de dados/vidas que quedan (sustituye a ★ y ♥).",
              f"{s['vida']} Bold simple shape, thick readable silhouette, readable at 24 px."))
    A.append(("tokens/perdido.png", 128, 128, "transparent", False, 8, "tokens",
              "Dado/vida perdida (se muestra apagado junto a los que quedan).",
              f"{s['perdido']} Same size, angle and style as `vida.png`."))
    A.append(("tokens/moneda.png", 128, 128, "transparent", False, 8, "tokens",
              "Moneda suelta (entradas, premios).", f"{s['moneda']} Bold rim, readable at 24 px."))
    A.append(("tokens/bolsa.png", 128, 128, "transparent", False, 8, "tokens",
              "Bote de la partida.", f"{s['bolsa']} Bold silhouette, readable at 32 px."))
    A.append(("scene/mesa.webp", 2560, 1440, "opaque", False, 0, "scene",
              "Fondo de escena para jugar (opcional): el GM lo pone como imagen de la escena.",
              f"{s['escena']} The central 60 % of the picture is clear, calm and low-contrast so game tokens read perfectly "
              "on top. Slight dark vignette at the corners. No text, no characters."))
    A.append(("brand/emblema.png", 1024, 1024, "transparent", False, 5, "brand",
              "Imagen principal de la skin: ficha del módulo y selector. ¡Es la referencia de estilo!",
              f"HERO EMBLEM (still life, no characters): {s['emblema']} Centered compact composition, rich painterly "
              "detail, no text, no background."))
    if sid == "garito":
        A.append(("brand/banner.webp", 1600, 640, "opaque", False, 0, "brand",
                  "Cabecera del README y de la página del módulo (solo en la skin base).",
                  f"Wide cinematic establishing shot: {s['ambiente']} A round gaming table in the lower foreground, "
                  "shallow depth of field. The LEFT 35 % is calmer and darker (a title will be overlaid there). "
                  "No people, no text."))
    return [(base + p, w, h, bg, t, m, g, u, d) for (p, w, h, bg, t, m, g, u, d) in A]


def spec_for(sid, s):
    return [{"path": p, "w": w, "h": h, "fmt": "PNG" if bg == "transparent" else "WEBP", "bg": bg, "tile": t,
             "margin": m, "group": g, "uso": u, "prompt": d} for (p, w, h, bg, t, m, g, u, d) in assets_for(sid, s)]


def prompt_md(sid, s, items):
    L = []
    A = L.append
    A(f"# Prompt - skin «{s['nombre']}» (`{sid}`)\n")
    A("> Pega TODO lo que hay debajo de la línea en el chat que genera las imágenes. Adjunta también `arte-spec.json` y "
      "`verificar_zip.py` de esta carpeta. Te entregará el zip de esta skin; ese es el que me traes.\n")
    A("---\n")
    A("You are the art director and production artist for a Foundry VTT module of **tavern bluffing-dice games** (Liar's "
      "Dice, Mia/Meyer and more). The module has several visual **skins** for different settings; I need the complete "
      f"art pack of ONE skin, **\"{s['nombre']}\"**, delivered as ONE zip file. Speak to me in Spanish, but write every "
      "image prompt in English.\n")
    A("## 1. Art direction\n")
    A(f"**Skin setting:** {s['ambiente']}\n")
    A(STYLE)
    A(f"**Palette for this skin (stick to these hues; shading may go lighter/darker):** {s['paleta']}\n")
    A(f"**Materials:** {s['materiales']}.\n")
    A("## 2. Technical rules (non-negotiable)\n")
    A(TECH)
    A("## 3. How to work\n")
    A(workflow(sid))
    A(f"## 4. The assets ({len(items)} files)\n")
    A("Paths are relative to the zip root and must start with `assets/skins/" + sid + "/`. `margin` = minimum empty "
      "border on every side, in % of the image size (transparent assets only).\n")
    A("| # | File | Size (px) | Format | Background | Tileable | Margin | Group |")
    A("|---|---|---|---|---|---|---|---|")
    for i, a in enumerate(items, 1):
        A(f"| {i} | `{a['path']}` | {a['w']}×{a['h']} | {a['fmt']} | {a['bg']} | {'yes' if a['tile'] else 'no'} | "
          f"{a['margin']} % | {a['group']} |")
    A("")
    cur = None
    for a in items:
        if a["group"] != cur:
            cur = a["group"]
            A(f"\n### Group: {cur}\n")
        A(f"**`{a['path']}`** — {a['w']}×{a['h']} {a['fmt']}, {a['bg']}{', seamless tile' if a['tile'] else ''}")
        A(f"- Where it is used: {a['uso']}")
        A(f"- Image prompt: {a['prompt']}\n")
    A("## 5. Final acceptance checklist (answer it explicitly at the end)\n")
    A("- [ ] The zip has exactly the files of the table, nothing missing, nothing extra, correct folders.\n"
      "- [ ] Every size is exact; every transparent image has real alpha and zero magenta/white fringe.\n"
      "- [ ] The 3 textures and the header strip tile seamlessly (tested 2×2).\n"
      "- [ ] The 8 dice are one consistent set; pips readable at 24 px.\n"
      "- [ ] The 3 button plates and the 4 tokens are consistent in construction, lighting and weight.\n"
      "- [ ] The tone is serious and rogue everywhere: nothing cute, nothing cartoonish.\n"
      "- [ ] No text, letters or numerals anywhere.\n"
      "- [ ] `verificar_zip.py` printed `TODO CORRECTO` (or an equivalent check you wrote, shown to me).\n")
    return "\n".join(L)


LEEME = """# Arte por skins

Cada skin es un zip independiente con la misma estructura (`assets/skins/<skin>/…`). Genera la skin que quieras
y tráemela; las demás pueden esperar. Orden recomendado: **garito** (base, incluye el banner del README), luego
las que vayas a usar.

| Skin | Ambiente | Carpeta |
|---|---|---|
{tabla}

Por cada skin: pega `PROMPT.md` en el chat de imágenes y adjunta `arte-spec.json` + `verificar_zip.py`
(este último está en `docs/arte/`). El zip resultante se llama `queso-mentira-arte-<skin>.zip`.

Los iconos de acción, de jugador y los emblemas de cada juego los dibujo yo en SVG (se tiñen con los colores de la
skin), así que no hay que generarlos.

Para añadir una skin nueva: una entrada más en `SKINS` de `generar.py` y `python3 docs/arte/generar.py`.
"""

if __name__ == "__main__":
    rows = []
    for sid, s in SKINS.items():
        d = OUT / sid
        d.mkdir(exist_ok=True)
        items = spec_for(sid, s)
        (d / "arte-spec.json").write_text(json.dumps(items, ensure_ascii=False, indent=1), encoding="utf-8")
        (d / "PROMPT.md").write_text(prompt_md(sid, s, items), encoding="utf-8")
        rows.append(f"| {s['nombre']} (`{sid}`) | {s['ambiente']} | `docs/arte/{sid}/` |")
        print(f"{sid}: {len(items)} recursos")
    (OUT / "LEEME.md").write_text(LEEME.format(tabla="\n".join(rows)), encoding="utf-8")
    # restos de la versión anterior (una sola estética)
    for old in ("PROMPT_OTRO_CHAT.md", "arte-spec.json"):
        (OUT / old).unlink(missing_ok=True)
