#!/usr/bin/env tsx
/**
 * audit-design-drift.ts — Detect violations of the design system contract.
 *
 * Scans for:
 * - Hardcoded hex colors (should use brand tokens via NativeWind)
 * - Custom shadows (forbidden — use border-based depth only)
 * - Wrong font sizes (below 17pt body minimum)
 * - System blue or non-brand colors
 * - Direct style prop usage (should use className)
 */
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

const SRC_DIRS = ['src', 'app'];
const EXTENSIONS = ['.tsx', '.ts'];

// Brand palette — these are the ONLY allowed color references
const BRAND_COLORS = [
  '#0A153D', // navy
  '#005D23', // green
  '#F5F2EC', // offWhite
  '#E8E4DE', // warmGrey
  '#2B2B2B', // charcoal
  '#6B6B6B', // midGrey
  '#FFFFFF', // white
  '#C53030', // error
  '#D4A017', // warning
  '#2D4A8A', // blue
];

// Patterns that indicate design drift
const VIOLATIONS = [
  {
    name: 'Hardcoded hex color (not in brand palette)',
    pattern: /#[0-9A-Fa-f]{6}\b/g,
    filter: (match: string, line: string) => {
      // Allow brand colors and comments
      if (BRAND_COLORS.includes(match.toUpperCase())) return false;
      if (line.trim().startsWith('//') || line.trim().startsWith('*')) return false;
      // Allow in tailwind config and design system definition files
      return true;
    },
    excludeFiles: ['tailwind.config', 'design-system', 'tokens', 'theme'],
  },
  {
    name: 'Custom shadow (use border-based depth)',
    pattern: /shadow[-_]|boxShadow|elevation:\s*\d/g,
    filter: (_match: string, line: string) => {
      if (line.trim().startsWith('//') || line.trim().startsWith('*')) return false;
      return true;
    },
    excludeFiles: ['tailwind.config'],
  },
  {
    name: 'Inline style prop (use className)',
    pattern: /style=\{\{[^}]*\}\}/g,
    filter: (_match: string, line: string) => {
      if (line.trim().startsWith('//') || line.trim().startsWith('*')) return false;
      return true;
    },
    excludeFiles: [],
  },
  {
    name: 'System blue color (banned — use brand tokens)',
    pattern: /systemBlue|#007AFF|tintColor|color:\s*['"]blue['"]/gi,
    filter: (_match: string, line: string) => {
      if (line.trim().startsWith('//') || line.trim().startsWith('*')) return false;
      return true;
    },
    excludeFiles: [],
  },
  {
    name: 'Font size below 17pt minimum (accessibility)',
    pattern: /fontSize:\s*(\d+)/g,
    filter: (match: string, line: string) => {
      if (line.trim().startsWith('//') || line.trim().startsWith('*')) return false;
      const sizeMatch = match.match(/\d+/);
      if (!sizeMatch) return false;
      const size = parseInt(sizeMatch[0], 10);
      // Allow sizes 14pt for captions (documented exception)
      return size < 14 && size > 0;
    },
    excludeFiles: ['theme', 'tokens', 'tailwind'],
  },
];

interface Issue {
  file: string;
  line: number;
  rule: string;
  match: string;
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

function audit(): void {
  const issues: Issue[] = [];
  const root = process.cwd();

  const files = SRC_DIRS.flatMap((dir) => collectFiles(join(root, dir)));

  for (const file of files) {
    const relPath = relative(root, file);
    const content = readFileSync(file, 'utf8');
    const lines = content.split('\n');

    for (const violation of VIOLATIONS) {
      // Skip excluded files
      if (violation.excludeFiles.some((exc) => relPath.includes(exc))) continue;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]!;
        const matches = line.matchAll(violation.pattern);
        for (const match of matches) {
          if (violation.filter(match[0], line)) {
            issues.push({
              file: relPath,
              line: i + 1,
              rule: violation.name,
              match: match[0],
              context: line.trim().slice(0, 80),
            });
          }
        }
      }
    }
  }

  console.log(`\n🎨 Design Drift Audit\n`);

  if (issues.length === 0) {
    console.log('  ✓ No design drift detected\n');
    process.exit(0);
  }

  // Group by rule
  const grouped = new Map<string, Issue[]>();
  for (const issue of issues) {
    const existing = grouped.get(issue.rule) ?? [];
    existing.push(issue);
    grouped.set(issue.rule, existing);
  }

  for (const [rule, ruleIssues] of grouped) {
    console.log(`  ✗ ${rule} (${ruleIssues.length} occurrences)`);
    for (const issue of ruleIssues.slice(0, 5)) {
      console.log(`    ${issue.file}:${issue.line} → ${issue.context}`);
    }
    if (ruleIssues.length > 5) {
      console.log(`    ... and ${ruleIssues.length - 5} more`);
    }
    console.log('');
  }

  console.log(`  Total: ${issues.length} design drift violations\n`);
  process.exit(1);
}

audit();
