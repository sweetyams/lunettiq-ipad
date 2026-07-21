#!/usr/bin/env tsx
/**
 * audit-offline-awareness.ts — Detect API calls without offline fallback.
 *
 * Scans for:
 * - fetch() calls without try/catch or error handling
 * - TanStack Query hooks without offline fallback patterns
 * - Components using API data without handling network errors
 * - Mutations without offline queue consideration
 */
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

const SRC_DIRS = ['src', 'app'];
const EXTENSIONS = ['.ts', '.tsx'];

interface Issue {
  file: string;
  line: number;
  rule: string;
  severity: 'error' | 'warn';
  context: string;
}

// Patterns that indicate API usage
const API_PATTERNS = [
  {
    name: 'Raw fetch() without offline handling',
    pattern: /\bfetch\s*\(/g,
    severity: 'error' as const,
    // Raw fetch should never appear in components — use the api client
    excludeFiles: ['api/client', 'sync/', 'camera/'],
  },
  {
    name: 'useMutation without onError handler',
    severity: 'warn' as const,
    custom: (content: string, lines: string[]): { line: number; context: string }[] => {
      const results: { line: number; context: string }[] = [];
      // Find useMutation calls and check if they have onError
      const mutationRegex = /useMutation\s*\(\s*\{/g;
      let match;
      while ((match = mutationRegex.exec(content)) !== null) {
        const startIdx = match.index;
        // Look ahead ~500 chars for onError
        const slice = content.slice(startIdx, startIdx + 500);
        if (!slice.includes('onError')) {
          const lineNum = content.slice(0, startIdx).split('\n').length;
          results.push({
            line: lineNum,
            context: lines[lineNum - 1]?.trim().slice(0, 80) ?? '',
          });
        }
      }
      return results;
    },
    excludeFiles: [],
  },
  {
    name: 'API hook without error state handling in component',
    severity: 'warn' as const,
    custom: (content: string, lines: string[]): { line: number; context: string }[] => {
      const results: { line: number; context: string }[] = [];
      // Check if file uses a query hook but doesn't destructure/handle error
      const queryHookPattern = /const\s*\{[^}]*\}\s*=\s*use\w+\(/g;
      let match;
      while ((match = queryHookPattern.exec(content)) !== null) {
        const destructured = match[0];
        // If it's a query hook and doesn't destructure error or isError
        if (
          !destructured.includes('error') &&
          !destructured.includes('isError') &&
          // Only flag if it looks like a data-fetching hook
          (destructured.includes('data') || destructured.includes('isLoading'))
        ) {
          const lineNum = content.slice(0, match.index).split('\n').length;
          results.push({
            line: lineNum,
            context: lines[lineNum - 1]?.trim().slice(0, 80) ?? '',
          });
        }
      }
      return results;
    },
    excludeFiles: ['test', '.test.'],
  },
];

function collectFiles(dir: string): string[] {
  const results: string[] = [];
  try {
    const entries = readdirSync(dir);
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      if (entry.startsWith('.') || entry === 'node_modules') continue;
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        results.push(...collectFiles(fullPath));
      } else if (EXTENSIONS.some((ext) => entry.endsWith(ext))) {
        results.push(fullPath);
      }
    }
  } catch {
    // Directory doesn't exist yet
  }
  return results;
}

function audit(): void {
  const issues: Issue[] = [];
  const root = process.cwd();

  const files = SRC_DIRS.flatMap((dir) => collectFiles(join(root, dir)));

  for (const file of files) {
    const relPath = relative(root, file);
    const content = readFileSync(file, 'utf8');
    const lines = content.split('\n');

    // Skip test files
    if (relPath.includes('.test.')) continue;

    for (const check of API_PATTERNS) {
      // Skip excluded files
      if (check.excludeFiles.some((exc) => relPath.includes(exc))) continue;

      if ('custom' in check && check.custom) {
        const results = check.custom(content, lines);
        for (const result of results) {
          issues.push({
            file: relPath,
            line: result.line,
            rule: check.name,
            severity: check.severity,
            context: result.context,
          });
        }
      } else if ('pattern' in check) {
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i]!;
          if (line.trim().startsWith('//') || line.trim().startsWith('*')) continue;
          check.pattern.lastIndex = 0;
          if (check.pattern.test(line)) {
            issues.push({
              file: relPath,
              line: i + 1,
              rule: check.name,
              severity: check.severity,
              context: line.trim().slice(0, 80),
            });
          }
          check.pattern.lastIndex = 0;
        }
      }
    }
  }

  console.log(`\n📡 Offline Awareness Audit\n`);

  if (issues.length === 0) {
    console.log('  ✓ All API usage has proper offline handling\n');
    process.exit(0);
  }

  const errors = issues.filter((i) => i.severity === 'error');
  const warnings = issues.filter((i) => i.severity === 'warn');

  if (errors.length > 0) {
    console.log(`  Errors (${errors.length}):`);
    for (const issue of errors.slice(0, 10)) {
      console.log(`    ✗ ${issue.file}:${issue.line} — ${issue.rule}`);
      console.log(`      ${issue.context}`);
    }
    if (errors.length > 10) console.log(`    ... and ${errors.length - 10} more`);
    console.log('');
  }

  if (warnings.length > 0) {
    console.log(`  Warnings (${warnings.length}):`);
    for (const issue of warnings.slice(0, 10)) {
      console.log(`    ⚠ ${issue.file}:${issue.line} — ${issue.rule}`);
      console.log(`      ${issue.context}`);
    }
    if (warnings.length > 10) console.log(`    ... and ${warnings.length - 10} more`);
    console.log('');
  }

  console.log(`  Total: ${errors.length} errors, ${warnings.length} warnings`);
  console.log(`  Fix: Use the api client (src/api/client.ts) and handle error states\n`);

  // Only fail on errors, not warnings
  if (errors.length > 0) process.exit(1);
}

audit();
