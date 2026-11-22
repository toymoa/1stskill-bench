export function value(v, row) {
  return v && typeof v === 'object' && 'field' in v ? (row[v.field] ?? null) : v;
}
export function evaluate(p, row) {
  if (!p) return true;
  const a = value(p.a, row),
    b = value(p.b, row);
  switch (p.op) {
    case 'eq':
      return a === null || b === null ? null : a === b;
    case 'ne':
      return a === null || b === null ? null : a !== b;
    case 'gt':
      return a === null || b === null ? null : a > b;
    case 'isNull':
      return a === null;
    case 'not': {
      const x = evaluate(p.arg, row);
      return x === null ? null : !x;
    }
    case 'and': {
      const x = evaluate(p.left, row),
        y = evaluate(p.right, row);
      return x === false || y === false ? false : x === null || y === null ? null : true;
    }
    case 'or': {
      const x = evaluate(p.left, row),
        y = evaluate(p.right, row);
      return x === true || y === true ? true : x === null || y === null ? null : false;
    }
    default:
      throw new Error('PREDICATE');
  }
}
export function fields(p) {
  if (!p || typeof p !== 'object') return [];
  return [...('field' in p ? [p.field] : []), ...Object.values(p).flatMap(fields)];
}
