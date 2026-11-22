import test from 'node:test';
import assert from 'node:assert/strict';
import { handle } from '../src/index.mjs';
test('documented behavior', async () =>
  assert.deepEqual(
    await handle({
      ops: [
        { type: 'accept', id: 'a', amount: 4 },
        { type: 'claim', id: 'a', owner: 'w', now: 0, ttl: 10 },
        { type: 'complete', id: 'a', owner: 'w', fence: 1, now: 1 },
      ],
    }),
    {
      results: [
        { id: 'a', state: 'queued' },
        { id: 'a', fence: 1 },
        { id: 'a', state: 'done' },
      ],
      balance: 4,
      ledger: [{ id: 'a', amount: 4 }],
      jobs: [{ id: 'a', state: 'done', fence: 1 }],
    },
  ));
