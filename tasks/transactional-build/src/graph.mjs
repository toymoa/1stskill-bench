export function order(files) {
  const seen = new Set(),
    active = new Set(),
    out = [];
  function visit(id) {
    if (active.has(id)) throw new Error('CYCLE');
    if (seen.has(id)) return;
    if (!files.has(id)) throw new Error('MISSING');
    active.add(id);
    for (const d of files.get(id).deps) visit(d);
    active.delete(id);
    seen.add(id);
    out.push(id);
  }
  for (const id of [...files.keys()].sort()) visit(id);
  return out;
}
