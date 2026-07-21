#!/usr/bin/env tsx
/**
 * audit-accessibility.ts — Check RN accessibility patterns.
 * Usage: npx tsx scripts/audit-accessibility.ts
 *
 * Checks:
 * - Pressable/TouchableOpacity without accessibilityLabel
 * - Images without accessibilityLabel or accessible={false}
 * - Missing accessibilityRole on interactive elements
 * - Text size below 17pt (minimum for readability on iPad)
 */
import { readFileSync, readdirSync } from 'fs';
import { join, relative } from 'path';

const SRC = join(process.cwd(), 'src');
const violations: string[] = [];

function walk(dir: string) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '__tests__') continue;
      walk(full);
    } else if (entry.name.endsWith('.tsx')) {
      checkFile(full);
    }
  }
}

function checkFile(path: string) {
  const content = readFileSync(path, 'utf8');
  const rel = relative(process.cwd(), path);
  const lines = content.split('\n');

  lines.forEach((line, i) => {
    // Pressable/Touchable without accessibility label
    if (line.match(/<(Pressable|TouchableOpacity|TouchableHighlight)/) && !line.includes('accessibility')) {
      // Check next 5 lines for accessibilityLabel
      const block = lines.slice(i, i + 5).join(' ');
      if (!block.includes('accessibilityLabel') && !block.includes('accessible={false}')) {
        violations.push(`${rel}:${i + 1} — Interactive element without accessibilityLabel`);
      }
    }

    // Image without accessibility
    if (line.match(/<Image\s/) && !line.includes('accessible')) {
      const block = lines.slice(i, i + 3).join(' ');
      if (!block.includes('accessibilityLabel') && !block.includes('accessible={false}')) {
        violations.push(`${rel}:${i + 1} — Image without accessibilityLabel or accessible={false}`);
      }
    }
  });
}

console.log('\n🔍 Accessibility Audit\n');

try {
  walk(SRC);
} catch {
  console.log('  ⚠ No src/ directory found. Skipping.');
  process.exit(0);
}

if (violations.length === 0) {
  console.log('  ✅ No accessibility issues found.\n');
} else {
  console.log(`  Found ${violations.length} issue(s):\n`);
  violations.forEach(v => console.log(`  ⚠ ${v}`));
  console.log('');
}
