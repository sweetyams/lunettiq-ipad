---
name: investigate
description: "Research existing patterns before building. Finds 2-3 real implementations to use as references."
arguments:
  - name: target
    description: "What you're about to build (e.g. 'API endpoint', 'React component', 'database migration')"
    required: true
  - name: codebase_path
    description: "Where to search for existing patterns (defaults to project root)"
    required: false
---

Investigator scan before building: {{target}}

## Goal

Find 2-3 existing implementations of a similar pattern in this codebase. Document their conventions so the build phase follows real patterns, not invented ones.

## Steps

1. **Search for similar implementations**
   - Use code search / grep / file listing to find 2-3 files that do something similar
   - Prefer the most recent or most complete example
   - Max 3 files — don't over-research

2. **Read each file** and extract:
   - File structure / organization
   - Naming conventions (files, functions, variables, types)
   - Import patterns (what libraries/utilities are used)
   - Error handling approach
   - Testing patterns (if test files exist alongside)

3. **Document findings** as "Patterns to Follow" entries:
   ```
   - {Pattern}: see `{file}:{line}` for reference
   ```

4. **Note deviations** — if examples are inconsistent, note which is more recent or which matches the steering rules better.

## Rules

- Max 3 files read per scan
- Don't copy code — document patterns and reference locations
- If no similar implementation exists, say so (it's valid to be the first)
- Note what works AND what to avoid (anti-patterns in older code)
- Output goes into the task brief's "Patterns to Follow" section

## Output Format

```markdown
## Investigator Scan: {target}

### References Found
1. `{file}` — {what it does, why it's relevant}
2. `{file}` — {what it does, why it's relevant}

### Conventions Observed
- Naming: {pattern}
- Structure: {pattern}
- Imports: {pattern}
- Error handling: {pattern}

### Anti-patterns to Avoid
- {thing found in older code that shouldn't be repeated}
```
