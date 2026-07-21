---
inclusion: auto
foundry-method: universal
version: "2026.07.1"
description: Rules for maintaining context across sessions.
---

# Session Continuity

## On Session Start

Check `docs/sessions/` for recent handoff files. Read the most recent one to recover context.

## On Session End

If work is incomplete or context limits approach:
1. Write a handoff to `docs/sessions/YYYY-MM-DD-<slug>-handoff.md`
2. Capture any findings to `.kiro/findings/inbox.md`

## Session Logs

Ephemeral notes in `docs/sessions/`. Format: `YYYY-MM-DD-topic.md`. Reference material — doesn't need polish.

## Rules

- Never lose state silently — write it down before exiting
- Findings go to inbox immediately (don't defer)
- Handoffs capture what failed, not just what succeeded
