/* Tech for Life (itcourseforseniors) — tiny Bun static server.
   Zo process service "itcourse" on :4980, reached publicly through the Space api routes
   /itcourse + /itcourse/* (_zo/space-proxy.ts) → 127.0.0.1:4980. The proxy forwards the path
   as-is, so this server strips the BASE prefix itself; plain http://127.0.0.1:4980/ also works.
   Serves the repo root (index.html, css/, js/, modules/). */
import { join, normalize, extname } from "node:path";
import { statSync } from "node:fs";

const PORT = Number(process.env.PORT ?? 4980);
const BASE = (process.env.BASE_PATH ?? "/itcourse").replace(/\/$/, "");
const ROOT = join(import.meta.dir, "..");

const TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon",
  ".json": "application/json",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
};

// Cloudflare caches .js/.css on zo.space for ~4h by URL, so every css/js link in the HTML gets
// ?v=<file mtime>: editing an asset changes its URL, and the HTML itself is never cached.
function version(html: string, htmlDir: string) {
  return html.replace(/(href|src)="((?:\.\.\/)*(?:css|js)\/[^"?#]+)"/g, (m, attr, rel) => {
    try { return `${attr}="${rel}?v=${Math.floor(statSync(join(htmlDir, rel)).mtimeMs)}"`; }
    catch { return m; }
  });
}

Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    let path = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, "");
    if (BASE && path === BASE) return Response.redirect(BASE + "/", 301);
    if (BASE && path.startsWith(BASE + "/")) path = path.slice(BASE.length);
    if (path === "" || path === "/") path = "/index.html";
    if (path.startsWith("/_zo/") || path.startsWith("/.git/")) return new Response("Not found", { status: 404 });

    let abs = join(ROOT, path);
    try {
      const st = statSync(abs);
      if (st.isDirectory()) {
        // directory → its index.html (redirect to the trailing-slash form first so relative links resolve)
        if (!url.pathname.endsWith("/")) return Response.redirect(url.pathname + "/", 301);
        abs = join(abs, "index.html");
      }
    } catch {
      if (!extname(abs)) abs += ".html"; // /modules/module-1 → module-1.html
    }
    const file = Bun.file(abs);
    if (!(await file.exists())) return new Response("Not found", { status: 404 });

    const ext = extname(abs).toLowerCase();
    const type = TYPES[ext] ?? "application/octet-stream";
    if (ext === ".html") {
      const html = version(await file.text(), join(abs, ".."));
      return new Response(html, { headers: { "content-type": type, "cache-control": "no-store" } });
    }
    // css/js URLs carry ?v=<mtime>; anything with a version is safe to cache long, the rest briefly
    const cache = url.searchParams.has("v") ? "public, max-age=31536000, immutable" : "public, max-age=300";
    return new Response(file, { headers: { "content-type": type, "cache-control": cache } });
  },
});

console.log(`itcourse serving ${ROOT} on :${PORT} (base ${BASE || "/"})`);
