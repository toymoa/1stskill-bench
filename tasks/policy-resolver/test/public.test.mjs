import test from 'node:test';
import assert from 'node:assert/strict';
import { handle } from '../src/index.mjs';
test('public regression', async () => {
  assert.deepEqual(await handle({ catalog: {}, scopes: [], platform: 'linux', lock: {} }), {
    plan: {},
    changed: 0,
  });
});
