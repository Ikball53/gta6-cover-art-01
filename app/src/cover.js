// Canvas rendering for the cover art.
// Everything is drawn from loaded images and the current settings,
// so the same inputs always produce the same pixels.

import { plateFilterForGrade, photoFilterForGrade, applyGrade } from "./grade.js";

export const COVER_SIZES = {
  landscape: { width: 1920, height: 1080 },
  portrait: { width: 1080, height: 1350 },
  square: { width: 1080, height: 1080 }
};

const PLATE_ANCHOR_Y = 0.82;
const TITLE_MAX_WIDTH_RATIO = 0.92;
const TITLE_MAX_LINES = 3;
const PHOTO_ASPECT = 0.62;

function roundedRectPath(ctx, x, y, w, h, r) {
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

export function plateLayout(canvasWidth, canvasHeight, imageWidth, imageHeight) {
  const scale = Math.max(canvasWidth / imageWidth, canvasHeight / imageHeight);
  const dw = imageWidth * scale;
  const dh = imageHeight * scale;
  const dx = (canvasWidth - dw) / 2;
  const dy = (canvasHeight - dh) * PLATE_ANCHOR_Y;
  return { dx: dx, dy: dy, dw: dw, dh: dh };
}

function drawPlate(ctx, canvasWidth, canvasHeight, plateImg, gradeName) {
  ctx.save();
  ctx.fillStyle = "#101018";
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  if (plateImg) {
    const layout = plateLayout(canvasWidth, canvasHeight, plateImg.naturalWidth, plateImg.naturalHeight);
    ctx.filter = plateFilterForGrade(gradeName);
    ctx.drawImage(plateImg, layout.dx, layout.dy, layout.dw, layout.dh);
    ctx.filter = "none";
  }
  ctx.restore();
}

function coverFitRect(imageWidth, imageHeight, boxX, boxY, boxW, boxH, focusY) {
  const scale = Math.max(boxW / imageWidth, boxH / imageHeight);
  const dw = imageWidth * scale;
  const dh = imageHeight * scale;
  const verticalBias = typeof focusY === "number" ? focusY : 0.5;
  return {
    dx: boxX + (boxW - dw) / 2,
    dy: boxY + (boxH - dh) * verticalBias,
    dw: dw,
    dh: dh
  };
}

function wrapTitleLines(ctx, words, fontSize, maxWidth) {
  ctx.font = "400 " + fontSize + "px Anton, sans-serif";
  const lines = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? current + " " + word : word;
    if (ctx.measureText(candidate).width <= maxWidth || current === "") {
      current = candidate;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) {
    lines.push(current);
  }
  return lines;
}

export function layoutTitle(ctx, rawTitle, canvasWidth, canvasHeight) {
  const text = (rawTitle || "").trim().toUpperCase();
  if (!text) {
    return { lines: [], fontSize: 0, blockHeight: 0 };
  }
  const words = text.split(/\s+/);
  const maxWidth = canvasWidth * TITLE_MAX_WIDTH_RATIO;
  const maxBlockHeight = canvasHeight * 0.3;
  let lo = 24;
  let hi = Math.floor(canvasWidth * 0.16);
  let best = null;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    const lines = wrapTitleLines(ctx, words, mid, maxWidth);
    const widest = Math.max.apply(null, lines.map(function (line) {
      ctx.font = "400 " + mid + "px Anton, sans-serif";
      return ctx.measureText(line).width;
    }));
    const blockHeight = lines.length * mid * 1.04;
    const fits = lines.length <= TITLE_MAX_LINES && widest <= maxWidth && blockHeight <= maxBlockHeight;
    if (fits) {
      best = { lines: lines, fontSize: mid, blockHeight: blockHeight };
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  if (!best) {
    const fallbackSize = 24;
    const lines = wrapTitleLines(ctx, words, fallbackSize, maxWidth).slice(0, TITLE_MAX_LINES);
    best = { lines: lines, fontSize: fallbackSize, blockHeight: lines.length * fallbackSize * 1.04 };
  }
  return best;
}

function drawOutlinedText(ctx, line, centerX, baselineY, fontSize) {
  ctx.save();
  ctx.font = "400 " + fontSize + "px Anton, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.lineJoin = "round";
  ctx.miterLimit = 2;
  ctx.shadowColor = "rgba(0, 0, 0, 0.45)";
  ctx.shadowBlur = Math.max(4, fontSize * 0.08);
  ctx.shadowOffsetY = Math.max(2, fontSize * 0.04);
  ctx.strokeStyle = "#0a0a0c";
  ctx.lineWidth = Math.max(6, fontSize * 0.18);
  ctx.strokeText(line, centerX, baselineY);
  ctx.shadowColor = "transparent";
  ctx.fillStyle = "#ffffff";
  ctx.fillText(line, centerX, baselineY);
  ctx.restore();
}

function drawTitle(ctx, layout, canvasWidth, topMargin) {
  const lineStep = layout.fontSize * 1.04;
  let baseline = topMargin + layout.fontSize;
  for (const line of layout.lines) {
    drawOutlinedText(ctx, line, canvasWidth / 2, baseline, layout.fontSize);
    baseline += lineStep;
  }
  return topMargin + layout.blockHeight;
}

function drawCaption(ctx, rawCaption, canvasWidth, canvasHeight, titleFontSize) {
  const text = (rawCaption || "").trim().toUpperCase();
  if (!text || titleFontSize <= 0) {
    return canvasHeight;
  }
  let fontSize = Math.max(28, Math.floor(titleFontSize * 0.4));
  const maxWidth = canvasWidth * TITLE_MAX_WIDTH_RATIO;
  ctx.font = "400 " + fontSize + "px Anton, sans-serif";
  while (ctx.measureText(text).width > maxWidth && fontSize > 20) {
    fontSize -= 2;
    ctx.font = "400 " + fontSize + "px Anton, sans-serif";
  }
  const bottomMargin = Math.floor(canvasHeight * 0.045);
  const baseline = canvasHeight - bottomMargin;
  drawOutlinedText(ctx, text, canvasWidth / 2, baseline, fontSize);
  return baseline - fontSize;
}

function photoRectFor(canvasWidth, canvasHeight, titleBottom, captionTop, sizePct, yPct) {
  const w = Math.floor(canvasWidth * (sizePct / 100));
  const h = Math.floor(w * PHOTO_ASPECT);
  const x = Math.floor((canvasWidth - w) / 2);
  const gap = Math.floor(canvasHeight * 0.03);
  const minTop = titleBottom + gap;
  const maxTop = Math.max(minTop, captionTop - gap - h);
  const y = Math.floor(minTop + (maxTop - minTop) * (yPct / 100));
  return { x: x, y: y, w: w, h: h };
}

function drawPhotoInset(ctx, rect, photoImg, gradeName) {
  const radius = Math.max(10, Math.floor(rect.w * 0.028));
  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.55)";
  ctx.shadowBlur = Math.floor(rect.w * 0.05);
  ctx.shadowOffsetY = Math.floor(rect.w * 0.02);
  roundedRectPath(ctx, rect.x, rect.y, rect.w, rect.h, radius);
  ctx.fillStyle = "#1a1d26";
  ctx.fill();
  ctx.restore();

  ctx.save();
  roundedRectPath(ctx, rect.x, rect.y, rect.w, rect.h, radius);
  ctx.clip();
  if (photoImg) {
    const fit = coverFitRect(photoImg.naturalWidth, photoImg.naturalHeight, rect.x, rect.y, rect.w, rect.h, 0.22);
    ctx.filter = photoFilterForGrade(gradeName);
    ctx.drawImage(photoImg, fit.dx, fit.dy, fit.dw, fit.dh);
    ctx.filter = "none";
  } else {
    ctx.fillStyle = "rgba(10, 12, 20, 0.35)";
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  }
  ctx.restore();

  ctx.save();
  roundedRectPath(ctx, rect.x, rect.y, rect.w, rect.h, radius);
  if (photoImg) {
    ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
    ctx.lineWidth = Math.max(2, Math.floor(rect.w * 0.005));
    ctx.stroke();
  } else {
    ctx.strokeStyle = "rgba(255, 255, 255, 0.55)";
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 8]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.font = "400 " + Math.max(20, Math.floor(rect.w * 0.05)) + "px Anton, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
    ctx.fillText("Add your photo", rect.x + rect.w / 2, rect.y + rect.h / 2);
  }
  ctx.restore();
}

export function drawCover(canvas, state, assets) {
  const size = COVER_SIZES[state.sizeKey] || COVER_SIZES.landscape;
  if (canvas.width !== size.width || canvas.height !== size.height) {
    canvas.width = size.width;
    canvas.height = size.height;
  }
  const ctx = canvas.getContext("2d");
  const width = size.width;
  const height = size.height;

  drawPlate(ctx, width, height, assets.plateImg, state.grade);
  applyGrade(ctx, width, height, state.grade);

  const topMargin = Math.floor(height * 0.035);
  const titleLayout = layoutTitle(ctx, state.title, width, height);
  const titleBottom = drawTitle(ctx, titleLayout, width, topMargin);

  const captionText = (state.caption || "").trim();
  const captionTop = captionText ? height - Math.floor(height * 0.045) - Math.max(28, Math.floor(titleLayout.fontSize * 0.4)) : height;

  const rect = photoRectFor(width, height, titleBottom, captionTop, state.photoSize, state.photoY);
  drawPhotoInset(ctx, rect, assets.photoImg, state.grade);

  drawCaption(ctx, state.caption, width, height, titleLayout.fontSize);
}
