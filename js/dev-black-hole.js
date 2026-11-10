const blackHoleCanvas = document.getElementById("blackHoleCanvas");
const blackHoleEntry = document.getElementById("blackHoleEntry");
const pageRoot = document.documentElement;
let focusHomepageAfterReveal = false;

(function () {
  var hasSeenIntro = false;
  var isInternalNavigation = false;

  try {
    hasSeenIntro = sessionStorage.getItem("svsamIntroSeen") === "true";
  } catch (error) {
    hasSeenIntro = false;
  }

  try {
    isInternalNavigation = Boolean(document.referrer) &&
      new URL(document.referrer).origin === window.location.origin;
  } catch (error) {
    isInternalNavigation = false;
  }

  if (!hasSeenIntro && !isInternalNavigation) {
    document.documentElement.classList.add("devIntroPending");
  }
}());

const revealHomepage = () => {
  const introWasActive = pageRoot.classList.contains("devIntroPending");
  pageRoot.classList.remove("devIntroPending", "devIntroExiting");

  if (introWasActive) {
    try {
      sessionStorage.setItem("svsamIntroSeen", "true");
    } catch (error) {
      // The reveal still works when storage is unavailable.
    }
  }

  if (blackHoleEntry) {
    blackHoleEntry.classList.remove(
      "isConsuming",
      "isEventHorizonHovered"
    );
    blackHoleEntry.removeAttribute("aria-busy");
    blackHoleEntry.setAttribute("role", "img");
    blackHoleEntry.setAttribute(
      "aria-label",
      "Pixelated black hole with a single bright ring and orbiting particles"
    );
    blackHoleEntry.removeAttribute("tabindex");
  }

  if (focusHomepageAfterReveal) {
    const homepageTitle = document.getElementById("devTitle");

    if (homepageTitle) {
      homepageTitle.setAttribute("tabindex", "-1");
      homepageTitle.focus({ preventScroll: true });
      homepageTitle.addEventListener(
        "blur",
        () => homepageTitle.removeAttribute("tabindex"),
        { once: true }
      );
    }
  }
};

if (!pageRoot.classList.contains("devIntroPending")) {
  revealHomepage();
}

if (blackHoleCanvas && blackHoleEntry) {
  const context = blackHoleCanvas.getContext("2d", { alpha: false });

  if (context) {
    const width = blackHoleCanvas.width;
    const height = blackHoleCanvas.height;
    const centerX = Math.floor(width / 2);
    const centerY = Math.floor(height / 2);
    const fullTurn = Math.PI * 2;
    const eventHorizonRadius = 17;
    const photonRingRadius = 22;
    const outerOrbitRadius = 104;
    const discTilt = 0.32;
    const particleCount = 200;
    const frameInterval = 1000 / 30;
    const consumptionDuration = 1900;
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );

    let randomSeed = 0x51f15e;
    let animationFrame = 0;
    let previousFrameTime = 0;
    let isOnScreen = true;
    let isEnteringHomepage = false;
    let isConsumingParticles = false;
    let consumptionStartTime = 0;
    let consumptionProgress = 0;
    let isEventHorizonHovered = false;
    let eventHorizonScale = 1;

    context.imageSmoothingEnabled = false;

    const random = () => {
      randomSeed = (randomSeed * 1664525 + 1013904223) >>> 0;
      return randomSeed / 4294967296;
    };

    const resetParticle = (particle, initial = false) => {
      const innerRadius = photonRingRadius + 5;
      const orbitRange = outerOrbitRadius - innerRadius;

      particle.radius = initial
        ? innerRadius + Math.pow(random(), 0.72) * orbitRange
        : outerOrbitRadius * (0.88 + random() * 0.12);
      particle.angle = random() * fullTurn;
      particle.speed = 0.22 + 28 / particle.radius;
      particle.drift = 0.28 + random() * 0.62;
      particle.depth = (random() - 0.5) * 8;
      particle.size = random() > 0.84 ? 2 : 1;
      particle.opacity = 0.38 + random() * 0.62;
      particle.twinkle = random() * fullTurn;
    };

    const particles = Array.from({ length: particleCount }, () => {
      const particle = {};
      resetParticle(particle, true);
      return particle;
    });

    const resetStar = (star) => {
      star.x = Math.floor(random() * width);
      star.y = Math.floor(random() * height);
      star.size = random() > 0.9 ? 2 : 1;
      star.opacity = 0.18 + random() * 0.34;
    };

    const stars = Array.from({ length: 34 }, () => {
      const star = {};
      resetStar(star);
      return star;
    });

    const updateParticles = (elapsedSeconds) => {
      if (isConsumingParticles) {
        const pull = consumptionProgress * consumptionProgress;
        stars.forEach((star) => {
          const angle = star.startAngle + pull * 5;
          const radius = star.startRadius * (1 - pull);
          star.x = centerX + Math.cos(angle) * radius;
          star.y = centerY + Math.sin(angle) * radius;
        });

        particles.forEach((particle) => {
          particle.radius = particle.startRadius * (1 - pull);
          // Angular speed rises as the orbit tightens, like a coin in a vortex.
          particle.angle = (particle.angle + elapsedSeconds *
            (particle.speed + consumptionProgress * 8) *
            Math.min(4, particle.startRadius / Math.max(particle.radius, 8))) % fullTurn;
        });

        return;
      }

      particles.forEach((particle) => {
        particle.angle =
          (particle.angle + particle.speed * elapsedSeconds) % fullTurn;
        particle.radius -= particle.drift * elapsedSeconds;

        if (particle.radius <= photonRingRadius + 3) {
          resetParticle(particle);
        }
      });
    };

    const updateEventHorizonScale = (elapsedSeconds) => {
      const targetScale =
        isEventHorizonHovered || isConsumingParticles ? 1.28 : 1;
      const scaleStep = Math.min(1, elapsedSeconds * 8);

      eventHorizonScale +=
        (targetScale - eventHorizonScale) * scaleStep;
    };

    const fillPixelCircle = (radius) => {
      for (let y = -radius; y <= radius; y += 1) {
        const halfWidth = Math.floor(Math.sqrt(radius * radius - y * y));
        context.fillRect(centerX - halfWidth, centerY + y, halfWidth * 2 + 1, 1);
      }
    };

    const drawPhotonRing = (radius, time) => {
      context.fillStyle = "#FFFFFF";
      for (let index = 0; index < 180; index += 1) {
        const angle = (index / 180) * fullTurn;
        context.globalAlpha = 0.55 + 0.35 * Math.sin(angle - time * 0.0002);
        context.fillRect(
          Math.round(centerX + Math.cos(angle) * radius),
          Math.round(centerY + Math.sin(angle) * radius), 1, 1
        );
      }
    };

    const drawDisc = (front) => {
      context.fillStyle = "#FFFFFF";
      particles.forEach((particle) => {
        if (particle.radius <= eventHorizonRadius * eventHorizonScale) return;
        const sin = Math.sin(particle.angle);
        if ((sin > 0) !== front) return;
        const radiusProgress = particle.radius / outerOrbitRadius;
        const tailLength = isConsumingParticles ? 6 : 2;
        for (let tail = tailLength; tail >= 0; tail -= 1) {
          const angle = particle.angle - tail * (isConsumingParticles ? 0.065 : 0.018);
          const x = Math.cos(angle) * particle.radius;
          const y = Math.sin(angle) * particle.radius * discTilt +
            particle.depth * radiusProgress;
          context.globalAlpha = particle.opacity * (1 - tail / (tailLength + 1)) *
            (front ? 0.9 : 0.65);
          context.fillRect(Math.round(centerX + x), Math.round(centerY + y),
            particle.size, 1);
        }
      });
    };

    const drawScene = (time = 0) => {
      context.globalAlpha = 1;
      context.fillStyle = "#000000";
      context.fillRect(0, 0, width, height);

      context.fillStyle = "#FFFFFF";
      stars.forEach((star) => {
        context.globalAlpha = star.opacity;
        context.fillRect(star.x, star.y, star.size, star.size);
      });

      drawDisc(false);

      context.globalAlpha = 1;
      context.fillStyle = "#000000";
      const renderedEventHorizonRadius = Math.round(
        eventHorizonRadius * eventHorizonScale
      );

      fillPixelCircle(renderedEventHorizonRadius);

      drawPhotonRing(renderedEventHorizonRadius + 1, time);
      drawDisc(true);
      context.globalAlpha = 1;
    };

    const shouldAnimate = () =>
      !reducedMotion.matches && !document.hidden && isOnScreen;

    const stopAnimation = () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
        animationFrame = 0;
      }

      previousFrameTime = 0;
    };

    const renderFrame = (time) => {
      animationFrame = 0;

      if (!shouldAnimate()) {
        return;
      }

      if (!previousFrameTime) {
        previousFrameTime = time;
      }

      const elapsed = time - previousFrameTime;

      if (elapsed >= frameInterval) {
        if (isConsumingParticles) {
          consumptionProgress = Math.min(1, (time - consumptionStartTime) / consumptionDuration);
        }
        updateParticles(Math.min(elapsed, 100) / 1000);
        updateEventHorizonScale(Math.min(elapsed, 100) / 1000);
        drawScene(time);
        previousFrameTime = time;

        if (
          isConsumingParticles &&
          time - consumptionStartTime >= consumptionDuration
        ) {
          startHomepageFade();
        }
      }

      animationFrame = requestAnimationFrame(renderFrame);
    };

    const startAnimation = () => {
      if (shouldAnimate() && !animationFrame) {
        animationFrame = requestAnimationFrame(renderFrame);
      }
    };

    const syncAnimation = () => {
      stopAnimation();
      drawScene();
      if (isEnteringHomepage && reducedMotion.matches) startHomepageFade();
      startAnimation();
    };

    const isIntroActive = () =>
      pageRoot.classList.contains("devIntroPending");

    const isEventHorizonHit = (event) => {
      const bounds = blackHoleCanvas.getBoundingClientRect();

      if (!bounds.width || !bounds.height) {
        return false;
      }

      const canvasX =
        ((event.clientX - bounds.left) / bounds.width) * blackHoleCanvas.width;
      const canvasY =
        ((event.clientY - bounds.top) / bounds.height) * blackHoleCanvas.height;

      return (
        Math.hypot(canvasX - centerX, canvasY - centerY) <=
        photonRingRadius * eventHorizonScale + 6
      );
    };

    const startHomepageFade = () => {
      if (!isIntroActive() || pageRoot.classList.contains("devIntroExiting")) {
        return;
      }

      const bounds = blackHoleCanvas.getBoundingClientRect();
      const horizonPixels = eventHorizonRadius * eventHorizonScale * bounds.width / width;
      const coverScale = Math.hypot(window.innerWidth, window.innerHeight) /
        Math.max(1, horizonPixels);
      blackHoleEntry.style.setProperty("--horizon-cover-scale", Math.max(1, coverScale));
      pageRoot.classList.add("devIntroExiting");

      window.setTimeout(() => {
        particles.forEach((particle) => resetParticle(particle, true));
        stars.forEach(resetStar);
        isConsumingParticles = false;
        consumptionProgress = 0;
        isEventHorizonHovered = false;
        eventHorizonScale = 1;
        drawScene();
        revealHomepage();
      }, reducedMotion.matches ? 0 : 900);
    };

    const enterHomepage = () => {
      if (!isIntroActive() || isEnteringHomepage) {
        return;
      }

      isEnteringHomepage = true;
      isEventHorizonHovered = false;
      blackHoleEntry.classList.remove("isEventHorizonHovered");
      blackHoleEntry.classList.add("isConsuming");
      blackHoleEntry.setAttribute("aria-busy", "true");

      if (reducedMotion.matches) {
        startHomepageFade();
        return;
      }

      particles.forEach((particle) => { particle.startRadius = particle.radius; });
      stars.forEach((star) => {
        star.startRadius = Math.hypot(star.x - centerX, star.y - centerY);
        star.startAngle = Math.atan2(star.y - centerY, star.x - centerX);
      });
      isConsumingParticles = true;
      consumptionStartTime = performance.now();
      startAnimation();
    };

    blackHoleEntry.addEventListener("pointermove", (event) => {
      const isHoveringEventHorizon =
        isIntroActive() && isEventHorizonHit(event);

      isEventHorizonHovered = isHoveringEventHorizon;

      blackHoleEntry.classList.toggle(
        "isEventHorizonHovered",
        isHoveringEventHorizon
      );

      if (reducedMotion.matches) {
        eventHorizonScale = isHoveringEventHorizon ? 1.28 : 1;
        drawScene();
      }
    });

    blackHoleEntry.addEventListener("pointerleave", () => {
      isEventHorizonHovered = false;
      blackHoleEntry.classList.remove("isEventHorizonHovered");

      if (reducedMotion.matches) {
        eventHorizonScale = 1;
        drawScene();
      }
    });

    blackHoleEntry.addEventListener("click", (event) => {
      if (isEventHorizonHit(event)) {
        enterHomepage();
      }
    });

    blackHoleEntry.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        focusHomepageAfterReveal = true;
        enterHomepage();
      }
    });

    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver((entries) => {
        isOnScreen = entries[0]?.isIntersecting ?? true;
        syncAnimation();
      });

      observer.observe(blackHoleCanvas);
    }

    document.addEventListener("visibilitychange", syncAnimation);

    if (typeof reducedMotion.addEventListener === "function") {
      reducedMotion.addEventListener("change", syncAnimation);
    } else if (typeof reducedMotion.addListener === "function") {
      reducedMotion.addListener(syncAnimation);
    }

    drawScene();
    startAnimation();
  } else {
    revealHomepage();
  }
} else {
  revealHomepage();
}
