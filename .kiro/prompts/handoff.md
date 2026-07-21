---
name: handoff
description: "End of session — capture state for the next session to pick up cleanly"
---

Write a handoff file when exiting a session, especially if work is incomplete or context limits are approaching.

## Output File

Create `docs/sessions/YYYY-MM-DD-<short-slug>-handoff.md` with:

```markdown
# Handoff — [Date] — [Topic]

## Goal
What we're working toward.

## Current State
- What's done
- What's in progress
- What's broken (if anything)

## Active Files
Files currently being modified.

## Failed Attempts
What was tried and why it failed (saves next session from repeating).

## Next Step
The single next action to take.
```

## Finding Capture

If an error pattern was discovered during this session, also write a finding to `.kiro/findings/inbox.md`:

```markdown
### [Date] — [Short title]

**Context:** What was happening
**Discovery:** What was learned
**Impact:** Why it matters
**Candidate rule:** What should be enforced going forward
```

Skip the finding if the exit is purely due to context limits (not an error pattern).

## When to Use

- Session ending with incomplete work
- Context window approaching limits
- Switching to a different task/branch
- After discovering something the next session needs to know
