import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
export const ts = require(process.env.TASK_TYPESCRIPT || '/opt/typescript/lib/typescript.js');
