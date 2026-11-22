import test from 'node:test';
import assert from 'node:assert/strict';
import { handle } from '../src/index.mjs';
test('public regression', async () => {
  assert.deepEqual(await handle({ actors: ['A'], commands: [] }), {
    results: [],
    nodes: [],
    dead: [],
    pending: [],
    snapshot: { base: { clock: 0, nodes: [], dead: [], covered: [] }, log: [] },
  });
});
