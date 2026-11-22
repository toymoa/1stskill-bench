import { candidates } from './catalog.mjs';
import { compare, satisfies } from './ranges.mjs';
export function solve(input, roots) {
  const scopes = new Map(input.scopes.map((s) => [s.id, s])),
    constraints = new Map();
  for (const r of roots) {
    const key = r.scope + ':' + r.name;
    constraints.set(key, [...(constraints.get(key) || []), r.range]);
  }
  let best = null;
  function visit(assigned, needs) {
    for (const [key, p] of assigned)
      if (!(needs.get(key) || []).every((r) => satisfies(p.version, r))) return;
    const key = [...needs.keys()].sort().find((k) => !assigned.has(k));
    if (!key) {
      const plan = Object.fromEntries(
          [...assigned].sort(([a], [b]) => a.localeCompare(b)).map(([k, p]) => [k, p.version]),
        ),
        changed = Object.entries(plan).filter(([k, v]) => input.lock?.[k] !== v).length;
      if (!best || changed < best.changed || (changed === best.changed && better(plan, best.plan)))
        best = { plan, changed };
      return;
    }
    const [scope, name] = key.split(':');
    for (const pkg of candidates(input.catalog, name, needs.get(key), input.platform)) {
      const next = new Map([...needs].map(([k, v]) => [k, [...v]])),
        put = (s, n, r) => {
          const k = s + ':' + n;
          next.set(k, [...(next.get(k) || []), r]);
        };
      for (const [n, r] of Object.entries(pkg.dependencies || {})) put(scope, n, r);
      for (const [n, r] of Object.entries(pkg.optional || {}))
        if (candidates(input.catalog, n, [r], input.platform).length) put(scope, n, r);
      for (const [n, r] of Object.entries(pkg.peers || {}))
        put(scopes.get(scope).parent || scope, n, r);
      const chosen = new Map(assigned);
      chosen.set(key, pkg);
      visit(chosen, next);
    }
  }
  visit(new Map(), constraints);
  return best;
}
function better(a, b) {
  const keys = [...new Set([...Object.keys(a), ...Object.keys(b)])].sort();
  for (const k of keys) {
    if (!(k in a)) return true;
    if (!(k in b)) return false;
    const c = compare(a[k], b[k]);
    if (c) return c > 0;
  }
  return false;
}
export function rootsOf(input) {
  return input.scopes
    .flatMap((s) =>
      Object.entries(s.dependencies).map(([name, range]) => ({ scope: s.id, name, range })),
    )
    .sort((a, b) => (a.scope + ':' + a.name).localeCompare(b.scope + ':' + b.name));
}
