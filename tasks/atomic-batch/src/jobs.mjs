import { transaction, error } from './database.mjs';
export function accept(db, { id, amount }) {
  return transaction(db, () => {
    const old = db.prepare('SELECT * FROM jobs WHERE id=?').get(id);
    if (old) {
      if (old.amount !== amount) throw error('CONFLICT');
      return { id, state: old.state };
    }
    db.prepare("INSERT INTO jobs(id,amount,state) VALUES (?,?,'queued')").run(id, amount);
    return { id, state: 'queued' };
  });
}
export function cancel(db, { id }) {
  return transaction(db, () => {
    const j = db.prepare('SELECT state FROM jobs WHERE id=?').get(id);
    if (!j) throw error('MISSING');
    if (j.state === 'done') throw error('TERMINAL');
    db.prepare("UPDATE jobs SET state='cancelled',owner=NULL,expires=NULL WHERE id=?").run(id);
    return { id, state: 'cancelled' };
  });
}
