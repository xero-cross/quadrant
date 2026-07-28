const MAX_FILE_SIZE = 20 * 1024 * 1024;
const EXPORT_SIZE = 1600;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

const state = {
  title: "제목",
  axisLabels: {
    top: "사분면 내용 1",
    right: "사분면 내용 2",
    bottom: "사분면 내용 3",
    left: "사분면 내용 4",
  },
  images: [],
  selectedId: null,
  gesture: null,
};

const $ = (selector) => document.querySelector(selector);
const board = $("#board");
const status = $("#status");
const imageInput = $("#imageInput");
const projectInput = $("#projectInput");

const inputs = {
  title: $("#titleInput"),
  top: $("#topInput"),
  right: $("#rightInput"),
  bottom: $("#bottomInput"),
  left: $("#leftInput"),
};

function setStatus(message) {
  status.textContent = message;
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function getImageSize(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = reject;
    image.src = src;
  });
}

function syncText() {
  state.title = inputs.title.value;
  state.axisLabels.top = inputs.top.value;
  state.axisLabels.right = inputs.right.value;
  state.axisLabels.bottom = inputs.bottom.value;
  state.axisLabels.left = inputs.left.value;
  $("#boardTitle").textContent = state.title || "제목을 입력하세요";
  $("#labelTop").textContent = state.axisLabels.top;
  $("#labelRight").textContent = state.axisLabels.right;
  $("#labelBottom").textContent = state.axisLabels.bottom;
  $("#labelLeft").textContent = state.axisLabels.left;
}

Object.values(inputs).forEach((input) => input.addEventListener("input", syncText));

function updateButtons() {
  const disabled = !state.selectedId;
  $("#frontButton").disabled = disabled;
  $("#backButton").disabled = disabled;
  $("#deleteButton").disabled = disabled;
  $("#imageCount").textContent = `${state.images.length}개 이미지`;
}

function renderImages() {
  board.querySelectorAll(".placed-image").forEach((element) => element.remove());
  state.images.forEach((item) => {
    const wrapper = document.createElement("div");
    wrapper.className = `placed-image${state.selectedId === item.id ? " is-selected" : ""}`;
    wrapper.style.left = `${item.x * 100}%`;
    wrapper.style.top = `${item.y * 100}%`;
    wrapper.style.width = `${item.width * 100}%`;
    wrapper.style.height = `${item.height * 100}%`;
    wrapper.dataset.id = item.id;

    const image = document.createElement("img");
    image.src = item.src;
    image.alt = item.name;
    image.draggable = false;
    wrapper.append(image);

    wrapper.addEventListener("pointerdown", (event) => beginGesture(event, item, "move"));

    if (state.selectedId === item.id) {
      const handle = document.createElement("button");
      handle.className = "resize-handle";
      handle.type = "button";
      handle.setAttribute("aria-label", `${item.name} 크기 조절`);
      handle.addEventListener("pointerdown", (event) => beginGesture(event, item, "resize"));
      wrapper.append(handle);
    }
    board.append(wrapper);
  });
  updateButtons();
}

function beginGesture(event, item, mode) {
  event.preventDefault();
  event.stopPropagation();
  state.selectedId = item.id;
  state.gesture = {
    id: item.id,
    mode,
    startX: event.clientX,
    startY: event.clientY,
    image: { ...item },
  };
  board.setPointerCapture(event.pointerId);
  renderImages();
}

board.addEventListener("pointermove", (event) => {
  if (!state.gesture) return;
  const rect = board.getBoundingClientRect();
  const dx = (event.clientX - state.gesture.startX) / rect.width;
  const dy = (event.clientY - state.gesture.startY) / rect.height;
  const item = state.images.find((image) => image.id === state.gesture.id);
  if (!item) return;

  if (state.gesture.mode === "move") {
    item.x = state.gesture.image.x + dx;
    item.y = state.gesture.image.y + dy;
  } else {
    const ratio = state.gesture.image.width / state.gesture.image.height;
    item.width = Math.max(.06, state.gesture.image.width + dx);
    item.height = Math.max(.06 / ratio, item.width / ratio);
  }
  const element = board.querySelector(`[data-id="${item.id}"]`);
  if (element) {
    element.style.left = `${item.x * 100}%`;
    element.style.top = `${item.y * 100}%`;
    element.style.width = `${item.width * 100}%`;
    element.style.height = `${item.height * 100}%`;
  }
});

["pointerup", "pointercancel", "pointerleave"].forEach((name) => {
  board.addEventListener(name, () => {
    if (!state.gesture) return;
    state.gesture = null;
    renderImages();
  });
});

board.addEventListener("click", (event) => {
  if (event.target === board || event.target.classList.contains("plot-grid")) {
    state.selectedId = null;
    renderImages();
  }
});

async function addFiles(files) {
  const additions = [];
  const errors = [];
  for (const file of files) {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      errors.push(`${file.name}: 지원하지 않는 형식`);
      continue;
    }
    if (file.size > MAX_FILE_SIZE) {
      errors.push(`${file.name}: 20MB 초과`);
      continue;
    }
    try {
      const src = await fileToDataUrl(file);
      const natural = await getImageSize(src);
      const width = .22;
      const offset = (state.images.length + additions.length) * .025;
      additions.push({
        id: crypto.randomUUID(),
        name: file.name,
        src,
        x: .39 + offset,
        y: .43 + offset,
        width,
        height: Math.min(.32, width * natural.height / natural.width),
      });
    } catch {
      errors.push(`${file.name}: 이미지를 읽지 못함`);
    }
  }
  state.images.push(...additions);
  state.selectedId = additions.at(-1)?.id || state.selectedId;
  renderImages();
  setStatus(errors.length
    ? `${additions.length}장 추가됨 · ${errors.join(", ")}`
    : `${additions.length}장의 이미지를 추가했습니다.`);
}

$("#uploadButton").addEventListener("click", () => imageInput.click());
imageInput.addEventListener("change", () => {
  addFiles([...imageInput.files]);
  imageInput.value = "";
});

board.addEventListener("dragover", (event) => event.preventDefault());
board.addEventListener("dragenter", (event) => {
  event.preventDefault();
  $("#dropOverlay").hidden = false;
});
board.addEventListener("dragleave", (event) => {
  if (event.target === board) $("#dropOverlay").hidden = true;
});
board.addEventListener("drop", (event) => {
  event.preventDefault();
  $("#dropOverlay").hidden = true;
  addFiles([...event.dataTransfer.files]);
});

function deleteSelected() {
  if (!state.selectedId) return;
  state.images = state.images.filter((image) => image.id !== state.selectedId);
  state.selectedId = null;
  renderImages();
  setStatus("선택한 이미지를 삭제했습니다.");
}

$("#deleteButton").addEventListener("click", deleteSelected);
document.addEventListener("keydown", (event) => {
  if (
    (event.key === "Delete" || event.key === "Backspace") &&
    !["INPUT", "TEXTAREA"].includes(event.target.tagName)
  ) {
    event.preventDefault();
    deleteSelected();
  }
});

function shiftSelected(front) {
  const index = state.images.findIndex((image) => image.id === state.selectedId);
  if (index < 0) return;
  const [item] = state.images.splice(index, 1);
  if (front) state.images.push(item);
  else state.images.unshift(item);
  renderImages();
}
$("#frontButton").addEventListener("click", () => shiftSelected(true));
$("#backButton").addEventListener("click", () => shiftSelected(false));

$("#saveButton").addEventListener("click", () => {
  const project = {
    version: 1,
    title: state.title,
    axisLabels: state.axisLabels,
    canvas: { width: EXPORT_SIZE, height: EXPORT_SIZE, background: "#fbfaf7" },
    images: state.images,
  };
  downloadBlob(
    new Blob([JSON.stringify(project)], { type: "application/json" }),
    "quadrant-project.json",
  );
  setStatus("편집 파일을 저장했습니다.");
});

$("#loadButton").addEventListener("click", () => projectInput.click());
projectInput.addEventListener("change", async () => {
  const file = projectInput.files[0];
  projectInput.value = "";
  if (!file) return;
  try {
    const parsed = JSON.parse(await file.text());
    const labels = parsed.axisLabels;
    if (
      parsed.version !== 1 ||
      typeof parsed.title !== "string" ||
      !labels ||
      !["top", "right", "bottom", "left"].every((key) => typeof labels[key] === "string") ||
      !Array.isArray(parsed.images) ||
      parsed.images.some((item) =>
        typeof item.id !== "string" ||
        typeof item.src !== "string" ||
        !["x", "y", "width", "height"].every((key) => typeof item[key] === "number")
      )
    ) throw new Error("invalid");

    state.title = parsed.title;
    state.axisLabels = { ...labels };
    state.images = parsed.images;
    state.selectedId = null;
    inputs.title.value = state.title;
    inputs.top.value = labels.top;
    inputs.right.value = labels.right;
    inputs.bottom.value = labels.bottom;
    inputs.left.value = labels.left;
    syncText();
    renderImages();
    setStatus("편집 파일을 불러왔습니다.");
  } catch {
    setStatus("이 편집 파일은 손상되었거나 지원하지 않는 형식입니다.");
  }
});

function wrapText(context, text, maxWidth) {
  const lines = [];
  let line = "";
  for (const character of text) {
    const candidate = line + character;
    if (context.measureText(candidate).width > maxWidth && line) {
      lines.push(line);
      line = character;
    } else line = candidate;
  }
  if (line) lines.push(line);
  return lines.slice(0, 3);
}

$("#pngButton").addEventListener("click", async () => {
  const canvas = document.createElement("canvas");
  canvas.width = EXPORT_SIZE;
  canvas.height = EXPORT_SIZE;
  const context = canvas.getContext("2d");
  const size = EXPORT_SIZE;
  const headerHeight = size * .14;

  context.fillStyle = "#fbfaf7";
  context.fillRect(0, 0, size, size);
  context.fillStyle = "#000";
  context.fillRect(0, 0, size, headerHeight);
  context.fillStyle = "#fff";
  context.textAlign = "center";
  context.textBaseline = "middle";
  let titleSize = 112;
  context.font = `900 ${titleSize}px Arial, sans-serif`;
  while (context.measureText(state.title).width > size * .86 && titleSize > 48) {
    titleSize -= 4;
    context.font = `900 ${titleSize}px Arial, sans-serif`;
  }
  context.fillText(state.title, size / 2, headerHeight / 2 + 4);

  context.strokeStyle = "#e4e0dc";
  context.lineWidth = 1;
  for (let p = headerHeight; p <= size; p += 20) {
    context.beginPath(); context.moveTo(0, p); context.lineTo(size, p); context.stroke();
  }
  for (let p = 0; p <= size; p += 20) {
    context.beginPath(); context.moveTo(p, headerHeight); context.lineTo(p, size); context.stroke();
  }
  context.strokeStyle = "#3b2419";
  context.lineWidth = 9;
  context.beginPath();
  context.moveTo(size * .05, size * .565);
  context.lineTo(size * .95, size * .565);
  context.moveTo(size * .5, size * .19);
  context.lineTo(size * .5, size * .94);
  context.stroke();

  for (const item of state.images) {
    const image = await new Promise((resolve) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => resolve(null);
      element.src = item.src;
    });
    if (image) context.drawImage(
      image,
      item.x * size,
      item.y * size,
      item.width * size,
      item.height * size,
    );
  }

  context.fillStyle = "#181513";
  context.font = "700 28px Arial, sans-serif";
  context.textBaseline = "top";
  const drawLabel = (value, x, y, align, width) => {
    context.textAlign = align;
    wrapText(context, value, width).forEach((line, index) => {
      context.fillText(line, x, y + index * 34);
    });
  };
  drawLabel(state.axisLabels.top, size * .5, size * .158, "center", 440);
  drawLabel(state.axisLabels.bottom, size * .5, size * .955, "center", 440);
  drawLabel(state.axisLabels.left, size * .05, size * .575, "left", 430);
  drawLabel(state.axisLabels.right, size * .95, size * .535, "right", 430);

  canvas.toBlob((blob) => downloadBlob(blob, "quadrant.png"), "image/png");
  setStatus("고해상도 PNG를 만들었습니다.");
});

$("#panelToggle").addEventListener("click", () => {
  const panel = $("#editorPanel");
  const isOpen = panel.classList.toggle("is-open");
  panel.classList.toggle("is-closed", !isOpen);
  $("#panelToggle").textContent = isOpen ? "접기" : "열기";
  $("#panelToggle").setAttribute("aria-expanded", String(isOpen));
});

renderImages();
