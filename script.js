/* eslint-disable no-console */
(() => {
  "use strict";

  const TOTAL_MINUTES = 40;
  const TOTAL_MS = TOTAL_MINUTES * 60 * 1000;
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
  const hudBloc = document.getElementById("hudBloc");
  const hudTime = document.getElementById("hudTime");
  const hudBarFill = document.getElementById("hudBarFill");
  const hudKeys = document.getElementById("hudKeys");

  if (!app || !wipe || !power || !hud || !hudBloc || !hudTime || !hudBarFill || !hudKeys) {
    throw new Error("Missing required DOM nodes.");
  }

  const state = {
    world: 0,
    booted: false,
    pressStartArmed: false,
    deckStartedAt: null,
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
    5: { hud: "WORLD 4 — GAME DESIGN & LIVE DEMO", bloc: "BLOC 4 — LIVE DEMO" },
    6: { hud: "WORLD 5 — RESPONSABILITÉ & RSE", bloc: "TRANSVERSAL — RSE" },
    7: { hud: "WORLD 6 — BILAN / GAME OVER", bloc: "FIN — MERCI" },
  };

  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  function formatClock(ms) {
    const clamped = Math.max(0, ms);
    const totalSeconds = Math.floor(clamped / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${pad2(m)}:${pad2(s)}`;
  }

  function now() {
    return performance.now();
  }

  function setHudForWorld(world) {
    const meta = worldMeta[world] || { bloc: "—" };
    hudBloc.textContent = meta.bloc;
  }

  function startDeckTimerIfNeeded() {
    if (state.deckStartedAt != null) return;
    state.deckStartedAt = Date.now();
  }

  function updateHudTime() {
    const startedAt = state.deckStartedAt;
    const elapsed = startedAt == null ? 0 : Date.now() - startedAt;
    const ratio = Math.min(1, Math.max(0, elapsed / TOTAL_MS));
    hudBarFill.style.width = `${(ratio * 100).toFixed(2)}%`;
    hudTime.textContent = `${formatClock(elapsed)} / ${pad2(TOTAL_MINUTES)}:00`;
  }

  function tick() {
    updateHudTime();
    requestAnimationFrame(tick);
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
    const title = worldMeta[world]?.hud ?? `WORLD ${world}`;
    setHudForWorld(world);

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
        ["WORLD 4", "Game Design & Live Demo"],
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

    const logical = world - 1; // 1..6

    if (logical === 4) {
      app.replaceChildren(
        h("div", { class: "screen" }, [
          h("div", { class: "panel" }, [
            h("h2", { class: "title", text: title }),
            h("div", { class: "bigShot" }, [
              h("div", { text: "LARGE SCREENSHOT / VIDEO PLACEHOLDER\n(HELL-o gameplay / UE capture)" }),
            ]),
            h("p", { class: "subtitle", text: "Live demo: Alt+Tab to Unreal, run demo, Alt+Tab back." }),
          ]),
        ])
      );
      return;
    }

    if (logical === 6) {
      app.replaceChildren(
        h("div", { class: "screen" }, [
          h("div", { class: "panel" }, [
            h("div", { class: "gameOver" }, [
              h("h2", { class: "gameOver__title", text: "GAME OVER" }),
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
        ])
      );
      return;
    }

    const bulletList = (items) =>
      h("ul", { class: "list" }, items.map((label) => h("li", {}, [h("span", { class: "bullet" }, []), h("span", { text: label })])));

    if (logical === 1) {
      app.replaceChildren(
        h("div", { class: "screen" }, [
          h("div", { class: "panel" }, [
            h("h2", { class: "title", text: title }),
            h("div", { class: "grid2" }, [
              h("div", {}, [
                bulletList([
                  "Contexte, objectifs, public & contraintes",
                  "Veille, références, benchmarks",
                  "Stratégie produit (vision, scope, risques)",
                  "Pitch, planning macro, jalons",
                  "Itérations & décisions (preuves)",
                ]),
              ]),
              h("div", { class: "frame" }, [
                h("div", { class: "frame__label", text: "MOODBOARD / REFERENCES" }),
                h("div", { class: "frame__art", text: "Placeholder image grid\n(art direction, refs, palette)" }),
              ]),
            ]),
          ]),
        ])
      );
      return;
    }

    if (logical === 2) {
      app.replaceChildren(
        h("div", { class: "screen" }, [
          h("div", { class: "panel" }, [
            h("h2", { class: "title", text: title }),
            h("div", { class: "grid2" }, [
              h("div", {}, [
                bulletList([
                  "Concept, intentions & promesse d'expérience",
                  "Mécaniques, boucles, règles & balance",
                  "UX flows, wireframes, prototypage",
                  "Content/Level design & progression",
                  "Documentation (GDD, specs, pipeline)",
                  "Playtests, retours & ajustements",
                ]),
              ]),
              h("div", { class: "frame" }, [
                h("div", { class: "frame__label", text: "CONCEPT ART / SPRITE" }),
                h("div", { class: "frame__art", text: "Placeholder sprite / concept sheet\n(pixelated)" }),
              ]),
            ]),
          ]),
        ])
      );
      return;
    }

    if (logical === 3) {
      app.replaceChildren(
        h("div", { class: "screen" }, [
          h("div", { class: "panel" }, [
            h("h2", { class: "title", text: title }),
            h("div", { class: "timeline" }, [
              h("div", { class: "step" }, [
                h("div", { class: "step__dot" }, []),
                h("div", {}, [
                  h("div", { class: "step__title", text: "Phase 1 — Cadrage" }),
                  h("div", { class: "step__sub", text: "Scope, jalons, risques, critères d'acceptation." }),
                ]),
              ]),
              h("div", { class: "step" }, [
                h("div", { class: "step__dot" }, []),
                h("div", {}, [
                  h("div", { class: "step__title", text: "Phase 2 — Production" }),
                  h("div", { class: "step__sub", text: "Sprints, communication, playtests, bug triage." }),
                ]),
              ]),
              h("div", { class: "step" }, [
                h("div", { class: "step__dot" }, []),
                h("div", {}, [
                  h("div", { class: "step__title", text: "Phase 3 — Stabilisation" }),
                  h("div", { class: "step__sub", text: "Qualité, performance, polish, build & démo." }),
                ]),
              ]),
              h("div", { class: "step" }, [
                h("div", { class: "step__dot" }, []),
                h("div", {}, [
                  h("div", { class: "step__title", text: "Phase 4 — Livraison" }),
                  h("div", { class: "step__sub", text: "Présentation, documentation finale, rétrospective." }),
                ]),
              ]),
            ]),
          ]),
        ])
      );
      return;
    }

    if (logical === 5) {
      app.replaceChildren(
        h("div", { class: "screen" }, [
          h("div", { class: "panel" }, [
            h("h2", { class: "title", text: title }),
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
        ])
      );
      return;
    }

    app.replaceChildren(
      h("div", { class: "screen" }, [h("div", { class: "panel" }, [h("h2", { class: "title", text: title })])])
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

  async function goToWorld(nextWorld) {
    const clamped = Math.max(WORLD_MIN, Math.min(WORLD_MAX, nextWorld));
    if (clamped === state.world) return;
    if (state.transitionLock) return;

    state.transitionLock = true;
    wipeTransition();
    // Wait for wipe to cover enough, then swap content
    await new Promise((r) => setTimeout(r, 180));
    state.world = clamped;
    renderWorld(state.world);
    setHudForWorld(state.world);
    // Release after animation
    await new Promise((r) => setTimeout(r, 420));
    state.transitionLock = false;
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
        startDeckTimerIfNeeded();
        hud.classList.remove("is-hidden");
        hudKeys.textContent = "← → / Enter";
        wipeTransition();
        setTimeout(() => {
          renderWorld(0);
          setHudForWorld(0);
        }, 180);
      }
      return;
    }

    if (key === "ArrowRight" || key === "Enter") {
      void goToWorld(state.world + 1);
      return;
    }

    if (key === "ArrowLeft") {
      void goToWorld(state.world - 1);
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
    setHudForWorld(0);
    tick();
    window.addEventListener("keydown", handleKeydown, { passive: false });
  }

  init();
})();

