export function join(left, right, on, rightColumns) {
  const out = [];
  for (const l of left) {
    const matches = right.filter(
      (r) =>
        l[on[0]] !== null &&
        l[on[0]] !== undefined &&
        r[on[1]] !== null &&
        r[on[1]] !== undefined &&
        l[on[0]] === r[on[1]],
    );
    for (const r of matches.length
      ? matches
      : [Object.fromEntries(rightColumns.map((k) => [k, null]))])
      out.push({
        ...Object.fromEntries(Object.entries(l).map(([k, v]) => ['l.' + k, v])),
        ...Object.fromEntries(Object.entries(r).map(([k, v]) => ['r.' + k, v])),
      });
  }
  return out;
}
