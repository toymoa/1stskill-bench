export class Requests {
  constructor() {
    this.pending = new Map();
  }
  begin(op, user) {
    this.pending.set(op.request, { userId: user?.id, tenant: op.tenant, ids: [...op.ids] });
  }
  finish(id, users) {
    const r = this.pending.get(id);
    if (!r) throw new Error('REQUEST');
    this.pending.delete(id);
    return { ...r, user: users.get(r.userId) };
  }
}
