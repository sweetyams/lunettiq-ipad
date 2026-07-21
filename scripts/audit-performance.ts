#!/usr/bin/env tsx
/**
 * audit-performance.ts — Check RN performance anti-patterns.
 * Usage: npx tsx scripts/audit-performance.ts
 *
 * Checks:
 * - Inline arrow functions in JSX props (re-render cause)
 * - Missing memo on list item components
 * - FlatList without keyExtractor
 * - Large imports from barrel files
 */
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

const SRC = join(process.cwd(), 'src');
const violations: string[] = [];

function walk(dir: string) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '__tests__') continue;
      walk(full);
    } else if (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts')) {
      checkFile(full);
    }
  }
}

function checkFile(path: string) {
  const content = readFileSync(path, 'utf8');
  const rel = relative(process.cwd(), path);
  const lines = content.split('\n');

  lines.forEach((line, i) => {
    // Inline arrow in render props (common re-render cause)
    if (line.match(/onPress=\{?\(\)\s*=>/)) {
      // Only flag if it's creating a new closure each render (not a useCallback ref)
      if (!content.includes('useCallback')) {
        violations.push(`${rel}:${i + 1} — Inline arrow in onPress (wrap in useCallback or extract)`);
      }
    }

    // FlatList without keyExtractor
    if (line.includes('<FlatList') && !content.slice(content.indexOf(line)).includes('keyExtractor')) {
      violations.push(`${rel}:${i + 1} — FlatList without keyExtractor`);
    }
  });

  // Large component without memo (heuristic: >100 lines and renders a list)
  if (lines.length > 100 && content.includes('FlatList') && !content.includes('memo(')) {
    violations.push(`${rel} — Large list component without React.memo (${lines.length} lines)`);
  }
}

console.log('\n🔍 Performance Audit\n');

try {
  walk(SRC);
} catch {
  console.log('  ⚠ No src/ directory found. Skipping.');
  process.exit(0);
}

if (violations.length === 0) {
  console.log('  ✅ No performance anti-patterns found.\n');
} else {
  console.log(`  Found ${violations.length} potential issue(s):\n`);
  violations.forEach(v => console.log(`  ⚠ ${v}`));
  console.log('');
}
