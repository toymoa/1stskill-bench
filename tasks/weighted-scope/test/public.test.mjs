import test from 'node:test';
import assert from 'node:assert/strict';
import { handle } from '../src/index.mjs';
test('public regression', async () => {
  assert.deepEqual(
    await handle({ limit: 1, scopes: [{ id: 'root', parent: null }], operations: [] }),
    { trace: [], tasks: {}, active: 0, closed: false },
  );
});
