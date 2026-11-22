export function ancestry(scopes, id) {
  const out = [];
  while (id !== null && id !== undefined) {
    const s = scopes.get(id);
    if (!s) throw new Error('SCOPE');
    out.push(s);
    id = s.parent;
  }
  return out;
}
export function deadline(scopes, id, own) {
  return Math.min(own ?? Infinity, ...ancestry(scopes, id).map((s) => s.deadline ?? Infinity));
}
export function belongs(scopes, id, parent) {
  return ancestry(scopes, id).some((s) => s.id === parent);
}
