import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, resolve, sep } from "node:path";

const root = resolve(process.cwd());
const port = Number(process.env.PORT || 4173);
const host = "127.0.0.1";
const types = {
  ".css": "text/css; charset=utf-8",
  ".csv": "text/csv; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".svg": "image/svg+xml"
};

function send(response, status, message) {
  response.writeHead(status, { "Content-Type": "text/plain; charset=utf-8" });
  response.end(message);
}

createServer(async (request, response) => {
  try {
    const url = new URL(request.url || "/", "http://localhost");
    if (url.pathname === "/") {
      response.writeHead(302, { Location: "/site/" });
      response.end();
      return;
    }
    const pathname = decodeURIComponent(url.pathname);
    let target = resolve(root, "." + pathname);
    if (target !== root && !target.startsWith(root + sep)) {
      send(response, 403, "Forbidden");
      return;
    }

    let details = await stat(target);
    if (details.isDirectory()) {
      target = resolve(target, "index.html");
      details = await stat(target);
    }
    if (!details.isFile()) throw new Error("Not a file");

    response.writeHead(200, {
      "Content-Type": types[extname(target).toLowerCase()] || "application/octet-stream",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff"
    });
    createReadStream(target).pipe(response);
  } catch {
    send(response, 404, "Not found");
  }
}).listen(port, host, () => {
  console.log("Launch kit: http://" + host + ":" + port);
  console.log("Dashboard:  http://" + host + ":" + port + "/dashboard/");
});
