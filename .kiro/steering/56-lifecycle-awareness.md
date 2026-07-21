---
inclusion: fileMatch
fileMatchPattern: "src/**,app/**,lib/**"
foundry-method: universal
version: "2026.07.1"
description: Check code stability before modifying. Bug fix is not redesign permission.
---

# Lifecycle Awareness

Code has maturity states. Respect them.

## Stability Levels

| State | Meaning | Agent behaviour |
|---|---|---|
| Building | Under active construction | Follow buildflow, create freely |
| Evolving | Works but improving | Targeted changes only, don't restructure |
| Stable | Battle-tested, in production | Surgical fixes only, never redesign without asking |

## Rules

1. **Check before modifying.** If code is stable/production, ask before restructuring.
2. **Bug fix ≠ redesign permission.** Fix the bug. Don't "improve" the surrounding code.
3. **Scope rule:** If your change touches 3+ files unexpectedly, pause and confirm the approach.
4. **Never redesign on a bug fix ticket.** Propose the redesign separately.
