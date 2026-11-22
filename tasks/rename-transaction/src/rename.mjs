import { applyEdits } from './edits.mjs';
export function rename(project, { file, position, newName }) {
  if (!/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(newName)) throw new Error('NAME');
  const full = '/project/' + file,
    info = project.service.getRenameInfo(full, position, { allowRenameOfImportPath: false });
  if (!info.canRename) throw new Error('SYMBOL');
  const locations = project.service.findRenameLocations(full, position, false, false, true) || [],
    grouped = new Map();
  for (const loc of locations) {
    if (!project.files.has(loc.fileName)) continue;
    const list = grouped.get(loc.fileName) || [];
    list.push(loc);
    grouped.set(loc.fileName, list);
  }
  const changed = [];
  for (const [name, list] of grouped) {
    const text = applyEdits(project.files.get(name).text, list, newName);
    changed.push([name.slice('/project/'.length), text]);
  }
  for (const [name, text] of changed) project.set(name, text);
  return [...grouped.keys()].map((n) => n.slice('/project/'.length)).sort();
}
