import { createHash } from 'node:crypto';
// Mirrors digest in 1stskill src/lib/identity.js and skillInstructionHash in
// 1stskill src/domain/validation.js.
export const digest = (value) => createHash('sha256').update(value).digest('hex');
export function skillInstructionHash(files) {
  const instructions = files
    .filter((f) => !/^LICEN[SC]E(?:\.(?:txt|md))?$/i.test(f.name.split('/').at(-1)))
    .map(({ name, content }) => ({ name, content }))
    .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  return digest(JSON.stringify(instructions));
}
