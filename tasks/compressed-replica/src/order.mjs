export const compare = (a, b) =>
  a.clock - b.clock || (a.actor < b.actor ? -1 : a.actor > b.actor ? 1 : 0) || a.seq - b.seq;
export function ready(log, covered) {
  const seen = new Set(covered),
    pending = [...log].sort(compare),
    out = [];
  while (true) {
    const index = pending.findIndex((op) => op.deps.every((id) => seen.has(id)));
    if (index < 0) break;
    const [op] = pending.splice(index, 1);
    out.push(op);
    seen.add(op.id);
  }
  return { ordered: out, pending: pending.map((o) => o.id).sort() };
}
