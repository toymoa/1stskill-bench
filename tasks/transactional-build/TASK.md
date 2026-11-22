# Transactional workspace changes with incremental reuse

The existing implementation passes its legacy contract. Extend it according to the requirements below without changing legacy behavior. Read BASE-CONTRACT.md and the source.

Extend edits with {type:'batch',changes:[legacy set/delete/rename operations]}. A batch yields exactly one build result. Apply changes to a temporary graph, validate the final graph, then commit all changes together. Intermediate states may be invalid. Final missing dependencies produce MISSING, cycles CYCLE and rename conflicts CONFLICT; a rejected batch leaves the prior files AND cache unchanged and performs no compiler calls. A later edit must continue from the last committed state.

A successful batch uses the original cache against its FINAL graph. Transient delete/recreate or rename-away/rename-back must not evict artifacts if final identity, source, dependency IDs and dependency tokens are unchanged. A rejected batch is represented by one {error:...} result; do not also emit a build of the unchanged graph. Existing non-batch edits retain their legacy semantics. Compiler requests still follow validated dependency order and must be genuinely counted outside the implementation.

## Common acceptance criteria

R1 legacy compatibility; R2 normal extension behavior; R3 boundary/composition cases; R4 failure and atomicity; R5 regression scenarios. Each requirement is worth two points (ten total). All cases in R1–R4 must pass for that requirement.

Modify ordinary .mjs files under src/ only, and add regression-scenarios.json. The latter is an array of at most 8 objects {input, assertions:[{path,equals} or {path,equalsPath}]}. Paths are JSON Pointers into the returned result. Each scenario must contain at least one meaningful assertion. The evaluator first validates these scenarios against an independent correct implementation; invalid expectations earn no R5 credit. It then checks whether they detect faulty implementations of the documented legacy/extension behavior. Exact faulty variants are not exposed. Never read source files or infer correctness from log text in a scenario; scenarios are data, not executable tests. Each scenario must finish within five seconds under offline verification. Existing public tests and manifests must not be changed.
