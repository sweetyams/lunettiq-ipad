#!/usr/bin/env tsx
/**
 * verify.ts — Run all quality checks for the Lunettiq iPad app.
 *
 * Runs in order: TypeScript → Design Drift → Accessibility → Performance →
 * Privacy Mode → Offline Awareness → Tests
 *
 * Usage: npx tsx scripts/verify.ts
 *        pnpm verify
 */
import { execSync } from 'child_process';

interface Check {
  name: string;
  cmd: string;
  optional?: boolean; // Optional checks warn but don't fail the pipeline
}

const checks: Check[] = [
  // Core — must pass
  { name: 'TypeScript', cmd: 'npx tsc --noEmit' },

  // Design system enforcement — hardcoded colors are a hard failure
  { name: 'Design Drift', cmd: 'npx tsx scripts/audit-design-drift.ts' },

  // Accessibility (steering: 44pt targets, 17pt min, VoiceOver labels)
  { name: 'Accessibility', cmd: 'npx tsx scripts/audit-accessibility.ts', optional: true },

  // Performance (no inline arrows in FlatList, missing keyExtractor, etc.)
  { name: 'Performance', cmd: 'npx tsx scripts/audit-performance.ts', optional: true },

  // Privacy mode (sensitive data without guard)
  { name: 'Privacy Mode', cmd: 'npx tsx scripts/audit-privacy-mode.ts', optional: true },

  // Offline awareness (API calls without error handling)
  { name: 'Offline Awareness', cmd: 'npx tsx scripts/audit-offline-awareness.ts', optional: true },

  // Tests — optional until test suite is established
  { name: 'Tests', cmd: 'npx vitest run --passWithNoTests', optional: true },
];

let passed = 0;
let warned = 0;
let failed = 0;

console.log('\n🔍 Lunettiq iPad — Verify Pipeline\n');
console.log('─'.repeat(50));

for (const check of checks) {
  try {
    execSync(check.cmd, { stdio: 'pipe', encoding: 'utf8' });
    console.log(`  ✓ ${check.name}`);
    passed++;
  } catch (err: any) {
    if (check.optional) {
      const firstLine = err.stdout?.split('\n').find((l: string) => l.trim()) ?? err.message?.split('\n')[0] ?? 'failed';
      console.log(`  ⚠ ${check.name} (warning)`);
      warned++;
    } else {
      console.log(`  ✗ ${check.name}`);
      const output = err.stdout || err.stderr || err.message || '';
      const lines = output.split('\n').filter((l: string) => l.trim()).slice(-5);
      for (const line of lines) {
        console.log(`    ${line}`);
      }
      failed++;
    }
  }
}

console.log('─'.repeat(50));
console.log(`\n  ${passed} passed, ${warned} warned, ${failed} failed`);

if (failed > 0) {
  console.log('  ❌ Verification failed\n');
  process.exit(1);
} else if (warned > 0) {
  console.log('  ⚠️  Passed with warnings\n');
} else {
  console.log('  ✅ All checks passed\n');
}
