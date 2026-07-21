# Quality Checklist Template

Every deliverable type should have a quality checklist capturing its most common failures. Use this template to create one for your project's primary deliverables.

## How to Create a Checklist

1. Identify your deliverable types (components, screens, API endpoints, pages, sections)
2. After building 3-5 of them, note the recurring failures from review/QA
3. Write them as a checklist (most common first)
4. Save as a conditional steering file (fileMatch on the deliverable's directory)

## Template

```yaml
---
inclusion: fileMatch
fileMatchPattern: "{path/to/deliverables}/**"
foundry-method: project
---
```

```markdown
# {Deliverable Type} Quality Checklist

Every {deliverable} must pass this checklist before completion.

## Common Failures (ordered by frequency)

### 1. {Most common failure}
❌ What agents produce:
✅ What it should be:
**Rule:** {One-line enforceable rule}

### 2. {Second most common failure}
❌ What agents produce:
✅ What it should be:
**Rule:** {One-line enforceable rule}

### 3. {Third most common failure}
...

## Quick Reference Table
| Dimension | Requirement | Source |
|---|---|---|
| {Aspect} | {Specific rule} | {Steering file #} |

## Exit Criteria
- [ ] All automated checks pass (verify command)
- [ ] All items in this checklist verified
- [ ] No regressions introduced
```

## Examples by Stack

| Stack | Deliverable | Key checklist items |
|---|---|---|
| Shopify | Section | Token usage, color scheme, aria-label, content editability, responsive |
| React Native | Screen | Navigation params, offline state, loading skeleton, accessibility labels |
| Next.js | Page | SSR/SSG choice, meta tags, loading.tsx, error.tsx, mobile viewport |
| iOS Swift | View | Preview provider, VoiceOver, dark mode, Dynamic Type, safe area |
