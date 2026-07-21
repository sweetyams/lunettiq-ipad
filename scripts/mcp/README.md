# Foundry API MCP Server

Gives AI agents (Kiro, Cursor, etc.) live access to the Foundry dev API for verifying response shapes, testing edge cases, and checking data before building UI.

## Setup

```bash
# Install the MCP SDK (dev dependency)
pnpm add -D @modelcontextprotocol/sdk

# Get a long-lived dev token from Clerk (Lunettiq org, staff role)
# Add to your shell profile or .env.local:
export FOUNDRY_DEV_TOKEN="sk_test_..."
```

## How it works

The server runs as a stdio process spawned by the MCP client (Kiro CLI, Cursor, etc.). It connects to `http://lunettiq.localhost:4000` by default — make sure Foundry dev server is running.

## Available tools

### Generic (full API access)

| Tool | Description |
|------|-------------|
| `foundry_get` | GET any endpoint — pass the full path |
| `foundry_post` | POST to any endpoint — path + body |
| `foundry_patch` | PATCH any endpoint — path + body |

### Convenience shortcuts

| Tool | Description |
|------|-------------|
| `foundry_search_clients` | Fuzzy client search by name |
| `foundry_client_detail` | Full client profile + optional sub-resources |
| `foundry_products` | Storefront product catalogue |
| `foundry_product_detail` | Single product with specs |
| `foundry_appointments_today` | Today's schedule |
| `foundry_inventory` | Stock levels at a location |
| `foundry_design_tokens` | Native design tokens (no auth needed) |

## Usage examples (what the agent sees)

```
// Agent calls foundry_search_clients with { query: "marie", limit: 3 }
// Gets back real data to verify shapes

// Agent calls foundry_get with { path: "/api/clients/abc123/wishlist" }
// Sees actual wishlist structure before building the UI
```

## Token management

The `FOUNDRY_DEV_TOKEN` should be a Clerk session token with staff-level permissions. For dev, you can generate a long-lived token from the Clerk dashboard or use a service account.

**Never commit the token.** It's read from the environment at runtime.

## Overriding the base URL

```bash
export FOUNDRY_BASE_URL="https://lunettiq.bentspline.com"  # point to staging/prod
```
