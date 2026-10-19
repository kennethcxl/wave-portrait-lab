# Wave Portrait Lab

A browser-based studio that converts photos into interactive sine-wave portraits.

## Run locally

This is a static site with no build step, package installation, backend, or API key.

From this folder, run:

```sh
python3 -m http.server 8000
```

Open http://localhost:8000 in your browser. Using a local server ensures the sample image can be read for Canvas processing.

## Features

- Local photo uploads with the original aspect ratio preserved.
- Classic, Fine, and Bold starting looks.
- Line density, wave height, contrast, and weight controls.
- Eight ink-and-paper palettes and custom colors.
- Original-photo comparison, reveal animation, and hover focus.
- PNG export and standalone interactive HTML export.
- WebGL2 rendering with a Canvas 2D fallback.
- Full-height studio with a fixed footer and independently scrolling controls.

Keyboard shortcuts: **C** to compare, **R** to replay. The standalone HTML export supports **R** to replay.

Photos are processed in the browser. The application does not upload them to a server.

## Files

- `index.html` — studio interface and portrait renderer.
- `export.js` — standalone HTML export builder and player.
- `assets/ai-portrait.png` — original AI-generated sample portrait.

## Deploy

Serve the contents of this folder through any static host. For GitHub Pages, publish the repository root from your chosen branch.

### Vercel Web Analytics

`index.html` includes the Vercel Web Analytics script (`/_vercel/insights/script.js`) for static-site page-view tracking when hosted on Vercel.

After deploying to Vercel, enable **Web Analytics** for the project in the Vercel dashboard to start collecting data.

## HTML exports

Choose **Download HTML** in the studio to save a single offline file containing the selected settings, rendering code, and precomputed wave data. The exported player needs no external assets or network access. Color and hover settings can be edited in the embedded configuration; wave structure is precomputed from the chosen image and adjustments.

## Attribution and reuse

The effect is a study of the speaker portraits on [Cursor Compile New York](https://cursor.com/compile/new-york). The WebGL shader and luminance preprocessing were adapted from its public client-side implementation, inspected on 19 October 2026. Original rights are retained; reuse terms for that adapted rendering code have not been verified. This repository does not grant a new license for third-party code.

The sample portrait was generated for this project and replaces the original reference photo. The editor interface, controls, fallback wrapper, and export workflow were developed for this studio.
