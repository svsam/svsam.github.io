const blackHoleCanvas = document.getElementById("blackHoleCanvas");
const blackHoleEntry = document.getElementById("blackHoleEntry");
const pageRoot = document.documentElement;
let focusHomepageAfterReveal = false;

const revealHomepage = () => {
  pageRoot.classList.remove("devIntroPending", "devIntroExiting");

  if (blackHoleEntry) {
    blackHoleEntry.classList.remove(
      "isConsuming",
      "isEventHorizonHovered"
    );
    blackHoleEntry.removeAttribute("aria-busy");
    blackHoleEntry.setAttribute("role", "img");
    blackHoleEntry.setAttribute(
      "aria-label",
      "Pixelated simulation of white particles orbiting a black hole with a dotted event horizon"
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
    const particleCount = 120;
    const frameInterval = 1000 / 20;
    const consumptionDuration = 1150;
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
        const starPull = 1 - Math.exp(-4.5 * elapsedSeconds);

        stars.forEach((star) => {
          star.x += (centerX - star.x) * starPull;
          star.y += (centerY - star.y) * starPull;
        });

        particles.forEach((particle) => {
          const radialDistance = particle.radius - eventHorizonRadius;
          const inwardSpeed = Math.max(20, radialDistance * 4.4);

          particle.angle =
            (particle.angle +
              (particle.speed + 90 / Math.max(particle.radius, 8)) *
                elapsedSeconds) %
            fullTurn;
          particle.radius = Math.max(
            0,
            particle.radius - inwardSpeed * elapsedSeconds
          );
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

    const fillPixelCircle = (radius) => {
      for (let y = -radius; y <= radius; y += 1) {
        const halfWidth = Math.floor(Math.sqrt(radius * radius - y * y));
        context.fillRect(centerX - halfWidth, centerY + y, halfWidth * 2 + 1, 1);
      }
    };

    const drawDottedRing = (radius, dotCount, phase, opacity) => {
      context.globalAlpha = opacity;
      context.fillStyle = "#FFFFFF";

      for (let index = 0; index < dotCount; index += 1) {
        const angle = phase + (index / dotCount) * fullTurn;
        const x = Math.round(centerX + Math.cos(angle) * radius);
        const y = Math.round(centerY + Math.sin(angle) * radius);
        const size = index % 7 === 0 ? 2 : 1;

        context.fillRect(x - Math.floor(size / 2), y - Math.floor(size / 2), size, size);
      }
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

      particles.forEach((particle) => {
        const radiusProgress = particle.radius / outerOrbitRadius;
        const x = Math.round(
          centerX + Math.cos(particle.angle) * particle.radius
        );
        const y = Math.round(
          centerY +
            Math.sin(particle.angle) * particle.radius * discTilt +
            particle.depth * radiusProgress
        );
        const pulse = 0.9 + Math.sin(time * 0.0015 + particle.twinkle) * 0.1;

        context.globalAlpha = particle.opacity * pulse;
        context.fillRect(x, y, particle.size, particle.size);
      });

      context.globalAlpha = 1;
      context.fillStyle = "#000000";
      fillPixelCircle(eventHorizonRadius);

      drawDottedRing(eventHorizonRadius + 1, 52, 0, 1);
      drawDottedRing(photonRingRadius, 34, time * 0.00012, 0.58);
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
        updateParticles(Math.min(elapsed, 100) / 1000);
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
        photonRingRadius + 6
      );
    };

    const startHomepageFade = () => {
      if (!isIntroActive() || pageRoot.classList.contains("devIntroExiting")) {
        return;
      }

      pageRoot.classList.add("devIntroExiting");

      window.setTimeout(() => {
        particles.forEach((particle) => resetParticle(particle, true));
        stars.forEach(resetStar);
        isConsumingParticles = false;
        drawScene();
        revealHomepage();
      }, reducedMotion.matches ? 0 : 650);
    };

    const enterHomepage = () => {
      if (!isIntroActive() || isEnteringHomepage) {
        return;
      }

      isEnteringHomepage = true;
      blackHoleEntry.classList.remove("isEventHorizonHovered");
      blackHoleEntry.classList.add("isConsuming");
      blackHoleEntry.setAttribute("aria-busy", "true");

      if (reducedMotion.matches) {
        startHomepageFade();
        return;
      }

      isConsumingParticles = true;
      consumptionStartTime = performance.now();
      startAnimation();
    };

    blackHoleEntry.addEventListener("pointermove", (event) => {
      const isHoveringEventHorizon =
        isIntroActive() && isEventHorizonHit(event);

      blackHoleEntry.classList.toggle(
        "isEventHorizonHovered",
        isHoveringEventHorizon
      );

      if (isHoveringEventHorizon) {
        enterHomepage();
      }
    });

    blackHoleEntry.addEventListener("pointerleave", () => {
      blackHoleEntry.classList.remove("isEventHorizonHovered");
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
