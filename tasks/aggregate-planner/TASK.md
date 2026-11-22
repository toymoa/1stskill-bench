# Grouped aggregation over nullable outer joins

The existing implementation passes its legacy contract. Extend it according to the requirements below without changing legacy behavior. Read BASE-CONTRACT.md and the source.

Add optional aggregate:{keys:[field...],values:[{as,op,field?,distinct?}],having?}. It operates AFTER the legacy join/where and BEFORE orderBy/offset/limit. Group keys appear in output as g.<original-field>; aggregate aliases appear as a.<as>. Missing/null group values belong to the same null group; numbers and strings remain distinct. Groups retain first-seen order unless orderBy changes it.

Supported operations: count with field omitted counts rows; count(field) ignores null; sum/min/max require a field and ignore null. count returns 0 for no qualifying values; sum/min/max return null. distinct deduplicates non-null values before aggregate calculation. count(*) with distinct is invalid. With keys:[] an empty input produces one aggregate row; with nonempty keys it produces no rows. having uses the same three-valued predicate language on grouped output and keeps only true. Never push having into pre-join filtering.

Aliases must match [A-Za-z_][A-Za-z0-9_]* and be unique. Unknown operations, duplicate aliases, absent fields for sum/min/max, and distinct count(*) return {error:'AGGREGATE'} BEFORE any scan request. The source query contract and bounded-scan behavior remain unchanged. Legacy queries without aggregate still return identical rows.

## Common acceptance criteria

R1 legacy compatibility; R2 normal extension behavior; R3 boundary/composition cases; R4 failure and atomicity; R5 regression scenarios. Each requirement is worth two points (ten total). All cases in R1–R4 must pass for that requirement.

Modify ordinary .mjs files under src/ only, and add regression-scenarios.json. The latter is an array of at most 8 objects {input, assertions:[{path,equals} or {path,equalsPath}]}. Paths are JSON Pointers into the returned result. Each scenario must contain at least one meaningful assertion. The evaluator first validates these scenarios against an independent correct implementation; invalid expectations earn no R5 credit. It then checks whether they detect faulty implementations of the documented legacy/extension behavior. Exact faulty variants are not exposed. Never read source files or infer correctness from log text in a scenario; scenarios are data, not executable tests. Each scenario must finish within five seconds under offline verification. Existing public tests and manifests must not be changed.
