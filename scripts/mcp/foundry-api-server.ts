#!/usr/bin/env npx tsx
/**
 * Foundry API MCP Server
 *
 * Gives AI agents direct access to Foundry's REST API (dev environment).
 * Read-heavy by design — all GET operations are unrestricted, writes are
 * scoped to safe operations (interactions, sessions, product-interactions).
 *
 * Usage:
 *   FOUNDRY_DEV_TOKEN=<clerk_dev_token> npx tsx scripts/mcp/foundry-api-server.ts
 *
 * Or via .mcp.json config (token from env).
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const BASE_URL = process.env.FOUNDRY_BASE_URL ?? 'http://lunettiq.localhost:4000';
const TOKEN = process.env.FOUNDRY_DEV_TOKEN ?? '';
const SURFACE = 'tablet';

if (!TOKEN) {
  console.error('⚠️  FOUNDRY_DEV_TOKEN not set. API calls will fail with 401.');
}

// ---------------------------------------------------------------------------
// HTTP helpers
// ---------------------------------------------------------------------------

interface FoundryResponse<T = unknown> {
  data: T | null;
  error: { code: string; message: string; details?: unknown } | null;
  meta: { requestId: string; total?: number; limit?: number; offset?: number };
}

async function foundryFetch(
  method: string,
  path: string,
  body?: unknown,
): Promise<FoundryResponse> {
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${TOKEN}`,
    'X-Found-Surface': SURFACE,
  };
  if (body) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  return res.json() as Promise<FoundryResponse>;
}

// ---------------------------------------------------------------------------
// Tool definitions
// ---------------------------------------------------------------------------

const tools = [
  // ─── Generic API access ─────────────────────────────────────────────────
  {
    name: 'foundry_get',
    description:
      'GET any Foundry API endpoint. Returns the full response envelope (data + error + meta). ' +
      'Path should start with /api/. Query params can be appended to the path.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        path: {
          type: 'string',
          description: 'API path, e.g. /api/clients?q=marie&limit=5',
        },
      },
      required: ['path'],
    },
  },
  {
    name: 'foundry_post',
    description:
      'POST to a Foundry API endpoint. Use for creating resources (interactions, sessions, etc.). ' +
      'Returns the full response envelope.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        path: { type: 'string', description: 'API path, e.g. /api/clients/{id}/interactions' },
        body: { type: 'object', description: 'Request body (JSON object)' },
      },
      required: ['path', 'body'],
    },
  },
  {
    name: 'foundry_patch',
    description:
      'PATCH a Foundry API resource. Use for updating fields on an existing resource.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        path: { type: 'string', description: 'API path, e.g. /api/clients/{id}' },
        body: { type: 'object', description: 'Fields to update (JSON object)' },
      },
      required: ['path', 'body'],
    },
  },

  // ─── Convenience shortcuts ──────────────────────────────────────────────
  {
    name: 'foundry_search_clients',
    description:
      'Search clients by name (fuzzy). Returns top matches with id, name, email, tier.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string', description: 'Search term' },
        limit: { type: 'number', description: 'Max results (default 10)' },
      },
      required: ['query'],
    },
  },
  {
    name: 'foundry_client_detail',
    description:
      'Fetch a client profile by ID. Returns full profile, preferences, enrichment.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        id: { type: 'string', description: 'Client UUID' },
        include: {
          type: 'array',
          items: { type: 'string' },
          description:
            'Additional sub-resources to fetch: interactions, orders, prescriptions, wishlist, segments, product-interactions',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'foundry_products',
    description:
      'List products from the storefront catalogue. Supports pagination.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        limit: { type: 'number', description: 'Max results (default 50)' },
        offset: { type: 'number', description: 'Pagination offset' },
      },
    },
  },
  {
    name: 'foundry_product_detail',
    description: 'Fetch a single product by ID with full specs.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        id: { type: 'string', description: 'Product ID' },
      },
      required: ['id'],
    },
  },
  {
    name: 'foundry_appointments_today',
    description: 'Fetch today\'s appointments for a location.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        locationId: { type: 'string', description: 'Location ID (optional — uses default if omitted)' },
        date: { type: 'string', description: 'Date in YYYY-MM-DD (default: today)' },
      },
    },
  },
  {
    name: 'foundry_inventory',
    description: 'Check inventory/stock levels at a location.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        locationId: { type: 'string', description: 'Location ID' },
      },
      required: ['locationId'],
    },
  },
  {
    name: 'foundry_design_tokens',
    description:
      'Fetch native design tokens (no auth required). Returns colors, fonts, spacing, radius.',
    inputSchema: {
      type: 'object' as const,
      properties: {},
    },
  },
];

// ---------------------------------------------------------------------------
// Tool handlers
// ---------------------------------------------------------------------------

async function handleTool(name: string, args: Record<string, unknown>) {
  switch (name) {
    case 'foundry_get':
      return foundryFetch('GET', args.path as string);

    case 'foundry_post':
      return foundryFetch('POST', args.path as string, args.body);

    case 'foundry_patch':
      return foundryFetch('PATCH', args.path as string, args.body);

    case 'foundry_search_clients': {
      const limit = (args.limit as number) ?? 10;
      return foundryFetch('GET', `/api/clients?q=${encodeURIComponent(args.query as string)}&limit=${limit}`);
    }

    case 'foundry_client_detail': {
      const id = args.id as string;
      const include = (args.include as string[]) ?? [];
      const results: Record<string, unknown> = {};

      // Always fetch profile
      results.profile = await foundryFetch('GET', `/api/clients/${id}`);

      // Fetch requested sub-resources in parallel
      if (include.length > 0) {
        const subFetches = include.map(async (sub) => {
          const res = await foundryFetch('GET', `/api/clients/${id}/${sub}`);
          return [sub, res] as const;
        });
        for (const [sub, res] of await Promise.all(subFetches)) {
          results[sub] = res;
        }
      }
      return results;
    }

    case 'foundry_products': {
      const limit = (args.limit as number) ?? 50;
      const offset = (args.offset as number) ?? 0;
      return foundryFetch('GET', `/api/storefront/products?limit=${limit}&offset=${offset}`);
    }

    case 'foundry_product_detail':
      return foundryFetch('GET', `/api/storefront/products/${args.id}`);

    case 'foundry_appointments_today': {
      const date = (args.date as string) ?? new Date().toISOString().split('T')[0];
      const locParam = args.locationId ? `&locationId=${args.locationId}` : '';
      return foundryFetch('GET', `/api/storefront/scheduling/appointments?date=${date}${locParam}`);
    }

    case 'foundry_inventory':
      return foundryFetch('GET', `/api/inventory?locationId=${args.locationId}`);

    case 'foundry_design_tokens':
      // No auth needed — public endpoint
      const res = await fetch(`${BASE_URL}/api/design/native`);
      return res.json();

    default:
      return { error: { code: 'UNKNOWN_TOOL', message: `Unknown tool: ${name}` } };
  }
}

// ---------------------------------------------------------------------------
// MCP Server setup
// ---------------------------------------------------------------------------

const server = new Server(
  { name: 'foundry-api', version: '1.0.0' },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: tools.map(({ name, description, inputSchema }) => ({ name, description, inputSchema })),
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  try {
    const result = await handleTool(name, (args ?? {}) as Record<string, unknown>);
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      content: [{ type: 'text', text: `Error: ${message}` }],
      isError: true,
    };
  }
});

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`🔌 Foundry API MCP server running (${BASE_URL})`);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
