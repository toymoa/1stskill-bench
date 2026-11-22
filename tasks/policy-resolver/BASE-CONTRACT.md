# Workspace dependency and peer resolution

An incremental lockfile update chose incompatible peers and ignored a platform-specific optional package. Repair range semantics, catalog filtering and complete resolution.

Input: catalog maps package names to version objects {version,dependencies?,optional?,peers?,platforms?}; scopes [{id,parent:null|id,dependencies:{name:range}}]; platform string; lock maps 'scope:package' to version. IDs/names contain no colon or @. Versions are nonnegative major.minor.patch, with no prereleases. Ranges are *, exact, >=x.y.z or ^x.y.z; caret 0.minor.patch freezes minor, ^0.0.patch is exact. Dependencies resolve in the same scope; peers resolve in the immediate parent scope (or same scope at root). This is a documented contextual workspace resolver, not npm's complete algorithm. Multiple versions across scopes are allowed; one version per name within a scope. Cycles are permitted if all constraints can be satisfied.

An optional dependency is omitted only when no platform-compatible catalog version satisfies its own range; otherwise it is required and may conflict with other constraints. Only transitively required assignments appear in the plan. Choose a satisfying plan minimizing changed/new required lock entries; old unused lock entries are ignored. Ties compare sorted union keys: absence preferred over presence, then highest semantic version at the first differing common key. If unsatisfiable, return UNSAT with an inclusion-minimal root requirement conflict set. Deterministically start with sorted roots and remove each root in that order whenever the remaining subset is still unsatisfiable. Do not return a generic conflict string or silently drop a required edge.

## Submission

Repair the existing implementation in `src/`. Keep the exported `handle(input, services)` interface. Only ordinary `.mjs` files under `src/` may change. Node 24 and, where needed, TypeScript 5.9.3 at `/opt/typescript` are installed offline. Do not change tests, package metadata, entry protocol or runtime configuration. No network access is needed.

Run `npm test` for the public regression. Private checks use different inputs satisfying this same contract, including combined edge cases.
