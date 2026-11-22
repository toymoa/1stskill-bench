import test from 'node:test';
import assert from 'node:assert/strict';
import { handle } from '../src/index.mjs';
test('documented behavior', async () =>
  assert.deepEqual(
    await handle({
      platform: 'linux',
      catalog: { a: [{ version: '1.0.0' }] },
      scopes: [{ id: 's', parent: null, dependencies: { a: '*' } }],
      lock: {},
    }),
    { plan: { 's:a': '1.0.0' }, changed: 1 },
  ));
