# M1 Thesis Defense — Pixel Deck

Keyboard-only, full-screen, retro CRT/pixel-art presentation website (static HTML/CSS/JS). Deploy-ready for Vercel.

## Controls

- **Enter / →**: next World
- **←**: previous World
- **No mouse**: the cursor is hidden and there are no menus

## Local run

Any static server works. For example:

```bash
python -m http.server 5173
```

Then open `http://localhost:5173`.

## Media (images & GIFs)

Add files under `media/` using the **exact filenames** listed in [`media/MEDIA.md`](media/MEDIA.md). They are served as static assets so every visitor sees them after deploy.

## Deploy (Vercel)

Import the GitHub repo in Vercel and keep:

- **Framework Preset**: Other (static)
- **Root Directory**: `/`
- **Build Command**: *(empty)*
- **Output Directory**: *(empty / default)*

