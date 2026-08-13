import { readFile, readdir } from "node:fs/promises";
import { basename, extname, relative, resolve } from "node:path";

const root = resolve(process.cwd());
const requestedRoot = process.argv[2] || "site";
const publicRoot = resolve(root, requestedRoot);
const failures = [];

async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && [".git", "node_modules", "artifacts", "exports"].includes(entry.name)) continue;
    const fullPath = resolve(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(fullPath));
    else files.push(fullPath);
  }
  return files;
}

const workspaceFiles = await walk(root);
const forbiddenNames = new Set([".env", ".env.local", ".env.production", "id_rsa", "id_ed25519"]);
const forbiddenExtensions = new Set([".key", ".pem", ".p12", ".pfx"]);

for (const file of workspaceFiles) {
  const name = basename(file).toLowerCase();
  if (forbiddenNames.has(name) || forbiddenExtensions.has(extname(name))) {
    failures.push(relative(root, file) + ": secret-bearing file type must not be stored in this public workspace");
  }
}

const publicFiles = await walk(publicRoot);
const readableExtensions = new Set([".html", ".js", ".mjs", ".css", ".json", ".txt", ".csv", ""]);
const secretPatterns = [
  { label: "private key", expression: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
  { label: "AWS access key", expression: /\bAKIA[0-9A-Z]{16}\b/ },
  { label: "GitHub personal token", expression: /\bgh[pousr]_[A-Za-z0-9]{30,}\b/ },
  { label: "OpenAI-style secret", expression: /\bsk-[A-Za-z0-9_-]{20,}\b/ },
  { label: "hard-coded credential", expression: /\b(?:api[_-]?key|client[_-]?secret|access[_-]?token|bearer[_-]?token|affiliate[_-]?id)\b\s*[:=]\s*["'][^"'<>\s]{8,}["']/i },
  { label: "direct Booking.com API call from public code", expression: /https:\/\/demandapi(?:-sandbox)?\.booking\.com\//i },
  { label: "authorization header in public code", expression: /\bAuthorization\b\s*[:=]\s*["']Bearer\s+/i },
  { label: "unapproved personal mailbox", expression: /svsseifi@gmail\.com/i },
  { label: "unapproved residential correspondence address", expression: /106\s+Goldsmith\s+Road/i }
];

for (const file of publicFiles) {
  if (!readableExtensions.has(extname(file).toLowerCase())) continue;
  const text = await readFile(file, "utf8");
  for (const pattern of secretPatterns) {
    if (pattern.expression.test(text)) failures.push(relative(root, file) + ": possible " + pattern.label);
  }
}

if (failures.length) {
  failures.forEach((failure) => console.error("SECURITY ERROR: " + failure));
  process.exitCode = 1;
} else {
  console.log("Public-source security check passed for " + publicFiles.length + " files under " + relative(root, publicRoot) + ".");
}
