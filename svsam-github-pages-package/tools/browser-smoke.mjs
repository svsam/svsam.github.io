import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";

const chromeCandidates = process.platform === "win32"
  ? ["C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe"]
  : ["/usr/bin/google-chrome", "/usr/bin/google-chrome-stable", "/usr/bin/chromium", "/usr/bin/chromium-browser"];
const chrome = process.env.CHROME_PATH || chromeCandidates.find((candidate) => existsSync(candidate));
if (!chrome) throw new Error("Google Chrome or Chromium was not found. Set CHROME_PATH to its executable.");

const port = await new Promise((resolvePort, rejectPort) => {
  const server = createServer();
  server.once("error", rejectPort);
  server.listen(0, "127.0.0.1", () => {
    const address = server.address();
    const selectedPort = typeof address === "object" && address ? address.port : 9337;
    server.close((error) => error ? rejectPort(error) : resolvePort(selectedPort));
  });
});
const root = resolve(process.cwd());
const profile = await mkdtemp(join(tmpdir(), "launch-os-chrome-"));
const headlessFlag = process.env.SVS_HEADLESS_FLAG || (process.platform === "win32" ? "--headless=old" : "--headless=new");

const dashboardPath = resolve(root, "dashboard", "index.html");
const hasDashboard = existsSync(dashboardPath);
const dashboardUrl = pathToFileURL(dashboardPath).href;
const siteUrl = pathToFileURL(resolve(root, "site", "index.html")).href;
const hospitalityUrl = pathToFileURL(resolve(root, "site", "hospitality.html")).href;
const staysUrl = pathToFileURL(resolve(root, "site", "stays.html")).href;
const privacyUrl = pathToFileURL(resolve(root, "site", "privacy.html")).href;
const reportUrl = pathToFileURL(resolve(root, "site", "sample-report.html")).href;
const initialUrl = hasDashboard ? dashboardUrl : siteUrl;

const browser = spawn(chrome, [
  headlessFlag,
  "--disable-gpu",
  "--disable-software-rasterizer",
  "--disable-gpu-compositing",
  "--no-first-run",
  "--no-default-browser-check",
  "--no-sandbox",
  "--remote-debugging-port=" + port,
  "--user-data-dir=" + profile,
  initialUrl
], { stdio: "ignore", windowsHide: true });

async function waitForTargets() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch("http://127.0.0.1:" + port + "/json/list");
      const targets = await response.json();
      const page = targets.find((target) => target.type === "page");
      if (page) return page;
    } catch {
      // Chrome is still starting.
    }
    await new Promise((resolveWait) => setTimeout(resolveWait, 100));
  }
  throw new Error("Chrome DevTools endpoint did not become ready");
}

function connect(webSocketUrl) {
  return new Promise((resolveConnect, rejectConnect) => {
    const socket = new WebSocket(webSocketUrl);
    let sequence = 0;
    const pending = new Map();
    socket.addEventListener("open", () => {
      resolveConnect({
        socket,
        send(method, params = {}) {
          return new Promise((resolveCall, rejectCall) => {
            const id = ++sequence;
            pending.set(id, { resolveCall, rejectCall });
            socket.send(JSON.stringify({ id, method, params }));
          });
        }
      });
    });
    socket.addEventListener("message", (event) => {
      const message = JSON.parse(String(event.data));
      if (!message.id || !pending.has(message.id)) return;
      const request = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) request.rejectCall(new Error(message.error.message));
      else request.resolveCall(message.result);
    });
    socket.addEventListener("error", () => rejectConnect(new Error("DevTools WebSocket failed")));
  });
}

async function main() {
  const target = await waitForTargets();
  const client = await connect(target.webSocketDebuggerUrl);
  const send = client.send;
  await send("Page.enable");
  await send("Runtime.enable");

  async function evaluate(expression) {
    const response = await send("Runtime.evaluate", {
      expression,
      awaitPromise: true,
      returnByValue: true
    });
    if (response.exceptionDetails) throw new Error(response.exceptionDetails.text || "Browser evaluation failed");
    return response.result.value;
  }

  async function waitForReady() {
    for (let attempt = 0; attempt < 50; attempt += 1) {
      if (await evaluate("document.readyState")) return;
      await new Promise((resolveWait) => setTimeout(resolveWait, 50));
    }
    throw new Error("Page did not become ready");
  }

  async function navigate(url) {
    await send("Page.navigate", { url });
    await new Promise((resolveWait) => setTimeout(resolveWait, 250));
    await waitForReady();
  }

  await waitForReady();
  let dashboard = { skipped: true };
  if (hasDashboard) {
    await evaluate("localStorage.clear(); location.reload(); true");
    await new Promise((resolveWait) => setTimeout(resolveWait, 250));
    await waitForReady();

    dashboard = await evaluate(`(() => {
      const form = document.querySelector("#weeklyForm");
      const set = (name, value) => { form.elements[name].value = String(value); };
      set("weekEnding", "2026-08-07");
      set("qualifiedContacts", 100);
      set("positiveReplies", 5);
      set("conversations", 3);
      set("paidPilots", 1);
      set("retainedClients", 1);
      set("mrr", 750);
      set("ownerHours", 9);
      set("sameProblem", 5);
      set("costRisk", 3);
      set("pilotReady", 2);
      set("effortReduction", 50);
      form.elements.pilotOnTime.checked = true;
      form.requestSubmit();
      return {
        clients: document.querySelector("#clientsValue").textContent,
        mrr: document.querySelector("#mrrValue").textContent,
        phase: document.querySelector("#phaseLabel").textContent,
        rows: document.querySelectorAll("#entriesBody tr").length,
        funnel: document.querySelector("#funnelVerdict").textContent,
        stored: JSON.parse(localStorage.getItem("uk-reporting-launch-os-v1")).entries.length
      };
    })()`);

    if (dashboard.clients !== "1" || dashboard.mrr !== "£750" || dashboard.rows !== 1 || dashboard.stored !== 1) {
      throw new Error("Dashboard update did not render and persist correctly: " + JSON.stringify(dashboard));
    }
  }

  await navigate(siteUrl);
  const diagnostic = await evaluate(`(() => {
    const form = document.querySelector("#diagnostic-form");
    form.elements.company.value = "Synthetic Agency";
    form.elements.role.value = "Operations";
    form.elements.team_size.value = "5–25";
    form.elements.client_count.value = "15–30";
    form.elements.monthly_hours.value = "50–99 hours";
    form.elements.source_count.value = "4–5 sources";
    form.querySelectorAll('[name="pain"]')[0].checked = true;
    form.querySelectorAll('[name="pain"]')[1].checked = true;
    form.elements.workflow.value = "A monthly aggregate report using approved advertising and analytics sources.";
    form.querySelector('[name="next_step"][value="Written fit assessment"]').checked = true;
    form.requestSubmit();
    const result = document.querySelector("[data-diagnostic-result]");
    return {
      formHidden: form.hidden,
      resultShown: !result.hidden,
      prepared: result.textContent.includes("Strong alignment") && result.textContent.includes("Synthetic Agency"),
      brand: document.title.includes("SvS") && document.querySelector(".brand")?.textContent.includes("SvS"),
      revealInitialised: document.querySelector(".hero-copy")?.classList.contains("is-visible"),
      noPublicContact: !document.querySelector('a[href^="mailto:"]') && !document.querySelector("[data-email-result]"),
      resultControls: Boolean(result.querySelector("[data-copy-result]") && result.querySelector("[data-download-result]")),
      hospitalityRoute: Boolean(document.querySelector('a[href="hospitality.html"]')),
      consumerRoute: Boolean(document.querySelector('a[href="stays.html"]'))
    };
  })()`);

  if (!diagnostic.formHidden || !diagnostic.resultShown || !diagnostic.prepared || !diagnostic.brand || !diagnostic.revealInitialised || !diagnostic.hospitalityRoute || !diagnostic.consumerRoute || !diagnostic.noPublicContact || !diagnostic.resultControls) {
    throw new Error("Diagnostic did not prepare its local result: " + JSON.stringify(diagnostic));
  }

  await evaluate("document.documentElement.style.scrollBehavior = 'auto'; document.querySelector('.hospitality-route-card').scrollIntoView({ block: 'center' }); true");
  await new Promise((resolveWait) => setTimeout(resolveWait, 200));
  const agencyHospitalityRoute = await evaluate(`(() => {
    const card = document.querySelector(".hospitality-route-card");
    const link = card?.querySelector('a[href="hospitality.html"]');
    return {
      visible: Boolean(card?.classList.contains("is-visible")),
      heading: card?.querySelector("h2")?.textContent || "",
      link: link?.getAttribute("href") || "",
      boundary: card?.textContent.includes("No property management or live guest contact") || false
    };
  })()`);
  if (!agencyHospitalityRoute.visible || !agencyHospitalityRoute.heading.includes("hotels") || agencyHospitalityRoute.link !== "hospitality.html" || !agencyHospitalityRoute.boundary) {
    throw new Error("Agency landing page hospitality panel failed: " + JSON.stringify(agencyHospitalityRoute));
  }

  await navigate(hospitalityUrl);
  const hospitality = await evaluate(`(() => {
    const form = document.querySelector("#hospitality-diagnostic-form");
    form.elements.operator.value = "Synthetic Stay Group";
    form.elements.role.value = "Operations";
    form.querySelector('[name="property_type"][value="Independent hotel"]').checked = true;
    form.querySelector('[name="property_count"][value="1"]').checked = true;
    form.elements.systems.value = "Booking.com, direct booking engine, PMS";
    form.querySelectorAll('[name="pain"]')[0].checked = true;
    form.querySelectorAll('[name="pain"]')[1].checked = true;
    form.elements.current_hours.value = "5–10 hours";
    form.elements.after_hours.value = "Business-hours support only";
    form.querySelectorAll('[name="data_type"]')[0].checked = true;
    form.querySelectorAll('[name="data_type"]')[1].checked = true;
    form.elements.workflow.value = "A monthly aggregate channel report and an operator-installed template library.";
    form.querySelector('[name="next_step"][value="Written discovery response"]').checked = true;
    form.requestSubmit();
    const result = document.querySelector("[data-diagnostic-result]");
    return {
      formHidden: form.hidden,
      resultShown: !result.hidden,
      prepared: result.textContent.includes("Synthetic Stay Group") && result.textContent.includes("Independent hotel"),
      localOnly: !document.querySelector("form[action]") && !document.querySelector('a[href^="mailto:"]'),
      brand: document.body.textContent.includes("SvS") && document.body.textContent.includes("SvSam"),
      agencyRoute: Boolean(document.querySelector('a[href="index.html"]')),
      noindex: document.querySelector('meta[name="robots"]')?.content === "noindex,nofollow"
    };
  })()`);

  if (!hospitality.formHidden || !hospitality.resultShown || !hospitality.prepared || !hospitality.localOnly || !hospitality.brand || !hospitality.agencyRoute || !hospitality.noindex) {
    throw new Error("Hospitality discovery page failed: " + JSON.stringify(hospitality));
  }

  await send("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true
  });
  await navigate(hospitalityUrl);
  const hospitalityMobile = await evaluate(`(() => ({
    viewport: window.innerWidth,
    documentWidth: document.documentElement.scrollWidth,
    shellWidth: document.querySelector(".hero-grid")?.getBoundingClientRect().width,
    copyWidth: document.querySelector(".hero-copy")?.getBoundingClientRect().width,
    headlineScrollWidth: document.querySelector("h1")?.scrollWidth,
    headlineClientWidth: document.querySelector("h1")?.clientWidth,
    ledeScrollWidth: document.querySelector(".hero-lede")?.scrollWidth,
    ledeClientWidth: document.querySelector(".hero-lede")?.clientWidth,
    overflow: [...document.querySelectorAll("body *")]
      .filter((element) => element.getBoundingClientRect().right > window.innerWidth + 1)
      .slice(0, 8)
      .map((element) => element.tagName.toLowerCase() + (element.className ? "." + String(element.className).trim().replace(/\\s+/g, ".") : ""))
  }))()`);
  if (hospitalityMobile.documentWidth > hospitalityMobile.viewport + 1) {
    throw new Error("Hospitality mobile layout overflows horizontally: " + JSON.stringify(hospitalityMobile));
  }
  if (hospitalityMobile.headlineScrollWidth > hospitalityMobile.headlineClientWidth + 1 || hospitalityMobile.ledeScrollWidth > hospitalityMobile.ledeClientWidth + 1) {
    throw new Error("Hospitality mobile hero text is clipped: " + JSON.stringify(hospitalityMobile));
  }
  await send("Emulation.clearDeviceMetricsOverride");

  await navigate(staysUrl);
  const stays = await evaluate(`(() => {
    const form = document.querySelector("[data-stays-form]");
    form.elements.destination.value = "  Brighton   Marina ";
    form.elements.checkIn.value = "2026-09-10";
    form.elements.checkOut.value = "2026-09-13";
    form.elements.guests.value = "2";
    form.elements.accommodation.value = "Hotel";
    form.requestSubmit();
    const cards = [...document.querySelectorAll(".stays-provider-card")];
    return {
      resultShown: !document.querySelector("[data-results]").hidden,
      destination: document.querySelector("[data-summary-destination]")?.textContent || "",
      dates: document.querySelector("[data-summary-dates]")?.textContent || "",
      cards: cards.length,
      disabledActions: cards.every((card) => card.querySelector("button")?.disabled),
      localOnly: !document.querySelector("form[action]") && !document.querySelector('a[href^="http"]'),
      brand: document.body.textContent.includes("SvS") && document.body.textContent.includes("SvSam"),
      noindex: document.querySelector('meta[name="robots"]')?.content.includes("noindex") || false,
      csp: document.querySelector('meta[http-equiv="Content-Security-Policy"]')?.content.includes("connect-src 'none'") || false
    };
  })()`);
  if (!stays.resultShown || stays.destination !== "Brighton Marina" || !stays.dates.includes("3 nights") || stays.cards !== 3 || !stays.disabledActions || !stays.localOnly || !stays.brand || !stays.noindex || !stays.csp) {
    throw new Error("Consumer stays prototype failed: " + JSON.stringify(stays));
  }

  await send("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true
  });
  await navigate(staysUrl);
  const staysMobile = await evaluate(`(() => {
    const button = document.querySelector("[data-menu-button]");
    button.click();
    return {
      viewport: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      menuOpen: button.getAttribute("aria-expanded") === "true" && document.querySelector("[data-menu]")?.classList.contains("is-open"),
      overflow: [...document.querySelectorAll("body *")]
        .filter((element) => element.getBoundingClientRect().right > window.innerWidth + 1)
        .slice(0, 8)
        .map((element) => element.tagName.toLowerCase() + (element.className ? "." + String(element.className).trim().replace(/\\s+/g, ".") : ""))
    };
  })()`);
  if (staysMobile.documentWidth > staysMobile.viewport + 1 || !staysMobile.menuOpen) {
    throw new Error("Consumer stays mobile layout failed: " + JSON.stringify(staysMobile));
  }

  await navigate(privacyUrl);
  const legalMobile = await evaluate(`(() => {
    const nav = document.querySelector(".legal-header .primary-nav");
    return {
      viewport: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      navVisible: nav && getComputedStyle(nav).display !== "none" && nav.getBoundingClientRect().height > 0,
      navLinks: nav?.querySelectorAll("a").length || 0,
      contactRedacted: !document.querySelector('a[href^="mailto:"]') && document.body.textContent.includes("intentionally omitted")
    };
  })()`);
  if (legalMobile.documentWidth > legalMobile.viewport + 1 || !legalMobile.navVisible || legalMobile.navLinks < 3 || !legalMobile.contactRedacted) {
    throw new Error("Legal-page mobile/public-contact boundary failed: " + JSON.stringify(legalMobile));
  }
  await send("Emulation.clearDeviceMetricsOverride");

  await navigate(reportUrl);
  const report = await evaluate(`({
    synthetic: document.body.textContent.includes("Every brand, metric, source, and observation on this page is synthetic"),
    reconciled: document.body.textContent.includes("Reconciled"),
    download: Boolean(document.querySelector('a[download][href="synthetic-report-data.csv"]')),
    brand: document.title.includes("SvS") && document.body.textContent.includes("SvS")
  })`);
  if (!report.synthetic || !report.reconciled || !report.download || !report.brand) {
    throw new Error("Synthetic report labels or download are missing: " + JSON.stringify(report));
  }

  console.log("Dashboard:", JSON.stringify(dashboard));
  console.log("Diagnostic:", JSON.stringify(diagnostic));
  console.log("Agency hospitality route:", JSON.stringify(agencyHospitalityRoute));
  console.log("Hospitality:", JSON.stringify(hospitality));
  console.log("Hospitality mobile:", JSON.stringify(hospitalityMobile));
  console.log("Consumer stays:", JSON.stringify(stays));
  console.log("Consumer stays mobile:", JSON.stringify(staysMobile));
  console.log("Legal page mobile:", JSON.stringify(legalMobile));
  console.log("Sample report:", JSON.stringify(report));
  console.log("Browser smoke tests passed.");
  client.socket.close();
}

try {
  await main();
} finally {
  browser.kill();
  await new Promise((resolveWait) => setTimeout(resolveWait, 300));
  const safePrefix = tmpdir() + sep + "launch-os-chrome-";
  if (profile.startsWith(safePrefix)) {
    await rm(profile, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
  }
}
