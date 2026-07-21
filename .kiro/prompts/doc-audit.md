---
name: doc-audit
description: "Verify documentation claims against the actual codebase — catch stale docs, dead refs, missing coverage"
arguments:
  - name: scope
    description: "Scope: 'steering', 'readme', 'sessions', 'all' (default: all)"
    required: false
---

Audit documentation accuracy{{#scope}} (scope: {{scope}}){{/scope}}.

## Purpose

Docs drift from reality. This prompt catches: dead file references, incorrect commands, missing screen documentation, and stale steering rules.

## Process

### 1. README Accuracy

Read `README.md` and verify:
- [ ] Listed scripts actually exist and work (`pnpm run` commands)
- [ ] File structure matches reality
- [ ] Tech stack claims are accurate (check package.json)
- [ ] Quick Start commands actually work
- [ ] Phase plan reflects current state

### 2. Steering File Accuracy

For each steering file in `.kiro/steering/`:
- [ ] `fileMatchPattern` actually matches files that exist
- [ ] Referenced component names exist in `src/ui/`
- [ ] Referenced hooks exist in `src/api/` or `src/features/`
- [ ] Referenced store names exist
- [ ] Example code blocks are syntactically valid
- [ ] API endpoints referenced match `#10-foundry-api`

### 3. Screen Inventory Drift

Cross-check `#15-state-machine` screen inventory against actual files:
- [ ] Every screen ID (HOME-01, SES-01, etc.) has a corresponding file in `app/`
- [ ] No orphaned screen files without a spec
- [ ] Navigation map matches Expo Router file structure

### 4. Package.json Scripts

Verify every script in package.json:
```bash
# List all scripts and check they reference real files
cat package.json | jq '.scripts | keys[]'
```

For each script, verify the referenced command/file exists.

### 5. Dead References

Search docs and steering for file paths and verify they exist:
- Component imports referencing non-existent files
- Steering rules about files that were moved/deleted
- API endpoint references that don't match Foundry

### 6. Working Method Currency

Check `.kiro/working-method/`:
- [ ] Cards reference patterns still used in the project
- [ ] Anti-patterns haven't been accidentally re-introduced
- [ ] Known tensions still reflect current tradeoffs

## Report

```markdown
## Doc Audit — {date}

**Scope:** {{scope}}

### Coverage
- Steering files checked: {N}
- Dead references found: {N}
- Scripts verified: {N}/{total}

### Issues
1. [{severity}] {file}: {description}

### Screen Inventory
| Spec ID | Status | File |
|---------|--------|------|
| HOME-01 | ✓ exists | app/(app)/home/index.tsx |
| SES-01 | ✗ missing | — |

### Recommendations
- {actions to take}
```

## Action

- Dead references: fix or remove from docs
- Stale commands: update or remove from README
- Missing screens: note for backlog (don't auto-generate)
- Working method drift: update or archive stale cards
