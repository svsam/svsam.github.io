import { existsSync } from "node:fs";
import { readFile, readdir } from "node:fs/promises";
import { dirname, extname, relative, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const root = resolve(process.cwd());
const errors = [];
const warnings = [];

async function walk(directory) {
  const output = [];
  for (const item of await readdir(directory, { withFileTypes: true })) {
    const full = resolve(directory, item.name);
    if (item.isDirectory() && (item.name === ".git" || item.name === "node_modules" || item.name.startsWith("chrome-"))) continue;
    if (item.isDirectory()) output.push(...await walk(full));
    else output.push(full);
  }
  return output;
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') quoted = false;
      else field += character;
    } else if (character === '"') quoted = true;
    else if (character === ",") {
      row.push(field);
      field = "";
    } else if (character === "\n") {
      row.push(field.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      field = "";
    } else field += character;
  }
  if (field || row.length) {
    row.push(field.replace(/\r$/, ""));
    rows.push(row);
  }
  return rows.filter((candidate) => candidate.some((value) => value !== ""));
}

const files = await walk(root);
const htmlFiles = files.filter((file) => extname(file) === ".html");
const markdownFiles = files.filter((file) => extname(file) === ".md");
const jsonFiles = files.filter((file) => extname(file) === ".json");
const csvFiles = files.filter((file) => extname(file) === ".csv");
const jsFiles = files.filter((file) => extname(file) === ".js" || extname(file) === ".mjs");

for (const file of htmlFiles) {
  const text = await readFile(file, "utf8");
  const label = relative(root, file);
  if (!/<html[^>]+lang=/i.test(text)) errors.push(label + ": missing html lang");
  if (!/<meta[^>]+name=["']viewport["']/i.test(text)) errors.push(label + ": missing viewport meta");
  if (!/<h1[\s>]/i.test(text)) errors.push(label + ": missing h1");
  if (file.startsWith(resolve(root, "site") + "\\") || file.startsWith(resolve(root, "site") + "/")) {
    if (!/<meta[^>]+http-equiv=["']Content-Security-Policy["']/i.test(text)) errors.push(label + ": public page is missing its static CSP meta policy");
    if (/Trading name pending|SvSignal/i.test(text)) errors.push(label + ": rejected or superseded public branding remains");
  }

  const ids = [...text.matchAll(/\bid=["']([^"']+)["']/gi)].map((match) => match[1]);
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
  [...new Set(duplicates)].forEach((id) => errors.push(label + ": duplicate id #" + id));

  const references = [...text.matchAll(/\b(?:href|src)=["']([^"']+)["']/gi)].map((match) => match[1]);
  for (const reference of references) {
    if (/^(?:https?:|mailto:|tel:|data:)/i.test(reference)) continue;
    if (reference.startsWith("#")) {
      if (reference.length > 1 && !ids.includes(reference.slice(1))) errors.push(label + ": missing fragment target " + reference);
      continue;
    }
    const clean = reference.split(/[?#]/)[0];
    if (!clean) continue;
    const target = clean.startsWith("/")
      ? resolve(root, "site", clean.slice(1))
      : resolve(dirname(file), clean);
    if (!existsSync(target)) errors.push(label + ": broken local reference " + reference);
  }
}

for (const file of markdownFiles) {
  const text = await readFile(file, "utf8");
  const label = relative(root, file);
  const references = [...text.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)].map((match) => match[1]);
  for (const reference of references) {
    if (/^(?:https?:|mailto:|tel:|#)/i.test(reference)) continue;
    const clean = reference.split("#")[0].replace(/^<|>$/g, "");
    if (clean && !existsSync(resolve(dirname(file), clean))) errors.push(label + ": broken local Markdown link " + reference);
  }
}

for (const file of jsonFiles) {
  try {
    JSON.parse(await readFile(file, "utf8"));
  } catch (error) {
    errors.push(relative(root, file) + ": invalid JSON — " + error.message);
  }
}

for (const file of csvFiles) {
  const rows = parseCsv(await readFile(file, "utf8"));
  if (!rows.length) {
    errors.push(relative(root, file) + ": empty CSV");
    continue;
  }
  const width = rows[0].length;
  rows.forEach((row, index) => {
    if (row.length !== width) errors.push(relative(root, file) + ": row " + (index + 1) + " has " + row.length + " columns; expected " + width);
  });
}

const syntheticCsv = resolve(root, "site", "synthetic-report-data.csv");
const syntheticHtml = resolve(root, "site", "sample-report.html");
if (existsSync(syntheticCsv) && existsSync(syntheticHtml)) {
  const rows = parseCsv(await readFile(syntheticCsv, "utf8"));
  const headers = rows[0];
  const records = rows.slice(1).map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index]])));
  const periods = [...new Set(records.map((record) => record.period).filter(Boolean))];
  for (const period of periods) {
    const channels = records.filter((record) => record.period === period && record.record_type === "channel_summary");
    const weekly = records.filter((record) => record.period === period && record.record_type === "weekly_revenue");
    const channelRevenue = channels.reduce((total, record) => total + Number(record.attributed_revenue_gbp || 0), 0);
    const weeklyRevenue = weekly.reduce((total, record) => total + Number(record.attributed_revenue_gbp || 0), 0);
    if (!channels.length || !weekly.length || channelRevenue !== weeklyRevenue) {
      errors.push("site/synthetic-report-data.csv: " + period + " channel revenue " + channelRevenue + " does not reconcile to weekly revenue " + weeklyRevenue);
    }
    if (channels.some((record) => !record.source_extract_id)) {
      errors.push("site/synthetic-report-data.csv: " + period + " channel row missing synthetic source ID");
    }
  }
  if (records.some((record) => record.synthetic !== "true")) {
    errors.push("site/synthetic-report-data.csv: every record must be explicitly marked synthetic=true");
  }
  const reportText = await readFile(syntheticHtml, "utf8");
  const currentChannels = records.filter((record) => record.period === "2026-06" && record.record_type === "channel_summary");
  const currentRevenue = currentChannels.reduce((total, record) => total + Number(record.attributed_revenue_gbp || 0), 0);
  const currentSpend = currentChannels.reduce((total, record) => total + Number(record.spend_gbp || 0), 0);
  const money = (value) => "£" + new Intl.NumberFormat("en-GB", { maximumFractionDigits: 0 }).format(value);
  if (!reportText.includes(money(currentRevenue)) || !reportText.includes(money(currentSpend))) {
    errors.push("site/sample-report.html: headline revenue/spend do not match the synthetic CSV");
  }
}

for (const file of jsFiles) {
  const result = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
  if (result.status !== 0) errors.push(relative(root, file) + ": syntax check failed\n" + result.stderr.trim());
}

const siteApp = resolve(root, "site", "app.js");
if (existsSync(siteApp)) {
  const text = await readFile(siteApp, "utf8");
  if (/REPLACE|YOUR_EMAIL|example\.com/i.test(text)) warnings.push("site/app.js still contains a configuration placeholder; review before publishing");
}

const siteIndex = resolve(root, "site", "index.html");
const robotsFile = resolve(root, "site", "robots.txt");
if (existsSync(siteIndex)) {
  const text = await readFile(siteIndex, "utf8");
  if (!text.includes("SvS") || !text.includes("SvSam")) errors.push("site/index.html: temporary SvS/SvSam brand disclosure is missing");
  if (!/<meta[^>]+name=["']robots["'][^>]+content=["']noindex,nofollow["']/i.test(text)) {
    errors.push("site/index.html: pre-launch noindex,nofollow safeguard is missing");
  }
  if (/mailto:/i.test(text)) errors.push("site/index.html: public email transmission was added before mailbox approval");
  if (!text.includes("data-copy-result") || !text.includes("data-download-result")) errors.push("site/index.html: local copy/download diagnostic controls are missing");
  if (!text.includes('href="hospitality.html"')) errors.push("site/index.html: hospitality service route is missing");
  if (!text.includes('href="stays.html"')) errors.push("site/index.html: consumer stay-search route is missing");
  if (!text.includes('id="hospitality-route-title"')) errors.push("site/index.html: visible hospitality discovery panel is missing");
  if (!text.includes("No live inventory, prices or affiliation claimed")) errors.push("site/index.html: consumer prototype boundary is missing");
}
const hospitalityPage = resolve(root, "site", "hospitality.html");
if (!existsSync(hospitalityPage)) {
  errors.push("site/hospitality.html: hospitality discovery page is missing");
} else {
  const text = await readFile(hospitalityPage, "utf8");
  if (!text.includes("SvS") || !text.includes("SvSam")) errors.push("site/hospitality.html: temporary SvS/SvSam brand disclosure is missing");
  if (!/<meta[^>]+name=["']robots["'][^>]+content=["']noindex,nofollow["']/i.test(text)) errors.push("site/hospitality.html: pre-launch noindex,nofollow safeguard is missing");
  if (!text.includes('id="hospitality-diagnostic-form"')) errors.push("site/hospitality.html: local discovery diagnostic is missing");
  if (/<form[^>]+action=/i.test(text)) errors.push("site/hospitality.html: a form endpoint was added before approval");
  if (/mailto:/i.test(text)) errors.push("site/hospitality.html: email transmission was added before the hospitality gate");
  if (!text.includes("not affiliated with or endorsed by Airbnb")) errors.push("site/hospitality.html: Airbnb independence disclaimer is missing");
  if (!text.includes('href="stays.html"')) errors.push("site/hospitality.html: consumer stay-search route is missing");
}

const staysPage = resolve(root, "site", "stays.html");
const staysScript = resolve(root, "site", "stays.js");
if (!existsSync(staysPage) || !existsSync(staysScript)) {
  errors.push("site/stays.html and site/stays.js: consumer stay-search prototype is incomplete");
} else {
  const text = await readFile(staysPage, "utf8");
  const script = await readFile(staysScript, "utf8");
  if (!text.includes("SvS") || !text.includes("SvSam")) errors.push("site/stays.html: temporary brand disclosure is missing");
  if (!/<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(text)) errors.push("site/stays.html: pre-launch noindex safeguard is missing");
  if (!text.includes("data-stays-form")) errors.push("site/stays.html: local search form is missing");
  if (/<form[^>]+action=/i.test(text)) errors.push("site/stays.html: a network form action was added to the local prototype");
  if (/\bfetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon|localStorage|sessionStorage/i.test(script)) errors.push("site/stays.js: network or persistent browser storage was added before approval");
  if (!script.includes("Connection pending") || !script.includes("button.disabled = true")) errors.push("site/stays.js: provider actions are not visibly held in pending mode");
  if (!text.includes('href="privacy.html"') || !text.includes('href="affiliate-disclosure.html"') || !text.includes('href="booking-terms.html"')) errors.push("site/stays.html: required consumer disclosures are not linked");
}

for (const legalPage of ["privacy.html", "affiliate-disclosure.html", "booking-terms.html", "404.html"]) {
  if (!existsSync(resolve(root, "site", legalPage))) errors.push("site/" + legalPage + ": required public-support page is missing");
}

const cnameFile = resolve(root, "site", "CNAME");
if (!existsSync(cnameFile) || (await readFile(cnameFile, "utf8")).trim() !== "svsam.com") {
  errors.push("site/CNAME: expected svsam.com for the prepared GitHub Pages package");
}

if (!existsSync(resolve(root, "site", ".nojekyll"))) errors.push("site/.nojekyll: GitHub Pages static-file safeguard is missing");
if (!existsSync(robotsFile) || !/^User-agent: \*\r?\nDisallow: \/\s*$/i.test(await readFile(robotsFile, "utf8"))) {
  errors.push("site/robots.txt: pre-launch crawl block is missing or invalid");
}

console.log("Checked " + htmlFiles.length + " HTML, " + markdownFiles.length + " Markdown, " + jsFiles.length + " JavaScript, " + jsonFiles.length + " JSON, and " + csvFiles.length + " CSV files.");
warnings.forEach((warning) => console.log("WARN: " + warning));
if (errors.length) {
  errors.forEach((error) => console.error("ERROR: " + error));
  process.exitCode = 1;
} else {
  console.log("Validation passed.");
}
