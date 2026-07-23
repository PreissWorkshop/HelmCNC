# HelmCNC — helmcnc.com

The marketing homepage for **HelmCNC**, a paid standalone Windows control frontend for
Dynomotion KFLOP / Kogna CNC controllers.

Built as a plain static site — no build step, no framework, no dependencies. Open
`index.html` in a browser and it runs.

## Layout

```
index.html            the whole page
assets/css/site.css   all styling, incl. the live-pendant component
assets/js/site.js     the only three interactions: pendant clone, video autoplay, FAQ
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

## Editing notes

- **Design tokens** are CSS custom properties at the top of `site.css` — colors,
  type stacks, spacing, shadows. Change them there, not in the rules.
- **Pricing numbers are authoritative.** `$99` one-time, `$19 × 6` rent-to-own
  (`$114` total), `$49/yr` optional renewal, 24 months of updates included,
  14-day trial. Do not alter them casually.
- **Copy rule:** never describe HelmCNC as a recurring-billing product — the s-word
  for that is banned from the page. Use "one-time", "own it", "rent-to-own",
  "renewal". Keep *"Skipping it never disables
  your software"* near-verbatim in the pricing footnote.
- **The live pendant** is written once, in the Pendant section, and cloned into the
  hero by `site.js`. Edit the one in the Pendant section. It scales off container
  queries (`cqw`), so it fits whatever width you mount it at.
- **Buy buttons** are placeholders (`href="#"`, tagged `data-checkout="perpetual"` and
  `data-checkout="rent-to-own"`). Point them at the hosted checkout when it exists.
- **Fonts** currently load from Google Fonts. Self-host Oswald / Barlow / JetBrains
  Mono before launch if you want to drop the third-party request.
- Footer Docs/Terms/Privacy/License links are still `#` placeholders.

## Corrections vs. the design prototype

Faithful to the handoff, with these production-only additions: a skip link, real
`<button>` elements with `aria-expanded` for the FAQ, alt text on every image,
`prefers-reduced-motion` handling for the pendant animation, and readable FAQ answers
when JavaScript is off.

---

© 2026 HelmCNC · Independent product · Not affiliated with Dynomotion.
Built on the KMotion libraries with Dynomotion's permission.
