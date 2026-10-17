#!/usr/bin/env python3
"""Genera styles/skins.css: conecta el arte de assets/skins/<skin>/ con las variables de cada skin.

Ejecutar:  python3 docs/arte/gen_skins_css.py
Para una skin nueva: carpeta assets/skins/<id>/ con la estructura del encargo (docs/arte/LEEME.md),
una entrada en SKINS de aquí y otra de colores en styles/mr-tahures.css.
Los parches de arte que sustituyen archivos con el mismo nombre NO requieren regenerar nada.
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SKINS = {
    # sombreado oscuro sobre la textura de marco, y color de texto de cada botón (según el material de la placa)
    "garito":  {"shade": "rgba(14,9,6,.80)",  "fg1": "#1a0f06", "fg2": "#ffe9e0", "fg3": "#2a1a0c"},
    "taberna": {"shade": "rgba(14,10,7,.78)", "fg1": "#f0dfb0", "fg2": "#ffe8e8", "fg3": "#1f1208"},
    "pirata":  {"shade": "rgba(8,12,12,.78)", "fg1": "#1a1208", "fg2": "#ffeadf", "fg3": "#241a0c"},
    "oeste":   {"shade": "rgba(16,11,7,.78)", "fg1": "#1d1509", "fg2": "#ffe9e2", "fg3": "#241707"},
    "neon":    {"shade": "rgba(5,8,12,.55)",  "fg1": "#8aefff", "fg2": "#ff86c4", "fg3": "#b9cbd8"},
}

HEAD = """/* GENERADO por docs/arte/gen_skins_css.py — no editar a mano. Conecta el arte de assets/skins/<skin>/ con la interfaz. */

"""

COMMON = """
/* ---------------------------------------------------------------- arte: ventanas */
body[data-qm-skin] .qm-dialog .window-header {
  background: var(--qm-art-header) center / 100% 100% no-repeat, var(--qm-header-bg);
}
body[data-qm-skin] .qm-dialog .window-content {
  background: linear-gradient(var(--qm-frame-shade), var(--qm-frame-shade)), var(--qm-art-frame) 0 0 / auto, var(--qm-bg);
  background-size: auto, 340px, auto;
}
/* esquinas: ornamento girado a las cuatro esquinas */
body[data-qm-skin] .application.qm-dialog::before,
body[data-qm-skin] .application.qm-dialog::after,
body[data-qm-skin] .qm-dialog .window-content::before,
body[data-qm-skin] .qm-dialog .window-content::after {
  content: "";
  position: absolute;
  width: 42px;
  height: 42px;
  background: var(--qm-art-corner) center / contain no-repeat;
  pointer-events: none;
  z-index: 3;
  opacity: .95;
  filter: drop-shadow(0 2px 2px #000a);
}
body[data-qm-skin] .application.qm-dialog::before { top: 30px; left: -3px; }
body[data-qm-skin] .qm-dialog .window-content::before { top: 30px; right: -3px; transform: scaleX(-1); }
body[data-qm-skin] .qm-dialog .window-content::after { bottom: -3px; left: -3px; transform: scaleY(-1); }
body[data-qm-skin] .application.qm-dialog::after { bottom: -3px; right: -3px; transform: scale(-1, -1); }
body[data-qm-skin] .qm-dialog .window-content { position: static; }

/* ---------------------------------------------------------------- arte: botones (placas) */
body[data-qm-skin] .qm-dialog button.qm-btn,
body[data-qm-skin] .qm-btn {
  background: var(--qm-art-btn1) center / 100% 100% no-repeat;
  color: var(--qm-btn1-fg);
  border: 0;
  padding: .75em 1.3em;
  min-height: 2.6rem;
  text-shadow: 0 1px 0 #ffffff22;
  box-shadow: 0 3px 8px #000a;
}
body[data-qm-skin] .qm-btn:is([data-action="lie"], [data-action="doubt"]) { background-image: var(--qm-art-btn2); color: var(--qm-btn2-fg); }
body[data-qm-skin] .qm-btn:is([data-action="spoton"], [data-action="accept"], [data-action="toggle-gm-view"]) { background-image: var(--qm-art-btn3); color: var(--qm-btn3-fg); }

/* ---------------------------------------------------------------- arte: mesa, divisor, fichas, bote, copa, emblema */
body[data-qm-skin] .qm-tray-container :is(.my-dice, .all-dice) {
  background: radial-gradient(125% 150% at 50% 0%, transparent 35%, #000b 100%), var(--qm-art-table) 0 0 / auto;
  background-size: auto, 300px;
}
body[data-qm-skin] .game-status { border-top: 0; position: relative; padding-top: 22px; }
body[data-qm-skin] .game-status::before {
  content: "";
  position: absolute;
  left: 0; right: 0; top: 2px;
  height: 20px;
  background: var(--qm-art-divider) center / contain no-repeat;
}
body[data-qm-skin] .qm-lives::after { width: 1.7em; height: 1.7em; border-radius: 0; background: var(--qm-art-life) center / contain no-repeat; box-shadow: none; filter: drop-shadow(0 2px 2px #000a); }
.qm-tok { display: inline-block; width: 1.5em; height: 1.5em; margin: 0 -.05em; vertical-align: middle; background: var(--qm-art-life) center / contain no-repeat; filter: drop-shadow(0 1px 1px #000a); }
.qm-tok.lost { background-image: var(--qm-art-lost); opacity: .7; }
.qm-pips { letter-spacing: 0; white-space: nowrap; }
body[data-qm-skin] .qm-pot::before { content: ""; width: 1.9em; height: 1.9em; background: var(--qm-art-bag) center / contain no-repeat; filter: drop-shadow(0 2px 2px #000a); }
.qm-cup { display: block; width: 110px; height: 110px; margin: 0 auto; background: var(--qm-art-cup) center / contain no-repeat; filter: drop-shadow(0 5px 6px #000b); }
.qm-cup.up { background-image: var(--qm-art-cup-up); }
body[data-qm-skin] .qm-select-body > header { display: flex; align-items: center; gap: 14px; }
body[data-qm-skin] .qm-select-body > header::before { content: ""; flex: none; width: 74px; height: 74px; background: var(--qm-art-emblem) center / contain no-repeat; filter: drop-shadow(0 3px 4px #000b); }
body[data-qm-skin] .chat-message.qm-chat {
  background: linear-gradient(color-mix(in srgb, var(--qm-chat-bg) 86%, transparent), color-mix(in srgb, var(--qm-chat-bg) 86%, transparent)), var(--qm-art-panel) 0 0 / 280px;
}
"""


def skin_block(sid, p):
    base = f"../assets/skins/{sid}/"
    u = lambda rel: f"url('{base}{rel}')"
    return f"""body[data-qm-skin="{sid}"] {{
  --qm-art-header: {u('ui/cabecera.webp')};
  --qm-art-frame: {u('ui/marco.webp')};
  --qm-art-table: {u('ui/mesa.webp')};
  --qm-art-panel: {u('ui/panel.webp')};
  --qm-art-btn1: {u('ui/boton-primario.webp')};
  --qm-art-btn2: {u('ui/boton-peligro.webp')};
  --qm-art-btn3: {u('ui/boton-secundario.webp')};
  --qm-art-corner: {u('ui/esquina.png')};
  --qm-art-divider: {u('ui/divisor.png')};
  --qm-art-life: {u('tokens/vida.png')};
  --qm-art-lost: {u('tokens/perdido.png')};
  --qm-art-bag: {u('tokens/bolsa.png')};
  --qm-art-cup: {u('cup/cubilete-cerrado.png')};
  --qm-art-cup-up: {u('cup/cubilete-levantado.png')};
  --qm-art-emblem: {u('brand/emblema.png')};
  --qm-frame-shade: {p['shade']};
  --qm-btn1-fg: {p['fg1']};
  --qm-btn2-fg: {p['fg2']};
  --qm-btn3-fg: {p['fg3']};
}}
"""


def dice_block(sid):
    base = f"../assets/skins/{sid}/dice/"
    sel = f'body[data-qm-skin="{sid}"] .qm-die'
    rules = [f"""{sel} {{
  background: center / 118% 118% no-repeat;
  border-radius: 14%;
  box-shadow: none;
  filter: drop-shadow(0 calc(var(--s) * .06) calc(var(--s) * .08) #000b);
}}
{sel}::before {{ display: none; }}
{sel}[data-hit] {{ filter: drop-shadow(0 0 3px var(--qm-accent)) drop-shadow(0 0 1px var(--qm-accent)); outline: 0; }}"""]
    for n in range(1, 7):
        rules.append(f"{sel}[data-v=\"{n}\"] {{ background-image: url('{base}die-{n}.png'); }}")
    rules.append(f"{sel}[data-wild] {{ background-image: url('{base}die-1-wild.png'); box-shadow: none; }}")
    rules.append(f"{sel}[data-v=\"0\"] {{ background-image: url('{base}die-hidden.png'); }}")
    return "\n".join(rules) + "\n"


if __name__ == "__main__":
    out = HEAD
    for sid, p in SKINS.items():
        assert (ROOT / "assets" / "skins" / sid).is_dir(), f"falta assets/skins/{sid}"
        out += f"/* ---- {sid} ---- */\n" + skin_block(sid, p) + dice_block(sid) + "\n"
    out += COMMON
    (ROOT / "styles" / "skins.css").write_text(out, encoding="utf-8")
    print("styles/skins.css:", len(out), "bytes,", len(SKINS), "skins")
