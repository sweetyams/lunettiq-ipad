---
name: audit-diff
description: "Structured code review of recent changes against project steering and conventions"
arguments:
  - name: scope
    description: "What to audit (e.g. 'last-commit', 'staged', 'HEAD~3..HEAD', specific files)"
    required: false
---

Audit the diff{{#scope}} ({{scope}}){{/scope}}{{^scope}} from the last commit{{/scope}}.

## Setup

```bash
{{#scope}}git diff {{scope}} --stat
git diff {{scope}}{{/scope}}{{^scope}}git diff HEAD~1 --stat
git diff HEAD~1{{/scope}}
```

Read the full diff. Review each changed file against the categories below.

## Review Categories

### 1. Steering Compliance
- Does this change follow the project's steering rules?
- Any hardcoded values that should use tokens/variables?
- Any patterns that contradict documented conventions?

### 2. Scope Discipline
- Does every changed line trace to the stated purpose?
- Any "while I'm here" improvements that should be separate commits?
- Any adjacent code changes not required by the task?

### 3. Completeness
- Are all edge cases handled (null, empty, overflow)?
- Are error states handled gracefully?
- If adding a new export/API, is it documented?
- If changing behavior, are tests updated?

### 4. Safety
- Any secrets, tokens, or PII introduced?
- Any destructive operations without confirmation?
- Any removed safety checks or validation?
- Any dependency additions that should be reviewed?

### 5. Performance
- Any obvious N+1 queries or unbounded loops?
- Any large synchronous operations that should be async?
- Any unnecessary re-renders or re-computations?

## Output Format

```markdown
## Audit: {scope}

**Files reviewed:** {count}
**Issues found:** {count}

### Issues
1. [{severity}] {file}:{line} — {description}
   → Fix: {what to do}

### Observations
- {Non-blocking notes, suggestions, questions}

### Verdict
✓ Clean / ⚠️ {N} issues to address
```

## Action

For critical/high issues: fix immediately, re-run verify.
For medium/low: note in findings or fix if quick.
