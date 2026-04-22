import { describe, it, expect, afterEach } from 'vitest';
import { getDb, closeDb } from './init.js';

describe('db/init', () => {
  afterEach(() => {
    closeDb();
  });

  it('creates the todos table on startup', () => {
    const db = getDb();
    const table = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='todos'"
    ).get() as { name: string } | undefined;
    expect(table?.name).toBe('todos');
  });

  it('calling getDb twice does not error (idempotent)', () => {
    const db1 = getDb();
    const db2 = getDb();
    expect(db1).toBe(db2);
  });

  it('todos table has correct columns', () => {
    const db = getDb();
    const columns = db.prepare("PRAGMA table_info('todos')").all() as Array<{ name: string }>;
    const columnNames = columns.map((c) => c.name);
    expect(columnNames).toContain('id');
    expect(columnNames).toContain('text');
    expect(columnNames).toContain('completed');
    expect(columnNames).toContain('created_at');
  });
});
