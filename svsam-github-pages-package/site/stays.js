(function () {
  "use strict";

  const form = document.querySelector("[data-stays-form]");
  const results = document.querySelector("[data-results]");
  const errorMessage = document.querySelector("[data-form-error]");
  const providerGrid = document.querySelector("[data-provider-grid]");
  const editButton = document.querySelector("[data-edit-search]");
  const checkInInput = document.querySelector("#stay-check-in");
  const checkOutInput = document.querySelector("#stay-check-out");
  const menuButton = document.querySelector("[data-menu-button]");
  const menu = document.querySelector("[data-menu]");
  const header = document.querySelector("[data-header]");

  const providers = [
    {
      name: "Booking.com",
      mark: "B",
      description: "Possible future external accommodation-search destination. No commercial or technical connection is active."
    },
    {
      name: "Airbnb",
      mark: "A",
      description: "Possible future external stays destination. No affiliation, inventory feed or referral connection is active."
    },
    {
      name: "Other approved providers",
      mark: "+",
      description: "Additional providers would appear only after suitability, consumer disclosures and integration security are reviewed."
    }
  ];

  function localIsoDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function parseIsoDate(value) {
    const parts = value.split("-").map(Number);
    if (parts.length !== 3 || parts.some(Number.isNaN)) return null;
    const date = new Date(parts[0], parts[1] - 1, parts[2]);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function formatDate(date) {
    return new Intl.DateTimeFormat("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric"
    }).format(date);
  }

  function tidyDestination(value) {
    return value.trim().replace(/\s+/g, " ");
  }

  function setDateLimits() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    checkInInput.min = localIsoDate(today);
    checkOutInput.min = checkInInput.value || localIsoDate(today);
  }

  function clearInvalidState() {
    form.querySelectorAll("[aria-invalid='true']").forEach((field) => {
      field.removeAttribute("aria-invalid");
    });
    errorMessage.hidden = true;
    errorMessage.textContent = "";
  }

  function fail(message, field) {
    errorMessage.textContent = message;
    errorMessage.hidden = false;
    if (field) {
      field.setAttribute("aria-invalid", "true");
      field.focus();
    }
  }

  function renderProviders() {
    providerGrid.replaceChildren();

    providers.forEach((provider) => {
      const card = document.createElement("article");
      card.className = "stays-provider-card";

      const top = document.createElement("div");
      top.className = "stays-provider-top";

      const monogram = document.createElement("span");
      monogram.className = "stays-provider-monogram";
      monogram.setAttribute("aria-hidden", "true");
      monogram.textContent = provider.mark;

      const chip = document.createElement("span");
      chip.className = "stays-pending-chip";
      chip.textContent = "Connection pending";

      const title = document.createElement("h3");
      title.textContent = provider.name;

      const description = document.createElement("p");
      description.textContent = provider.description;

      const button = document.createElement("button");
      button.type = "button";
      button.disabled = true;
      button.textContent = "Partner access not yet available";

      top.append(monogram, chip);
      card.append(top, title, description, button);
      providerGrid.append(card);
    });
  }

  function showResult(values, checkIn, checkOut) {
    const millisecondsPerDay = 24 * 60 * 60 * 1000;
    const nights = Math.round((checkOut.getTime() - checkIn.getTime()) / millisecondsPerDay);
    const guestLabel = values.guests === "1" ? "1 guest" : `${values.guests} guests`;
    const nightLabel = nights === 1 ? "1 night" : `${nights} nights`;

    document.querySelector("[data-summary-destination]").textContent = values.destination;
    document.querySelector("[data-summary-dates]").textContent = `${formatDate(checkIn)} to ${formatDate(checkOut)} (${nightLabel})`;
    document.querySelector("[data-summary-guests]").textContent = guestLabel;
    document.querySelector("[data-summary-type]").textContent = values.accommodation;

    renderProviders();
    results.hidden = false;
    results.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (form) {
    setDateLimits();

    checkInInput.addEventListener("change", function () {
      checkOutInput.min = checkInInput.value || checkInInput.min;
      if (checkOutInput.value && checkOutInput.value <= checkInInput.value) {
        checkOutInput.value = "";
      }
    });

    form.addEventListener("input", clearInvalidState);

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      clearInvalidState();

      const formData = new FormData(form);
      const values = {
        destination: tidyDestination(String(formData.get("destination") || "")),
        checkIn: String(formData.get("checkIn") || ""),
        checkOut: String(formData.get("checkOut") || ""),
        guests: String(formData.get("guests") || ""),
        accommodation: String(formData.get("accommodation") || "Any type")
      };

      if (values.destination.length < 2) {
        fail("Enter a destination using at least two characters.", form.elements.destination);
        return;
      }

      const checkIn = parseIsoDate(values.checkIn);
      const checkOut = parseIsoDate(values.checkOut);

      if (!checkIn) {
        fail("Choose a valid check-in date.", checkInInput);
        return;
      }

      if (!checkOut) {
        fail("Choose a valid check-out date.", checkOutInput);
        return;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (checkIn < today) {
        fail("Check-in cannot be in the past.", checkInInput);
        return;
      }

      if (checkOut <= checkIn) {
        fail("Check-out must be after check-in.", checkOutInput);
        return;
      }

      showResult(values, checkIn, checkOut);
    });
  }

  if (editButton) {
    editButton.addEventListener("click", function () {
      document.querySelector("#search").scrollIntoView({ behavior: "smooth", block: "start" });
      document.querySelector("#stay-destination").focus({ preventScroll: true });
    });
  }

  if (menuButton && menu) {
    menuButton.addEventListener("click", function () {
      const isOpen = menuButton.getAttribute("aria-expanded") === "true";
      menuButton.setAttribute("aria-expanded", String(!isOpen));
      menu.classList.toggle("is-open", !isOpen);
    });

    menu.addEventListener("click", function (event) {
      if (event.target.closest("a")) {
        menuButton.setAttribute("aria-expanded", "false");
        menu.classList.remove("is-open");
      }
    });
  }

  function updateHeader() {
    if (header) header.classList.toggle("is-scrolled", window.scrollY > 12);
  }

  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  const revealItems = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });
    revealItems.forEach((item) => observer.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  }
})();
