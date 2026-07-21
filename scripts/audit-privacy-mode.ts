#!/usr/bin/env tsx
/**
 * audit-privacy-mode.ts — Detect components that access sensitive data
 * without privacy mode guards.
 *
 * Scans for:
 * - Direct access to sensitive fields (LTV, AOV, revenue, tags, notes)
 *   without checking usePrivacyStore
 * - Components rendering prices without privacy guard
 * - Client-visible screens showing internal data
 */
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

const SRC_DIRS = ['src', 'app'];
const EXTENSIONS = ['.tsx'];

// Sensitive data patterns that MUST be guarded by privacy mode check
const SENSITIVE_PATTERNS = [
  { name: 'LTV/revenue access', pattern: /\b(ltv|lifetime[Vv]alue|totalRevenue|lifetimeSpend)\b/g },
  { name: 'AOV/order value', pattern: /\b(aov|averageOrderValue|orderValue)\b/g },
  { name: 'Internal tags', pattern: /\b(internalTags?|staffTags?|privateTags?)\b/g },
  { name: 'Return rate', pattern: /\b(returnRate|refundRate)\b/g },
  { name: 'Private notes', pattern: /\b(privateNotes?|staffNotes?|internalNotes?)\b/g },
  { name: 'Credit amount', pattern: /\b(creditBalance|creditAmount|credits?\.\$|credits?\.amount)\b/g },
  { name: 'Inventory count', pattern: /\b(inventoryCount|stockCount|quantityAvailable)\b/g },
  { name: 'Sales history', pattern: /\b(salesHistory|salesData|salesCount)\b/g },
];

// Guard patterns — if any of these appear in the file, it's protected
const GUARD_PATTERNS = [
  /usePrivacyStore/,
  /privacyMode/,
  /mode\s*===?\s*['"]staff['"]/,
  /mode\s*===?\s*['"]client['"]/,
  /StaffOnly/,
  /ClientVisible/,
  /<StaffOnly/,
];

interface Issue {
  file: string;
  line: number;
  rule: string;
  context: string;
}

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

function hasPrivacyGuard(content: string): boolean {
  return GUARD_PATTERNS.some((pattern) => pattern.test(content));
}

function audit(): void {
  const issues: Issue[] = [];
  const root = process.cwd();

  const files = SRC_DIRS.flatMap((dir) => collectFiles(join(root, dir)));

  for (const file of files) {
    const relPath = relative(root, file);
    const content = readFileSync(file, 'utf8');

    // Skip files that are privacy infrastructure themselves
    if (relPath.includes('privacy') || relPath.includes('Privacy')) continue;
    // Skip test files
    if (relPath.includes('.test.')) continue;
    // Skip type definition files
    if (relPath.endsWith('.types.ts')) continue;

    const lines = content.split('\n');

    for (const sensitive of SENSITIVE_PATTERNS) {
      // Check if this file accesses sensitive data
      const hasMatch = sensitive.pattern.test(content);
      sensitive.pattern.lastIndex = 0; // Reset regex state

      if (hasMatch && !hasPrivacyGuard(content)) {
        // Find the specific lines
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i]!;
          if (line.trim().startsWith('//') || line.trim().startsWith('*')) continue;
          sensitive.pattern.lastIndex = 0;
          if (sensitive.pattern.test(line)) {
            issues.push({
              file: relPath,
              line: i + 1,
              rule: sensitive.name,
              context: line.trim().slice(0, 80),
            });
          }
          sensitive.pattern.lastIndex = 0;
        }
      }
    }
  }

  console.log(`\n🔒 Privacy Mode Audit\n`);

  if (issues.length === 0) {
    console.log('  ✓ All sensitive data access is privacy-guarded\n');
    process.exit(0);
  }

  // Group by file
  const grouped = new Map<string, Issue[]>();
  for (const issue of issues) {
    const existing = grouped.get(issue.file) ?? [];
    existing.push(issue);
    grouped.set(issue.file, existing);
  }

  for (const [file, fileIssues] of grouped) {
    console.log(`  ✗ ${file} (missing privacy guard)`);
    for (const issue of fileIssues.slice(0, 3)) {
      console.log(`    L${issue.line}: ${issue.rule} → ${issue.context}`);
    }
    if (fileIssues.length > 3) {
      console.log(`    ... and ${fileIssues.length - 3} more`);
    }
    console.log('');
  }

  console.log(`  Total: ${issues.length} unguarded sensitive data accesses`);
  console.log(`  Fix: Import usePrivacyStore and conditionally render sensitive data\n`);
  process.exit(1);
}

audit();
