// Cover painter: turns the editor state plus loaded images into the
// finished poster on a canvas. Fully deterministic — identical inputs
// always paint identical pixels, which the PNG export relies on.
import { applyGrade, photoFilter, plateFilter } from './grade.js';

export const COVER_SIZES = {
  landscape: { w: 1920, h: 1080 },
  portrait: { w: 1080, h: 1350 },
  square: { w: 1080, h: 1080 },
};

const FONT_STACK = '"Anton", "Arial Narrow", sans-serif';

function wrapWords(ctx, text, maxWidth) {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  const lines = [];
  let current = words[0];
  for (let i = 1; i < words.length; i += 1) {
    const trial = `${current} ${words[i]}`;
    if (ctx.measureText(trial).width <= maxWidth) {
      current = trial;
    } else {
      lines.push(current);
      current = words[i];
    }
  }
  lines.push(current);
  return lines;
}

// Largest Anton size whose wrapped title fits the width, the three-line
// cap and the 30%-of-height block cap. Binary search keeps it fast even
// on the 1920-wide canvas.
function fitTitle(ctx, rawTitle, canvasW, canvasH) {
  const text = (rawTitle || '').toUpperCase().trim();
  const maxWidth = canvasW * 0.92;
  const maxBlockH = canvasH * 0.3;
  if (!text) return { lines: [], size: 0, lineH: 0, blockH: 0 };

  const fits = (size) => {
    ctx.font = `${size}px ${FONT_STACK}`;
    const lines = wrapWords(ctx, text, maxWidth);
    if (lines.length > 3) return null;
    const lineH = size * 1.06;
    if (lines.length * lineH > maxBlockH) return null;
    for (const line of lines) {
      if (ctx.measureText(line).width > maxWidth) return null;
    }
    return lines;
  };

  let lo = 10;
  let hi = Math.floor(canvasW * 0.42);
  let best = null;
  let bestSize = lo;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    const lines = fits(mid);
    if (lines) {
      best = lines;
      bestSize = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  if (!best) {
    ctx.font = `${lo}px ${FONT_STACK}`;
    best = wrapWords(ctx, text, maxWidth).slice(0, 3);
    bestSize = lo;
  }
  const lineH = bestSize * 1.06;
  return { lines: best, size: bestSize, lineH, blockH: best.length * lineH };
}

function paintOutlinedLine(ctx, line, x, y, size) {
  ctx.font = `${size}px ${FONT_STACK}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.miterLimit = 2;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
  ctx.shadowBlur = Math.max(6, size * 0.12);
  ctx.shadowOffsetY = Math.max(2, size * 0.04);
  ctx.strokeStyle = '#12060d';
  ctx.lineWidth = Math.max(4, size * 0.14);
  ctx.strokeText(line, x, y);
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  ctx.fillStyle = '#ffffff';
  ctx.fillText(line, x, y);
}

function roundedPath(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.arcTo(x + w, y, x + w, y + radius, radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.arcTo(x + w, y + h, x + w - radius, y + h, radius);
  ctx.lineTo(x + radius, y + h);
  ctx.arcTo(x, y + h, x, y + h - radius, radius);
  ctx.lineTo(x, y + radius);
  ctx.arcTo(x, y, x + radius, y, radius);
  ctx.closePath();
}

// Source rectangle that makes `img` cover a dw x dh box. biasY picks how
// much of the vertical overflow is trimmed from the top (0 = keep top).
function coverSource(img, dw, dh, biasY) {
  const sw = img.naturalWidth || img.width;
  const sh = img.naturalHeight || img.height;
  const scale = Math.max(dw / sw, dh / sh);
  const srcW = dw / scale;
  const srcH = dh / scale;
  const sx = (sw - srcW) / 2;
  const sy = (sh - srcH) * biasY;
  return { sx, sy, srcW, srcH };
}

function paintPlate(ctx, img, w, h, grade) {
  if (!img) return;
  const { sx, sy, srcW, srcH } = coverSource(img, w, h, 1);
  ctx.save();
  ctx.filter = plateFilter(grade);
  ctx.drawImage(img, sx, sy, srcW, srcH, 0, 0, w, h);
  ctx.restore();
}

function paintPhoto(ctx, img, box, grade) {
  const { x, y, w, h } = box;
  const radius = Math.max(10, w * 0.035);
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
  ctx.shadowBlur = Math.max(12, w * 0.05);
  ctx.shadowOffsetY = Math.max(6, h * 0.04);
  roundedPath(ctx, x, y, w, h, radius);
  ctx.fillStyle = '#000000';
  ctx.fill();
  ctx.restore();

  ctx.save();
  roundedPath(ctx, x, y, w, h, radius);
  ctx.clip();
  ctx.filter = photoFilter(grade);
  const { sx, sy, srcW, srcH } = coverSource(img, w, h, 0.18);
  ctx.drawImage(img, sx, sy, srcW, srcH, x, y, w, h);
  ctx.restore();

  ctx.save();
  roundedPath(ctx, x, y, w, h, radius);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.92)';
  ctx.lineWidth = Math.max(2, w * 0.004);
  ctx.stroke();
  ctx.restore();
}

function paintPlaceholder(ctx, box) {
  const { x, y, w, h } = box;
  const radius = Math.max(10, w * 0.035);
  ctx.save();
  roundedPath(ctx, x, y, w, h, radius);
  ctx.fillStyle = 'rgba(10, 6, 18, 0.42)';
  ctx.fill();
  ctx.setLineDash([Math.max(8, w * 0.02), Math.max(6, w * 0.014)]);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.lineWidth = Math.max(2, w * 0.004);
  ctx.stroke();
  ctx.setLineDash([]);
  const size = Math.max(18, w * 0.055);
  ctx.font = `${size}px ${FONT_STACK}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.fillText('Add your photo', x + w / 2, y + h / 2);
  ctx.restore();
}

export function drawCover(canvas, state, assets) {
  const dims = COVER_SIZES[state.sizeKey] || COVER_SIZES.landscape;
  const W = dims.w;
  const H = dims.h;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  ctx.save();
  ctx.filter = 'none';
  ctx.fillStyle = '#0a0614';
  ctx.fillRect(0, 0, W, H);
  ctx.restore();

  const plate = assets && assets.plates ? assets.plates[state.plateKey] : null;
  paintPlate(ctx, plate, W, H, state.grade);
  applyGrade(ctx, W, H, state.grade);

  // Title block, centred near the top.
  const title = fitTitle(ctx, state.title, W, H);
  const titleTop = H * 0.045;
  ctx.save();
  title.lines.forEach((line, i) => {
    const cy = titleTop + title.lineH * (i + 0.5);
    paintOutlinedLine(ctx, line, W / 2, cy, title.size);
  });
  ctx.restore();
  const titleBottom = title.lines.length ? titleTop + title.blockH : H * 0.06;

  // Caption size is decided before the photo so the photo zone can sit
  // cleanly between the title and the caption.
  const captionText = (state.caption || '').trim();
  let captionSize = 0;
  let captionH = 0;
  if (captionText) {
    const start = title.size > 0 ? Math.round(title.size * 0.4) : Math.round(H * 0.05);
    captionSize = Math.max(14, start);
    ctx.save();
    while (captionSize > 12) {
      ctx.font = `${captionSize}px ${FONT_STACK}`;
      if (ctx.measureText(captionText.toUpperCase()).width <= W * 0.92) break;
      captionSize -= 2;
    }
    ctx.restore();
    captionH = captionSize * 1.25;
  }
  const captionZoneTop = captionText ? H - H * 0.045 - captionH : H - H * 0.04;

  // Photo inset (or its placeholder) between title and caption.
  const photoW = (Math.min(80, Math.max(30, state.photoSize || 52)) / 100) * W;
  const photoH = photoW * 0.62;
  const zoneTop = titleBottom + H * 0.03;
  const zoneBottom = captionZoneTop - H * 0.025;
  const travel = Math.max(0, zoneBottom - zoneTop - photoH);
  const lift = Math.min(100, Math.max(0, state.photoY ?? 42)) / 100;
  const photoBox = {
    x: (W - photoW) / 2,
    y: zoneTop + travel * lift,
    w: photoW,
    h: photoH,
  };
  const photo = assets ? assets.photo : null;
  if (photo) paintPhoto(ctx, photo, photoBox, state.grade);
  else paintPlaceholder(ctx, photoBox);

  if (captionText) {
    ctx.save();
    paintOutlinedLine(
      ctx,
      captionText.toUpperCase(),
      W / 2,
      H - H * 0.045 - captionH / 2,
      captionSize,
    );
    ctx.restore();
  }
}
