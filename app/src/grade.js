// Colour grades for Vice Cover Maker covers.
// Each grade is applied with canvas compositing after the photos are drawn:
// a tinted gradient wash plus edge vignette, so the poster look comes from
// light rather than from altering the source photos.

export function applySunsetGrade(ctx, width, height) {
  ctx.save();
  const wash = ctx.createLinearGradient(0, 0, 0, height);
  wash.addColorStop(0, 'rgba(255, 140, 66, 0.18)');
  wash.addColorStop(0.55, 'rgba(233, 79, 122, 0.14)');
  wash.addColorStop(1, 'rgba(60, 16, 72, 0.34)');
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, width, height);
  ctx.globalCompositeOperation = 'soft-light';
  const glow = ctx.createRadialGradient(
    width * 0.5, height * 0.22, 0,
    width * 0.5, height * 0.22, Math.max(width, height) * 0.75,
  );
  glow.addColorStop(0, 'rgba(255, 209, 102, 0.55)');
  glow.addColorStop(1, 'rgba(255, 209, 102, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
  applyVignette(ctx, width, height, 'rgba(20, 6, 24, 0.42)');
}

export function applyNeonGrade(ctx, width, height) {
  ctx.save();
  const split = ctx.createLinearGradient(0, 0, width, height);
  split.addColorStop(0, 'rgba(255, 46, 196, 0.26)');
  split.addColorStop(0.5, 'rgba(90, 20, 140, 0.10)');
  split.addColorStop(1, 'rgba(25, 227, 255, 0.26)');
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = split;
  ctx.fillRect(0, 0, width, height);
  ctx.globalCompositeOperation = 'screen';
  const magenta = ctx.createRadialGradient(
    width * 0.12, height * 0.08, 0,
    width * 0.12, height * 0.08, Math.max(width, height) * 0.7,
  );
  magenta.addColorStop(0, 'rgba(255, 46, 196, 0.28)');
  magenta.addColorStop(1, 'rgba(255, 46, 196, 0)');
  ctx.fillStyle = magenta;
  ctx.fillRect(0, 0, width, height);
  const cyan = ctx.createRadialGradient(
    width * 0.92, height * 0.95, 0,
    width * 0.92, height * 0.95, Math.max(width, height) * 0.7,
  );
  cyan.addColorStop(0, 'rgba(25, 227, 255, 0.26)');
  cyan.addColorStop(1, 'rgba(25, 227, 255, 0)');
  ctx.fillStyle = cyan;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
  applyVignette(ctx, width, height, 'rgba(4, 8, 24, 0.46)');
}

export function applyVignette(ctx, width, height, colour) {
  ctx.save();
  const edge = ctx.createRadialGradient(
    width / 2, height / 2, Math.min(width, height) * 0.42,
    width / 2, height / 2, Math.max(width, height) * 0.78,
  );
  edge.addColorStop(0, 'rgba(0, 0, 0, 0)');
  edge.addColorStop(1, colour);
  ctx.fillStyle = edge;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

export function gradeByName(name, ctx, width, height) {
  if (name === 'neon') {
    applyNeonGrade(ctx, width, height);
  } else {
    applySunsetGrade(ctx, width, height);
  }
}
