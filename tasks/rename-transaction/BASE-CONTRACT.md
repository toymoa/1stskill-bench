# Symbol identity across TypeScript packages

The rename command changed a local spelling but missed imports and re-exports, and a second rename used stale offsets. Repair project snapshots, edit planning and application.

Input: files mapping relative .ts paths to text; operations are {type:'rename',file,position,newName} or {type:'set',file,text}. position is a UTF-16 offset into the CURRENT file. Use the supplied pinned TypeScript language service; do not replace symbol identity with spelling matching. Supported projects use relative ES imports, named exports/re-exports, aliases, functions, objects, classes, generics and lexical shadowing. Files have no external dependencies. Preserve comments, strings, unrelated bindings and API names that TypeScript's prefix/suffix rename semantics preserve (including import aliases and shorthand properties). The service is configured with strict ES2022/Bundler semantics.

All locations for one rename must be planned from a single snapshot and applied without offset drift, then invalidate every edited file before the next operation. Return unchanged text outside planned edits, files and sorted changed-file lists. Invalid names give NAME, unrenameable locations SYMBOL; all fixture rename names are non-keyword identifiers. Replacement must be atomic if planning fails. Do not report type diagnostics as score; the external verifier checks the returned source itself.

## Submission

Repair the existing implementation in `src/`. Keep the exported `handle(input, services)` interface. Only ordinary `.mjs` files under `src/` may change. Node 24 and, where needed, TypeScript 5.9.3 at `/opt/typescript` are installed offline. Do not change tests, package metadata, entry protocol or runtime configuration. No network access is needed.

Run `npm test` for the public regression. Private checks use different inputs satisfying this same contract, including combined edge cases.
