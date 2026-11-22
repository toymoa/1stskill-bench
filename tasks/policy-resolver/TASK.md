# Constraint overrides, security exclusions and minimal update budgets

The existing implementation passes its legacy contract. Extend it according to the requirements below without changing legacy behavior. Read BASE-CONTRACT.md and the source.

Extend the resolver input with overrides mapping 'scope:package' to a version range, blocked mapping package name to forbidden exact versions, and optional maxChanges (nonnegative integer). Override constraints apply only to transitively required assignments; an override alone must not install a package. They intersect, never replace, root/dependency/peer requirements. Peer overrides use the peer's actual resolved scope, including its parent scope.

Blocked versions are globally unavailable, including for optional dependencies and lock reuse. Optional availability is tested against its own range/platform/security exclusions BEFORE overrides; a later override conflict is UNSAT rather than permission to silently omit the dependency. Preserve minimal changed/new lock entries and deterministic legacy tie-breaking. If structurally solvable but the minimal change count exceeds maxChanges, return {error:'BUDGET',minimumChanges:n}, not UNSAT and not a suboptimal plan. Structural UNSAT still produces the legacy inclusion-minimal root conflict list, with overrides/security policy fixed while testing root subsets. The legacy input format continues to work unchanged.

## Common acceptance criteria

R1 legacy compatibility; R2 normal extension behavior; R3 boundary/composition cases; R4 failure and atomicity; R5 regression scenarios. Each requirement is worth two points (ten total). All cases in R1–R4 must pass for that requirement.

Modify ordinary .mjs files under src/ only, and add regression-scenarios.json. The latter is an array of at most 8 objects {input, assertions:[{path,equals} or {path,equalsPath}]}. Paths are JSON Pointers into the returned result. Each scenario must contain at least one meaningful assertion. The evaluator first validates these scenarios against an independent correct implementation; invalid expectations earn no R5 credit. It then checks whether they detect faulty implementations of the documented legacy/extension behavior. Exact faulty variants are not exposed. Never read source files or infer correctness from log text in a scenario; scenarios are data, not executable tests. Each scenario must finish within five seconds under offline verification. Existing public tests and manifests must not be changed.
