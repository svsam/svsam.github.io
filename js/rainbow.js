const fallbackPalettes = {
  default: ["#2d345d", "#6f5270", "#7a5d79"],
  space: ["#7fb8ff", "#77f4ff", "#b59cff", "#ff86d7", "#dcecff"],
};

const getStyleValue = (styles, propertyName) =>
  styles.getPropertyValue(propertyName).trim();

const getPaletteFromStyles = (target, mode) => {
  const targetStyles = getComputedStyle(target);
  const rootStyles = getComputedStyle(document.documentElement);
  const propertyNames =
    mode === "space"
      ? [
          "--space-rainbow-blue",
          "--space-rainbow-cyan",
          "--space-rainbow-violet",
          "--space-rainbow-pink",
          "--space-rainbow-star",
        ]
      : ["--ink-heading", "--ink-label", "--ink-marker"];

  return propertyNames
    .map(
      (propertyName) =>
        getStyleValue(targetStyles, propertyName) ||
        getStyleValue(rootStyles, propertyName)
    )
    .filter(Boolean);
};

const rainbowTargets = Array.from(document.querySelectorAll("[data-rainbow]"));
const legacyRainbowTitle = document.getElementById("rainbow");

if (legacyRainbowTitle && !rainbowTargets.includes(legacyRainbowTitle)) {
  rainbowTargets.push(legacyRainbowTitle);
}

rainbowTargets.forEach((target) => {
  const mode = target.dataset.rainbow || "default";
  const palette = getPaletteFromStyles(target, mode);
  const colors =
    palette.length > 0 ? palette : fallbackPalettes[mode] || fallbackPalettes.default;

  let paletteIndex = 0;

  const applyPaletteColor = () => {
    target.style.color = colors[paletteIndex];
    paletteIndex = (paletteIndex + 1) % colors.length;
  };

  applyPaletteColor();
  setInterval(applyPaletteColor, 3200);
});
