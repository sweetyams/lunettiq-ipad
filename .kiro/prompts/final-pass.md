---
name: final-pass
description: "End-of-session wrap-up: verify, changelog, commit, and exit cleanly"
---

Final pass before closing this session.

## Checklist

### 1. Verify
```bash
npm run verify
```
Must pass clean. If it fails, fix before proceeding.

### 2. Changelog
Update `CHANGELOG.md` with what was accomplished this session:
```markdown
## YYYY-MM-DD — {Session Title}

### {Category}
- {What changed}
- {What it affects}
```

### 3. Commit
Stage and commit with a meaningful message:
```bash
git add <specific files>
git commit -m "type(scope): description"
```

### 4. Findings Check
If anything was discovered during this session that should become a rule:
- Write to `.kiro/findings/inbox.md`
- Format: title, context, discovery, impact, candidate rule

### 5. Handoff (if work is incomplete)
If work continues in a future session, write a handoff:
- `docs/sessions/YYYY-MM-DD-{slug}-handoff.md`
- Include: goal, current state, active files, next step

### 6. Exit
Report:
```
Session complete.
- Verify: ✓/✗
- Committed: {hash} {message}
- Findings: {N} captured / 0
- Handoff: written / not needed
```
