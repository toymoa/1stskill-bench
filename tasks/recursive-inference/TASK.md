# Mutually recursive bindings and polymorphic list inference

The existing implementation passes its legacy contract. Extend it according to the requirements below without changing legacy behavior. Read BASE-CONTRACT.md and the source.

Extend the existing AST with nil, cons(head,tail), matchList(list,empty,head,tail,nonempty), and letrec(bindings,body). In matchList, head and tail are binding names for the nonempty branch; empty and nonempty branch types must unify. nil is polymorphic List<'a>; cons requires a head of T and tail of List<T>. Lists print as List<T> while all old type strings remain identical.

letrec.bindings is a nonempty array of distinct {name,expr}; each expr must be a lambda or report RECURSION at the letrec node. Allocate monomorphic placeholders for ALL bindings before inferring any RHS, so mutual recursion works but polymorphic recursion within the group is rejected. Unify every RHS against its placeholder, then generalize the completed bindings against the OUTER environment before inferring body. Never generalize variables captured by outer lambda parameters. Keep occurs checks and precise innermost error locations. Duplicate/empty/non-function recursive groups return RECURSION without corrupting subsequent exported definitions.

Imported/cached interfaces containing list and recursive function types must instantiate fresh variables and produce the same result after an edit as a clean compile. Legacy inputs remain accepted unchanged. Do not introduce any/unknown fallback types.

## Common acceptance criteria

R1 legacy compatibility; R2 normal extension behavior; R3 boundary/composition cases; R4 failure and atomicity; R5 regression scenarios. Each requirement is worth two points (ten total). All cases in R1–R4 must pass for that requirement.

Modify ordinary .mjs files under src/ only, and add regression-scenarios.json. The latter is an array of at most 8 objects {input, assertions:[{path,equals} or {path,equalsPath}]}. Paths are JSON Pointers into the returned result. Each scenario must contain at least one meaningful assertion. The evaluator first validates these scenarios against an independent correct implementation; invalid expectations earn no R5 credit. It then checks whether they detect faulty implementations of the documented legacy/extension behavior. Exact faulty variants are not exposed. Never read source files or infer correctness from log text in a scenario; scenarios are data, not executable tests. Each scenario must finish within five seconds under offline verification. Existing public tests and manifests must not be changed.
