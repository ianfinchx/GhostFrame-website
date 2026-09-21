# GhostFrame Media — landing page

White-label video production for social media managers and agencies.
24 animated reels a month, delivered in under two weeks, under your brand.

## What this is

A single static page. Everything lives in [`index.html`](index.html) — markup,
styles and scripts are inline, with no build step and no framework. The only
external requests are Google Fonts (Inter Tight) and the Tailwind CDN.

```
index.html              the whole site
Brand Assets/           the images the page references
serve.mjs               local static server on :3000
screenshot.mjs          Puppeteer capture used while building the page
```

## Running it locally

Open `index.html` directly, or serve it:

```bash
node serve.mjs          # http://localhost:3000
```

`serve.mjs` and `screenshot.mjs` are development helpers only. They need
`npm install` (Puppeteer) and are not part of the deployed site.

## Deploying

The page is static, so any host works. For GitHub Pages: Settings → Pages →
deploy from `main`, folder `/ (root)`.

To point a custom domain at it, add a `CNAME` file at the repo root containing
the bare domain, then set the same domain under Settings → Pages.

## Interactions

Four effects are ported to vanilla JS from React components:

- **Spotlight cards** — a cursor-tracked light shared across the three
  how-it-works cards, using `background-attachment: fixed` so one light source
  crosses all of them.
- **Dock magnification** — the macOS cosine falloff, with icons easing toward
  their target scale each frame.
- **Custom pointer** — the GhostFrame mark replaces the native cursor inside
  `[data-pointer]` containers.
- **Particle field** — a canvas of drifting dots that lean toward the cursor.

All four respect `prefers-reduced-motion`, and the pointer also checks for a
fine pointer so it never runs on touch.

## Notes

- The margin chart in the problem section is illustrative, not client data.
- The portfolio calendar shows January 2026 because the 1st falls on a
  Thursday, which makes the 1st-to-11th delivery window read cleanly.
