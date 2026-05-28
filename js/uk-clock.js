const ukClock = document.getElementById("ukClock");

if (ukClock) {
  const timeZone = "Europe/London";
  const clockFormatter = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZoneName: "short",
  });
  const accessibleFormatter = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
    timeZoneName: "long",
  });

  const updateUkClock = () => {
    const now = new Date();
    ukClock.dateTime = now.toISOString();
    ukClock.textContent = clockFormatter.format(now);
    ukClock.setAttribute(
      "aria-label",
      `Current time in the UK: ${accessibleFormatter.format(now)}`
    );
  };

  updateUkClock();
  window.setInterval(updateUkClock, 1000);
}
