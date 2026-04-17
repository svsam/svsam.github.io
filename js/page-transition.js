const transitionOverlay = document.createElement("div");
transitionOverlay.className = "page-transition-overlay";
document.body.appendChild(transitionOverlay);

const pageNames = {
  home: "Homepage",
  journal: "Journal",
  cv: "CV",
};

const pageViews = Array.from(document.querySelectorAll(".pageView[data-page]"));
const pageLinks = Array.from(document.querySelectorAll("[data-page-link]"));
const pageLabel = document.getElementById("pageLabel");
const mainBox = document.querySelector(".mainBox");
const contentColumn = document.querySelector(".contentColumn");

let activePage = null;
let transitionTimer = null;

const hasPage = (pageId) =>
  Object.prototype.hasOwnProperty.call(pageNames, pageId);

const resolvePageId = (candidate) => {
  if (!candidate) {
    return null;
  }

  const normalized = candidate.trim().toLowerCase();
  return hasPage(normalized) ? normalized : null;
};

const normalizePage = (candidate) => resolvePageId(candidate) || "home";

const resolvePageFromHref = (href) => {
  if (!href) {
    return null;
  }

  const cleanedHref = href.trim();

  if (!cleanedHref) {
    return null;
  }

  if (cleanedHref.startsWith("#")) {
    return resolvePageId(cleanedHref.slice(1));
  }

  const path = cleanedHref
    .split("#")[0]
    .split("?")[0]
    .replace(/\\/g, "/")
    .toLowerCase();

  if (!path || path === "." || path === "./" || path.endsWith("/")) {
    return "home";
  }

  if (path.endsWith("index.html")) {
    return "home";
  }

  if (path.endsWith("journal.html")) {
    return "journal";
  }

  if (path.endsWith("cv.html")) {
    return "cv";
  }

  return null;
};

const resolvePageFromLocation = () => {
  const hashPage = resolvePageId(window.location.hash.replace("#", ""));

  if (hashPage) {
    return hashPage;
  }

  const path = window.location.pathname.replace(/\\/g, "/").toLowerCase();

  if (path.endsWith("journal.html")) {
    return "journal";
  }

  if (path.endsWith("cv.html")) {
    return "cv";
  }

  return "home";
};

const buildUrlForPage = (pageId) => {
  if (pageId === "home") {
    return `${window.location.pathname}${window.location.search}`;
  }

  return `#${pageId}`;
};

const hideOverlay = () => {
  requestAnimationFrame(() => {
    transitionOverlay.classList.add("is-hidden");
    transitionOverlay.classList.remove("is-active");
  });
};

const showOverlay = () => {
  transitionOverlay.classList.remove("is-hidden");
  transitionOverlay.classList.add("is-active");
};

const renderPage = (pageId) => {
  activePage = normalizePage(pageId);
  document.body.dataset.page = activePage;

  if (mainBox) {
    mainBox.dataset.activePage = activePage;
  }

  if (pageLabel) {
    pageLabel.textContent = pageNames[activePage];
  }

  document.title =
    activePage === "home" ? "SvS" : `SvS | ${pageNames[activePage]}`;

  pageViews.forEach((view) => {
    const isActive = view.dataset.page === activePage;
    view.hidden = !isActive;
    view.classList.toggle("is-active", isActive);
  });

  pageLinks.forEach((link) => {
    const isActive = link.dataset.pageLink === activePage;

    if (isActive) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });

  const activeShell = document.querySelector(".pageView.is-active .pageShell");
  activeShell?.scrollTo({ top: 0, behavior: "auto" });
  contentColumn?.scrollTo({ top: 0, behavior: "auto" });
  window.scrollTo({ top: 0, behavior: "auto" });
};

const setPage = (
  pageId,
  { animate = false, updateHistory = false, replaceHistory = false } = {}
) => {
  const nextPage = normalizePage(pageId);
  const shouldWriteHistory = updateHistory || replaceHistory;

  if (nextPage === activePage) {
    return;
  }

  window.clearTimeout(transitionTimer);

  if (animate) {
    showOverlay();
  }

  const finishTransition = () => {
    renderPage(nextPage);

    if (shouldWriteHistory) {
      const historyMethod = replaceHistory ? "replaceState" : "pushState";
      window.history[historyMethod]({ page: nextPage }, "", buildUrlForPage(nextPage));
    }

    hideOverlay();
  };

  if (animate) {
    transitionTimer = window.setTimeout(finishTransition, 180);
    return;
  }

  finishTransition();
};

const syncPageWithLocation = () => {
  const locationPage = resolvePageFromLocation();

  if (locationPage !== activePage) {
    setPage(locationPage);
  }
};

renderPage(resolvePageFromLocation());
window.history.replaceState({ page: activePage }, "", buildUrlForPage(activePage));
hideOverlay();

window.addEventListener("pageshow", hideOverlay);
window.addEventListener("popstate", syncPageWithLocation);
window.addEventListener("hashchange", syncPageWithLocation);

document.addEventListener("click", (event) => {
  const link = event.target.closest("a");

  if (!link) {
    return;
  }

  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  ) {
    return;
  }

  if (link.target === "_blank" || link.hasAttribute("download")) {
    return;
  }

  const pageFromData = resolvePageId(link.dataset.pageLink);
  const pageFromHref = resolvePageFromHref(link.getAttribute("href"));
  const targetPage = pageFromData || pageFromHref;

  if (!targetPage) {
    return;
  }

  const destination = new URL(link.href, window.location.href);
  const isLocalFileNavigation =
    destination.protocol === "file:" && window.location.protocol === "file:";

  if (!isLocalFileNavigation && destination.origin !== window.location.origin) {
    return;
  }

  event.preventDefault();
  setPage(targetPage, { animate: true, updateHistory: true });
});
