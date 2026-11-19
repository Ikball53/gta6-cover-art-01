// Page wiring for the Vice Cover Maker editor.
// Keeps one small state object, loads the scene plates and the display
// font up front, repaints on every control change, and exports the
// canvas as a PNG. Everything runs locally — no network calls beyond
// the app's own static files.
import { COVER_SIZES, drawCover } from './cover.js';

const canvas = document.getElementById('coverCanvas');
const sizePick = document.getElementById('sizePick');
const gradePick = document.getElementById('gradePick');
const titleField = document.getElementById('titleField');
const captionField = document.getElementById('captionField');
const photoScale = document.getElementById('photoScale');
const photoLift = document.getElementById('photoLift');
const choosePhotoBtn = document.getElementById('choosePhotoBtn');
const photoInput = document.getElementById('photoInput');
const sampleBoulevardBtn = document.getElementById('sampleBoulevard');
const samplePierBtn = document.getElementById('samplePier');
const exportBtn = document.getElementById('exportBtn');
const statusLine = document.getElementById('statusLine');
const plateButtons = Array.from(document.querySelectorAll('.seg-btn[data-plate]'));

const state = {
  sizeKey: 'landscape',
  plateKey: 'sunset',
  grade: 'sunset',
  title: titleField.value,
  caption: '',
  photoSize: Number(photoScale.value),
  photoY: Number(photoLift.value),
};

const assets = {
  plates: { sunset: null, neon: null },
  photo: null,
};

let shotMode = null;

function say(message) {
  statusLine.textContent = message;
}

function render() {
  drawCover(canvas, state, assets);
  if (shotMode) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.__shotReady = true;
      });
    });
  }
}

function loadImage(src) {
  return new Promise((resolvePromise, rejectPromise) => {
    const img = new Image();
    img.onload = () => resolvePromise(img);
    img.onerror = () => rejectPromise(new Error(`Could not load ${src}`));
    img.src = src;
  });
}

function loadPhotoFromUrl(src, label) {
  return loadImage(src)
    .then((img) => {
      assets.photo = img;
      render();
      say(label);
    })
    .catch(() => {
      say('That photo could not be loaded. Try another image file.');
    });
}

function loadPhotoFromFile(file) {
  if (!file || !file.type.startsWith('image/')) {
    say('Please choose an image file for the photo.');
    return;
  }
  const url = URL.createObjectURL(file);
  loadImage(url)
    .then((img) => {
      assets.photo = img;
      render();
      say(`Photo loaded: ${file.name}. Looking sharp — export when ready.`);
    })
    .catch(() => {
      say('That photo could not be loaded. Try another image file.');
    })
    .finally(() => URL.revokeObjectURL(url));
}

function setPlate(key, syncGrade) {
  if (key !== 'sunset' && key !== 'neon') return;
  state.plateKey = key;
  if (syncGrade) {
    state.grade = key;
    gradePick.value = key;
  }
  for (const btn of plateButtons) {
    const active = btn.dataset.plate === key;
    btn.classList.toggle('is-active', active);
    btn.setAttribute('aria-pressed', active ? 'true' : 'false');
  }
}

function applyQuery() {
  const params = new URLSearchParams(window.location.search);
  const size = params.get('size');
  if (size && Object.hasOwn(COVER_SIZES, size)) {
    state.sizeKey = size;
    sizePick.value = size;
  }
  const plate = params.get('plate');
  if (plate === 'sunset' || plate === 'neon') setPlate(plate, false);
  const grade = params.get('grade');
  if (grade === 'sunset' || grade === 'neon' || grade === 'none') {
    state.grade = grade;
    gradePick.value = grade;
  }
  const title = params.get('title');
  if (title !== null) {
    state.title = title.slice(0, 60);
    titleField.value = state.title;
  }
  const caption = params.get('caption');
  if (caption !== null) {
    state.caption = caption.slice(0, 48);
    captionField.value = state.caption;
  }
  const shot = params.get('shot');
  if (shot === 'cover' || shot === 'editor') {
    shotMode = shot;
    if (shot === 'cover') document.body.classList.add('shot-cover');
  }
  const sample = params.get('sample');
  const photo = params.get('photo');
  const wanted = photo || sample;
  if (wanted && /^[a-z0-9-]+$/i.test(wanted)) {
    return loadPhotoFromUrl(`samples/${wanted}.jpg`, `Sample photo loaded: ${wanted}.`);
  }
  return Promise.resolve();
}

sizePick.addEventListener('change', () => {
  state.sizeKey = sizePick.value;
  render();
});

gradePick.addEventListener('change', () => {
  state.grade = gradePick.value;
  render();
});

titleField.addEventListener('input', () => {
  state.title = titleField.value;
  render();
});

captionField.addEventListener('input', () => {
  state.caption = captionField.value;
  render();
});

photoScale.addEventListener('input', () => {
  state.photoSize = Number(photoScale.value);
  render();
});

photoLift.addEventListener('input', () => {
  state.photoY = Number(photoLift.value);
  render();
});

for (const btn of plateButtons) {
  btn.addEventListener('click', () => {
    setPlate(btn.dataset.plate, true);
    render();
  });
}

choosePhotoBtn.addEventListener('click', () => photoInput.click());

photoInput.addEventListener('change', () => {
  const [file] = photoInput.files;
  if (file) loadPhotoFromFile(file);
  photoInput.value = '';
});

sampleBoulevardBtn.addEventListener('click', () => {
  loadPhotoFromUrl('samples/boulevard.jpg', 'Sample photo loaded: boulevard.');
});

samplePierBtn.addEventListener('click', () => {
  loadPhotoFromUrl('samples/pier.jpg', 'Sample photo loaded: pier.');
});

let dragDepth = 0;
window.addEventListener('dragenter', (event) => {
  event.preventDefault();
  dragDepth += 1;
  document.body.classList.add('dragging');
});
window.addEventListener('dragover', (event) => {
  event.preventDefault();
});
window.addEventListener('dragleave', (event) => {
  event.preventDefault();
  dragDepth = Math.max(0, dragDepth - 1);
  if (dragDepth === 0) document.body.classList.remove('dragging');
});
window.addEventListener('drop', (event) => {
  event.preventDefault();
  dragDepth = 0;
  document.body.classList.remove('dragging');
  const file = event.dataTransfer && event.dataTransfer.files[0];
  if (file) loadPhotoFromFile(file);
});

exportBtn.addEventListener('click', () => {
  render();
  canvas.toBlob((blob) => {
    if (!blob) {
      say('Export failed — please try again.');
      return;
    }
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vice-cover-${state.sizeKey}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    say(`Exported PNG at ${canvas.width} x ${canvas.height}. Check your downloads.`);
  }, 'image/png');
});

async function start() {
  say('Loading scenes and type…');
  const fontReady = Promise.race([
    (async () => {
      try {
        await document.fonts.load('400 80px Anton');
        await document.fonts.ready;
      } catch {
        // Fall back to the system stack; the cover still renders.
      }
    })(),
    new Promise((resolvePromise) => setTimeout(resolvePromise, 2500)),
  ]);
  const platesReady = Promise.allSettled([
    loadImage('plates/sunset.jpg').then((img) => { assets.plates.sunset = img; }),
    loadImage('plates/neon.jpg').then((img) => { assets.plates.neon = img; }),
  ]);
  await Promise.all([fontReady, platesReady]);
  render();
  say('Ready. Add a photo, tweak the words, then export your cover.');
  await applyQuery();
  render();
}

start().catch(() => {
  render();
  say('Something hiccuped while loading, but the editor is still usable.');
});
