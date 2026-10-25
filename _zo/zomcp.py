"""Call a Zo MCP tool from this box: python3 _zo/zomcp.py <tool> '<json args>'.
Uses ZO_API_BASE + ZO_CLIENT_IDENTITY_TOKEN from the environment (e.g. write_space_route, update_user_service)."""
import json, os, sys, urllib.request

def call(name, args):
    body = json.dumps({"jsonrpc": "2.0", "id": 1, "method": "tools/call", "params": {"name": name, "arguments": args}}).encode()
    req = urllib.request.Request(os.environ["ZO_API_BASE"] + "/mcp", data=body, headers={
        "Authorization": "Bearer " + os.environ["ZO_CLIENT_IDENTITY_TOKEN"], "Content-Type": "application/json",
        "Accept": "application/json, text/event-stream"})
    raw = urllib.request.urlopen(req, timeout=120).read().decode()
    for line in raw.splitlines():
        if line.startswith("data:"):
            raw = line[5:]
    return json.loads(raw)

if __name__ == "__main__":
    r = call(sys.argv[1], json.loads(sys.argv[2]) if len(sys.argv) > 2 else {})
    res = r.get("result", r)
    for c in (res.get("content", []) if isinstance(res, dict) else []):
        print(c.get("text", c))
