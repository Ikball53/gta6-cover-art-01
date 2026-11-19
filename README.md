[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/Ikball53/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/Ikball53/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

# Vice Cover Maker

Vice Cover Maker turns a photo and a caption into cinematic game-cover poster art, right in the browser. Your picture is set as a photorealistic inset over a layered sunset or neon scene, finished with a bold condensed title and a matching colour grade. When it looks right, export a crisp PNG at 1080x1080, 1080x1350 or 1920x1080. Everything runs locally on your machine — your photo never leaves the page.

## Run

Serve the `app/` folder with any static file server and open `index.html`. For example:

```sh
cd app
python3 -m http.server 8000
```

Then visit http://localhost:8000 in your browser. No build step and no internet connection are needed.

## How to use

1. Add a photo with the file picker, drag and drop an image onto the page, or load one of the built-in samples.
2. Type your title and caption.
3. Pick an export size, a background scene and a colour grade.
4. Adjust the photo size and photo position sliders until the layout feels right.
5. Click **Export PNG** to download your finished cover.
