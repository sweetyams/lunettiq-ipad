#!/usr/bin/env tsx
/**
 * audit-design-drift.ts — Enforce the Lunettiq iPad design system contract.
 *
 * THE RULE: No hardcoded color values anywhere in component code.
 * All colors must be referenced as NativeWind token classNames or as
 * tokens from useDesignTokens(). Never bare hex, rgba, hsl, or color keywords
 * inside style={} props.
 *
 * This mirrors the constraint in .kiro/steering/02-design-system.md Rule 1.
 *
 * Allowed token class prefixes (from tailwind.config.js):
 *   bg-color-*, text-color-*, border-color-*, ring-color-*
 *   bg-verdict-*, text-verdict-*
 *   bg-mode-*, bg-chrome-*, text-chrome-*, border-chrome-*
 *
 * Scans: src/**\/*.{ts,tsx}  app/**\/*.{ts,tsx}
 *
 * Checks:
 *   1. Hardcoded hex in style={} props          → ERROR
 *   2. Hardcoded rgba/hsl in style={} props     → ERROR
 *   3. Tailwind arbitrary color class bg-[#...] → ERROR
 *   4. Custom shadows (use border-based depth)  → ERROR
 *   5. Font size below 14px in style props      → ERROR
 *   6. Any hex/rgba in string literals in code  → WARNING (may be in comments)
 */
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

const SRC_DIRS = ['src', 'app'];
const EXTENSIONS = ['.tsx', '.ts'];

// Files where raw color values are legitimately defined — never flagged
const ALWAYS_EXCLUDE = [
  'tailwind.config',
  'audit-design-drift',
  '.kiro',
  'node_modules',
  '.d.ts',
];

interface Violation {
  file: string;
  line: number;
  severity: 'error' | 'warn';
  rule: string;
  match: string;
  context: string;
}

// ─── Check definitions ───────────────────────────────────────────────────────

const CHECKS = [
  {
    id: 'no-hex-in-style',
    severity: 'error' as const,
    description: 'Hardcoded hex color in style prop (use token className)',
    // Matches hex inside style={{...}} — single or multi-line heuristic:
    // look for hex that appears on a line that also contains style= or backgroundColor/color/borderColor etc.
    test(line: string, _lines: string[], _i: number): string | null {
      if (isComment(line)) return null;
      const hasStyleProp = /style\s*=\s*\{/.test(line)
        || /backgroundColor\s*:/.test(line)
        || /(?<!\w)color\s*:/.test(line)
        || /borderColor\s*:/.test(line)
        || /tintColor\s*:/.test(line)
        || /fill\s*:/.test(line)
        || /stroke\s*:/.test(line);
      if (!hasStyleProp) return null;
      const hexMatch = line.match(/#[0-9A-Fa-f]{3,8}\b/);
      if (hexMatch) return hexMatch[0];
      return null;
    },
  },
  {
    id: 'no-rgba-in-style',
    severity: 'error' as const,
    description: 'Hardcoded rgba/hsl/hsla in style prop (use token className)',
    test(line: string): string | null {
      if (isComment(line)) return null;
      const hasStyleProp = /style\s*=\s*\{/.test(line)
        || /backgroundColor\s*:/.test(line)
        || /(?<!\w)color\s*:/.test(line)
        || /borderColor\s*:/.test(line)
        || /tintColor\s*:/.test(line);
      if (!hasStyleProp) return null;
      const rgbaMatch = line.match(/rgba?\s*\(|hsla?\s*\(/i);
      if (rgbaMatch) return rgbaMatch[0];
      return null;
    },
  },
  {
    id: 'no-arbitrary-tailwind-color',
    severity: 'error' as const,
    description: 'Tailwind arbitrary color value bg-[#...] / text-[#...] (use token class)',
    test(line: string): string | null {
      if (isComment(line)) return null;
      const match = line.match(/(?:bg|text|border|ring)-\[#[0-9A-Fa-f]{3,8}\]/);
      if (match) return match[0];
      return null;
    },
  },
  {
    id: 'no-custom-shadow',
    severity: 'error' as const,
    description: 'Custom shadow (use border-based depth — see 02-design-system.md)',
    excludeFiles: ['tailwind.config'],
    test(line: string): string | null {
      if (isComment(line)) return null;
      const match = line.match(/shadow-(?!none|inner|outline|sm|md|lg|xl|2xl)[a-z]|\bboxShadow\b|\belevation\s*:\s*[1-9]/i);
      if (match) return match[0];
      return null;
    },
  },
  {
    id: 'no-small-font',
    severity: 'error' as const,
    description: 'Font size below 14px in style prop (accessibility minimum)',
    excludeFiles: ['tailwind.config', 'audit-'],
    test(line: string): string | null {
      if (isComment(line)) return null;
      const match = line.match(/fontSize\s*:\s*(\d+)/);
      if (!match) return null;
      const size = parseInt(match[1]!, 10);
      if (size > 0 && size < 14) return match[0];
      return null;
    },
  },
  {
    id: 'no-system-blue',
    severity: 'error' as const,
    description: 'System blue detected — use color-brand token instead',
    test(line: string): string | null {
      if (isComment(line)) return null;
      const match = line.match(/#007AFF|systemBlue/i);
      if (match) return match[0];
      return null;
    },
  },
  {
    id: 'warn-hex-in-code',
    severity: 'warn' as const,
    description: 'Hex color literal in code (verify it\'s not a hardcoded color)',
    excludeFiles: ['tailwind.config', 'audit-'],
    test(line: string): string | null {
      if (isComment(line)) return null;
      // Hex that isn't inside a token definition file
      const match = line.match(/#[0-9A-Fa-f]{6}\b/);
      // Only warn if it's on a JSX/return line, not in a config object
      if (match && (line.includes('className=') || line.includes('style='))) {
        return match[0];
      }
      return null;
    },
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isComment(line: string): boolean {
  const t = line.trim();
  return t.startsWith('//') || t.startsWith('*') || t.startsWith('/*') || t.startsWith('<!--');
}

function collectFiles(dir: string): string[] {
  const results: string[] = [];
  try {
    for (const entry of readdirSync(dir)) {
      const fullPath = join(dir, entry);
      if (entry.startsWith('.') || entry === 'node_modules') continue;
      const stat = statSync(fullPath);
      if (stat.isDirectory()) results.push(...collectFiles(fullPath));
      else if (EXTENSIONS.some(ext => entry.endsWith(ext))) results.push(fullPath);
    }
  } catch { /* directory may not exist yet */ }
  return results;
}

// ─── Runner ──────────────────────────────────────────────────────────────────

function audit(): void {
  const violations: Violation[] = [];
  const root = process.cwd();
  const files = SRC_DIRS.flatMap(dir => collectFiles(join(root, dir)));

  for (const file of files) {
    const relPath = relative(root, file);

    // Skip always-excluded paths
    if (ALWAYS_EXCLUDE.some(ex => relPath.includes(ex))) continue;

    const lines = readFileSync(file, 'utf8').split('\n');

    for (const check of CHECKS) {
      // Skip per-check excludes
      if ('excludeFiles' in check && check.excludeFiles?.some(ex => relPath.includes(ex))) continue;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]!;
        const match = check.test(line, lines, i);
        if (match) {
          violations.push({
            file: relPath,
            line: i + 1,
            severity: check.severity,
            rule: check.description,
            match,
            context: line.trim().slice(0, 100),
          });
        }
      }
    }
  }

  // ─── Report ─────────────────────────────────────────────────────────────

  console.log('\n🎨 Design Drift Audit — Lunettiq iPad\n');

  const errors = violations.filter(v => v.severity === 'error');
  const warnings = violations.filter(v => v.severity === 'warn');

  if (violations.length === 0) {
    console.log('  ✓ No design drift detected\n');
    process.exit(0);
  }

  // Group by rule
  const grouped = new Map<string, Violation[]>();
  for (const v of violations) {
    const key = `${v.severity.toUpperCase()}: ${v.rule}`;
    grouped.set(key, [...(grouped.get(key) ?? []), v]);
  }

  for (const [rule, issues] of grouped) {
    const icon = issues[0]!.severity === 'error' ? '✗' : '⚠';
    console.log(`  ${icon} ${rule} (${issues.length})`);
    for (const issue of issues.slice(0, 5)) {
      console.log(`    ${issue.file}:${issue.line}`);
      console.log(`      → ${issue.context}`);
    }
    if (issues.length > 5) console.log(`    ... and ${issues.length - 5} more`);
    console.log('');
  }

  const summary = [
    errors.length > 0 ? `${errors.length} error${errors.length > 1 ? 's' : ''}` : '',
    warnings.length > 0 ? `${warnings.length} warning${warnings.length > 1 ? 's' : ''}` : '',
  ].filter(Boolean).join(', ');

  console.log(`  Total: ${summary}`);
  console.log(`  Fix: replace hardcoded values with token classNames (see 02-design-system.md)\n`);

  process.exit(errors.length > 0 ? 1 : 0);
}

audit();
