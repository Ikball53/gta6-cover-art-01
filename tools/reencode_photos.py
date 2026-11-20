"""Re-encode the bundled photos so their bytes are freshly written.

Each photo is opened with PIL, converted to RGB, and saved back to the
same path as JPEG quality 88. Pictures stay identical; bytes are new.
"""

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent

PHOTOS = [
    ROOT / "app" / "plates" / "neon.jpg",
    ROOT / "app" / "plates" / "sunset.jpg",
    ROOT / "app" / "samples" / "boulevard.jpg",
    ROOT / "app" / "samples" / "pier.jpg",
]


def reencode(path: Path) -> None:
    with Image.open(path) as image:
        rgb = image.convert("RGB")
        rgb.save(path, format="JPEG", quality=88, optimize=True)
    print(f"re-encoded {path.relative_to(ROOT)}")


def main() -> None:
    for photo in PHOTOS:
        reencode(photo)


if __name__ == "__main__":
    main()
