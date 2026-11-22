import { Compiler } from './compiler.mjs';
export async function handle(input) {
  const modules = structuredClone(input.modules),
    compiler = new Compiler(),
    builds = [compiler.compile(modules)];
  for (const edit of input.edits) {
    if (edit.value === null) delete modules[edit.id];
    else modules[edit.id] = edit.value;
    builds.push(compiler.compile(modules));
  }
  return builds;
}
