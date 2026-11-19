// Colour-grade helpers for the cover painter.
// Two small filter lookups plus one overlay painter. Everything here is
// pure canvas work: no state is kept between calls, so the same inputs
// always produce the same pixels.

// Filter applied to the full-bleed scene plate before overlays go on.
export function plateFilter(grade) {
  if (grade === 'sunset') {
    return 'saturate(1.18) contrast(1.04) brightness(1.02) sepia(0.22)';
  }
  if (grade === 'neon') {
    return 'saturate(1.45) contrast(1.16) brightness(1.03) hue-rotate(-8deg)';
  }
  return 'none';
}

// Gentler version of the same idea for the user's photo inset, so faces
// and detail stay readable while still sitting inside the scene's light.
export function photoFilter(grade) {
  if (grade === 'sunset') {
    return 'saturate(1.08) contrast(1.02) sepia(0.12)';
  }
  if (grade === 'neon') {
    return 'saturate(1.18) contrast(1.07) hue-rotate(-4deg)';
  }
  return 'none';
}

function vignette(ctx, w, h) {
  const cx = w / 2;
  const cy = h / 2;
  const outer = Math.hypot(cx, cy);
  const g = ctx.createRadialGradient(cx, cy, outer * 0.42, cx, cy, outer);
  g.addColorStop(0, 'rgba(0, 0, 0, 0)');
  g.addColorStop(0.72, 'rgba(0, 0, 0, 0.08)');
  g.addColorStop(1, 'rgba(0, 0, 0, 0.42)');
  ctx.save();
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

function sunsetWash(ctx, w, h) {
  ctx.save();
  ctx.globalCompositeOperation = 'soft-light';
  const wash = ctx.createLinearGradient(0, 0, 0, h);
  wash.addColorStop(0, 'rgba(255, 92, 168, 0.85)');
  wash.addColorStop(0.38, 'rgba(255, 140, 66, 0.8)');
  wash.addColorStop(0.72, 'rgba(255, 94, 98, 0.65)');
  wash.addColorStop(1, 'rgba(96, 44, 160, 0.85)');
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();

  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  const glow = ctx.createRadialGradient(
    w * 0.5, h * 0.62, 0,
    w * 0.5, h * 0.62, Math.max(w, h) * 0.62,
  );
  glow.addColorStop(0, 'rgba(255, 176, 92, 0.34)');
  glow.addColorStop(0.45, 'rgba(255, 120, 92, 0.14)');
  glow.addColorStop(1, 'rgba(255, 120, 92, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

function neonWash(ctx, w, h) {
  ctx.save();
  ctx.globalCompositeOperation = 'soft-light';
  const split = ctx.createLinearGradient(0, 0, w, h);
  split.addColorStop(0, 'rgba(20, 230, 220, 0.9)');
  split.addColorStop(0.42, 'rgba(24, 60, 180, 0.85)');
  split.addColorStop(0.72, 'rgba(70, 24, 150, 0.8)');
  split.addColorStop(1, 'rgba(230, 40, 180, 0.9)');
  ctx.fillStyle = split;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();

  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  const glow = ctx.createRadialGradient(
    w * 0.28, h * 0.3, 0,
    w * 0.28, h * 0.3, Math.max(w, h) * 0.58,
  );
  glow.addColorStop(0, 'rgba(32, 235, 225, 0.3)');
  glow.addColorStop(0.5, 'rgba(32, 160, 255, 0.12)');
  glow.addColorStop(1, 'rgba(32, 160, 255, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

// Paint the grade's light over whatever is already on the canvas.
// The vignette always runs, even when the grade itself is 'none'.
export function applyGrade(ctx, w, h, grade) {
  if (grade === 'sunset') sunsetWash(ctx, w, h);
  else if (grade === 'neon') neonWash(ctx, w, h);
  vignette(ctx, w, h);
}
