// Colour grades for Vice Cover Maker.
// Each grade is applied with canvas compositing after the photos are drawn:
// overlay gradients plus a soft-light wash, so the photo detail stays visible.

export function applySunsetGrade(ctx, width, height) {
  ctx.save();

  // Warm sky-to-sea gradient: amber at the top, rose in the middle, plum below.
  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, "rgba(255, 154, 61, 0.34)");
  sky.addColorStop(0.45, "rgba(255, 78, 122, 0.26)");
  sky.addColorStop(1, "rgba(58, 16, 84, 0.38)");
  ctx.globalCompositeOperation = "overlay";
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  // Sun glow from the upper corner.
  const glow = ctx.createRadialGradient(width * 0.78, height * 0.12, 0, width * 0.78, height * 0.12, width * 0.75);
  glow.addColorStop(0, "rgba(255, 214, 120, 0.45)");
  glow.addColorStop(1, "rgba(255, 214, 120, 0)");
  ctx.globalCompositeOperation = "soft-light";
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);

  // Gentle vignette to push the caption band forward.
  const shade = ctx.createLinearGradient(0, height * 0.55, 0, height);
  shade.addColorStop(0, "rgba(10, 4, 20, 0)");
  shade.addColorStop(1, "rgba(10, 4, 20, 0.42)");
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, width, height);

  ctx.restore();
}

export function applyNeonGrade(ctx, width, height) {
  ctx.save();

  // Magenta from the left, cyan from the right — classic night-neon split.
  const split = ctx.createLinearGradient(0, 0, width, 0);
  split.addColorStop(0, "rgba(255, 46, 166, 0.30)");
  split.addColorStop(0.5, "rgba(90, 20, 160, 0.12)");
  split.addColorStop(1, "rgba(39, 230, 255, 0.30)");
  ctx.globalCompositeOperation = "overlay";
  ctx.fillStyle = split;
  ctx.fillRect(0, 0, width, height);

  // Deep night wash at the bottom for caption contrast.
  const night = ctx.createLinearGradient(0, 0, 0, height);
  night.addColorStop(0, "rgba(8, 6, 40, 0.10)");
  night.addColorStop(1, "rgba(8, 6, 40, 0.48)");
  ctx.globalCompositeOperation = "soft-light";
  ctx.fillStyle = night;
  ctx.fillRect(0, 0, width, height);

  const shade = ctx.createLinearGradient(0, height * 0.55, 0, height);
  shade.addColorStop(0, "rgba(4, 2, 16, 0)");
  shade.addColorStop(1, "rgba(4, 2, 16, 0.46)");
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, width, height);

  ctx.restore();
}

export function applyGrade(ctx, gradeName, width, height) {
  if (gradeName === "neon") {
    applyNeonGrade(ctx, width, height);
  } else {
    applySunsetGrade(ctx, width, height);
  }
}
