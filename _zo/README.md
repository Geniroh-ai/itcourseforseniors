# Tech for Life (itcourseforseniors) on Zo

Live at **https://genirohai.zo.space/itcourse/** — free and open, no login, no payment, no analytics.
Space api routes `/itcourse` + `/itcourse/*` (source `space-proxy.ts`) → process service **`itcourse`**
(`bun run _zo/server.ts`, **PORT 4980**, workdir = this repo's working tree). Resident repo:
`claudesworld/geniroh/itcourseforseniors` — the service serves straight from this tree, so don't delete it.

| Field | Value |
|---|---|
| Service label | `itcourse` (mode `process`) |
| Port | **4980** (`PORT=4980`) |
| Entrypoint | `bun run _zo/server.ts` |
| Working dir | `/home/workspace/claudesworld/geniroh/itcourseforseniors` |
| Space path | `/itcourse` |

## How it serves
`_zo/server.ts` is a ~60-line Bun static server over the repo root (`index.html`, `css/`, `js/`, `modules/`).
It strips the `/itcourse` prefix itself (the Space proxy forwards the path as-is), redirects `/itcourse` →
`/itcourse/` so the site's relative links resolve, maps a directory to its `index.html` and `module-7` to
`module-7.html`, hides `_zo/` and `.git/`, and sends HTML with `cache-control: no-store`. Every `css/…` and
`js/…` link in the HTML is rewritten to `…?v=<file mtime>` and such versioned URLs are served `immutable`, so
Cloudflare's ~4h js/css edge cache on zo.space never pins visitors to stale code. All links in the site are
relative, so it also works at `http://127.0.0.1:4980/` and on GitHub Pages.

## Deploy / restart
```
cd /home/workspace/claudesworld/geniroh/itcourseforseniors && git pull   # content edits are live on the next refresh
supervisorctl -c /etc/zo/supervisord-user.conf status itcourse
supervisorctl -c /etc/zo/supervisord-user.conf restart itcourse          # only after editing _zo/server.ts
curl -s https://genirohai.zo.space/itcourse/ | grep -c "Tech for Life"   # expect > 0 (retry once: ~1 in 6 self-requests 401)
```

Re-register from scratch (service + routes) with the MCP helper:
```
python3 _zo/zomcp.py register_user_service '{"label":"itcourse","mode":"process","entrypoint":"bun run _zo/server.ts","workdir":"/home/workspace/claudesworld/geniroh/itcourseforseniors","local_port":4980,"env_vars":{"PORT":"4980"}}'
python3 _zo/zomcp.py write_space_route "$(python3 -c 'import json;print(json.dumps({"path":"/itcourse","route_type":"api","code":open("_zo/space-proxy.ts").read()}))')"
python3 _zo/zomcp.py write_space_route "$(python3 -c 'import json;print(json.dumps({"path":"/itcourse/*","route_type":"api","code":open("_zo/space-proxy.ts").read()}))')"
python3 _zo/zomcp.py list_space_routes '{}'
```
If a freshly registered service does not show in `supervisorctl status`, call `update_user_service` with the same fields plus its `service_id`.

## Port map (shared box)
4980 itcourse · 4500 suki-uke (/ukulele) · 4960 hermes · 5010 tablelands · 4870 shehnai · 4800 pelli · 5150 rankian · 4860 tidewave · 5050 lnd · 4120 mis.
