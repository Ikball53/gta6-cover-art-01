"""Generate the four Vice Cover Maker screenshots from the bundled photos.

Covers mirror what app/src/cover.js draws: a large left panel plus two
stacked right panels, thin gaps, a sunset or neon tint, and bold Anton
caption lettering across the bottom. The editor shot draws the dark
editor chrome around a live cover preview. Every file is JPEG, sized
to the gate limits (long side <= 1280, short side >= 480, <= 256 KiB).
"""

from pathlib import Path

from PIL import Image, ImageDraw, ImageEnhance, ImageFont

ROOT = Path(__file__).resolve().parent.parent
FONT_PATH = ROOT / "app" / "fonts" / "Anton-Regular.ttf"
SHOTS = ROOT / "screenshots"
MAX_BYTES = 256 * 1024

PIER = ROOT / "app" / "samples" / "pier.jpg"
BOULEVARD = ROOT / "app" / "samples" / "boulevard.jpg"
SUNSET = ROOT / "app" / "plates" / "sunset.jpg"
NEON = ROOT / "app" / "plates" / "neon.jpg"


def crop_fill(image: Image.Image, width: int, height: int) -> Image.Image:
    """Crop an image so it fills width x height, centred."""
    src_w, src_h = image.size
    scale = max(width / src_w, height / src_h)
    resized = image.resize(
        (max(1, round(src_w * scale)), max(1, round(src_h * scale))),
        Image.LANCZOS,
    )
    left = (resized.width - width) // 2
    top = (resized.height - height) // 2
    return resized.crop((left, top, left + width, top + height))


def tint_sunset(image: Image.Image) -> Image.Image:
    warm = ImageEnhance.Color(image).enhance(1.12)
    overlay = Image.new("RGB", image.size, (255, 120, 60))
    blended = Image.blend(warm, overlay, 0.12)
    return ImageEnhance.Brightness(blended).enhance(1.03)


def tint_neon(image: Image.Image) -> Image.Image:
    boosted = ImageEnhance.Color(image).enhance(1.25)
    magenta = Image.new("RGB", image.size, (255, 46, 196))
    cyan = Image.new("RGB", image.size, (25, 227, 255))
    half = Image.blend(boosted, magenta, 0.10)
    return Image.blend(half, cyan, 0.08)


def panel_cover(width: int, height: int, photos, tint, caption: str, subtitle: str) -> Image.Image:
    gap = max(6, round(min(width, height) * 0.012))
    band = round(height * 0.2)
    art_h = height - band
    main_w = round(width * 0.62)
    side_w = width - main_w - gap
    side_h = (art_h - gap) // 2
    rects = [
        (0, 0, main_w, art_h),
        (main_w + gap, 0, side_w, side_h),
        (main_w + gap, side_h + gap, side_w, art_h - side_h - gap),
    ]
    canvas = Image.new("RGB", (width, height), (11, 7, 20))
    for rect, photo_path in zip(rects, photos):
        x, y, w, h = rect
        with Image.open(photo_path) as source:
            panel = tint(crop_fill(source.convert("RGB"), w, h))
        canvas.paste(panel, (x, y))
    draw = ImageDraw.Draw(canvas, "RGBA")
    for x, y, w, h in rects:
        draw.rectangle([x, y, x + w - 1, y + h - 1], outline=(8, 4, 14, 230), width=3)
    # Caption band: dark fade at the bottom with bold Anton lettering.
    for row in range(band):
        alpha = round(60 + 195 * (row / max(1, band - 1)))
        draw.line([(0, art_h + row), (width, art_h + row)], fill=(10, 5, 16, alpha))
    title_size = round(height * 0.085)
    title_font = ImageFont.truetype(str(FONT_PATH), title_size)
    while title_font.getlength(caption) > width * 0.92 and title_size > 12:
        title_size -= 2
        title_font = ImageFont.truetype(str(FONT_PATH), title_size)
    sub_font = ImageFont.truetype(str(FONT_PATH), max(14, round(title_size * 0.32)))
    title_y = art_h + round(band * 0.30)
    draw.text(
        (width // 2, title_y),
        caption,
        font=title_font,
        fill=(255, 210, 130, 255),
        anchor="mm",
        stroke_width=max(2, title_size // 18),
        stroke_fill=(20, 6, 20, 255),
    )
    draw.text(
        (width // 2, art_h + round(band * 0.74)),
        subtitle,
        font=sub_font,
        fill=(245, 238, 252, 255),
        anchor="mm",
    )
    return canvas


def save_limited(image: Image.Image, path: Path) -> None:
    for quality in (88, 82, 76, 70, 64, 58):
        image.save(path, format="JPEG", quality=quality, optimize=True)
        if path.stat().st_size <= MAX_BYTES:
            print(f"wrote {path.name} {image.width}x{image.height} q={quality} {path.stat().st_size} bytes")
            return
    raise SystemExit(f"{path.name} exceeds {MAX_BYTES} bytes even at low quality")


def editor_shot(cover: Image.Image) -> Image.Image:
    width, height = 1280, 720
    canvas = Image.new("RGB", (width, height), (20, 16, 28))
    draw = ImageDraw.Draw(canvas)
    brand_font = ImageFont.truetype(str(FONT_PATH), 30)
    label_font = ImageFont.truetype(str(FONT_PATH), 15)
    small_font = ImageFont.truetype(str(FONT_PATH), 13)
    draw.text((24, 18), "VICE COVER MAKER", font=brand_font, fill=(255, 150, 80))
    # Controls column.
    col_x, col_y, col_w = 24, 70, 300
    draw.rounded_rectangle([col_x, col_y, col_x + col_w, height - 24], radius=12, fill=(33, 26, 48), outline=(58, 45, 82), width=2)
    rows = [
        ("PHOTO", "pier.jpg"),
        ("SIZE", "1080 x 1080"),
        ("GRADE", "Sunset"),
        ("CAPTION", "VICE CITY"),
        ("PANEL", "Main panel"),
        ("ZOOM", "1.00x"),
    ]
    y = col_y + 18
    for label, value in rows:
        draw.text((col_x + 16, y), label, font=label_font, fill=(185, 168, 217))
        y += 22
        draw.rounded_rectangle([col_x + 16, y, col_x + col_w - 16, y + 34], radius=7, fill=(23, 18, 33), outline=(58, 45, 82), width=1)
        draw.text((col_x + 26, y + 8), value, font=small_font, fill=(245, 238, 252))
        y += 48
    draw.rounded_rectangle([col_x + 16, y + 4, col_x + col_w - 16, y + 48], radius=9, fill=(233, 79, 122))
    draw.text((col_x + col_w // 2, y + 26), "EXPORT PNG", font=label_font, fill=(255, 255, 255), anchor="mm")
    # Cover preview in the centre.
    preview = cover.resize((640, 640), Image.LANCZOS)
    px = col_x + col_w + 40
    py = 70
    canvas.paste(preview, (px, py))
    draw.rectangle([px, py, px + preview.width - 1, py + preview.height - 1], outline=(58, 45, 82), width=2)
    draw.text((px + preview.width // 2, py + preview.height + 18), "LIVE PREVIEW", font=small_font, fill=(185, 168, 217), anchor="mm")
    return canvas


def main() -> None:
    SHOTS.mkdir(parents=True, exist_ok=True)
    landscape = panel_cover(1280, 720, [PIER, SUNSET, BOULEVARD], tint_sunset, "VICE CITY", "A POSTER STORY")
    save_limited(landscape, SHOTS / "1-cover.jpg")
    square = panel_cover(1080, 1080, [PIER, SUNSET, BOULEVARD], tint_sunset, "VICE CITY", "A POSTER STORY")
    save_limited(editor_shot(square), SHOTS / "2-editor.jpg")
    portrait = panel_cover(1024, 1280, [BOULEVARD, NEON, PIER], tint_neon, "NEON NIGHTS", "AFTER DARK")
    save_limited(portrait, SHOTS / "3-cover.jpg")
    save_limited(square, SHOTS / "4-cover.jpg")


if __name__ == "__main__":
    main()
