import { evaluate } from './predicate.mjs';
import { leftFilters } from './optimizer.mjs';
import { join } from './join.mjs';
export async function handle(input, services = {}) {
  const filters = leftFilters(input.where),
    left = input.left.filter((l) =>
      filters.every(
        (p) =>
          evaluate(p, Object.fromEntries(Object.entries(l).map(([k, v]) => ['l.' + k, v]))) ===
          true,
      ),
    );
  const keys = [
    ...new Set(left.map((l) => l[input.on[0]]).filter((k) => k !== null && k !== undefined)),
  ];
  const right = keys.length
    ? await (
        services.scan || (({ keys }) => input.right.filter((r) => keys.includes(r[input.on[1]])))
      )({ keys })
    : [];
  let rows = join(left, right, input.on, input.rightColumns).filter(
    (r) => evaluate(input.where, r) === true,
  );
  rows = rows
    .map((row, index) => ({ row, index }))
    .sort((a, b) => {
      for (const { field, desc = false } of input.orderBy || []) {
        const x = a.row[field],
          y = b.row[field];
        const c = x === y ? 0 : x === null ? -1 : y === null ? 1 : x < y ? -1 : 1;
        if (c) return desc ? -c : c;
      }
      return a.index - b.index;
    })
    .map((x) => x.row);
  return rows.slice(
    input.offset || 0,
    input.limit === undefined ? undefined : (input.offset || 0) + input.limit,
  );
}
