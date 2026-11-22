export function order(modules) {
  const out = [],
    seen = new Set(),
    active = new Set();
  function visit(id) {
    if (active.has(id)) throw Object.assign(new Error('CYCLE'), { code: 'CYCLE' });
    if (seen.has(id)) return;
    if (!modules[id]) throw Object.assign(new Error('IMPORT'), { code: 'IMPORT' });
    active.add(id);
    for (const ref of Object.values(modules[id].imports || {})) visit(ref.split(':')[0]);
    active.delete(id);
    seen.add(id);
    out.push(id);
  }
  for (const id of Object.keys(modules).sort()) visit(id);
  return out;
}
export function signature(source, dependencies) {
  return JSON.stringify([source, dependencies]);
}
