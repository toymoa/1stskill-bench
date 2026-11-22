# Replica convergence and causally stable compaction

Replica delivery order changes a tree after concurrent moves/deletes, and compaction can resurrect removed nodes. Repair ordering, deletion memory and snapshot stability.

Actors are fixed strings. Each valid operation has id='actor:seq', actor, positive seq, positive integer clock, deps:[operation IDs], type insert/move/delete, node and (for insert/move) parent:null|node; insert also has value. Causal predecessors always have smaller clocks; absent predecessors remain buffered. Order all currently ready operations by clock, actor code-point order, then seq. Recompute from the stable base when new operations arrive, so delivery order cannot become conflict order. Duplicate identical IDs are idempotent; conflicting retained IDs give CONFLICT. Only valid snapshots produced by this contract are merged.

Insert into an absent parent, duplicate node or tombstoned ID has no effect. Move requires live node and parent (or null), cannot create cycles, and does not revive deleted nodes. Delete removes the current subtree and permanently tombstones those IDs; deleting an absent node still tombstones that ID. This published total-order operation algebra determines concurrent conflict outcomes; do not invent last-arrival rules.

Commands: receive(ops), merge(snapshot), compact(clock,acks), snapshot. Compaction is allowed only if EVERY registered actor acknowledges at least clock, no lower/equal-clock operation has unresolved dependencies, and clock does not decrease. It folds that prefix into base nodes/dead/covered, removes prefix log records, and advances the watermark. Later events at/below the stable watermark are ignored; future valid new operations have larger clocks. Covered IDs satisfy later dependencies. The graveyard and compacted dependency IDs are retained, not forgotten for space savings. Higher-watermark snapshots replace the base then merge later log operations; equal-watermark incompatible bases give CONFLICT. Return exact canonical state, pending IDs and snapshot as defined by Replica.result().

## Submission

Repair the existing implementation in `src/`. Keep the exported `handle(input, services)` interface. Only ordinary `.mjs` files under `src/` may change. Node 24 and, where needed, TypeScript 5.9.3 at `/opt/typescript` are installed offline. Do not change tests, package metadata, entry protocol or runtime configuration. No network access is needed.

Run `npm test` for the public regression. Private checks use different inputs satisfying this same contract, including combined edge cases.
