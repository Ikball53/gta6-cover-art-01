// Cover composition for Vice Cover Maker.
// A multi-panel poster: one large panel on the left and two smaller panels
// stacked on the right, thin dark gaps between them, and bold caption
// lettering across the bottom band.

export function panelLayout(width, height) {
  const gap = Math.max(6, Math.round(Math.min(width, height) * 0.012));
  const captionBand = Math.round(height * 0.2);
  const artHeight = height - captionBand;
  const mainWidth = Math.round(width * 0.62);
  const sideWidth = width - mainWidth - gap;
  const sideHeight = Math.floor((artHeight - gap) / 2);
  return [
    { x: 0, y: 0, w: mainWidth, h: artHeight },
    { x: mainWidth + gap, y: 0, w: sideWidth, h: sideHeight },
    { x: mainWidth + gap, y: sideHeight + gap, w: sideWidth, h: artHeight - sideHeight - gap },
  ];
}

export function drawPhotoInPanel(ctx, panelState, rect) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  const image = panelState.image;
  if (image) {
    const coverScale = Math.max(rect.w / image.naturalWidth, rect.h / image.naturalHeight);
    const scale = coverScale * panelState.scale;
    const drawW = image.naturalWidth * scale;
    const drawH = image.naturalHeight * scale;
    const drawX = rect.x + (rect.w - drawW) / 2 + panelState.offsetX;
    const drawY = rect.y + (rect.h - drawH) / 2 + panelState.offsetY;
    ctx.drawImage(image, drawX, drawY, drawW, drawH);
  } else {
    const placeholder = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
    placeholder.addColorStop(0, '#3a2d52');
    placeholder.addColorStop(1, '#171221');
    ctx.fillStyle = placeholder;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.fillStyle = 'rgba(245, 238, 252, 0.75)';
    ctx.font = `600 ${Math.max(14, Math.round(rect.w * 0.055))}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Add a photo', rect.x + rect.w / 2, rect.y + rect.h / 2);
  }
  ctx.restore();
}

export function drawPanelBorders(ctx, panels, width, height) {
  ctx.save();
  ctx.strokeStyle = 'rgba(8, 4, 14, 0.9)';
  ctx.lineWidth = Math.max(2, Math.round(Math.min(width, height) * 0.004));
  for (const rect of panels) {
    ctx.strokeRect(rect.x + 1, rect.y + 1, rect.w - 2, rect.h - 2);
  }
  ctx.restore();
}

export function fitCaptionFont(ctx, text, maxWidth, startSize) {
  let size = startSize;
  const family = '"Anton", "Arial Black", sans-serif';
  ctx.font = `${size}px ${family}`;
  while (size > 12 && ctx.measureText(text).width > maxWidth) {
    size -= 2;
    ctx.font = `${size}px ${family}`;
  }
  return size;
}

export function drawCaption(ctx, width, height, caption, subtitle, gradeName) {
  const bandTop = height - Math.round(height * 0.2);
  ctx.save();
  const band = ctx.createLinearGradient(0, bandTop, 0, height);
  if (gradeName === 'neon') {
    band.addColorStop(0, 'rgba(10, 6, 26, 0)');
    band.addColorStop(0.35, 'rgba(10, 6, 26, 0.88)');
    band.addColorStop(1, 'rgba(6, 4, 18, 0.97)');
  } else {
    band.addColorStop(0, 'rgba(26, 8, 20, 0)');
    band.addColorStop(0.35, 'rgba(26, 8, 20, 0.88)');
    band.addColorStop(1, 'rgba(14, 4, 14, 0.97)');
  }
  ctx.fillStyle = band;
  ctx.fillRect(0, bandTop, width, height - bandTop);

  const title = (caption || 'VICE CITY').toUpperCase();
  const sub = (subtitle || '').toUpperCase();
  const maxWidth = width * 0.92;
  const startSize = Math.round(height * 0.085);
  const titleSize = fitCaptionFont(ctx, title, maxWidth, startSize);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
  ctx.shadowBlur = Math.round(titleSize * 0.12);
  ctx.shadowOffsetY = Math.round(titleSize * 0.05);
  const titleFill = ctx.createLinearGradient(0, bandTop, 0, height);
  if (gradeName === 'neon') {
    titleFill.addColorStop(0, '#ffe6fb');
    titleFill.addColorStop(0.55, '#ff2ec4');
    titleFill.addColorStop(1, '#19e3ff');
  } else {
    titleFill.addColorStop(0, '#fff3d6');
    titleFill.addColorStop(0.55, '#ffb35c');
    titleFill.addColorStop(1, '#e94f7a');
  }
  ctx.fillStyle = titleFill;
  const titleY = bandTop + (height - bandTop) * (sub ? 0.42 : 0.52);
  ctx.fillText(title, width / 2, titleY);
  if (sub) {
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    ctx.fillStyle = 'rgba(245, 238, 252, 0.92)';
    ctx.font = `600 ${Math.max(12, Math.round(titleSize * 0.3))}px system-ui, sans-serif`;
    ctx.fillText(sub, width / 2, bandTop + (height - bandTop) * 0.78);
  }
  ctx.restore();
}

export function drawCover(ctx, width, height, panelStates, caption, subtitle, gradeName, applyGrade) {
  ctx.save();
  ctx.fillStyle = '#0b0714';
  ctx.fillRect(0, 0, width, height);
  const panels = panelLayout(width, height);
  panels.forEach((rect, index) => {
    drawPhotoInPanel(ctx, panelStates[index] ?? { image: null, offsetX: 0, offsetY: 0, scale: 1 }, rect);
  });
  applyGrade(ctx, width, height);
  drawPanelBorders(ctx, panels, width, height);
  drawCaption(ctx, width, height, caption, subtitle, gradeName);
  ctx.restore();
}
