---
name: fit-and-finish
description: "Final polish pass — catches inconsistencies, incomplete edges, and documentation gaps"
arguments:
  - name: scope
    description: "What to polish (feature name, file paths, or 'all'). Defaults to recent changes."
    required: false
---

Final polish pass{{#scope}} for {{scope}}{{/scope}}.

## Checklist

### Consistency
- [ ] Naming is consistent across all new/changed code
- [ ] Patterns match existing codebase (don't introduce new conventions)
- [ ] Error messages follow project style
- [ ] Comments are accurate (not stale from refactoring)

### Completeness
- [ ] All edge cases handled (empty states, overflow, null/undefined)
- [ ] Error states have user-facing feedback
- [ ] Loading states exist where async operations happen
- [ ] Feature works at all supported viewport sizes / devices

### Documentation
- [ ] README/docs updated if behavior changed
- [ ] New exports/APIs documented
- [ ] CHANGELOG entry written (if meaningful change)
- [ ] Inline comments on non-obvious logic

### Tests
- [ ] New code has test coverage
- [ ] Tests actually assert meaningful behavior (not just "doesn't throw")
- [ ] Edge cases have specific test cases

### Verify
- [ ] `npm run verify` passes clean
- [ ] No warnings or suppressions added
- [ ] All TODO comments either resolved or tracked

## Action

Fix each item found. Run verify after all fixes. Report summary.
