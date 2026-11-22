# Left-join optimization with SQL NULL semantics

A left-join optimization drops unmatched rows, changes NULL semantics and pushes OR predicates incorrectly. Fix binding/filter extraction, joining and result materialization.

Input left rows, on:[leftColumn,rightColumn], rightColumns, where?, orderBy:[{field,desc?}], offset?, limit?. Private right rows live behind services.scan({keys}); public tests can supply input.right. Scan returns right rows whose join-key equals a requested non-null key, preserving storage order. Call scan at most once per query and only for the distinct non-null keys of left rows that survive safely extracted left-only AND conjuncts. A full scan or additional keys violates the bounded-read contract and is measured outside the candidate process.

All joins are LEFT joins, retaining duplicate matches. NULL or absent values never join. Output field names are l.<column> and r.<column>, with null-filled right columns on unmatched rows. Predicates: eq, ne, gt with a/b literal or {field}; isNull(a); not(arg); and/or(left,right), with SQL three-valued logic. Only true keeps a row. A whole left-only predicate can be pushed; extract additional conjuncts only through AND, never OR/NOT. Missing fields evaluate null. Sort lexicographically by orderBy with null smaller than nonnull before desc inversion; stable original left/right order breaks ties. Apply offset/limit AFTER filtering and ordering. Supported scalar values within a comparison have matching number/string types. Do not implement unspecified SQL grammar.

## Submission

Repair the existing implementation in `src/`. Keep the exported `handle(input, services)` interface. Only ordinary `.mjs` files under `src/` may change. Node 24 and, where needed, TypeScript 5.9.3 at `/opt/typescript` are installed offline. Do not change tests, package metadata, entry protocol or runtime configuration. No network access is needed.

Run `npm test` for the public regression. Private checks use different inputs satisfying this same contract, including combined edge cases.
