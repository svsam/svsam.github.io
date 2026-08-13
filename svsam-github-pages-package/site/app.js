(() => {
  "use strict";

  const header = document.querySelector("[data-header]");
  const menuButton = document.querySelector("[data-menu-button]");
  const menu = document.querySelector("[data-menu]");

  const updateHeader = () => {
    if (header) header.classList.toggle("is-scrolled", window.scrollY > 14);
  };

  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  if (menuButton && menu) {
    const closeMenu = () => {
      menuButton.setAttribute("aria-expanded", "false");
      menu.classList.remove("is-open");
      menuButton.querySelector(".sr-only").textContent = "Open menu";
    };

    menuButton.addEventListener("click", () => {
      const willOpen = menuButton.getAttribute("aria-expanded") !== "true";
      menuButton.setAttribute("aria-expanded", String(willOpen));
      menu.classList.toggle("is-open", willOpen);
      menuButton.querySelector(".sr-only").textContent = willOpen ? "Close menu" : "Open menu";
    });

    menu.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeMenu();
    });
    window.addEventListener("resize", () => {
      if (window.innerWidth > 900) closeMenu();
    });
  }

  const revealElements = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -30px" });
    revealElements.forEach((element) => revealObserver.observe(element));
  } else {
    revealElements.forEach((element) => element.classList.add("is-visible"));
  }

  document.querySelectorAll("[data-current-year]").forEach((element) => {
    element.textContent = String(new Date().getFullYear());
  });

  const faqItems = document.querySelectorAll(".faq-list details");
  faqItems.forEach((item) => {
    item.addEventListener("toggle", () => {
      if (!item.open) return;
      faqItems.forEach((other) => {
        if (other !== item) other.open = false;
      });
    });
  });

  const form = document.querySelector("#diagnostic-form");
  if (!form) return;

  const formError = form.querySelector("[data-form-error]");
  const result = document.querySelector("[data-diagnostic-result]");
  const resultTitle = result?.querySelector("[data-result-title]");
  const resultGuidance = result?.querySelector("[data-result-guidance]");
  const resultText = result?.querySelector("[data-result-text]");
  const copyButton = result?.querySelector("[data-copy-result]");
  const downloadButton = result?.querySelector("[data-download-result]");
  const editButton = result?.querySelector("[data-edit-result]");
  const copyStatus = result?.querySelector("[data-copy-status]");
  const workflowField = form.querySelector("#workflow");
  const characterCount = form.querySelector("[data-character-count]");
  let preparedText = "";

  const updateCharacterCount = () => {
    if (workflowField && characterCount) {
      characterCount.textContent = `${workflowField.value.length.toLocaleString("en-GB")} / 1,000`;
    }
  };

  workflowField?.addEventListener("input", updateCharacterCount);
  updateCharacterCount();

  const getValues = (name) => Array.from(form.querySelectorAll(`[name="${name}"]:checked`)).map((field) => field.value);

  const clearValidation = () => {
    form.querySelectorAll("[aria-invalid='true']").forEach((field) => field.removeAttribute("aria-invalid"));
    form.querySelectorAll(".is-invalid").forEach((field) => field.classList.remove("is-invalid"));
    if (formError) {
      formError.hidden = true;
      formError.textContent = "";
    }
  };

  const validate = () => {
    clearValidation();
    const invalidTargets = [];

    form.querySelectorAll("input[required], select[required], textarea[required]").forEach((field) => {
      if (!field.checkValidity()) {
        field.setAttribute("aria-invalid", "true");
        invalidTargets.push(field);
      }
    });

    form.querySelectorAll("[data-required-group]").forEach((group) => {
      const inputs = group.querySelectorAll("input");
      const hasSelection = Array.from(inputs).some((input) => input.checked);
      if (!hasSelection) {
        group.classList.add("is-invalid");
        invalidTargets.push(inputs[0]);
      }
    });

    if (invalidTargets.length > 0) {
      if (formError) {
        formError.textContent = `Please complete the ${invalidTargets.length} highlighted ${invalidTargets.length === 1 ? "question" : "questions"}.`;
        formError.hidden = false;
        formError.focus();
      }
      return false;
    }

    return true;
  };

  const calculateFit = (answers) => {
    let score = 0;
    if (answers.teamSize === "5–25") score += 2;
    if (answers.teamSize === "26–50") score += 1;
    if (["15–30", "31–50"].includes(answers.clientCount)) score += 2;
    if (answers.clientCount === "51+") score += 1;
    if (["25–49 hours", "50–99 hours", "100+ hours"].includes(answers.monthlyHours)) score += 2;
    if (answers.monthlyHours === "Not measured") score += 1;
    if (["3 sources", "4–5 sources"].includes(answers.sourceCount)) score += 2;
    if (["6+ sources", "Varies widely"].includes(answers.sourceCount)) score += 1;
    if (answers.painPoints.length >= 2) score += 1;

    if (score >= 7) {
      return {
        title: "Strong alignment with the initial service scope",
        guidance: "Your answers resemble the workflow this pilot is designed to test. That is an indication of fit, not a promise of results; the next step would be a manual review of the process, sources, and proof baseline."
      };
    }
    if (score >= 4) {
      return {
        title: "Possible fit — the workflow needs a closer look",
        guidance: "There may be a useful bounded workflow here, but source count, scale, or current effort needs manual review before recommending a pilot."
      };
    }
    return {
      title: "Outside the narrow initial focus",
      guidance: "This does not mean the workflow has no improvement opportunity. It means it differs from the deliberately narrow launch profile, so a standard pilot may not be the right first step."
    };
  };

  const makeDiagnosticText = (answers, fit) => {
    const created = new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric"
    }).format(new Date());

    const optional = (value) => value.trim() || "Not provided";
    return [
      "MANAGED REPORTING WORKFLOW DIAGNOSTIC",
      "========================================",
      `Prepared: ${created}`,
      "Privacy: Prepared locally in the browser; transmitted only if you choose to send the email.",
      "",
      "INDICATIVE FIT",
      fit.title,
      fit.guidance,
      "",
      "AGENCY SNAPSHOT",
      `Agency: ${optional(answers.company)}`,
      `Role: ${optional(answers.role)}`,
      `Team size: ${answers.teamSize}`,
      `Recurring-report clients: ${answers.clientCount}`,
      "",
      "WORKFLOW",
      `Monthly reporting effort: ${answers.monthlyHours}`,
      `Sources in a typical report: ${answers.sourceCount}`,
      `Main pain points: ${answers.painPoints.join(", ")}`,
      `Preferred next step: ${answers.nextStep}`,
      "",
      "FIRST WORKFLOW TO REVIEW",
      answers.workflow.trim(),
      "",
      "MANUAL REVIEW CHECKLIST",
      "[ ] Confirm the workflow uses aggregate marketing data only",
      "[ ] Confirm source ownership and approved access method",
      "[ ] Establish current hours, source totals, and delivery deadline",
      "[ ] Check that the first build can stay within the agreed source limit",
      "[ ] Define material discrepancy and acceptance criteria in writing",
      "",
      "Important: This browser-generated snapshot is not a proposal, quote, or guarantee of suitability."
    ].join("\n");
  };

  form.addEventListener("input", (event) => {
    const target = event.target;
    if (target instanceof HTMLElement) target.removeAttribute("aria-invalid");
    target?.closest("[data-required-group]")?.classList.remove("is-invalid");
    if (formError) formError.hidden = true;
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!validate() || !result || !resultText || !resultTitle || !resultGuidance) return;

    const formData = new FormData(form);
    const answers = {
      company: String(formData.get("company") || ""),
      role: String(formData.get("role") || ""),
      teamSize: String(formData.get("team_size") || ""),
      clientCount: String(formData.get("client_count") || ""),
      monthlyHours: String(formData.get("monthly_hours") || ""),
      sourceCount: String(formData.get("source_count") || ""),
      painPoints: getValues("pain"),
      workflow: String(formData.get("workflow") || ""),
      nextStep: String(formData.get("next_step") || "")
    };

    const fit = calculateFit(answers);
    preparedText = makeDiagnosticText(answers, fit);
    resultTitle.textContent = fit.title;
    resultGuidance.textContent = fit.guidance;
    resultText.textContent = preparedText;
    form.hidden = true;
    result.hidden = false;
    result.focus();
  });

  const copyWithFallback = async (text) => {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return;
    }
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand("copy");
    textarea.remove();
    if (!copied) throw new Error("Copy was not available");
  };

  copyButton?.addEventListener("click", async () => {
    if (!preparedText || !copyStatus) return;
    try {
      await copyWithFallback(preparedText);
      copyStatus.textContent = "Copied. Paste the diagnostic into your preferred message or document.";
    } catch {
      copyStatus.textContent = "Copy was blocked by the browser. Select the text above manually, or download it instead.";
    }
  });

  downloadButton?.addEventListener("click", () => {
    if (!preparedText || !copyStatus) return;
    const blob = new Blob([preparedText], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "managed-reporting-workflow-diagnostic.txt";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(link.href);
    copyStatus.textContent = "Downloaded locally as managed-reporting-workflow-diagnostic.txt.";
  });

  editButton?.addEventListener("click", () => {
    if (!result) return;
    result.hidden = true;
    form.hidden = false;
    form.scrollIntoView({ behavior: "smooth", block: "start" });
    const firstField = form.querySelector("input, select, textarea");
    firstField?.focus({ preventScroll: true });
  });
})();
