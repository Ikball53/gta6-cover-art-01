// Page wiring for Vice Cover Maker.
// Reads the controls, loads the scene plates and photos from local
// files, and keeps the canvas preview in step with every change.

import { drawCover, COVER_SIZES } from "./cover.js";

const canvas = document.getElementById("coverCanvas");
const sizeSelect = document.getElementById("sizeSelect");
const gradeSelect = document.getElementById("gradeSelect");
const titleInput = document.getElementById("titleInput");
const captionInput = document.getElementById("captionInput");
const photoSizeInput = document.getElementById("photoSize");
const photoYInput = document.getElementById("photoY");
const photoInput = document.getElementById("photoInput");
const exportBtn = document.getElementById("exportBtn");
const statusLine = document.getElementById("statusLine");
const plateButtons = Array.prototype.slice.call(document.querySelectorAll("[data-plate]"));

const PLATE_PATHS = {
  sunset: "plates/sunset.jpg",
  neon: "plates/neon.jpg"
};

const SAMPLE_PATHS = {
  boulevard: "samples/boulevard.jpg",
  pier: "samples/pier.jpg"
};

const state = {
  sizeKey: "landscape",
  plate: "sunset",
  grade: "sunset",
  title: "GRAND THEFT AUTO VI",
  caption: "",
  photoSize: 52,
  photoY: 42
};

const assets = {
  plateImg: null,
  photoImg: null
};

let plateImages = {};
let fontReady = false;

function setStatus(message) {
  statusLine.textContent = message;
}

function render() {
  drawCover(canvas, state, assets);
}

function renderWhenReady() {
  if (fontReady) {
    render();
  }
}

function loadImage(src) {
  return new Promise(function (resolve, reject) {
    const img = new Image();
    img.onload = function () { resolve(img); };
    img.onerror = function () { reject(new Error("Could not load " + src)); };
    img.src = src;
  });
}

function syncPlateButtons() {
  for (const btn of plateButtons) {
    const active = btn.getAttribute("data-plate") === state.plate;
    btn.classList.toggle("is-active", active);
    btn.setAttribute("aria-pressed", active ? "true" : "false");
  }
}

function setPlate(plateKey, followGrade) {
  state.plate = plateKey;
  assets.plateImg = plateImages[plateKey] || null;
  if (followGrade) {
    state.grade = plateKey;
    gradeSelect.value = plateKey;
  }
  syncPlateButtons();
  renderWhenReady();
}

function setPhotoImage(img, label) {
  assets.photoImg = img;
  renderWhenReady();
  if (label) {
    setStatus(label);
  }
}

function loadSample(sampleKey) {
  const path = SAMPLE_PATHS[sampleKey];
  if (!path) {
    return;
  }
  loadImage(path).then(function (img) {
    setPhotoImage(img, "Sample photo loaded. Drag the sliders to frame it.");
  }).catch(function () {
    setStatus("That sample photo could not be loaded.");
  });
}

function loadPhotoFile(file) {
  if (!file || !file.type || file.type.indexOf("image/") !== 0) {
    setStatus("Please choose an image file.");
    return;
  }
  const url = URL.createObjectURL(file);
  loadImage(url).then(function (img) {
    setPhotoImage(img, "Photo loaded. It stays on your machine.");
  }).catch(function () {
    setStatus("That photo could not be read.");
  });
}

function applyQueryParams() {
  const params = new URLSearchParams(window.location.search);
  const sizeParam = params.get("size");
  if (sizeParam && COVER_SIZES[sizeParam]) {
    state.sizeKey = sizeParam;
    sizeSelect.value = sizeParam;
  }
  const plateParam = params.get("plate");
  if (plateParam === "sunset" || plateParam === "neon") {
    state.plate = plateParam;
    state.grade = plateParam;
  }
  const gradeParam = params.get("grade");
  if (gradeParam === "sunset" || gradeParam === "neon" || gradeParam === "none") {
    state.grade = gradeParam;
  }
  gradeSelect.value = state.grade;
  const titleParam = params.get("title");
  if (titleParam !== null) {
    state.title = titleParam;
    titleInput.value = titleParam;
  }
  const captionParam = params.get("caption");
  if (captionParam !== null) {
    state.caption = captionParam;
    captionInput.value = captionParam;
  }
  const sampleParam = params.get("sample");
  if (sampleParam === "boulevard" || sampleParam === "pier") {
    loadSample(sampleParam);
  }
}

function bindControls() {
  sizeSelect.addEventListener("change", function () {
    state.sizeKey = sizeSelect.value;
    renderWhenReady();
  });

  gradeSelect.addEventListener("change", function () {
    state.grade = gradeSelect.value;
    renderWhenReady();
  });

  titleInput.addEventListener("input", function () {
    state.title = titleInput.value;
    renderWhenReady();
  });

  captionInput.addEventListener("input", function () {
    state.caption = captionInput.value;
    renderWhenReady();
  });

  photoSizeInput.addEventListener("input", function () {
    state.photoSize = Number(photoSizeInput.value);
    renderWhenReady();
  });

  photoYInput.addEventListener("input", function () {
    state.photoY = Number(photoYInput.value);
    renderWhenReady();
  });

  for (const btn of plateButtons) {
    btn.addEventListener("click", function () {
      setPlate(btn.getAttribute("data-plate"), true);
    });
  }

  photoInput.addEventListener("change", function () {
    if (photoInput.files && photoInput.files[0]) {
      loadPhotoFile(photoInput.files[0]);
    }
  });

  document.getElementById("sampleBoulevard").addEventListener("click", function () {
    loadSample("boulevard");
  });

  document.getElementById("samplePier").addEventListener("click", function () {
    loadSample("pier");
  });

  exportBtn.addEventListener("click", function () {
    render();
    canvas.toBlob(function (blob) {
      if (!blob) {
        setStatus("Export failed in this browser.");
        return;
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "vice-cover-" + state.sizeKey + ".png";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
      setStatus("PNG exported at " + canvas.width + " x " + canvas.height + ".");
    }, "image/png");
  });

  window.addEventListener("dragover", function (event) {
    event.preventDefault();
    document.body.classList.add("dragging");
  });

  window.addEventListener("dragleave", function (event) {
    if (!event.relatedTarget) {
      document.body.classList.remove("dragging");
    }
  });

  window.addEventListener("drop", function (event) {
    event.preventDefault();
    document.body.classList.remove("dragging");
    const files = event.dataTransfer ? event.dataTransfer.files : null;
    if (files && files[0]) {
      loadPhotoFile(files[0]);
    }
  });
}

function start() {
  applyQueryParams();
  bindControls();
  syncPlateButtons();

  const plateLoads = Object.keys(PLATE_PATHS).map(function (key) {
    return loadImage(PLATE_PATHS[key]).then(function (img) {
      plateImages[key] = img;
    }).catch(function () {
      plateImages[key] = null;
    });
  });

  const fontLoad = document.fonts && document.fonts.load
    ? document.fonts.load("400 64px Anton").then(function () {
        return document.fonts.ready;
      })
    : Promise.resolve();

  Promise.all(plateLoads.concat([fontLoad])).then(function () {
    fontReady = true;
    assets.plateImg = plateImages[state.plate] || null;
    render();
    setStatus("Ready. Add a photo, then export your cover.");
  }).catch(function () {
    fontReady = true;
    render();
  });
}

start();
