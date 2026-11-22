export const parts = (v) => v.split('.').map(Number);
export function compare(a, b) {
  const x = parts(a),
    y = parts(b);
  return x[0] - y[0] || x[1] - y[1] || x[2] - y[2];
}
export function satisfies(v, r) {
  if (r === '*') return true;
  if (r.startsWith('^')) {
    const a = parts(v),
      b = parts(r.slice(1));
    return (
      compare(v, r.slice(1)) >= 0 &&
      (b[0] > 0 ? a[0] === b[0] : b[1] > 0 ? a[0] === 0 && a[1] === b[1] : v === r.slice(1))
    );
  }
  if (r.startsWith('>=')) return compare(v, r.slice(2)) >= 0;
  return v === r;
}
