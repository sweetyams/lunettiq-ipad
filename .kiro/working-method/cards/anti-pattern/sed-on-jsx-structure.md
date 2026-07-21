## Method Card: Sed/Regex Edits on JSX Corrupt Structure

**Type:** anti-pattern
**Confidence:** high
**Scope:** project-wide

### Trigger
When modifying JSX/TSX files using sed, regex substitution, or line-targeted shell commands to change component usage, add/remove props, or swap tags.

### Observed User Move
"figure this out you keep flip-flopping and fixing one but not the others" — after the 4th time a sed command fixed one JSX element but broke the surrounding structure (mismatched tags, orphaned closing tags, partial replacements).

### Underlying Principle
JSX is a nested tree structure. Sed operates on lines/patterns without understanding nesting depth, tag matching, or JSX expression boundaries. A sed command that matches `</div>` on line 243 cannot know whether that div closes the FilterBar on line 231 or the wrapper on line 229. Each "fix" creates a new structural error elsewhere.

### Applies When
- Swapping one component for another (e.g., `<div>` → `<FilterBar>`, `<select>` → `<Select>`)
- Adding/removing JSX props
- Changing closing tags that match multiple locations
- Any JSX modification where opening and closing tags span multiple lines

### Reasoning
JSX components are matched pairs with arbitrary nesting. Sed sees text lines. The mapping between "the third `</div>` after line 231" and "the close of the FilterBar I just opened" requires tree-aware understanding that regex cannot provide. Each broken edit requires another edit to fix, creating an error cascade.

### Future Agent Behaviour
For JSX modifications:
1. **Write the complete section** as a replacement block rather than individual sed substitutions
2. **For small changes** (single prop, single line): use precise line-numbered sed only when the target is unambiguous
3. **For tag swaps or structural changes**: read the section, write the full corrected version in one pass
4. **Never fix JSX errors with more sed** — if a sed broke structure, rewrite the section, don't patch it

### Counterbalance
For non-JSX files (configs, plain text, simple value changes), sed is perfectly fine. The issue is specifically with nested tree structures where tag matching matters.

### Risk If Overused
Rewriting entire files for trivial one-line changes is wasteful. If the change is truly single-line and unambiguous (e.g., changing a string value), sed is appropriate.

### Trigger Questions
- Does this edit involve opening/closing tag pairs?
- Could the regex pattern match multiple locations in the file?
- Would I need to count nesting depth to know which closing tag to change?

### Evidence
2026-06-03: 4+ instances of sed breaking JSX on the Square page. `</div>` → `</FilterBar>` hit wrong closing tags. `<select>` → `<Select>` left orphaned `</select>`. Each fix attempt created new errors requiring git restore.

### Do Not Overapply
Single-value replacements in JSX (changing a string prop, a className, a variable name) are fine with sed. The danger is structural changes.

### Decay / Review
Stable unless a tree-aware editing tool becomes available.

### Evidence Log
- 2026-06-04: Template literal replacements via node -e broke JSX nesting 3+ times in one session (Activity tabs IIFE, invalid `{condition && ( {jsx}` nesting, Transfer modal blanked by sed). Each time required full section rewrite via heredoc.

### Evidence Log
| Date | Context | Outcome |
|------|---------|---------|
| 2026-06-08 | Batch `// → {/* */}` conversion across 91 admin files using sed | 444 TS errors — `{/* */}` invalid after `return (` and inside `.map(() => (`. Had to revert all files. |
| 2026-06-08 | `awk '!seen[$0]++'` used to deduplicate import lines | Removed structurally necessary duplicate lines (closing tags, repeated patterns). Corrupted 5 configurator files. |
| 2026-06-08 | Agent proposed codemod script for 48 @raw-element comment fixes | User rejected: "I dont know if I trust your mass replace script." Chose file-by-file instead — 0 errors. Prior sed trauma drove the decision. |
| 2026-06-08 | Closing tag `</button>` → `</Button>` missed repeatedly due to multi-line element spans | Every file required 1-3 additional fixes after the initial replacement. Pattern: sed/replace catches opening tag but closing tag is lines away in different context. |

### Graduated
Graduated to `.kiro/steering/git-workflow.md` (JSX/TSX File Editing section) on 2026-06-25.
