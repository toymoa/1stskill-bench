import { open } from './database.mjs';
import { accept, cancel } from './jobs.mjs';
import { claim, complete } from './leases.mjs';
export async function handle(input, services = {}) {
  const db = open(services.statePath || ':memory:');
  try {
    const results = [];
    for (const op of input.ops) {
      try {
        if (!['accept', 'cancel', 'claim', 'complete'].includes(op.type)) throw new Error('OP');
        results.push({ accept, cancel, claim, complete }[op.type](db, op));
      } catch (e) {
        results.push({ error: e.code || e.message });
      }
    }
    return {
      results,
      balance: db.prepare('SELECT COALESCE(sum(amount),0) n FROM ledger').get().n,
      ledger: db
        .prepare('SELECT id,amount FROM ledger ORDER BY id')
        .all()
        .map((x) => ({ ...x })),
      jobs: db
        .prepare('SELECT id,state,fence FROM jobs ORDER BY id')
        .all()
        .map((x) => ({ ...x })),
    };
  } finally {
    db.close();
  }
}
