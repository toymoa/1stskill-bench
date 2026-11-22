import test from 'node:test';
import assert from 'node:assert/strict';
import { handle } from '../src/index.mjs';
test('documented behavior', async () =>
  assert.deepEqual(
    await handle({
      modules: { m: { exports: [{ name: 'answer', expr: { kind: 'number', value: 42 } }] } },
      edits: [],
    }),
    [{ interfaces: { m: { answer: 'number' } }, errors: [] }],
  ));
