# Affine Studio

The studio site. Static, hand-written, no build step and no dependencies —
open `index.html` and it runs.

## Run it locally

Because the page loads fonts over the network and uses `<canvas>`, serve it
rather than opening the file directly:

```bash
python3 -m http.server 8000
# → http://localhost:8000
```

Any static server works (`npx serve`, `php -S localhost:8000`, Live Server in VS Code).

## Structure

```
affine-studio/
├── index.html        markup only — every section lives here
├── css/affine.css    tokens, layout, components
├── js/affine.js      theme toggle, menu, canvas field, scroll morph
├── favicon.svg       a unit square under a shear
└── README.md
```

Three files on purpose. There is no bundler, no framework and nothing to
install, so the whole site is readable end to end.

## Before you deploy

- [ ] **Set the real email.** `studio@affine.studio` is a placeholder. It
      appears in `index.html` (the contact link) and once in `js/affine.js`
      as `var MAIL = '...'`, which builds the prefilled subject line when
      someone picks a package. Change both.
- [ ] Point `og:title` / `og:description` in `index.html` at the final domain,
      and add an `og:image` once you have a share card.

## Deploying to GitHub Pages

```bash
git remote add origin git@github.com:<you>/affine-studio.git
git push -u origin main
```

Then Settings → Pages → Source: `main` / root. The site is served straight
from these files; there is nothing to build.

For a custom domain, add a `CNAME` file at the root containing just the
domain, and point an ALIAS/A record at GitHub Pages.

## How the design system works

Everything is driven by CSS custom properties at the top of `css/affine.css`.
The bare `:root` block is the complete light palette; `:root[data-theme="dark"]`
redefines the same names. Nothing else in the stylesheet hardcodes a colour, so
retheming the whole site means editing one block.

| Token | Role |
| --- | --- |
| `--bg`, `--bg-2` | page ground and the recessed panels |
| `--text`, `--dim`, `--faint` | the three text weights |
| `--rule`, `--hair` | structural lines |
| `--line`, `--line-hi` | copper accent, and the hot signal colour |
| `--sans`, `--mono` | Anybody (display) and Martian Mono (instrumentation) |

The theme choice is stored in `localStorage` under `affine-theme`. Light is the
default when nothing is stored.

## The canvas field

`js/affine.js` renders a routed circuit board that resolves into the lines of a
page as you scroll the chapter section. It is not a looping animation:

- `ROUTE` defines fourteen traces; `TARGET` defines the page lines they become.
- Nodes are shared between traces, so `ADJ` is a real adjacency graph.
- Packets fire on a Poisson schedule from edge nodes, travel a trace, land on a
  pad, and that pad fires onward down a *different* connected trace.
- Traces stay warm for ~1.4s after a signal passes, so you can see where
  activity has been.

The hero draws every second trace at reduced weight so the typography stays
dominant; the chapter canvas draws all of them at full fidelity. Both respect
`prefers-reduced-motion`.

## Editing content

All copy is in `index.html`. The sections, in order:

`#work` · `#method` · `#pricing` · `#studio` · lab · `#contact`

Pricing lives in three `<article class="tier">` blocks. If you change a price,
update the matching `data-pick` attribute on that tier's button too — that
string is what gets carried into the contact block and the email subject.
