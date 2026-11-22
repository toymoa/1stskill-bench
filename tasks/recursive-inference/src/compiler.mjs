import { Types } from './types.mjs';
import { infer } from './infer.mjs';
import { order, signature } from './modules.mjs';
export class Compiler {
  constructor() {
    this.cache = new Map();
  }
  compile(modules) {
    let ordered;
    try {
      ordered = order(modules);
    } catch (e) {
      return { interfaces: {}, errors: [{ code: e.code }] };
    }
    const interfaces = {},
      exports = new Map(),
      errors = [];
    for (const id of ordered) {
      const m = modules[id],
        T = new Types(),
        env = new Map(),
        deps = [];
      let missing = false;
      for (const [alias, ref] of Object.entries(m.imports || {})) {
        const [owner, name] = ref.split(':'),
          s = exports.get(owner)?.get(name);
        deps.push([ref, interfaces[owner]?.[name] ?? null]);
        if (!s) {
          missing = true;
          break;
        }
        const type = T.instantiate(s);
        env.set(alias, T.generalize(new Map(), type));
      }
      if (missing) {
        errors.push({ module: id, code: 'IMPORT' });
        interfaces[id] = {};
        exports.set(id, new Map());
        continue;
      }
      const key = signature(m, deps),
        old = this.cache.get(id);
      if (old?.key === key) {
        interfaces[id] = old.display;
        exports.set(id, old.schemes);
        errors.push(...old.errors);
        continue;
      }
      const display = {},
        schemes = new Map(),
        ownErrors = [];
      for (const def of m.exports) {
        try {
          const type = infer(def.expr, env, T),
            s = T.generalize(env, type);
          schemes.set(def.name, s);
          env.set(def.name, s);
          display[def.name] = T.print(type);
        } catch (e) {
          ownErrors.push({ module: id, name: def.name, code: e.code || 'TYPE', at: e.at ?? 0 });
        }
      }
      interfaces[id] = display;
      exports.set(id, schemes);
      errors.push(...ownErrors);
      this.cache.set(id, { key, display, schemes, errors: ownErrors });
    }
    for (const id of this.cache.keys()) if (!modules[id]) this.cache.delete(id);
    return { interfaces, errors };
  }
}
