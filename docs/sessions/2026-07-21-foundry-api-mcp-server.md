# 2026-07-21 — Foundry API MCP Server

## What Was Done
- Created `scripts/mcp/foundry-api-server.ts` — a stdio MCP server that gives AI agents live access to the Foundry dev API
- Updated `.mcp.json` to register the new `foundry-api` server alongside existing `foundry-methodology`
- Created `scripts/mcp/README.md` with setup instructions and tool reference

## Decisions Made

| Decision | Rationale | Alternatives Considered |
|---|---|---|
| Stdio transport (not HTTP) | Simplest — no port conflicts, no CORS, spawned on demand by the MCP client | HTTP server on a fixed port (rejected: port conflicts, needs manual start) |
| Generic + convenience tools | 3 generic tools (GET/POST/PATCH) cover any endpoint; 7 shortcuts reduce path-memorization for common operations | Only generic tools (rejected: too much cognitive load per call); Only convenience (rejected: can't cover all endpoints) |
| Token from environment variable | Never stored in code, read at runtime, follows existing pattern in `.mcp.json` | Hardcoded dev token (rejected: security); Clerk SDK in the MCP server (rejected: complexity) |
| No DELETE tool (yet) | Reduces accidental damage. Foundry's permission system is the real guard, but belt-and-suspenders for dev | Include delete (deferred, user can add later) |
| `@modelcontextprotocol/sdk` as devDependency | Standard MCP SDK, only needed for the tooling server, not the app itself | Raw stdio JSON-RPC (rejected: more code, less maintainable) |

## Architecture / Design Notes

```
┌─────────────────────────────────────────┐
│  Kiro CLI / Cursor / any MCP client     │
└─────────────┬───────────────────────────┘
              │ stdio (JSON-RPC)
┌─────────────▼───────────────────────────┐
│  scripts/mcp/foundry-api-server.ts      │
│  - Reads FOUNDRY_DEV_TOKEN from env     │
│  - Attaches Bearer + X-Found-Surface    │
│  - 10 tools (3 generic + 7 shortcuts)   │
└─────────────┬───────────────────────────┘
              │ HTTP (fetch)
┌─────────────▼───────────────────────────┐
│  Foundry dev server                     │
│  http://lunettiq.localhost:4000         │
└─────────────────────────────────────────┘
```

**Tool inventory:**

| Category | Tools |
|---|---|
| Generic | `foundry_get`, `foundry_post`, `foundry_patch` |
| Clients | `foundry_search_clients`, `foundry_client_detail` |
| Products | `foundry_products`, `foundry_product_detail` |
| Operations | `foundry_appointments_today`, `foundry_inventory` |
| System | `foundry_design_tokens` |

## Findings

- Existing `scripts/mcp/tools.ts` has 4 introspection tools (component_inventory, screen_inventory, api_endpoints, db_models) but isn't registered in `.mcp.json` as a server — it's likely consumed differently or is a WIP
- `.mcp.json` supports env var interpolation with `${VAR}` and `${VAR:-default}` syntax
- The `@modelcontextprotocol/sdk` package is not yet installed — needs `pnpm add -D @modelcontextprotocol/sdk` before the server will run

## Open Questions

- How to obtain a long-lived dev token for `FOUNDRY_DEV_TOKEN`? Clerk session tokens expire in ~60s. Options: (a) Clerk service account with long-lived token, (b) a dev-only Foundry endpoint that issues a session, (c) refresh-on-demand in the MCP server itself
- Should `scripts/mcp/tools.ts` (the existing introspection tools) be merged into this server or registered separately?
- Should `foundry_delete` be added, or leave destructive ops gated behind explicit user confirmation?

## Next Steps

- Run `pnpm add -D @modelcontextprotocol/sdk` to install the dependency
- Generate or configure a dev token and export as `FOUNDRY_DEV_TOKEN`
- Test the server: `FOUNDRY_DEV_TOKEN=xxx npx tsx scripts/mcp/foundry-api-server.ts` (should start and await JSON-RPC on stdin)
- Consider adding a `foundry_delete` tool if needed
- Resolve the token lifetime question (service account vs refresh logic)
