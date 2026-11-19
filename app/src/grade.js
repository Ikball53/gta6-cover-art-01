// Colour grading for the cover canvas.
// Grades are built from a canvas filter on the background plate plus
// overlay gradients, so they stay fast and work in every browser.

export function plateFilterForGrade(gradeName) {
  if (gradeName === "sunset") {
    return "saturate(1.18) contrast(1.05) brightness(1.02) sepia(0.16)";
  }
  if (gradeName === "neon") {
    return "saturate(1.22) contrast(1.08) brightness(1.0) hue-rotate(-6deg)";
  }
  return "none";
}

export function photoFilterForGrade(gradeName) {
  if (gradeName === "sunset") {
    return "saturate(1.12) contrast(1.04) sepia(0.08)";
  }
  if (gradeName === "neon") {
    return "saturate(1.14) contrast(1.06)";
  }
  return "none";
}

function fillRect(ctx, width, height, style, composite, alpha) {
  ctx.save();
  ctx.globalCompositeOperation = composite;
  ctx.globalAlpha = alpha;
  ctx.fillStyle = style;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

function applySunsetGrade(ctx, width, height) {
  const skyGlow = ctx.createLinearGradient(0, 0, 0, height);
  skyGlow.addColorStop(0, "rgba(255, 105, 150, 0.55)");
  skyGlow.addColorStop(0.45, "rgba(255, 140, 70, 0.35)");
  skyGlow.addColorStop(1, "rgba(90, 30, 90, 0.30)");
  fillRect(ctx, width, height, skyGlow, "soft-light", 0.85);

  const sunWash = ctx.createRadialGradient(
    width * 0.5, height * 0.34, 0,
    width * 0.5, height * 0.34, Math.max(width, height) * 0.75
  );
  sunWash.addColorStop(0, "rgba(255, 180, 90, 0.35)");
  sunWash.addColorStop(1, "rgba(255, 180, 90, 0)");
  fillRect(ctx, width, height, sunWash, "overlay", 0.55);
}

function applyNeonGrade(ctx, width, height) {
  const split = ctx.createLinearGradient(0, 0, width, height);
  split.addColorStop(0, "rgba(0, 190, 200, 0.45)");
  split.addColorStop(0.55, "rgba(40, 40, 90, 0.18)");
  split.addColorStop(1, "rgba(230, 40, 170, 0.45)");
  fillRect(ctx, width, height, split, "soft-light", 0.9);

  const glow = ctx.createRadialGradient(
    width * 0.3, height * 0.6, 0,
    width * 0.3, height * 0.6, Math.max(width, height) * 0.8
  );
  glow.addColorStop(0, "rgba(0, 220, 230, 0.22)");
  glow.addColorStop(1, "rgba(0, 220, 230, 0)");
  fillRect(ctx, width, height, glow, "overlay", 0.5);
}

export function applyVignette(ctx, width, height, strength) {
  const radius = Math.max(width, height) * 0.72;
  const shade = ctx.createRadialGradient(
    width / 2, height / 2, radius * 0.45,
    width / 2, height / 2, radius
  );
  shade.addColorStop(0, "rgba(0, 0, 0, 0)");
  shade.addColorStop(1, "rgba(0, 0, 0, " + strength + ")");
  fillRect(ctx, width, height, shade, "source-over", 1);
}

export function applyGrade(ctx, width, height, gradeName) {
  if (gradeName === "sunset") {
    applySunsetGrade(ctx, width, height);
  } else if (gradeName === "neon") {
    applyNeonGrade(ctx, width, height);
  }
  applyVignette(ctx, width, height, 0.32);
}
