# Versioned atomic document writes with authorization-safe replay

The existing implementation passes its legacy contract. Extend it according to the requirements below without changing legacy behavior. Read BASE-CONTRACT.md and the source.

Add mode:'transactions'. Each document gains version (default 0), and visible read rows include version. A successful legacy single write in this mode increments version exactly once. Legacy mode is unchanged.

New operation transaction:{user,requestId,writes:[{tenant,id,expectedVersion,value}]} must authorize and validate ALL writes before changing any document/cache. Accept 1–20 distinct (tenant,id) pairs and a nonempty requestId, otherwise INVALID. Inactive/missing user gives AUTH; missing/inaccessible document gives DENIED; mismatched current version gives STALE. On success update all values, increment each version once, invalidate caches and return {requestId,versions:[{tenant,id,version}]} in tenant/id lexical order.

Receipts are scoped by (user,requestId). Replaying an identical write set in any order returns the stored result without reapplying or checking old expectedVersions, but CURRENT active status and write permissions must still allow every target. Different payload under the same receipt gives CONFLICT. JSON object key order in values must not change payload identity. Add trusted control operation transfer(tenant,id,owner), which updates ownership and invalidates cache. Pending reads and replayed transactions must obey role/share/ownership changes. A failed transaction must not partially change values, versions, cache contents or receipts.

## Common acceptance criteria

R1 legacy compatibility; R2 normal extension behavior; R3 boundary/composition cases; R4 failure and atomicity; R5 regression scenarios. Each requirement is worth two points (ten total). All cases in R1–R4 must pass for that requirement.

Modify ordinary .mjs files under src/ only, and add regression-scenarios.json. The latter is an array of at most 8 objects {input, assertions:[{path,equals} or {path,equalsPath}]}. Paths are JSON Pointers into the returned result. Each scenario must contain at least one meaningful assertion. The evaluator first validates these scenarios against an independent correct implementation; invalid expectations earn no R5 credit. It then checks whether they detect faulty implementations of the documented legacy/extension behavior. Exact faulty variants are not exposed. Never read source files or infer correctness from log text in a scenario; scenarios are data, not executable tests. Each scenario must finish within five seconds under offline verification. Existing public tests and manifests must not be changed.
