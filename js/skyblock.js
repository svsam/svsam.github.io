const lookupForm = document.getElementById("lookupForm");
const lookupButton = document.getElementById("lookupButton");
const profileLoadButton = document.getElementById("profileLoadButton");
const usernameInput = document.getElementById("usernameInput");
const profileSelect = document.getElementById("profileSelect");
const targetSelect = document.getElementById("targetSelect");
const playerSkull = document.getElementById("playerSkull");
const statusMessage = document.getElementById("statusMessage");
const summaryPanel = document.getElementById("summaryPanel");
const summaryPlayer = document.getElementById("summaryPlayer");
const summaryProfile = document.getElementById("summaryProfile");
const summaryMp = document.getElementById("summaryMp");
const summaryOwned = document.getElementById("summaryOwned");
const summaryPriced = document.getElementById("summaryPriced");
const summarySpecial = document.getElementById("summarySpecial");
const pathPanel = document.getElementById("pathPanel");
const pathTotals = document.getElementById("pathTotals");
const pathList = document.getElementById("pathList");
const filtersPanel = document.getElementById("filtersPanel");
const rarityFilter = document.getElementById("rarityFilter");
const methodFilter = document.getElementById("methodFilter");
const maxPriceFilter = document.getElementById("maxPriceFilter");
const recommendationsPanel = document.getElementById("recommendationsPanel");
const recommendationsBody = document.getElementById("recommendationsBody");
const tableCount = document.getElementById("tableCount");
const specialPanel = document.getElementById("specialPanel");
const specialCount = document.getElementById("specialCount");
const specialList = document.getElementById("specialList");

const apiUrl =
  document.querySelector('meta[name="skyblock-api"]')?.content.trim() || "";

let latestResult = null;
let loadedUsername = "";
let sortState = {
  key: "costPerMp",
  direction: "asc",
};

function setStatus(message, isError = false) {
  statusMessage.textContent = message;
  statusMessage.classList.toggle("isError", isError);
}

function setPlayerSkull(player) {
  if (!playerSkull) return;

  const fallback = playerSkull.dataset.defaultSrc || "../css/Images/Enchanting_table.gif";
  const uuid = player?.uuid ? String(player.uuid).replace(/-/g, "") : "";

  if (!uuid) {
    playerSkull.src = fallback;
    playerSkull.alt = "";
    return;
  }

  playerSkull.alt = `${player.username || "Minecraft player"} skull`;
  playerSkull.src = `https://crafatar.com/avatars/${encodeURIComponent(uuid)}?size=128&overlay`;
}

if (playerSkull) {
  playerSkull.addEventListener("error", () => {
    const fallback = playerSkull.dataset.defaultSrc || "../css/Images/Enchanting_table.gif";
    if (playerSkull.getAttribute("src") !== fallback) {
      playerSkull.src = fallback;
      playerSkull.alt = "";
    }
  });
}

function formatCoins(value) {
  if (!Number.isFinite(value)) return "-";
  return new Intl.NumberFormat("en-GB", {
    maximumFractionDigits: value >= 1000000 ? 1 : 0,
    notation: value >= 1000000 ? "compact" : "standard",
  }).format(value);
}

function formatExactCoins(value) {
  if (!Number.isFinite(value)) return "-";
  return `${new Intl.NumberFormat("en-GB").format(Math.round(value))} coins`;
}

function formatNumber(value) {
  if (!Number.isFinite(value)) return "-";
  return new Intl.NumberFormat("en-GB").format(value);
}

function makeCell(text, className = "") {
  const cell = document.createElement("td");
  if (className) cell.className = className;
  cell.textContent = text;
  return cell;
}

function makePill(text, type) {
  const pill = document.createElement("span");
  const normalized = String(text || "OTHER").replace(/\s+/g, "-");
  pill.className =
    type === "rarity" ? `rarityPill rarity-${normalized}` : "methodPill";
  pill.textContent = text || "Other";
  return pill;
}

function getFilteredRecommendations() {
  if (!latestResult) return [];

  const rarity = rarityFilter.value;
  const method = methodFilter.value;
  const maxPrice = Number(maxPriceFilter.value || 0);
  const hasMaxPrice = Number.isFinite(maxPrice) && maxPrice > 0;

  return latestResult.recommendations
    .filter((item) => !rarity || item.rarity === rarity)
    .filter((item) => !method || item.method === method)
    .filter((item) => !hasMaxPrice || item.cost <= maxPrice)
    .sort((left, right) => {
      const key = sortState.key;
      const a = left[key];
      const b = right[key];
      let result = 0;

      if (typeof a === "number" && typeof b === "number") {
        result = a - b;
      } else {
        result = String(a || "").localeCompare(String(b || ""));
      }

      return sortState.direction === "asc" ? result : -result;
    });
}

function renderProfiles(profiles = []) {
  profileSelect.replaceChildren();

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = profiles.length ? "Select a profile" : "No profiles loaded";
  profileSelect.appendChild(placeholder);

  profiles.forEach((profile) => {
    const option = document.createElement("option");
    option.value = profile.profileId;
    option.textContent = profile.cuteName || profile.profileId;
    profileSelect.appendChild(option);
  });

  profileSelect.disabled = profiles.length === 0;
  if (profiles.length === 1) {
    profileSelect.value = profiles[0].profileId;
  }
}

function clearResultPanels() {
  latestResult = null;
  summaryPanel.hidden = true;
  pathPanel.hidden = true;
  filtersPanel.hidden = true;
  recommendationsPanel.hidden = true;
  specialPanel.hidden = true;
  recommendationsBody.replaceChildren();
  specialList.replaceChildren();
}

function renderSummary(result) {
  summaryPlayer.textContent = result.player?.username || usernameInput.value || "-";
  summaryProfile.textContent = result.profile?.cuteName || result.profile?.profileId || "-";
  summaryMp.textContent = formatNumber(result.summary?.currentMagicPower || 0);
  summaryOwned.textContent = formatNumber(result.summary?.ownedAccessoryCount || 0);
  summaryPriced.textContent = formatNumber(result.summary?.pricedMissingCount || 0);
  summarySpecial.textContent = formatNumber(result.summary?.specialMissingCount || 0);
  summaryPanel.hidden = false;
}

function renderPath(path) {
  pathList.replaceChildren();
  if (!path) {
    pathPanel.hidden = true;
    return;
  }

  const reached = Number(path.currentMagicPower || 0) + Number(path.magicPowerGained || 0);
  pathTotals.textContent = `${formatNumber(reached)} / ${formatNumber(path.targetMagicPower)} MP, ${formatExactCoins(path.totalCost || 0)}`;

  if (!path.items?.length) {
    const item = document.createElement("li");
    item.textContent = path.message || "No priced upgrades are needed for this target.";
    pathList.appendChild(item);
    pathPanel.hidden = false;
    return;
  }

  path.items.forEach((upgrade) => {
    const item = document.createElement("li");
    item.textContent = upgrade.name;

    const details = document.createElement("span");
    details.textContent = `+${upgrade.magicPower} MP, ${formatExactCoins(upgrade.cost)}, ${formatCoins(upgrade.costPerMp)} coins / MP`;
    item.appendChild(details);

    pathList.appendChild(item);
  });

  pathPanel.hidden = false;
}

function renderRecommendations() {
  const rows = getFilteredRecommendations();
  recommendationsBody.replaceChildren();
  tableCount.textContent = `${formatNumber(rows.length)} shown`;

  if (!rows.length) {
    const row = document.createElement("tr");
    row.className = "emptyRow";
    const cell = makeCell("No priced missing accessories match these filters.");
    cell.colSpan = 8;
    row.appendChild(cell);
    recommendationsBody.appendChild(row);
    return;
  }

  rows.forEach((item) => {
    const row = document.createElement("tr");

    const nameCell = makeCell("");
    const name = document.createElement("span");
    name.className = "accessoryName";
    name.textContent = item.name;
    nameCell.appendChild(name);
    if (item.priceNote) {
      const note = document.createElement("div");
      note.className = "materialsList";
      note.textContent = item.priceNote;
      nameCell.appendChild(note);
    }

    const rarityCell = makeCell("");
    rarityCell.appendChild(makePill(item.rarity, "rarity"));

    const methodCell = makeCell("");
    methodCell.appendChild(makePill(item.methodLabel || item.method, "method"));

    const materialsCell = makeCell("");
    const materials = document.createElement("p");
    materials.className = "materialsList";
    materials.textContent = item.materials?.length
      ? item.materials.map((material) => `${formatNumber(material.amount)} ${material.name}`).join(", ")
      : item.materialsText || "-";
    materialsCell.appendChild(materials);

    const wikiCell = makeCell("");
    const wiki = document.createElement("a");
    wiki.className = "wikiLink";
    wiki.href = item.wikiUrl;
    wiki.target = "_blank";
    wiki.rel = "noopener noreferrer";
    wiki.textContent = "Wiki";
    wikiCell.appendChild(wiki);

    row.append(
      nameCell,
      rarityCell,
      makeCell(formatNumber(item.magicPower)),
      makeCell(formatExactCoins(item.cost)),
      makeCell(formatCoins(item.costPerMp)),
      methodCell,
      materialsCell,
      wikiCell,
    );

    recommendationsBody.appendChild(row);
  });
}

function renderSpecial(items = []) {
  specialList.replaceChildren();
  specialCount.textContent = `${formatNumber(items.length)} listed`;

  items.forEach((item) => {
    const card = document.createElement("article");
    card.className = "specialCard";

    const title = document.createElement("h3");
    title.textContent = item.name;

    const details = document.createElement("dl");
    [
      ["Rarity", item.rarity || "-"],
      ["MP", formatNumber(item.magicPower || 0)],
      ["Reason", item.reason || "No reliable market price."],
      ["Obtain", item.obtain || item.source || "-"],
    ].forEach(([label, value]) => {
      const term = document.createElement("dt");
      const definition = document.createElement("dd");
      term.textContent = label;
      definition.textContent = value;
      details.append(term, definition);
    });

    const linkTerm = document.createElement("dt");
    const linkDefinition = document.createElement("dd");
    const link = document.createElement("a");
    link.className = "wikiLink";
    link.href = item.wikiUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "Wiki";
    linkTerm.textContent = "Link";
    linkDefinition.appendChild(link);
    details.append(linkTerm, linkDefinition);

    card.append(title, details);
    specialList.appendChild(card);
  });

  specialPanel.hidden = !items.length;
}

function renderResult(result) {
  latestResult = result;
  setPlayerSkull(result.player);
  renderProfiles(result.profiles);
  profileSelect.value = result.profile?.profileId || profileSelect.value;
  renderSummary(result);
  renderPath(result.path);
  renderRecommendations();
  renderSpecial(result.special);

  filtersPanel.hidden = false;
  recommendationsPanel.hidden = false;

  const warningText = result.warnings?.length ? ` ${result.warnings.join(" ")}` : "";
  setStatus(`Prices updated from live Hypixel data.${warningText}`);
}

async function submitLookup() {
  if (!apiUrl) {
    setStatus("The SkyBlock backend is not configured.", true);
    return;
  }

  const username = usernameInput.value.trim();
  const profile = profileSelect.value;
  const target = targetSelect.value;

  if (!username) {
    setStatus("Enter a Minecraft username or UUID.", true);
    usernameInput.focus();
    return;
  }

  if (username.toLowerCase() !== loadedUsername.toLowerCase()) {
    await loadProfiles();
    return;
  }

  if (!profile) {
    setStatus("Choose a profile first.", true);
    profileSelect.focus();
    return;
  }

  const params = new URLSearchParams({ username, target });
  params.set("profile", profile);

  lookupButton.disabled = true;
  setStatus("Fetching SkyBlock profile and market data...");

  try {
    const response = await fetch(`${apiUrl}/recommendations?${params.toString()}`, {
      headers: {
        Accept: "application/json",
      },
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(payload.error || `The backend returned ${response.status}.`);
    }

    renderResult(payload);
  } catch (error) {
    setStatus(error.message || "The lookup failed.", true);
  } finally {
    lookupButton.disabled = false;
  }
}

async function loadProfiles() {
  if (!apiUrl) {
    setStatus("The SkyBlock backend is not configured.", true);
    return;
  }

  const username = usernameInput.value.trim();
  if (!username) {
    setStatus("Enter a Minecraft username or UUID.", true);
    usernameInput.focus();
    return;
  }

  profileLoadButton.disabled = true;
  lookupButton.disabled = true;
  renderProfiles([]);
  clearResultPanels();
  setStatus("Loading SkyBlock profiles...");

  try {
    const params = new URLSearchParams({ username });
    const response = await fetch(`${apiUrl}/profiles?${params.toString()}`, {
      headers: {
        Accept: "application/json",
      },
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(payload.error || `The backend returned ${response.status}.`);
    }

    loadedUsername = username;
    setPlayerSkull(payload.player);
    renderProfiles(payload.profiles || []);
    setStatus(
      payload.profiles?.length
        ? "Choose a profile, then find upgrades."
        : "No SkyBlock profiles were found for this player.",
      !payload.profiles?.length,
    );
  } catch (error) {
    loadedUsername = "";
    setPlayerSkull(null);
    renderProfiles([]);
    setStatus(error.message || "Could not load profiles.", true);
  } finally {
    profileLoadButton.disabled = false;
    lookupButton.disabled = false;
  }
}

lookupForm.addEventListener("submit", (event) => {
  event.preventDefault();
  submitLookup();
});

[rarityFilter, methodFilter, maxPriceFilter].forEach(
  (control) => {
    control.addEventListener("input", () => {
      if (latestResult) renderRecommendations();
    });
  },
);

profileLoadButton.addEventListener("click", loadProfiles);

usernameInput.addEventListener("input", () => {
  loadedUsername = "";
  setPlayerSkull(null);
  renderProfiles([]);
  clearResultPanels();
  setStatus("");
});

targetSelect.addEventListener("change", () => {
  if (latestResult) submitLookup();
});

profileSelect.addEventListener("change", () => {
  clearResultPanels();
  setStatus(profileSelect.value ? "Profile selected. Ready to find upgrades." : "");
});

recommendationsPanel.addEventListener("click", (event) => {
  const button = event.target.closest("[data-sort]");
  if (!button) return;

  const key = button.dataset.sort;
  if (sortState.key === key) {
    sortState.direction = sortState.direction === "asc" ? "desc" : "asc";
  } else {
    sortState = {
      key,
      direction: key === "name" || key === "rarity" || key === "method" ? "asc" : "desc",
    };
  }

  renderRecommendations();
});
