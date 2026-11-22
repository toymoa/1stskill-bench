export function infer(expr, env, T) {
  try {
    switch (expr.kind) {
      case 'number':
        return 'number';
      case 'boolean':
        return 'boolean';
      case 'var': {
        const s = env.get(expr.name);
        if (!s) throw Object.assign(new Error('NAME'), { code: 'NAME' });
        return T.instantiate(s);
      }
      case 'lambda': {
        const arg = T.fresh(),
          inner = new Map(env);
        inner.set(expr.param, { vars: [], type: arg });
        return { tag: 'fn', a: arg, b: infer(expr.body, inner, T) };
      }
      case 'apply': {
        const f = infer(expr.fn, env, T),
          arg = infer(expr.arg, env, T),
          result = T.fresh();
        T.unify(f, { tag: 'fn', a: arg, b: result });
        return T.apply(result);
      }
      case 'let': {
        const value = infer(expr.value, env, T),
          inner = new Map(env);
        inner.set(expr.name, T.generalize(env, value));
        return infer(expr.body, inner, T);
      }
      case 'pair':
        return { tag: 'pair', a: infer(expr.left, env, T), b: infer(expr.right, env, T) };
      case 'if': {
        T.unify(infer(expr.condition, env, T), 'boolean');
        const a = infer(expr.then, env, T),
          b = infer(expr.else, env, T);
        T.unify(a, b);
        return T.apply(a);
      }
      case 'add':
        T.unify(infer(expr.left, env, T), 'number');
        T.unify(infer(expr.right, env, T), 'number');
        return 'number';
      default:
        throw Object.assign(new Error('SYNTAX'), { code: 'SYNTAX' });
    }
  } catch (e) {
    if (e.at === undefined) e.at = expr.at ?? 0;
    throw e;
  }
}
