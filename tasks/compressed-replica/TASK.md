# Compact causal coverage without expanding operation histories

The existing implementation passes its legacy contract. Extend it according to the requirements below without changing legacy behavior. Read BASE-CONTRACT.md and the source.

Add mode:'ranges'. Snapshot format becomes {format:2,base:{clock,nodes,dead,covered},log}. covered maps actor to {through,ranges:[[lo,hi],...]}; it represents all positive sequence IDs <=through plus disjoint inclusive ranges above through. Representation must be canonical: merge overlapping/adjacent ranges, absorb a range touching through+1, and sort actors/ranges. Missing sequence IDs are NOT covered. Check membership without expanding ranges, including through values of one billion.

All legacy tree, delivery, tombstone and compaction rules remain the same. Compaction records each resolved prefix operation in range coverage and drops its log payload. Later dependencies may refer to compacted IDs or gaps; gaps must remain pending. Merge accepts legacy snapshots with covered ID arrays as well as format:2 snapshots and normalizes them. Validate range snapshots atomically before replacing a base: through is a nonnegative safe integer; ranges have safe positive integer bounds lo<=hi above through; bad values return INVALID_SNAPSHOT without state changes. Valid but noncanonical ranges are normalized. Unknown snapshot formats are invalid.

Equal-watermark snapshots with equal semantic base state must compare equal despite coverage key/range ordering; conflicting base state still returns CONFLICT. Expose only canonical snapshots; never expand compacted IDs into a list, and never discard the deleted-node graveyard. Legacy mode returns legacy snapshot shapes unchanged.

## Common acceptance criteria

R1 legacy compatibility; R2 normal extension behavior; R3 boundary/composition cases; R4 failure and atomicity; R5 regression scenarios. Each requirement is worth two points (ten total). All cases in R1–R4 must pass for that requirement.

Modify ordinary .mjs files under src/ only, and add regression-scenarios.json. The latter is an array of at most 8 objects {input, assertions:[{path,equals} or {path,equalsPath}]}. Paths are JSON Pointers into the returned result. Each scenario must contain at least one meaningful assertion. The evaluator first validates these scenarios against an independent correct implementation; invalid expectations earn no R5 credit. It then checks whether they detect faulty implementations of the documented legacy/extension behavior. Exact faulty variants are not exposed. Never read source files or infer correctness from log text in a scenario; scenarios are data, not executable tests. Each scenario must finish within five seconds under offline verification. Existing public tests and manifests must not be changed.
