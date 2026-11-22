# Cancellation, retry budgets and inherited deadlines

A child retry starts after its parent's deadline, while cancelled scopes can still admit descendants. Repair the deterministic scheduling core used by our async runtime.

Input defines limit>0, an acyclic scopes array with {id,parent:null|id,deadline?}, and operations submit(task), advance(to), cancel(scope), shutdown. Time starts at zero and advance is nondecreasing. Tasks have unique id, scope, positive durations per attempt (repeat last duration if exhausted), nonnegative failures (first N attempts fail), positive maxAttempts, nonnegative backoff and optional absolute deadline. Effective deadline is the minimum over task and all ancestor scopes. A cancelled scope remains closed to all descendants even if nothing was queued at cancellation.

At each event time: expire deadlines first (now>=deadline), finish running attempts in submission order, make ready backoffs queued, then start FIFO work up to limit. A retry gets a new FIFO ordinal when it is scheduled. Deadlines include waiting/backoff. A failed attempt retries only if fewer than maxAttempts were started. A release at a time allows queued work to start at that same time. Completion and deadline tie means timed_out, never done. Parent cancellation terminates queued/running/backoff descendants, releases slots and schedules unrelated work immediately. Shutdown cancels all unfinished work; later submissions are rejected without entering tasks. Output trace syntax, terminal states and task summaries are defined in scheduler.mjs. Keep deterministic traces and input immutability; do not consult wall-clock time.

## Submission

Repair the existing implementation in `src/`. Keep the exported `handle(input, services)` interface. Only ordinary `.mjs` files under `src/` may change. Node 24 and, where needed, TypeScript 5.9.3 at `/opt/typescript` are installed offline. Do not change tests, package metadata, entry protocol or runtime configuration. No network access is needed.

Run `npm test` for the public regression. Private checks use different inputs satisfying this same contract, including combined edge cases.
