/* eslint-disable no-console */
(() => {
  "use strict";

  const WORLD_MIN = 0;
  // Worlds:
  // 0 Title
  // 1 Level Select (non-interactive overview)
  // 2..7 correspond to Worlds 1..6
  const WORLD_MAX = 7;

  const app = document.getElementById("app");
  const wipe = document.getElementById("wipe");
  const power = document.getElementById("power");
  const hud = document.getElementById("hud");
  const hudKeys = document.getElementById("hudKeys");
  const slideBeacon = document.getElementById("slideBeacon");
  const slideBeaconCode = document.getElementById("slideBeaconCode");
  const slideBeaconName = document.getElementById("slideBeaconName");
  const deckCounter = document.getElementById("deckCounter");

  if (
    !app ||
    !wipe ||
    !power ||
    !hud ||
    !hudKeys ||
    !slideBeacon ||
    !slideBeaconCode ||
    !slideBeaconName ||
    !deckCounter
  ) {
    throw new Error("Missing required DOM nodes.");
  }

  const state = {
    world: 0,
    slide: 0,
    booted: false,
    pressStartArmed: false,
    transitionLock: false,
    bootLogoLoopRunning: false,
    bootLogoRafId: 0,
  };

  const deckInfo = {
    name: "Zakaria Rahmouni",
    thesisTitle: "HELL-o",
    rncp: "RNCP39855",
    track: "Expert Design Digital & Game Design",
    school: "ITECOM Art Design",
    presentedHeading: "PRÉSENTÉ PAR",
    supervisorsHeading: "ENCADRÉ PAR",
    supervisors: ["SONIA BENSOULA", "DAPHNÉ LEJEUNE"],
  };

  const worldMeta = {
    0: {
      hud: "WORLD 0 — TITLE",
      bloc: "BLOC —",
    },
    1: { hud: "LEVEL SELECT", bloc: "CARTE — WORLDS 1 → 6" },
    2: { hud: "WORLD 1 — STRATÉGIE", bloc: "BLOC 1 — C1.1 → C1.5" },
    3: { hud: "WORLD 2 — CONCEPTION", bloc: "BLOC 2 — C2.1 → C2.6" },
    4: { hud: "WORLD 3 — PILOTAGE", bloc: "BLOC 3 — C3.1 → C3.4" },
    5: { hud: "WORLD 4 — UNIVERS SONORE", bloc: "BLOC 4 — UNIVERS SONORE" },
    6: { hud: "WORLD 5 — RESPONSABILITÉ & RSE", bloc: "TRANSVERSAL — RSE" },
    7: { hud: "WORLD 6 — BILAN / GAME OVER", bloc: "FIN — MERCI" },
  };

  function now() {
    return performance.now();
  }

  /** Worlds 2..7 map to presentation Worlds 1..6. */
  function presentationWorldNum(world) {
    return world >= 2 ? world - 1 : 0;
  }

  function globalSlideNumber(world, slideIndex = 0) {
    if (world === 0) return 1;
    if (world === 1) return 2;

    let n = 2;
    for (let w = 2; w < world; w++) {
      n += slideCount(w);
    }
    const slides = slideCount(world);
    const idx = slides > 0 ? Math.min(Math.max(0, slideIndex), slides - 1) : 0;
    return n + idx + 1;
  }

  function updateDeckChrome() {
    if (!state.booted) {
      slideBeacon.classList.add("is-hidden");
      deckCounter.classList.add("is-hidden");
      return;
    }

    const n = globalSlideNumber(state.world, state.slide);
    deckCounter.textContent = String(n);
    deckCounter.classList.remove("is-hidden");

    const slides = getSlidesForWorld(state.world);
    if (state.world < 2 || slides.length === 0) {
      slideBeacon.classList.add("is-hidden");
      return;
    }

    const slideIndex = Math.min(Math.max(0, state.slide), slides.length - 1);
    const slide = slides[slideIndex];
    if (!slide) {
      slideBeacon.classList.add("is-hidden");
      return;
    }

    const w = presentationWorldNum(state.world);
    const s = slideIndex + 1;
    slideBeaconCode.textContent = `w${w}.${s}`;
    slideBeaconName.textContent = slide.title;
    slideBeacon.classList.remove("is-hidden");
  }

  function h(tag, attrs = {}, children = []) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === "class") el.className = v;
      else if (k === "text") el.textContent = v;
      else if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, String(v));
    }
    for (const child of children) el.append(child);
    return el;
  }

  function worldLabel(world) {
    return worldMeta[world]?.hud ?? `WORLD ${world}`;
  }

  function slideCount(world) {
    return getSlidesForWorld(world).length;
  }

  /** Public static assets — paths relative to site root (works on Vercel / GitHub Pages). */
  const MEDIA_BASE = "./media";

  /**
   * Registry of media slots. Copy files into media/ using the exact `path` filename.
   * See media/MEDIA.md for the full list.
   */
  const MEDIA_FILES = {
    "w1-s2-jeu-realiste-2024": {
      path: "world-1/w1-s2-jeu-realiste-2024.png",
      alt: "Jeu réaliste — 2024",
    },
    "w1-s2-hello-2025": {
      path: "world-1/w1-s2-hello-2025.png",
      alt: "HELL-o — 2025",
    },
    "w1-s3-hollow-knight": {
      path: "world-1/w1-s3-hollow-knight.jpg",
      alt: "Hollow Knight",
    },
    "w1-s3-metal-slug": {
      path: "world-1/w1-s3-metal-slug.jpg",
      alt: "Metal Slug",
    },
    "w1-s4-hell-o": {
      path: "world-1/w1-s4-hell-o.png",
      alt: "HELL-o",
    },
    "w2-s2-moodboard-characters": {
      path: "world-2/w2-s2-moodboard-characters.png",
      alt: "Moodboard — personnages",
    },
    "w2-s2-moodboard-environment": {
      path: "world-2/w2-s2-moodboard-environment.jpg",
      alt: "Moodboard — environnement",
    },
    "w2-s2-moodboard-style": {
      path: "world-2/w2-s2-moodboard-style.png",
      alt: "Moodboard — style",
    },
    "w2-s3-map-design": {
      path: "world-2/w2-s3-map-design.png",
      alt: "Map design",
    },
    "w2-s4-gdd-1": {
      path: "world-2/w2-s4-gdd-1.png",
      alt: "Game Design Document — 1",
    },
    "w2-s4-gdd-2": {
      path: "world-2/w2-s4-gdd-2.png",
      alt: "Game Design Document — 2",
    },
    "w3-s2-icon-unreal-engine": {
      path: "world-3/w3-s2-icon-unreal-engine.png",
      alt: "Unreal Engine",
    },
    "w3-s2-icon-blueprints": {
      path: "world-3/w3-s2-icon-blueprints.png",
      alt: "Blueprints (C++)",
    },
    "w3-s2-icon-libresprite": {
      path: "world-3/w3-s2-icon-libresprite.png",
      alt: "LibreSprite",
    },
    "w3-s2-icon-photoshop": {
      path: "world-3/w3-s2-icon-photoshop.png",
      alt: "Photoshop",
    },
    "w3-s2-icon-fl-studio": {
      path: "world-3/w3-s2-icon-fl-studio.png",
      alt: "FL Studio",
    },
    "w3-s3-creation-sprites-1": {
      path: "world-3/w3-s3-creation-sprites-1.png",
      alt: "Création des sprites — 1",
    },
    "w3-s3-creation-sprites-2": {
      path: "world-3/w3-s3-creation-sprites-2.png",
      alt: "Création des sprites — 2",
    },
    "w3-s3-creation-sprites-3": {
      path: "world-3/w3-s3-creation-sprites-3.png",
      alt: "Création des sprites — 3",
    },
    "w3-s4-integration-organization": {
      path: "world-3/w3-s4-integration-organization.png",
      alt: "Integration & Organization",
    },
    "w3-s5-creation-environnement": {
      path: "world-3/w3-s5-creation-environnement.png",
      alt: "Création d'environnement",
    },
    "w3-s6-creation-personnages": {
      path: "world-3/w3-s6-creation-personnages.png",
      alt: "Création des Personnages",
    },
    "w3-s7-programmation-blueprint-part-1": {
      path: "world-3/w3-s7-programmation-blueprint-part-1.png",
      alt: "Programmation Blueprint — Système de locomotion — Part 1",
    },
    "w3-s8-programmation-blueprint-part-2": {
      path: "world-3/w3-s8-programmation-blueprint-part-2.png",
      alt: "Programmation Blueprint — Système de locomotion — Part 2",
    },
    "w3-s9-programmation-blueprint-part-3": {
      path: "world-3/w3-s9-programmation-blueprint-part-3.png",
      alt: "Programmation Blueprint — Système des dégâts — Part 1",
    },
    "w3-s10-programmation-blueprint-part-4": {
      path: "world-3/w3-s10-programmation-blueprint-part-4.png",
      alt: "Programmation Blueprint — Système des dégâts — Part 2",
    },
    "w3-s11-defis-navigation-part-1-1": {
      path: "world-3/w3-s11-defis-navigation-part-1-1.png",
      alt: "Programmation — Défis (Navigation inter-niveau) — Part 1",
    },
    "w3-s12-defis-navigation-part-2-1": {
      path: "world-3/w3-s12-defis-navigation-part-2-1.png",
      alt: "Programmation — Défis (Navigation inter-niveau) — Part 2",
    },
    "w3-s13-defis-navigation-part-3-1": {
      path: "world-3/w3-s13-defis-navigation-part-3-1.png",
      alt: "Programmation — Défis (Navigation inter-niveau) — Part 3",
    },
    "w3-s14-defis-navigation-part-4-1": {
      path: "world-3/w3-s14-defis-navigation-part-4-1.png",
      alt: "Programmation — Défis (Navigation inter-niveau) — Part 4",
    },
    "w4-s1-gameplay-demo": {
      path: "world-4/w4-s1-gameplay-demo.gif",
      alt: "HELL-o gameplay demo",
    },
    "w4-s2-choix-synths-creation-melodies": {
      path: "world-4/w4-s2-choix-synths-creation-melodies.png",
      alt: "Choix des Synths et Création des Mélodies",
    },
    "w4-s3-effet-pixelisation": {
      path: "world-4/w4-s3-effet-pixelisation.png",
      alt: "Effet de pixelisation",
    },
  };

  function mediaUrl(mediaId) {
    const spec = MEDIA_FILES[mediaId];
    if (!spec) return null;
    return `${MEDIA_BASE}/${spec.path}`;
  }

  function slideScreen(world, slideTitle, bodyChildren = [], options = {}) {
    const headerClass = options.intro ? "slideHeader slideHeader--intro" : "slideHeader";
    const panelChildren = [
      h("header", { class: headerClass }, [
        h("p", { class: "slideHeader__world", text: worldLabel(world) }),
        h("h2", { class: "slideHeader__title", text: slideTitle }),
      ]),
    ];
    if (bodyChildren.length > 0) {
      panelChildren.push(h("div", { class: "slideBody" }, bodyChildren));
    }
    return h("div", { class: "screen" }, [h("div", { class: "panel" }, panelChildren)]);
  }

  function imageFrame(label, mediaId, placeholderText) {
    const spec = mediaId ? MEDIA_FILES[mediaId] : null;
    const src = mediaUrl(mediaId);
    const art = h("div", { class: "frame__art" });

    if (spec && src) {
      const hint = h("div", { class: "frame__missing" }, [
        document.createTextNode("Missing file — add to "),
        h("code", { text: `media/${spec.path}` }),
      ]);
      const img = h("img", {
        class: "frame__img",
        src,
        alt: spec.alt || label,
        loading: "lazy",
        decoding: "async",
      });
      img.addEventListener("error", () => {
        art.classList.add("is-missing");
        img.remove();
        if (!art.querySelector(".frame__missing")) art.append(hint);
      });
      img.addEventListener("load", () => {
        art.classList.remove("is-missing");
        const missing = art.querySelector(".frame__missing");
        if (missing) missing.remove();
      });
      art.append(img);
    } else {
      art.textContent = placeholderText || "Placeholder image";
    }

    return h("div", { class: "frame frame--tall" }, [
      h("div", { class: "frame__label", text: label }),
      art,
    ]);
  }

  function devChoiceIcon(mediaId) {
    const spec = MEDIA_FILES[mediaId];
    const src = mediaUrl(mediaId);
    const box = h("div", { class: "devChoiceRow__icon" });

    if (spec && src) {
      const img = h("img", {
        class: "devChoiceRow__img",
        src,
        alt: spec.alt || "",
        loading: "lazy",
        decoding: "async",
      });
      img.addEventListener("error", () => {
        box.classList.add("is-missing");
        img.remove();
      });
      box.append(img);
    }

    return box;
  }

  function devChoiceRow(iconIds, text) {
    const ids = Array.isArray(iconIds) ? iconIds : [iconIds];
    return h("div", { class: "devChoiceRow" }, [
      h("div", { class: "devChoiceRow__text", text }),
      h("div", { class: "devChoiceRow__icons" }, ids.map((id) => devChoiceIcon(id))),
    ]);
  }

  function bigShotMedia(mediaId, placeholderText) {
    const spec = mediaId ? MEDIA_FILES[mediaId] : null;
    const src = mediaUrl(mediaId);
    const box = h("div", { class: "bigShot" });

    if (spec && src) {
      const hint = h("div", { class: "bigShot__missing" }, [
        document.createTextNode("Missing file — add to "),
        h("code", { text: `media/${spec.path}` }),
      ]);
      const img = h("img", {
        class: "bigShot__img",
        src,
        alt: spec.alt || "Media",
        loading: "lazy",
        decoding: "async",
      });
      img.addEventListener("error", () => {
        box.classList.add("is-missing");
        img.remove();
        if (!box.querySelector(".bigShot__missing")) box.append(hint);
      });
      img.addEventListener("load", () => {
        box.classList.remove("is-missing");
        const missing = box.querySelector(".bigShot__missing");
        if (missing) missing.remove();
      });
      box.append(img);
    } else {
      box.textContent = placeholderText || "Media placeholder";
    }

    return box;
  }

  function bulletList(items, className = "list") {
    return h("ul", { class: className }, items.map((label) =>
      h("li", {}, [h("span", { class: "bullet" }, []), h("span", { text: label })])
    ));
  }

  function getSlidesForWorld(world) {
    if (world === 2) return world1Slides;
    if (world === 3) return world2Slides;
    if (world === 4) return world3Slides;
    if (world === 5) return world4Slides;
    if (world === 6) return world5Slides;
    if (world === 7) return world6Slides;
    return [];
  }

  const world1Slides = [
    {
      title: "STRATÉGIE",
      render: () => slideScreen(2, "STRATÉGIE", [], { intro: true }),
    },
    {
      title: "Mon défi personnel",
      render: () =>
        slideScreen(2, "Mon défi personnel", [
          h("div", { class: "mediaPair" }, [
            imageFrame("Jeu réaliste — 2024", "w1-s2-jeu-realiste-2024"),
            imageFrame("HELL-o — 2025", "w1-s2-hello-2025"),
          ]),
          h("p", {
            class: "mediaPair__caption",
            text: "Du ultra-réalisme au pixel art, tester mes limites créatives.",
          }),
        ]),
    },
    {
      title: "Analyse des références",
      render: () =>
        slideScreen(2, "Analyse des références", [
          h("div", { class: "mediaPair" }, [
            h("div", { class: "refCard" }, [
              imageFrame("Hollow Knight", "w1-s3-hollow-knight"),
              h("div", { class: "refCard__bullets" }, [
                bulletList([
                  "Level design",
                  "Progression non linénaire",
                ]),
              ]),
            ]),
            h("div", { class: "refCard" }, [
              imageFrame("Metal Slug", "w1-s3-metal-slug"),
              h("div", { class: "refCard__bullets" }, [
                bulletList([
                  "Game feel & feedback visuel",
                  "Style d'animation et impact frame",
                ]),
              ]),
            ]),
          ]),
        ]),
    },
    {
      title: "Qu'est ce que c'est HELL-o?",
      render: () =>
        slideScreen(2, "Qu'est ce que c'est HELL-o?", [
          h("div", { class: "grid2 grid2--media" }, [
            imageFrame("HELL-o", "w1-s4-hell-o"),
            bulletList([
              "Un jeu pixel art.",
              "platformer 2.5D",
              "Focus sur le Gameplay",
            ]),
          ]),
        ]),
    },
  ];

  const world2Slides = [
    {
      title: "CONCEPTION",
      render: () => slideScreen(3, "CONCEPTION", [], { intro: true }),
    },
    {
      title: "Moodboard: personnages, environnement & style",
      render: () =>
        slideScreen(3, "Moodboard: personnages, environnement & style", [
          h("div", { class: "mediaTriple" }, [
            imageFrame("Personnages", "w2-s2-moodboard-characters"),
            imageFrame("Environnement", "w2-s2-moodboard-environment"),
            imageFrame("Style", "w2-s2-moodboard-style"),
          ]),
        ]),
    },
    {
      title: "Map design",
      render: () =>
        slideScreen(3, "Map design", [
          h("div", { class: "slideMediaSingle slideMediaSingle--map" }, [
            imageFrame("Map design", "w2-s3-map-design"),
          ]),
        ]),
    },
    {
      title: "Game Design Document",
      render: () =>
        slideScreen(3, "Game Design Document", [
          h("div", { class: "mediaPair mediaPair--docs" }, [
            imageFrame("GDD — 1", "w2-s4-gdd-1"),
            imageFrame("GDD — 2", "w2-s4-gdd-2"),
          ]),
        ]),
    },
  ];

  const world3Slides = [
    {
      title: "PILOTAGE",
      render: () => slideScreen(4, "PILOTAGE", [], { intro: true }),
    },
    {
      title: "Choix Dev",
      render: () =>
        slideScreen(4, "Choix Dev", [
          h("div", { class: "devChoiceList" }, [
            devChoiceRow("w3-s2-icon-unreal-engine", "Moteur de jeu: Unreal Engine"),
            devChoiceRow("w3-s2-icon-blueprints", "Langage de programmation: Blueprints (C++)"),
            devChoiceRow("w3-s2-icon-libresprite", "Logiciel d'animation: LibreSprite"),
            devChoiceRow(
              ["w3-s2-icon-photoshop", "w3-s2-icon-fl-studio"],
              "Autre Logiciels: Photoshop, Fl studio"
            ),
          ]),
        ]),
    },
    {
      title: "Création des Sprites",
      render: () =>
        slideScreen(4, "Création des Sprites", [
          h("div", { class: "mediaTriple" }, [
            imageFrame("Sprite 1", "w3-s3-creation-sprites-1"),
            imageFrame("Sprite 2", "w3-s3-creation-sprites-2"),
            imageFrame("Sprite 3", "w3-s3-creation-sprites-3"),
          ]),
        ]),
    },
    {
      title: "Integration & Organization",
      render: () =>
        slideScreen(4, "Integration & Organization", [
          h("div", { class: "slideMediaSingle slideMediaSingle--map" }, [
            imageFrame("Integration & Organization", "w3-s4-integration-organization"),
          ]),
        ]),
    },
    {
      title: "Création d'environnement",
      render: () =>
        slideScreen(4, "Création d'environnement", [
          h("div", { class: "slideMediaSingle slideMediaSingle--map" }, [
            imageFrame("Création d'environnement", "w3-s5-creation-environnement"),
          ]),
        ]),
    },
    {
      title: "Création des Personnages",
      render: () =>
        slideScreen(4, "Création des Personnages", [
          h("div", { class: "slideMediaSingle slideMediaSingle--map" }, [
            imageFrame("Création des Personnages", "w3-s6-creation-personnages"),
          ]),
        ]),
    },
    {
      title: "Programmation Blueprint — Système de locomotion — Part 1",
      render: () =>
        slideScreen(4, "Programmation Blueprint — Système de locomotion — Part 1", [
          h("div", { class: "slideMediaSingle slideMediaSingle--map" }, [
            imageFrame("Programmation Blueprint — Système de locomotion — Part 1", "w3-s7-programmation-blueprint-part-1"),
          ]),
        ]),
    },
    {
      title: "Programmation Blueprint — Système de locomotion — Part 2",
      render: () =>
        slideScreen(4, "Programmation Blueprint — Système de locomotion — Part 2", [
          h("div", { class: "slideMediaSingle slideMediaSingle--map" }, [
            imageFrame("Programmation Blueprint — Système de locomotion — Part 2", "w3-s8-programmation-blueprint-part-2"),
          ]),
        ]),
    },
    {
      title: "Programmation Blueprint — Système des dégâts — Part 1",
      render: () =>
        slideScreen(4, "Programmation Blueprint — Système des dégâts — Part 1", [
          h("div", { class: "slideMediaSingle slideMediaSingle--map" }, [
            imageFrame("Programmation Blueprint — Système des dégâts — Part 1", "w3-s9-programmation-blueprint-part-3"),
          ]),
        ]),
    },
    {
      title: "Programmation Blueprint — Système des dégâts — Part 2",
      render: () =>
        slideScreen(4, "Programmation Blueprint — Système des dégâts — Part 2", [
          h("div", { class: "slideMediaSingle slideMediaSingle--map" }, [
            imageFrame("Programmation Blueprint — Système des dégâts — Part 2", "w3-s10-programmation-blueprint-part-4"),
          ]),
        ]),
    },
    {
      title: "Programmation — Défis (Navigation inter-niveau) — Part 1",
      render: () =>
        slideScreen(4, "Programmation — Défis (Navigation inter-niveau) — Part 1", [
          h("div", { class: "slideMediaSingle slideMediaSingle--map" }, [
            imageFrame("Programmation — Défis (Navigation inter-niveau) — Part 1", "w3-s11-defis-navigation-part-1-1"),
          ]),
        ]),
    },
    {
      title: "Programmation — Défis (Navigation inter-niveau) — Part 2",
      render: () =>
        slideScreen(4, "Programmation — Défis (Navigation inter-niveau) — Part 2", [
          h("div", { class: "slideMediaSingle slideMediaSingle--map" }, [
            imageFrame("Programmation — Défis (Navigation inter-niveau) — Part 2", "w3-s12-defis-navigation-part-2-1"),
          ]),
        ]),
    },
    {
      title: "Programmation — Défis (Navigation inter-niveau) — Part 3",
      render: () =>
        slideScreen(4, "Programmation — Défis (Navigation inter-niveau) — Part 3", [
          h("div", { class: "slideMediaSingle slideMediaSingle--map" }, [
            imageFrame("Programmation — Défis (Navigation inter-niveau) — Part 3", "w3-s13-defis-navigation-part-3-1"),
          ]),
        ]),
    },
    {
      title: "Programmation — Défis (Navigation inter-niveau) — Part 4",
      render: () =>
        slideScreen(4, "Programmation — Défis (Navigation inter-niveau) — Part 4", [
          h("div", { class: "slideMediaSingle slideMediaSingle--map" }, [
            imageFrame("Programmation — Défis (Navigation inter-niveau) — Part 4", "w3-s14-defis-navigation-part-4-1"),
          ]),
        ]),
    },
  ];

  const world4Slides = [
    {
      title: "UNIVERS SONORE",
      render: () => slideScreen(5, "UNIVERS SONORE", [], { intro: true }),
    },
    {
      title: "Choix des Synths et Création des Mélodies",
      render: () =>
        slideScreen(5, "Choix des Synths et Création des Mélodies", [
          h("div", { class: "slideMediaSingle slideMediaSingle--map" }, [
            imageFrame("Choix des Synths et Création des Mélodies", "w4-s2-choix-synths-creation-melodies"),
          ]),
        ]),
    },
    {
      title: "Effet de pixelisation",
      render: () =>
        slideScreen(5, "Effet de pixelisation", [
          h("div", { class: "slideMediaSingle slideMediaSingle--map" }, [
            imageFrame("Effet de pixelisation", "w4-s3-effet-pixelisation"),
          ]),
        ]),
    },
  ];

  const world5Slides = [
    {
      title: "Responsabilité & RSE",
      render: () =>
        slideScreen(6, "Responsabilité & RSE", [
          h("div", { class: "iconList" }, [
            h("div", { class: "iconRow" }, [
              h("div", { class: "iconRow__icon", text: "♿" }),
              h("div", { text: "Accessibilité & inclusion (UX/UI)" }),
            ]),
            h("div", { class: "iconRow" }, [
              h("div", { class: "iconRow__icon", text: "⚖" }),
              h("div", { text: "Éthique, données & responsabilité" }),
            ]),
            h("div", { class: "iconRow" }, [
              h("div", { class: "iconRow__icon", text: "🌑" }),
              h("div", { text: "Sobriété numérique (perf, taille, usage)" }),
            ]),
          ]),
        ]),
    },
  ];

  const world6Slides = [
    {
      title: "GAME OVER",
      render: () =>
        slideScreen(7, "GAME OVER", [
          h("div", { class: "gameOver" }, [
            h("div", { class: "scoreGrid" }, [
              h("div", { class: "score" }, [
                h("div", { class: "score__k", text: "RUN TIME" }),
                h("div", { class: "score__v", text: "40:00" }),
              ]),
              h("div", { class: "score" }, [
                h("div", { class: "score__k", text: "WORLDS CLEARED" }),
                h("div", { class: "score__v", text: "6/6" }),
              ]),
              h("div", { class: "score" }, [
                h("div", { class: "score__k", text: "KEY TAKEAWAYS" }),
                h("div", { class: "score__v", text: "—" }),
              ]),
              h("div", { class: "score" }, [
                h("div", { class: "score__k", text: "Q&A" }),
                h("div", { class: "score__v", text: "READY" }),
              ]),
            ]),
            h("p", { class: "subtitle", text: "Merci — questions ?" }),
          ]),
        ]),
    },
  ];

  function renderBootScreen() {
    app.replaceChildren(
      h("div", { class: "screen boot" }, [
        h("div", { class: "boot__stack" }, [
          h("div", { class: "boot__canvasWrap" }, [
            h("canvas", { id: "logoCanvas", width: "320", height: "140" }, []),
          ]),
          h("div", { class: "boot__pressRow", id: "bootPressRow", style: "display: none" }, []),
        ]),
        h("div", { class: "boot__status" }, [
          document.createTextNode("CRT POWER-ON SEQUENCE"),
          h("span", { class: "blink", text: " ▮" }),
          h("div", { class: "boot__status", id: "bootStatus", text: "..." }),
        ]),
      ])
    );

    const canvas = document.getElementById("logoCanvas");
    if (!(canvas instanceof HTMLCanvasElement)) return;
    void runBootSequence(canvas);
  }

  /** Low-res pixel buffer size (logo + noise wipe share this grid). */
  const BOOT_BW = 192;
  const BOOT_BH = 84;

  function makeLogoBitmap(width, height) {
    const off = document.createElement("canvas");
    off.width = width;
    off.height = height;
    const ctx = off.getContext("2d");
    if (!ctx) return null;

    ctx.imageSmoothingEnabled = false;

    const g = ctx.createLinearGradient(0, 0, 0, height);
    g.addColorStop(0, "#1a080c");
    g.addColorStop(1, "#050203");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, width, height);

    const cx = Math.floor(width * 0.5);
    const cy = Math.floor(height * 0.52);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const label = "HELL-o";

    // Fit the label within the pixel buffer so it never clips.
    // (Font rendering varies slightly between browsers/platforms.)
    const maxLabelWidth = Math.floor(width * 0.86);
    let fontPx = Math.max(10, Math.floor(height * 0.46));
    for (let i = 0; i < 18; i++) {
      ctx.font = `900 ${fontPx}px "Press Start 2P", monospace`;
      const w = ctx.measureText(label).width;
      if (w <= maxLabelWidth) break;
      fontPx = Math.max(10, fontPx - 1);
    }
    // Chunky pixel-game outline: dark → hot red → bone fill
    const outline = [
      [-2, 0],
      [2, 0],
      [0, -2],
      [0, 2],
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1],
    ];
    ctx.fillStyle = "#1a0506";
    for (const [ox, oy] of outline) ctx.fillText(label, cx + ox, cy + oy);
    ctx.fillStyle = "rgba(255,58,58,0.92)";
    for (const [ox, oy] of [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ])
      ctx.fillText(label, cx + ox, cy + oy);
    ctx.fillStyle = "rgba(255,181,97,0.35)";
    ctx.fillText(label, cx, cy - 1);
    ctx.fillStyle = "#fff1df";
    ctx.fillText(label, cx, cy);

    // Ember underline (two-line pixel bar)
    const bx = Math.floor(width * 0.14);
    const bwBar = Math.floor(width * 0.72);
    const by = Math.floor(height * 0.82);
    ctx.fillStyle = "rgba(255,58,58,0.95)";
    ctx.fillRect(bx, by, bwBar, 2);
    ctx.fillStyle = "rgba(255,122,47,0.65)";
    ctx.fillRect(bx, by + 2, bwBar, 1);

    return quantizeLogoToPixelArt(ctx.getImageData(0, 0, width, height));
  }

  /**
   * Snap anti-aliased canvas text to a small HELL-o palette so revealed rows read as crisp letters.
   */
  function quantizeLogoToPixelArt(img) {
    const d = img.data;
    const BG = [0, 0, 0];
    const palette = [
      [0, 0, 0], // black
      [255, 58, 58], // hot red
      [255, 241, 223], // bone
      [255, 255, 255], // pure white
    ];
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i];
      const g = d[i + 1];
      const b = d[i + 2];
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      if (lum < 50) {
        d[i] = BG[0];
        d[i + 1] = BG[1];
        d[i + 2] = BG[2];
        d[i + 3] = 255;
        continue;
      }
      let best = palette[0];
      let bestD = 1e9;
      for (const c of palette) {
        const dr = r - c[0];
        const dg = g - c[1];
        const db = b - c[2];
        const dist = dr * dr + dg * dg + db * db;
        if (dist < bestD) {
          bestD = dist;
          best = c;
        }
      }
      d[i] = best[0];
      d[i + 1] = best[1];
      d[i + 2] = best[2];
      d[i + 3] = 255;
    }
    return img;
  }

  /** Discrete TV-static palette: black, grays, white, red-orange (no animation — position only). */
  const BOOT_SCRAMBLE_PALETTE = [
    [0, 0, 0],
    [34, 32, 32],
    [110, 106, 104],
    [175, 172, 168],
    [228, 226, 222],
    [255, 255, 255],
    [255, 58, 58],
    [255, 95, 42],
    [220, 48, 38],
    [180, 36, 32],
  ];

  /**
   * Frozen random grid per cell (x, y). Does not use frame — avoids shimmer that reads as motion.
   */
  function staticScrambleAt(x, y) {
    let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ 1442695041;
    h = Math.imul(h ^ (h >>> 15), 2246822519);
    h ^= h >>> 13;
    h = Math.imul(h, 3266489917);
    h ^= h >>> 16;
    h >>>= 0;
    const c = BOOT_SCRAMBLE_PALETTE[h % BOOT_SCRAMBLE_PALETTE.length];
    return [c[0], c[1], c[2], 255];
  }

  function smoothstep01(t) {
    const x = Math.min(1, Math.max(0, t));
    return x * x * (3 - 2 * x);
  }

  function pixelStagger01(x, y) {
    let h = Math.imul(x, 1540483477) ^ Math.imul(y, 2654435761);
    h ^= h >>> 16;
    h = Math.imul(h, 2246822507);
    h ^= h >>> 13;
    h >>>= 0;
    return (h % 977) / 976;
  }

  function stopBootLogoLoop() {
    state.bootLogoLoopRunning = false;
    cancelAnimationFrame(state.bootLogoRafId);
    state.bootLogoRafId = 0;
  }

  /**
   * Boot logo: loop scramble → pixels resolve into HELL-o → hold → unscramble → repeat.
   */
  function startBootPixelAssembleLoop(canvas) {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    stopBootLogoLoop();

    const w = canvas.width;
    const h = canvas.height;
    ctx.imageSmoothingEnabled = false;

    const bw = BOOT_BW;
    const bh = BOOT_BH;
    const logo = makeLogoBitmap(bw, bh);
    if (!logo) return;

    const SCRAMBLE_HOLD_MS = 400;
    const ASSEMBLE_MS = 2100;
    const LOGO_HOLD_MS = 2800;
    const DISASSEMBLE_MS = 1700;
    const CYCLE_MS = SCRAMBLE_HOLD_MS + ASSEMBLE_MS + LOGO_HOLD_MS + DISASSEMBLE_MS;

    const scramble = new Uint8ClampedArray(bw * bh * 4);
    const stagger = new Float32Array(bw * bh);
    for (let y = 0; y < bh; y++) {
      for (let x = 0; x < bw; x++) {
        const di = (y * bw + x) * 4;
        const idx = y * bw + x;
        const [r, gch, b, a] = staticScrambleAt(x, y);
        scramble[di] = r;
        scramble[di + 1] = gch;
        scramble[di + 2] = b;
        scramble[di + 3] = a;
        stagger[idx] = pixelStagger01(x, y) * 0.9;
      }
    }

    const out = new Uint8ClampedArray(bw * bh * 4);
    const outImg = new ImageData(out, bw, bh);

    const tmp = document.createElement("canvas");
    tmp.width = bw;
    tmp.height = bh;
    const tctx = tmp.getContext("2d");
    if (!tctx) return;
    tctx.imageSmoothingEnabled = false;

    const t0 = SCRAMBLE_HOLD_MS;
    const t1 = t0 + ASSEMBLE_MS;
    const t2 = t1 + LOGO_HOLD_MS;

    const loopStart = now();
    state.bootLogoLoopRunning = true;

    function tickFrame() {
      if (!state.bootLogoLoopRunning) return;

      const cy = (now() - loopStart) % CYCLE_MS;
      let u = 0;
      if (cy < t0) u = 0;
      else if (cy < t1) u = smoothstep01((cy - t0) / ASSEMBLE_MS);
      else if (cy < t2) u = 1;
      else u = 1 - smoothstep01((cy - t2) / DISASSEMBLE_MS);

      const lg = logo.data;
      for (let y = 0; y < bh; y++) {
        for (let x = 0; x < bw; x++) {
          const di = (y * bw + x) * 4;
          const idx = y * bw + x;
          const st = stagger[idx];
          const denom = 1 - st + 1e-6;
          const local = Math.min(1, Math.max(0, (u - st) / denom));
          const k = smoothstep01(local);

          const sr = scramble[di];
          const sg = scramble[di + 1];
          const sb = scramble[di + 2];
          const lr = lg[di];
          const lgch = lg[di + 1];
          const lb = lg[di + 2];

          out[di] = Math.round(sr + (lr - sr) * k);
          out[di + 1] = Math.round(sg + (lgch - sg) * k);
          out[di + 2] = Math.round(sb + (lb - sb) * k);
          out[di + 3] = 255;
        }
      }

      outImg.data.set(out);
      tctx.putImageData(outImg, 0, 0);
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(tmp, 0, 0, bw, bh, 0, 0, w, h);

      if (state.bootLogoLoopRunning) state.bootLogoRafId = requestAnimationFrame(tickFrame);
    }

    state.bootLogoRafId = requestAnimationFrame(tickFrame);
  }

  async function runBootSequence(canvas) {
    const status = document.getElementById("bootStatus");
    const pressRow = document.getElementById("bootPressRow");
    if (!(status instanceof HTMLElement)) return;

    // HUD hidden during boot; timer not running.
    hud.classList.add("is-hidden");
    slideBeacon.classList.add("is-hidden");
    deckCounter.classList.add("is-hidden");
    hudKeys.textContent = "Press Enter";
    state.pressStartArmed = false;
    if (pressRow instanceof HTMLElement) {
      pressRow.style.display = "none";
      pressRow.replaceChildren();
    }

    power.classList.add("is-off");
    status.textContent = "Powering on...";

    // Simulate CRT: off → flash → on
    await new Promise((r) => setTimeout(r, 140));
    power.classList.add("is-on");
    await new Promise((r) => setTimeout(r, 260));

    status.textContent = "Syncing scanlines...";
    document.body.classList.add("is-flickering");
    await new Promise((r) => setTimeout(r, 260));
    document.body.classList.remove("is-flickering");

    if (document.fonts && document.fonts.ready) {
      try {
        await document.fonts.load(`900 ${Math.max(10, Math.floor(BOOT_BH * 0.46))}px "Press Start 2P"`);
      } catch (_) {
        /* ignore */
      }
      await document.fonts.ready;
    }

    // Auto-play looping pixel assemble / disassemble on the logo canvas.
    status.textContent = "Warming up...";
    await new Promise((r) => setTimeout(r, 120));
    status.textContent = "Tuning signal...";
    startBootPixelAssembleLoop(canvas);

    await new Promise((r) => setTimeout(r, 900));

    status.textContent = "";
    if (pressRow instanceof HTMLElement) {
      pressRow.replaceChildren(
        document.createTextNode("PRESS START "),
        h("span", { class: "blink", text: "▮" })
      );
      pressRow.style.display = "block";
    }
    state.pressStartArmed = true;
  }

  function renderWorld(world) {
    updateDeckChrome();

    const titleHints = h("div", { class: "hint hint--titleNav" }, [
      document.createTextNode("Navigation: "),
      h("kbd", { text: "←" }),
      document.createTextNode(" "),
      h("kbd", { text: "→" }),
      document.createTextNode(" "),
      h("kbd", { text: "Enter" }),
    ]);

    if (world === 0) {
      app.replaceChildren(
        h("div", { class: "screen screen--title" }, [
          h("div", { class: "panel panel--title" }, [
            h("div", { class: "titleArt" }, [
              h("h1", { class: "gameTitle", text: deckInfo.thesisTitle }),
              h("div", { class: "titleArt__sub", text: "Press Enter" }),
            ]),
            h("div", { class: "titleMeta" }, [
              h("div", { class: "titleEncadre__label", text: deckInfo.presentedHeading }),
              h("div", { class: "titleMeta__line", text: deckInfo.name }),
              h("div", {
                class: "titleMeta__line",
                text: `${deckInfo.rncp} — ${deckInfo.track}`,
              }),
              h("div", { class: "titleMeta__line", text: deckInfo.school }),
            ]),
            h("div", { class: "titleEncadre" }, [
              h("div", { class: "titleEncadre__label", text: deckInfo.supervisorsHeading }),
              ...deckInfo.supervisors.map((n) =>
                h("div", { class: "titleEncadre__name", text: `► ${n}` })
              ),
            ]),
            titleHints,
          ]),
        ])
      );
      return;
    }

    if (world === 1) {
      const levels = [
        ["WORLD 1", "Stratégie"],
        ["WORLD 2", "Conception"],
        ["WORLD 3", "Pilotage"],
        ["WORLD 4", "Univers Sonore"],
        ["WORLD 5", "Responsabilité & RSE"],
        ["WORLD 6", "Bilan / Game Over"],
      ];
      const cards = levels.map(([n, t], i) => {
        const targetWorld = i + 2;
        const pickWorld = () => {
          void goToWorld(targetWorld);
        };
        return h(
          "div",
          {
            class: "levelCard",
            role: "button",
            tabindex: "0",
            "aria-label": `${n}: ${t}`,
            onclick: pickWorld,
            onkeydown: (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                pickWorld();
              }
            },
          },
          [
            h("div", { class: "levelCard__n", text: n }),
            h("div", { class: "levelCard__t", text: t }),
            h("div", { class: "levelCard__bar" }, [h("div", {}, [])]),
          ]
        );
      });

      app.replaceChildren(
        h("div", { class: "screen" }, [
          h("div", { class: "panel" }, [
            h("h2", { class: "title", text: "LEVEL SELECT" }),
            h("div", { class: "mapGrid" }, cards),
          ]),
        ])
      );
      return;
    }

    const slides = getSlidesForWorld(world);
    const maxSlide = Math.max(0, slides.length - 1);
    const slideIndex = Math.min(Math.max(0, state.slide), maxSlide);
    state.slide = slideIndex;

    const slide = slides[slideIndex];
    if (slide) {
      app.replaceChildren(slide.render());
      return;
    }

    app.replaceChildren(
      slideScreen(world, worldLabel(world), [
        h("p", { class: "subtitle", text: "Contenu à venir." }),
      ])
    );
  }

  function wipeTransition() {
    wipe.classList.remove("is-wiping");
    // Reflow
    void wipe.offsetHeight;
    wipe.classList.add("is-wiping");
    document.body.classList.add("is-flickering");
    window.setTimeout(() => document.body.classList.remove("is-flickering"), 520);
  }

  async function goToWorld(nextWorld, nextSlide = 0) {
    const clamped = Math.max(WORLD_MIN, Math.min(WORLD_MAX, nextWorld));
    const slides = slideCount(clamped);
    const targetSlide = slides > 0 ? Math.min(Math.max(0, nextSlide), slides - 1) : 0;
    if (clamped === state.world && targetSlide === state.slide) return;
    if (state.transitionLock) return;

    state.transitionLock = true;
    wipeTransition();
    await new Promise((r) => setTimeout(r, 180));
    state.world = clamped;
    state.slide = targetSlide;
    renderWorld(state.world);
    await new Promise((r) => setTimeout(r, 420));
    state.transitionLock = false;
  }

  async function goToSlide(nextSlide) {
    const slides = slideCount(state.world);
    if (slides === 0) return;
    const targetSlide = Math.min(Math.max(0, nextSlide), slides - 1);
    if (targetSlide === state.slide) return;
    if (state.transitionLock) return;

    state.transitionLock = true;
    wipeTransition();
    await new Promise((r) => setTimeout(r, 180));
    state.slide = targetSlide;
    renderWorld(state.world);
    await new Promise((r) => setTimeout(r, 420));
    state.transitionLock = false;
  }

  async function navigateNext() {
    const count = slideCount(state.world);
    if (count > 0 && state.slide < count - 1) {
      await goToSlide(state.slide + 1);
      return;
    }
    if (state.world < WORLD_MAX) {
      await goToWorld(state.world + 1, 0);
    }
  }

  async function navigatePrev() {
    if (state.slide > 0) {
      await goToSlide(state.slide - 1);
      return;
    }
    if (state.world > WORLD_MIN) {
      const prevWorld = state.world - 1;
      const lastSlide = Math.max(0, slideCount(prevWorld) - 1);
      await goToWorld(prevWorld, lastSlide);
    }
  }

  function handleKeydown(e) {
    const key = e.key;

    if (key === "Tab") return; // allow Alt+Tab, etc.

    // prevent page scroll / default behavior for navigation keys
    if (["ArrowLeft", "ArrowRight", "Enter", " "].includes(key)) e.preventDefault();

    if (!state.booted) {
      if (key === "Enter" && state.pressStartArmed) {
        stopBootLogoLoop();
        state.booted = true;
        hud.classList.remove("is-hidden");
        hudKeys.textContent = "← → / Enter";
        wipeTransition();
        setTimeout(() => {
          renderWorld(0);
        }, 180);
      }
      return;
    }

    if (key === "ArrowRight" || key === "Enter") {
      void navigateNext();
      return;
    }

    if (key === "ArrowLeft") {
      void navigatePrev();
      return;
    }
  }

  function init() {
    // Custom pixel-art cursor (small X) that follows pointer movement.
    const cursor = document.createElement("div");
    cursor.className = "pixelCursor";
    cursor.setAttribute("aria-hidden", "true");
    document.body.append(cursor);

    function moveCursor(e) {
      if (!(e instanceof PointerEvent)) return;
      if (e.pointerType === "touch") return;
      document.body.classList.add("has-pointer");
      cursor.style.left = `${e.clientX}px`;
      cursor.style.top = `${e.clientY}px`;
    }

    window.addEventListener("pointermove", moveCursor, { passive: true });
    window.addEventListener(
      "pointerleave",
      () => {
        document.body.classList.remove("has-pointer");
      },
      { passive: true }
    );

    renderBootScreen();
    window.addEventListener("keydown", handleKeydown, { passive: false });
  }

  init();
})();

