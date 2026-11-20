// Vice Cover Maker editor wiring.
// Photos are read locally with FileReader and drawn on the canvas; nothing
// is uploaded anywhere. Export renders the same drawing at full size and
// downloads it as a PNG.

import { drawCover, panelLayout } from './cover.js';
import { gradeByName } from './grade.js';

const canvas = document.getElementById('coverCanvas');
const ctx = canvas.getContext('2d');
const photoInput = document.getElementById('photoInput');
const sizeSelect = document.getElementById('sizeSelect');
const gradeSelect = document.getElementById('gradeSelect');
const captionInput = document.getElementById('captionInput');
const subtitleInput = document.getElementById('subtitleInput');
const panelSelect = document.getElementById('panelSelect');
const zoomRange = document.getElementById('zoomRange');
const exportButton = document.getElementById('exportButton');

const panelStates = [0, 1, 2].map(() => ({
  image: null,
  offsetX: 0,
  offsetY: 0,
  scale: 1,
}));

function exportSize() {
  const parts = sizeSelect.value.split('x');
  return { width: Number(parts[0]), height: Number(parts[1]) };
}

function render() {
  const { width, height } = exportSize();
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  drawCover(
    ctx,
    width,
    height,
    panelStates,
    captionInput.value,
    subtitleInput.value,
    gradeSelect.value,
    (c, w, h) => gradeByName(gradeSelect.value, c, w, h),
  );
}

function loadPhotoFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error('image failed to load'));
      image.onload = () => resolve(image);
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

photoInput.addEventListener('change', async () => {
  const files = Array.from(photoInput.files ?? []);
  if (files.length === 0) return;
  const images = [];
  for (const file of files.slice(0, 3)) {
    try {
      images.push(await loadPhotoFile(file));
    } catch {
      // Skip a file the browser cannot decode; the rest still load.
    }
  }
  if (images.length === 0) return;
  panelStates.forEach((state, index) => {
    state.image = images[index % images.length];
    state.offsetX = 0;
    state.offsetY = 0;
    state.scale = 1;
  });
  zoomRange.value = '1';
  render();
});

sizeSelect.addEventListener('change', render);
gradeSelect.addEventListener('change', render);
captionInput.addEventListener('input', render);
subtitleInput.addEventListener('input', render);

panelSelect.addEventListener('change', () => {
  const state = panelStates[Number(panelSelect.value)];
  if (state) zoomRange.value = String(state.scale);
});

zoomRange.addEventListener('input', () => {
  const state = panelStates[Number(panelSelect.value)];
  if (state) {
    state.scale = Number(zoomRange.value);
    render();
  }
});

let dragState = null;

function canvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * canvas.width,
    y: ((event.clientY - rect.top) / rect.height) * canvas.height,
  };
}

canvas.addEventListener('pointerdown', (event) => {
  const point = canvasPoint(event);
  const panels = panelLayout(canvas.width, canvas.height);
  const index = panels.findIndex(
    (rect) => point.x >= rect.x && point.x <= rect.x + rect.w && point.y >= rect.y && point.y <= rect.y + rect.h,
  );
  if (index < 0) return;
  panelSelect.value = String(index);
  const state = panelStates[index];
  zoomRange.value = String(state.scale);
  dragState = { index, startX: point.x, startY: point.y, baseX: state.offsetX, baseY: state.offsetY };
  canvas.setPointerCapture(event.pointerId);
});

canvas.addEventListener('pointermove', (event) => {
  if (!dragState) return;
  const point = canvasPoint(event);
  const state = panelStates[dragState.index];
  state.offsetX = dragState.baseX + (point.x - dragState.startX);
  state.offsetY = dragState.baseY + (point.y - dragState.startY);
  render();
});

canvas.addEventListener('pointerup', () => {
  dragState = null;
});

canvas.addEventListener('pointercancel', () => {
  dragState = null;
});

exportButton.addEventListener('click', () => {
  render();
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'vice-cover.png';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }, 'image/png');
});

render();
