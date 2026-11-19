// Cover composition for Vice Cover Maker.
// A multi-panel poster: one large hero panel on the left, three smaller
// stacked panels on the right, bold caption lettering across the bottom.
// Every panel photo is cropped to fill its panel (cover-fit) with a
// per-panel offset and scale the editor controls.

import { applyGrade } from "./grade.js";

export const PANEL_COUNT = 4;
const GAP = 10;

export function panelRects(width, height) {
  // Caption band occupies the bottom 24% of the cover.
  const bandH = Math.round(height * 0.24);
  const artH = height - bandH;
  const heroW = Math.round(width * 0.62);
  const sideX = heroW + GAP;
  const sideW = width - sideX;
  const sideH = Math.floor((artH - GAP * 2) / 3);
  return [
    { x: 0, y: 0, w: heroW, h: artH },
    { x: sideX, y: 0, w: sideW, h: sideH },
    { x: sideX, y: sideH + GAP, w: sideW, h: sideH },
    { x: sideX, y: (sideH + GAP) * 2, w: sideW, h: artH - (sideH + GAP) * 2 },
  ];
}

export function panelAtPoint(width, height, px, py) {
  const rects = panelRects(width, height);
  for (let i = 0; i < rects.length; i++) {
    const r = rects[i];
    if (px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h) return i;
  }
  return -1;
}

export function drawPanelPhoto(ctx, panel, rect) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();

  if (!panel || !panel.image) {
    // Empty panel: deep plum placeholder with a diagonal sheen.
    const fill = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w, rect.y + rect.h);
    fill.addColorStop(0, "#2a1748");
    fill.addColorStop(1, "#150a26");
    ctx.fillStyle = fill;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.restore();
    return;
  }

  const img = panel.image;
  const scale = Math.max(rect.w / img.width, rect.h / img.height) * (panel.scale || 1);
  const dw = img.width * scale;
  const dh = img.height * scale;
  const dx = rect.x + (rect.w - dw) / 2 + (panel.offsetX || 0);
  const dy = rect.y + (rect.h - dh) / 2 + (panel.offsetY || 0);
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
}

export function drawPanelBorders(ctx, width, height) {
  const rects = panelRects(width, height);
  ctx.save();
  ctx.strokeStyle = "rgba(246, 236, 255, 0.9)";
  ctx.lineWidth = Math.max(3, Math.round(width * 0.004));
  for (const r of rects) {
    ctx.strokeRect(r.x + ctx.lineWidth / 2, r.y + ctx.lineWidth / 2, r.w - ctx.lineWidth, r.h - ctx.lineWidth);
  }
  ctx.restore();
}

export function drawCaption(ctx, width, height, caption, subtitle, gradeName) {
  const bandH = Math.round(height * 0.24);
  const bandY = height - bandH;
  ctx.save();

  // Caption band backdrop.
  const band = ctx.createLinearGradient(0, bandY, width, height);
  if (gradeName === "neon") {
    band.addColorStop(0, "#120826");
    band.addColorStop(1, "#2b0a3a");
  } else {
    band.addColorStop(0, "#2b1030");
    band.addColorStop(1, "#571d3d");
  }
  ctx.fillStyle = band;
  ctx.fillRect(0, bandY, width, bandH);

  // Accent rule above the title.
  const rule = ctx.createLinearGradient(0, 0, width, 0);
  rule.addColorStop(0, "#ff9a3d");
  rule.addColorStop(0.5, "#ff4e7a");
  rule.addColorStop(1, "#27e6ff");
  ctx.fillStyle = rule;
  ctx.fillRect(0, bandY, width, Math.max(4, Math.round(height * 0.006)));

  const title = (caption || "VICE COVER").toUpperCase();
  let fontSize = Math.round(bandH * 0.52);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const setTitleFont = (size) => { ctx.font = size + "px Anton, Impact, sans-serif"; };
  setTitleFont(fontSize);
  const maxW = width * 0.92;
  while (ctx.measureText(title).width > maxW && fontSize > 12) {
    fontSize -= 4;
    setTitleFont(fontSize);
  }

  const titleY = subtitle ? bandY + bandH * 0.42 : bandY + bandH * 0.52;
  ctx.lineWidth = Math.max(2, fontSize * 0.06);
  ctx.strokeStyle = "rgba(10, 4, 20, 0.85)";
  ctx.strokeText(title, width / 2, titleY);
  const titleGrad = ctx.createLinearGradient(0, titleY - fontSize / 2, 0, titleY + fontSize / 2);
  titleGrad.addColorStop(0, "#fff3d6");
  titleGrad.addColorStop(0.55, "#ffb35c");
  titleGrad.addColorStop(1, "#ff4e7a");
  ctx.fillStyle = titleGrad;
  ctx.fillText(title, width / 2, titleY);

  if (subtitle) {
    const subSize = Math.max(12, Math.round(bandH * 0.16));
    ctx.font = subSize + "px Anton, Impact, sans-serif";
    ctx.fillStyle = "#f6ecff";
    ctx.fillText(subtitle.toUpperCase(), width / 2, bandY + bandH * 0.78);
  }
  ctx.restore();
}

export function drawCover(ctx, state) {
  const { width, height, panels, caption, subtitle, grade } = state;
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#0a0514";
  ctx.fillRect(0, 0, width, height);

  const rects = panelRects(width, height);
  for (let i = 0; i < PANEL_COUNT; i++) {
    drawPanelPhoto(ctx, panels[i], rects[i]);
  }
  applyGrade(ctx, grade, width, height - Math.round(height * 0.24));
  drawPanelBorders(ctx, width, height);
  drawCaption(ctx, width, height, caption, subtitle, grade);
}
