---
inclusion: manual
---
# Learnings Review

Reference: "use #98-learnings-review"

Process the findings inbox (`.kiro/findings/inbox.md`). Each finding is either promoted to steering or dismissed.

## Workflow

1. Read `.kiro/findings/inbox.md`
2. For each finding:
   - **Promote** → extract the rule, add to relevant steering file, move finding to `promoted.md`
   - **Dismiss** → move to `dismissed.md` with reason (too specific, already covered, not reproducible)
3. Clear processed findings from inbox

## Finding Format (when adding to inbox)

```markdown
### [Date] — Short title

**Context:** What was happening
**Discovery:** What was learned
**Impact:** Why it matters
**Candidate rule:** What should be enforced going forward
```

## Promotion Criteria

- Happened 2+ times
- Would prevent a bug or wasted time if enforced
- Can be expressed as a clear rule (not just "be careful")
- Specific enough to act on

## Dismissal Reasons

- One-time edge case (not repeatable)
- Already covered by existing steering
- Too vague to be actionable
- Environment-specific (won't recur)
