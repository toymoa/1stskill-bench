import test from 'node:test';
import assert from 'node:assert/strict';
import { handle } from '../src/index.mjs';
test('documented behavior', async () =>
  assert.deepEqual(
    await handle({
      maxFrame: 32,
      capacity: 2,
      operations: [{ type: 'push', hex: '0000000131' }, { type: 'end' }],
    }),
    { delivered: [1], events: ['ACCEPTED', 'END'], buffered: 0, terminal: true },
  ));
