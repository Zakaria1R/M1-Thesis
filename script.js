/* eslint-disable no-console */
(() => {
  "use strict";

  const TOTAL_MINUTES = 40;
  const TOTAL_MS = TOTAL_MINUTES * 60 * 1000;
  const WORLD_MIN = 0;
  const WORLD_MAX = 6;

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
    1: { hud: "WORLD 1 — STRATÉGIE", bloc: "BLOC 1 — C1.1 → C1.5" },
    2: { hud: "WORLD 2 — CONCEPTION", bloc: "BLOC 2 — C2.1 → C2.6" },
    3: { hud: "WORLD 3 — PILOTAGE", bloc: "BLOC 3 — C3.1 → C3.4" },
    4: { hud: "WORLD 4 — GAME DESIGN & LIVE DEMO", bloc: "BLOC 4 — LIVE DEMO" },
    5: { hud: "WORLD 5 — RESPONSABILITÉ & RSE", bloc: "TRANSVERSAL — RSE" },
    6: { hud: "WORLD 6 — BILAN / GAME OVER", bloc: "FIN — MERCI" },
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
        h("div", { class: "boot__canvasWrap" }, [
          h("canvas", { id: "logoCanvas", width: "320", height: "140" }, []),
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

  function drawPixelLogoAssembly(canvas) {
    const ctx = canvas.getContext("2d");
    if (!ctx) return Promise.resolve();

    const w = canvas.width;
    const h = canvas.height;
    ctx.imageSmoothingEnabled = false;

    // "M1 THESIS" logo: precompute a simple pixel mask grid.
    const GRID = 40;
    const cell = Math.floor(w / GRID);
    const cols = Math.floor(w / cell);
    const rows = Math.floor(h / cell);

    // Background clear
    ctx.clearRect(0, 0, w, h);

    const textLines = ["M1", "THESIS"];
    const pixels = [];

    // Create a low-res offscreen to rasterize text into pixels.
    const off = document.createElement("canvas");
    off.width = cols;
    off.height = rows;
    const octx = off.getContext("2d");
    if (!octx) return;

    octx.clearRect(0, 0, cols, rows);
    octx.fillStyle = "#000";
    octx.fillRect(0, 0, cols, rows);

    octx.fillStyle = "#fff";
    octx.textAlign = "center";
    octx.textBaseline = "middle";
    octx.font = `bold ${Math.floor(rows * 0.38)}px "Press Start 2P", monospace`;

    octx.globalAlpha = 1;
    octx.fillText(textLines[0], Math.floor(cols * 0.5), Math.floor(rows * 0.38));
    octx.font = `bold ${Math.floor(rows * 0.22)}px "Press Start 2P", monospace`;
    octx.fillText(textLines[1], Math.floor(cols * 0.5), Math.floor(rows * 0.68));

    const img = octx.getImageData(0, 0, cols, rows).data;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const idx = (y * cols + x) * 4;
        const r = img[idx];
        if (r > 160) pixels.push({ x, y });
      }
    }

    // Shuffle so it assembles "pixel-by-pixel".
    for (let i = pixels.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pixels[i], pixels[j]] = [pixels[j], pixels[i]];
    }

    let drawn = 0;
    const perFrame = Math.max(12, Math.floor(pixels.length / 70));
    const start = now();

    function frame() {
      // CRT-ish fade-in background and glow.
      ctx.fillStyle = "rgba(0,0,0,0.28)";
      ctx.fillRect(0, 0, w, h);

      const t = Math.min(1, (now() - start) / 800);
      const glow = 0.35 + 0.25 * t;

      for (let k = 0; k < perFrame && drawn < pixels.length; k++, drawn++) {
        const p = pixels[drawn];
        const px = p.x * cell;
        const py = p.y * cell;

        ctx.fillStyle = `rgba(121,255,179,${glow})`;
        ctx.fillRect(px - 1, py - 1, cell + 2, cell + 2);
        ctx.fillStyle = "rgba(232,243,255,0.92)";
        ctx.fillRect(px, py, cell, cell);
      }

      if (drawn < pixels.length) requestAnimationFrame(frame);
      else finalize();
    }

    function finalize() {
      // subtle underline bar
      ctx.fillStyle = "rgba(121,255,179,0.55)";
      ctx.fillRect(Math.floor(w * 0.18), Math.floor(h * 0.84), Math.floor(w * 0.64), 3);
    }

    return new Promise((resolve) => {
      function finalize() {
        // subtle underline bar
        ctx.fillStyle = "rgba(92,240,255,0.55)";
        ctx.fillRect(Math.floor(w * 0.18), Math.floor(h * 0.84), Math.floor(w * 0.64), 3);
        resolve();
      }

      requestAnimationFrame(frame);
      // overwrite finalize closure used by frame()
      function frame() {
        // CRT-ish fade-in background and glow.
        ctx.fillStyle = "rgba(0,0,0,0.28)";
        ctx.fillRect(0, 0, w, h);

        const t = Math.min(1, (now() - start) / 800);
        const glow = 0.35 + 0.25 * t;

        for (let k = 0; k < perFrame && drawn < pixels.length; k++, drawn++) {
          const p = pixels[drawn];
          const px = p.x * cell;
          const py = p.y * cell;

          ctx.fillStyle = `rgba(92,240,255,${glow})`;
          ctx.fillRect(px - 1, py - 1, cell + 2, cell + 2);
          ctx.fillStyle = "rgba(238,244,255,0.92)";
          ctx.fillRect(px, py, cell, cell);
        }

        if (drawn < pixels.length) requestAnimationFrame(frame);
        else finalize();
      }
    });
  }

  async function runBootSequence(canvas) {
    const status = document.getElementById("bootStatus");
    if (!(status instanceof HTMLElement)) return;

    // HUD hidden during boot; timer not running.
    hud.classList.add("is-hidden");
    hudKeys.textContent = "Press Enter";
    state.pressStartArmed = false;

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

    status.textContent = "Assembling logo...";
    await drawPixelLogoAssembly(canvas);

    status.textContent = "PRESS START";
    state.pressStartArmed = true;
  }

  function renderWorld(world) {
    const title = worldMeta[world]?.hud ?? `WORLD ${world}`;
    setHudForWorld(world);

    const commonHints = h("div", { class: "hint" }, [
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
              h("div", { class: "titleArt__kicker", text: "MÉMOIRE / GAME TITLE" }),
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
            commonHints,
          ]),
        ])
      );
      return;
    }

    if (world === 4) {
      app.replaceChildren(
        h("div", { class: "screen" }, [
          h("h2", { class: "title", text: title }),
          h("p", {
            class: "subtitle",
            text: "Placeholder screen for a live Unreal Engine demo.",
          }),
          h("ul", { class: "list" }, [
            h("li", {}, [
              h("span", { text: "Open the Unreal game window" }),
              h("span", { class: "code", text: "Alt+Tab" }),
            ]),
            h("li", {}, [
              h("span", { text: "Run the prepared demo sequence" }),
              h("span", { class: "code", text: "LIVE" }),
            ]),
            h("li", {}, [
              h("span", { text: "Return here to continue the deck" }),
              h("span", { class: "code", text: "Alt+Tab" }),
            ]),
          ]),
          commonHints,
        ])
      );
      return;
    }

    if (world === 6) {
      app.replaceChildren(
        h("div", { class: "screen" }, [
          h("h2", { class: "title", text: "GAME OVER / MERCI" }),
          h("p", { class: "subtitle", text: "Bilan, questions, et suite." }),
          h("ul", { class: "list" }, [
            h("li", {}, [
              h("span", { text: "Key takeaways" }),
              h("span", { class: "code", text: "✓" }),
            ]),
            h("li", {}, [
              h("span", { text: "Open Q&A" }),
              h("span", { class: "code", text: "?" }),
            ]),
            h("li", {}, [
              h("span", { text: "Contact / links" }),
              h("span", { class: "code", text: "@" }),
            ]),
          ]),
          commonHints,
        ])
      );
      return;
    }

    const worldLists = {
      1: [
        "Contexte, objectifs, public & contraintes",
        "Veille, références, benchmarks",
        "Stratégie produit (vision, scope, risques)",
        "Pitch, planning macro, jalons",
        "Itérations & décisions (preuves)",
      ],
      2: [
        "Concept, intentions & promesse d'expérience",
        "Mécaniques, boucles, règles & balance",
        "UX flows, wireframes, prototypage",
        "Content/Level design & progression",
        "Documentation (GDD, specs, pipeline)",
        "Playtests, retours & ajustements",
      ],
      3: [
        "Pilotage: organisation, sprint/jalons",
        "Communication, feedback loops, reporting",
        "Qualité: risques, bugs, critères d'acceptation",
        "Livraison: build, démo, rétrospective",
      ],
      5: [
        "Responsabilité: impact & limites",
        "Accessibilité & inclusion (UX/UI)",
        "Éthique, données & sobriété numérique",
      ],
    };

    const listItems = (worldLists[world] || []).map((label) =>
      h("li", {}, [h("span", { class: "bullet" }, []), h("span", { text: label })])
    );

    app.replaceChildren(
      h("div", { class: "screen" }, [
        h("div", { class: "panel" }, [
          h("h2", { class: "title", text: title }),
          h("p", {
            class: "subtitle",
            text: "Placeholder bullets (à remplacer) — style HELL-o.",
          }),
          h("ul", { class: "list" }, listItems),
          commonHints,
        ]),
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
    renderBootScreen();
    setHudForWorld(0);
    tick();
    window.addEventListener("keydown", handleKeydown, { passive: false });
  }

  init();
})();

