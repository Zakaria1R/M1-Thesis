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
  };

  const deckInfo = {
    name: "Zakaria Rahmouni",
    thesisTitle: "HELL-o",
    rncp: "RNCP39855",
    track: "Parcours Game Design",
    school: "ITECOM Art Design",
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
    const fontPx = Math.max(10, Math.floor(height * 0.46));
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `900 ${fontPx}px "Press Start 2P", monospace`;

    const label = "HELL-o";
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

  function randInt(n) {
    return Math.floor(Math.random() * n);
  }

  function warmNoiseAt(i, frame) {
    const flick = ((i * 13 + frame * 9) & 255) / 255;
    // Red/white/black CRT snow (with slight flicker variance)
    const roll = (i * 1103515245 + frame * 12345) >>> 0;
    const r0 = roll & 255;
    if (r0 < 28) return [0, 0, 0, 255]; // occasional black pixels
    if (r0 < 160) {
      const w = 220 + Math.floor(35 * flick);
      return [w, w, w, 255]; // whites
    }
    const rr = 215 + randInt(40);
    const gg = 10 + randInt(25);
    const bb = 10 + randInt(25);
    return [rr, gg, bb, 255]; // reds
  }

  function seedNoiseBuffer(len) {
    const buf = new Uint8ClampedArray(len);
    for (let i = 0; i < len; i += 4) {
      const [r, g, b, a] = warmNoiseAt(i, 0);
      buf[i] = r;
      buf[i + 1] = g;
      buf[i + 2] = b;
      buf[i + 3] = a;
    }
    return buf;
  }

  function drawLowResToCanvas(canvas, imageDataBwBh) {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    ctx.imageSmoothingEnabled = false;
    const tmp = document.createElement("canvas");
    tmp.width = BOOT_BW;
    tmp.height = BOOT_BH;
    const tctx = tmp.getContext("2d");
    if (!tctx) return;
    tctx.putImageData(imageDataBwBh, 0, 0);
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(tmp, 0, 0, BOOT_BW, BOOT_BH, 0, 0, w, h);
  }

  /**
   * Logo bitmap is drawn underneath logically: each fully revealed row is copied verbatim from
   * the logo ImageData (no blending). Unrevealed rows = scrolling warm noise only.
   */
  function playScrambleBoot(canvas, durationMs = 2600) {
    const ctx = canvas.getContext("2d");
    if (!ctx) return Promise.resolve();

    const w = canvas.width;
    const h = canvas.height;
    ctx.imageSmoothingEnabled = false;

    const bw = BOOT_BW;
    const bh = BOOT_BH;
    const logo = makeLogoBitmap(bw, bh);
    if (!logo) return Promise.resolve();

    const noiseBase = seedNoiseBuffer(bw * bh * 4);
    const out = new Uint8ClampedArray(bw * bh * 4);
    const outImg = new ImageData(out, bw, bh);

    const tmp = document.createElement("canvas");
    tmp.width = bw;
    tmp.height = bh;
    const tctx = tmp.getContext("2d");
    if (!tctx) return Promise.resolve();
    tctx.imageSmoothingEnabled = false;

    let frame = 0;
    const start = now();

    return new Promise((resolve) => {
      function tickFrame() {
        const elapsed = now() - start;
        const t = Math.min(1, elapsed / durationMs);
        const ease = t * t * (3 - 2 * t);
        // Integer row count only: no fringe blend (that was smearing non-letter colors into glyphs).
        const revealRows = Math.min(bh, Math.ceil(ease * bh));

        const scroll = Math.floor(elapsed / 22);

        for (let y = 0; y < bh; y++) {
          for (let x = 0; x < bw; x++) {
            const di = (y * bw + x) * 4;
            if (y < revealRows) {
              out[di] = logo.data[di];
              out[di + 1] = logo.data[di + 1];
              out[di + 2] = logo.data[di + 2];
              out[di + 3] = 255;
            } else {
              const srcY = (y - scroll + bh * 64) % bh;
              const si = (srcY * bw + x) * 4;
              let r = noiseBase[si];
              let gch = noiseBase[si + 1];
              let b = noiseBase[si + 2];

              // Camouflage: seed the HELL-o pixels into the initial field,
              // but snap them into the same red/white/black noise palette so the word
              // is "already there" yet hard to read until the scan reveals rows.
              const lr = logo.data[di];
              const lg = logo.data[di + 1];
              const lb = logo.data[di + 2];
              const ll = 0.299 * lr + 0.587 * lg + 0.114 * lb;
              if (ll > 70) {
                const roll = ((x * 73856093) ^ (y * 19349663) ^ (frame * 83492791)) >>> 0;
                const p = roll & 255;
                if (p < 150) {
                  r = 245;
                  gch = 245;
                  b = 245;
                } else if (p < 230) {
                  r = 255;
                  gch = 58;
                  b = 58;
                } else {
                  r = 0;
                  gch = 0;
                  b = 0;
                }
              } else if ((x + y + frame) % 11 === 0) {
                const [nr, ng, nb] = warmNoiseAt(di, frame);
                r = nr;
                gch = ng;
                b = nb;
              }
              out[di] = r;
              out[di + 1] = gch;
              out[di + 2] = b;
              out[di + 3] = 255;
            }
          }
        }

        outImg.data.set(out);
        tctx.putImageData(outImg, 0, 0);
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(tmp, 0, 0, bw, bh, 0, 0, w, h);

        frame++;
        if (t < 1) requestAnimationFrame(tickFrame);
        else {
          out.set(logo.data);
          outImg.data.set(out);
          tctx.putImageData(outImg, 0, 0);
          ctx.fillStyle = "#000";
          ctx.fillRect(0, 0, w, h);
          ctx.drawImage(tmp, 0, 0, bw, bh, 0, 0, w, h);
          resolve();
        }
      }

      requestAnimationFrame(tickFrame);
    });
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

    // Auto-play scramble → unscramble → logo (no user input).
    status.textContent = "Warming up...";
    await new Promise((r) => setTimeout(r, 120));
    status.textContent = "Tuning signal...";
    await playScrambleBoot(canvas, 2600);

    const logoFinal = makeLogoBitmap(BOOT_BW, BOOT_BH);
    if (logoFinal) drawLowResToCanvas(canvas, logoFinal);

    await new Promise((r) => setTimeout(r, 1000));

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

    const titleHints = h("div", { class: "hint" }, [
      document.createTextNode("Navigation: "),
      h("kbd", { text: "←" }),
      document.createTextNode(" "),
      h("kbd", { text: "→" }),
      document.createTextNode(" "),
      h("kbd", { text: "Enter" }),
      document.createTextNode(" (no mouse)"),
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
              h("div", { class: "titleMeta__line", text: deckInfo.name }),
              h("div", {
                class: "titleMeta__line",
                text: `${deckInfo.rncp} — ${deckInfo.track}`,
              }),
              h("div", { class: "titleMeta__line", text: deckInfo.school }),
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
      const cards = levels.map(([n, t]) =>
        h("div", { class: "levelCard" }, [
          h("div", { class: "levelCard__n", text: n }),
          h("div", { class: "levelCard__t", text: t }),
          h("div", { class: "levelCard__bar" }, [h("div", {}, [])]),
        ])
      );

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

