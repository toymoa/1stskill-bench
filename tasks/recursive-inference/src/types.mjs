export class Types {
  constructor() {
    this.next = 0;
    this.sub = new Map();
  }
  fresh() {
    return { tag: 'var', id: this.next++ };
  }
  apply(t) {
    if (typeof t === 'string') return t;
    if (t.tag === 'var') return this.sub.has(t.id) ? this.apply(this.sub.get(t.id)) : t;
    return { ...t, a: this.apply(t.a), b: this.apply(t.b) };
  }
  free(t, out = new Set()) {
    t = this.apply(t);
    if (typeof t === 'string') return out;
    if (t.tag === 'var') out.add(t.id);
    else {
      this.free(t.a, out);
      this.free(t.b, out);
    }
    return out;
  }
  unify(a, b) {
    a = this.apply(a);
    b = this.apply(b);
    if (typeof a === 'object' && a.tag === 'var') {
      if (typeof b === 'object' && b.tag === 'var' && a.id === b.id) return;
      if (this.free(b).has(a.id)) throw Object.assign(new Error('OCCURS'), { code: 'OCCURS' });
      this.sub.set(a.id, b);
      return;
    }
    if (typeof b === 'object' && b.tag === 'var') return this.unify(b, a);
    if (typeof a === 'string' || typeof b === 'string') {
      if (a !== b) throw Object.assign(new Error('TYPE'), { code: 'TYPE' });
      return;
    }
    if (a.tag !== b.tag) throw Object.assign(new Error('TYPE'), { code: 'TYPE' });
    this.unify(a.a, b.a);
    this.unify(a.b, b.b);
  }
  instantiate(s) {
    const vars = new Map(s.vars.map((id) => [id, this.fresh()]));
    const copy = (t) =>
      typeof t === 'string'
        ? t
        : t.tag === 'var'
          ? vars.get(t.id) || t
          : { ...t, a: copy(t.a), b: copy(t.b) };
    return copy(s.type);
  }
  generalize(env, type) {
    type = this.apply(type);
    const free = new Set();
    for (const s of env.values())
      for (const id of this.free(s.type)) if (!s.vars.includes(id)) free.add(id);
    return { type, vars: [...this.free(type)].filter((id) => !free.has(id)) };
  }
  print(t) {
    const names = new Map();
    const out = (t) => {
      t = this.apply(t);
      if (typeof t === 'string') return t;
      if (t.tag === 'var') {
        if (!names.has(t.id)) names.set(t.id, "'" + String.fromCharCode(97 + names.size));
        return names.get(t.id);
      }
      return t.tag === 'fn'
        ? '(' + out(t.a) + ' -> ' + out(t.b) + ')'
        : '[' + out(t.a) + ',' + out(t.b) + ']';
    };
    return out(t);
  }
}
