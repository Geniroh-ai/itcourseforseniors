import type { Context } from "hono";

/* Tech for Life (IT course for seniors) — proxies to the `itcourse` process service on :4980.
   Used for /itcourse and /itcourse/*; _zo/server.ts strips the prefix, so the path is forwarded as-is. */
const UPSTREAM = "http://127.0.0.1:4980";
const STRIP = new Set(["content-encoding", "content-length", "transfer-encoding", "connection"]);

export default async (c: Context) => {
  const url = new URL(c.req.url);
  const headers = new Headers();
  c.req.raw.headers.forEach((value, key) => { if (key.toLowerCase() !== "host") headers.set(key, value); });
  const method = c.req.method;
  const body = method === "GET" || method === "HEAD" ? undefined : await c.req.raw.arrayBuffer();
  let upstream: Response;
  try {
    upstream = await fetch(UPSTREAM + url.pathname + url.search, { method, headers, body, redirect: "manual" });
  } catch (err) {
    return c.text("Tech for Life is restarting — try again in a minute.", 502);
  }
  const out = new Headers();
  upstream.headers.forEach((value, key) => { if (!STRIP.has(key.toLowerCase())) out.set(key, value); });
  const cookies = upstream.headers.getSetCookie?.() ?? [];
  if (cookies.length) { out.delete("set-cookie"); for (const cookie of cookies) out.append("set-cookie", cookie); }
  return new Response(upstream.body, { status: upstream.status, statusText: upstream.statusText, headers: out });
};
