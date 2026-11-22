import test from 'node:test';
import assert from 'node:assert/strict';
import { handle } from '../src/index.mjs';
test('documented behavior', async () =>
  assert.deepEqual(
    await handle({
      files: { 'a.ts': 'const item=1;' },
      operations: [{ type: 'rename', file: 'a.ts', position: 6, newName: 'next' }],
    }),
    { files: { 'a.ts': 'const next=1;' }, results: [{ changed: ['a.ts'] }] },
  ));
