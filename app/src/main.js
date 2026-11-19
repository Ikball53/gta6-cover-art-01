// Vice Cover Maker editor wiring.
// Reads chosen photos with FileReader (never uploads), keeps per-panel
// state (image, offset, scale), draws the cover via cover.js and
// grade.js, supports drag-to-move and wheel/slider zoom per panel, and
// exports the canvas as a PNG download at the chosen size.

import { drawCover, panelAtPoint, PANEL_COUNT } from "./cover.js";

const canvas = document.getElementById("coverCanvas");
const ctx = canvas.getContext("2d");
const photoInput = document.getElementById("photoInput");
const captionInput = document.getElementById("captionInput");
const subtitleInput = document.getElementById("subtitleInput");
const gradeSelect = document.getElementById("gradeSelect");
const sizeSelect = document.getElementById("sizeSelect");
const panelSelect = document.getElementById("panelSelect");
const zoomRange = document.getElementById("zoomRange");
const zoomValue = document.getElementById("zoomValue");
const statusLine = document.getElementById("statusLine");

const state = {
  width: 1080,
  height: 1080,
  caption: captionInput.value,
  subtitle: subtitleInput.value,
  grade: gradeSelect.value,
  panels: Array.from({ length: PANEL_COUNT }, () => ({ image: null, offsetX: 0, offsetY: 0, scale: 1 })),
};

let selectedPanel = 0;
let dragging = null;

function setStatus(text) {
  statusLine.textContent = text;
}

function render() {
  canvas.width = state.width;
  canvas.height = state.height;
  drawCover(ctx, state);
}

function syncZoomControl() {
  const pct = Math.round((state.panels[selectedPanel].scale || 1) * 100);
  zoomRange.value = String(pct);
  zoomValue.textContent = pct + "%";
}

function loadImageFromDataUrl(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });
}

function assignPhoto(image, startPanel) {
  // One photo fills every panel; several photos fill panels in order.
  for (let i = 0; i < PANEL_COUNT; i++) {
    const target = state.panels[(startPanel + i) % PANEL_COUNT];
    if (!target.image || i === 0) {
      target.image = image;
      target.offsetX = 0;
      target.offsetY = 0;
      target.scale = 1;
    }
  }
}

photoInput.addEventListener("change", async () => {
  const files = Array.from(photoInput.files || []);
  if (files.length === 0) return;
  setStatus("Loading " + files.length + " photo(s)…");
  try {
    for (let i = 0; i < files.length; i++) {
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(files[i]);
      });
      const img = await loadImageFromDataUrl(dataUrl);
      if (files.length === 1) {
        assignPhoto(img, 0);
      } else {
        const panel = state.panels[i % PANEL_COUNT];
        panel.image = img;
        panel.offsetX = 0;
        panel.offsetY = 0;
        panel.scale = 1;
      }
    }
    render();
    setStatus("Photo(s) loaded. Drag inside a panel to reposition.");
  } catch {
    setStatus("Could not read that photo — please try another file.");
  }
});

async function loadSample(path, label) {
  try {
    const img = await loadImageFromDataUrl(path);
    assignPhoto(img, 0);
    render();
    setStatus(label + " sample loaded into every panel.");
  } catch {
    setStatus("Sample photo could not be loaded.");
  }
}

document.getElementById("useSamplePier").addEventListener("click", () => loadSample("samples/pier.jpg", "Pier"));
document.getElementById("useSampleBoulevard").addEventListener("click", () => loadSample("samples/boulevard.jpg", "Boulevard"));

captionInput.addEventListener("input", () => { state.caption = captionInput.value; render(); });
subtitleInput.addEventListener("input", () => { state.subtitle = subtitleInput.value; render(); });
gradeSelect.addEventListener("change", () => { state.grade = gradeSelect.value; render(); });

sizeSelect.addEventListener("change", () => {
  const [w, h] = sizeSelect.value.split("x").map(Number);
  state.width = w;
  state.height = h;
  render();
});

panelSelect.addEventListener("change", () => {
  selectedPanel = Number(panelSelect.value);
  syncZoomControl();
});

zoomRange.addEventListener("input", () => {
  state.panels[selectedPanel].scale = Number(zoomRange.value) / 100;
  zoomValue.textContent = zoomRange.value + "%";
  render();
});

document.getElementById("centerPanel").addEventListener("click", () => {
  state.panels[selectedPanel].offsetX = 0;
  state.panels[selectedPanel].offsetY = 0;
  render();
});

document.getElementById("fillAll").addEventListener("click", () => {
  const source = state.panels[selectedPanel];
  if (!source.image) {
    setStatus("Load a photo first, then fill every panel.");
    return;
  }
  for (const panel of state.panels) {
    panel.image = source.image;
    panel.offsetX = 0;
    panel.offsetY = 0;
    panel.scale = 1;
  }
  render();
  setStatus("One photo now fills every panel.");
});

function canvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) * (canvas.width / rect.width),
    y: (event.clientY - rect.top) * (canvas.height / rect.height),
  };
}

canvas.addEventListener("pointerdown", (event) => {
  const point = canvasPoint(event);
  const index = panelAtPoint(state.width, state.height, point.x, point.y);
  if (index < 0) return;
  selectedPanel = index;
  panelSelect.value = String(index);
  syncZoomControl();
  dragging = { index, lastX: point.x, lastY: point.y };
  canvas.setPointerCapture(event.pointerId);
});

canvas.addEventListener("pointermove", (event) => {
  if (!dragging) return;
  const point = canvasPoint(event);
  const panel = state.panels[dragging.index];
  panel.offsetX += point.x - dragging.lastX;
  panel.offsetY += point.y - dragging.lastY;
  dragging.lastX = point.x;
  dragging.lastY = point.y;
  render();
});

canvas.addEventListener("pointerup", () => { dragging = null; });
canvas.addEventListener("pointercancel", () => { dragging = null; });

canvas.addEventListener("wheel", (event) => {
  event.preventDefault();
  const panel = state.panels[selectedPanel];
  const next = Math.min(3, Math.max(0.6, (panel.scale || 1) + (event.deltaY < 0 ? 0.05 : -0.05)));
  panel.scale = next;
  syncZoomControl();
  render();
}, { passive: false });

document.getElementById("exportBtn").addEventListener("click", () => {
  render();
  canvas.toBlob((blob) => {
    if (!blob) {
      setStatus("Export failed — please try again.");
      return;
    }
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "vice-cover-" + state.width + "x" + state.height + ".png";
    link.click();
    URL.revokeObjectURL(url);
    setStatus("PNG exported at " + state.width + " x " + state.height + ".");
  }, "image/png");
});

async function bootFromQuery() {
  // Screenshot helper: ?shot=cover|editor&photo=pier|boulevard&caption=…&grade=…
  const params = new URLSearchParams(location.search);
  const photo = params.get("photo");
  const caption = params.get("caption");
  const grade = params.get("grade");
  if (caption) {
    state.caption = caption;
    captionInput.value = caption;
  }
  if (grade === "neon" || grade === "sunset") {
    state.grade = grade;
    gradeSelect.value = grade;
  }
  if (photo === "pier" || photo === "boulevard") {
    await loadSample("samples/" + photo + ".jpg", photo);
  }
  render();
}

if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(() => bootFromQuery());
} else {
  bootFromQuery();
}
render();
