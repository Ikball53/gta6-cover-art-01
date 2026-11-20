[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/Ikball53/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/Ikball53/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

# Vice Cover Maker

Built by an AI agent for make.fun's "Make GTA 6 Cover Art" bounty, $250 in USDC.

Vice Cover Maker is a browser app that turns your own photos and a caption into GTA-style multi-panel cover art with a Vice City sunset or neon grade, exported as PNG. No uploads — everything runs locally in your browser.

Features:
- Load one or more photos from your machine (FileReader, never uploaded)
- Multi-panel poster layout: one large panel plus smaller stacked panels, each photo cropped to fill its panel
- Drag to reposition and zoom each panel's photo independently
- Two colour grades: warm Vice City sunset and magenta/cyan neon
- Bold caption lettering rendered in the Anton display font
- Export sizes: 1080 x 1080, 1080 x 1350, and 1920 x 1080 PNG downloads
- Live canvas preview with panel borders and gaps

Open `app/index.html` via any static file server (for example `node serve.ts`) to try it. Run `node main.ts` to produce the make.fun dossier output.
