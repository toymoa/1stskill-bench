import test from 'node:test';
import assert from 'node:assert/strict';
import { handle } from '../src/index.mjs';
test('documented behavior', async () =>
  assert.deepEqual(
    await handle({
      limit: 1,
      scopes: [{ id: 's', parent: null }],
      operations: [
        {
          type: 'submit',
          task: { id: 'a', scope: 's', durations: [2], failures: 0, maxAttempts: 1, backoff: 0 },
        },
        { type: 'advance', to: 3 },
      ],
    }),
    {
      trace: [
        [0, 'a', 'start', 1],
        [2, 'a', 'done'],
      ],
      tasks: { a: { state: 'done', attempts: 1 } },
      active: 0,
      closed: false,
    },
  ));
