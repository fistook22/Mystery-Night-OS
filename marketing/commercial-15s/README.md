# 15s commercial — storyboard (option A, motion graphics)

8 key frames (1080×1920, vertical) for the 15-second ad. Each frame is plain HTML/CSS in `frames.html`; `render.js` renders them to `out/`.

```
NODE_PATH=/opt/node22/lib/node_modules node render.js
```

Fonts are placeholders (system Liberation/DejaVu/FreeSerif). The final version should use Heebo/Rubik plus a display serif.
All brands shown are the fictional sellable skin (Wildlore, Noctyra, SlabCert, Pixelgram, Streamly).

## Files
- `cards.js` / `cards.css`: the Wildlore "Nightglass" creature set, card layout and SlabCert grading slab (reusable in the game UI).
- `collection.html` → `out/collection.png`: all six creature cards.
- `frames.html` → `out/f1…f8.png` + `out/contact-sheet.png`: the 15s storyboard (v2).

```
NODE_PATH=/opt/node22/lib/node_modules node shot.js collection.html out/collection.png 2240 1000
```
