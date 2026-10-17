#!/usr/bin/env python3
"""Iconos SVG de un solo color (se tiñen con CSS mediante máscaras) y su hoja de estilos.

Ejecutar:  python3 docs/arte/gen_iconos.py
Escribe assets/icons/{actions,players,games}/*.svg y styles/iconos.css.
Uso en HTML:  <i class="qm-ico" data-ico="subir"></i>  (toma el color del texto: currentColor)
Un juego nuevo con id «xyz» solo necesita su emblema en GAMES (aquí) y se enlaza solo.
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
F = 'fill="#000"'
def S(w=5):
    return f'fill="none" stroke="#000" stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round"'



def die(x, y, size, pips, rot=None):
    """Dado como figura rellena con los puntos recortados (evenodd). pips: lista de (u, v) en 0..1."""
    r = size * 0.1
    d = (f"M{x + 5} {y}h{size - 10}a5 5 0 0 1 5 5v{size - 10}a5 5 0 0 1-5 5H{x + 5}a5 5 0 0 1-5-5V{y + 5}a5 5 0 0 1 5-5z")
    for u, v in pips:
        cx, cy = x + u * size, y + v * size
        d += f"M{cx - r:.1f} {cy:.1f}a{r:.1f} {r:.1f} 0 1 0 {2 * r:.1f} 0a{r:.1f} {r:.1f} 0 1 0-{2 * r:.1f} 0z"
    cx, cy = x + size / 2, y + size / 2
    t = f' transform="rotate({rot} {cx:.1f} {cy:.1f})"' if rot else ""
    return f'<path {F} fill-rule="evenodd"{t} d="{d}"/>'


ACTIONS = {
    "subir": f'<path {F} d="M32 6L52 28H38V46H26V28H12z"/><rect {F} x="10" y="52" width="44" height="6" rx="3"/>',
    "mentira": f'<path {F} fill-rule="evenodd" d="M10 8h44a4 4 0 0 1 4 4v28a4 4 0 0 1-4 4H32L18 58V44h-8a4 4 0 0 1-4-4V12a4 4 0 0 1 4-4zM29 16h6v14h-6zM29 34h6v6h-6z"/>',
    "calzar": f'<g {S()}><circle cx="32" cy="32" r="25"/><circle cx="32" cy="32" r="13"/></g><circle {F} cx="32" cy="32" r="4.5"/>',
    "dudar": f'<g {S(6)}><circle cx="26" cy="26" r="17"/><path d="M39 39L56 56" stroke-width="9"/></g>',
    "aceptar": f'<rect {S()} x="9" y="9" width="46" height="46" rx="10"/>'
               f'<circle {F} cx="22" cy="22" r="4.5"/><circle {F} cx="32" cy="32" r="4.5"/><circle {F} cx="42" cy="42" r="4.5"/>',
    "tirar": die(4, 26, 26, [(0.3, 0.3), (0.7, 0.7)], rot=-14) + die(32, 8, 26, [(0.3, 0.3), (0.5, 0.5), (0.7, 0.7)], rot=16),
    "plantarse": f'<g {S(4)}><ellipse cx="32" cy="46" rx="20" ry="7"/><path d="M12 46v-10c0 4 9 7 20 7s20-3 20-7v10"/><path d="M12 36v-10c0 4 9 7 20 7s20-3 20-7v10"/><ellipse cx="32" cy="26" rx="20" ry="7"/></g>',
    "anunciar": f'<path {F} d="M6 24h12l24-14v44L18 40H6z"/><path {F} d="M14 40l4 16h9l-4-16z"/>'
                f'<path {S(4)} d="M48 22c5 6 5 14 0 20M55 14c9 10 9 26 0 36"/>',
}

PLAYERS = {
    "humano": f'<circle {F} cx="32" cy="20" r="12"/><path {F} d="M8 58c0-14 10-22 24-22s24 8 24 22z"/>',
    "ia": f'<rect {F} x="30" y="6" width="4" height="12"/><circle {F} cx="32" cy="6" r="4.5"/>'
          f'<path {F} fill-rule="evenodd" d="M16 18h32a8 8 0 0 1 8 8v22a8 8 0 0 1-8 8H16a8 8 0 0 1-8-8V26a8 8 0 0 1 8-8z'
          f'M20 33a5 5 0 1 0 10 0a5 5 0 1 0-10 0zM34 33a5 5 0 1 0 10 0a5 5 0 1 0-10 0zM22 45h20v4H22z"/>',
    "gm": f'<path {F} d="M6 48L10 18l14 14 8-22 8 22 14-14 4 30z"/><rect {F} x="6" y="52" width="52" height="7" rx="3"/>',
}

GAMES = {
    "liars-dice": f'<path {F} d="M12 12h24l-4 38H16z"/><rect {F} x="9" y="6" width="30" height="7" rx="3"/>'
                  + die(36, 32, 24, [(0.3, 0.3), (0.7, 0.7)]),
    "mia": f'<path {F} d="M20 27L23 10L30 19L34 7L38 19L45 10L48 27z"/>'
           + die(6, 32, 24, [(0.3, 0.3), (0.7, 0.7)], rot=-12) + die(34, 32, 24, [(0.5, 0.5)], rot=14),
    "diez-mil": f'<g {S(4)}><rect x="16" y="38" width="26" height="22" rx="5"/>'
                f'<rect x="19" y="20" width="26" height="20" rx="5" transform="rotate(-8 32 30)"/>'
                f'<rect x="22" y="4" width="22" height="18" rx="5" transform="rotate(10 33 13)"/></g>'
                f'<circle {S(4)} cx="52" cy="52" r="7"/>',
    "capitan-barco": f'<g {S(4)}><circle cx="32" cy="32" r="14"/>'
                     f'<path d="M32 8v48M8 32h48M15 15l34 34M49 15L15 49"/></g><circle {F} cx="32" cy="32" r="5"/>'
                     + "".join(f'<circle {F} cx="{x}" cy="{y}" r="4"/>' for x, y in
                               [(32, 6), (32, 58), (6, 32), (58, 32), (14, 14), (50, 50), (50, 14), (14, 50)]),
    "chuza": die(6, 8, 24, [(0.3, 0.3), (0.7, 0.7), (0.3, 0.7), (0.7, 0.3)], rot=-18)
             + die(34, 30, 24, [(0.3, 0.3), (0.5, 0.5), (0.7, 0.7)], rot=22)
             + f'<path {S(3)} d="M6 44c4 8 10 12 18 14M34 10c6-4 14-4 20 0"/>',
    # abanico de tres cartas: las de atrás rellenas y recortadas por la delantera mediante una máscara interna
    "siete-y-media": '<defs><mask id="g"><rect width="64" height="64" fill="#fff"/>'
                     '<rect x="20" y="8" width="24" height="36" rx="5" fill="#000" stroke="#000" stroke-width="5"/></mask></defs>'
                     f'<g mask="url(#g)"><rect {F} x="22" y="12" width="20" height="32" rx="3" transform="rotate(-24 32 58)"/>'
                     f'<rect {F} x="22" y="12" width="20" height="32" rx="3" transform="rotate(24 32 58)"/></g>'
                     f'<rect {S(4)} x="22" y="10" width="20" height="32" rx="3"/><circle {F} cx="32" cy="26" r="5"/>',
    # astrágalo estilizado: contorno de hueso de cuatro caras con dos hoyos
    "tabas": f'<path {S(5)} d="M32 6C22 6 12 12 10 24 8 36 12 50 20 57c6 3 18 3 24 0 8-7 12-21 10-33C52 12 42 6 32 6z"/>'
             f'<path {S(4)} d="M22 22c6 4 6 12 0 16M42 26c-5 3-5 9 0 12"/><circle {F} cx="30" cy="46" r="3.5"/><circle {F} cx="38" cy="14" r="3"/>',
    # jarra de cerveza (concurso de bebida / pulso)
    "pulso": f'<path {F} d="M12 22h30v32a6 6 0 0 1-6 6H18a6 6 0 0 1-6-6z"/>'
             f'<path {S(5)} d="M42 28h6a6 6 0 0 1 6 6v8a6 6 0 0 1-6 6h-6"/>'
             f'<circle {F} cx="19" cy="17" r="6"/><circle {F} cx="28" cy="13" r="7.5"/><circle {F} cx="37" cy="17" r="6"/>',
}

GROUPS = {"actions": ACTIONS, "players": PLAYERS, "games": GAMES}


def svg(body):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">{body}</svg>\n'


if __name__ == "__main__":
    css = ["/* GENERADO por docs/arte/gen_iconos.py — no editar a mano.\n   Iconos de un solo color: <i class=\"qm-ico\" data-ico=\"subir\"></i>, toman el color del texto. */",
           ".qm-ico { display: inline-block; width: 1.15em; height: 1.15em; vertical-align: -.2em; flex: none; background-color: currentColor;"
           " -webkit-mask: var(--ico) center / contain no-repeat; mask: var(--ico) center / contain no-repeat; }",
           ".qm-ico.qm-ico-lg { width: 2em; height: 2em; }"]
    for group, icons in GROUPS.items():
        d = ROOT / "assets" / "icons" / group
        d.mkdir(parents=True, exist_ok=True)
        for name, body in icons.items():
            (d / f"{name}.svg").write_text(svg(body), encoding="utf-8")
            css.append(f'.qm-ico[data-ico="{name}"] {{ --ico: url("../assets/icons/{group}/{name}.svg"); }}')
    (ROOT / "styles" / "iconos.css").write_text("\n".join(css) + "\n", encoding="utf-8")
    print(sum(len(g) for g in GROUPS.values()), "iconos")
