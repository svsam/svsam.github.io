const rainbowTitle = document.getElementById("rainbow");

if (rainbowTitle) {
  const computedStyles = getComputedStyle(document.documentElement);
  const palette = [
    computedStyles.getPropertyValue("--ink-heading").trim(),
    computedStyles.getPropertyValue("--ink-label").trim(),
    computedStyles.getPropertyValue("--ink-marker").trim()
  ].filter(Boolean);

  let paletteIndex = 0;

  const applyPaletteColor = () => {
    rainbowTitle.style.color = palette[paletteIndex];
    paletteIndex = (paletteIndex + 1) % palette.length;
  };

  applyPaletteColor();
  setInterval(applyPaletteColor, 3200);
}
