export function edit(files, op) {
  if (op.type === 'delete') {
    files.delete(op.id);
    return;
  }
  if (op.type === 'rename') {
    const file = files.get(op.id);
    if (!file) throw new Error('MISSING');
    if (files.has(op.to)) throw new Error('CONFLICT');
    files.delete(op.id);
    files.set(op.to, { ...file, id: op.to });
    for (const f of files.values()) f.deps = f.deps.map((d) => (d === op.id ? op.to : d));
    return;
  }
  files.set(op.id, { id: op.id, source: op.source, deps: [...op.deps] });
}
