# M1 Thesis Defense — Pixel Deck — Project Guide

Use this document as context when helping Zakaria Rahmouni build and maintain his thesis presentation website.

---

## What this project is

A **keyboard-only, full-screen, retro CRT / pixel-art presentation deck** for an M1 thesis defense about the game **HELL-o**. It runs as a **static site** (HTML + CSS + vanilla JS), deployed on **Vercel** from GitHub.

- **Live site:** https://m1-thesis.vercel.app/
- **GitHub repo:** https://github.com/Zakaria1R/M1-Thesis.git (branch `main`)
- **Presenter:** Zakaria Rahmouni — ITECOM Art Design — RNCP39855
- **Language:** French slide content; UI mixes French and English

There is **no build step**. Vercel serves the files as-is (Framework: Other / static).

---

## File structure

```
M1 Thesis/
├── index.html          # Shell: HUD, CRT overlay, cache-busted script/css links
├── script.js           # All slides, navigation, media registry, boot sequence
├── styles.css          # Pixel/CRT aesthetic, slide layouts, image frames
├── README.md           # Short local-run + deploy notes
├── PROJECT-GUIDE.md    # This file (AI / collaborator context)
└── media/
    ├── MEDIA.md        # Canonical list of image filenames per slide
    ├── world-1/        # World 1 — Stratégie
    ├── world-2/        # World 2 — Conception
    ├── world-3/        # World 3 — Pilotage
    └── world-4/        # World 4 — Game Design & Live Demo (mostly placeholder)
```

---

## How navigation works

| Key | Action |
|-----|--------|
| **Enter** (on boot) | Start deck after “PRESS START” |
| **→** or **Enter** | Next slide; at last slide of a world → first slide of next world |
| **←** | Previous slide; at first slide → last slide of previous world |

- **Boot screen:** CRT power-on animation on canvas; HUD hidden until Enter.
- **World 0:** Title screen with thesis info.
- **World 1:** Level select (6 world cards; click or Enter on card jumps to that world).
- **Worlds 2–7 (code):** Presentation Worlds 1–6 with multiple slides each.

### On-screen chrome (after boot)

| Element | Position | Purpose |
|---------|----------|---------|
| `hudKeys` | Top-left | Shows `← → / Enter` |
| `slideBeacon` | Top-center | `w{N}.{S}` + slide title (hidden on title & level select) |
| `deckCounter` | Bottom-center | Global slide number across entire deck |

---

## World numbering (important)

There are **two numbering systems**:

| Code `state.world` | Presentation label | `worldMeta` / slides array |
|--------------------|--------------------|----------------------------|
| 0 | Title | — |
| 1 | Level select | — |
| 2 | **World 1** | `world1Slides` |
| 3 | **World 2** | `world2Slides` |
| 4 | **World 3** | `world3Slides` |
| 5 | **World 4** | `world4Slides` |
| 6 | **World 5** | `world5Slides` |
| 7 | **World 6** | `world6Slides` |

- Beacon code `w3.7` = **presentation World 3**, slide index 7 = **`world3Slides[6]`** (0-based).
- `slideScreen(4, …)` uses code world **4** for World 3 slides (Pilotage).

---

## Slide layout pattern

Every content slide (Worlds 1–6) uses a **two-level header**:

1. **Small line:** world label, e.g. `WORLD 3 — PILOTAGE`
2. **Large line:** slide title, e.g. `Création des Sprites`

Intro slides per world use `{ intro: true }` → centered large title only, no body.

### Slide content helpers (`script.js`)

| Helper | Use case |
|--------|----------|
| `slideScreen(world, title, children, options)` | Standard slide wrapper with header + body |
| `imageFrame(label, mediaId)` | Single image in a bordered frame |
| `bigShotMedia(mediaId, placeholder)` | Large demo GIF/video area |
| `devChoiceRow(iconIds, text)` | Dev stack row with icon(s) on the right |

### Common CSS layout classes

| Class | Layout |
|-------|--------|
| `slideMediaSingle slideMediaSingle--map` | One large image (blueprints, maps, screenshots) |
| `mediaTriple` | Three images in a row (sprites) |
| `grid2 grid2--media` | Two images side by side |
| `mediaPair mediaPair--docs` | Two portrait docs (GDD pages) |
| `devChoiceList` | Vertical list of dev tool choices with icons |

**Image cropping fix:** `slideMediaSingle--map` images use natural aspect ratio and `max-height: min(calc(80vh - 220px), 540px)`. Do not reintroduce fixed `aspect-ratio: 16/10` on these frames — it caused bottom clipping.

---

## Media system

Images are **not embedded in code**. They are static files referenced by `MEDIA_FILES` in `script.js` and documented in `media/MEDIA.md`.

### Naming pattern

```
w{world}-s{slide}-{short-description}.{ext}
```

- Lowercase, hyphens, **no accents in filenames**
- Example: `w3-s7-programmation-blueprint-part-1.png`
- Path in code: `world-3/w3-s7-programmation-blueprint-part-1.png`
- Full disk path: `media/world-3/w3-s7-programmation-blueprint-part-1.png`

### Critical workflow for images (user preference)

1. **Never auto-copy or guess** which screenshot belongs to a slide.
2. When adding a slide with an image, **only register the slot** and tell the user the **exact filename**.
3. The user renames their file and places it in **`media/world-{N}/`** (not `media/` root).
4. After the user confirms files are in place, **commit and push** when asked.

If a file is in `media/` root with the correct name, move it to `media/world-{N}/` before commit.

### Supported formats

`.png`, `.jpg`, `.jpeg`, `.webp`, `.gif`

### Image rendering

- Slide photos use `image-rendering: auto` (smooth scaling).
- Boot logo canvas and pixel cursor stay pixelated.
- **Do not change** CRT scanlines, vignette, or overall retro aesthetic unless the user explicitly asks.

---

## Current slide inventory (as of last update)

### World 1 — Stratégie (`world1Slides`, 4 slides)

| w1.# | Title |
|------|-------|
| w1.1 | STRATÉGIE (intro) |
| w1.2 | Mon défi personnel |
| w1.3 | Analyse des références |
| w1.4 | Qu'est ce que c'est HELL-o? |

### World 2 — Conception (`world2Slides`, 4 slides)

| w2.# | Title |
|------|-------|
| w2.1 | CONCEPTION (intro) |
| w2.2 | Moodboard: personnages, environnement & style |
| w2.3 | Map design |
| w2.4 | Game Design Document |

### World 3 — Pilotage (`world3Slides`, 11 slides)

| w3.# | Title |
|------|-------|
| w3.1 | PILOTAGE (intro) |
| w3.2 | Choix Dev |
| w3.3 | Création des Sprites |
| w3.4 | Integration & Organization |
| w3.5 | Création d'environnement |
| w3.6 | Création des Personnages |
| w3.7 | Programmation Blueprint — Système de locomotion — Part 1 |
| w3.8 | Programmation Blueprint — Système de locomotion — Part 2 |
| w3.9 | Programmation Blueprint — Système des dégâts — Part 1 |
| w3.10 | Programmation Blueprint — Système des dégâts — Part 2 |

### World 4–6

Mostly placeholder content. World 4 has one slide expecting `w4-s1-gameplay-demo.gif`.

---

## How to add a new slide

1. **`script.js` — `MEDIA_FILES`** (if image needed): add entry with `path` and `alt`.
2. **`script.js` — `worldNSlides`**: add object `{ title, render: () => slideScreen(...) }`.
3. **`media/MEDIA.md`**: add a row with exact filename and `mediaId`.
4. **`index.html`**: bump `?v=…` query on `styles.css` and `script.js` (cache bust).
5. Tell user the **exact filename** and folder; wait for them to add the file.
6. **Commit and push** when the user asks.

### Blueprint multi-part slides

Use filenames like `w3-s{N}-programmation-blueprint-part-{K}.png` and titles like:

`Programmation Blueprint — Système de locomotion — Part 1`

French spelling: **dégâts** (with circumflex), **locomotion** (lowercase in titles).

---

## Cache busting

`index.html` loads:

```html
<link rel="stylesheet" href="./styles.css?v=COMMIT-rN" />
<script src="./script.js?v=COMMIT-rN" defer></script>
```

Bump the version string after **any** change to `script.js`, `styles.css`, or when HTML structure changes — otherwise Vercel/browser cache can serve stale JS and break navigation or layout.

---

## Git & deploy workflow

- User typically asks: **“commit and push”** after changes.
- Only commit when explicitly requested.
- Remote: `origin/main` on GitHub → auto-deploys to Vercel.
- After deploy: user should **hard refresh** (Ctrl+Shift+R).

### Local preview

```bash
python -m http.server 5173
```

Open http://localhost:5173 — do not open `index.html` as `file://` if testing script loading issues.

---

## Things that have broken before (avoid)

1. **Removing HUD DOM nodes without updating `script.js`** — init throws `Missing required DOM nodes` and keyboard nav dies.
2. **Calling deleted functions in `init()`** — e.g. leftover `setHudForWorld()` / `tick()` after HUD cleanup caused `ReferenceError`.
3. **Stale cache** — HTML updated but `?v=` on script unchanged → old JS loads.
4. **Wrong image folder** — files in `media/` root instead of `media/world-{N}/`.
5. **Auto-picking screenshots** — user must name files themselves.
6. **Changing scanlines / panel size / CRT effects** for image sharpness — user wants retro look preserved; only image-specific CSS is acceptable.

---

## How you (Claude) can help

- Add or edit slides in `worldNSlides` arrays.
- Register new media slots and document filenames in `MEDIA.md`.
- Fix layout bugs (cropping, frame overflow, moodboard sizing).
- Improve French copy on slide titles and bullets.
- Split long topics into multi-part slides (Blueprint pattern).
- Commit and push when asked.
- **Do not** redesign the aesthetic, remove scanlines, or change navigation without explicit request.
- **Do not** commit secrets or push without user asking.

When unsure about an image, **ask for the filename** or wait for the user to place the correctly named file.

---

## Key code locations

| Concern | File | Location |
|---------|------|----------|
| Slide definitions | `script.js` | `world1Slides` … `world6Slides` |
| Media registry | `script.js` | `MEDIA_FILES` |
| Navigation | `script.js` | `handleKeydown`, `navigateNext`, `navigatePrev` |
| Boot sequence | `script.js` | `renderBootScreen`, `runBootSequence` |
| Image frames CSS | `styles.css` | `.frame`, `.slideMediaSingle--map` |
| CRT overlay | `styles.css` | `.crt`, `.crt__scanlines` |
| Filename reference | `media/MEDIA.md` | Per-world tables |

---

*Last updated to reflect World 3 through w3.10 and image crop fix (commit `03dc091`).*
