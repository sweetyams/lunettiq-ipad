/**
 * Expo/React Native MCP Tools — project-specific context for AI agents.
 *
 * Tools:
 * - component_inventory: List all components in src/ui/ with prop counts
 * - screen_inventory: List all screens/routes from app/ directory
 * - api_endpoints: List all API client functions in src/api/
 * - db_models: List WatermelonDB models and their fields
 */
import * as fs from 'fs';
import * as path from 'path';

interface McpTool {
  name: string;
  description: string;
  inputSchema: { type: string; properties: Record<string, unknown>; required?: string[] };
  handler: (args: Record<string, unknown>) => Promise<{ content: { type: string; text: string }[] }>;
}

const ROOT = process.cwd();
function text(t: string) { return { content: [{ type: 'text' as const, text: t }] }; }

export const expoTools: McpTool[] = [
  {
    name: 'component_inventory',
    description: 'List all UI components in src/ui/ with export names and approximate line counts',
    inputSchema: { type: 'object', properties: {} },
    async handler() {
      const dir = path.join(ROOT, 'src/ui');
      if (!fs.existsSync(dir)) return text('No src/ui/ directory found');

      const components: { name: string; file: string; lines: number }[] = [];
      function walk(d: string) {
        for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
          const full = path.join(d, entry.name);
          if (entry.isDirectory()) { walk(full); continue; }
          if (!entry.name.endsWith('.tsx')) continue;
          const content = fs.readFileSync(full, 'utf8');
          const exportMatch = content.match(/export\s+(?:default\s+)?function\s+(\w+)/);
          components.push({
            name: exportMatch?.[1] ?? entry.name.replace('.tsx', ''),
            file: path.relative(ROOT, full),
            lines: content.split('\n').length,
          });
        }
      }
      walk(dir);
      return text(JSON.stringify(components, null, 2));
    }
  },
  {
    name: 'screen_inventory',
    description: 'List all screens/routes from the app/ directory (Expo Router file-based routing)',
    inputSchema: { type: 'object', properties: {} },
    async handler() {
      const dir = path.join(ROOT, 'app');
      if (!fs.existsSync(dir)) return text('No app/ directory found');

      const screens: { route: string; file: string; hasLayout: boolean }[] = [];
      function walk(d: string, prefix: string) {
        for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
          const full = path.join(d, entry.name);
          if (entry.isDirectory()) {
            // Route groups: (name) doesn't add to URL
            const segment = entry.name.startsWith('(') ? '' : `/${entry.name}`;
            walk(full, prefix + segment);
          } else if (entry.name === '_layout.tsx') {
            screens.push({ route: prefix || '/', file: path.relative(ROOT, full), hasLayout: true });
          } else if (entry.name.endsWith('.tsx') && !entry.name.startsWith('_')) {
            const segment = entry.name === 'index.tsx' ? '' : `/${entry.name.replace('.tsx', '')}`;
            screens.push({ route: prefix + segment || '/', file: path.relative(ROOT, full), hasLayout: false });
          }
        }
      }
      walk(dir, '');
      return text(JSON.stringify(screens, null, 2));
    }
  },
  {
    name: 'api_endpoints',
    description: 'List all API client functions in src/api/ — shows what server endpoints the app calls',
    inputSchema: { type: 'object', properties: {} },
    async handler() {
      const dir = path.join(ROOT, 'src/api');
      if (!fs.existsSync(dir)) return text('No src/api/ directory found');

      const endpoints: { file: string; functions: string[] }[] = [];
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.isDirectory() || !entry.name.endsWith('.ts')) continue;
        const full = path.join(dir, entry.name);
        const content = fs.readFileSync(full, 'utf8');
        const fns = [...content.matchAll(/export\s+(?:async\s+)?function\s+(\w+)/g)].map(m => m[1]).filter((x): x is string => !!x);
        if (fns.length) endpoints.push({ file: entry.name, functions: fns });
      }
      return text(JSON.stringify(endpoints, null, 2));
    }
  },
  {
    name: 'db_models',
    description: 'List WatermelonDB models and their fields from src/db/',
    inputSchema: { type: 'object', properties: {} },
    async handler() {
      const dir = path.join(ROOT, 'src/db');
      if (!fs.existsSync(dir)) return text('No src/db/ directory found');

      const models: { file: string; name: string; fields: string[] }[] = [];
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (!entry.name.endsWith('.ts') && !entry.name.endsWith('.tsx')) continue;
        const full = path.join(dir, entry.name);
        const content = fs.readFileSync(full, 'utf8');
        // Look for Model class definitions
        const classMatch = content.match(/class\s+(\w+)\s+extends\s+Model/);
        if (classMatch) {
          const fields = [...content.matchAll(/@(?:field|text|date|json|readonly)\s*\(['"](\w+)['"]\)/g)].map(m => m[1]).filter((x): x is string => !!x);
          models.push({ file: entry.name, name: classMatch[1]!, fields });
        }
      }
      return text(JSON.stringify(models, null, 2));
    }
  },
];
