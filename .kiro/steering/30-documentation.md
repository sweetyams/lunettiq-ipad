---
inclusion: fileMatch
fileMatchPattern: "docs/**"
foundry-method: universal
version: "2026.07.1"
description: Documentation standards — structure, style, and maintenance rules.
---

# Documentation Standards

## Principle

Documentation is a first-class artifact. Outdated docs are worse than no docs.

## Rules

1. **Update docs when you change behavior.** New feature → update relevant doc. New command → update README.
2. **One topic per file.** Don't combine unrelated concepts.
3. **Lead with the answer.** Commands, examples, decisions first. Background goes below.
4. **Use tables for reference data.** Settings, commands, mappings — tables over prose.
5. **Code examples must be runnable.** If it's in a code block, it should work.
6. **Keep README.md as the map.** It links to everything. Update it when adding new docs.

## Style

- `#` for title, `##` for sections, `###` for subsections. No deeper.
- Short paragraphs, active voice, present tense.
- Commands in fenced code blocks with language hint.
- File paths in backticks, relative to project root.

## Anti-patterns

- ❌ Documenting implementation details that change frequently
- ❌ Duplicating information that lives in steering rules
- ❌ Writing docs without verifying examples still work
- ❌ Leaving placeholder docs ("TODO: fill this in")
