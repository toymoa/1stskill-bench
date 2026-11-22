# Weighted permits with dynamic capacity and inherited cancellation

The existing implementation passes its legacy contract. Extend it according to the requirements below without changing legacy behavior. Read BASE-CONTRACT.md and the source.

Add mode:'weighted', maxLimit and optional task.weight (default 1). limit is the current capacity; maxLimit is the maximum permitted task weight and resize value. A task weight must be an integer from 1 to maxLimit or submission is rejected without creating a task. Existing unweighted mode is unchanged.

A running task reserves weight units. Strict FIFO means a ready head task that cannot fit blocks smaller ready tasks behind it. Add {type:'resize',limit:n}; valid n is integer 0..maxLimit. Shrinking does not cancel running work or revoke existing permits; do not start more work until capacity permits. Emit ['resize',time,n] on success or ['resize',time,'invalid'] on failure. Invalid resize must change nothing. After resize, settle current deadlines/completions and admit ready work immediately.

Cancellation/deadline/final failure/success releases ALL reserved units exactly once. Backoff holds no units; each retry reacquires its original weight with the existing FIFO-ordinal rule. Ancestor deadlines, parent cancellation, retry budgets and shutdown retain legacy semantics. Weighted responses additionally include used (sum of running task weights) and limit; active remains number of running tasks, not units.

## Common acceptance criteria

R1 legacy compatibility; R2 normal extension behavior; R3 boundary/composition cases; R4 failure and atomicity; R5 regression scenarios. Each requirement is worth two points (ten total). All cases in R1–R4 must pass for that requirement.

Modify ordinary .mjs files under src/ only, and add regression-scenarios.json. The latter is an array of at most 8 objects {input, assertions:[{path,equals} or {path,equalsPath}]}. Paths are JSON Pointers into the returned result. Each scenario must contain at least one meaningful assertion. The evaluator first validates these scenarios against an independent correct implementation; invalid expectations earn no R5 credit. It then checks whether they detect faulty implementations of the documented legacy/extension behavior. Exact faulty variants are not exposed. Never read source files or infer correctness from log text in a scenario; scenarios are data, not executable tests. Each scenario must finish within five seconds under offline verification. Existing public tests and manifests must not be changed.
