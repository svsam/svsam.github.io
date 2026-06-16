const surface = document.getElementById("boardSurface");
const pinForm = document.getElementById("pinForm");
const pinTitle = document.getElementById("pinTitle");
const pinDescription = document.getElementById("pinDescription");
const pinImage = document.getElementById("pinImage");
const imagePreview = document.getElementById("imagePreview");
const imagePreviewImg = document.getElementById("imagePreviewImg");
const savePinButton = document.getElementById("savePinButton");
const emptyBoardHint = document.getElementById("emptyBoardHint");
const boardStatus = document.getElementById("boardStatus");

const storageKey = "svsam.board.freeformBoard.v2";
const maxZIndex = 2147483647;
const minPinWidth = 220;
const minPinHeight = 190;
const defaultPinWidth = 280;
const defaultPinHeight = 300;

let state = loadState();
let selectedImageData = "";
let activeInteraction = null;

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (!saved || typeof saved !== "object") return { pins: [] };

    return {
      pins: Array.isArray(saved.pins) ? saved.pins.map(normalizePin) : [],
    };
  } catch (error) {
    return { pins: [] };
  }
}

function normalizePin(pin, index) {
  return {
    id: typeof pin.id === "string" ? pin.id : makeId(),
    title: typeof pin.title === "string" ? pin.title : "Untitled scrap",
    description: typeof pin.description === "string" ? pin.description : "",
    image: typeof pin.image === "string" ? pin.image : "",
    x: Number.isFinite(pin.x) ? pin.x : 420 + index * 24,
    y: Number.isFinite(pin.y) ? pin.y : 180 + index * 28,
    width: Number.isFinite(pin.width) ? Math.max(minPinWidth, pin.width) : defaultPinWidth,
    height: Number.isFinite(pin.height) ? Math.max(minPinHeight, pin.height) : defaultPinHeight,
    z: Number.isFinite(pin.z) ? pin.z : index + 20,
    rotation: Number.isFinite(pin.rotation) ? pin.rotation : makeRotation(index),
  };
}

function saveState() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(state));
  } catch (error) {
    setStatus(
      "The board still works, but this browser could not save the latest layout.",
    );
  }
}

function makeId() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return `pin-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function makeRotation(index) {
  return ((index % 9) - 4) * 0.85;
}

function setStatus(message) {
  boardStatus.textContent = message;
}

function findPin(id) {
  return state.pins.find((pin) => pin.id === id);
}

function updateEmptyState() {
  emptyBoardHint.hidden = state.pins.length > 0;
}

function updateSurfaceSize() {
  const maxRight = state.pins.reduce(
    (right, pin) => Math.max(right, pin.x + pin.width + 120),
    window.innerWidth,
  );
  const maxBottom = state.pins.reduce(
    (bottom, pin) => Math.max(bottom, pin.y + pin.height + 120),
    window.innerHeight,
  );

  surface.style.minWidth = `${Math.max(window.innerWidth, maxRight)}px`;
  surface.style.minHeight = `${Math.max(window.innerHeight, maxBottom)}px`;
}

function showImagePreview(imageData, label = "Image ready") {
  selectedImageData = imageData;
  imagePreviewImg.src = imageData;
  imagePreviewImg.alt = label;
  imagePreview.querySelector("span").textContent = label;
  imagePreview.hidden = false;
}

function clearImagePreview() {
  selectedImageData = "";
  imagePreviewImg.removeAttribute("src");
  imagePreview.hidden = true;
}

function resetForm() {
  pinForm.reset();
  savePinButton.textContent = "+ Add a card";
  clearImagePreview();
  setStatus("Add a title and markdown description. Image uploads are optional.");
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(reader.result));
    reader.addEventListener("error", () => reject(reader.error));
    reader.readAsDataURL(file);
  });
}

function compressImage(dataUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => {
      const maxSize = 1200;
      const scale = Math.min(1, maxSize / image.width, maxSize / image.height);
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));

      const context = canvas.getContext("2d");
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.86));
    });
    image.addEventListener("error", reject);
    image.src = dataUrl;
  });
}

async function prepareImage(file) {
  const dataUrl = await readFileAsDataUrl(file);
  return compressImage(dataUrl);
}

function createDefaultPosition(index) {
  const panelOffset = window.innerWidth > 760 ? 420 : 28;

  return {
    x: window.scrollX + panelOffset + ((index * 37) % 180),
    y: window.scrollY + 190 + ((index * 43) % 210),
  };
}

function applyPinFrame(pinElement, pin) {
  pinElement.style.left = `${pin.x}px`;
  pinElement.style.top = `${pin.y}px`;
  pinElement.style.width = `${pin.width}px`;
  pinElement.style.height = `${pin.height}px`;
  pinElement.style.zIndex = String(pin.z);
  pinElement.style.setProperty("--pin-rotation", `${pin.rotation}deg`);
}

function forcePinToTopLayer(pin) {
  state.pins.forEach((savedPin) => {
    if (savedPin.id !== pin.id && savedPin.z >= maxZIndex) {
      savedPin.z = maxZIndex - 1;
      const pinElement = surface.querySelector(`[data-pin-id="${savedPin.id}"]`);
      if (pinElement) pinElement.style.zIndex = String(savedPin.z);
    }
  });
  pin.z = maxZIndex;
}

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderInlineMarkdown(value) {
  return escapeHtml(value)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(
      /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>',
    );
}

function renderMarkdown(markdown) {
  const lines = markdown.split(/\r?\n/);
  const html = [];
  let listOpen = false;

  lines.forEach((line) => {
    const trimmed = line.trim();

    if (!trimmed) {
      if (listOpen) {
        html.push("</ul>");
        listOpen = false;
      }
      return;
    }

    const listMatch = trimmed.match(/^[-*]\s+(.+)$/);
    if (listMatch) {
      if (!listOpen) {
        html.push("<ul>");
        listOpen = true;
      }
      html.push(`<li>${renderInlineMarkdown(listMatch[1])}</li>`);
      return;
    }

    if (listOpen) {
      html.push("</ul>");
      listOpen = false;
    }

    const headingMatch = trimmed.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length + 2;
      html.push(
        `<h${level}>${renderInlineMarkdown(headingMatch[2])}</h${level}>`,
      );
      return;
    }

    html.push(`<p>${renderInlineMarkdown(trimmed)}</p>`);
  });

  if (listOpen) html.push("</ul>");
  return html.join("");
}

function createPinElement(pin) {
  const pinElement = document.createElement("article");
  pinElement.className = "scrapPin";
  pinElement.classList.toggle("hasImage", Boolean(pin.image));
  pinElement.dataset.pinId = pin.id;
  pinElement.tabIndex = 0;
  pinElement.setAttribute("aria-label", `${pin.title} board card`);

  const imageWrap = document.createElement("div");
  if (pin.image) {
    imageWrap.className = "pinImageWrap";
    const image = document.createElement("img");
    image.src = pin.image;
    image.alt = pin.title;
    image.draggable = false;
    imageWrap.appendChild(image);
  }

  const header = document.createElement("header");
  header.className = "pinHeader";
  const title = document.createElement("h2");
  title.textContent = pin.title;
  const menuDots = document.createElement("span");
  menuDots.className = "pinMenuDots";
  menuDots.textContent = "...";
  menuDots.setAttribute("aria-hidden", "true");
  header.append(title, menuDots);

  const text = document.createElement("div");
  text.className = "pinText";
  const description = document.createElement("div");
  description.className = "pinDescription";
  description.innerHTML = renderMarkdown(pin.description);
  text.appendChild(description);

  const resizeHandle = document.createElement("button");
  resizeHandle.className = "resizeHandle";
  resizeHandle.type = "button";
  resizeHandle.setAttribute("aria-label", `Resize ${pin.title}`);
  resizeHandle.addEventListener("pointerdown", (event) => startResize(event, pinElement));

  pinElement.appendChild(header);
  if (pin.image) pinElement.appendChild(imageWrap);
  pinElement.append(text, resizeHandle);
  pinElement.addEventListener("pointerdown", startDrag);
  pinElement.addEventListener("keydown", movePinWithKeyboard);

  applyPinFrame(pinElement, pin);
  surface.appendChild(pinElement);
}

function renderPins() {
  surface.querySelectorAll(".scrapPin").forEach((pinElement) => pinElement.remove());
  state.pins.forEach(createPinElement);
  updateEmptyState();
  updateSurfaceSize();
}

async function handleImageSelection() {
  const file = pinImage.files?.[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    setStatus("Please choose an image file.");
    pinImage.value = "";
    return;
  }

  setStatus("Preparing image...");
  try {
    const imageData = await prepareImage(file);
    showImagePreview(imageData);
    setStatus("Image ready. Add a title and description, then create the pin.");
  } catch (error) {
    setStatus("That image could not be prepared. Try another file.");
    pinImage.value = "";
  }
}

async function savePin(event) {
  event.preventDefault();

  const title = pinTitle.value.trim();
  const description = pinDescription.value.trim();

  if (!title || !description) {
    setStatus("Add both a title and description before saving.");
    return;
  }

  if (pinImage.files?.[0]) {
    await handleImageSelection();
  }

  const image = selectedImageData || "";

  const index = state.pins.length;
  const position = createDefaultPosition(index);
  const pin = {
    id: makeId(),
    title,
    description,
    image,
    x: position.x,
    y: position.y,
    width: defaultPinWidth,
    height: image ? defaultPinHeight : minPinHeight,
    z: maxZIndex,
    rotation: makeRotation(index),
  };

  forcePinToTopLayer(pin);
  state.pins.push(pin);
  renderPins();
  resetForm();
  setStatus("Pin created. Drag it anywhere or resize it from the corner.");
  saveState();
}

function startDrag(event) {
  if (event.button !== undefined && event.button !== 0) return;
  if (event.target.closest("button")) return;

  const pinElement = event.currentTarget;
  const pin = findPin(pinElement.dataset.pinId);
  if (!pin) return;

  event.preventDefault();
  forcePinToTopLayer(pin);
  applyPinFrame(pinElement, pin);

  activeInteraction = {
    mode: "drag",
    pointerId: event.pointerId,
    pin,
    startX: event.clientX,
    startY: event.clientY,
    originX: pin.x,
    originY: pin.y,
  };

  pinElement.classList.add("isDragging");
  pinElement.setPointerCapture(event.pointerId);
  pinElement.addEventListener("pointermove", moveDraggedPin);
  pinElement.addEventListener("pointerup", finishPointerInteraction);
  pinElement.addEventListener("pointercancel", finishPointerInteraction);
}

function moveDraggedPin(event) {
  if (!activeInteraction || activeInteraction.pointerId !== event.pointerId) return;

  const { pin, startX, startY, originX, originY } = activeInteraction;
  pin.x = originX + event.clientX - startX;
  pin.y = originY + event.clientY - startY;
  applyPinFrame(event.currentTarget, pin);
  updateSurfaceSize();
}

function startResize(event, pinElement) {
  const pin = findPin(pinElement.dataset.pinId);
  if (!pin) return;

  event.preventDefault();
  event.stopPropagation();
  forcePinToTopLayer(pin);
  applyPinFrame(pinElement, pin);

  activeInteraction = {
    mode: "resize",
    pointerId: event.pointerId,
    pin,
    startX: event.clientX,
    startY: event.clientY,
    originWidth: pin.width,
    originHeight: pin.height,
  };

  pinElement.classList.add("isResizing");
  event.currentTarget.setPointerCapture(event.pointerId);
  event.currentTarget.addEventListener("pointermove", resizePin);
  event.currentTarget.addEventListener("pointerup", finishPointerInteraction);
  event.currentTarget.addEventListener("pointercancel", finishPointerInteraction);
}

function resizePin(event) {
  if (!activeInteraction || activeInteraction.pointerId !== event.pointerId) return;

  const { pin, startX, startY, originWidth, originHeight } = activeInteraction;
  pin.width = Math.max(minPinWidth, originWidth + event.clientX - startX);
  pin.height = Math.max(minPinHeight, originHeight + event.clientY - startY);

  const pinElement = surface.querySelector(`[data-pin-id="${pin.id}"]`);
  if (pinElement) {
    applyPinFrame(pinElement, pin);
    updateSurfaceSize();
  }
}

function finishPointerInteraction(event) {
  const pinElement =
    event.currentTarget.classList.contains("resizeHandle")
      ? event.currentTarget.closest(".scrapPin")
      : event.currentTarget;

  pinElement?.classList.remove("isDragging", "isResizing");

  try {
    event.currentTarget.releasePointerCapture(event.pointerId);
  } catch (error) {
    // The pointer may already be released by the browser.
  }

  event.currentTarget.removeEventListener("pointermove", moveDraggedPin);
  event.currentTarget.removeEventListener("pointermove", resizePin);
  event.currentTarget.removeEventListener("pointerup", finishPointerInteraction);
  event.currentTarget.removeEventListener("pointercancel", finishPointerInteraction);

  activeInteraction = null;
  updateSurfaceSize();
  saveState();
}

function movePinWithKeyboard(event) {
  const keys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
  if (!keys.includes(event.key)) return;

  const pin = findPin(event.currentTarget.dataset.pinId);
  if (!pin) return;

  event.preventDefault();
  const step = event.shiftKey ? 48 : 16;
  if (event.key === "ArrowLeft") pin.x -= step;
  if (event.key === "ArrowRight") pin.x += step;
  if (event.key === "ArrowUp") pin.y -= step;
  if (event.key === "ArrowDown") pin.y += step;

  forcePinToTopLayer(pin);
  applyPinFrame(event.currentTarget, pin);
  updateSurfaceSize();
  saveState();
}

if (surface && pinForm) {
  renderPins();

  pinForm.addEventListener("submit", savePin);
  pinImage.addEventListener("change", handleImageSelection);
  window.addEventListener("resize", updateSurfaceSize);
}
