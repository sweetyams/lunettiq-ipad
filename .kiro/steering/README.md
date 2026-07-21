---
inclusion: manual
foundry-method: universal
version: "2026.07.1"
---

# Steering Files

## How AI agents read these files

- **Always-loaded** — `inclusion: always`. In context for every interaction. Keep minimal.
- **Auto-loaded** — `inclusion: auto`. Always in context, small utility files.
- **Conditional** — `inclusion: fileMatch` + `fileMatchPattern`. Load when matching files are open.
- **Manual** — `inclusion: manual`. Load only when explicitly referenced.

## Universal Files (synced from Foundry Methodology)

These files have `foundry-method: universal` in frontmatter. They're updated via `foundry-method sync`.
Do not edit directly — changes will be overwritten on next sync.

| File | Lines | Purpose |
|---|---|---|
| `99-stuck-detection.md` | ~38 | Detect and recover from repeated failed approaches |
| `98-learnings-review.md` | ~50 | Process findings inbox |
| `13-change-tracking.md` | ~31 | CHANGELOG.md update rule |
| `git-workflow.md` | ~53 | Commit conventions, safety rules |
| `48-debugging-triage.md` | ~40 | Triage order: env → network → config → code |
| `voice-and-tone.md` | ~59 | Response discipline, surgical changes, verification |
| `82-working-method-digest.md` | ~35 | Top universal patterns, condensed |

## Project Files (yours — never overwritten)

Files with `foundry-method: project` in frontmatter are project-specific.
Add discipline-specific steering here.

## Context Budget

- Always-loaded: ~130 lines (stuck-detection + change-tracking)
- Auto-loaded: ~190 lines (git-workflow + debugging-triage + voice-and-tone + digest)
- Total universal baseline: ~320 lines
- Discipline-specific: varies by pack (~400-900 lines worst case)
