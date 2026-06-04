# Media files — exact names for the deck

Drop your images and GIFs into the folders below using **exactly** these filenames (case-sensitive).  
The site loads them from `./media/…` so they work for every visitor once deployed.

Supported formats: `.png`, `.jpg`, `.jpeg`, `.webp`, `.gif` — use the extension listed for each slot.

When you add a new slot later, ask in chat and you will get a new row here and a matching `mediaId` in `script.js`.

---

## World 1 — Stratégie (`media/world-1/`)

| Slide | Label on screen | **Exact filename** | `mediaId` in code |
|-------|-----------------|--------------------|-------------------|
| Mon défi personnel | Jeu réaliste — 2024 | `w1-s2-jeu-realiste-2024.png` | `w1-s2-jeu-realiste-2024` |
| Mon défi personnel | HELL-o — 2025 | `w1-s2-hello-2025.png` | `w1-s2-hello-2025` |
| Analyse des références | Hollow Knight | `w1-s3-hollow-knight.jpg` | `w1-s3-hollow-knight` |
| Analyse des références | Metal Slug | `w1-s3-metal-slug.jpg` | `w1-s3-metal-slug` |
| Qu'est ce que c'est HELL-o? | HELL-o | `w1-s4-hell-o.png` | `w1-s4-hell-o` |

---

## World 2 — Conception (`media/world-2/`)

| Slide | Label on screen | **Exact filename** | `mediaId` in code |
|-------|-----------------|--------------------|-------------------|
| Moodboard | Personnages | `w2-s2-moodboard-characters.png` | `w2-s2-moodboard-characters` |
| Moodboard | Environnement | `w2-s2-moodboard-environment.jpg` | `w2-s2-moodboard-environment` |
| Moodboard | Style | `w2-s2-moodboard-style.png` | `w2-s2-moodboard-style` |
| Map design | Map design | `w2-s3-map-design.png` | `w2-s3-map-design` |
| Game Design Document | GDD — 1 | `w2-s4-gdd-1.png` | `w2-s4-gdd-1` |
| Game Design Document | GDD — 2 | `w2-s4-gdd-2.png` | `w2-s4-gdd-2` |

---

## World 4 — Game Design & Live Demo (`media/world-4/`)

| Slide | Label on screen | **Exact filename** | `mediaId` in code |
|-------|-----------------|--------------------|-------------------|
| Game Design & Live Demo | Gameplay / demo | `w4-s1-gameplay-demo.gif` | `w4-s1-gameplay-demo` |

Use `.gif` for animation; you can switch to `.png` or `.webp` if you change the `path` in `MEDIA_FILES` in `script.js`.

---

## Adding more media later

1. Tell which slide and whether it is an **image** or **GIF**.
2. You will receive: folder path, **exact filename**, and `mediaId`.
3. Copy the file into that folder and refresh the site.

Naming pattern: `w{world}-s{slide}-{short-description}.{ext}` (lowercase, hyphens, no accents).
