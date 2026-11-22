import { fileURLToPath } from 'node:url';
// Task ids and prompts copied from 1stskill benchmarks/suite.js (suiteVersion
// 'arena-coding-v3') and benchmarks/skill-lift-v1/catalog.mjs. Task directories
// are vendored unchanged from benchmarks/skill-lift-v1/tasks/.
export const suiteVersion = 'arena-coding-v3';
export const tasks = [
  'atomic-batch',
  'transactional-build',
  'rename-transaction',
  'multiplex-channel',
  'weighted-scope',
  'policy-resolver',
  'aggregate-planner',
  'recursive-inference',
  'versioned-transactions',
  'compressed-replica',
].map((id) => ({
  id,
  // Same string as 1stskill benchmarks/suite.js:17.
  prompt: `Task ID: ${id}. Implement TASK.md while preserving BASE-CONTRACT.md. Modify src/ and submit regression-scenarios.json. Do not change existing tests, documents or configuration.`,
  root: fileURLToPath(new URL('../tasks/' + id + '/', import.meta.url)),
  allowedArtifacts: ['regression-scenarios.json'],
}));
