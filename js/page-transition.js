const transitionOverlay = document.createElement("div");
transitionOverlay.className = "page-transition-overlay";
document.body.appendChild(transitionOverlay);

const hideOverlay = () => {
  requestAnimationFrame(() => {
    transitionOverlay.classList.add("is-hidden");
    transitionOverlay.classList.remove("is-active");
  });
};

const showOverlayAndNavigate = (url) => {
  transitionOverlay.classList.remove("is-hidden");
  transitionOverlay.classList.add("is-active");

  window.setTimeout(() => {
    window.location.href = url;
  }, 1000);
};

hideOverlay();

window.addEventListener("pageshow", hideOverlay);

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

  const href = link.getAttribute("href");

  if (
    !href ||
    href.startsWith("#") ||
    link.target === "_blank" ||
    link.hasAttribute("download")
  ) {
    return;
  }

  const destination = new URL(link.href, window.location.href);

  if (destination.origin !== window.location.origin) {
    return;
  }

  if (destination.href === window.location.href) {
    return;
  }

  event.preventDefault();
  showOverlayAndNavigate(destination.href);
});
