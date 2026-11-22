import { solve, rootsOf } from './solver.mjs';
export async function handle(input) {
  const roots = rootsOf(input),
    result = solve(input, roots);
  if (result) return result;
  let core = [...roots];
  for (const r of roots) {
    const next = core.filter((x) => x !== r);
    if (!solve(input, next)) core = next;
  }
  return { error: 'UNSAT', conflicts: core.map((r) => r.scope + ':' + r.name + '@' + r.range) };
}
