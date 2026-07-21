---
name: fresh-eyes
description: "Pre-ship review: catches convention drift, performance waste, a11y gaps, and anti-patterns"
arguments:
  - name: scope
    description: "What to review (e.g. 'staged', 'last commit', specific files). Defaults to staged changes."
    required: false
---

Pre-ship review of changed files{{#scope}} ({{scope}}){{/scope}}.

## Setup

```bash
{{#scope}}git diff --name-only {{scope}}{{/scope}}{{^scope}}git diff --cached --name-only || git diff --name-only HEAD~1{{/scope}}
```

Read each changed file in full. Review against all 5 categories below.

## Category 1 — Design System Compliance

- [ ] All values use project tokens/variables — no hardcoded colors, sizes, spacing
- [ ] Naming follows project conventions (check steering for patterns)
- [ ] No bypassing the component/snippet system for patterns that have one

## Category 2 — Performance

- [ ] No unnecessary re-renders, re-fetches, or redundant computation
- [ ] Images/assets optimized (lazy loading, proper sizes)
- [ ] No unbounded loops or queries without limits
- [ ] JS bundle impact considered

## Category 3 — Accessibility

- [ ] Interactive elements keyboard-accessible
- [ ] ARIA attributes on dynamic components
- [ ] Images have meaningful alt (or empty alt for decorative)
- [ ] Focus management correct for modals/drawers
- [ ] Color contrast meets WCAG AA

## Category 4 — Code Patterns

- [ ] Matches project conventions (naming, structure, imports)
- [ ] Error states handled
- [ ] Edge cases considered (empty, overflow, null)
- [ ] No dead code or unused imports
- [ ] Types are specific (no `any` without justification)

## Category 5 — Safety

- [ ] No secrets, tokens, or PII in code
- [ ] No destructive operations without confirmation
- [ ] Input validation on user-facing data
- [ ] No console.log left in production paths

## Action

For each issue found:
1. Fix it immediately (if within scope)
2. Run the project's verify command

## Report

```
Fresh-eyes complete. {N} issues found and fixed.
Files reviewed: {list}
Verify passing: ✓/✗
```
