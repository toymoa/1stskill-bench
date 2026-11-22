export function cacheKey(file, deps) {
  return JSON.stringify([file.source, file.deps, deps]);
}
export class Cache {
  constructor() {
    this.entries = new Map();
  }
  get(id, key) {
    const v = this.entries.get(id);
    return v?.key === key ? v.token : null;
  }
  set(id, key, token) {
    this.entries.set(id, { key, token });
  }
  prune(files) {
    for (const id of this.entries.keys()) if (!files.has(id)) this.entries.delete(id);
  }
}
