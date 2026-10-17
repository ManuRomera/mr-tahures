#!/usr/bin/env python3
"""Verifica que un zip de arte cumple arte-spec.json (rutas, tamaño exacto, formato, alfa, margen, magenta, tileable).

Uso:  python3 verificar_zip.py queso-mentira-arte.zip arte-spec.json
Salida: tabla por archivo y, al final, «TODO CORRECTO» (código 0) o la lista de fallos (código 1).
Requiere Pillow.
"""
import io
import json
import statistics
import sys
import zipfile

from PIL import Image

MAX_FILE = 400 * 1024
MAX_DICE = 150 * 1024
MAX_ZIP = 25 * 1024 * 1024
TILE_TOL = 14.0       # diferencia media máxima entre bordes opuestos (0-255)
MAGENTA_MAX = 0.0005  # fracción máxima de píxeles casi magenta con alfa


def seam_diff(im, axis):
    a = im.convert("RGB")
    w, h = a.size
    px = a.load()
    if axis == 0:   # izquierda vs derecha
        pairs = [(px[0, y], px[w - 1, y]) for y in range(h)]
    else:           # arriba vs abajo
        pairs = [(px[x, 0], px[x, h - 1]) for x in range(w)]
    return statistics.fmean(sum(abs(p - q) for p, q in zip(u, v)) / 3 for u, v in pairs)


def check(zf, a):
    errs = []
    path = a["path"]
    info = None
    try:
        info = zf.getinfo(path)
    except KeyError:
        return ["FALTA el archivo"], None
    limit = MAX_DICE if a["group"] == "dice" else MAX_FILE
    if info.file_size > limit:
        errs.append(f"pesa {info.file_size // 1024} KB (máx {limit // 1024} KB)")
    try:
        im = Image.open(io.BytesIO(zf.read(path)))
        im.load()
    except Exception as e:  # noqa: BLE001
        return errs + [f"no se puede abrir: {e}"], info
    if im.format != a["fmt"]:
        errs.append(f"formato {im.format}, esperado {a['fmt']}")
    if im.size != (a["w"], a["h"]):
        errs.append(f"tamaño {im.size[0]}×{im.size[1]}, esperado {a['w']}×{a['h']}")
        return errs, info
    has_alpha = im.mode in ("RGBA", "LA") or "transparency" in im.info
    if a["bg"] == "transparent":
        if im.mode != "RGBA":
            errs.append(f"modo {im.mode}, esperado RGBA")
            im = im.convert("RGBA")
        alpha = im.getchannel("A")
        lo, hi = alpha.getextrema()
        if lo != 0:
            errs.append("no hay ningún píxel transparente")
        bbox = alpha.point(lambda v: 255 if v > 10 else 0).getbbox()
        if bbox is None:
            errs.append("imagen vacía")
        else:
            m = a["margin"] / 100.0
            if m and a["path"].endswith("esquina.png"):
                pass  # la esquina toca por diseño los bordes superior e izquierdo
            elif m:
                l, t, r, b = bbox
                if l < a["w"] * m or t < a["h"] * m or a["w"] - r < a["w"] * m or a["h"] - b < a["h"] * m:
                    errs.append(f"margen insuficiente (bbox {bbox}, mínimo {a['margin']} %)")
        px = im.getdata()
        n = len(px)
        mag = sum(1 for r, g, b, al in px if al > 0 and r > 215 and b > 215 and g < 90)
        if n and mag / n > MAGENTA_MAX:
            errs.append(f"píxeles magenta residuales: {mag}")
    else:
        if has_alpha and (im.mode != "RGB"):
            alpha = im.convert("RGBA").getchannel("A")
            if alpha.getextrema()[0] != 255:
                errs.append("debe ser opaca y tiene transparencia")
        if a["tile"]:
            dx, dy = seam_diff(im, 0), seam_diff(im, 1)
            if a["h"] > 200 and dy > TILE_TOL:
                errs.append(f"no encaja arriba/abajo (diferencia {dy:.1f})")
            if dx > TILE_TOL:
                errs.append(f"no encaja izquierda/derecha (diferencia {dx:.1f})")
    return errs, info


def dice_consistency(zf, items):
    """Los 8 dados deben ocupar casi el mismo recuadro (mismo tamaño de cubo)."""
    boxes = {}
    for a in items:
        if a["group"] != "dice" or a["path"] not in zf.namelist():
            continue
        try:
            im = Image.open(io.BytesIO(zf.read(a["path"]))).convert("RGBA")
            bb = im.getchannel("A").point(lambda v: 255 if v > 10 else 0).getbbox()
            if bb:
                boxes[a["path"]] = (bb[2] - bb[0], bb[3] - bb[1])
        except Exception:  # noqa: BLE001
            pass
    out = []
    for skin in sorted({p.split("/")[2] for p in boxes}):   # assets/skins/<skin>/dice/...
        group = {p: v for p, v in boxes.items() if p.split("/")[2] == skin}
        if len(group) < 2:
            continue
        mw = statistics.median(w for w, _ in group.values())
        mh = statistics.median(h for _, h in group.values())
        out += [f"{p}: cubo {w}×{h} difiere de la mediana {mw:.0f}×{mh:.0f} (>8 %)" for p, (w, h) in group.items()
                if abs(w - mw) / mw > 0.08 or abs(h - mh) / mh > 0.08]
    return out


def main():
    if len(sys.argv) != 3:
        print(__doc__)
        return 2
    zpath, spath = sys.argv[1], sys.argv[2]
    items = json.load(open(spath, encoding="utf-8"))
    fails = 0
    with zipfile.ZipFile(zpath) as zf:
        size = sum(i.compress_size for i in zf.infolist())
        print(f"{'archivo':44} {'estado'}")
        for a in items:
            errs, _ = check(zf, a)
            print(f"{a['path']:44} {'OK' if not errs else 'FALLA: ' + '; '.join(errs)}")
            fails += bool(errs)
        extra = sorted(n for n in zf.namelist() if not n.endswith("/") and n not in {a["path"] for a in items})
        for n in extra:
            print(f"{n:44} FALLA: archivo no previsto")
            fails += 1
        for msg in dice_consistency(zf, items):
            print(f"CONSISTENCIA: {msg}")
            fails += 1
        if size > MAX_ZIP:
            print(f"ZIP demasiado grande: {size // 1024 // 1024} MB (máx 25 MB)")
            fails += 1
    print("\nTODO CORRECTO" if not fails else f"\n{fails} problema(s). Corrígelos y vuelve a generar el zip.")
    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(main())
