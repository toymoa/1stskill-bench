import test from 'node:test';
import assert from 'node:assert/strict';
import { handle } from '../src/index.mjs';
test('documented behavior', async () =>
  assert.deepEqual(
    await handle({
      left: [{ id: 1 }],
      right: [{ id: 1, value: 'x' }],
      on: ['id', 'id'],
      rightColumns: ['id', 'value'],
    }),
    [{ 'l.id': 1, 'r.id': 1, 'r.value': 'x' }],
  ));
