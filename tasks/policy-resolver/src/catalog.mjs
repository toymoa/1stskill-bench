import { compare, satisfies } from './ranges.mjs';
export function candidates(catalog, name, ranges, platform) {
  return (catalog[name] || [])
    .filter(
      (p) =>
        (!p.platforms || p.platforms.includes(platform)) &&
        ranges.every((r) => satisfies(p.version, r)),
    )
    .sort((a, b) => compare(b.version, a.version));
}
