import { opendirSync, lstatSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { createHash } from 'node:crypto';
export const hash = (value) => createHash('sha256').update(value).digest('hex');
const sourceAllowed = (name) => /^src\/(?:[A-Za-z0-9_-]+\/)*[A-Za-z0-9_-]+\.mjs$/.test(name);
const allowed = (name, task) => sourceAllowed(name) || task.allowedArtifacts?.includes(name);
export function tree(root) {
  const files = new Map();
  let total = 0,
    entries = 0;
  function walk(dir, prefix = '') {
    const directory = opendirSync(dir);
    try {
      for (let entry; (entry = directory.readSync());) {
        if (++entries > 1000 || prefix.split('/').length > 16)
          throw new Error('Artifact tree limit');
        const name = prefix + entry.name,
          path = join(dir, entry.name),
          stat = lstatSync(path);
        if (name.length > 200) throw new Error('Artifact path limit');
        if (stat.isSymbolicLink() || (!stat.isFile() && !stat.isDirectory()))
          throw new Error('Non-regular artifact');
        if (stat.isDirectory()) walk(path, name + '/');
        else {
          if (
            stat.nlink !== 1 ||
            stat.size > 262144 ||
            (total += stat.size) > 2097152 ||
            files.size >= 100
          )
            throw new Error('Artifact limit');
          files.set(name, readFileSync(path));
        }
      }
    } finally {
      directory.closeSync();
    }
  }
  walk(root);
  return new Map([...files].sort(([a], [b]) => a.localeCompare(b)));
}
export function treeHash(files) {
  return hash(JSON.stringify([...files].map(([name, content]) => [name, hash(content)])));
}
export function stageRepository(task, destination) {
  const files = tree(task.root);
  mkdirSync(destination, { recursive: true });
  for (const [name, content] of files) {
    const p = join(destination, name);
    mkdirSync(dirname(p), { recursive: true });
    writeFileSync(p, content, { flag: 'wx' });
  }
  return { baseTreeHash: treeHash(files), fileCount: files.size };
}
export function extractPatch(task, workspace) {
  const base = tree(task.root),
    current = tree(workspace),
    patch = [];
  for (const name of new Set([...base.keys(), ...current.keys()])) {
    const old = base.get(name),
      next = current.get(name);
    if (old && next && old.equals(next)) continue;
    if (!allowed(name, task)) throw new Error('Protected path changed: ' + name);
    if (!next) throw new Error('Source deletion is not allowed');
    const text = new TextDecoder('utf-8', { fatal: true }).decode(next);
    if (text.includes('\0')) throw new Error('Binary source');
    patch.push({ name, content: text });
  }
  return { baseTreeHash: treeHash(base), files: patch };
}
export function applyPatch(task, artifact, destination) {
  if (artifact.baseTreeHash !== treeHash(tree(task.root)))
    throw new Error('Base snapshot mismatch');
  if (!Array.isArray(artifact.files) || artifact.files.length > 100) throw new Error('Patch limit');
  const seen = new Set();
  let total = 0;
  for (const f of artifact.files) {
    if (
      !allowed(f.name, task) ||
      seen.has(f.name) ||
      typeof f.content !== 'string' ||
      f.content.includes('\0') ||
      Buffer.byteLength(f.content) > 262144 ||
      (total += Buffer.byteLength(f.content)) > 2097152
    )
      throw new Error('Invalid patch');
    seen.add(f.name);
  }
  stageRepository(task, destination);
  for (const f of artifact.files) {
    const p = join(destination, f.name);
    mkdirSync(dirname(p), { recursive: true });
    writeFileSync(p, f.content);
  }
}
