# Simultaneous symbol renames with conflict rollback

The existing implementation passes its legacy contract. Extend it according to the requirements below without changing legacy behavior. Read BASE-CONTRACT.md and the source.

Add operation {type:'renameBatch',renames:[{file,position,newName},...]}. Every position refers to the SAME pre-operation snapshot. Plan all renames simultaneously, so swapping two variable names preserves bindings. Apply all edits atomically. Keep TypeScript prefix/suffix semantics for aliases and shorthand properties. A location planned with conflicting replacement text returns CONFLICT; invalid identifiers return NAME and unrenameable positions SYMBOL.

All fixture inputs for renameBatch compile without errors before the operation. If the final project introduces semantic errors (including duplicate declarations or broken imports), return CONFLICT and preserve every file and script version. Existing single rename/set behavior is unchanged. A successful batch returns {changed:[sorted relative paths]}, and subsequent operations observe the committed snapshot. Empty batches produce an empty changed list. The grader compiles returned sources independently as well as checking protected names/comments and execution-equivalent bindings.

## Common acceptance criteria

R1 legacy compatibility; R2 normal extension behavior; R3 boundary/composition cases; R4 failure and atomicity; R5 regression scenarios. Each requirement is worth two points (ten total). All cases in R1–R4 must pass for that requirement.

Modify ordinary .mjs files under src/ only, and add regression-scenarios.json. The latter is an array of at most 8 objects {input, assertions:[{path,equals} or {path,equalsPath}]}. Paths are JSON Pointers into the returned result. Each scenario must contain at least one meaningful assertion. The evaluator first validates these scenarios against an independent correct implementation; invalid expectations earn no R5 credit. It then checks whether they detect faulty implementations of the documented legacy/extension behavior. Exact faulty variants are not exposed. Never read source files or infer correctness from log text in a scenario; scenarios are data, not executable tests. Each scenario must finish within five seconds under offline verification. Existing public tests and manifests must not be changed.
