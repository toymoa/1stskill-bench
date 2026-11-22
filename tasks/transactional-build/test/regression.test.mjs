import test from 'node:test';
import assert from 'node:assert/strict';
import { handle } from '../src/index.mjs';
test('documented behavior', async () =>
  assert.deepEqual(await handle({ files: [{ id: 'a', source: 'x', deps: [] }], edits: [] }), [
    { artifacts: { a: '["x",[]]' }, compiled: ['a'] },
  ]));
