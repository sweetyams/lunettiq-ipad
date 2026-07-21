---
inclusion: auto
foundry-method: universal
version: "2026.07.1"
---

# Git Workflow

## Commit Format

Conventional Commits, validated by hooks:

```
type(scope): subject
```

- **Types:** `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `ci`, `style`, `build`
- **Scopes:** project-defined (e.g. `ui`, `api`, `sections`, `auth`, `build`)
- **Subject:** imperative mood, ≥3 chars

## Safety — HARD RULES

### Banned operations (unconditionally)

| Command | Why | Do instead |
|---------|-----|-----------|
| `git stash` | Silently hides work — easily lost | Commit first (`git commit -m "wip: ..."`) |
| `git reset --hard` | Destroys uncommitted changes | Commit, then `git revert` |
| `git checkout -- .` | Discards all modifications | Only on specific files intentionally |
| `git clean -f` | Deletes untracked files permanently | Never |

### Before any tree-modifying command

```bash
git status --porcelain
```

If output is non-empty and files aren't yours: STOP, report, ask user.

### Prefer specific staging

```bash
# ✅ Stage specific files
git add src/feature.ts src/feature.test.ts

# ❌ Risky — captures everything
git add .
```

## Verification

- Run the project's verify command after changes, before presenting as done
- Every change must include proof it works: test output, screenshot, or terminal log
