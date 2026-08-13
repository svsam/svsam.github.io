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
      const accessibleLabel = menuButton.querySelector(".sr-only");
      if (accessibleLabel) accessibleLabel.textContent = "Open menu";
    };

    menuButton.addEventListener("click", () => {
      const willOpen = menuButton.getAttribute("aria-expanded") !== "true";
      menuButton.setAttribute("aria-expanded", String(willOpen));
      menu.classList.toggle("is-open", willOpen);
      const accessibleLabel = menuButton.querySelector(".sr-only");
      if (accessibleLabel) accessibleLabel.textContent = willOpen ? "Close menu" : "Open menu";
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

  const form = document.querySelector("#hospitality-diagnostic-form");
  if (!form) return;

  const formError = form.querySelector("[data-form-error]");
  const result = document.querySelector("[data-diagnostic-result]");
  const resultText = result?.querySelector("[data-result-text]");
  const copyButton = result?.querySelector("[data-copy-result]");
  const downloadButton = result?.querySelector("[data-download-result]");
  const editButton = result?.querySelector("[data-edit-result]");
  const copyStatus = result?.querySelector("[data-copy-status]");
  const systemsField = form.querySelector("#systems");
  const systemsCharacterCount = form.querySelector("[data-systems-character-count]");
  const workflowField = form.querySelector("#workflow");
  const workflowCharacterCount = form.querySelector("[data-workflow-character-count]");
  let preparedText = "";

  const updateCharacterCount = (field, counter, maximum) => {
    if (field && counter) counter.textContent = `${field.value.length.toLocaleString("en-GB")} / ${maximum.toLocaleString("en-GB")}`;
  };

  systemsField?.addEventListener("input", () => updateCharacterCount(systemsField, systemsCharacterCount, 500));
  workflowField?.addEventListener("input", () => updateCharacterCount(workflowField, workflowCharacterCount, 1000));
  updateCharacterCount(systemsField, systemsCharacterCount, 500);
  updateCharacterCount(workflowField, workflowCharacterCount, 1000);

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

  const makeDiagnosticText = (answers) => {
    const created = new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric"
    }).format(new Date());
    const optional = (value) => value.trim() || "Not provided";

    return [
      "HOSPITALITY OPERATIONS DISCOVERY SNAPSHOT",
      "==========================================",
      `Prepared: ${created}`,
      "Status: Local browser output; not submitted by the website.",
      "Important: This is discovery input, not a quote, qualification result, availability promise, or service agreement.",
      "",
      "OPERATION",
      `Business/operator: ${optional(answers.operator)}`,
      `Role: ${optional(answers.role)}`,
      `Property type: ${answers.propertyType}`,
      `Active properties: ${answers.propertyCount}`,
      `Platforms/PMS (tool names only): ${answers.systems.trim()}`,
      "",
      "WORKFLOW",
      `Main pain points: ${answers.painPoints.join(", ")}`,
      `Current team time: ${answers.currentHours} each week`,
      `After-hours expectation: ${answers.afterHours}`,
      `Potential data categories: ${answers.dataTypes.join(", ")}`,
      `Routine workflow to explore: ${optional(answers.workflow)}`,
      `Preferred next step: ${answers.nextStep}`,
      "",
      "MANDATORY MANUAL REVIEW",
      "[ ] Confirm the workflow is routine and low risk",
      "[ ] Define named authority and response expectations",
      "[ ] Keep safety, emergencies, refunds, disputes, access, and binding commitments under human control",
      "[ ] Confirm minimum data fields, controller/processor roles, retention, subprocessors, and access method",
      "[ ] Confirm that no autonomous guest sending is enabled",
      "[ ] Agree scope, acceptance, pricing, availability, and liability in writing before service",
      "",
      "PROHIBITED DIAGNOSTIC CONTENT",
      "Credentials; guest names; booking references; addresses; access codes; identity documents; payment data; complaint details.",
      "",
      "If sensitive or live case information was entered accidentally, do not share this file. Delete it and prepare a redacted version."
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
    if (!validate() || !result || !resultText) return;

    const formData = new FormData(form);
    const answers = {
      operator: String(formData.get("operator") || ""),
      role: String(formData.get("role") || ""),
      propertyType: String(formData.get("property_type") || ""),
      propertyCount: String(formData.get("property_count") || ""),
      systems: String(formData.get("systems") || ""),
      painPoints: getValues("pain"),
      currentHours: String(formData.get("current_hours") || ""),
      afterHours: String(formData.get("after_hours") || ""),
      dataTypes: getValues("data_type"),
      workflow: String(formData.get("workflow") || ""),
      nextStep: String(formData.get("next_step") || "")
    };

    preparedText = makeDiagnosticText(answers);
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
      copyStatus.textContent = "Copied. Review and redact the snapshot before sharing it.";
    } catch {
      copyStatus.textContent = "Copy was blocked by the browser. Select the text above manually, or download it instead.";
    }
  });

  downloadButton?.addEventListener("click", () => {
    if (!preparedText || !copyStatus) return;
    const blob = new Blob([preparedText], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "hospitality-operations-discovery-snapshot.txt";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(link.href);
    copyStatus.textContent = "Downloaded locally. Review and redact the file before sharing it.";
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
