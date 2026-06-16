const journalEntries = [
  {
    date: "2026-06-12",
    title: "Journal page.",
    content: [
      {
        type: "text",
        value: "There is a voxel engine for this page now... If you wondering how I did this I reccomend you learn threejs (threejs.org for documentation). Very much helped with the addition of codex to learn this, AI is scary but as its purpose it supposed to be a tool. This page looks great in my opinion."
      }
    ]
  },
  {
    date: "2026-06-07",
    title: "Overhaul, mega progress in the past few days",
    content: [
      {
        type: "text",
        value:
          "Solar system website, it looks decent but every other page is like something different, but I think it might be unique compared to other websites. It also fits my theme of space because it's my degree.",
      },
    ],
  },
  {
    date: "2026-06-06",
    title: "Missed entries and update",
    content: [
      {
        type: "text",
        value:
          "There are a lot of things that I've forgotten to mention during development. Firstly, no, I have not spent another two weeks doing nothing with the website. I have actually been focusing on a few other things, and the most important thing of all is...",
      },
      {
        type: "image",
        src: "../css/Images/mika_2.png",
        alt: "Mika, the cat",
      },
      {
        type: "text",
        value:
          "I HAVE A PET CAT NOW! Her name is Mika and she's only a baby. This adorable little void is the reason why it's been a while since I last updated this website. Now that I have a kitten my work schedule will be a bit more lacking. This website won't be forgotten yet, but the board will be filled... with images of you know who.",
      },
    ],
  },
  {
    date: "2026-05-28",
    title: "Redesign pt. 2",
    content: [
      {
        type: "text",
        value:
          "The website will be redesigned again. This page won't be visible, but the date signifies when this change happened. On the opposite page is a picture of the old design for the memories :)",
      },
      {
        type: "image",
        src: "../css/Images/floralTerminal.png",
        alt: "The old Floral Terminal website design",
      },
    ],
  },
  {
    date: "2026-05-27",
    title: "Exam season is over!",
    content: [
      {
        type: "text",
        value:
          "I am finally finished with my exams and I will slowly, during the course of the next few weeks and days, change this website again. I think it looks too janky and it deserves a redesign.",
      },
      {
        type: "text",
        value:
          "I'll see what I feel this website needs, though lately I have been doing a few personal projects related to my degree, so maybe I'll create a new section for it. If you ever want to view it yourself you can always visit my GitHub; my most recent projects will be pinned on my profile.",
      },
      {
        type: "text",
        value:
          "This is an entry from about three hours later. I think I'm going to rework this design into something really minimalist. I am trying too hard to make it look pretty while also doing really intricate designs. It just doesn't feel like me.",
      },
      {
        type: "text",
        value:
          "So I will redo this whole section in another layout. Everything that would be here will stay the same.",
      },
    ],
  },
  {
    date: "2026-04-17",
    title: "Redesign!!!!1",
    content: [
      {
        type: "text",
        value:
          "It seems I like to work on this website at the exclusive time of midnight...",
      },
      {
        type: "text",
        value:
          "I went with a vapourwave style, similar to the album Floral Shoppe by Macintosh Plus. Really good album. You should listen to it.",
      },
      {
        type: "image",
        src: "../css/Images/Screenshot 2026-04-17 013544.png",
        alt: "An older vapourwave version of the website",
      },
      {
        type: "text",
        value:
          "Well, here's an old screenshot for the memories. It looked nice, but compared to this it's nothing.",
      },
    ],
  },
  {
    date: "2026-03-18",
    title: "Site direction",
    content: [
      {
        type: "text",
        value:
          "This is the real first entry, and the first webpage for this website of mine. I'll make a real home page but for now we only have the journal :)",
      },
      {
        type: "text",
        value:
          "The only issue I'll fix in the future is that when I add too many entries either the boxes will go off the screen or something else. I'll fix that in the future... yeah.",
      },
      {
        type: "text",
        value:
          "I also should mention that I was really burnt out after my initial stamp on this website, hence why there is a five month gap between me buying the website and actually working on it properly.",
      },
      {
        type: "text",
        value:
          "Eesh, talk about making my money's worth of this domain.",
      },
    ],
  },
  {
    date: "2025-10-30",
    title: "Bought the website",
    content: [
      {
        type: "text",
        value:
          "So I bought this website and this is obviously after the date of the journal entry (I wish I was that good at programming). The actual date of this entry is 22/03/2026.",
      },
      {
        type: "text",
        value:
          "I wish to make this website like a home to me, like a way to escape other methods of useless stuff.",
      },
    ],
  },
];

const world = document.getElementById("voxelWorld");
const interactionPrompt = document.getElementById("interactionPrompt");
const bookReader = document.getElementById("bookReader");
const leftPage = document.getElementById("leftPage");
const rightPage = document.getElementById("rightPage");
const indexTab = document.getElementById("indexTab");
const pageControls = document.getElementById("pageControls");
const pageNumber = document.getElementById("pageNumber");
const previousEntry = document.getElementById("previousEntry");
const nextEntry = document.getElementById("nextEntry");
const interactionPromptLabel = interactionPrompt.querySelector("span:last-child");
const guestbookReader = document.getElementById("guestbookReader");
const guestbookMessages = document.getElementById("guestbookMessages");
const guestbookForm = document.getElementById("guestbookForm");
const guestbookStatus = document.getElementById("guestbookStatus");
const guestbookApiUrl =
  document.querySelector('meta[name="guestbook-api"]')?.content.trim() || "";
const guestbookDataUrl = "../data/guestbook.json";
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let activeEntryIndex = -1;
let lastFocusedElement = null;

const createElement = (tag, className, text) => {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
};

const formatDate = (dateString) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${dateString}T12:00:00`));

const clearPages = () => {
  leftPage.replaceChildren();
  rightPage.replaceChildren();
  leftPage.scrollTop = 0;
  rightPage.scrollTop = 0;
};

const makeIndexEntry = (entry, index) => {
  const button = createElement("button", "indexEntry");
  button.type = "button";
  button.dataset.entryIndex = index;
  button.append(
    createElement("span", "indexEntryDate", formatDate(entry.date)),
    createElement("span", "indexEntryTitle", entry.title),
    createElement("span", "indexEntryArrow", "↗"),
  );
  return button;
};

const renderIndex = () => {
  activeEntryIndex = -1;
  clearPages();
  indexTab.hidden = true;
  pageControls.hidden = true;

  const title = createElement("h2", "", "Journal index");
  title.id = "bookTitle";
  const intro = createElement(
    "p",
    "bookIntro",
    "Journal entries from time to time, enjoy the room you are in...",
  );
  const leftEntries = createElement("div", "indexEntries");
  const rightEntries = createElement("div", "indexEntries");
  const splitAt = Math.ceil(journalEntries.length / 2);

  journalEntries.forEach((entry, index) => {
    const list = index < splitAt ? leftEntries : rightEntries;
    list.appendChild(makeIndexEntry(entry, index));
  });

  leftPage.append(title, intro, leftEntries);
  rightPage.append(
    createElement("span", "bookKicker", "Choose an entry"),
    createElement("div", "pageFlourish", "❦"),
    rightEntries,
  );
  leftPage.appendChild(createElement("span", "indexNumber", "I"));
  rightPage.appendChild(createElement("span", "indexNumber", "II"));
};

const appendTextBlocks = (container, blocks) => {
  const wrapper = createElement("div", "entryText");
  blocks.forEach((block) => {
    if (!block.value) return;
    wrapper.appendChild(createElement("p", "", block.value));
  });
  container.appendChild(wrapper);
};

const splitTextBlocks = (blocks) => {
  if (blocks.length < 2) return [blocks, []];

  const totalLength = blocks.reduce(
    (total, block) => total + (block.value?.length || 0),
    0,
  );
  let runningLength = 0;
  let splitAt = 1;

  for (let index = 0; index < blocks.length - 1; index += 1) {
    runningLength += blocks[index].value?.length || 0;
    splitAt = index + 1;
    if (runningLength >= totalLength / 2) break;
  }

  return [blocks.slice(0, splitAt), blocks.slice(splitAt)];
};

const renderEntry = (index) => {
  activeEntryIndex = index;
  clearPages();

  const entry = journalEntries[index];
  const textBlocks = entry.content.filter((block) => block.type === "text");
  const imageBlock = entry.content.find((block) => block.type === "image");
  const date = createElement("span", "entryDate", formatDate(entry.date));
  const title = createElement("h2", "entryTitle", entry.title);
  title.id = "bookTitle";
  leftPage.append(date, title);

  if (imageBlock) {
    appendTextBlocks(leftPage, textBlocks);
    const imageWrap = createElement("div", "entryImageWrap");
    const image = createElement("img", "entryImage");
    image.src = imageBlock.src;
    image.alt = imageBlock.alt || "";
    imageWrap.append(
      image,
      createElement("p", "entryImageCaption", imageBlock.alt || "Journal image"),
    );
    rightPage.appendChild(imageWrap);
  } else {
    const [leftBlocks, rightBlocks] = splitTextBlocks(textBlocks);
    appendTextBlocks(leftPage, leftBlocks);

    if (rightBlocks.length) {
      appendTextBlocks(rightPage, rightBlocks);
    } else {
      rightPage.append(
        createElement("div", "pageFlourish", "✦"),
        createElement(
          "p",
          "pageQuote",
          "Small entry huh...",
        ),
      );
    }
  }

  indexTab.hidden = false;
  pageControls.hidden = false;
  pageNumber.textContent = `${index + 1} / ${journalEntries.length}`;
  previousEntry.disabled = index === 0;
  nextEntry.disabled = index === journalEntries.length - 1;
};

const openBook = () => {
  if (!bookReader.hidden) return;
  lastFocusedElement = document.activeElement;
  renderIndex();
  bookReader.hidden = false;
  document.body.classList.add("bookIsOpen");
  requestAnimationFrame(() => {
    bookReader.classList.add("isOpening");
    bookReader.querySelector(".closeBook").focus();
  });
};

const closeBook = () => {
  bookReader.hidden = true;
  bookReader.classList.remove("isOpening");
  if (guestbookReader.hidden) document.body.classList.remove("bookIsOpen");
  lastFocusedElement?.focus?.();
};

const formatGuestbookDate = (dateString) => {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

const renderGuestbookMessages = (messages) => {
  guestbookMessages.replaceChildren();
  const safeMessages = Array.isArray(messages) ? messages.slice(0, 100) : [];

  if (!safeMessages.length) {
    guestbookMessages.appendChild(
      createElement(
        "p",
        "guestbookEmpty",
        "No one has written here yet. You could be the first.",
      ),
    );
    return;
  }

  safeMessages.forEach((message) => {
    const entry = createElement("article", "guestbookMessage");
    const header = createElement("header", "guestbookMessageHeader");
    header.append(
      createElement("h3", "guestbookMessageName", message.name || "Anonymous"),
      createElement(
        "time",
        "guestbookMessageDate",
        formatGuestbookDate(message.createdAt),
      ),
    );
    entry.append(
      header,
      createElement("p", "guestbookMessageText", message.message || ""),
    );
    guestbookMessages.appendChild(entry);
  });
};

const fetchGuestbookMessages = async () => {
  const sources = [guestbookApiUrl, guestbookDataUrl].filter(Boolean);

  for (const source of sources) {
    try {
      const response = await fetch(source, {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      if (!response.ok) continue;
      const payload = await response.json();
      renderGuestbookMessages(payload.messages);
      return;
    } catch (error) {
      // Fall through to the static JSON file when the write API is unavailable.
    }
  }

  guestbookMessages.replaceChildren(
    createElement(
      "p",
      "guestbookEmpty",
      "The shared pages could not be reached. Please try again later.",
    ),
  );
};

const openGuestbook = () => {
  if (!guestbookReader.hidden) return;
  lastFocusedElement = document.activeElement;
  guestbookReader.hidden = false;
  document.body.classList.add("bookIsOpen");
  guestbookStatus.textContent = "";
  fetchGuestbookMessages();
  requestAnimationFrame(() => {
    guestbookReader.classList.add("isOpening");
    guestbookReader.querySelector(".closeBook").focus();
  });
};

const closeGuestbook = () => {
  guestbookReader.hidden = true;
  guestbookReader.classList.remove("isOpening");
  if (bookReader.hidden) document.body.classList.remove("bookIsOpen");
  lastFocusedElement?.focus?.();
};

bookReader.addEventListener("click", (event) => {
  const entryButton = event.target.closest("[data-entry-index]");
  if (entryButton) {
    renderEntry(Number(entryButton.dataset.entryIndex));
    return;
  }

  if (event.target.closest("[data-close-book]")) closeBook();
});

indexTab.addEventListener("click", renderIndex);
previousEntry.addEventListener("click", () => renderEntry(activeEntryIndex - 1));
nextEntry.addEventListener("click", () => renderEntry(activeEntryIndex + 1));
interactionPrompt.addEventListener("click", () => {
  if (activeInteraction === "guestbook") {
    openGuestbook();
  } else {
    openBook();
  }
});

const handleJournalKeys = (event) => {
  if (event.key === "Escape" && !guestbookReader.hidden) {
    event.preventDefault();
    closeGuestbook();
    return;
  }

  if (event.key === "Escape" && !bookReader.hidden) {
    event.preventDefault();
    closeBook();
    return;
  }

  if (
    bookReader.hidden &&
    guestbookReader.hidden &&
    (event.code === "KeyE" || event.key.toLowerCase() === "e")
  ) {
    event.preventDefault();
    if (activeInteraction === "guestbook") {
      openGuestbook();
    } else {
      openBook();
    }
    return;
  }

  if (!bookReader.hidden && activeEntryIndex >= 0) {
    if (event.key === "ArrowLeft" && activeEntryIndex > 0) {
      renderEntry(activeEntryIndex - 1);
    }
    if (
      event.key === "ArrowRight" &&
      activeEntryIndex < journalEntries.length - 1
    ) {
      renderEntry(activeEntryIndex + 1);
    }
  }
};

window.addEventListener("keydown", handleJournalKeys, { capture: true });

const trapBookFocus = (event) => {
  const dialog = event.currentTarget;
  if (event.key !== "Tab" || dialog.hidden) return;
  const focusable = [
    ...dialog.querySelectorAll(
      "button:not([disabled]), a[href], [tabindex]:not([tabindex='-1'])",
    ),
  ].filter((element) => !element.hidden);
  if (!focusable.length) return;

  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
};

bookReader.addEventListener("keydown", trapBookFocus);
guestbookReader.addEventListener("keydown", trapBookFocus);

guestbookReader.addEventListener("click", (event) => {
  if (event.target.closest("[data-close-guestbook]")) closeGuestbook();
});

guestbookForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const submitButton = guestbookForm.querySelector('button[type="submit"]');
  const formData = new FormData(guestbookForm);
  const payload = {
    name: String(formData.get("name") || "").trim(),
    message: String(formData.get("message") || "").trim(),
    website: String(formData.get("website") || ""),
  };

  if (!payload.name || !payload.message) {
    guestbookStatus.textContent = "Please add both a name and a message.";
    return;
  }

  if (!guestbookApiUrl) {
    guestbookStatus.textContent = "The shared guestbook service is not configured.";
    return;
  }

  submitButton.disabled = true;
  guestbookStatus.textContent = "Writing your message...";

  try {
    const response = await fetch(guestbookApiUrl, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(result.error || "The message could not be saved.");
    }

    renderGuestbookMessages(result.messages);
    guestbookForm.reset();
    guestbookStatus.textContent = "Your message is now in the book.";
  } catch (error) {
    guestbookStatus.textContent =
      error.message || "The message could not be saved. Please try again.";
  } finally {
    submitButton.disabled = false;
  }
});

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x08050e);
scene.fog = new THREE.FogExp2(0x090611, 0.026);

const camera = new THREE.PerspectiveCamera(
  62,
  window.innerWidth / window.innerHeight,
  0.1,
  100,
);
camera.position.set(7.2, 4.6, 8.8);

const ROOM_HALF_SIZE = 11.5;
const ROOM_BOTTOM = -0.05;
const ROOM_TOP = 10;

let renderer;
try {
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: "high-performance",
  });
} catch (error) {
  const fallback = createElement(
    "div",
    "webglFallback",
    "This archive needs a browser with WebGL enabled.",
  );
  world.appendChild(fallback);
  throw error;
}

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.domElement.setAttribute(
  "aria-label",
  "A 3D voxel chamber containing an enchantment table",
);
renderer.domElement.tabIndex = 0;
world.appendChild(renderer.domElement);

const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
const clock = new THREE.Clock();
const interactiveMeshes = [];
const animatedRunes = [];
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const centerPointer = new THREE.Vector2(0, 0);
const tableGroup = new THREE.Group();
const bookGroup = new THREE.Group();
const ceilingSolarSystem = new THREE.Group();
const orbitingPlanets = [];
const tempObject = new THREE.Object3D();
const tempColor = new THREE.Color();

scene.add(tableGroup);
scene.add(ceilingSolarSystem);

const makePixelTexture = (palette, size = 64) => {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  context.imageSmoothingEnabled = false;
  context.fillStyle = palette.base;
  context.fillRect(0, 0, size, size);

  for (let index = 0; index < 130; index += 1) {
    const color = index % 3 === 0 ? palette.dark : palette.light;
    const blockSize = 2 + Math.floor(Math.random() * 5);
    context.globalAlpha = 0.14 + Math.random() * 0.22;
    context.fillStyle = color;
    context.fillRect(
      Math.floor(Math.random() * size),
      Math.floor(Math.random() * size),
      blockSize,
      blockSize,
    );
  }

  context.globalAlpha = 1;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestMipmapNearestFilter;
  texture.anisotropy = Math.min(4, maxAnisotropy);
  return texture;
};

const stoneTexture = makePixelTexture({
  base: "#17131d",
  dark: "#08060c",
  light: "#443752",
});
const obsidianTexture = makePixelTexture({
  base: "#160d25",
  dark: "#06030b",
  light: "#4c2d6a",
});
const woodTexture = makePixelTexture({
  base: "#3d221d",
  dark: "#1b0e0b",
  light: "#74402f",
});
const redTexture = makePixelTexture({
  base: "#55191e",
  dark: "#22090d",
  light: "#9b3941",
});

const makeMaterial = (color, map, options = {}) =>
  new THREE.MeshStandardMaterial({
    color,
    map,
    roughness: options.roughness ?? 0.86,
    metalness: options.metalness ?? 0.04,
    emissive: options.emissive ?? 0x000000,
    emissiveIntensity: options.emissiveIntensity ?? 0,
  });

const stoneMaterial = makeMaterial(0xaaa0b2, stoneTexture);
const obsidianMaterial = makeMaterial(0x9a74c5, obsidianTexture, {
  roughness: 0.68,
  metalness: 0.12,
});
const woodMaterial = makeMaterial(0xd7a48a, woodTexture);
const redMaterial = makeMaterial(0xcf7377, redTexture);
const goldMaterial = makeMaterial(0xcaa85b, null, {
  roughness: 0.38,
  metalness: 0.62,
  emissive: 0x3d2500,
  emissiveIntensity: 0.25,
});
const runeMaterial = makeMaterial(0xa684d5, null, {
  roughness: 0.35,
  emissive: 0x4c1d8a,
  emissiveIntensity: 1.8,
});
const boundaryMaterial = new THREE.MeshBasicMaterial({
  color: 0xa98cff,
  fog: false,
  toneMapped: false,
});
const bookMaterials = [0x77323b, 0x31566d, 0x60417b, 0x84612d, 0x315e4c].map(
  (color) => makeMaterial(color, null),
);
const guestbookMaterial = makeMaterial(0x66d1c6, null, {
  emissive: 0x1d706f,
  emissiveIntensity: 0.55,
  roughness: 0.48,
});

const boxGeometry = new THREE.BoxGeometry(1, 1, 1);

const addBox = (
  parent,
  size,
  position,
  material,
  rotation = [0, 0, 0],
) => {
  const mesh = new THREE.Mesh(boxGeometry, material);
  mesh.position.set(...position);
  mesh.scale.set(...size);
  mesh.rotation.set(...rotation);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
};

const createRoomBoundary = () => {
  const roomHeight = ROOM_TOP - ROOM_BOTTOM;
  const roomCenterY = ROOM_BOTTOM + roomHeight / 2;
  const roomSize = ROOM_HALF_SIZE * 2;
  const beamSize = 0.3;

  const wallMaterial = new THREE.MeshBasicMaterial({
    color: 0x2e1749,
    opacity: 0.2,
    side: THREE.BackSide,
    transparent: true,
    depthWrite: false,
    fog: false,
  });
  const roomGeometry = new THREE.BoxGeometry(roomSize, roomHeight, roomSize);
  const roomWalls = new THREE.Mesh(
    roomGeometry,
    wallMaterial,
  );
  roomWalls.position.y = roomCenterY;
  roomWalls.renderOrder = -1;
  scene.add(roomWalls);

  const roomWireframe = new THREE.LineSegments(
    new THREE.EdgesGeometry(roomGeometry),
    new THREE.LineBasicMaterial({
      color: 0xd0baff,
      fog: false,
      opacity: 0.95,
      transparent: true,
    }),
  );
  roomWireframe.position.y = roomCenterY;
  scene.add(roomWireframe);

  const makeBoundaryGrid = (y, opacity) => {
    const grid = new THREE.GridHelper(roomSize, 23, 0xb58cff, 0x4a3268);
    grid.position.y = y;
    grid.material.fog = false;
    grid.material.opacity = opacity;
    grid.material.transparent = true;
    scene.add(grid);
  };

  makeBoundaryGrid(ROOM_BOTTOM + 0.04, 0.5);

  [-ROOM_HALF_SIZE, ROOM_HALF_SIZE].forEach((x) => {
    [-ROOM_HALF_SIZE, ROOM_HALF_SIZE].forEach((z) => {
      addBox(
        scene,
        [beamSize, roomHeight, beamSize],
        [x, roomCenterY, z],
        boundaryMaterial,
      );
    });
  });

  [ROOM_BOTTOM, ROOM_TOP].forEach((y) => {
    [-ROOM_HALF_SIZE, ROOM_HALF_SIZE].forEach((z) => {
      addBox(
        scene,
        [roomSize, beamSize, beamSize],
        [0, y, z],
        boundaryMaterial,
      );
    });
    [-ROOM_HALF_SIZE, ROOM_HALF_SIZE].forEach((x) => {
      addBox(
        scene,
        [beamSize, beamSize, roomSize],
        [x, y, 0],
        boundaryMaterial,
      );
    });
  });
};

const createFloor = () => {
  const radius = Math.floor(ROOM_HALF_SIZE);
  const positions = [];

  for (let x = -radius; x <= radius; x += 1) {
    for (let z = -radius; z <= radius; z += 1) {
      const edgeDistance = Math.max(Math.abs(x), Math.abs(z));
      if (edgeDistance > radius - 2 && Math.random() > 0.72) continue;
      positions.push({
        x,
        y: -0.56 + (Math.random() > 0.93 ? 0.08 : 0),
        z,
        shade: Math.random(),
      });
    }
  }

  const floor = new THREE.InstancedMesh(
    boxGeometry,
    stoneMaterial,
    positions.length,
  );
  positions.forEach((block, index) => {
    tempObject.position.set(block.x, block.y, block.z);
    tempObject.scale.set(0.98, 1, 0.98);
    tempObject.updateMatrix();
    floor.setMatrixAt(index, tempObject.matrix);
    tempColor
      .set(0x393142)
      .offsetHSL(0.015 * block.shade, 0, block.shade * 0.055);
    floor.setColorAt(index, tempColor);
  });
  floor.receiveShadow = true;
  floor.instanceMatrix.needsUpdate = true;
  floor.instanceColor.needsUpdate = true;
  scene.add(floor);
};

const createPillar = (x, z, height) => {
  for (let y = 0; y < height; y += 1) {
    const material = y % 3 === 1 ? obsidianMaterial : stoneMaterial;
    addBox(scene, [1.15, 1, 1.15], [x, y, z], material);
  }
  addBox(scene, [1.65, 0.35, 1.65], [x, height - 0.15, z], obsidianMaterial);
  const lamp = addBox(
    scene,
    [0.42, 0.7, 0.42],
    [x, height + 0.35, z],
    runeMaterial,
  );
  animatedRunes.push({ object: lamp, baseY: height + 0.35, offset: x + z });
};

const createBookshelf = (x, z, rotationY = 0, options = {}) => {
  const shelf = new THREE.Group();
  shelf.position.set(x, 0, z);
  shelf.rotation.y = rotationY;
  const shelfWidth = 4.8;
  const shelfHeight = 7.1;
  const rowCount = 4;
  const rowHeight = 1.65;

  addBox(shelf, [shelfWidth, 0.38, 0.8], [0, 0.1, 0], woodMaterial);
  addBox(
    shelf,
    [shelfWidth, 0.32, 0.8],
    [0, shelfHeight, 0],
    woodMaterial,
  );
  addBox(
    shelf,
    [0.34, shelfHeight + 0.3, 0.8],
    [-shelfWidth / 2 + 0.17, shelfHeight / 2, 0],
    woodMaterial,
  );
  addBox(
    shelf,
    [0.34, shelfHeight + 0.3, 0.8],
    [shelfWidth / 2 - 0.17, shelfHeight / 2, 0],
    woodMaterial,
  );

  for (let row = 0; row < rowCount; row += 1) {
    const shelfY = 0.3 + row * rowHeight;
    if (row > 0) {
      addBox(shelf, [shelfWidth, 0.24, 0.8], [0, shelfY, 0], woodMaterial);
    }

    for (let index = 0; index < 13; index += 1) {
      const isGuestbook = options.guestbook && row === 2 && index === 6;
      const height = isGuestbook
        ? 1.48
        : 1.05 + ((index + row * 2) % 4) * 0.12;
      const material = isGuestbook
        ? guestbookMaterial
        : bookMaterials[(index + row * 3) % bookMaterials.length];
      const bookX = -1.82 + index * 0.3;
      const bookY = shelfY + 0.16 + height / 2;
      const bookZ = isGuestbook ? 0.22 : -0.02;
      const book = addBox(
        shelf,
        [isGuestbook ? 0.34 : 0.25, height, 0.58],
        [bookX, bookY, bookZ],
        material,
        [0, 0, isGuestbook ? -0.04 : (index + row) % 6 === 0 ? 0.06 : -0.015],
      );

      if (isGuestbook) {
        book.userData.interactive = "guestbook";
        interactiveMeshes.push(book);
        addBox(
          shelf,
          [0.045, height - 0.12, 0.62],
          [bookX, bookY, bookZ + 0.015],
          goldMaterial,
        );
      }
    }
  }

  scene.add(shelf);
};

const createCeilingSolarSystem = () => {
  const ceilingY = ROOM_TOP - 0.45;
  ceilingSolarSystem.position.y = ceilingY;

  const ceilingDisc = new THREE.Mesh(
    new THREE.CircleGeometry(10.4, 64),
    new THREE.MeshBasicMaterial({
      color: 0x08050f,
      opacity: 0.94,
      side: THREE.DoubleSide,
      transparent: true,
      fog: false,
    }),
  );
  ceilingDisc.rotation.x = Math.PI / 2;
  ceilingSolarSystem.add(ceilingDisc);

  const sunMaterial = new THREE.MeshBasicMaterial({
    color: 0xffc35a,
    fog: false,
    toneMapped: false,
  });
  const sun = new THREE.Mesh(new THREE.SphereGeometry(0.72, 20, 14), sunMaterial);
  sun.position.y = -0.42;
  ceilingSolarSystem.add(sun);

  const sunLight = new THREE.PointLight(
    0xffc46b,
    42,
    ROOM_HALF_SIZE * 3,
    2,
  );
  sunLight.position.copy(sun.position);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.set(1024, 1024);
  sunLight.shadow.bias = -0.0005;
  sunLight.shadow.normalBias = 0.03;
  ceilingSolarSystem.add(sunLight);

  const planets = [
    { radius: 1.5, size: 0.15, color: 0xa9978d, speed: 0.75 },
    { radius: 2.25, size: 0.22, color: 0xe0a967, speed: 0.58 },
    { radius: 3.05, size: 0.24, color: 0x5e9fdb, speed: 0.45 },
    { radius: 3.85, size: 0.2, color: 0xb85d42, speed: 0.36 },
    { radius: 5.0, size: 0.46, color: 0xc59b72, speed: 0.24 },
    { radius: 6.3, size: 0.4, color: 0xd6be83, speed: 0.18, ring: true },
    { radius: 7.5, size: 0.31, color: 0x75b5c7, speed: 0.13 },
    { radius: 8.6, size: 0.3, color: 0x586fc3, speed: 0.1 },
  ];

  planets.forEach((planet, index) => {
    const orbitRing = new THREE.Mesh(
      new THREE.RingGeometry(planet.radius - 0.018, planet.radius + 0.018, 96),
      new THREE.MeshBasicMaterial({
        color: index % 2 ? 0x70508e : 0x426f83,
        opacity: 0.65,
        side: THREE.DoubleSide,
        transparent: true,
        fog: false,
      }),
    );
    orbitRing.rotation.x = Math.PI / 2;
    orbitRing.position.y = -0.12;
    ceilingSolarSystem.add(orbitRing);

    const pivot = new THREE.Group();
    pivot.rotation.y = index * 0.83;
    ceilingSolarSystem.add(pivot);

    const planetMesh = new THREE.Mesh(
      new THREE.SphereGeometry(planet.size, 16, 12),
      new THREE.MeshStandardMaterial({
        color: planet.color,
        emissive: planet.color,
        emissiveIntensity: 0.2,
        roughness: 0.75,
      }),
    );
    planetMesh.position.set(planet.radius, -0.42, 0);
    pivot.add(planetMesh);

    if (planet.ring) {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(planet.size * 1.35, planet.size * 2.05, 32),
        new THREE.MeshBasicMaterial({
          color: 0xdfc38f,
          opacity: 0.8,
          side: THREE.DoubleSide,
          transparent: true,
        }),
      );
      ring.rotation.x = Math.PI / 2.5;
      planetMesh.add(ring);
    }

    orbitingPlanets.push({ pivot, speed: planet.speed });
  });
};

const createTable = () => {
  addBox(tableGroup, [3.2, 0.42, 3.2], [0, 0.05, 0], obsidianMaterial);
  addBox(tableGroup, [2.55, 0.42, 2.55], [0, 0.43, 0], redMaterial);
  addBox(tableGroup, [2.75, 0.3, 2.75], [0, 1.76, 0], obsidianMaterial);
  addBox(tableGroup, [2.38, 0.24, 2.38], [0, 1.98, 0], redMaterial);

  const corners = [
    [-1.02, -1.02],
    [1.02, -1.02],
    [-1.02, 1.02],
    [1.02, 1.02],
  ];
  corners.forEach(([x, z]) => {
    addBox(tableGroup, [0.58, 1.35, 0.58], [x, 1.05, z], obsidianMaterial);
    addBox(tableGroup, [0.29, 0.29, 0.29], [x, 2.19, z], goldMaterial);
  });

  const glyphPositions = [
    [-0.65, 2.15, -1.2],
    [0, 2.15, -1.2],
    [0.65, 2.15, -1.2],
    [-1.2, 2.15, 0],
    [1.2, 2.15, 0],
    [-0.65, 2.15, 1.2],
    [0, 2.15, 1.2],
    [0.65, 2.15, 1.2],
  ];
  glyphPositions.forEach((position) => {
    addBox(tableGroup, [0.3, 0.08, 0.3], position, runeMaterial);
  });

  bookGroup.position.set(0, 3.15, 0);
  bookGroup.rotation.y = -0.24;
  tableGroup.add(bookGroup);

  const pageMaterial = makeMaterial(0xead9aa, null, {
    roughness: 0.94,
    emissive: 0x3b2b12,
    emissiveIntensity: 0.12,
  });
  const coverMaterial = makeMaterial(0x6d2028, redTexture, {
    roughness: 0.65,
  });

  const leftCover = addBox(
    bookGroup,
    [1.36, 0.1, 1.72],
    [-0.62, 0, 0],
    coverMaterial,
    [0, 0, -0.19],
  );
  const rightCover = addBox(
    bookGroup,
    [1.36, 0.1, 1.72],
    [0.62, 0, 0],
    coverMaterial,
    [0, 0, 0.19],
  );
  const leftPages = addBox(
    bookGroup,
    [1.25, 0.13, 1.6],
    [-0.58, 0.09, 0],
    pageMaterial,
    [0, 0, -0.16],
  );
  const rightPages = addBox(
    bookGroup,
    [1.25, 0.13, 1.6],
    [0.58, 0.09, 0],
    pageMaterial,
    [0, 0, 0.16],
  );
  const spine = addBox(
    bookGroup,
    [0.16, 0.22, 1.75],
    [0, -0.02, 0],
    coverMaterial,
  );

  [leftCover, rightCover, leftPages, rightPages, spine].forEach((mesh) => {
    mesh.userData.interactive = "journal";
    interactiveMeshes.push(mesh);
  });
};

const createRuneSprite = (symbol, color) => {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const context = canvas.getContext("2d");
  context.clearRect(0, 0, 128, 128);
  context.font = "72px Georgia";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.shadowBlur = 18;
  context.shadowColor = color;
  context.fillStyle = color;
  context.fillText(symbol, 64, 64);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    opacity: 0.68,
    depthWrite: false,
  });
  return new THREE.Sprite(material);
};

const createFloatingRunes = () => {
  const symbols = ["ᚱ", "ᛟ", "ᛞ", "ᚹ", "ᚨ", "ᛇ", "ᛉ", "ᚾ"];
  symbols.forEach((symbol, index) => {
    const angle = (index / symbols.length) * Math.PI * 2;
    const sprite = createRuneSprite(symbol, index % 2 ? "#9e7bff" : "#62e8ff");
    sprite.position.set(
      Math.cos(angle) * 4.7,
      2.5 + (index % 3) * 0.9,
      Math.sin(angle) * 4.7,
    );
    sprite.scale.set(0.72, 0.72, 0.72);
    scene.add(sprite);
    animatedRunes.push({
      object: sprite,
      baseY: sprite.position.y,
      offset: index * 0.73,
      orbit: angle,
    });
  });
};

const createDust = () => {
  const count = 520;
  const positions = new Float32Array(count * 3);
  for (let index = 0; index < count; index += 1) {
    positions[index * 3] = (Math.random() - 0.5) * 31;
    positions[index * 3 + 1] = Math.random() * 11;
    positions[index * 3 + 2] = (Math.random() - 0.5) * 31;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color: 0xbda7ff,
    size: 0.035,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
  });
  const points = new THREE.Points(geometry, material);
  points.userData.isDust = true;
  scene.add(points);
  return points;
};

createRoomBoundary();
createFloor();
createCeilingSolarSystem();
[
  [-9, -9, 5],
  [9, -9, 5],
  [-9, 9, 5],
  [9, 9, 5],
].forEach(([x, z, height]) => createPillar(x, z, height));
[-6, 6].forEach((x) => createBookshelf(x, -10.65, 0));
createBookshelf(0, -10.65, 0, { guestbook: true });
[-6.2, 0, 6.2].forEach((z) => {
  createBookshelf(-10.65, z, Math.PI / 2);
  createBookshelf(10.65, z, -Math.PI / 2);
});
createTable();
createFloatingRunes();
const dust = createDust();

const hemisphereLight = new THREE.HemisphereLight(0x8d7ad1, 0x100815, 1.35);
scene.add(hemisphereLight);

const tableLight = new THREE.PointLight(0x8f51ff, 18, 16, 2);
tableLight.position.set(0, 4.3, 0);
tableLight.castShadow = true;
tableLight.shadow.mapSize.set(512, 512);
scene.add(tableLight);

let activeInteraction = null;

camera.lookAt(0, 3.15, 0);

renderer.domElement.addEventListener("click", (event) => {
  if (!bookReader.hidden || !guestbookReader.hidden) return;
  const bounds = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
  pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const intersection = raycaster.intersectObjects(interactiveMeshes, false)[0];
  if (!intersection) return;
  if (intersection.object.userData.interactive === "guestbook") {
    openGuestbook();
  } else {
    openBook();
  }
});

const updateBookInteraction = () => {
  raycaster.setFromCamera(centerPointer, camera);
  const intersections = raycaster.intersectObjects(interactiveMeshes, false);
  const interaction =
    intersections.length > 0 && intersections[0].distance < 18.5
      ? intersections[0].object.userData.interactive
      : null;
  if (interaction === activeInteraction) return;

  activeInteraction = interaction;
  interactionPrompt.hidden = !interaction;
  interactionPromptLabel.textContent =
    interaction === "guestbook" ? "Open visitors' volume" : "Open journal";
  renderer.domElement.classList.toggle("canInteract", Boolean(interaction));
};

const animate = () => {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.05);
  const elapsed = clock.elapsedTime;

  if (!reduceMotion) {
    bookGroup.position.y = 3.15 + Math.sin(elapsed * 1.45) * 0.11;
    bookGroup.rotation.y = -0.24 + Math.sin(elapsed * 0.48) * 0.1;
    tableLight.intensity = 17 + Math.sin(elapsed * 2.1) * 1.4;
    dust.rotation.y = elapsed * 0.012;
    orbitingPlanets.forEach(({ pivot, speed }) => {
      pivot.rotation.y += delta * speed;
    });

    animatedRunes.forEach((rune, index) => {
      rune.object.position.y =
        rune.baseY + Math.sin(elapsed * 1.1 + rune.offset) * 0.16;
      if (rune.object.isSprite) {
        rune.object.material.opacity =
          0.48 + Math.sin(elapsed * 1.5 + index) * 0.18;
      }
    });
  }

  updateBookInteraction();
  renderer.render(scene, camera);
};

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
});

animate();
window.__journalSceneStarted = true;

if (
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1") &&
  new URLSearchParams(window.location.search).has("guestbook")
) {
  openGuestbook();
}
