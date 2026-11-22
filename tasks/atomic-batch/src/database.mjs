import { DatabaseSync } from 'node:sqlite';
export function open(path) {
  const db = new DatabaseSync(path);
  db.exec(
    `PRAGMA busy_timeout=1000; CREATE TABLE IF NOT EXISTS jobs(id TEXT PRIMARY KEY,amount INTEGER NOT NULL,state TEXT NOT NULL,owner TEXT,fence INTEGER NOT NULL DEFAULT 0,expires INTEGER);CREATE TABLE IF NOT EXISTS ledger(id TEXT PRIMARY KEY,amount INTEGER NOT NULL);`,
  );
  return db;
}
export function transaction(db, fn) {
  db.exec('BEGIN IMMEDIATE');
  try {
    const value = fn();
    db.exec('COMMIT');
    return value;
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }
}
export const error = (code) => Object.assign(new Error(code), { code });
