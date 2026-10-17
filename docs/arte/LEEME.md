# Arte por skins

Cada skin es un zip independiente con la misma estructura (`assets/skins/<skin>/…`). Genera la skin que quieras
y tráemela; las demás pueden esperar. Orden recomendado: **garito** (base, incluye el banner del README), luego
las que vayas a usar.

| Skin | Ambiente | Carpeta |
|---|---|---|
| El Garito (`garito`) | Black-and-white-movie noir: the smoky back room of a 1930s city gambling den, one hanging bulb, bourbon rings on the table, menacing but stylish. | `docs/arte/garito/` |
| La Taberna (`taberna`) | Grim medieval-fantasy inn: tallow-candle light, smoke-stained rafters, a place where people get robbed and stabbed over a game of dice. | `docs/arte/taberna/` |
| El Camarote (`pirata`) | 18th-century pirate ship's cabin at night: swaying lantern, rum, salt and tar, a game that ends with a knife in the table. | `docs/arte/pirata/` |
| El Saloon (`oeste`) | 1880s frontier saloon: dust, whisky, tin and leather, a faro table where somebody always cheats. | `docs/arte/oeste/` |
| La Cantina Neón (`neon`) | Rain-slick cyberpunk / space-port bar: neon haze, chrome, dealers who are not quite human, high stakes and worse manners. | `docs/arte/neon/` |

Por cada skin: pega `PROMPT.md` en el chat de imágenes y adjunta `arte-spec.json` + `verificar_zip.py`
(este último está en `docs/arte/`). El zip resultante se llama `queso-mentira-arte-<skin>.zip`.

Los iconos de acción, de jugador y los emblemas de cada juego los dibujo yo en SVG (se tiñen con los colores de la
skin), así que no hay que generarlos.

Para añadir una skin nueva: una entrada más en `SKINS` de `generar.py` y `python3 docs/arte/generar.py`.
