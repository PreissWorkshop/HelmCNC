# HelmCNC — helmcnc.com

The marketing homepage for **HelmCNC**, a paid standalone Windows control frontend for
Dynomotion KFLOP / Kogna CNC controllers.

Built as a plain static site — no build step, no framework, no dependencies. Open
`index.html` in a browser and it runs.

## Layout

```
index.html            the whole page
assets/css/site.css   all styling, incl. the interactive pendant component
assets/js/site.js     FAQ accordion · decode-safe video · the pendant
assets/img/           stills, posters, favicon
assets/video/         the three screen recordings
```

`assets/img/cockpit-idle.jpg` and `assets/img/pendant.png` are unused spares from the
design bundle, kept in case a still is wanted later.

## Local preview

```bash
python -m http.server 8000
```

Then open <http://localhost:8000>. (Opening `index.html` via `file://` works too, but a
local server matches production more closely for video range requests.)

## Deploying

The site is served from the repository root, so GitHub Pages needs no build:
**Settings → Pages → Source: Deploy from a branch → `main` / `/ (root)`**.
`.nojekyll` is present so Jekyll never rewrites the asset paths.

For the custom domain, add a `CNAME` file containing `helmcnc.com` and point DNS at
GitHub Pages.

## The interactive pendant

A phone visitors can actually operate, mounted twice — small beside the hero, larger in
the Pendant section. The markup lives **once**, in the Pendant section; `site.js` clones
it into the hero mount and wires each copy with its own independent state. Edit the one
in the Pendant section.

- It scales off **container query units (`cqw`)**, so one component serves both mount
  widths with no breakpoints.
- **The bezel must never change shape between tabs.** All four panes share a single CSS
  grid cell and inactive ones are `visibility:hidden`, so the pane region is always as
  tall as its tallest pane. `min-height:154cqw` from the handoff is the floor; the stack
  is what makes it hold at every width. (A bare `min-height` is ~7px short of the JOG
  pane at 280px wide, which is what made the phone jump.) Hidden panes keep their space
  but drop out of the tab order.
- **Joystick and Z stick**: CSS keyframes idle-drift when untouched, take a direct
  pointer drag (the transform is written straight to the element so it tracks the finger),
  clamp to their range, tick the DRO as they move, and spring back to centre on release —
  after which the inline styles are cleared so CSS takes the drift back.
- Sliders snap to 5 and clamp to their own range: jog speed 0–100%, feed 10–200%,
  spindle 10–150%, each with a tick at 100%. They are keyboard-operable
  (arrows / PageUp / PageDown / Home / End).
- Without JavaScript the phone still renders — the JOG tab, statically.

## Video: the decode-safety pattern

Playing all three clips at once can exceed a browser's video-decode budget and black
them all out (`MEDIA_ERR_DECODE`). So, per the handoff:

1. The poster still is the **wrapper's `background-image`**, set inline on the element
   (not via a custom property — a relative `url()` in a custom property resolves against
   the stylesheet, not the page). The clip sits at `opacity:0` until it is genuinely
   playing, and drops back to 0 on `error`, so **a video is never a black box**.
2. Only the clip **in view** plays, via `IntersectionObserver` at a 0.35 threshold. A
   failed clip gets one `load()` retry.

`site.js` therefore strips `autoplay` and `poster` and drives playback itself. Both
attributes stay in the markup so the videos still work with JavaScript off.

## Editing notes

- **Design tokens** are CSS custom properties at the top of `site.css` — colors,
  type stacks, spacing, shadows. Change them there, not in the rules.
- **Pricing numbers are authoritative.** `$129` founder → `$239` (marked *"Founder price — first 30 days. Goes
  up to $239"*), `$45 × 6` rent-to-own (`$270` total), `$19/yr` optional renewal,
  24 months of updates included, 14-day trial. Do not alter them casually.
- **Copy rules:** never describe HelmCNC as a recurring-billing product — the s-word for
  that is banned from the page. Use "one-time", "own it", "rent-to-own", "renewal". Keep
  *"Skipping it never disables your software"* near-verbatim in the pricing footnote.
  Every HELMCNC wordmark shows **HELM** in white and **CNC** in amber.
- The pendant is a **native app for iPhone and Android**, free on the App Store and
  Google Play, and it ships **in the base product** — it is not one of the roadmap
  add-ons. The camera bullet is *watching only*; it makes no vision/alignment claim
  (that is the Vision add-on, still "coming soon").
- **Buy buttons** are placeholders (`href="#"`, tagged `data-checkout="perpetual"` and
  `data-checkout="rent-to-own"`). Point them at the hosted checkout when it exists.
- **Fonts** currently load from Google Fonts. Self-host Oswald / Barlow / JetBrains
  Mono before launch if you want to drop the third-party request.
- Footer Docs/Terms/Privacy/License links are still `#` placeholders.
- Two CSS gotchas worth keeping in mind, both already handled: the `background`
  *shorthand* on `.media` / `.frame__screen` would wipe the poster `background-image`,
  so those use `background-color`; and the pendant's button reset is wrapped in
  `:where()` so it stays at zero specificity and does not out-rank the single-class
  component rules.

## Differences from the design prototype

Faithful to the handoff. Production-only additions: a skip link, real `<button>`
elements with `aria-expanded` / `aria-pressed`, `role="slider"` with keyboard support on
the three sliders, alt text on every image, `prefers-reduced-motion` handling for all
looping motion, and a page that stays readable with JavaScript off.

---

© 2026 HelmCNC · Independent product · Not affiliated with Dynomotion.
Built on the KMotion libraries with Dynomotion's permission.
