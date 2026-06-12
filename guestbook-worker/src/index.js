const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
};

const jsonResponse = (payload, status = 200, origin = "") => {
  const headers = new Headers(JSON_HEADERS);
  if (origin) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Vary", "Origin");
  }
  return new Response(JSON.stringify(payload), { status, headers });
};

const getAllowedOrigin = (request, env) => {
  const origin = request.headers.get("Origin") || "";
  if (!origin) return "";

  const allowedOrigins = (
    env.ALLOWED_ORIGINS ||
    "https://svsam.com,https://www.svsam.com,http://localhost:8765"
  )
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  return allowedOrigins.includes(origin) ? origin : null;
};

const githubHeaders = (env) => {
  const headers = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "svsam-journal-guestbook",
  };
  if (env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${env.GITHUB_TOKEN}`;
  }
  return headers;
};

const getGitHubFileUrl = (env) => {
  const owner = env.GITHUB_OWNER || "svsam";
  const repository = env.GITHUB_REPO || "svsam.github.io";
  const path = env.GUESTBOOK_PATH || "data/guestbook.json";
  return `https://api.github.com/repos/${owner}/${repository}/contents/${path}`;
};

const decodeBase64 = (value) => {
  const binary = atob(value.replace(/\s/g, ""));
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
};

const encodeBase64 = (value) => {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index]);
  }
  return btoa(binary);
};

const normalizeGuestbook = (payload) => ({
  version: 1,
  messages: Array.isArray(payload?.messages) ? payload.messages.slice(0, 100) : [],
});

const fetchGuestbookFile = async (env) => {
  const branch = env.GITHUB_BRANCH || "main";
  const response = await fetch(
    `${getGitHubFileUrl(env)}?ref=${encodeURIComponent(branch)}`,
    { headers: githubHeaders(env) },
  );

  if (response.status === 404) {
    return {
      sha: null,
      guestbook: { version: 1, messages: [] },
    };
  }

  if (!response.ok) {
    throw new Error(`GitHub returned ${response.status} while reading the guestbook.`);
  }

  const file = await response.json();
  return {
    sha: file.sha,
    guestbook: normalizeGuestbook(JSON.parse(decodeBase64(file.content))),
  };
};

const saveGuestbookFile = async (env, sha, guestbook) => {
  const branch = env.GITHUB_BRANCH || "main";
  const body = {
    message: "Add journal room guestbook message",
    content: encodeBase64(`${JSON.stringify(guestbook, null, 2)}\n`),
    branch,
  };
  if (sha) body.sha = sha;

  return fetch(getGitHubFileUrl(env), {
    method: "PUT",
    headers: {
      ...githubHeaders(env),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
};

const checkRateLimit = async (request) => {
  const address =
    request.headers.get("CF-Connecting-IP") ||
    request.headers.get("X-Forwarded-For") ||
    "unknown";
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(address),
  );
  const key = [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  const cacheKey = new Request(`https://guestbook-rate-limit.invalid/${key}`);
  const cache = caches.default;

  if (await cache.match(cacheKey)) return false;

  await cache.put(
    cacheKey,
    new Response("", {
      headers: { "Cache-Control": "s-maxage=60" },
    }),
  );
  return true;
};

const validateSubmission = (payload) => {
  const name = typeof payload?.name === "string" ? payload.name.trim() : "";
  const message =
    typeof payload?.message === "string" ? payload.message.trim() : "";
  const website =
    typeof payload?.website === "string" ? payload.website.trim() : "";

  if (website) return { bot: true };
  if (!name || name.length > 40) {
    return { error: "Names must be between 1 and 40 characters." };
  }
  if (!message || message.length > 500) {
    return { error: "Messages must be between 1 and 500 characters." };
  }
  if ((message.match(/https?:\/\//gi) || []).length > 2) {
    return { error: "Please use no more than two links." };
  }

  return { name, message };
};

const addMessage = async (env, entry) => {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const { sha, guestbook } = await fetchGuestbookFile(env);
    const messages = [
      entry,
      ...guestbook.messages.filter((message) => message.id !== entry.id),
    ].slice(0, 100);
    const updatedGuestbook = { version: 1, messages };
    const response = await saveGuestbookFile(env, sha, updatedGuestbook);

    if (response.ok) return updatedGuestbook;
    if (response.status !== 409) {
      const details = await response.text();
      throw new Error(`GitHub rejected the update: ${response.status} ${details}`);
    }
  }

  throw new Error("The guestbook changed too quickly. Please try again.");
};

export default {
  async fetch(request, env) {
    const allowedOrigin = getAllowedOrigin(request, env);
    if (allowedOrigin === null) {
      return jsonResponse({ error: "Origin not allowed." }, 403);
    }

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": allowedOrigin || "*",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    if (request.method === "GET") {
      try {
        const { guestbook } = await fetchGuestbookFile(env);
        return jsonResponse(guestbook, 200, allowedOrigin);
      } catch (error) {
        return jsonResponse({ error: error.message }, 502, allowedOrigin);
      }
    }

    if (request.method !== "POST") {
      return jsonResponse({ error: "Method not allowed." }, 405, allowedOrigin);
    }

    if (!env.GITHUB_TOKEN) {
      return jsonResponse(
        { error: "The guestbook write token is not configured." },
        503,
        allowedOrigin,
      );
    }

    if (!(await checkRateLimit(request))) {
      return jsonResponse(
        { error: "Please wait a minute before signing again." },
        429,
        allowedOrigin,
      );
    }

    try {
      const contentLength = Number(request.headers.get("Content-Length") || 0);
      if (contentLength > 4096) {
        return jsonResponse({ error: "Submission is too large." }, 413, allowedOrigin);
      }

      const validation = validateSubmission(await request.json());
      if (validation.bot) {
        const { guestbook } = await fetchGuestbookFile(env);
        return jsonResponse(guestbook, 200, allowedOrigin);
      }
      if (validation.error) {
        return jsonResponse({ error: validation.error }, 400, allowedOrigin);
      }

      const guestbook = await addMessage(env, {
        id: crypto.randomUUID(),
        name: validation.name,
        message: validation.message,
        createdAt: new Date().toISOString(),
      });
      return jsonResponse(guestbook, 201, allowedOrigin);
    } catch (error) {
      return jsonResponse(
        { error: error.message || "The message could not be saved." },
        500,
        allowedOrigin,
      );
    }
  },
};
