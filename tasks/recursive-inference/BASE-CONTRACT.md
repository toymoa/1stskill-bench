# Polymorphic inference after dependency edits

The IDE loses polymorphism after an edit, an imported type stays stale and an invalid if condition passes checking. Repair inference, generalization and module cache signatures.

This repository specifies a small Hindley–Milner language, not the complete TypeScript language. Expressions are JSON AST nodes: number/boolean (literal value), var(name), lambda(param,body), apply(fn,arg), let(name,value,body), pair(left,right), if(condition,then,else), add(left,right). Each node may carry an integer at for error location. Lambda parameters are monomorphic; let and completed exported bindings generalize type variables not free in the environment. Instantiation must allocate fresh variables. Occurs check rejects infinite types. Add requires numbers; if requires boolean condition and matching branch types. Unknown variables give NAME, invalid unification TYPE, recursive type OCCURS; report the innermost expression whose inference throws, using at or 0.

Modules map ID to {imports:{alias:'module:export'},exports:[{name,expr}]}. Exports are inferred in listed order and may refer to preceding exports. Module dependency cycles are forbidden (CYCLE); missing module/export gives IMPORT. Process roots in lexical order and imports in insertion order. Type names are canonicalized by first occurrence ('a, 'b, ...); functions print (A -> B), pairs [A,B]. Compile initially and after each whole-module replacement/deletion in edits. Incremental interfaces and errors must equal a clean compile at each state. Existing valid modules must remain valid; using any/unknown or suppressing diagnostics is forbidden.

## Submission

Repair the existing implementation in `src/`. Keep the exported `handle(input, services)` interface. Only ordinary `.mjs` files under `src/` may change. Node 24 and, where needed, TypeScript 5.9.3 at `/opt/typescript` are installed offline. Do not change tests, package metadata, entry protocol or runtime configuration. No network access is needed.

Run `npm test` for the public regression. Private checks use different inputs satisfying this same contract, including combined edge cases.
