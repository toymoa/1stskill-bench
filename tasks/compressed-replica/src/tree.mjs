export function project(base, ops) {
  const nodes = new Map(base.nodes.map((n) => [n.id, { ...n }])),
    dead = new Set(base.dead);
  for (const op of ops) {
    if (op.type === 'insert') {
      if (nodes.has(op.node) || dead.has(op.node) || (op.parent !== null && !nodes.has(op.parent)))
        continue;
      nodes.set(op.node, { id: op.node, parent: op.parent, value: op.value });
    } else if (op.type === 'move') {
      if (!nodes.has(op.node) || dead.has(op.node) || (op.parent !== null && !nodes.has(op.parent)))
        continue;
      let p = op.parent,
        cycle = false;
      while (p !== null) {
        if (p === op.node) {
          cycle = true;
          break;
        }
        p = nodes.get(p)?.parent ?? null;
      }
      if (!cycle) nodes.get(op.node).parent = op.parent;
    } else if (op.type === 'delete') {
      const remove = new Set([op.node]);
      let changed = true;
      while (changed) {
        changed = false;
        for (const n of nodes.values())
          if (remove.has(n.parent) && !remove.has(n.id)) {
            remove.add(n.id);
            changed = true;
          }
      }
      for (const id of remove) {
        nodes.delete(id);
        dead.add(id);
      }
    }
  }
  return {
    nodes: [...nodes.values()].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)),
    dead: [...dead].sort(),
  };
}
