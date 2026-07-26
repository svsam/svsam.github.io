const CLASSIC_RAMP = ".:-=+*#%@|";
const MIN_COLUMNS = 10;
const MAX_COLUMNS = 400;
const MAX_SOURCE_EDGE = 4096;
const CONVERSION_DEBOUNCE_MS = 160;
const PANEL_RESIZE_BREAKPOINT = 900;
const MIN_PREVIEW_COLUMN_WIDTH = 320;
const MIN_SETTINGS_PANEL_WIDTH = 260;
const MIN_SOURCE_PANEL_HEIGHT = 160;
const MIN_OUTPUT_PANEL_HEIGHT = 180;
const RESIZER_SIZE = 7;
const KEYBOARD_RESIZE_STEP = 16;

const elements = {
  workspaceGrid: document.querySelector(".workspace-grid"),
  rowResizer: document.querySelector("#row-resizer"),
  columnResizer: document.querySelector("#column-resizer"),
  openImageButton: document.querySelector("#open-image-button"),
  fileInput: document.querySelector("#file-input"),
  dropZone: document.querySelector("#drop-zone"),
  sourceStage: document.querySelector("#source-stage"),
  sourcePreviewFrame: document.querySelector("#source-preview-frame"),
  sourcePreview: document.querySelector("#source-preview"),
  sourceName: document.querySelector("#source-name"),
  sourceDimensions: document.querySelector("#source-dimensions"),
  rampInput: document.querySelector("#ramp-input"),
  columnsRange: document.querySelector("#columns-range"),
  columnsNumber: document.querySelector("#columns-number"),
  brightnessInput: document.querySelector("#brightness-input"),
  brightnessValue: document.querySelector("#brightness-value"),
  contrastInput: document.querySelector("#contrast-input"),
  contrastValue: document.querySelector("#contrast-value"),
  gammaInput: document.querySelector("#gamma-input"),
  gammaValue: document.querySelector("#gamma-value"),
  saturationInput: document.querySelector("#saturation-input"),
  saturationValue: document.querySelector("#saturation-value"),
  redGainInput: document.querySelector("#red-gain-input"),
  redGainValue: document.querySelector("#red-gain-value"),
  greenGainInput: document.querySelector("#green-gain-input"),
  greenGainValue: document.querySelector("#green-gain-value"),
  blueGainInput: document.querySelector("#blue-gain-input"),
  blueGainValue: document.querySelector("#blue-gain-value"),
  matteInput: document.querySelector("#matte-input"),
  resetToneButton: document.querySelector("#reset-tone-button"),
  settingsError: document.querySelector("#settings-error"),
  previewShell: document.querySelector("#preview-shell"),
  output: document.querySelector("#ascii-output"),
  outputDimensions: document.querySelector("#output-dimensions"),
  copyButton: document.querySelector("#copy-button"),
  downloadButton: document.querySelector("#download-button"),
  status: document.querySelector("#status"),
};

const state = {
  workerReady: false,
  workerImageReady: false,
  imageId: 0,
  requestId: 0,
  settingsVersion: 0,
  activeRequest: null,
  pendingSettings: null,
  debounceTimer: null,
  output: "",
  outputColumns: 0,
  sourceFilename: "image",
  sourceObjectUrl: null,
};

elements.rampInput.value = CLASSIC_RAMP;
updateToneOutputs();

const worker = new Worker(new URL("./worker.js", import.meta.url), { type: "module" });
worker.addEventListener("message", handleWorkerMessage);
worker.addEventListener("error", () => {
  setStatus("The converter worker stopped unexpectedly. Reload the page to try again.", "error");
  invalidateOutput();
});

elements.openImageButton.addEventListener("click", () => elements.fileInput.click());
elements.dropZone.addEventListener("click", () => elements.fileInput.click());
elements.fileInput.addEventListener("change", () => {
  void loadFiles(elements.fileInput.files);
  elements.fileInput.value = "";
});

for (const eventName of ["dragenter", "dragover"]) {
  elements.sourceStage.addEventListener(eventName, (event) => {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = "copy";
    }
    elements.dropZone.classList.add("is-dragging");
    elements.sourceStage.classList.add("is-dragging");
  });
}
for (const eventName of ["dragleave", "drop"]) {
  elements.sourceStage.addEventListener(eventName, (event) => {
    event.preventDefault();
    elements.dropZone.classList.remove("is-dragging");
    elements.sourceStage.classList.remove("is-dragging");
  });
}
elements.sourceStage.addEventListener("drop", (event) => {
  void loadFiles(event.dataTransfer?.files);
});

elements.rampInput.addEventListener("input", settingsChanged);
elements.columnsRange.addEventListener("input", () => {
  elements.columnsNumber.value = elements.columnsRange.value;
  settingsChanged();
});
elements.columnsNumber.addEventListener("input", () => {
  const columns = Number(elements.columnsNumber.value);
  if (Number.isInteger(columns) && columns >= MIN_COLUMNS && columns <= MAX_COLUMNS) {
    elements.columnsRange.value = String(columns);
  }
  settingsChanged();
});
for (const input of toneInputs()) {
  input.addEventListener("input", () => {
    updateToneOutputs();
    settingsChanged();
  });
}
elements.resetToneButton.addEventListener("click", () => {
  elements.brightnessInput.value = "0";
  elements.contrastInput.value = "1";
  elements.gammaInput.value = "1";
  elements.saturationInput.value = "1";
  elements.redGainInput.value = "1";
  elements.greenGainInput.value = "1";
  elements.blueGainInput.value = "1";
  elements.matteInput.value = "#ffffff";
  updateToneOutputs();
  settingsChanged();
});
elements.copyButton.addEventListener("click", copyOutput);
elements.downloadButton.addEventListener("click", downloadOutput);

new ResizeObserver(fitPreview).observe(elements.previewShell);
setupPanelResizing();

async function loadFiles(fileList) {
  const files = Array.from(fileList ?? []);
  if (files.length === 0) {
    return;
  }
  const file = files.find((candidate) => candidate.type.startsWith("image/")) ?? files[0];
  const imageId = ++state.imageId;
  state.workerImageReady = false;
  state.activeRequest = null;
  state.pendingSettings = null;
  clearTimeout(state.debounceTimer);
  clearSourcePreview();
  invalidateOutput(true);
  setStatus("Decoding image in your browser…");

  try {
    const bitmap = await decodeBitmap(file);
    if (imageId !== state.imageId) {
      bitmap.close();
      return;
    }

    const originalWidth = bitmap.width;
    const originalHeight = bitmap.height;
    const scale = Math.min(1, MAX_SOURCE_EDGE / Math.max(originalWidth, originalHeight));
    const width = Math.max(1, Math.round(originalWidth * scale));
    const height = Math.max(1, Math.round(originalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) {
      throw new Error("This browser could not create an image canvas.");
    }
    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();
    const imageData = context.getImageData(0, 0, width, height);

    state.sourceFilename = file.name || "image";
    updateSourcePreview(file, originalWidth, originalHeight, width, height);
    setStatus(state.workerReady ? "Preparing conversion…" : "Waiting for the converter…");
    worker.postMessage(
      {
        type: "set-image",
        imageId,
        width,
        height,
        pixels: imageData.data,
      },
      [imageData.data.buffer],
    );
  } catch (error) {
    if (imageId !== state.imageId) {
      return;
    }
    setStatus(`Could not decode that image. ${readableError(error)}`, "error");
    state.workerImageReady = false;
    invalidateOutput();
  }
}

async function decodeBitmap(file) {
  try {
    return await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch (firstError) {
    try {
      return await createImageBitmap(file);
    } catch {
      throw firstError;
    }
  }
}

function updateSourcePreview(file, originalWidth, originalHeight, conversionWidth, conversionHeight) {
  state.sourceObjectUrl = URL.createObjectURL(file);
  elements.sourcePreview.src = state.sourceObjectUrl;
  elements.sourcePreview.alt = `Selected source: ${file.name || "image"}`;
  elements.sourceName.textContent = file.name || "image";
  elements.sourcePreviewFrame.hidden = false;
  elements.dropZone.hidden = true;
  const resized = originalWidth !== conversionWidth || originalHeight !== conversionHeight;
  elements.sourceDimensions.textContent = resized
    ? `${originalWidth}×${originalHeight} · sampled at ${conversionWidth}×${conversionHeight}`
    : `${originalWidth}×${originalHeight}`;
}

function clearSourcePreview() {
  if (state.sourceObjectUrl) {
    URL.revokeObjectURL(state.sourceObjectUrl);
    state.sourceObjectUrl = null;
  }
  elements.sourcePreview.removeAttribute("src");
  elements.sourcePreviewFrame.hidden = true;
  elements.dropZone.hidden = false;
  elements.sourceName.textContent = "";
  elements.sourceDimensions.textContent = "";
}

function settingsChanged() {
  clearTimeout(state.debounceTimer);
  const settingsVersion = ++state.settingsVersion;
  const validation = readSettings();
  if (!validation.ok) {
    state.pendingSettings = null;
    elements.settingsError.textContent = validation.message;
    invalidateOutput(true);
    setStatus("Fix the conversion settings to update the preview.", "error");
    return;
  }

  elements.settingsError.textContent = "";
  invalidateOutput(true);
  if (!state.workerImageReady) {
    return;
  }
  state.debounceTimer = setTimeout(() => {
    queueConversion(validation.settings, settingsVersion);
  }, CONVERSION_DEBOUNCE_MS);
}

function readSettings() {
  const columns = Number(elements.columnsNumber.value);
  if (!Number.isInteger(columns) || columns < MIN_COLUMNS || columns > MAX_COLUMNS) {
    return {
      ok: false,
      message: `Choose a whole-number width from ${MIN_COLUMNS} to ${MAX_COLUMNS} columns.`,
    };
  }

  const ramp = elements.rampInput.value;
  const characters = Array.from(ramp);
  if (characters.length < 2 || characters.length > 256) {
    return { ok: false, message: "The character ramp must contain 2–256 characters." };
  }
  if (characters.some((character) => character.codePointAt(0) < 32 || character.codePointAt(0) > 126)) {
    return { ok: false, message: "The character ramp can use printable ASCII characters only." };
  }

  const numericSettings = [
    ["brightness", elements.brightnessInput, -1, 1],
    ["contrast", elements.contrastInput, 0, 3],
    ["gamma", elements.gammaInput, 0.2, 3],
    ["saturation", elements.saturationInput, 0, 3],
    ["redGain", elements.redGainInput, 0, 3],
    ["greenGain", elements.greenGainInput, 0, 3],
    ["blueGain", elements.blueGainInput, 0, 3],
  ];
  const settings = { columns, ramp };
  for (const [name, input, minimum, maximum] of numericSettings) {
    const value = Number(input.value);
    if (!Number.isFinite(value) || value < minimum || value > maximum) {
      return { ok: false, message: "One or more tone and colour values are outside the allowed range." };
    }
    settings[name] = value;
  }

  const matte = /^#([0-9a-f]{6})$/i.exec(elements.matteInput.value);
  if (!matte) {
    return { ok: false, message: "Choose a valid transparency matte colour." };
  }
  settings.matte = [0, 2, 4].map((offset) => Number.parseInt(matte[1].slice(offset, offset + 2), 16));

  return { ok: true, settings };
}

function queueConversion(settings, settingsVersion = state.settingsVersion) {
  state.pendingSettings = { ...settings, imageId: state.imageId, settingsVersion };
  invalidateOutput(true);
  if (!state.activeRequest) {
    sendPendingConversion();
  } else {
    setStatus("Conversion queued with your latest settings…");
  }
}

function sendPendingConversion() {
  if (!state.pendingSettings || !state.workerImageReady) {
    return;
  }
  const settings = state.pendingSettings;
  state.pendingSettings = null;
  const requestId = ++state.requestId;
  state.activeRequest = {
    requestId,
    imageId: settings.imageId,
    settingsVersion: settings.settingsVersion,
  };
  setStatus("Converting image…");
  worker.postMessage({
    type: "convert",
    requestId,
    imageId: settings.imageId,
    columns: settings.columns,
    ramp: settings.ramp,
    brightness: settings.brightness,
    contrast: settings.contrast,
    gamma: settings.gamma,
    saturation: settings.saturation,
    redGain: settings.redGain,
    greenGain: settings.greenGain,
    blueGain: settings.blueGain,
    matte: settings.matte,
  });
}

function toneInputs() {
  return [
    elements.brightnessInput,
    elements.contrastInput,
    elements.gammaInput,
    elements.saturationInput,
    elements.redGainInput,
    elements.greenGainInput,
    elements.blueGainInput,
    elements.matteInput,
  ];
}

function updateToneOutputs() {
  const pairs = [
    [elements.brightnessInput, elements.brightnessValue],
    [elements.contrastInput, elements.contrastValue],
    [elements.gammaInput, elements.gammaValue],
    [elements.saturationInput, elements.saturationValue],
    [elements.redGainInput, elements.redGainValue],
    [elements.greenGainInput, elements.greenGainValue],
    [elements.blueGainInput, elements.blueGainValue],
  ];
  for (const [input, output] of pairs) {
    output.value = Number(input.value).toFixed(2);
  }
}

function handleWorkerMessage(event) {
  const message = event.data;
  if (message.type === "ready") {
    state.workerReady = true;
    if (state.imageId === 0) {
      setStatus("Choose an image to begin.");
    }
    return;
  }
  if (message.type === "fatal") {
    setStatus(`The WebAssembly converter could not start. ${message.message}`, "error");
    invalidateOutput();
    return;
  }
  if (message.type === "image-ready") {
    if (message.imageId !== state.imageId) {
      return;
    }
    state.workerImageReady = true;
    const validation = readSettings();
    if (validation.ok) {
      queueConversion(validation.settings);
    } else {
      elements.settingsError.textContent = validation.message;
    }
    return;
  }
  if (message.type !== "result" && message.type !== "error") {
    return;
  }

  const matchesActive =
    state.activeRequest &&
    state.activeRequest.requestId === message.requestId &&
    state.activeRequest.imageId === message.imageId;
  if (!matchesActive) {
    return;
  }
  const completedRequest = state.activeRequest;
  state.activeRequest = null;

  if (message.imageId !== state.imageId) {
    sendPendingConversion();
    return;
  }
  if (state.pendingSettings) {
    sendPendingConversion();
    return;
  }
  if (completedRequest.settingsVersion !== state.settingsVersion) {
    return;
  }
  if (message.type === "error") {
    setStatus(`Conversion failed. ${message.message}`, "error");
    invalidateOutput();
    return;
  }

  showOutput(message.text);
}

function showOutput(text) {
  state.output = text.endsWith("\n") ? text : `${text}\n`;
  state.outputColumns = state.output.indexOf("\n");
  elements.output.textContent = state.output;
  elements.output.classList.remove("is-stale");
  elements.previewShell.dataset.empty = "false";
  elements.copyButton.disabled = false;
  elements.downloadButton.disabled = false;
  const rows = state.output.split("\n").length - 1;
  elements.outputDimensions.textContent = `${state.outputColumns} × ${rows}`;
  setStatus("ASCII art ready.", "success");
  fitPreview();
}

function invalidateOutput(markStale = false) {
  elements.copyButton.disabled = true;
  elements.downloadButton.disabled = true;
  elements.output.classList.toggle("is-stale", markStale && Boolean(state.output));
  if (!markStale) {
    state.output = "";
    state.outputColumns = 0;
    elements.output.textContent = "";
    elements.outputDimensions.textContent = "";
    elements.previewShell.dataset.empty = "true";
  }
}

function fitPreview() {
  if (!state.outputColumns) {
    return;
  }
  const availableWidth = Math.max(1, elements.previewShell.clientWidth - 34);
  const measurement = document.createElement("canvas").getContext("2d");
  if (!measurement) {
    return;
  }
  measurement.font = '12px "Cascadia Mono", "SFMono-Regular", Consolas, monospace';
  const characterWidthAtTwelve = measurement.measureText("M").width || 7.2;
  const fitted = (availableWidth * 12) / (state.outputColumns * characterWidthAtTwelve);
  const fontSize = Math.max(3, Math.min(12, fitted));
  elements.output.style.setProperty("--preview-font-size", `${fontSize.toFixed(2)}px`);
}

function setupPanelResizing() {
  const resizers = [
    {
      element: elements.columnResizer,
      axis: "x",
      cursor: "col-resize",
      resizeFromPointer(startValue, pointerDelta) {
        setSettingsPanelWidth(startValue - pointerDelta);
      },
      resizeFromKeyboard(delta) {
        const currentLeftWidth =
          elements.columnResizer.getBoundingClientRect().left -
          elements.workspaceGrid.getBoundingClientRect().left;
        setSettingsPanelWidth(
          elements.workspaceGrid.clientWidth - RESIZER_SIZE - currentLeftWidth - delta,
        );
      },
    },
    {
      element: elements.rowResizer,
      axis: "y",
      cursor: "row-resize",
      resizeFromPointer(startValue, pointerDelta) {
        setSourcePanelHeight(startValue + pointerDelta);
      },
      resizeFromKeyboard(delta) {
        setSourcePanelHeight(currentSourcePanelHeight() + delta);
      },
    },
  ];

  for (const resizer of resizers) {
    let drag = null;

    resizer.element.addEventListener("pointerdown", (event) => {
      if (event.pointerType === "mouse" && event.button !== 0) {
        return;
      }
      const gridStyles = getComputedStyle(elements.workspaceGrid);
      drag = {
        pointerId: event.pointerId,
        startPointer: resizer.axis === "x" ? event.clientX : event.clientY,
        startValue:
          resizer.axis === "x"
            ? Number.parseFloat(gridStyles.getPropertyValue("--settings-panel-width"))
            : currentSourcePanelHeight(),
      };
      resizer.element.setPointerCapture(event.pointerId);
      resizer.element.classList.add("is-resizing");
      document.body.classList.add("is-resizing-panels");
      document.body.style.setProperty("--panel-resize-cursor", resizer.cursor);
      event.preventDefault();
    });

    resizer.element.addEventListener("pointermove", (event) => {
      if (!drag || event.pointerId !== drag.pointerId) {
        return;
      }
      const pointer = resizer.axis === "x" ? event.clientX : event.clientY;
      resizer.resizeFromPointer(drag.startValue, pointer - drag.startPointer);
    });

    const finishDragging = (event) => {
      if (!drag || event.pointerId !== drag.pointerId) {
        return;
      }
      drag = null;
      resizer.element.classList.remove("is-resizing");
      document.body.classList.remove("is-resizing-panels");
      document.body.style.removeProperty("--panel-resize-cursor");
    };
    resizer.element.addEventListener("pointerup", finishDragging);
    resizer.element.addEventListener("pointercancel", finishDragging);
    resizer.element.addEventListener("lostpointercapture", finishDragging);

    resizer.element.addEventListener("keydown", (event) => {
      const direction =
        resizer.axis === "x"
          ? { ArrowLeft: -1, ArrowRight: 1 }[event.key]
          : { ArrowUp: -1, ArrowDown: 1 }[event.key];
      if (!direction) {
        return;
      }
      resizer.resizeFromKeyboard(direction * KEYBOARD_RESIZE_STEP);
      event.preventDefault();
    });

    resizer.element.addEventListener("dblclick", resetPanelSizes);
  }

  new ResizeObserver(clampPanelSizes).observe(elements.workspaceGrid);
  clampPanelSizes();
}

function setSettingsPanelWidth(width) {
  const availableWidth = elements.workspaceGrid.clientWidth - RESIZER_SIZE;
  const maximum = Math.max(MIN_SETTINGS_PANEL_WIDTH, availableWidth - MIN_PREVIEW_COLUMN_WIDTH);
  const clamped = clamp(width, MIN_SETTINGS_PANEL_WIDTH, maximum);
  elements.workspaceGrid.style.setProperty("--settings-panel-width", `${clamped}px`);
  const dividerPosition = ((availableWidth - clamped) / availableWidth) * 100;
  elements.columnResizer.setAttribute("aria-valuenow", String(Math.round(dividerPosition)));
}

function setSourcePanelHeight(height) {
  const availableHeight = elements.workspaceGrid.clientHeight - RESIZER_SIZE;
  const maximum = Math.max(MIN_SOURCE_PANEL_HEIGHT, availableHeight - MIN_OUTPUT_PANEL_HEIGHT);
  const clamped = clamp(height, MIN_SOURCE_PANEL_HEIGHT, maximum);
  elements.workspaceGrid.style.setProperty("--source-panel-height", `${clamped}px`);
  elements.rowResizer.setAttribute(
    "aria-valuenow",
    String(Math.round((clamped / availableHeight) * 100)),
  );
}

function clampPanelSizes() {
  if (window.innerWidth <= PANEL_RESIZE_BREAKPOINT) {
    return;
  }
  const styles = getComputedStyle(elements.workspaceGrid);
  setSettingsPanelWidth(Number.parseFloat(styles.getPropertyValue("--settings-panel-width")));
  setSourcePanelHeight(currentSourcePanelHeight());
}

function resetPanelSizes() {
  elements.workspaceGrid.style.removeProperty("--settings-panel-width");
  elements.workspaceGrid.style.removeProperty("--source-panel-height");
  clampPanelSizes();
}

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function currentSourcePanelHeight() {
  return (
    elements.rowResizer.getBoundingClientRect().top -
    elements.workspaceGrid.getBoundingClientRect().top
  );
}

async function copyOutput() {
  if (!state.output || elements.copyButton.disabled) {
    return;
  }
  try {
    await navigator.clipboard.writeText(state.output);
    setStatus("Copied ASCII art to the clipboard.", "success");
  } catch (error) {
    selectOutput();
    setStatus(
      `Clipboard access was blocked. The preview is selected so you can copy it manually. ${readableError(error)}`,
      "error",
    );
  }
}

function selectOutput() {
  const selection = window.getSelection();
  if (!selection) {
    return;
  }
  const range = document.createRange();
  range.selectNodeContents(elements.output);
  selection.removeAllRanges();
  selection.addRange(range);
  elements.output.focus();
}

function downloadOutput() {
  if (!state.output || elements.downloadButton.disabled) {
    return;
  }
  const blob = new Blob([state.output], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = outputFilename(state.sourceFilename);
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
  setStatus("Downloaded ASCII art as a text file.", "success");
}

function outputFilename(sourceFilename) {
  const lastDot = sourceFilename.lastIndexOf(".");
  const rawStem = lastDot > 0 ? sourceFilename.slice(0, lastDot) : sourceFilename;
  const safeStem = rawStem
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "_")
    .replace(/[. ]+$/g, "")
    .trim();
  return `${safeStem || "image"}_ascii.txt`;
}

function setStatus(message, kind = "info") {
  elements.status.textContent = message;
  elements.status.dataset.kind = kind;
}

function readableError(error) {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return String(error || "Unknown error");
}
