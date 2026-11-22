# Dependency-sensitive incremental builds

A workspace rename followed by a dependency edit leaves stale artifacts. Repair graph validation, workspace mutations and cache reuse.

Input: files [{id,source,deps:[id...]}], edits [{type:'set',id,source,deps},{type:'delete',id},{type:'rename',id,to}]. Files have unique IDs; rename targets do not exist. Build initially and after each edit. Rename rewrites every dependency edge to the new ID; delete does not remove references. Every graph must be validated BEFORE any compilation: missing edges produce {error:'MISSING'}, cycles {error:'CYCLE'}. Graphs that have both need not be supplied. A later edit may repair an invalid graph.

Visit roots lexicographically and dependencies in listed order, compiling dependencies first. A cached artifact may be reused only for the same ID, identical source and dependency ID order and identical dependency tokens. Deletion evicts its cache entry even during an invalid build. Renames do not transfer identity cache entries. Changes that revert may reuse only the last successful artifact per ID, not arbitrary historical artifacts. Return one build result containing artifacts by ID and compiled IDs in execution order.

services.compile({step,id,source,deps:tokens}) is an external compiler: output is opaque and must not be synthesized. It is available through the immutable entry protocol during grading. The private controller counts real calls and rejects requests that do not match the graph at that step. Correct cache reuse, not just matching returned outputs, is required.

## Submission

Repair the existing implementation in `src/`. Keep the exported `handle(input, services)` interface. Only ordinary `.mjs` files under `src/` may change. Node 24 and, where needed, TypeScript 5.9.3 at `/opt/typescript` are installed offline. Do not change tests, package metadata, entry protocol or runtime configuration. No network access is needed.

Run `npm test` for the public regression. Private checks use different inputs satisfying this same contract, including combined edge cases.
