import { order } from './graph.mjs';
import { Cache, cacheKey } from './cache.mjs';
import { edit } from './workspace.mjs';
export async function handle(input, services = {}) {
  const files = new Map(input.files.map((f) => [f.id, { ...f, deps: [...f.deps] }])),
    cache = new Cache(),
    builds = [];
  const compile = services.compile || (({ source, deps }) => JSON.stringify([source, deps]));
  async function build(step) {
    try {
      cache.prune(files);
      const sorted = order(files),
        tokens = new Map(),
        compiled = [];
      for (const id of sorted) {
        const file = files.get(id),
          deps = file.deps.map((d) => tokens.get(d)),
          key = cacheKey(file, deps);
        let token = cache.get(id, key);
        if (token === null) {
          token = await compile({ step, id, source: file.source, deps });
          cache.set(id, key, token);
          compiled.push(id);
        }
        tokens.set(id, token);
      }
      builds.push({
        artifacts: Object.fromEntries([...tokens].sort(([a], [b]) => a.localeCompare(b))),
        compiled,
      });
    } catch (e) {
      builds.push({ error: e.message });
    }
  }
  await build(0);
  for (let i = 0; i < input.edits.length; i++) {
    edit(files, input.edits[i]);
    await build(i + 1);
  }
  return builds;
}
