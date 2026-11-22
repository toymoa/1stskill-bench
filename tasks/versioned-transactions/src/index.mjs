import { Cache } from './cache.mjs';
import { canRead, canWrite } from './policy.mjs';
import { Requests } from './requests.mjs';
export async function handle(input) {
  const users = new Map(input.users.map((u) => [u.id, { ...u }])),
    docs = new Map(
      input.documents.map((d) => [JSON.stringify([d.tenant, d.id]), structuredClone(d)]),
    ),
    cache = new Cache(),
    pending = new Requests(),
    results = [];
  const get = (tenant, id) => docs.get(JSON.stringify([tenant, id]));
  for (const op of input.operations) {
    if (op.type === 'begin') {
      pending.begin(op, users.get(op.user));
      results.push({ request: op.request });
    } else if (op.type === 'finish') {
      const r = pending.finish(op.request, users);
      if (!r.user?.active) {
        results.push({ error: 'AUTH' });
        continue;
      }
      results.push(
        r.ids.map((id) => {
          const d = cache.get(r.tenant, id, () => get(r.tenant, id));
          return canRead(r.user, d) ? { id: d.id, tenant: d.tenant, value: d.value } : null;
        }),
      );
    } else if (op.type === 'role') {
      const u = users.get(op.user);
      Object.assign(u, { role: op.role, active: op.active });
      results.push({ updated: op.user });
    } else if (op.type === 'share') {
      const d = get(op.tenant, op.id);
      d.shares = [...op.users];
      cache.invalidate(op.tenant, op.id);
      results.push({ shared: op.id });
    } else if (op.type === 'write') {
      const d = get(op.tenant, op.id);
      if (!canWrite(users.get(op.user), d)) {
        results.push({ error: 'DENIED' });
        continue;
      }
      d.value = op.value;
      cache.invalidate(op.tenant, op.id);
      results.push({ written: op.id });
    }
  }
  return {
    results,
    documents: [...docs.values()].sort((a, b) =>
      (a.tenant + ':' + a.id).localeCompare(b.tenant + ':' + b.id),
    ),
  };
}
