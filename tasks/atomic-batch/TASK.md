# Atomic completion batches and durable idempotency receipts

The existing implementation passes its legacy contract. Extend it according to the requirements below without changing legacy behavior. Read BASE-CONTRACT.md and the source.

Add completeBatch to the existing operations API. It takes requestId, items:[{id,owner,fence}], now and optional crash. One batch must complete all jobs atomically, including their ledger effects; any invalid item rolls back the entire batch. Accept 1–20 distinct job IDs; empty or repeated IDs return INVALID. Results are sorted by job ID and have shape {requestId,results:[{id,state:'done'}]}.

Persist receipts in SQLite. Replaying the same requestId with the same items (in any order) returns the exact original result, even after lease expiry. A different item/owner/fence set for that requestId returns CONFLICT without writes. now and crash are not part of receipt identity. Existing single-job operations must still work on the same database. Support existing databases created by the legacy code without deleting or rewriting accepted jobs.

crash:'before-receipt' kills the process after effects but before receipt storage; everything in the batch must roll back. crash:'after-commit' kills it after committing the receipt but before returning; a restart/replay must return the committed result without duplicate effects. Keep both documented crash hooks. Nested operations must not accidentally commit an outer transaction.

## Common acceptance criteria

R1 legacy compatibility; R2 normal extension behavior; R3 boundary/composition cases; R4 failure and atomicity; R5 regression scenarios. Each requirement is worth two points (ten total). All cases in R1–R4 must pass for that requirement.

Modify ordinary .mjs files under src/ only, and add regression-scenarios.json. The latter is an array of at most 8 objects {input, assertions:[{path,equals} or {path,equalsPath}]}. Paths are JSON Pointers into the returned result. Each scenario must contain at least one meaningful assertion. The evaluator first validates these scenarios against an independent correct implementation; invalid expectations earn no R5 credit. It then checks whether they detect faulty implementations of the documented legacy/extension behavior. Exact faulty variants are not exposed. Never read source files or infer correctness from log text in a scenario; scenarios are data, not executable tests. Each scenario must finish within five seconds under offline verification. Existing public tests and manifests must not be changed.
