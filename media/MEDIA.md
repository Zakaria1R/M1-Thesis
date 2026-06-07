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

## World 3 — Pilotage (`media/world-3/`)

| Slide | Software | **Exact filename** | `mediaId` in code |
|-------|----------|--------------------|-------------------|
| Choix Dev | Unreal Engine | `w3-s2-icon-unreal-engine.png` | `w3-s2-icon-unreal-engine` |
| Choix Dev | Blueprints (C++) | `w3-s2-icon-blueprints.png` | `w3-s2-icon-blueprints` |
| Choix Dev | LibreSprite | `w3-s2-icon-libresprite.png` | `w3-s2-icon-libresprite` |
| Choix Dev | Photoshop | `w3-s2-icon-photoshop.png` | `w3-s2-icon-photoshop` |
| Choix Dev | FL Studio | `w3-s2-icon-fl-studio.png` | `w3-s2-icon-fl-studio` |
| Création des Sprites | Sprite 1 | `w3-s3-creation-sprites-1.png` | `w3-s3-creation-sprites-1` |
| Création des Sprites | Sprite 2 | `w3-s3-creation-sprites-2.png` | `w3-s3-creation-sprites-2` |
| Création des Sprites | Sprite 3 | `w3-s3-creation-sprites-3.png` | `w3-s3-creation-sprites-3` |
| Integration & Organization | Integration & Organization | `w3-s4-integration-organization.png` | `w3-s4-integration-organization` |
| Création d'environnement | Création d'environnement | `w3-s5-creation-environnement.png` | `w3-s5-creation-environnement` |
| Création des Personnages | Création des Personnages | `w3-s6-creation-personnages.png` | `w3-s6-creation-personnages` |
| Programmation Blueprint — Système de locomotion — Part 1 | Programmation Blueprint — Système de locomotion — Part 1 | `w3-s7-programmation-blueprint-part-1.png` | `w3-s7-programmation-blueprint-part-1` |
| Programmation Blueprint — Système de locomotion — Part 2 | Programmation Blueprint — Système de locomotion — Part 2 | `w3-s8-programmation-blueprint-part-2.png` | `w3-s8-programmation-blueprint-part-2` |
| Programmation Blueprint — Système des dégâts — Part 1 | Programmation Blueprint — Système des dégâts — Part 1 | `w3-s9-programmation-blueprint-part-3.png` | `w3-s9-programmation-blueprint-part-3` |
| Programmation Blueprint — Système des dégâts — Part 2 | Programmation Blueprint — Système des dégâts — Part 2 | `w3-s10-programmation-blueprint-part-4.png` | `w3-s10-programmation-blueprint-part-4` |
| Programmation — Défis (Navigation inter-niveau) — Part 1 | Part 1 | `w3-s11-defis-navigation-part-1-1.png` | `w3-s11-defis-navigation-part-1-1` |
| Programmation — Défis (Navigation inter-niveau) — Part 2 | Part 2 | `w3-s12-defis-navigation-part-2-1.png` | `w3-s12-defis-navigation-part-2-1` |
| Programmation — Défis (Navigation inter-niveau) — Part 3 | Part 3 | `w3-s13-defis-navigation-part-3-1.png` | `w3-s13-defis-navigation-part-3-1` |
| Programmation — Défis (Navigation inter-niveau) — Part 4 | Part 4 | `w3-s14-defis-navigation-part-4-1.png` | `w3-s14-defis-navigation-part-4-1` |

Use small square PNG icons (about 48×48 px or larger; they scale down in the slide) for Choix Dev.

---

## World 4 — Univers Sonore (`media/world-4/`)

| Slide | Label on screen | **Exact filename** | `mediaId` in code |
|-------|-----------------|--------------------|-------------------|
| Choix des Synths et Création des Mélodies | Choix des Synths et Création des Mélodies | `w4-s2-choix-synths-creation-melodies.png` | `w4-s2-choix-synths-creation-melodies` |
| Effet de pixelisation | Effet de pixelisation | `w4-s3-effet-pixelisation.png` | `w4-s3-effet-pixelisation` |

---

## Adding more media later

1. Tell which slide and whether it is an **image** or **GIF**.
2. You will receive: folder path, **exact filename**, and `mediaId`.
3. Copy the file into that folder and refresh the site.

Naming pattern: `w{world}-s{slide}-{short-description}.{ext}` (lowercase, hyphens, no accents).
