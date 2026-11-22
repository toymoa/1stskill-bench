import { Project } from './project.mjs';
import { rename } from './rename.mjs';
export async function handle(input) {
  const project = new Project(input.files),
    results = [];
  try {
    for (const op of input.operations) {
      if (op.type === 'set') {
        project.set(op.file, op.text);
        results.push({ updated: op.file });
      } else {
        try {
          results.push({ changed: rename(project, op) });
        } catch (e) {
          results.push({ error: e.message });
        }
      }
    }
    return { files: project.output(), results };
  } finally {
    project.service.dispose();
  }
}
