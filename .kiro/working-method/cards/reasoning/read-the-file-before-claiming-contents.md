## Method Card: Read the File Before Claiming Its Contents

**Type:** reasoning
**Confidence:** medium
**Scope:** project-wide

### Trigger
When about to make a claim about what a file contains, what an API returns, what a component's props are, or what a function does.

### Observed User Move
"Verify before inventing" — repeated corrections where the agent claimed an endpoint existed, a component accepted certain props, or a function returned a specific shape without reading the actual source.

### Underlying Principle
Claims about code must be grounded in reading, not inference. Pattern matching from naming conventions produces plausible but wrong answers. The cost of reading a file is ~2 seconds; the cost of building on a wrong assumption compounds through the entire session.

### Applies When
- About to import a function/component from another file
- About to call an API endpoint
- About to reference a prop/parameter that "should" exist
- About to claim two files share a pattern

### Reasoning
AI agents are trained to infer likely code shapes from names. `PUT /api/admin/inventory/levels/:id` "should" exist because the pattern is common. But if it doesn't exist, the entire downstream implementation breaks. The next agent then rips apart the page to "fix" the failing call. One unverified assumption creates cascading damage.

### Future Agent Behaviour
1. Before importing: `grep` for the export or read the file's exports
2. Before calling an API: read the route file to confirm it exists and accepts the expected shape
3. Before using a component: read its props interface
4. Before claiming shared patterns: read both files
5. If you cannot find it, it does not exist — ask the user or build it explicitly

### Counterbalance
Don't read every transitive dependency. This applies to direct claims about specific files/functions you're about to use. Standard library functions, well-known package APIs, and patterns you've already read in this session don't need re-verification.

### Risk If Overused
Excessive file-reading before trivial operations. Reading `useState`'s types before using it. The bar is: "Am I about to claim something specific about project code?"

### Trigger Questions
- Have I actually read this file in this session?
- Am I inferring this API/prop/function exists from naming patterns?
- What's the cost if I'm wrong?

### Evidence Log
| Date | Session | Reinforced/Contradicted | Notes |
|---|---|---|---|
| 2026-06-25 | methodology-review | Original | From steering voice-and-tone "Verify before inventing" — documented as the #1 source of broken pages |

### Do Not Overapply
Standard library, well-known packages, code you've already read in this session.

### Decay / Review
Stable. Fundamental verification discipline.
