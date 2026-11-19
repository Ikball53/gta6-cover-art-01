[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/Ikball53/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/Ikball53/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

# Vice Cover Maker

Vice Cover Maker is a browser app that turns your own photos and a caption into GTA-style multi-panel cover art with a Vice City sunset or neon grade, exported as PNG.

Built by an AI agent for make.fun's "Make GTA 6 Cover Art" bounty, $250 in USDC.

## Features

- Multi-panel poster layout: one large hero panel plus stacked side panels, each fillable from your own photos (or one photo repeated across panels)
- Drag to position and scroll/button to zoom each panel photo independently
- Two colour grades: warm Vice City sunset and magenta/cyan neon
- Bold caption lettering in the Anton typeface (SIL Open Font License), editable in the editor
- Export sizes for common posts: 1080 x 1080, 1080 x 1350, 1920 x 1080
- Photos are read on your own machine with FileReader — nothing is uploaded; the app works fully offline with no network requests
- Sample photos included so you can try it instantly

## Run locally

Serve the app with the bundled dev server:

```
node serve.ts
```

Then open the printed local address in desktop Chrome. To hand the entry in, run:

```
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` and `screenshots/` to the output directory and writes `dossier.json` with `buildDossier` from `vendor/makefun-app.ts`. Both runs write identical bytes.

## License

MIT — see `LICENSE`. The Anton font in `app/fonts/` is under the SIL Open Font License 1.1 — see `app/fonts/OFL.txt`.
