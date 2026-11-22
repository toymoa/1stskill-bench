import { fields } from './predicate.mjs';
export function leftFilters(p) {
  if (!p) return [];
  if (p.op === 'and') return [...leftFilters(p.left), ...leftFilters(p.right)];
  return fields(p).every((f) => f.startsWith('l.')) ? [p] : [];
}
