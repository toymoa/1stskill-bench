import test from 'node:test';
import assert from 'node:assert/strict';
import { handle } from '../src/index.mjs';
test('public regression', async () => {
  assert.deepEqual(await handle({ maxFrame: 64, capacity: 2, operations: [{ type: 'end' }] }), {
    delivered: [],
    events: ['END'],
    buffered: 0,
    terminal: true,
  });
});
