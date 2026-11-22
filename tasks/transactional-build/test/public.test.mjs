import test from 'node:test';
import assert from 'node:assert/strict';
import { handle } from '../src/index.mjs';
test('public regression', async () => {
  assert.deepEqual(await handle({ files: [], edits: [] }), [{ artifacts: {}, compiled: [] }]);
});
