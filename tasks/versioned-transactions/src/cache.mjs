export class Cache {
  constructor() {
    this.rows = new Map();
  }
  key(tenant, id) {
    return JSON.stringify([tenant, id]);
  }
  get(tenant, id, fetch) {
    const key = this.key(tenant, id);
    if (!this.rows.has(key)) this.rows.set(key, structuredClone(fetch()));
    return structuredClone(this.rows.get(key));
  }
  invalidate(tenant, id) {
    this.rows.delete(this.key(tenant, id));
  }
}
