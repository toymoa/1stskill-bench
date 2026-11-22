import { ready, compare } from './order.mjs';
import { project } from './tree.mjs';
export class Replica {
  constructor(actors) {
    this.actors = actors;
    this.base = { clock: 0, nodes: [], dead: [], covered: [] };
    this.log = new Map();
  }
  receive(ops) {
    for (const op of ops) {
      if (op.clock <= this.base.clock) continue;
      const old = this.log.get(op.id);
      if (old && JSON.stringify(old) !== JSON.stringify(op)) throw new Error('CONFLICT');
      this.log.set(op.id, structuredClone(op));
    }
  }
  merge(snapshot) {
    if (snapshot.base.clock > this.base.clock) {
      this.base = structuredClone(snapshot.base);
      for (const [id, op] of this.log) if (op.clock <= this.base.clock) this.log.delete(id);
    } else if (
      snapshot.base.clock === this.base.clock &&
      JSON.stringify(snapshot.base) !== JSON.stringify(this.base)
    )
      throw new Error('CONFLICT');
    this.receive(snapshot.log);
  }
  compact(clock, acks) {
    if (clock < this.base.clock || !this.actors.every((a) => (acks[a] ?? 0) >= clock)) return false;
    const prefix = [...this.log.values()].filter((o) => o.clock <= clock),
      r = ready(prefix, this.base.covered);
    if (r.pending.length) return false;
    const projected = project(this.base, r.ordered);
    this.base = {
      clock,
      ...projected,
      covered: [...new Set([...this.base.covered, ...r.ordered.map((o) => o.id)])].sort(),
    };
    for (const op of prefix) this.log.delete(op.id);
    return true;
  }
  snapshot() {
    return { base: structuredClone(this.base), log: [...this.log.values()].sort(compare) };
  }
  result() {
    const r = ready([...this.log.values()], this.base.covered);
    return { ...project(this.base, r.ordered), pending: r.pending, snapshot: this.snapshot() };
  }
}
