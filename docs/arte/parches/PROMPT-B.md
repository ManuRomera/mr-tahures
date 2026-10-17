# Parche B — dados de cuatro skins que hoy son casi el mismo dado (recomendado)

> Pega TODO lo de debajo de la línea en el mismo proyecto/chat donde generaste los 5 kits. Adjunta `arte-spec-parche-B.json` y `verificar_zip.py`.

---

You already delivered the five skin packs of **Tahúres** and they pass the automatic check. Comparing the five skins side by side I found a design problem: **the dice of `garito`, `taberna`, `pirata` and `oeste` are practically the same object** — same tan cube, nearly the same silhouette (within 1-5 %), mean body colour within ±5/255 — and only the pip colour changes. Each skin must have its own physical die. (`neon` is fine; do not touch it.) Speak to me in Spanish; write image prompts in English.

## What to redo
The 8 dice files of each of these four skins = **32 files**, same paths, 512×512 PNG RGBA, transparent, same margins as the original spec, `dice/die-1.png … die-6.png`, `die-1-wild.png`, `die-hidden.png`. Keep the same camera (almost straight from above, top face large, slight 3/4 bevel), upper-left light, no shadow, no text, very large high-contrast pips readable at 24 px, standard pip layout, and the same rule as before: build ONE new blank cube per skin and composite the same pip sprite for all faces so the set is pixel-consistent. Keep the wild and hidden concepts of each skin, adapted to the new body.

## The four distinct dice
**garito — casino die.** Cool pearl-white translucent celluloid, body colour about `#ece6d6` (clearly LIGHTER and COOLER than today's tan), subtle marbled swirls inside, **crisp, nearly sharp corners** (tiny chamfer ~2 %), perfectly square silhouette, glossy highlights, crisp round deep-red pips `#7a1c1c`. Wild: black lacquer with gold pips/ring (as before). Hidden: dark leather patch with a question mark (as before).

**taberna — hand-carved bone.** Muddy bone, body about `#cdbb94` with brown mottling and dark grain lines, **uneven, wobbly, heavily rounded edges and an asymmetric hand-cut silhouette** (slightly out of square, ~4° tilt), chipped corner, pips as irregular burnt pits `#1b130c` (not perfect circles). Wild: dark blackwood with silver ring (as before). Hidden: black cloth strip with a knot (as before).

**pirata — scrimshaw ivory.** Warm yellow aged ivory, body about `#dcc06a` (more yellow/amber than the others), medium rounded corners, **fine engraved nautical scrimshaw lines (rope, anchor hairlines) around the border of the top face and on the side faces**, pips as inked deep sepia filled circles `#2a1a0e`, each with a hairline ring engraved around it. Wild: black ebony with brass ring (as before). Hidden: knotted rope net (as before).

**oeste — dusty frontier bone.** Pale grey bone, body about `#c9c1b0`, red desert dust `#a5633c` packed into the cracks and edges, **chipped, cracked, slightly irregular corners**, pips as deep drilled holes with a darker inside `#161210`. Wild: the tin sheriff-star pip (as before, adapted). Hidden: stitched rawhide cap with a burnt question mark (as before).

## Acceptance test (show it to me)
Make a contact sheet at **64 px** with the four `die-5.png` side by side on mid-grey, then the same sheet with the pips painted out: I must be able to tell the four skins apart by body colour, silhouette and surface alone. Also show the full set of 8 for each skin.

## How to deliver
1. Build `queso-mentira-arte-parche-B.zip` containing ONLY the 32 files at their exact paths (the zip root contains the folder `assets/`).
2. Run `python3 verificar_zip.py queso-mentira-arte-parche-B.zip arte-spec-parche-B.json` and do not stop until it prints `TODO CORRECTO`.
