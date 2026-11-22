import test from 'node:test';
import assert from 'node:assert/strict';
import { handle } from '../src/index.mjs';
test('documented behavior', async () =>
  assert.deepEqual(
    await handle({
      users: [{ id: 'u', tenant: 't', role: 'viewer', active: true }],
      documents: [{ id: 'd', tenant: 't', owner: 'u', shares: [], value: 'ok' }],
      operations: [
        { type: 'begin', request: 'r', user: 'u', tenant: 't', ids: ['d'] },
        { type: 'finish', request: 'r' },
      ],
    }),
    {
      results: [{ request: 'r' }, [{ id: 'd', tenant: 't', value: 'ok' }]],
      documents: [{ id: 'd', tenant: 't', owner: 'u', shares: [], value: 'ok' }],
    },
  ));
