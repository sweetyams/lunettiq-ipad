---
inclusion: auto
foundry-method: universal
version: "2026.07.1"
description: Write a task brief before multi-file work.
---

# Task Briefs

Before starting multi-file work (new features, multi-step fixes, refactors spanning 3+ files), write a task brief.

## When to Write

- New feature or component (always)
- Bug fix touching 3+ files (yes)
- Single-file fix with clear target (skip)
- Mechanical rename/refactor with grep (skip)

## How

1. Run investigator scan (find 2-3 existing implementations of the pattern)
2. Fill the brief template from `.kiro/working-method/templates/task-brief.md`
3. Write to `docs/briefs/{date}-{slug}.md` or an appropriate location
4. Execute the work using the brief as primary context
5. Append findings after completion

## Why

- Prevents re-deriving context each session
- Forces pattern verification (file:line refs, not hallucinated)
- Creates audit trail of decisions
- Upstream findings flow to downstream phases
