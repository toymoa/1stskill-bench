# Tenant isolation through shared caches and pending requests

A batch request returns a different tenant's document after a cache hit. A pending request still succeeds after its user's role is revoked, and share removal does not always take effect. Repair cache identity, authorization and deferred-request handling.

Input users [{id,tenant,role:admin|member|viewer,active}], documents [{id,tenant,owner,shares:[userId],value}], operations. Control operations role(user,role,active) and share(tenant,id,users) are trusted administrative events. User operations begin(request,user,tenant,ids), finish(request), write(user,tenant,id,value). Begin records identity and target; authorization must use CURRENT user/share state at finish. Finish consumes the pending request, preserves ID order/duplicates, returns AUTH if inactive/missing identity, otherwise returns visible {id,tenant,value} rows or null for absent/denied rows.

All active roles may read their own tenant; cross-tenant read requires explicit user-ID share. Only an active same-tenant admin, or member owning the document, may write. Viewer/cross-tenant writes are always DENIED without side effects. Shared-read access never grants writes. Role/share changes apply to pending reads and cached rows. Do not disable legitimate sharing or return deny-all. Preserve response and final document shapes; inputs must not be mutated. Cache entries must be separated by tenant+document ID and invalidated on relevant writes/share changes.

## Submission

Repair the existing implementation in `src/`. Keep the exported `handle(input, services)` interface. Only ordinary `.mjs` files under `src/` may change. Node 24 and, where needed, TypeScript 5.9.3 at `/opt/typescript` are installed offline. Do not change tests, package metadata, entry protocol or runtime configuration. No network access is needed.

Run `npm test` for the public regression. Private checks use different inputs satisfying this same contract, including combined edge cases.
