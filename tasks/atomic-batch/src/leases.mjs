import { transaction, error } from './database.mjs';
export function claim(db, { id, owner, now, ttl }) {
  return transaction(db, () => {
    const j = db.prepare('SELECT * FROM jobs WHERE id=?').get(id);
    if (!j) throw error('MISSING');
    if (['done', 'cancelled'].includes(j.state)) throw error('TERMINAL');
    if (j.state === 'running' && j.expires > now) throw error('BUSY');
    const fence = j.fence + 1;
    db.prepare("UPDATE jobs SET state='running',owner=?,expires=?,fence=? WHERE id=?").run(
      owner,
      now + ttl,
      fence,
      id,
    );
    return { id, fence };
  });
}
export function complete(db, { id, owner, fence, now, crash }) {
  return transaction(db, () => {
    const j = db.prepare('SELECT * FROM jobs WHERE id=?').get(id);
    if (!j) throw error('MISSING');
    if (j.state === 'done') return { id, state: 'done' };
    if (j.state !== 'running' || j.owner !== owner || j.fence !== fence || j.expires <= now)
      throw error('STALE');
    db.prepare('INSERT INTO ledger(id,amount) VALUES (?,?)').run(id, j.amount);
    if (crash === 'after-effect') process.kill(process.pid, 'SIGKILL');
    db.prepare("UPDATE jobs SET state='done',owner=NULL,expires=NULL WHERE id=?").run(id);
    return { id, state: 'done' };
  });
}
