const orbitingLinks = document.querySelector(".orbitingLinks");

if (orbitingLinks) {
  const orbitItems = Array.from(orbitingLinks.querySelectorAll(".orbitItem"));
  const orbitLinks = orbitItems.map((item) => item.querySelector("a"));
  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  const fullTurn = Math.PI * 2;
  const orbitDuration = 24000;
  const orbitInclinations = [-5, -3, -1, 0, 2, 4, 5].map(
    (degrees) => (degrees * Math.PI) / 180
  );
  const orbitRadiusScales = [0.72, 1.02, 1.32, 1.62, 1.92, 2.22, 2.52];
  const orbitEccentricities = [0, 0.5, 0.4, 0.6, 0.44, 0.66, 0.52];
  const orbitPhaseOffsets = [0, 222, 128, 279, 45, 126, 356].map(
    (degrees) => (degrees * Math.PI) / 180
  );

  let orbitAngle = 0;
  let currentRate = reducedMotion ? 0 : 1;
  let targetRate = currentRate;
  let previousTime = 0;

  const renderOrbit = (time) => {
    if (!previousTime) {
      previousTime = time;
    }

    const elapsed = Math.min(time - previousTime, 100);
    const easing = 1 - Math.exp(-elapsed / 180);

    currentRate += (targetRate - currentRate) * easing;
    orbitAngle =
      (orbitAngle + (elapsed / orbitDuration) * fullTurn * currentRate) %
      fullTurn;
    previousTime = time;

    const radius = orbitingLinks.clientWidth / 2;

    orbitItems.forEach((item, index) => {
      const angle = orbitAngle + orbitPhaseOffsets[index];
      const depth = Math.sin(angle);
      const inclination = orbitInclinations[index] || 0;
      const itemRadius = radius * orbitRadiusScales[index];
      const eccentricity = orbitEccentricities[index] || 0.48;
      const orbitX = Math.cos(angle) * itemRadius;
      const orbitY = depth * itemRadius * eccentricity;
      const x =
        orbitX * Math.cos(inclination) - orbitY * Math.sin(inclination);
      const y =
        orbitX * Math.sin(inclination) + orbitY * Math.cos(inclination);
      const scale = 0.88 + ((depth + 1) / 2) * 0.22;
      const opacity = 0.58 + ((depth + 1) / 2) * 0.24;

      item.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`;
      item.style.zIndex = depth >= 0 ? "5" : "1";
      item.style.opacity = opacity.toFixed(3);
    });

    if (!reducedMotion) {
      requestAnimationFrame(renderOrbit);
    }
  };

  const setTargetRate = (rate) => {
    if (!reducedMotion) {
      targetRate = rate;
    }
  };

  const slowOrbit = () => {
    setTargetRate(0.06);
  };

  const restoreOrbit = () => {
    setTargetRate(1);
  };

  orbitLinks.forEach((link) => {
    if (!link) {
      return;
    }

    link.addEventListener("pointerenter", slowOrbit);
    link.addEventListener("pointerleave", restoreOrbit);
    link.addEventListener("focus", slowOrbit);
    link.addEventListener("blur", restoreOrbit);
  });

  requestAnimationFrame(renderOrbit);
}

const orbitSun = document.getElementById("orbitSun");
const sunToggle = document.getElementById("sunToggle");

if (orbitSun && sunToggle) {
  const sunSrc = orbitSun.dataset.sunSrc;
  const fatmanSrc = orbitSun.dataset.fatmanSrc;
  const fatmanPreload = new Image();
  fatmanPreload.src = fatmanSrc;

  sunToggle.addEventListener("click", () => {
    const showFatman = sunToggle.getAttribute("aria-pressed") !== "true";

    orbitSun.src = showFatman ? fatmanSrc : sunSrc;
    orbitSun.alt = showFatman ? "Fat Man Sun" : "Sun";
    sunToggle.setAttribute("aria-pressed", String(showFatman));
    sunToggle.textContent = showFatman ? "Show Normal Sun" : "Show Fat Man Sun";
  });
}
