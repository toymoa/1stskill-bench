# Crash-safe jobs with fenced leases

A restarted worker applied a payment twice; retries can also silently change an accepted amount. Repair acceptance, leases and completion across the database modules.

Input is `{ops:[...]}`. Operations: accept(id, integer amount), claim(id, owner, integer now, positive ttl), complete(id, owner, fence, now), cancel(id). Values are valid, IDs/owners are nonempty strings. Time is supplied, not wall-clock. New jobs are queued. Repeated same-ID/same-amount accept returns current state; different amount is CONFLICT without changes. Claim of a live lease is BUSY, of done/cancelled is TERMINAL. Expiry is exclusive: at now >= expires a new claim is possible. Each successful claim increments fence. Only the current owner AND fence, before expiry, may complete; otherwise STALE. Done completion is idempotent. Cancel cannot undo done; cancelled jobs never run again. Missing IDs return MISSING. Errors are returned per operation without aborting other operations.

The published SQLite schema and response shape in index.mjs must remain compatible across process restarts. Ledger effect and marking done must be one durable transaction. `complete(crash:'after-effect')` is the test's documented failure injection: kill the process after writing the effect but before marking done. Do not remove that hook; the next process must recover correctly. Verification also calls handle through separate processes sharing /state/state.sqlite.

## Submission

Repair the existing implementation in `src/`. Keep the exported `handle(input, services)` interface. Only ordinary `.mjs` files under `src/` may change. Node 24 and, where needed, TypeScript 5.9.3 at `/opt/typescript` are installed offline. Do not change tests, package metadata, entry protocol or runtime configuration. No network access is needed.

Run `npm test` for the public regression. Private checks use different inputs satisfying this same contract, including combined edge cases.
