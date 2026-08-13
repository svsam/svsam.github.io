(() => {
  "use strict";

  document.querySelector("[data-print-report]")?.addEventListener("click", () => window.print());

  const links = Array.from(document.querySelectorAll(".report-section-nav a"));
  const sections = links
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

  if (!("IntersectionObserver" in window) || sections.length === 0) return;

  const setCurrent = (id) => {
    links.forEach((link) => {
      if (link.getAttribute("href") === `#${id}`) {
        link.setAttribute("aria-current", "true");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  };

  const visibleSections = new Map();
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) visibleSections.set(entry.target.id, entry.boundingClientRect.top);
      else visibleSections.delete(entry.target.id);
    });

    if (visibleSections.size > 0) {
      const closest = Array.from(visibleSections.entries()).sort((a, b) => Math.abs(a[1]) - Math.abs(b[1]))[0];
      setCurrent(closest[0]);
    }
  }, { rootMargin: "-52px 0px -65%", threshold: [0, 0.05] });

  sections.forEach((section) => observer.observe(section));
  setCurrent(sections[0].id);
})();
